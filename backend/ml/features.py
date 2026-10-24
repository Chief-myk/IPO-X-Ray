"""Agent results -> (a) factual signals tied to claims and sources, (b) one feature vector per IPO.

No severities or weights live here. Signals are just observations; the model decides how much
each one matters (see model.py)."""
import math

NAN = float("nan")

FEATURES = [
    "vendor_linked_promoter", "vendor_no_web_frac", "vendor_registry_bad", "vendor_min_employees",
    "min_domain_age_days", "client_unconfirmed_frac", "director_sebi_orders", "director_vendor_overlap",
    "director_struck_off_max", "address_no_business", "address_residential", "growth_multiple",
    "log_employees", "company_sebi_orders", "company_court_cases", "complaints_count", "unverified_frac",
]

FEATURE_TEXT = {
    "vendor_linked_promoter": "Vendor linked to promoter",
    "vendor_no_web_frac": "Vendors with no web presence",
    "vendor_registry_bad": "Vendors missing from the registry",
    "vendor_min_employees": "Smallest key vendor's staff",
    "min_domain_age_days": "Youngest vendor website",
    "client_unconfirmed_frac": "Clients who never name the issuer",
    "director_sebi_orders": "SEBI orders naming directors",
    "director_vendor_overlap": "Directors also tied to vendors",
    "director_struck_off_max": "Struck-off companies in director history",
    "address_no_business": "No business at registered office",
    "address_residential": "Registered office looks residential",
    "growth_multiple": "One-year revenue growth",
    "log_employees": "Visible headcount",
    "company_sebi_orders": "Regulator orders on the issuer",
    "company_court_cases": "Court cases",
    "complaints_count": "Investor complaints",
    "unverified_frac": "Claims agents could not verify",
}


def _num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def _urls(items):
    out = []
    for it in items or []:
        u = it.get("url") if isinstance(it, dict) else it
        if isinstance(u, str) and u.startswith("http"):
            out.append(u)
    return out[:5]


def _sig(task, feature, title, detail, evidence=None, val=None):
    return {"agent": task["id"], "claim_id": task["claim_id"], "kind": task["kind"], "target": task["target"],
            "feature": feature, "title": title, "detail": detail, "evidence": _urls(evidence), "val": val}


