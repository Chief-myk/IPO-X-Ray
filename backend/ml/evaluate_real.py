"""Train on the real labelled IPOs and compare against the current (synthetic-trained) risk model.

  python -m ml.build_real_dataset --csv     # writes ml/data/real_ipos.csv
  python -m ml.evaluate_real                 # writes ml/data/eval_report.md and ml/data/eval_metrics.json

Two evaluations, because the dataset is tiny:
  1. Time split: oldest 70% train, newest 30% test. Honest about the future, but the test set is ~8 rows.
  2. Repeated stratified 5-fold CV on all rows: less noisy, but folds are random, not time-ordered.

Models compared on the same rows:
  current      the deployed risk model (ml/models/risk_model.joblib, trained on synthetic data only)
  real_gb      gradient boosting on real rows only (what retraining would produce)
  real_logreg  logistic regression on real rows only (simple baseline)
  all_clean    always predicts 0 (what accuracy-only thinking gives on rare fraud)

The retrained model is saved as ml/models/risk_model_real.joblib. The deployed model is NOT replaced here.
"""
import csv
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from ml.features import FEATURES
from ml.model import MODEL_PATH as CURRENT_PATH, RiskModel
from ml.synth_real import generate

HERE = Path(__file__).resolve().parent
DATA = HERE / "data" / "real_ipos.csv"
REPORT = HERE / "data" / "eval_report.md"
METRICS = HERE / "data" / "eval_metrics.json"
REAL_MODEL = HERE / "models" / "risk_model_real.joblib"
MIXED_CSV = HERE.parent.parent / "datasets" / "risk_train_real_plus_synthetic.csv"
THRESHOLD = 0.5
# Agents search today, so for a positive they find the very SEBI order / complaints / cases that made it a
# positive. These features restate the label instead of predicting it; every model here is evaluated without them.
LEAKY = {"company_sebi_orders", "director_sebi_orders", "complaints_count", "company_court_cases"}
USED = [f for f in FEATURES if f not in LEAKY]


SYNTH_N = 400        # synthetic rows added per fit
SYNTH_REAL_WEIGHT = 5.0


class WithSynth:
    """Fits `make()` on the real rows it is given plus synthetic rows generated from those same rows only,
    so in cross-validation the held-out fold never shapes the synthetic data."""

    def __init__(self, make):
        self.make = make

    def fit(self, X, y):
        Xs, ys = generate(X, y, n=SYNTH_N, seed=len(y), features=USED)
        self.m = self.make()
        last = self.m.steps[-1][0]
        w = np.concatenate([np.full(len(y), SYNTH_REAL_WEIGHT), np.ones(len(ys))])
        self.m.fit(np.vstack([X, Xs]), np.concatenate([y, ys]), **{f"{last}__sample_weight": w})
        self.make = None   # a fitted wrapper needs only self.m; the factory may be a lambda, which cannot be saved
        return self

    def predict_proba(self, X):
        return self.m.predict_proba(X)


def _gb():
    return make_pipeline(SimpleImputer(strategy="median"),
                         HistGradientBoostingClassifier(max_iter=100, learning_rate=0.05, max_leaf_nodes=7,
                                                        min_samples_leaf=3, l2_regularization=1.0, random_state=7))


def _logreg():
    return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                         LogisticRegression(class_weight="balanced", C=0.5, max_iter=1000))


def _logreg_ind():
    # add_indicator: "not disclosed" (e.g. no employee count in the offer document) becomes its own input
    return make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler(),
                         LogisticRegression(class_weight="balanced", C=0.5, max_iter=1000))


