"""What actually reaches your bank: sale value minus charges minus capital-gains tax. Vectorised over price samples."""
import numpy as np

from .rules import v


def net_of_sale(shares: float, buy_price: float, sell_prices, *, long_term: bool, ltcg_exemption_left: float | None = None,
                surcharge: float = 0.0, brokerage: float = 0.0) -> dict:
    """Arrays (one per price sample) of: sale value, charges, tax, money in hand, and profit vs. what you paid.
    Charges other than STT are deductible transfer expenses; STT is not. A loss pays no tax here; it can be
    set off against other gains, which we do not model (we say so in the UI)."""
    p = np.asarray(sell_prices, float)
    value = shares * p
    stt = value * v("stt_sell")
    exch = value * v("exchange_txn")
    sebi = value * v("sebi_fee")
    gst = (brokerage + exch + sebi) * v("gst")
    charges = stt + exch + sebi + gst + v("dp_charge") + brokerage
    cost = shares * buy_price
    gain = value - cost - (charges - stt)
    s = min(max(surcharge, 0.0), v("surcharge_cap"))
    if long_term:
        left = v("ltcg_exemption") if ltcg_exemption_left is None else max(0.0, ltcg_exemption_left)
        taxable = np.maximum(gain - left, 0.0)
        rate = v("ltcg_rate")
    else:
        taxable = np.maximum(gain, 0.0)
        rate = v("stcg_rate")
    tax = taxable * rate * (1 + s) * (1 + v("cess"))
    in_hand = value - charges - tax
    return {"value": value, "charges": charges, "tax": tax, "in_hand": in_hand, "profit": in_hand - cost, "rate": rate}


def summary(a, digits=0) -> dict:
    a = np.asarray(a, float)
    r = (lambda x: round(float(x), digits)) if digits else (lambda x: int(round(float(x))))
    return {"mean": r(a.mean()), "p10": r(np.quantile(a, 0.1)), "p50": r(np.median(a)), "p90": r(np.quantile(a, 0.9))}
