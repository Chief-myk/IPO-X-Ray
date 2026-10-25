"""Listing-gain range: what an IPO is likely to open at, as an honest range, not one number.

Three methods compete on the same out-of-time test set, and the best one by interval score is served:
  baseline_board  past listing gains of the same board (SME / mainboard), ignoring everything else
  baseline_gmp    GMP plus how far GMP has historically been off (falls back to the board baseline without GMP)
  cqr             conformalised quantile regression: gradient-boosted 10th/50th/90th percentiles, then widened
                  on a held-out, more recent calibration set so the 80% range really covers ~80%
If the model does not beat the baselines, the baseline is served, and the card says so.

Interval score (Winkler): width + (2/alpha) x how far outside the range the truth fell. Lower is better; it
punishes both ranges that are too wide and ranges that miss, so it cannot be gamed by either.

  python -m ipo_decide.listing train     # prints the model card
"""
import json
import math
import threading
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor

from . import history
from .rules import v
from .synth import generate

HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "models" / "listing_model.joblib"

ALPHA = 0.2                    # 80% range
QS = (ALPHA / 2, 0.5, 1 - ALPHA / 2)
REAL_WEIGHT = 10.0             # one real IPO counts as ten synthetic ones
RETIRE_SYNTH_AT = 150          # with this many real IPOs, synthetic rows are dropped entirely
K_ANALOGS = 40

FEATURES = ["board_sme", "log_sub_retail", "log_sub_nii", "log_sub_qib", "log_sub_total",
            "log_issue_size", "gmp_pct", "market_ret_20d"]
# More demand / higher GMP / stronger market never lowers the predicted gain. A prior, stated, that stops
# small real datasets from learning nonsense wiggles.
MONOTONIC = [0, 1, 1, 1, 1, 0, 1, 1]
LABELS = {"baseline_board": "Same-board history", "baseline_gmp": "GMP + its past error", "cqr": "Calibrated quantile model"}


def _log1p(x):
    return math.log1p(x) if x is not None and x >= 0 else np.nan


def featurize(r: dict) -> list[float]:
    return [1.0 if r.get("board") == "SME" else 0.0, _log1p(r.get("sub_retail")), _log1p(r.get("sub_nii")),
            _log1p(r.get("sub_qib")), _log1p(r.get("sub_total")),
            math.log(r["issue_size_cr"]) if r.get("issue_size_cr") else np.nan,
            np.nan if r.get("gmp_pct") is None else float(r["gmp_pct"]),
            np.nan if r.get("market_ret_20d") is None else float(r["market_ret_20d"])]


def _matrix(rows):
    X = np.array([featurize(r) for r in rows], float).reshape(-1, len(FEATURES))
    y = np.array([history.gain_open_pct(r) for r in rows], float)
    w = np.array([1.0 if r["synthetic"] else REAL_WEIGHT for r in rows])
    return X, y, w


def _split(rows, fracs):
    """Splits real and synthetic rows separately by listing date, so every part has some of each and the
    later parts are always later in time than the earlier ones (no peeking at the future)."""
    parts = [[] for _ in fracs]
    for group in (r for r in [[x for x in rows if x["synthetic"]], [x for x in rows if not x["synthetic"]]]):
        g = sorted(group, key=lambda r: r["listing_date"])
        edges, acc = [], 0.0
        for f in fracs:
            acc += f
            edges.append(round(acc * len(g)))
        start = 0
        for i, e in enumerate(edges):
            parts[i].extend(g[start:e])
            start = e
    return parts


# ---------------- methods ----------------

def _hgb(q, seed=7):
    return HistGradientBoostingRegressor(loss="quantile", quantile=q, max_iter=250, learning_rate=0.05, max_leaf_nodes=15,
                                         min_samples_leaf=30, l2_regularization=1.0, monotonic_cst=MONOTONIC, random_state=seed)


def _conformal_q(scores, alpha):
    n = len(scores)
    if n == 0:
        return 0.0
    level = min(1.0, math.ceil((n + 1) * (1 - alpha)) / n)
    return float(np.quantile(scores, level, method="higher"))


# Chance that each input is blanked in the extra, masked copy of the training rows (column index -> p).
# People often know only the retail figure and GMP; without masked rows the trees have never seen a missing
# QIB/NII/total and route them arbitrarily, which can ignore a strongly negative GMP.
MASK_P = {1: 0.2, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.4, 6: 0.3, 7: 0.5}


def _augment(X, y, w, seed=7):
    rng = np.random.default_rng(seed)
    Xm = X.copy()
    for col, p in MASK_P.items():
        Xm[rng.random(len(Xm)) < p, col] = np.nan
    return np.vstack([X, Xm]), np.concatenate([y, y]), np.concatenate([w, w])


