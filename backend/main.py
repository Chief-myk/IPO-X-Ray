import asyncio
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

import collect
import demo
import network
import store
import tinyfish
import vendors
import watch
from ml.model import get_model, reload_model
from pipeline import Investigation, run_investigation

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
DIST = FRONTEND / "dist"
LEGACY = FRONTEND / "legacy"  # plain-HTML UI, served only when the React app hasn't been built
STATIC_DIR = DIST if DIST.exists() else LEGACY

app = FastAPI(title="IPO X-Ray")
RUNS: dict[str, Investigation] = {}
BACKGROUND: set[asyncio.Task] = set()

MAX_RUNS = 100
RUN_TTL_SECONDS = 3600  # 1 hour


def _cleanup_runs():
    """Purge completed runs older than RUN_TTL_SECONDS and enforce MAX_RUNS capacity limit."""
    now = time.time()
    # 1. Purge expired runs
    expired = [
        rid for rid, inv in RUNS.items()
        if (now - getattr(inv, "started", now)) > RUN_TTL_SECONDS and getattr(inv, "done", True)
    ]
    for rid in expired:
        RUNS.pop(rid, None)

    # 2. If still over MAX_RUNS, evict the oldest completed runs
    if len(RUNS) > MAX_RUNS:
        completed = sorted(
            [inv for inv in RUNS.values() if getattr(inv, "done", True)],
            key=lambda x: getattr(x, "started", 0)
        )
        excess = len(RUNS) - MAX_RUNS
        for inv in completed[:excess]:
            RUNS.pop(inv.id, None)


@app.on_event("startup")
async def warm_model():
    await asyncio.to_thread(get_model)   # trains on first run if no model file exists


@app.get("/api/health")
def health():
    return {"ok": True, "live": tinyfish.is_live(), "llm": bool(os.getenv("GEMINI_API_KEY")),
            "sample": demo.COMPANY, "model": get_model().meta}


@app.post("/api/model/reload")
async def model_reload():
    """Call after `python -m ml.train` to pick up a retrained model without restarting."""
    return (await asyncio.to_thread(reload_model)).meta


@app.post("/api/investigations")
async def create(company: str = Form(""), demo_mode: bool = Form(False, alias="demo"), drhp: UploadFile | None = File(None)):
    company = company.strip()
    if demo_mode:
        company = demo.COMPANY
    if not company:
        raise HTTPException(400, "Enter the company name as it appears on the IPO.")
    if not demo_mode and not tinyfish.is_live():
        raise HTTPException(400, "Live investigations need TINYFISH_API_KEY in backend/.env. Run the sample case meanwhile.")
    pdf = None
    if drhp is not None and drhp.filename:
        pdf = await drhp.read()
        if not pdf.startswith(b"%PDF"):
            raise HTTPException(400, "The DRHP must be a PDF file.")
        if len(pdf) > 60 * 1024 * 1024:
            raise HTTPException(400, "That PDF is over 60 MB. Upload the business and management chapters only.")
    _cleanup_runs()
    inv = Investigation(company, demo_mode)
    RUNS[inv.id] = inv
    t = asyncio.create_task(run_investigation(inv, pdf))
    BACKGROUND.add(t)
    t.add_done_callback(BACKGROUND.discard)
    return {"id": inv.id, "company": company, "demo": demo_mode}


@app.get("/api/investigations/{run_id}/stream")
async def stream(run_id: str):
    inv = RUNS.get(run_id)
    if not inv:
        raise HTTPException(404, "No investigation with that id.")

    async def gen():
        async for ev in inv.subscribe():
            if ev is None:
                yield ": ping\n\n"
            else:
                yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/investigations/{run_id}")
def snapshot(run_id: str):
    inv = RUNS.get(run_id)
    if not inv:
        raise HTTPException(404, "No investigation with that id.")
    return {"id": inv.id, "company": inv.company, "done": inv.done, "events": inv.events}



# ---- X-Ray: network map, vendor engine, live watch -------------------------------------------------

@app.on_event("startup")
async def load_cache_into_store():
    def load():
        n = store.rebuild_from_cache(collect.CACHE_DIR)
        m = vendors.rescore_from_cache()
        print(f"store: ingested {n} cached agent responses, {m} vendor scorecards")
    await asyncio.to_thread(load)


@app.get("/api/mode")
def mode():
    return {"demo": collect.demo_mode(), "live": tinyfish.is_live(), "cache_dir": str(collect.CACHE_DIR)}


