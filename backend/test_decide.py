"""Tests for the decision desk (ipo_decide): rules, odds, listing range, planner, sell timing, import, routes.

  python -m unittest test_decide -v      (from backend/)
"""
import csv
import os
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest import mock

import numpy as np

os.environ.setdefault("DEMO_MODE", "1")   # never hit the network from tests

from ipo_decide import allotment, apply_plan, history, listing, rules, sell_timing
from ipo_decide.money import net_of_sale


class TestRules(unittest.TestCase):
    def test_long_term_needs_more_than_twelve_months(self):
        a = date(2025, 3, 10)
        self.assertFalse(rules.is_long_term(a, date(2026, 3, 10)))   # exactly 12 months: still short term
        self.assertTrue(rules.is_long_term(a, date(2026, 3, 11)))
        self.assertEqual(rules.first_long_term_day(a), date(2026, 3, 11))

    def test_month_end_allotment(self):
        self.assertEqual(rules.add_months(date(2025, 1, 31), 1), date(2025, 2, 28))

    def test_working_days_skip_weekends(self):
        self.assertEqual(rules.add_working_days(date(2026, 10, 23), 1), date(2026, 10, 26))   # Fri -> Mon

    def test_stcg_and_ltcg_tax(self):
        st = rules.capital_gains_tax(10000, long_term=False)
        self.assertAlmostEqual(st["tax"], 10000 * 0.20 * 1.04)
        lt = rules.capital_gains_tax(200000, long_term=True)
        self.assertAlmostEqual(lt["tax"], (200000 - 125000) * 0.125 * 1.04)
        self.assertEqual(rules.capital_gains_tax(-500, long_term=False)["tax"], 0)

    def test_net_of_sale_matches_hand_calculation(self):
        r = net_of_sale(100, 100.0, np.array([150.0]), long_term=False)
        value = 15000
        stt, exch, sebi = value * 0.001, value * 0.0000297, value * 0.000001
        charges = stt + exch + sebi + (exch + sebi) * 0.18 + 16
        gain = value - 10000 - (charges - stt)
        expected_tax = gain * 0.20 * 1.04
        self.assertAlmostEqual(float(r["tax"][0]), expected_tax, places=4)
        self.assertAlmostEqual(float(r["profit"][0]), value - charges - expected_tax - 10000, places=4)


class TestAllotment(unittest.TestCase):
    def test_bounds_without_application_count(self):
        o = allotment.odds(board="MAINBOARD", subscription=40, lot_size=30, price=500)
        self.assertEqual(o["method"], "bounds")
        self.assertAlmostEqual(o["p_win"], 1 / 40, places=5)
        self.assertGreater(o["p_win_high"], o["p_win_low"])

    def test_exact_with_application_count(self):
        # 300,000 reserved shares, lot 30 -> 10,000 minimum allotments for 400,000 applications
        o = allotment.odds(board="MAINBOARD", subscription=60, lot_size=30, price=500, applications=400000, reserved_shares=300000)
        self.assertEqual(o["method"], "exact")
        self.assertAlmostEqual(o["p_win"], 0.025)

    def test_sme_minimum_is_two_lots(self):
        o = allotment.odds(board="SME", subscription=10, lot_size=1000, price=100)
        self.assertEqual(o["min_lots"], 2)

    def test_undersubscribed_gets_everything(self):
        o = allotment.odds(board="MAINBOARD", subscription=0.7, lot_size=30, price=500, lots_applied=5)
        self.assertEqual(o["p_win"], 1.0)
        self.assertEqual(o["expected_lots"], 5)

    def test_more_lots_do_not_raise_lottery_odds(self):
        a = allotment.odds(board="MAINBOARD", subscription=50, lot_size=30, price=500, lots_applied=1)
        b = allotment.odds(board="MAINBOARD", subscription=50, lot_size=30, price=500, lots_applied=10)
        self.assertEqual(a["p_win"], b["p_win"])

    def test_across_accounts(self):
        self.assertAlmostEqual(allotment.across_accounts(0.1, 3), 1 - 0.9 ** 3)