def fit_cqr(train, calib):
    Xt, yt, wt = _augment(*_matrix(train))
    models = [_hgb(q).fit(Xt, yt, sample_weight=wt) for q in QS]
    Xc, yc, _ = _matrix(calib)
    lo, _, hi = (m.predict(Xc) for m in models)
    scores = np.maximum(lo - yc, yc - hi)
    sme = Xc[:, 0] == 1
    pooled = _conformal_q(scores, ALPHA)
    # Mondrian: SME and mainboard get their own widening, since SME listings are far noisier
    adj = {b: (_conformal_q(scores[mask], ALPHA) if mask.sum() >= 30 else pooled) for b, mask in (("SME", sme), ("MAINBOARD", ~sme))}
    return {"models": models, "adj": adj}


def predict_cqr(m, X):
    lo, med, hi = (mod.predict(X) for mod in m["models"])
    a = np.where(X[:, 0] == 1, m["adj"]["SME"], m["adj"]["MAINBOARD"])
    lo, hi = lo - a, hi + a
    out = np.sort(np.vstack([lo, med, hi]), axis=0)
    return out[0], out[1], out[2]


def fit_board(train):
    out = {}
    for b in history.BOARDS:
        y = np.array([history.gain_open_pct(r) for r in train if r["board"] == b])
        out[b] = [float(np.quantile(y, q)) for q in QS] if len(y) else [0.0, 0.0, 0.0]
    return out


def predict_board(m, X):
    q = np.array([m["SME"] if s == 1 else m["MAINBOARD"] for s in X[:, 0]])
    return q[:, 0], q[:, 1], q[:, 2]


def fit_gmp(train):
    out = {"board": fit_board(train)}
    for b in history.BOARDS:
        r = np.array([history.gain_open_pct(x) - x["gmp_pct"] for x in train if x["board"] == b and x["gmp_pct"] is not None])
        out[b] = [float(np.quantile(r, q)) for q in QS] if len(r) >= 20 else None
    return out


def predict_gmp(m, X):
    lo, med, hi = (a.copy() for a in predict_board(m["board"], X))
    for i, row in enumerate(X):
        res = m["SME" if row[0] == 1 else "MAINBOARD"]
        if not np.isnan(row[6]) and res:
            lo[i], med[i], hi[i] = row[6] + res[0], row[6] + res[1], row[6] + res[2]
    return lo, med, hi


FIT = {"baseline_board": lambda tr, ca: fit_board(tr + ca), "baseline_gmp": lambda tr, ca: fit_gmp(tr + ca), "cqr": fit_cqr}
PREDICT = {"baseline_board": predict_board, "baseline_gmp": predict_gmp, "cqr": predict_cqr}


def metrics(lo, med, hi, y) -> dict:
    if len(y) == 0:
        return None
    miss_lo, miss_hi = np.maximum(lo - y, 0), np.maximum(y - hi, 0)
    nz = y != 0
    return {"n": int(len(y)), "coverage": round(float(np.mean((y >= lo) & (y <= hi))), 3),
            "avg_width": round(float(np.mean(hi - lo)), 1),
            "interval_score": round(float(np.mean(hi - lo + (2 / ALPHA) * (miss_lo + miss_hi))), 1),
            "mae_median": round(float(np.mean(np.abs(med - y))), 1),
            "direction_accuracy": round(float(np.mean(np.sign(med[nz]) == np.sign(y[nz]))), 3) if nz.any() else None}


# ---------------- training ----------------

def _dataset():
    real = history.load_real()
    retire = len(real) >= RETIRE_SYNTH_AT
    rows = real if retire else real + generate()
    return rows, real, retire