async def _flow(inv: Investigation, kind: str, name: str, refresh: bool):
    ids: dict[str, str] = {}

    async def cb(label, ev):
        aid = ids.setdefault(label, f"a{len(ids) + 1}")
        if aid not in started:
            started.add(aid)
            await inv.emit("agent_start", agent={"id": aid, "label": label, "target": label.partition(":")[2], "kind": label.partition(":")[0]})
        if ev["kind"] == "step":
            await inv.emit("agent_step", id=aid, text=ev["text"], url=ev.get("url"))
        elif ev["kind"] == "live":
            await inv.emit("agent_live", id=aid, url=ev["url"])
        elif ev["kind"] == "error":
            await inv.emit("agent_step", id=aid, text=ev["text"], error=True)

    started: set[str] = set()

    async def stage(jobs, label):
        await inv.emit("phase", phase=label, label=label)
        recs = await collect.collect_many(jobs, refresh=refresh, on_event=cb)
        for r, j in zip(recs, jobs):
            store.ingest(r)
            if j["label"].startswith("vendor:"):
                vendors.save(r, j["label"].partition(":")[2])
            await inv.emit("agent_done", id=ids.get(j["label"]), label=j["label"], ok=r.get("result") is not None,
                           error=r.get("error"), from_cache=r.get("from_cache"), sources=r.get("sources", [])[:6])
        return recs

    try:
        if kind == "director":
            await stage([collect.director_job(name)], "Finding companies this person directs")
        elif kind == "vendor":
            await stage([vendors.vendor_job(name)], "Checking the vendor on the open web")
        else:
            await stage([collect.company_job(name), collect.contact_job(name), collect.relations_job(name)], "Reading the company profile and its vendors/clients")
            con = store.db()
            e = store.find_entity(con, name)
            vnames, pnames = [], []
            if e:
                vnames = [r[0] for r in con.execute("SELECT e.name FROM relation r JOIN entity e ON e.id=r.dst_id WHERE r.src_id=? AND r.rel='USES_VENDOR' LIMIT 5", (e["id"],))]
                pnames = [r[0] for r in con.execute("SELECT e.name FROM relation r JOIN entity e ON e.id=r.src_id WHERE r.dst_id=? AND r.rel='DIRECTS' LIMIT 2", (e["id"],))]
            con.close()
            jobs = [vendors.vendor_job(v, name) for v in vnames] + [collect.director_job(p, name) for p in pnames]
            if jobs:
                await stage(jobs, "Checking vendors and promoters in parallel")
        await inv.emit("done", query=name)
    except Exception as exc:
        await inv.emit("error", message=f"{exc.__class__.__name__}: {exc}")
    finally:
        await inv.finish()


@app.post("/api/runs")
async def start_run(kind: str = Form("company"), name: str = Form(...), refresh: bool = Form(False)):
    name = name.strip()
    if kind not in {"company", "director", "vendor"} or not name:
        raise HTTPException(400, "Give a company, director or vendor name.")
    if not collect.demo_mode() and not tinyfish.is_live():
        raise HTTPException(400, "Set TINYFISH_API_KEY in backend/.env, or run with DEMO_MODE=1 to use the cache.")
    inv = Investigation(name, collect.demo_mode())
    RUNS[inv.id] = inv
    t = asyncio.create_task(_flow(inv, kind, name, refresh))
    BACKGROUND.add(t)
    t.add_done_callback(BACKGROUND.discard)
    return {"id": inv.id, "name": name, "kind": kind}


@app.get("/api/graph")
def get_graph(q: str, depth: int = 2):
    return network.graph(q, depth)


@app.get("/api/vendors")
def get_vendors():
    return vendors.scorecards()


@app.get("/api/entities")
def get_entities():
    con = store.db()
    rows = [dict(r) for r in con.execute("SELECT id,kind,name FROM entity WHERE kind IN ('company','person','vendor') ORDER BY kind,name")]
    con.close()
    return rows


@app.get("/api/watch")
def get_watch():
    return {"watched": watch.watched(), "alerts": watch.alerts()}


@app.post("/api/watch")
def add_watch(name: str = Form(...)):
    watch.add(name.strip())
    return {"watched": watch.watched()}


@app.post("/api/watch/run")
async def run_watch(name: str = Form("")):
    subjects = [name.strip()] if name.strip() else watch.watched()
    out = []
    for s in subjects:
        out += [{"subject": s, **c} for c in await watch.check(s, refresh=True)]
    return {"changes": out}


@app.post("/api/watch/simulate")
def simulate_watch(name: str = Form(...)):
    watch.add(name.strip())
    return {"changes": watch.simulate(name.strip())}


@app.get("/xray.html")
@app.get("/xray.js")
def xray_asset(request: Request):
    return FileResponse(FRONTEND / "public" / request.url.path.lstrip("/"))


@app.get("/")
def index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return FileResponse(LEGACY / "index.html")


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
