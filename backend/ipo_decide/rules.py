"""Every rule the decision tools rely on, in one place, each with where it comes from.

Rules change (tax rates changed on 23 Jul 2024; SME application sizes changed in 2025). Each rule carries
`as_of` and `verify`: verify=True means we took it from secondary sources (broker explainers, news) and it
must be checked against the Act / SEBI circular before anyone relies on it. The UI shows these next to results.
"""
from datetime import date, timedelta

RULES = {
    # --- Income tax on listed equity (STT paid) ---
    "stcg_rate": {"value": 0.20, "label": "Short-term capital gains tax (held 12 months or less)",
                  "source": "Income-tax Act s.111A, rate from 23 Jul 2024 (Finance (No. 2) Act 2024)", "as_of": "2024-07-23", "verify": True},
    "ltcg_rate": {"value": 0.125, "label": "Long-term capital gains tax (held more than 12 months)",
                  "source": "Income-tax Act s.112A, rate from 23 Jul 2024", "as_of": "2024-07-23", "verify": True},
    "ltcg_exemption": {"value": 125000, "label": "LTCG exempt each financial year (all listed equity combined)",
                       "source": "Income-tax Act s.112A", "as_of": "2024-07-23", "verify": True},
    "cess": {"value": 0.04, "label": "Health and education cess on the tax", "source": "Finance Act", "as_of": "2024-04-01", "verify": False},
    "surcharge_cap": {"value": 0.15, "label": "Surcharge on these gains is capped at 15%", "source": "Finance Act, s.111A/112A gains",
                      "as_of": "2024-04-01", "verify": True},
    "holding_starts": {"value": "allotment", "label": "Holding period starts when shares are allotted (credited), not at application or listing",
                       "source": "Broker tax explainers (mStock, INDmoney)", "as_of": "2025-01-01", "verify": True},

    # --- Selling costs (delivery) ---
    "stt_sell": {"value": 0.001, "label": "STT on the sell value (delivery)", "source": "Securities Transaction Tax rates", "as_of": "2024-10-01", "verify": True},
    "exchange_txn": {"value": 0.0000297, "label": "Exchange transaction charge (NSE, of turnover)", "source": "NSE circular, Oct 2024", "as_of": "2024-10-01", "verify": True},
    "sebi_fee": {"value": 0.000001, "label": "SEBI turnover fee (Rs 10 per crore)", "source": "SEBI fee schedule", "as_of": "2024-01-01", "verify": False},
    "gst": {"value": 0.18, "label": "GST on brokerage + exchange + SEBI charges", "source": "GST rate for financial services", "as_of": "2024-01-01", "verify": False},
    "dp_charge": {"value": 16.0, "label": "Depository charge per sell (per stock, per day), Rs", "source": "Typical CDSL + broker DP fee; check your broker",
                  "as_of": "2025-01-01", "verify": True},

    # --- Applying ---
    "retail_max_application": {"value": 200000, "label": "Largest retail (RII) application, Rs", "source": "SEBI ICDR Regulations", "as_of": "2022-04-01", "verify": False},
    "mainboard_retail_min_lots": {"value": 1, "label": "Mainboard: a retail allottee gets one minimum lot when oversubscribed",
                                  "source": "SEBI ICDR Regulations, retail allotment by lottery", "as_of": "2022-04-01", "verify": False},
    "sme_individual_min_lots": {"value": 2, "label": "SME: minimum application for individual investors is 2 lots",
                                "source": "SEBI SME framework amendments (2025), as reported", "as_of": "2025-03-01", "verify": True},
    "unblock_days_after_close": {"value": 2, "label": "Working days after issue close until money of unsuccessful bids is unblocked (T+3 regime)",
                                 "source": "SEBI T+3 listing timeline (mandatory from Dec 2023); banks can lag 1-2 days", "as_of": "2023-12-01", "verify": True},
    "listing_days_after_close": {"value": 3, "label": "Working days from issue close to listing (T+3)", "source": "SEBI T+3 listing timeline",
                                 "as_of": "2023-12-01", "verify": False},
    "sale_settlement_days": {"value": 1, "label": "Working days for sale money to reach you (T+1 settlement)", "source": "SEBI T+1 settlement",
                             "as_of": "2023-01-27", "verify": False},

    # --- Listing day ---
    "sme_open_cap": {"value": 0.90, "label": "NSE Emerge: SME opening price capped at 90% above the issue price",
                     "source": "NSE circular on SME pre-open price discovery (2024), as reported", "as_of": "2024-03-01", "verify": True},
}


def v(key):
    return RULES[key]["value"]


def public():
    """Rules as the UI shows them."""
    return [{"key": k, **r} for k, r in RULES.items()]


# --- calendar helpers: working days skip Sat/Sun only (exchange holidays are not modelled; we say so) ---

def add_working_days(d: date, n: int) -> date:
    while n > 0:
        d += timedelta(days=1)
        if d.weekday() < 5:
            n -= 1
    return d


def add_months(d: date, months: int) -> date:
    y, m = divmod(d.month - 1 + months, 12)
    y, m = d.year + y, m + 1
    for day in (d.day, 30, 29, 28):
        try:
            return date(y, m, day)
        except ValueError:
            continue
    raise ValueError("bad date")


def is_long_term(allotted: date, sold: date) -> bool:
    """Long term means held MORE than 12 months: the sale must be after the 12-month anniversary."""
    return sold > add_months(allotted, 12)


def first_long_term_day(allotted: date) -> date:
    return add_months(allotted, 12) + timedelta(days=1)


def sell_costs(sell_value: float, brokerage: float = 0.0) -> dict:
    """Charges on one delivery sale. Brokerage is the broker's own fee in Rs (0 at most discount brokers)."""
    stt = sell_value * v("stt_sell")
    exch = sell_value * v("exchange_txn")
    sebi = sell_value * v("sebi_fee")
    gst = (brokerage + exch + sebi) * v("gst")
    dp = v("dp_charge") if sell_value > 0 else 0.0
    total = stt + exch + sebi + gst + dp + brokerage
    return {"stt": stt, "exchange": exch, "sebi": sebi, "gst": gst, "dp": dp, "brokerage": brokerage, "total": total}


def capital_gains_tax(gain: float, long_term: bool, ltcg_exemption_left: float | None = None, surcharge: float = 0.0) -> dict:
    """Tax on one gain. A loss gives zero tax here (it can be set off against other gains; we note that, not model it).
    STT is not deductible from the gain; other sale charges are (transfer expenses)."""
    surcharge = min(max(surcharge, 0.0), v("surcharge_cap"))
    if gain <= 0:
        return {"taxable": 0.0, "rate": 0.0, "tax": 0.0, "exemption_used": 0.0}
    if long_term:
        left = v("ltcg_exemption") if ltcg_exemption_left is None else max(0.0, ltcg_exemption_left)
        used = min(gain, left)
        taxable, rate = gain - used, v("ltcg_rate")
    else:
        used, taxable, rate = 0.0, gain, v("stcg_rate")
    tax = taxable * rate * (1 + surcharge) * (1 + v("cess"))
    return {"taxable": taxable, "rate": rate, "tax": tax, "exemption_used": used}
