"""Compare the old (synthetic-only) listing-range model with one retrained on real IPOs, on the same real rows.

  python -m ipo_decide.evaluate_real      # run after real rows are in data/ipo_history.csv

Test rows = the newest 20% of real IPOs (the same out-of-time split train() uses). The old model never saw
any real IPO, so it is scored on exactly those rows too. Then the model is retrained and saved as usual;
the old file is kept as models/listing_model_synthetic.joblib.

Beyond interval score / coverage, it reports F1 for "listing gain > 0" (the median prediction's sign),
the closest classification view of a range model.
"""
import json
import shutil

import joblib
import numpy as np
from sklearn.metrics import f1_score, precision_score, recall_score

from ipo_decide import listing

OLD_COPY = listing.MODEL_PATH.parent / "listing_model_synthetic.joblib"
REPORT = listing.HERE / "data" / "eval_listing.md"
METRICS = listing.HERE / "data" / "eval_listing.json"


def _sign_scores(med, y):
    pred, true = (med > 0).astype(int), (y > 0).astype(int)
    return {"precision": round(float(precision_score(true, pred, zero_division=0)), 3),
            "recall": round(float(recall_score(true, pred, zero_division=0)), 3),
            "f1": round(float(f1_score(true, pred, zero_division=0)), 3)}


def _score(lo, med, hi, y):
    return {**listing.metrics(lo, med, hi, y), "gain_positive": _sign_scores(med, y)}


def run():
    if listing.MODEL_PATH.exists() and not OLD_COPY.exists():
        shutil.copy(listing.MODEL_PATH, OLD_COPY)
    old = joblib.load(OLD_COPY)

    rows, real, _ = listing._dataset()
    train_, calib, test = listing._split(rows, (0.6, 0.2, 0.2))
    test_real = [r for r in test if not r["synthetic"]]
    if len(test_real) < 5:
        raise SystemExit(f"Only {len(test_real)} real test rows; add more real IPOs first.")
    X, y, _ = listing._matrix(test_real)

    out = {"n_real": len(real), "n_real_test": len(test_real), "old": {}, "new": {}}
    for name in listing.FIT:
        lo, med, hi = listing.PREDICT[name](old["final"][name], X)
        out["old"][name] = _score(lo, med, hi, y)
        m = listing.FIT[name](train_, calib)
        lo, med, hi = listing.PREDICT[name](m, X)
        out["new"][name] = _score(lo, med, hi, y)
    out["old_chosen"] = old["chosen"]

    card = listing.train(quiet=True)   # retrain on everything and save, as the app does
    out["new_chosen"] = card["chosen"]
    METRICS.write_text(json.dumps(out, indent=2), encoding="utf-8")
    REPORT.write_text(_markdown(out), encoding="utf-8")
    print(json.dumps(out, indent=2))
    print(f"wrote {REPORT}")


def _markdown(o):
    lines = ["# Listing-gain range: old vs retrained, on real IPOs", "",
             f"Real IPOs: {o['n_real']}. Scored on the newest {o['n_real_test']} (out of time). 80% range.", "",
             "Lower interval score is better; coverage should be near 0.80. F1 is for 'listing gain > 0'.", "",
             "| Method | Model | Coverage | Avg width | Interval score | MAE (median) | F1 gain>0 |",
             "|---|---|---|---|---|---|---|"]
    for name in o["new"]:
        for which in ("old", "new"):
            s = o[which][name]
            tag = "synthetic-only" if which == "old" else "retrained on real"
            lines.append(f"| {listing.LABELS[name]} | {tag} | {s['coverage']} | {s['avg_width']} | "
                         f"{s['interval_score']} | {s['mae_median']} | {s['gain_positive']['f1']} |")
    lines += ["", f"Served before: {listing.LABELS[o['old_chosen']]}. Served now: {listing.LABELS[o['new_chosen']]}.", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    run()
