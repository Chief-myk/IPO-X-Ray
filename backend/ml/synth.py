"""Synthetic bootstrap data so the model works before real cases are labelled.

Each row has a hidden 'fraud intensity' s. Fraud rows get s ~ Beta(2,2) (some subtle, some blatant),
clean rows get s ~ Beta(1,8). Every feature is a noisy, overlapping function of s, with missing values
(agents often fail), legit companies that look odd (fast growers, clients who never publicise
suppliers), and 4% flipped labels. These are our assumptions, written down; real labelled cases
in data/labeled_ipos.csv are weighted far higher and should replace them over time."""
import numpy as np

from .features import FEATURES

MISSING = {"vendor_min_employees": .35, "min_domain_age_days": .45, "director_struck_off_max": .2, "growth_multiple": .15,
           "log_employees": .3, "client_unconfirmed_frac": .2, "address_no_business": .2, "address_residential": .2}


def generate(n=4000, seed=7):
    rng = np.random.default_rng(seed)
    y = (rng.random(n) < 0.3).astype(int)
    s = np.where(y == 1, rng.beta(2, 2, n), rng.beta(1, 8, n))
    X = np.full((n, len(FEATURES)), np.nan)
    col = {f: i for i, f in enumerate(FEATURES)}
    for i in range(n):
        si = s[i]
        fast_legit = y[i] == 0 and rng.random() < 0.12          # genuine fast growers
        g = rng.lognormal(np.log(1.25) + 1.1 * si + (0.9 if fast_legit else 0), 0.35)
        emp = rng.lognormal(np.log(120) - 2.2 * si + (0.8 if fast_legit else 0), 0.7)
        v = {
            "vendor_linked_promoter": float(rng.random() < 0.03 + 0.7 * si),
            "vendor_no_web_frac": rng.binomial(3, 0.05 + 0.5 * si) / 3,
            "vendor_registry_bad": rng.poisson(0.05 + 0.8 * si),
            "vendor_min_employees": max(0.0, rng.lognormal(np.log(60) - 3 * si, 0.8)),
            "min_domain_age_days": rng.lognormal(np.log(2500) - 2.4 * si, 0.8),
            "client_unconfirmed_frac": rng.binomial(3, 0.25 + 0.45 * si) / 3,
            "director_sebi_orders": rng.poisson(0.02 + 0.6 * si ** 2),
            "director_vendor_overlap": rng.poisson(0.02 + 1.2 * si ** 2),
            "director_struck_off_max": rng.poisson(0.6 + 3 * si),
            "address_no_business": float(rng.random() < 0.06 + 0.5 * si),
            "address_residential": float(rng.random() < 0.08 + 0.4 * si),
            "growth_multiple": g,
            "log_employees": np.log1p(emp),
            "company_sebi_orders": rng.poisson(0.01 + 0.3 * si ** 2),
            "company_court_cases": rng.poisson(0.3 + 1.2 * si),
            "complaints_count": rng.poisson(0.5 + 3 * si),
            "unverified_frac": rng.binomial(10, 0.1 + 0.08 * si) / 10,   # weak signal: agents fail on real sites too
        }
        for f, val in v.items():
            if rng.random() >= MISSING.get(f, 0.08):
                X[i, col[f]] = val
    flip = rng.random(n) < 0.04
    y = np.where(flip, 1 - y, y)
    return X, y