def build(outcomes):
    """Returns (features: dict, signals: dict feature -> [signal])."""
    sig = {f: [] for f in FEATURES}
    acc = {"vendor_link": [], "vendor_noweb": [], "vendor_reg": 0, "vendor_emp": [], "ages": [], "client_unconf": [],
           "dir_sebi": 0, "dir_overlap": 0, "dir_struck": [], "addr_nobiz": [], "addr_res": [], "growth": None,
           "emp": None, "co_sebi": 0, "co_court": 0, "complaints": 0, "seen": set(), "unverified": 0, "total": 0}

    for o in outcomes:
        t, r = o["task"], o["result"]
        acc["total"] += 1
        if not isinstance(r, dict):
            acc["unverified"] += 1
            continue
        k, src = t["kind"], r.get("sources")
        acc["seen"].add(k)

        if k == "entity_check":
            link = bool(r.get("linked_to_promoter"))
            acc["vendor_link"].append(link)
            if link:
                sig["vendor_linked_promoter"].append(_sig(t, "vendor_linked_promoter", "Vendor appears related to the promoter",
                    r.get("link_evidence") or "The agent found a personal link between this vendor and the promoter group.", src))
            noweb = r.get("has_website") is False
            acc["vendor_noweb"].append(noweb)
            if noweb:
                sig["vendor_no_web_frac"].append(_sig(t, "vendor_no_web_frac", "No web presence", "No website or trace of real operations was found.", src))
            if str(r.get("registry_status", "")).lower() in {"struck off", "not found"}:
                acc["vendor_reg"] += 1
                sig["vendor_registry_bad"].append(_sig(t, "vendor_registry_bad", f"Registry status: {r['registry_status']}", "The company register does not show an active entity.", src))
            e = _num(r.get("employees_estimate"))
            if e is not None:
                acc["vendor_emp"].append(e)
                sig["vendor_min_employees"].append(_sig(t, "vendor_min_employees", f"About {int(e)} visible employee{'s' if e != 1 else ''}", "Estimated from LinkedIn, job posts and directories.", src, val=e))

        elif k == "domain_age":
            a = _num(r.get("age_days"))
            if a is not None:
                acc["ages"].append(a)
                sig["min_domain_age_days"].append(_sig(t, "min_domain_age_days", f"Website is {int(a)} days old",
                    f"{r.get('domain', t['target'])} was registered on {r.get('created', 'an unknown date')}.", val=a))

        elif k == "client_mention":
            unconf = r.get("mentions_found") is False
            acc["client_unconf"].append(unconf)
            if unconf:
                sig["client_unconfirmed_frac"].append(_sig(t, "client_unconfirmed_frac", "Client never mentions the issuer",
                    "No tender, press release or report from this client names the company as a supplier."))

        elif k == "director_network":
            n = len(r.get("sebi_orders") or [])
            acc["dir_sebi"] += n
            if n:
                sig["director_sebi_orders"].append(_sig(t, "director_sebi_orders", "Director named in SEBI orders", f"{n} order(s) found.", (r.get("sebi_orders") or []) + (src or [])))
            shared = [s for s in r.get("shared_with_vendor") or [] if s]
            acc["dir_overlap"] += len(shared)
            if shared:
                sig["director_vendor_overlap"].append(_sig(t, "director_vendor_overlap", "Director also linked to a disclosed vendor", "Overlap with: " + ", ".join(shared), src))
            so = _num(r.get("struck_off_companies"))
            if so is not None:
                acc["dir_struck"].append(so)
                if so > 0:
                    sig["director_struck_off_max"].append(_sig(t, "director_struck_off_max", f"{int(so)} struck-off compan{'ies' if so != 1 else 'y'}", "Shut companies in this director's history.", src, val=so))

        elif k == "address_check":
            nb, rs = r.get("business_found") is False, bool(r.get("looks_residential"))
            acc["addr_nobiz"].append(nb)
            acc["addr_res"].append(rs)
            if nb:
                sig["address_no_business"].append(_sig(t, "address_no_business", "No business at the stated address", "Maps and directories show no operating business here."))
            if rs:
                sig["address_residential"].append(_sig(t, "address_residential", "Address looks residential", "Listings suggest a home, not an office or plant."))

        elif k == "financial_sanity":
            g = _num(r.get("growth_multiple")) or _num((t.get("meta") or {}).get("growth"))
            e = _num(r.get("employees_estimate"))
            if g is not None:
                acc["growth"] = g
                sig["growth_multiple"].append(_sig(t, "growth_multiple", f"Revenue up {g:g}x in a year", r.get("footprint_note") or "Reported growth from the DRHP.", src, val=g))
            if e is not None:
                acc["emp"] = e
                sig["log_employees"].append(_sig(t, "log_employees", f"About {int(e)} people work there", r.get("footprint_note") or "Estimated from LinkedIn and job portals.", src, val=e))

        elif k == "news_litigation":
            n = len(r.get("sebi_orders") or [])
            c = len(r.get("court_cases") or [])
            p = _num(r.get("complaints_count")) or 0
            acc["co_sebi"] += n
            acc["co_court"] += c
            acc["complaints"] += p
            if n:
                sig["company_sebi_orders"].append(_sig(t, "company_sebi_orders", "Regulator orders on record", f"{n} SEBI or exchange order(s).", r.get("sebi_orders")))
            if c:
                sig["company_court_cases"].append(_sig(t, "company_court_cases", f"{c} court case{'s' if c != 1 else ''} found", "Found in public records or news.", r.get("court_cases")))
            if p:
                sig["complaints_count"].append(_sig(t, "complaints_count", f"{int(p)} investor complaint{'s' if p != 1 else ''}", "Found online."))

    # min/max features: only the claim that sets the value carries the signal
    def keep_extreme(feature, pick):
        vals = [(x.get("val") if x.get("val") is not None else 0.0, x) for x in sig[feature]]
        if vals:
            sig[feature] = [pick(vals, key=lambda v: v[0])[1]]
    keep_extreme("vendor_min_employees", min)
    keep_extreme("min_domain_age_days", min)
    keep_extreme("director_struck_off_max", max)

    seen = acc["seen"]
    mean = lambda xs: sum(xs) / len(xs) if xs else NAN
    f = {
        "vendor_linked_promoter": float(any(acc["vendor_link"])) if acc["vendor_link"] else NAN,
        "vendor_no_web_frac": mean(acc["vendor_noweb"]),
        "vendor_registry_bad": float(acc["vendor_reg"]) if "entity_check" in seen else NAN,
        "vendor_min_employees": min(acc["vendor_emp"]) if acc["vendor_emp"] else NAN,
        "min_domain_age_days": min(acc["ages"]) if acc["ages"] else NAN,
        "client_unconfirmed_frac": mean(acc["client_unconf"]),
        "director_sebi_orders": float(acc["dir_sebi"]) if "director_network" in seen else NAN,
        "director_vendor_overlap": float(acc["dir_overlap"]) if "director_network" in seen else NAN,
        "director_struck_off_max": max(acc["dir_struck"]) if acc["dir_struck"] else NAN,
        "address_no_business": float(any(acc["addr_nobiz"])) if acc["addr_nobiz"] else NAN,
        "address_residential": float(any(acc["addr_res"])) if acc["addr_res"] else NAN,
        "growth_multiple": acc["growth"] if acc["growth"] is not None else NAN,
        "log_employees": math.log1p(acc["emp"]) if acc["emp"] is not None else NAN,
        "company_sebi_orders": float(acc["co_sebi"]) if "news_litigation" in seen else NAN,
        "company_court_cases": float(acc["co_court"]) if "news_litigation" in seen else NAN,
        "complaints_count": float(acc["complaints"]) if "news_litigation" in seen else NAN,
        "unverified_frac": acc["unverified"] / acc["total"] if acc["total"] else NAN,
    }
    return f, sig
