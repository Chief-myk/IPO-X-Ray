"""Synthetic past IPOs, so the listing-range model runs before enough real ones are imported.

These are OUR ASSUMPTIONS, written down, not facts about the market:
  * A hidden "demand" d per IPO drives subscription and the listing gain together, so subscription is
    informative but never decisive. A per-year market mood shifts both (hot years list higher).
  * Mainboard gains follow QIB demand more; SME gains follow NII/retail demand more, with fatter tails.
  * GMP is a noisy read of the eventual gain: tighter for mainboard, much looser for SME (public
    analyses report GMP tracks mainboard listings far better than SME ones), and often missing.
  * SME opening price is capped at +90% (NSE Emerge rule, see rules.py); after the open, SME moves at most
    5% on the day, mainboard up to 20%.
Every row is marked synthetic=1, and the model card reports real-only accuracy separately.
"""
import math

import numpy as np

from .rules import v

# Market mood per year (shift in log listing gain). Assumed shape: weak 2018/2022/2025, hot 2021/2024.
YEAR_MOOD = {2017: 0.05, 2018: -0.06, 2019: 0.0, 2020: 0.07, 2021: 0.12, 2022: -0.03, 2023: 0.07, 2024: 0.14, 2025: -0.04}


def generate(n: int = 3000, seed: int = 11) -> list[dict]:
    rng = np.random.default_rng(seed)
    years = sorted(YEAR_MOOD)
    rows = []
    for i in range(n):
        year = years[int(rng.integers(len(years)))]
        day = int(rng.integers(1, 360))
        listing = np.datetime64(f"{year}-01-01") + np.timedelta64(day, "D")
        sme = rng.random() < 0.55
        mood = YEAR_MOOD[year] + rng.normal(0, 0.04)
        d = rng.normal(0, 1)

        total = max(0.3, math.exp(1.3 + 1.5 * d + 6 * mood + rng.normal(0, 0.5 + 0.3 * sme)))
        retail = total * math.exp(rng.normal(-0.15, 0.45))
        nii = total * math.exp(rng.normal(0.35, 0.55))
        qib = (total * math.exp(rng.normal(0.25, 0.55))) if (not sme or rng.random() < 0.5) else None
        size = math.exp(rng.normal(math.log(40), 0.7)) if sme else math.exp(rng.normal(math.log(900), 1.0))
        price = round(math.exp(rng.normal(math.log(90), 0.6)) if sme else math.exp(rng.normal(math.log(320), 0.7)))
        price = max(10, price)
        lot = math.ceil((110000 if sme else 14500) / price)
        mkt = rng.normal(1.0 + 25 * mood, 3.5)

        g = 0.01 + 0.085 * d + 0.7 * mood + 0.004 * mkt - 0.012 * math.log(size)
        g += 0.055 * math.log1p(nii) if sme else 0.05 * math.log1p(qib or 0)
        g += float(rng.standard_t(4)) * (0.16 if sme else 0.10)
        gain = max(-0.6, math.exp(g) - 1)
        if sme:
            gain = min(gain, v("sme_open_cap"))
        open_ = round(price * (1 + gain), 2)
        band = 0.05 if sme else 0.20
        close = round(open_ * (1 + float(np.clip(rng.normal(0.0, 0.035 if sme else 0.06), -band, band))), 2)

        gmp = None
        if rng.random() > (0.45 if sme else 0.3):
            gmp = round(max(-15.0, 100 * gain * 0.85 + rng.normal(0, 20 if sme else 7)), 1)

        rows.append({
            "name": f"synthetic-{'sme' if sme else 'mb'}-{i + 1:04d}", "board": "SME" if sme else "MAINBOARD",
            "listing_date": str(listing), "issue_price": float(price), "issue_size_cr": round(size, 2), "lot_size": lot,
            "sub_retail": round(retail, 2), "sub_nii": round(nii, 2), "sub_qib": None if qib is None else round(qib, 2),
            "sub_total": round(total, 2), "gmp_pct": gmp, "market_ret_20d": round(mkt, 2),
            "listing_open": open_, "listing_close": close, "source": f"synthetic seed={seed}", "synthetic": 1,
        })
    return rows
