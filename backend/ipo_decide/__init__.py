"""Decision desk: three tools that help a retail investor decide, not just watch.

  listing.py      Calibrated listing-gain range (conformalised quantile model + baselines, honest backtest)
  apply_plan.py   Multi-IPO application planner (odds, blocked capital over time, expected value)
  sell_timing.py  Net-of-tax, net-of-cost sell-timing (listing day vs. holding vs. waiting for LTCG)

Rules (tax, allotment, timelines) live in rules.py with the source and an "as of" date for each,
so a rule change is one edit, and the UI can show what every number assumes.
"""
