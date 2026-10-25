"""Synthetic rows fitted to REAL labelled IPOs, for training only. Every row it makes is marked synthetic.

Method (smoothed bootstrap, a standard oversampling technique):
  1. pick a class, half fraud / half clean, so the rare fraud class is not drowned out
  2. copy a random real row of that class, keeping its missing values (agents often find nothing)
  3. jitter what is there: growth x lognormal(0, 0.15), log-employees + normal(0, 0.2), residential flag
     flipped with 5% probability

It only knows what the real rows it is given show. Generate from the training rows of a split, never from
rows that will be used to test, or the test leaks into training.
"""
import numpy as np

from ml.features import FEATURES

def generate(X: np.ndarray, y: np.ndarray, n: int = 400, seed: int = 0,
             features: list[str] = FEATURES) -> tuple[np.ndarray, np.ndarray]:
    """X: rows with columns in `features` order (NaN = unknown), y: 0/1. Returns n synthetic rows and labels."""
    _G, _E, _A = (features.index(f) for f in ("growth_multiple", "log_employees", "address_residential"))
    rng = np.random.default_rng(seed)
    by_class = {c: X[y == c] for c in (0, 1) if (y == c).any()}
    labels = rng.choice(list(by_class), size=n)
    out = np.empty((n, X.shape[1]))
    for i, c in enumerate(labels):
        pool = by_class[c]
        row = pool[rng.integers(len(pool))].copy()
        if not np.isnan(row[_G]):
            row[_G] = max(0.05, row[_G] * rng.lognormal(0, 0.15))
        if not np.isnan(row[_E]):
            row[_E] = max(0.0, row[_E] + rng.normal(0, 0.2))
        if not np.isnan(row[_A]) and rng.random() < 0.05:
            row[_A] = 1 - row[_A]
        out[i] = row
    return out, labels.astype(int)