def train(quiet=True) -> dict:
    rows, real, retire = _dataset()
    train_, calib, test = _split(rows, (0.6, 0.2, 0.2))
    Xte, yte, _ = _matrix(test)
    real_te = np.array([not r["synthetic"] for r in test])
    evals = {}
    for name in FIT:
        m = FIT[name](train_, calib)
        lo, med, hi = PREDICT[name](m, Xte)
        evals[name] = {"label": LABELS[name], "all": metrics(lo, med, hi, yte),
                       "real": metrics(lo[real_te], med[real_te], hi[real_te], yte[real_te]) if real_te.sum() >= 15 else None}
        sme = Xte[:, 0] == 1
        evals[name]["by_board"] = {"SME": metrics(lo[sme], med[sme], hi[sme], yte[sme]),
                                   "MAINBOARD": metrics(lo[~sme], med[~sme], hi[~sme], yte[~sme])}
    # pick by real test rows when there are enough, otherwise by all rows
    basis = "real" if all(e["real"] for e in evals.values()) else "all"
    chosen = min(evals, key=lambda k: evals[k][basis]["interval_score"])

    # final fit: learn on the older 80%, calibrate on the most recent 20%
    fin_train, fin_calib = _split(rows, (0.8, 0.2))
    final = {name: FIT[name](fin_train, fin_calib) for name in FIT}

    X, y, _ = _matrix(rows)
    mu, sd = np.nanmean(X, axis=0), np.nanstd(X, axis=0)
    sd[sd == 0] = 1.0
    bank = {"Z": (X - mu) / sd, "y": y, "info": [{"name": r["name"], "date": r["listing_date"], "board": r["board"],
                                                    "sub_total": r["sub_total"], "gmp_pct": r["gmp_pct"],
                                                    "issue_size_cr": r["issue_size_cr"], "synthetic": bool(r["synthetic"]),
                                                    "source": r["source"]} for r in rows], "mu": mu, "sd": sd}
    card = {
        "trained_at": time.strftime("%Y-%m-%d %H:%M"), "range": f"{int(100 * (1 - ALPHA))}%",
        "n_real": len(real), "n_synthetic": sum(r["synthetic"] for r in rows),
        "real_by_board": {b: sum(r["board"] == b for r in real) for b in history.BOARDS},
        "synthetic_retired": retire, "retire_synthetic_at": RETIRE_SYNTH_AT, "real_weight": REAL_WEIGHT,
        "split": "60% train / 20% calibrate / 20% test, by listing date (real and synthetic split separately)",
        "selection_basis": "real IPOs in the test set" if basis == "real" else "all test rows (too few real IPOs to judge on real ones alone)",
        "chosen": chosen, "chosen_label": LABELS[chosen], "evaluation": evals, "features": FEATURES,
        "monotonic": "Predicted gain never falls when subscription, GMP or the market's 20-day return rises.",
        "partial_inputs": "Trained with a second copy of every row with inputs randomly blanked, so an IPO with only retail "
                          "subscription and GMP gets a sensible range instead of an arbitrary one.",
        "target": "Listing-day OPEN price vs issue price, %",
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"final": final, "chosen": chosen, "bank": bank, "card": card}, MODEL_PATH)
    if not quiet:
        print(json.dumps(card, indent=2))
    return card


_lock = threading.Lock()
_model = None


def get_model(retrain=False):
    """Loads the saved model; retrains when asked, when there is none, or when real data changed since."""
    global _model
    with _lock:
        stale = (not MODEL_PATH.exists()
                 or (history.REAL_CSV.exists() and history.REAL_CSV.stat().st_mtime > MODEL_PATH.stat().st_mtime))
        if retrain or stale:
            train()
            _model = None
        if _model is None:
            _model = joblib.load(MODEL_PATH)
        return _model


# ---------------- prediction ----------------

def _analogs(bank, x, board):
    z = (np.array(x) - bank["mu"]) / bank["sd"]
    idx = np.array([i for i, inf in enumerate(bank["info"]) if inf["board"] == board])
    if not len(idx):
        return None
    Z = bank["Z"][idx][:, 1:]
    zq = z[1:]
    diff = Z - zq
    # a feature known on one side only counts as a full standard deviation apart
    diff = np.where(np.isnan(diff), 1.0, diff)
    d = np.sqrt(np.sum(diff ** 2, axis=1))
    order = np.argsort(d)[:K_ANALOGS]
    sel, ys = idx[order], bank["y"][idx[order]]
    losses = int(np.sum(ys < 0))
    real_n = sum(not bank["info"][i]["synthetic"] for i in sel)
    return {"k": len(sel), "real_count": real_n,
            "p10": round(float(np.quantile(ys, 0.1)), 1), "p50": round(float(np.median(ys)), 1), "p90": round(float(np.quantile(ys, 0.9)), 1),
            "p_loss": round((losses + 1) / (len(sel) + 2), 3), "losses": losses,
            "closest": [{**bank["info"][i], "gain_open_pct": round(float(bank["y"][i]), 1), "distance": round(float(d[j]), 2)}
                        for j, i in zip(order[:8], sel[:8])]}


def _one(model, method, x):
    lo, med, hi = PREDICT[method](model["final"][method], np.array([x], float))
    return float(lo[0]), float(med[0]), float(hi[0])


def _cap(board, lo, med, hi):
    if board == "SME":
        cap = 100 * v("sme_open_cap")
        lo, med, hi = min(lo, cap), min(med, cap), min(hi, cap)
    return max(lo, -100.0), max(med, -100.0), max(hi, -100.0)