class TestListingModel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = listing.get_model()

    def test_card_reports_all_methods_and_coverage(self):
        card = self.model["card"]
        self.assertEqual(set(card["evaluation"]), {"baseline_board", "baseline_gmp", "cqr"})
        cov = card["evaluation"][card["chosen"]]["all"]["coverage"]
        self.assertGreater(cov, 0.70)
        self.assertLess(cov, 0.92)

    def test_chosen_method_is_best_by_interval_score(self):
        card = self.model["card"]
        basis = "real" if card["selection_basis"].startswith("real") else "all"
        scores = {k: e[basis]["interval_score"] for k, e in card["evaluation"].items()}
        self.assertEqual(card["chosen"], min(scores, key=scores.get))

    def test_range_is_ordered_and_sme_capped(self):
        r = listing.predict({"board": "SME", "issue_price": 100, "sub_total": 900, "sub_nii": 1500, "sub_retail": 600, "gmp_pct": 120})
        rp = r["range_pct"]
        self.assertLessEqual(rp["lo"], rp["median"])
        self.assertLessEqual(rp["median"], rp["hi"])
        self.assertLessEqual(rp["hi"], 90.0)
        self.assertIn("range_price", r)

    def test_more_demand_never_lowers_median(self):
        lo = listing.predict({"board": "MAINBOARD", "sub_total": 2, "sub_qib": 2, "sub_retail": 2, "sub_nii": 2})
        hi = listing.predict({"board": "MAINBOARD", "sub_total": 80, "sub_qib": 150, "sub_retail": 20, "sub_nii": 90})
        self.assertGreaterEqual(hi["range_pct"]["median"], lo["range_pct"]["median"])

    def test_partial_inputs_follow_gmp(self):
        # only retail subscription and GMP known: a clearly negative GMP must give a negative middle
        weak = listing.predict({"board": "MAINBOARD", "sub_retail": 0.8, "gmp_pct": -12})
        strong = listing.predict({"board": "MAINBOARD", "sub_retail": 0.8, "gmp_pct": 40})
        self.assertLess(weak["range_pct"]["median"], 0)
        self.assertGreater(strong["range_pct"]["median"], 10)

    def test_analogs_are_same_board(self):
        r = listing.predict({"board": "SME", "sub_total": 50})
        self.assertTrue(all(a["board"] == "SME" for a in r["analogs"]["closest"]))
        self.assertGreater(r["analogs"]["p_loss"], 0)

    def test_warns_when_mostly_synthetic(self):
        r = listing.predict({"board": "MAINBOARD", "sub_total": 10})
        if not r["model_card"]["synthetic_retired"]:
            self.assertTrue(any("synthetic" in w for w in r["warnings"]))

    def test_quantile_samples_respect_range(self):
        pred = {"board": "MAINBOARD", "range_pct": {"lo": -5, "median": 10, "hi": 30}}
        s = listing.quantile_samples(pred, 20000)
        self.assertAlmostEqual(float(np.median(s)), 10, delta=1.0)
        self.assertAlmostEqual(float(np.quantile(s, 0.1)), -5, delta=1.5)
        self.assertAlmostEqual(float(np.quantile(s, 0.9)), 30, delta=1.5)


