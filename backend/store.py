"""Entity store (SQLite) + normalisation + ingest of cached/live agent results.

Tables: entity, fact, relation, vendor_score, snapshot, change, watchlist.
Every fact and relation keeps its source URL and the time it was fetched.
Derived links (shared address / phone / email, vendor used by several companies) are computed in
network.py from the HAS_* and USES_VENDOR relations, never guessed.
"""
import json
import os
import re
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH") or Path(__file__).resolve().parent.parent / "data" / "xray.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS entity(
  id INTEGER PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, norm_key TEXT NOT NULL,
  attrs TEXT NOT NULL DEFAULT '{}', UNIQUE(kind, norm_key));
CREATE TABLE IF NOT EXISTS fact(
  id INTEGER PRIMARY KEY, entity_id INTEGER NOT NULL, field TEXT NOT NULL, value TEXT,
  source_url TEXT, fetched_at TEXT, UNIQUE(entity_id, field, value));
CREATE TABLE IF NOT EXISTS relation(
  id INTEGER PRIMARY KEY, src_id INTEGER NOT NULL, dst_id INTEGER NOT NULL, rel TEXT NOT NULL,
  source_url TEXT, fetched_at TEXT, UNIQUE(src_id, dst_id, rel));
CREATE TABLE IF NOT EXISTS vendor_score(
  id INTEGER PRIMARY KEY, vendor_id INTEGER NOT NULL, run_at TEXT, score INTEGER, checks TEXT, sources TEXT);