class TunedThreshold:
    """Picks the F1-best threshold from 3-fold out-of-fold predictions on the rows it is fitted on (never on the
    rows it is later scored on), then rescales probabilities so that threshold sits at 0.5. The rescaling is
    monotonic, so PR-AUC is unchanged; only which side of 0.5 a company falls on moves."""

    def __init__(self, make):
        self.make = make

    def fit(self, X, y):
        oof = np.zeros(len(y))
        k = max(2, min(3, int(y.sum()), int((1 - y).sum())))
        for tr, te in StratifiedKFold(n_splits=k, shuffle=True, random_state=1).split(X, y):
            oof[te] = self.make().fit(X[tr], y[tr]).predict_proba(X[te])[:, 1]
        grid = np.unique(np.clip(oof, 0.01, 0.99))
        self.t = max(grid, key=lambda t: (f1_score(y, (oof >= t).astype(int), zero_division=0), -abs(t - 0.5)))
        self.m = self.make().fit(X, y)
        self.make = None
        return self

    def predict_proba(self, X):
        p, t = self.m.predict_proba(X)[:, 1], self.t
        q = np.where(p < t, 0.5 * p / t, 0.5 + 0.5 * (p - t) / (1 - t))
        return np.column_stack([1 - q, q])


def _models():
    return {
        "real_gb": _gb,
        "real_logreg": _logreg,
        "mix_gb": lambda: WithSynth(_gb),
        "mix_logreg": lambda: WithSynth(_logreg),
        "mix_logreg_ind": lambda: WithSynth(_logreg_ind),
        "mix_logreg_ind_tuned": lambda: TunedThreshold(lambda: WithSynth(_logreg_ind)),
    }


LABELS = {"real_gb": "Gradient boosting, real only", "real_logreg": "Logistic regression, real only",
          "mix_gb": "Gradient boosting, real + synthetic", "mix_logreg": "Logistic regression, real + synthetic",
          "mix_logreg_ind": "Logistic regression, real + synthetic, missing-value flags",
          "mix_logreg_ind_tuned": "Same, threshold tuned inside the training rows"}


def _scores(y, p):
    pred = (p >= THRESHOLD).astype(int)
    return {
        "precision": round(float(precision_score(y, pred, zero_division=0)), 3),
        "recall": round(float(recall_score(y, pred, zero_division=0)), 3),
        "f1": round(float(f1_score(y, pred, zero_division=0)), 3),
        "pr_auc": round(float(average_precision_score(y, p)), 3) if y.sum() else None,
        "roc_auc": round(float(roc_auc_score(y, p)), 3) if len(set(y)) == 2 else None,
    }


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return np.nan