class TestImport(unittest.TestCase):
    def test_aliases_and_derived_open(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "kaggle.csv"
            with open(src, "w", newline="") as fh:
                w = csv.writer(fh)
                w.writerow(["Date", "IPOName", "Issue_Size", "Subscription_QIB", "Subscription_HNI", "Subscription_RII",
                            "Subscription_Total", "Issue_price", "Listing_Gains_Percent"])
                w.writerow(["03/02/2022", "Alpha Ltd", "1500", "45.2", "80.1", "12.3", "40.5", "300", "12.5"])
                w.writerow(["", "No Date Ltd", "100", "1", "1", "1", "1", "100", "5"])
            with mock.patch.object(history, "REAL_CSV", Path(tmp) / "out.csv"):
                out = history.import_csv(str(src), board="MAINBOARD", source="test")
                rows = history.load_real()
        self.assertEqual(out["kept"], 1)
        self.assertEqual(out["skipped"], 1)
        self.assertEqual(rows[0]["listing_date"], "2022-02-03")
        self.assertAlmostEqual(rows[0]["listing_open"], 337.5)
        self.assertAlmostEqual(rows[0]["sub_nii"], 80.1)


class TestPlanner(unittest.TestCase):
    IPOS = [
        dict(name="Hot SME", board="SME", price=120, lot_size=1000, close_date="2026-10-28", expected_subscription=150,
             gain_range={"lo": 20, "median": 50, "hi": 85}),
        dict(name="Good Mainboard", board="MAINBOARD", price=400, lot_size=37, close_date="2026-10-29", expected_subscription=12,
             gain_range={"lo": 5, "median": 20, "hi": 35}),
        dict(name="Weak", board="MAINBOARD", price=250, lot_size=60, close_date="2026-10-29", expected_subscription=0.8,
             gain_range={"lo": -15, "median": -5, "hi": 3}),
    ]

    def test_respects_budget_every_day(self):
        r = apply_plan.plan(budget=250000, ipos=self.IPOS, accounts=3)
        self.assertTrue(r["ok"])
        self.assertTrue(all(t["reserved"] <= 250000 for t in r["timeline"]))

    def test_skips_negative_expected_value(self):
        r = apply_plan.plan(budget=500000, ipos=self.IPOS, accounts=2)
        weak = next(x for x in r["ipos"] if x["name"] == "Weak")
        self.assertEqual(weak["decision"], "skip")
        self.assertIn("not positive", weak["reason"])

    def test_beats_or_equals_naive(self):
        r = apply_plan.plan(budget=300000, ipos=self.IPOS, accounts=2)
        self.assertGreaterEqual(r["totals"]["expected"], r["totals"]["naive_expected"])

    def test_more_accounts_more_value_when_affordable(self):
        one = apply_plan.plan(budget=1000000, ipos=self.IPOS[:2], accounts=1)["totals"]["expected"]
        three = apply_plan.plan(budget=1000000, ipos=self.IPOS[:2], accounts=3)["totals"]["expected"]
        self.assertGreater(three, one)

    def test_unaffordable_ipo_explains_why(self):
        r = apply_plan.plan(budget=50000, ipos=self.IPOS[:1], accounts=1)
        self.assertEqual(r["ipos"][0]["decision"], "skip")
        self.assertIn("more than the budget", r["ipos"][0]["reason"])

    def test_deterministic(self):
        a = apply_plan.plan(budget=300000, ipos=self.IPOS, accounts=2)
        b = apply_plan.plan(budget=300000, ipos=self.IPOS, accounts=2)
        self.assertEqual(a["totals"], b["totals"])


class TestSellTiming(unittest.TestCase):
    def test_upcoming_has_listing_and_tax_switch(self):
        r = sell_timing.analyse(board="MAINBOARD", issue_price=400, shares=37, listing_date="2026-11-03",
                                gain_range={"lo": 5, "median": 20, "hi": 35}, today="2026-10-24")
        keys = [h["key"] for h in r["horizons"]]
        self.assertEqual(keys[0], "listing_open")
        self.assertIn("first_long", keys)
        types = {h["key"]: h["tax_type"] for h in r["horizons"]}
        self.assertEqual(types["last_short"], "STCG")
        self.assertEqual(types["first_long"], "LTCG")
        self.assertIsNotNone(r["ltcg_wait"]["breakeven_fall_pct"])

    def test_listed_position_starts_now(self):
        r = sell_timing.analyse(board="SME", issue_price=100, shares=2000, current_price=130, allotment_date="2026-03-02",
                                listing_date="2026-03-04", today="2026-10-24")
        self.assertEqual(r["horizons"][0]["key"], "now")
        self.assertEqual(r["horizons"][0]["profit"]["p10"], r["horizons"][0]["profit"]["p90"])

    def test_flat_price_long_term_keeps_more(self):
        # zero volatility: the only difference between the two days is the tax
        r = sell_timing.analyse(board="MAINBOARD", issue_price=100, shares=1000, current_price=200, allotment_date="2025-11-20",
                                listing_date="2025-11-24", daily_vol_pct=0.0001, today="2026-10-24")
        h = {x["key"]: x for x in r["horizons"]}
        self.assertGreater(h["first_long"]["profit"]["p50"], h["last_short"]["profit"]["p50"])


class TestRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        import main
        cls.c = TestClient(main.app)

    def test_listing_route(self):
        r = self.c.post("/api/decide/listing", json={"board": "SME", "issue_price": 90, "sub_total": 120, "auto_market": False})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertIn("range_pct", r.json())

    def test_bad_range_rejected(self):
        r = self.c.post("/api/decide/plan", json={"budget": 100000, "ipos": [{"name": "X", "board": "SME", "price": 100, "lot_size": 1000,
                        "close_date": "2026-10-28", "expected_subscription": 10, "gain_range": {"lo": 10, "median": 5, "hi": 20}}]})
        self.assertEqual(r.status_code, 422)

    def test_plan_and_sell_routes(self):
        p = self.c.post("/api/decide/plan", json={"budget": 300000, "accounts": 2, "ipos": TestPlanner.IPOS})
        self.assertEqual(p.status_code, 200, p.text)
        s = self.c.post("/api/decide/sell", json={"board": "SME", "issue_price": 120, "shares": 2000, "listing_date": "2026-11-03",
                                                  "model_inputs": {"board": "SME", "sub_total": 150, "auto_market": False}})
        self.assertEqual(s.status_code, 200, s.text)

    def test_rules_and_odds(self):
        self.assertEqual(self.c.get("/api/decide/rules").status_code, 200)
        o = self.c.post("/api/decide/odds", json={"board": "MAINBOARD", "subscription": 20, "lot_size": 30, "price": 500, "accounts": 3})
        self.assertAlmostEqual(o.json()["p_any_account"], 1 - (1 - 0.05) ** 3, places=4)


if __name__ == "__main__":
    unittest.main()
