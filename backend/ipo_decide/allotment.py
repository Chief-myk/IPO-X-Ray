"""Allotment odds, done the way the registrar actually allots.

When a category is oversubscribed, every winning applicant gets the MINIMUM application (1 lot mainboard
retail, 2 lots SME individual), picked by lottery. So the odds depend on the number of APPLICATIONS, not
on the subscription multiple, which counts SHARES bid:

    lots on offer       = reserved shares / (min lots x lot size)
    applications        = shares bid / (average lots per application x lot size)
    P(win)              = lots on offer / applications = avg lots per application / (min lots x subscription)

The common shortcut P = 1 / subscription assumes everyone applied for the minimum. If many applied for more,
your odds are better than that. With the exchange's published application count you get the exact figure;
without it we give the conservative shortcut and the most it could be.
"""
from .rules import v


def min_lots(board: str, category: str = "retail") -> int:
    if category != "retail":
        return 1
    return v("sme_individual_min_lots") if board == "SME" else v("mainboard_retail_min_lots")


def max_retail_lots(lot_size: int, price: float) -> int:
    return max(0, int(v("retail_max_application") // (lot_size * price)))


def odds(*, board: str, subscription: float, lot_size: int, price: float, lots_applied: int | None = None,
         applications: int | None = None, reserved_shares: int | None = None, category: str = "retail",
         min_lots_override: int | None = None) -> dict:
    """P(at least the minimum allotment) for one application, and the expected lots allotted."""
    m = min_lots_override or min_lots(board, category)
    lots_applied = max(m, lots_applied or m)
    cap = max_retail_lots(lot_size, price) if category == "retail" else lots_applied
    notes = []
    if subscription is None or subscription <= 0:
        return {"ok": False, "error": "Need the category's subscription multiple (e.g. 35 for 35x)."}

    if subscription <= 1:
        return {"ok": True, "method": "undersubscribed", "min_lots": m, "p_win": 1.0, "p_win_low": 1.0, "p_win_high": 1.0,
                "expected_lots": float(lots_applied), "lots_applied": lots_applied,
                "notes": ["Category not fully subscribed: every valid bid is allotted in full."]}

    if applications and reserved_shares:
        lots_on_offer = reserved_shares / (m * lot_size)
        p = min(1.0, lots_on_offer / applications)
        method, p_low, p_high = "exact", p, p
        notes.append(f"From the published application count: {lots_on_offer:,.0f} minimum allotments for {applications:,} applications.")
    else:
        p_low = min(1.0, 1 / subscription)
        p_high = min(1.0, (cap if category == "retail" else m) / (m * subscription))
        p, method = p_low, "bounds"
        notes.append("Without the application count we use the conservative shortcut 1 / subscription. "
                     "If many applicants bid for more than the minimum, the true odds are higher, up to the upper bound shown.")

    # If everyone got the minimum, what's left is shared in proportion to the extra lots bid
    expected = p * m
    if p >= 1.0 and lots_applied > m and applications and reserved_shares:
        bid_lots = subscription * reserved_shares / lot_size
        left = reserved_shares / lot_size - applications * m
        extra_bid = bid_lots - applications * m
        if extra_bid > 0 and left > 0:
            expected = m + (lots_applied - m) * min(1.0, left / extra_bid)
    elif lots_applied > m and p < 1:
        notes.append(f"Applying for {lots_applied} lots does not raise your odds: winners get {m} lot(s) each.")
    return {"ok": True, "method": method, "min_lots": m, "p_win": round(p, 5), "p_win_low": round(p_low, 5),
            "p_win_high": round(p_high, 5), "expected_lots": round(expected, 4), "lots_applied": lots_applied, "notes": notes}


def across_accounts(p: float, accounts: int) -> float:
    """Chance that at least one of several separate applications (different PANs) wins.
    Treats the draws as independent, which is how a computerised lottery over applications behaves."""
    return 1 - (1 - p) ** max(0, accounts)