def _load():
    with open(DATA, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _current_probs(rows):
    model = RiskModel(joblib.load(CURRENT_PATH))
    out = []
    for r in rows:
        feats = {f: _num(r[f]) for f in USED}
        feats = {k: v for k, v in feats.items() if not np.isnan(v)}
        res = model.predict(feats)
        out.append(res["probability"] if res["probability"] is not None else 0.0)
    return np.array(out)


def time_split(rows):
    rows = sorted(rows, key=lambda r: r["listing_or_order_date"] or "")
    cut = int(len(rows) * 0.7)
    return rows[:cut], rows[cut:]


def run():
    rows = _load()
    X = np.array([[_num(r[f]) for f in USED] for r in rows], float)
    y = np.array([int(r["label"]) for r in rows], int)

    metrics = {"n_rows": int(len(rows)), "n_positive": int(y.sum()), "threshold": THRESHOLD,
               "excluded_leaky_features": sorted(LEAKY), "time_split": {}, "cv": {}}

    # 1) time split
    tr, te = time_split(rows)
    Xtr, ytr = np.array([[_num(r[f]) for f in USED] for r in tr], float), np.array([int(r["label"]) for r in tr], int)
    Xte, yte = np.array([[_num(r[f]) for f in USED] for r in te], float), np.array([int(r["label"]) for r in te], int)
    metrics["time_split"]["test_rows"] = int(len(te))
    metrics["time_split"]["test_positives"] = int(yte.sum())
    metrics["time_split"]["current"] = _scores(yte, _current_probs(te))
    for name, make in _models().items():
        m = make().fit(Xtr, ytr)
        metrics["time_split"][name] = _scores(yte, m.predict_proba(Xte)[:, 1])
    metrics["time_split"]["all_clean"] = _scores(yte, np.zeros(len(yte)))
    # The current model never saw any of these rows, so every row is a fair test row for it.
    metrics["current_all_rows"] = _scores(y, _current_probs(rows))

    # 2) repeated stratified CV on all rows
    skf_runs = []
    for seed in range(5):
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        per_model = {name: np.zeros(len(y)) for name in _models()}
        for tr_i, te_i in skf.split(X, y):
            for name, make in _models().items():
                per_model[name][te_i] = make().fit(X[tr_i], y[tr_i]).predict_proba(X[te_i])[:, 1]
        skf_runs.append({name: _scores(y, p) for name, p in per_model.items()})
    for name in _models():
        cols = {k: [run[name][k] for run in skf_runs if run[name][k] is not None] for k in ["precision", "recall", "f1", "pr_auc"]}
        metrics["cv"][name] = {k: {"mean": round(float(np.mean(v)), 3), "std": round(float(np.std(v)), 3)} for k, v in cols.items()}

    # 3) best model by CV F1, refit on all real rows (plus synthetic if it is a mix model), saved separately
    best = max(metrics["cv"], key=lambda k: metrics["cv"][k]["f1"]["mean"])
    metrics["saved_model"] = best
    final = _models()[best]().fit(X, y)
    joblib.dump({"model": final, "name": best, "features": USED, "n_rows": int(len(y)), "n_positive": int(y.sum())},
                REAL_MODEL)

    # 4) the training table judges can inspect: real rows, then synthetic rows made from them, each marked
    Xs, ys = generate(X, y, n=SYNTH_N, seed=len(y), features=USED)
    with open(MIXED_CSV, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["company", "label", "synthetic", "source_url", *USED])
        for r, x, lab in zip(rows, X, y):
            w.writerow([r["company"], lab, 0, r.get("source_url", ""), *["" if np.isnan(v) else round(v, 4) for v in x]])
        for i, (x, lab) in enumerate(zip(Xs, ys)):
            w.writerow([f"synthetic_{i + 1}", lab, 1, "generated by ml/synth_real.py from the real rows",
                        *["" if np.isnan(v) else round(v, 4) for v in x]])

    METRICS.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    REPORT.write_text(_markdown(metrics), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    print(f"wrote {REPORT}")


def _markdown(m):
    t = m["time_split"]
    lines = [
        "# Risk model: real-data evaluation", "",
        f"Rows: {m['n_rows']} ({m['n_positive']} positive). Threshold {m['threshold']}.", "",
        "Excluded as label leakage (agents find the post-IPO regulator action itself): "
        + ", ".join(m["excluded_leaky_features"]) + ".", "",
        "## Time split (oldest 70% train, newest 30% test)", "",
        f"Test rows: {t['test_rows']} ({t['test_positives']} positive). Small: treat numbers as indicative.", "",
        "| Model | Precision | Recall | F1 | PR-AUC | ROC-AUC |", "|---|---|---|---|---|---|",
    ]
    for k, label in [("current", "Current (synthetic-trained)"), *LABELS.items(), ("all_clean", "Always 'clean'")]:
        s = t[k]
        lines.append(f"| {label} | {s['precision']} | {s['recall']} | {s['f1']} | {s['pr_auc']} | {s['roc_auc']} |")
    lines += ["", "## Repeated 5-fold CV on real rows (5 repeats, mean ± std)", "",
              "Synthetic rows are generated inside each fold from that fold's training rows only, and every "
              "score is on held-out real rows.", "",
              "| Model | Precision | Recall | F1 | PR-AUC |", "|---|---|---|---|---|"]
    for name, label in LABELS.items():
        c = m["cv"][name]
        lines.append(f"| {label} | " + " | ".join(f"{c[k]['mean']} ± {c[k]['std']}" for k in ["precision", "recall", "f1", "pr_auc"]) + " |")
    c = m["current_all_rows"]
    lines.append(f"| Current (synthetic-trained), scored on all {m['n_rows']} rows | {c['precision']} | {c['recall']} | "
                 f"{c['f1']} | {c['pr_auc']} |")
    lines += ["", "The current model never saw any real row, so it is scored on all of them; the retrained models are "
              "scored only on rows held out of their own training fold.", "",
              f"Saved as risk_model_real.joblib: {LABELS[m['saved_model']]} (best mean CV F1).", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    run()
