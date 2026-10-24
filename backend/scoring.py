"""ML-driven scoring. Agents produce signals; the model turns them into a probability and says how
much each signal moved it. Severity of a flag = its contribution to the model's score."""
from ml.features import build
from ml.model import get_model

ORDER = ["critical", "high", "medium", "low", "unverified", "clear"]


def _severity(points):
    if points >= 15:
        return "critical"
    if points >= 7:
        return "high"
    if points >= 3:
        return "medium"
    if points >= 1:
        return "low"
    return None


def assess(outcomes):
    feats, signals = build(outcomes)
    pred = get_model().predict(feats)
    flags = []
    for feature, sigs in signals.items():
        pts = round(100 * pred["contributions"].get(feature, 0.0), 1)
        sev = _severity(pts)
        if not sev:
            continue
        for s in sigs:
            flags.append({**s, "severity": sev, "points": pts})
    for o in outcomes:
        if not isinstance(o["result"], dict):
            t = o["task"]
            flags.append({"agent": t["id"], "claim_id": t["claim_id"], "kind": t["kind"], "target": t["target"],
                          "feature": "unverified_frac", "severity": "unverified", "points": 0,
                          "title": "Could not verify", "detail": "The agent did not return usable evidence. Check this claim by hand.", "evidence": []})
    flags.sort(key=lambda f: (ORDER.index(f["severity"]), -f["points"]))
    return feats, pred, flags


def findings_for(agent_id, flags):
    mine = [f for f in flags if f["agent"] == agent_id]
    return mine or [{"agent": agent_id, "severity": "clear", "title": "Checks out", "points": 0,
                     "detail": "Nothing here raised the model's risk estimate."}]


def verdict(score):
    if score >= 60:
        return "High risk"
    if score >= 30:
        return "Proceed with caution"
    return "No major red flags found"


def build_report(company, claims, outcomes, feats, pred, flags, demo=False):
    status = {}
    for o in outcomes:
        cid = o["task"]["claim_id"]
        for f in findings_for(o["task"]["id"], flags):
            cur = status.get(cid)
            if cur is None or ORDER.index(f["severity"]) < ORDER.index(cur):
                status[cid] = f["severity"]
    m = get_model().meta
    return {
        "company": company, "score": pred["score"], "probability": pred["probability"], "verdict": verdict(pred["score"]),
        "flags": [f for f in flags], "drivers": pred.get("drivers", []), "anomaly_pct": pred.get("anomaly_pct"),
        "verified": [c for c in claims if status.get(c["id"]) == "clear"], "claim_status": status,
        "features": {k: (None if v != v else v) for k, v in feats.items()},
        "model": {"name": m["model"], "n_synthetic": m["n_synthetic"], "n_real": m["n_real"],
                  "auc_synthetic_holdout": m["auc_synthetic_holdout"], "auc_real": m["auc_real"], "trained_at": m["trained_at"]},
        "agents_run": len(outcomes), "demo": demo,
        "disclaimer": "Automated open-web screening scored by a statistical model. Not investment advice and not proof of wrongdoing. Verify every flag before acting.",
    }
