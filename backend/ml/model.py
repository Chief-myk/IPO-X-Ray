"""Loads the trained model and explains every prediction with Shapley values.

'Absent' = the model is told 'unknown' (NaN) for a feature, which it was trained to handle.
We sample random orders in which the observed features are revealed and average each feature's
marginal effect on the fraud probability. Contributions add up exactly to
p(this IPO) - p(nothing known), so the points shown in the UI sum to the score's rise."""
import threading

import joblib
import numpy as np

from .features import FEATURES, FEATURE_TEXT
from .train import MODEL_PATH, train_and_save

_lock = threading.Lock()
_model = None


class RiskModel:
    def __init__(self, b):
        self.clf, self.iso, self.medians, self.ref, self.meta = b["clf"], b["iso"], b["medians"], b["iso_ref"], b["meta"]

    def _shapley(self, x, idx, n_perm=96, seed=0):
        rng = np.random.default_rng(seed)
        k = len(idx)
        rows = np.full((n_perm * (k + 1), len(x)), np.nan)
        orders = [rng.permutation(idx) for _ in range(n_perm)]
        for p_i, order in enumerate(orders):
            base = p_i * (k + 1)
            for j in range(1, k + 1):
                rows[base + j] = rows[base + j - 1]
                rows[base + j, order[j - 1]] = x[order[j - 1]]
        probs = self.clf.predict_proba(rows)[:, 1].reshape(n_perm, k + 1)
        gain = {i: 0.0 for i in idx}
        for p_i, order in enumerate(orders):
            for j, f in enumerate(order):
                gain[f] += probs[p_i, j + 1] - probs[p_i, j]
        return {FEATURES[i]: round(g / n_perm, 4) for i, g in gain.items()}

    def predict(self, feats: dict):
        x = np.array([[feats.get(f, np.nan) for f in FEATURES]], float)
        observed = ~np.isnan(x[0])
        if not observed.any():
            return {"probability": None, "score": 0, "contributions": {}, "anomaly_pct": None}
        p = float(self.clf.predict_proba(x)[0, 1])
        contrib = self._shapley(x[0], np.where(observed)[0])
        xi = np.where(np.isnan(x), self.medians, x)
        a = float(-self.iso.score_samples(xi)[0])
        pct = round(100 * float(np.searchsorted(self.ref, a)) / len(self.ref))
        drivers = sorted(contrib.items(), key=lambda kv: -abs(kv[1]))[:6]
        return {"probability": round(p, 4), "score": round(p * 100), "contributions": contrib, "anomaly_pct": pct,
                "drivers": [{"feature": f, "label": FEATURE_TEXT[f], "points": float(round(c * 100, 1)),
                             "value": None if np.isnan(x[0][FEATURES.index(f)]) else round(float(x[0][FEATURES.index(f)]), 3)}
                            for f, c in drivers]}


def get_model() -> RiskModel:
    global _model
    with _lock:
        if _model is None:
            if not MODEL_PATH.exists():
                train_and_save(quiet=True)
            _model = RiskModel(joblib.load(MODEL_PATH))
        return _model


def reload_model():
    global _model
    with _lock:
        _model = None
    return get_model()
