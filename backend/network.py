"""Feature 1: Promoter Network Map. Subgraph around a person/company, N hops deep, with red-flag links.

A link is marked "red flag / needs review" when two or more companies share an address, phone or email,
or when one vendor is used by several companies. These are computed from stored relations, with the
source URL and fetch time of the underlying facts attached. A flag is a reason to look closer, not a verdict.
"""
import json

from store import db, find_entity

LINK_KINDS = {"address": "address", "phone": "phone number", "email": "email"}
HAS = {"HAS_ADDRESS", "HAS_PHONE", "HAS_EMAIL"}


def _node(con, row, flagged=False, reasons=None):
    facts = [dict(f) for f in con.execute(
        "SELECT field,value,source_url,fetched_at FROM fact WHERE entity_id=?", (row["id"],))]
    return {"id": row["id"], "kind": row["kind"], "label": row["name"], "attrs": json.loads(row["attrs"]),
            "facts": facts, "flagged": flagged, "reasons": reasons or []}


def graph(query: str, depth: int = 2) -> dict:
    con = db()
    start = find_entity(con, query)
    if not start:
        con.close()
        return {"found": False, "query": query, "nodes": [], "edges": [], "flags": []}

    depth = max(1, min(depth, 3))
    seen, frontier = {start["id"]}, {start["id"]}
    rel_ids: set[int] = set()
    for _ in range(depth):
        nxt = set()
        for nid in frontier:
            for r in con.execute("SELECT * FROM relation WHERE src_id=? OR dst_id=?", (nid, nid)):
                rel_ids.add(r["id"])
                for other in (r["src_id"], r["dst_id"]):
                    if other not in seen:
                        seen.add(other)
                        nxt.add(other)
        frontier = nxt

    # one extra hop from link nodes (address/phone/email/vendor) so shared links show who else is on them
    kinds = {r["id"]: r["kind"] for r in con.execute(f"SELECT id,kind FROM entity WHERE id IN ({','.join('?' * len(seen))})", list(seen))}
    for nid in [i for i, k in kinds.items() if k in LINK_KINDS or k == "vendor"]:
        for r in con.execute("SELECT * FROM relation WHERE src_id=? OR dst_id=?", (nid, nid)):
            rel_ids.add(r["id"])
            seen.update((r["src_id"], r["dst_id"]))

    ph = ",".join("?" * len(seen))
    ents = {r["id"]: r for r in con.execute(f"SELECT * FROM entity WHERE id IN ({ph})", list(seen))}
    rels = [r for r in con.execute(f"SELECT * FROM relation WHERE src_id IN ({ph}) AND dst_id IN ({ph})",
                                   list(seen) * 2)]

    # who is attached to each link node
    users: dict[int, set[int]] = {}
    for r in rels:
        if r["rel"] in HAS or r["rel"] == "USES_VENDOR":
            users.setdefault(r["dst_id"], set()).add(r["src_id"])

    flags, flagged_nodes = [], {}
    for nid, comp in users.items():
        e = ents.get(nid)
        if not e or len(comp) < 2:
            continue
        names = sorted(ents[c]["name"] for c in comp if c in ents)
        what = ("Vendor used by" if e["kind"] == "vendor" else f"Shared {LINK_KINDS[e['kind']]} across") + f" {len(comp)} companies"
        reason = f"{what}: {', '.join(names)}"
        flagged_nodes[nid] = reason
        for c in comp:
            flagged_nodes.setdefault(c, reason)
        flags.append({"kind": e["kind"], "node": nid, "label": e["name"], "reason": reason, "companies": names})

    edges = []
    for r in rels:
        bad = r["dst_id"] in flagged_nodes and (r["rel"] in HAS or r["rel"] == "USES_VENDOR")
        edges.append({"id": r["id"], "from": r["src_id"], "to": r["dst_id"], "rel": r["rel"], "flagged": bad,
                      "reason": flagged_nodes.get(r["dst_id"]) if bad else None,
                      "source_url": r["source_url"], "fetched_at": r["fetched_at"]})
    nodes = [_node(con, e, e["id"] in flagged_nodes, [flagged_nodes[e["id"]]] if e["id"] in flagged_nodes else [])
             for e in ents.values()]
    con.close()
    return {"found": True, "query": query, "start": start["id"], "depth": depth, "nodes": nodes, "edges": edges,
            "flags": flags}
