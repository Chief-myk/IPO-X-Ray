"""Multi-IPO application planner: with this much money and these accounts, which of this week's IPOs to apply
to, from how many accounts, and with how many lots.

What it weighs, per IPO:
  odds         allotment.odds (the registrar's lottery, not 1/subscription folklore)
  pay-off      listing-gain range (listing.py, or one you type in), then charges and short-term tax at listing
  capital      the money each application blocks, and for how long; IPOs whose windows overlap compete for it

Capital is planned conservatively: each application's full amount is reserved from the day you apply until
the sale money would reach you if it IS allotted (listing day + T+1). So the plan never runs out of money,
whatever the lotteries do. If an application loses, its money is free two working days after close; the
timeline shows that too.

The search is exact (branch and bound over every IPO x accounts x lots option), capped at a node budget;
past that it returns the best plan found and says so.
"""
from datetime import date, datetime

import numpy as np

from . import allotment, listing
from .money import net_of_sale, summary
from .rules import add_working_days, v

MAX_IPOS = 12
NODE_BUDGET = 400_000
SAMPLES = 3000      # listing-gain samples per IPO
SIMS = 40000        # simulated outcomes of the whole plan (lotteries are rare events, so many are needed)


def _d(s) -> date:
    return s if isinstance(s, date) else datetime.strptime(str(s), "%Y-%m-%d").date()


def _gain_samples(ipo: dict, seed: int) -> tuple[np.ndarray, dict]:
    """Listing-gain samples (%) for one IPO: from the user's own range if given, else from the model."""
    rng_in = ipo.get("gain_range")
    if rng_in and all(rng_in.get(k) is not None for k in ("lo", "median", "hi")):
        pred = {"board": ipo["board"], "range_pct": {k: float(rng_in[k]) for k in ("lo", "median", "hi")},
                "method_label": "Your own range"}
    else:
        inp = {k: ipo.get(k) for k in ("board", "issue_price", "issue_size_cr", "sub_retail", "sub_nii",
                                       "sub_qib", "sub_total", "gmp_pct", "gmp_rs", "market_ret_20d")}
        # the retail figure you plan with is the best demand signal we have when the others are blank
        inp["sub_retail"] = inp["sub_retail"] if inp["sub_retail"] is not None else ipo.get("expected_subscription")
        pred = listing.predict(inp)
    return listing.quantile_samples(pred, SAMPLES, seed), pred


def _allotted_lots(od) -> float:
    """Lots a WINNING application receives: the minimum when it was a lottery, else the expected share of the bid."""
    return od["expected_lots"] if od["p_win"] >= 1 else od["min_lots"]


def _profit(ipo, lots, gains):
    """Profit samples for an allotment of `lots` lots sold at the listing open, after charges and tax."""
    price = ipo["price"]
    return net_of_sale(lots * ipo["lot_size"], price, price * (1 + np.asarray(gains) / 100), long_term=False,
                       surcharge=ipo.get("surcharge", 0.0))["profit"]


def _app_value(ipo, od, gains, objective) -> float:
    """Expected money made by ONE application, after charges and tax, if you sell at the listing open."""
    g = np.array([np.quantile(gains, 0.1)]) if objective == "cautious" else gains
    return od["p_win"] * float(np.mean(_profit(ipo, _allotted_lots(od), g)))