CREATE TABLE IF NOT EXISTS snapshot(
  id INTEGER PRIMARY KEY, subject TEXT NOT NULL, taken_at TEXT NOT NULL, payload TEXT NOT NULL, simulated INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS change(
  id INTEGER PRIMARY KEY, subject TEXT NOT NULL, detected_at TEXT NOT NULL, kind TEXT, detail TEXT,
  source_url TEXT, simulated INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS watchlist(subject TEXT PRIMARY KEY, added_at TEXT);
"""


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    return con


# ---- normalisation -----------------------------------------------------------------------------

_SUFFIX = re.compile(r"\b(private limited|pvt\.? ?ltd\.?|pvt|limited|ltd\.?|llp|opc)\b", re.I)


def norm_name(s: str) -> str:
    s = _SUFFIX.sub(" ", (s or "").lower())
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s)).strip()


def norm_address(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"\bplot\s*(?:no|number|nos)?\.?\s*[:#-]?\s*(\w)", r"plot \1", s)
    s = re.sub(r"\bno\.?\s*(\d)", r"\1", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_phone(s: str) -> str:
    d = re.sub(r"\D", "", s or "")
    if d.startswith("91") and len(d) > 10:
        d = d[2:]
    return d.lstrip("0") if len(d) > 10 else d


def norm_email(s: str) -> str:
    return (s or "").strip().lower()


def norm_key(kind: str, name: str) -> str:
    if kind == "address":
        return norm_address(name)
    if kind == "phone":
        return norm_phone(name)
    if kind == "email":
        return norm_email(name)
    if kind == "website":
        return re.sub(r"^https?://(www\.)?|/.*$", "", (name or "").lower())
    return norm_name(name)


# ---- writes ------------------------------------------------------------------------------------

def upsert_entity(con, kind: str, name: str, **attrs) -> int | None:
    name = (name or "").strip()
    key = norm_key(kind, name)
    if not name or not key:
        return None
    row = con.execute("SELECT id, attrs FROM entity WHERE kind=? AND norm_key=?", (kind, key)).fetchone()
    clean = {k: v for k, v in attrs.items() if v not in (None, "")}
    if row:
        merged = {**json.loads(row["attrs"]), **clean}
        con.execute("UPDATE entity SET attrs=? WHERE id=?", (json.dumps(merged, ensure_ascii=False), row["id"]))
        return row["id"]
    cur = con.execute("INSERT INTO entity(kind,name,norm_key,attrs) VALUES(?,?,?,?)",
                      (kind, name, key, json.dumps(clean, ensure_ascii=False)))
    return cur.lastrowid


def add_fact(con, entity_id, field, value, source_url, fetched_at):
    if entity_id and value not in (None, ""):
        con.execute("INSERT OR IGNORE INTO fact(entity_id,field,value,source_url,fetched_at) VALUES(?,?,?,?,?)",
                    (entity_id, field, str(value), source_url, fetched_at))


def add_relation(con, src, dst, rel, source_url, fetched_at):
    if src and dst and src != dst:
        con.execute("INSERT OR IGNORE INTO relation(src_id,dst_id,rel,source_url,fetched_at) VALUES(?,?,?,?,?)",
                    (src, dst, rel, source_url, fetched_at))


def _company(con, c: dict, fetched_at, fallback_src=None) -> int | None:
    """One company dict (name, cin, address, phone, email, website...) -> company entity + contact links."""
    cid = upsert_entity(con, "company", c.get("name"), cin=c.get("cin"), status=c.get("status"),
                        website=c.get("website"))
    src = c.get("source_url") or fallback_src
    for field in ("cin", "status", "website", "address", "phone", "email"):
        add_fact(con, cid, field, c.get(field), src, fetched_at)
    for kind, field, rel in (("address", "address", "HAS_ADDRESS"), ("phone", "phone", "HAS_PHONE"),
                             ("email", "email", "HAS_EMAIL")):
        if c.get(field):
            add_relation(con, cid, upsert_entity(con, kind, c[field]), rel, src, fetched_at)
    return cid


_VENDOR_ROLE = re.compile(r"vendor|tpv|supplier", re.I)
_PAREN = re.compile(r"\s*\([^)]*\)")
_PAREN_TXT = re.compile(r"\(([^)]*)\)")


def _clean_name(n):
    return _PAREN.sub("", n or "").strip()


def _own_site(url, source):
    """A vendor's website only counts if it is not just the page the agent read."""
    return None if not url or url == source or url.lower().endswith(".pdf") else url


_NOT_VENDOR = re.compile(r"merchant banker|lead manager|book running|auditor|chartered accountant|middleman|intermediary|"
                         r"typical source|typically sourced|referenced as|example of|as an example|mentioned in (the )?prospectus as", re.I)


def _is_tpv(raw_name, detail) -> bool:
    """The document itself labels this vendor a third-party vendor or shell entity."""
    paren = " ".join(_PAREN_TXT.findall(raw_name or "")).lower()
    return bool(re.search(r"vendor|tpv", paren)) or bool(re.search(r"shell (entity|company)", (detail or "").lower()))


def _link_vendor_people(con):
    """People the document describes as vendor directors belong to that vendor, not to the issuer."""
    tpvs = [v["id"] for v in con.execute("SELECT id, attrs FROM entity WHERE kind='vendor'") if json.loads(v["attrs"]).get("tpv")]
    if not tpvs:
        return
    for p in con.execute("SELECT id, attrs FROM entity WHERE kind='person'").fetchall():
        a = json.loads(p["attrs"])
        if a.get("works_for_vendor") and a.get("src"):
            for vid in tpvs:
                add_relation(con, p["id"], vid, "DIRECTS", a["src"], a.get("ts"))


def ingest(rec: dict, con=None) -> bool:
    """Ingest one collect() record (live or cached). Returns True if it carried data."""
    res, label, ts = rec.get("result"), rec.get("label", ""), rec.get("fetched_at") or now()
    if not isinstance(res, dict):
        return False
    own = con is None
    con = con or db()
    kind, _, subject = label.partition(":")
    fallback = (rec.get("sources") or [None])[0]
    if kind == "company":
        issuer = _company(con, res.get("company") or {"name": subject}, ts, fallback) if res.get("company") else upsert_entity(con, "company", subject)
        for p in res.get("people") or []:
            src = p.get("source_url") or fallback
            vendor_side = bool(_VENDOR_ROLE.search(p.get("role") or ""))
            pid = upsert_entity(con, "person", _clean_name(p.get("name")), din=p.get("din"), role=p.get("role"),
                                **({"works_for_vendor": True, "src": src, "ts": ts} if vendor_side else {}))
            add_fact(con, pid, "role", p.get("role"), src, ts)
            if not vendor_side:
                add_relation(con, pid, issuer, "DIRECTS", src, ts)
    elif kind == "relations":
        issuer = upsert_entity(con, "company", subject)
        for v in res.get("vendors") or []:
            if _NOT_VENDOR.search(v.get("detail") or "") and not _is_tpv(v.get("name"), v.get("detail")):
                continue          # bankers, auditors, middlemen and "typical examples" are not vendors
            src = v.get("source_url") or fallback
            vid = upsert_entity(con, "vendor", _clean_name(v.get("name")), website=_own_site(v.get("website"), src), detail=v.get("detail"),
                                **({"tpv": True} if _is_tpv(v.get("name"), v.get("detail")) else {}))
            add_fact(con, vid, "detail", v.get("detail"), src, ts)
            add_relation(con, issuer, vid, "USES_VENDOR", src, ts)
        for c in res.get("clients") or []:
            if re.search(r"investor|allottee|public|shareholder", c.get("name") or "", re.I):
                continue
            cid = upsert_entity(con, "company", _clean_name(c.get("name")), detail=c.get("detail"))
            add_relation(con, issuer, cid, "CLAIMS_CLIENT", c.get("source_url") or fallback, ts)
    elif kind == "director":
        person = res.get("person") or {"name": subject}
        pid = upsert_entity(con, "person", person.get("name") or subject, din=person.get("din"))
        for c in res.get("companies") or []:
            cid = _company(con, c, ts, fallback)
            add_relation(con, pid, cid, "DIRECTS", c.get("source_url") or fallback, ts)
    else:
        if own:
            con.close()
        return False
    _link_vendor_people(con)
    if own:
        con.commit()
        con.close()
    return True


def rebuild_from_cache(cache_dir: Path) -> int:
    """Re-ingest every cached agent response (used by demo mode and on startup)."""
    n = 0
    con = db()
    # entities, facts, relations and scores are all derived from the cache, so start clean: stale rows from an
    # older cache or older filters must not linger. Watchlist, snapshots and alerts are kept.
    for t in ("vendor_score", "relation", "fact", "entity"):
        con.execute(f"DELETE FROM {t}")
    for f in sorted(Path(cache_dir).glob("*.json")):
        try:
            if ingest(json.loads(f.read_text()), con):
                n += 1
        except (json.JSONDecodeError, sqlite3.Error):
            continue
    con.commit()
    con.close()
    return n


def find_entity(con, query: str):
    key = norm_name(query)
    rows = con.execute("SELECT * FROM entity WHERE kind IN ('company','person','vendor') AND norm_key=?", (key,)).fetchall()
    if not rows:
        rows = con.execute("SELECT * FROM entity WHERE kind IN ('company','person','vendor') AND norm_key LIKE ? "
                           "ORDER BY length(norm_key)", (f"%{key}%",)).fetchall()
    return rows[0] if rows else None
