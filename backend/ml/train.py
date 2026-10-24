"""Train the risk model.  python -m ml.train   (run from backend/)

Model: gradient-boosted trees (HistGradientBoosting, handles missing agent results natively),
sigmoid-calibrated so the output is a usable probability, plus an IsolationForest that says how
unusual this IPO looks next to typical clean ones."""
import csv
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from .features import FEATURES
from .synth import generate

HERE = Path(__file__).resolve().parent
REAL_CSV = HERE / "data" / "labeled_ipos.csv"
MODEL_PATH = HERE / "models" / "risk_model.joblib"
REAL_WEIGHT = 25.0   # one real labelled IPO counts as much as 25 synthetic rows


def load_real():
    if not REAL_CSV.exists():
        return np.empty((0, len(FEATURES))), np.empty(0, int)
    X, y = [], []
    with open(REAL_CSV, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row.get("label", "").strip() not in {"0", "1"}:
                continue
            X.append([float(row[f]) if row.get(f, "").strip() not in {"", "nan"} else np.nan for f in FEATURES])
            y.append(int(row["label"]))
    return np.array(X, float).reshape(-1, len(FEATURES)), np.array(y, int)


def _clf(seed):
    base = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.06, max_leaf_nodes=15,
                                          l2_regularization=1.0, random_state=seed)
    return CalibratedClassifierCV(base, method="sigmoid", cv=3)


def train_and_save(n_synth=4000, seed=7, quiet=False):
    Xs, ys = generate(n_synth, seed)
    Xr, yr = load_real()

    # 1) honest held-out check on synthetic data
    Xtr, Xte, ytr, yte = train_test_split(Xs, ys, test_size=0.2, stratify=ys, random_state=seed)
    m = _clf(seed).fit(Xtr, ytr)
    auc_synth = float(roc_auc_score(yte, m.predict_proba(Xte)[:, 1]))
    # 2) does the synthetic prior transfer to real labelled cases?
    auc_real = float(roc_auc_score(yr, m.predict_proba(Xr)[:, 1])) if len(set(yr)) == 2 else None

    # 3) final model on everything, real cases weighted up
    X = np.vstack([Xs, Xr])
    y = np.concatenate([ys, yr])
    w = np.concatenate([np.ones(len(ys)), np.full(len(yr), REAL_WEIGHT)])
    clf = _clf(seed).fit(X, y, sample_weight=w)

    medians = np.nanmedian(X[y == 0], axis=0)
    clean = np.where(np.isnan(X[y == 0]), medians, X[y == 0])
    iso = IsolationForest(n_estimators=200, random_state=seed).fit(clean)
    ref = np.sort(-iso.score_samples(clean))

    meta = {"trained_at": time.strftime("%Y-%m-%d %H:%M"), "n_synthetic": int(len(ys)), "n_real": int(len(yr)),
            "n_real_fraud": int(yr.sum()) if len(yr) else 0, "auc_synthetic_holdout": round(auc_synth, 3),
            "auc_real": None if auc_real is None else round(auc_real, 3), "features": FEATURES,
            "model": "Calibrated gradient-boosted trees + isolation forest"}
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"clf": clf, "iso": iso, "medians": medians, "iso_ref": ref, "meta": meta}, MODEL_PATH)
    if not quiet:
        print(json.dumps(meta | {"features": len(FEATURES)}, indent=2))
    return meta


if __name__ == "__main__":
    train_and_save(n_synth=int(sys.argv[1]) if len(sys.argv) > 1 else 4000)