def plan(*, budget: float, ipos: list[dict], accounts: int = 1, objective: str = "expected", apply_on: str = "last_day",
         surcharge: float = 0.0) -> dict:
    if not ipos:
        return {"ok": False, "error": "Add at least one IPO."}
    if len(ipos) > MAX_IPOS:
        return {"ok": False, "error": f"At most {MAX_IPOS} IPOs at a time."}
    accounts = max(1, min(int(accounts), 6))
    notes, prepared = [], []

    for i, raw in enumerate(ipos):
        ipo = dict(raw)
        ipo["board"] = "SME" if str(ipo.get("board", "")).upper() == "SME" else "MAINBOARD"
        ipo["name"] = (ipo.get("name") or f"IPO {i + 1}").strip()[:80]
        ipo["issue_price"] = ipo["price"] = float(ipo["price"])
        ipo["lot_size"] = int(ipo["lot_size"])
        ipo["surcharge"] = surcharge
        close = _d(ipo["close_date"])
        open_ = _d(ipo.get("open_date") or close)
        listing_day = _d(ipo["listing_date"]) if ipo.get("listing_date") else add_working_days(close, v("listing_days_after_close"))
        start = close if apply_on == "last_day" else open_
        unblock = add_working_days(close, v("unblock_days_after_close"))
        money_back = add_working_days(listing_day, v("sale_settlement_days"))
        sub = ipo.get("expected_subscription") or ipo.get("sub_retail")
        if not sub:
            return {"ok": False, "error": f"{ipo['name']}: give the expected retail subscription (e.g. 40 for 40x)."}
        gains, pred = _gain_samples(ipo, seed=17 + i)
        options = []
        m = allotment.min_lots(ipo["board"])
        lot_choices = [m]
        cap_lots = allotment.max_retail_lots(ipo["lot_size"], ipo["price"])
        od_min = allotment.odds(board=ipo["board"], subscription=float(sub), lot_size=ipo["lot_size"], price=ipo["price"],
                                lots_applied=m, applications=ipo.get("applications"), reserved_shares=ipo.get("reserved_shares"))
        if od_min["p_win"] >= 1 and cap_lots > m:
            lot_choices.append(cap_lots)   # odds are full: a bigger bid gets more shares
        for lots in lot_choices:
            od = od_min if lots == m else allotment.odds(board=ipo["board"], subscription=float(sub), lot_size=ipo["lot_size"],
                                                          price=ipo["price"], lots_applied=lots, applications=ipo.get("applications"),
                                                          reserved_shares=ipo.get("reserved_shares"))
            value_one = _app_value(ipo, od, gains, objective)
            amount = lots * ipo["lot_size"] * ipo["price"]
            for n in range(1, accounts + 1):
                options.append({"apps": n, "lots": lots, "amount_per_app": amount, "capital": n * amount,
                                "value": n * value_one, "odds": od})
        options = [o for o in options if o["value"] > 0 and o["capital"] <= budget]
        prepared.append({**ipo, "sub": float(sub), "start": start, "unblock": unblock, "listing_day": listing_day,
                         "money_back": money_back, "options": options, "odds": od_min, "pred": pred, "gains": gains,
                         "profit_if_allotted": summary(_profit(ipo, m, gains))})

    # ---- branch and bound: maximise total value, capital reserved on any day <= budget ----
    days = sorted({p["start"] for p in prepared} | {p["money_back"] for p in prepared})
    span = {i: [d for d in days if p["start"] <= d <= p["money_back"]] for i, p in enumerate(prepared)}
    order = sorted(range(len(prepared)), key=lambda i: -max([o["value"] for o in prepared[i]["options"]] or [0]))
    best_rest = [0.0] * (len(order) + 1)
    for k in range(len(order) - 1, -1, -1):
        best_rest[k] = best_rest[k + 1] + max([o["value"] for o in prepared[order[k]]["options"]] or [0])
    usage = {d: 0.0 for d in days}
    best = {"value": 0.0, "choice": {}}
    nodes = [0]
    exhausted = [False]

    def dfs(k, value, choice):
        nodes[0] += 1
        if nodes[0] > NODE_BUDGET:
            exhausted[0] = True
            return
        if value > best["value"] + 1e-9:
            best["value"], best["choice"] = value, dict(choice)
        if k == len(order) or value + best_rest[k] <= best["value"] + 1e-9:
            return
        i = order[k]
        for o in sorted(prepared[i]["options"], key=lambda o: -o["value"]):
            if all(usage[d] + o["capital"] <= budget + 1e-6 for d in span[i]):
                for d in span[i]:
                    usage[d] += o["capital"]
                choice[i] = o
                dfs(k + 1, value + o["value"], choice)
                del choice[i]
                for d in span[i]:
                    usage[d] -= o["capital"]
        dfs(k + 1, value, choice)   # skip this IPO

    dfs(0, 0.0, {})
    if exhausted[0]:
        notes.append("Search stopped at its node budget; the plan shown is the best found, not proven optimal.")

    # ---- naive comparison: one account, minimum lots, apply in date order while money lasts ----
    naive_usage = {d: 0.0 for d in days}
    naive_value = 0.0
    for i in sorted(range(len(prepared)), key=lambda i: prepared[i]["start"]):
        p = prepared[i]
        amt = allotment.min_lots(p["board"]) * p["lot_size"] * p["price"]
        if all(naive_usage[d] + amt <= budget + 1e-6 for d in span[i]):
            for d in span[i]:
                naive_usage[d] += amt
            naive_value += _app_value(p, p["odds"], p["gains"], objective)

    # ---- simulate the chosen plan: lotteries per application, one listing gain per IPO ----
    rng = np.random.default_rng(99)
    total = np.zeros(SIMS)
    any_win = np.zeros(SIMS, bool)
    rows = []
    for i, p in enumerate(prepared):
        o = best["choice"].get(i)
        overlaps = [prepared[j]["name"] for j in best["choice"] if j != i and set(span[i]) & set(span[j])]
        if o:
            # every account sees the same listing price (one gain sample per IPO), but its own lottery draw
            profit_per_win = _profit(p, _allotted_lots(o["odds"]), p["gains"])[rng.integers(0, SAMPLES, SIMS)]
            wins = rng.random((SIMS, o["apps"])) < o["odds"]["p_win"]
            total += wins.sum(axis=1) * profit_per_win
            any_win |= wins.any(axis=1)
            reason = None
        else:
            if not p["options"]:
                amt = allotment.min_lots(p["board"]) * p["lot_size"] * p["price"]
                reason = (f"One application needs ₹{amt:,.0f}, more than the budget." if amt > budget
                          else "Expected result after charges and tax is not positive at these odds and this range.")
            else:
                reason = "Budget is better used on overlapping IPOs: " + ", ".join(
                    prepared[j]["name"] for j in best["choice"] if set(span[i]) & set(span[j])) + "."
        rows.append({
            "name": p["name"], "board": p["board"], "price": p["price"], "lot_size": p["lot_size"],
            "decision": "apply" if o else "skip", "reason": reason,
            "applications": o["apps"] if o else 0, "lots_per_application": o["lots"] if o else allotment.min_lots(p["board"]),
            "amount_per_application": round(o["amount_per_app"]) if o else round(allotment.min_lots(p["board"]) * p["lot_size"] * p["price"]),
            "capital_reserved": round(o["capital"]) if o else 0,
            "p_win_one": p["odds"]["p_win"], "p_win_bounds": [p["odds"]["p_win_low"], p["odds"]["p_win_high"]],
            "odds_method": p["odds"]["method"],
            "p_any": round(allotment.across_accounts(o["odds"]["p_win"], o["apps"]), 4) if o else 0.0,
            "expected_value": round(o["value"]) if o else 0,
            "profit_if_allotted": p["profit_if_allotted"],
            "gain_range_pct": p["pred"]["range_pct"], "gain_source": p["pred"].get("method_label"),
            "apply_on": p["start"].isoformat(), "unblock_if_not_allotted": p["unblock"].isoformat(),
            "listing_date": p["listing_day"].isoformat(), "money_back_if_allotted": p["money_back"].isoformat(),
            "overlaps_with": overlaps, "odds_notes": p["odds"].get("notes", []),
        })

    timeline = [{"date": d.isoformat(), "reserved": round(sum(best["choice"][i]["capital"] for i in best["choice"] if d in span[i]))}
                for d in days]
    peak = max([t["reserved"] for t in timeline] or [0])
    s = summary(total)
    return {
        "ok": True, "budget": budget, "accounts": accounts, "objective": objective, "apply_on": apply_on,
        "ipos": rows, "timeline": timeline,
        "totals": {"expected": round(best["value"]), "range": s, "p_loss": round(float(np.mean(total < 0)), 3),
                   "p_no_allotment": round(float(np.mean(~any_win)), 3), "peak_capital": peak,
                   "return_on_peak_pct": round(100 * best["value"] / peak, 2) if peak else 0.0,
                   "naive_expected": round(naive_value),
                   "uplift_vs_naive": round(best["value"] - naive_value)},
        "assumptions": [
            "You sell everything allotted at the listing-day open. The Sell timing tool compares holding longer.",
            "Charges: STT, exchange, SEBI fee, GST and one DP charge per sale. Short-term capital gains tax at 20% + 4% cess"
            + (f" + {surcharge:.0%} surcharge" if surcharge else "") + " on gains; a loss is not set off against anything.",
            "Capital is reserved from the application day to the day sale money arrives if allotted, so the plan never over-commits.",
            "Working days skip weekends only; exchange holidays push dates later.",
            "Separate accounts mean separate PANs (each family member's own demat). Two bids from one PAN in one IPO are rejected.",
            ("Objective: maximise expected profit." if objective == "expected"
             else "Objective: cautious, every IPO is valued as if it lists at the bottom (10th percentile) of its range."),
        ],
        "notes": notes,
        "disclaimer": "A plan from stated odds and ranges, not investment advice. Lotteries are random: the range shows what can happen.",
    }