def predict(inp: dict) -> dict:
    """inp: board, issue_price?, issue_size_cr?, sub_retail?, sub_nii?, sub_qib?, sub_total?, gmp_pct? or gmp_rs?, market_ret_20d?"""
    model = get_model()
    r = dict(inp)
    r["board"] = "SME" if str(r.get("board", "")).upper() == "SME" else "MAINBOARD"
    if r.get("gmp_pct") is None and r.get("gmp_rs") is not None and r.get("issue_price"):
        r["gmp_pct"] = 100 * r["gmp_rs"] / r["issue_price"]
    x = featurize(r)
    method = model["chosen"]
    lo, med, hi = _cap(r["board"], *_one(model, method, x))
    base = _cap(r["board"], *_one(model, "baseline_board", x))

    def what_if(mult=None, drop_gmp=False):
        rr = dict(r)
        if mult:
            for k in ("sub_retail", "sub_nii", "sub_qib", "sub_total"):
                if rr.get(k) is not None:
                    rr[k] = rr[k] * mult
        if drop_gmp:
            rr["gmp_pct"] = None
        a, b, c = _cap(r["board"], *_one(model, method, featurize(rr)))
        return {"lo": round(a, 1), "median": round(b, 1), "hi": round(c, 1)}

    has_sub = any(r.get(k) is not None for k in ("sub_retail", "sub_nii", "sub_qib", "sub_total"))
    sens = []
    if has_sub:
        sens += [{"label": "If subscription ends at half", **what_if(0.5)}, {"label": "If subscription ends at double", **what_if(2.0)}]
    if r.get("gmp_pct") is not None:
        sens.append({"label": "Ignoring GMP", **what_if(drop_gmp=True)})

    card = model["card"]
    warnings = []
    if not card["synthetic_retired"]:
        warnings.append(f"Trained on {card['n_real']} real and {card['n_synthetic']} synthetic IPOs. Until "
                        f"{card['retire_synthetic_at']} real IPOs are imported, treat the range as a demonstration of the method.")
    if not has_sub:
        warnings.append("No subscription figures given: the range leans on board history and GMP only. Add final-day subscription for a sharper range.")
    if r["board"] == "SME":
        warnings.append(f"SME opening price is capped at +{round(100 * v('sme_open_cap'))}% on NSE Emerge, so the top of the range is cut there.")
    analogs = _analogs(model["bank"], x, r["board"])
    out = {
        "board": r["board"], "method": method, "method_label": LABELS[method],
        "range_pct": {"lo": round(lo, 1), "median": round(med, 1), "hi": round(hi, 1), "level": card["range"]},
        "board_baseline_pct": {"lo": round(base[0], 1), "median": round(base[1], 1), "hi": round(base[2], 1)},
        "analogs": analogs, "what_if": sens, "warnings": warnings,
        "inputs_used": {k: r.get(k) for k in ("issue_price", "issue_size_cr", "sub_retail", "sub_nii", "sub_qib", "sub_total", "gmp_pct", "market_ret_20d")},
        "model_card": card,
        "disclaimer": "A range from past listings and stated assumptions, not a forecast or investment advice. About 1 in 5 IPOs should land outside an 80% range.",
    }
    if r.get("issue_price"):
        p = r["issue_price"]
        out["range_price"] = {k: round(p * (1 + out["range_pct"][k] / 100), 2) for k in ("lo", "median", "hi")}
    return out


def quantile_samples(pred: dict, n: int = 2000, seed: int = 3) -> np.ndarray:
    """Turns a predicted range into listing-gain samples (in %) for the planner and sell-timing tools.
    Between the 10th, 50th and 90th percentiles it interpolates linearly; beyond them it extends the tails
    with the same slope, so the samples respect the range without inventing a shape."""
    rng = np.random.default_rng(seed)
    lo, med, hi = pred["range_pct"]["lo"], pred["range_pct"]["median"], pred["range_pct"]["hi"]
    u = rng.random(n)
    qlo, qhi = QS[0], QS[2]
    s_lo = (med - lo) / (0.5 - qlo)
    s_hi = (hi - med) / (qhi - 0.5)
    g = np.where(u < 0.5, med - (0.5 - u) * s_lo, med + (u - 0.5) * s_hi)
    cap = 100 * v("sme_open_cap") if pred["board"] == "SME" else None
    if cap is not None:
        g = np.minimum(g, cap)
    return np.maximum(g, -100.0)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "train":
        train(quiet=False)
    else:
        print(json.dumps(get_model()["card"], indent=2))
