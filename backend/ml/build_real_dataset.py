"""Build a real labelled dataset: run the same agent pipeline the app uses, once per IPO, and save features.

  python -m ml.build_real_dataset            # run from backend/, needs TINYFISH_API_KEY in .env

Rows come from two places:
  real_labels_seed.csv   label 1 = regulator action found (source_url is the proof)
  NEGATIVES below        label 0 = no SEBI/exchange action known (weak label, see notes)

Output is appended per company to data/real_dataset_raw.jsonl, so an interrupted run resumes.
Then ml/build_real_dataset.py --csv writes ml/data/real_ipos.csv for the judges.
"""
import asyncio
import csv
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from ml.features import FEATURES, build  # noqa: E402

HERE = Path(__file__).resolve().parent
SEED = HERE / "data" / "real_labels_seed.csv"
RAW = HERE / "data" / "real_dataset_raw.jsonl"
OUT = HERE / "data" / "real_ipos.csv"
RUN_TIMEOUT = int(os.getenv("DATASET_RUN_TIMEOUT", "420"))   # seconds per agent run, including the one retry

# Listed IPOs with no SEBI fraud / IPO-proceeds action known to the author. Weak negatives: "no action
# found" is not the same as "verified clean". Larger and older than most positives, so size is a confound.
NEGATIVES = [
    ("FSN E-Commerce Ventures (Nykaa)", "2021-11-10"),
    ("Zomato", "2021-07-23"),
    ("Route Mobile", "2020-09-15"),
    ("CarTrade Tech", "2019-09-09"),
    ("Happiest Minds Technologies", "2020-09-17"),
    ("Latent View Analytics", "2021-04-19"),
    ("Tata Technologies", "2023-11-30"),
    ("Mazagon Dock Shipbuilders", "2020-10-14"),
    ("IRCTC", "2019-10-14"),
    ("HDFC Asset Management Company", "2018-08-02"),
    ("Dodla Dairy", "2019-06-27"),
    ("Affle India", "2019-08-16"),
    ("Senco Gold", "2022-07-14"),
    ("Campus Activewear", "2022-08-31"),
    ("Metropolis Healthcare", "2018-01-08"),
    ("Sapphire Foods India", "2022-11-25"),
    ("Global Health (Medanta)", "2019-10-30"),
    ("Amber Enterprises India", "2018-10-16"),
    ("Lemon Tree Hotels", "2018-02-15"),
    ("Aptus Value Housing Finance", "2018-05-22"),
]


def _seed_rows():
    with open(SEED, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if r["label"].strip() in {"0", "1"}:
                # Time split is by listing date for every row; fall back to the order date only when unknown.
                yield {"company": r["company"], "label": int(r["label"]), "source_url": r["source_url"],
                       "listing_or_order_date": r["listing_date"] or r["order_date"], "notes": r["notes"]}


def _all_rows():
    yield from _seed_rows()
    for name, listed in NEGATIVES:
        yield {"company": name, "label": 0, "source_url": "", "listing_or_order_date": listed,
               "notes": "Weak negative: no SEBI/exchange action known to the author; not verified clean"}


def _done():
    if not RAW.exists():
        return set()
    return {json.loads(line)["company"] for line in RAW.read_text(encoding="utf-8").splitlines() if line.strip()}


_CLAIM = {"type": "object", "properties": {
    "type": {"type": "string", "nullable": False}, "name": {"type": "string", "nullable": False},
    "detail": {"type": "string", "nullable": True}, "page": {"type": "string", "nullable": True},
    "website": {"type": "string", "nullable": True}, "growth_multiple": {"type": "string", "nullable": True}},
    "required": ["type", "name"], "propertyOrdering": ["type", "name", "detail", "page", "website", "growth_multiple"]}
_DISCOVERY_SCHEMA = {"type": "object", "properties": {
    "claims": {"type": "array", "items": _CLAIM, "maxItems": 15},
    "document_url": {"type": "string", "nullable": True}}, "required": ["claims", "document_url"],
    "propertyOrdering": ["claims", "document_url"]}


async def _one(row, sem, agent_sem):
    # Imported lazily so `--csv` works without the agent stack.
    # Same steps as the app's investigation: find the DRHP, extract claims, plan checks, run them. But every
    # TinyFish call goes through collect.collect(), which asks for a typed schema, retries a wrong shape once,
    # and caches each valid result under data/cache, so a rerun costs nothing for finished work.
    from collect import collect
    from extractor import _number_claims
    from planner import discovery_task, plan_tasks

    async def run(goal, url, label, **kw):
        # SSE resets the read timeout on every event, so one agent can stream forever; cap the whole run.
        def log(ev):
            if ev["kind"] in ("step", "error"):
                print(f"  [{label}] {ev['kind']}: {str(ev.get('text'))[:140]}", flush=True)
        async with agent_sem:
            try:
                return await asyncio.wait_for(collect(goal, url, label=label, on_event=log, **kw), RUN_TIMEOUT)
            except asyncio.TimeoutError:
                print(f"  [{label}] timed out after {RUN_TIMEOUT}s", flush=True)
                return {"result": None, "error": f"timed out after {RUN_TIMEOUT}s"}

    company = row["company"]
    async with sem:   # companies in flight; agent_sem caps TinyFish runs across all of them
        disc = discovery_task(company)
        d = await run(disc.goal, disc.url, f"discovery:{company}", expect=["claims", "document_url"],
                      schema=_DISCOVERY_SCHEMA)
        raw = (d["result"] or {}).get("claims", []) if isinstance(d["result"], dict) else []
        claims = _number_claims(company, raw)
        tasks = plan_tasks(company, claims)

        async def run_task(t):
            return await run(t.goal, t.url, f"{t.kind}:{t.target}")

        recs = await asyncio.gather(*(run_task(t) for t in tasks))
    outcomes = [{"task": t.public(), "result": r["result"]} for t, r in zip(tasks, recs)]
    feats, _ = build(outcomes)
    ok = sum(1 for o in outcomes if isinstance(o["result"], dict))
    return {**row, "claims": len(claims), "tasks": len(tasks), "tasks_ok": ok,
            "discovery_error": d.get("error"), "features": feats}


async def run(limit=None):
    RAW.parent.mkdir(parents=True, exist_ok=True)
    done = _done()
    todo = [r for r in _all_rows() if r["company"] not in done][:limit]
    sem = asyncio.Semaphore(5)   # companies in parallel
    agent_sem = asyncio.Semaphore(int(os.getenv("MAX_PARALLEL_AGENTS", "10")))   # TinyFish runs in parallel, total

    async def go(row):
        try:
            rec = await _one(row, sem, agent_sem)
        except Exception as exc:  # one bad company must not stop the run
            rec = {**row, "error": f"{exc.__class__.__name__}: {exc}", "features": {}}
        with open(RAW, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
        print(f"done {row['company']} label={row['label']} tasks_ok={rec.get('tasks_ok')} err={rec.get('error')}", flush=True)

    await asyncio.gather(*(go(r) for r in todo))


def to_csv():
    rows = [json.loads(l) for l in RAW.read_text(encoding="utf-8").splitlines() if l.strip()]
    cols = ["company", "label", "listing_or_order_date", "source_url", "notes", "claims", "tasks", "tasks_ok", *FEATURES]
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({**r, **{f: "" if r.get("features", {}).get(f) is None else r["features"][f] for f in FEATURES}})
    print(f"wrote {OUT} with {len(rows)} rows")


if __name__ == "__main__":
    if "--csv" in sys.argv:
        to_csv()
    else:
        limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
        asyncio.run(run(limit))
