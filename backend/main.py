import asyncio
import copy
import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import autopsy
import collect
import demo
import drafts
import hype
import liquidity
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


def _stager(inv: Investigation, refresh: bool, ingest: bool = True):
    """Returns stage(jobs, label): runs agents in parallel and streams each one as a lane in the UI.
    ingest=False keeps results out of the entity store (used for scam checks and influencer calls)."""
    ids: dict[str, str] = {}
    started: set[str] = set()

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

    async def stage(jobs, label):
        await inv.emit("phase", phase=label, label=label)
        recs = await collect.collect_many(jobs, refresh=refresh, on_event=cb)
        for r, j in zip(recs, jobs):
            if j["label"] not in ids:   # the run failed before any event (no key, demo cache miss): still show its lane
                await cb(j["label"], {"kind": "none"})
            if ingest:
                store.ingest(r)
                if j["label"].startswith("vendor:"):
                    vendors.save(r, j["label"].partition(":")[2])
            await inv.emit("agent_done", id=ids.get(j["label"]), label=j["label"], ok=r.get("result") is not None,
                           error=r.get("error"), from_cache=r.get("from_cache"), sources=r.get("sources", [])[:6])
        return recs

    return stage


def _start(inv: Investigation, coro):
    _cleanup_runs()
    RUNS[inv.id] = inv
    t = asyncio.create_task(coro)
    BACKGROUND.add(t)
    t.add_done_callback(BACKGROUND.discard)


async def _flow(inv: Investigation, kind: str, name: str, refresh: bool):
    stage = _stager(inv, refresh)

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
    _start(inv, _flow(inv, kind, name, refresh))
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
    rows = [dict(r) for r in con.execute("SELECT e.id,e.kind,e.name FROM entity e WHERE e.kind IN ('company','person','vendor') "
        "ORDER BY e.kind, (SELECT COUNT(*) FROM relation r WHERE r.src_id=e.id OR r.dst_id=e.id) DESC, e.name")]
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


# ---- Claim autopsy, Truth vs Hype, Can I exit?, complaint/RTI drafts --------------------------------

def _agents_available() -> bool:
    return collect.demo_mode() or tinyfish.is_live()


async def _autopsy_flow(inv: Investigation, text: str, url: str, check: bool, refresh: bool):
    stage = _stager(inv, refresh, ingest=False)
    try:
        title = None
        if url:
            if _agents_available():
                rec = (await stage([autopsy.page_job(url)], "Reading the link"))[0]
                page = rec.get("result") or {}
                if page.get("text") or page.get("title"):
                    title = page.get("title")
                    text = "\n".join(x for x in (page.get("title"), page.get("author"), page.get("date"), page.get("text"), text) if x)
                else:
                    await inv.emit("phase", phase="read", label=f"Could not read the link: {rec.get('error') or 'no text returned'}")
            else:
                await inv.emit("phase", phase="read", label="Links need TINYFISH_API_KEY (or DEMO_MODE=1). Analysing the pasted text only.")
        if not text.strip():
            await inv.emit("error", message="Nothing to analyse. Paste the message, upload a file, or give a readable link.")
            return
        await inv.emit("phase", phase="analyse", label="Finding promises, names and payment instructions")
        analysis = autopsy.analyze(text, await autopsy.ai_entities(text))
        meta = {"title": title, "source_url": url or None, "input_text": text[:autopsy.MAX_TEXT]}
        await inv.emit("autopsy", report=autopsy.finalize(copy.deepcopy(analysis), [], {**meta, "partial": check}))
        checks = []
        jobs = autopsy.plan_checks(analysis) if check else []
        if jobs:
            recs = await stage(jobs, "Checking official records (SEBI, exchanges, company registry)")
            checks = [autopsy.judge(j, r, analysis) for j, r in zip(jobs, recs)]
        await inv.emit("autopsy", report=autopsy.finalize(analysis, checks, {**meta, "partial": False}))
        await inv.emit("done")
    except Exception as exc:
        await inv.emit("error", message=f"{exc.__class__.__name__}: {exc}")
    finally:
        await inv.finish()


@app.get("/api/autopsy/sample")
def autopsy_sample():
    return {"text": autopsy.SAMPLE}


@app.post("/api/autopsy")
async def start_autopsy(text: str = Form(""), url: str = Form(""), check: bool = Form(True), refresh: bool = Form(False),
                        file: UploadFile | None = File(None)):
    text, url = text.strip(), url.strip()
    if url and not re.match(r"https?://", url):
        raise HTTPException(400, "The link must start with http:// or https://")
    if file is not None and file.filename:
        data = await file.read()
        if len(data) > 25 * 1024 * 1024:
            raise HTTPException(400, "That file is over 25 MB.")
        got, err = await autopsy.read_file(data, file.filename, file.content_type or "")
        if err and not (text or url):
            raise HTTPException(400, err)
        text = "\n".join(x for x in (text, got) if x)
    if not (text or url):
        raise HTTPException(400, "Paste the message, upload a screenshot/PDF, or give a link.")
    inv = Investigation("Claim autopsy", collect.demo_mode())
    _start(inv, _autopsy_flow(inv, text, url, check and _agents_available(), refresh))
    return {"id": inv.id, "agents": check and _agents_available()}


class LiquidityIn(BaseModel):
    symbol: str | None = None
    shares: int | None = Field(None, gt=0)
    amount: float | None = Field(None, gt=0)
    price: float | None = Field(None, gt=0)
    daily_volume: float | None = Field(None, ge=0)
    volatility_pct: float | None = Field(None, gt=0, le=50)
    lot_size: int = Field(1, ge=1)
    band_pct: float = Field(5.0, gt=0, le=20)
    participation_pct: float = Field(10.0, gt=0, le=100)
    drop_pct: float = Field(20.0, gt=0, lt=100)
    lc_days: int | None = Field(None, ge=0, le=60)
    lc_buyer_pct: float = Field(5.0, ge=0, le=100)
    lockin_shares: int | None = Field(None, gt=0)
    lockin_sell_pct: float = Field(25.0, ge=0, le=100)


@app.post("/api/liquidity")
async def run_liquidity(body: LiquidityIn):
    if not (body.shares or body.amount):
        raise HTTPException(400, "Enter how many shares you hold, or the amount invested.")
    if not (body.symbol or "").strip() and not (body.price and body.daily_volume is not None):
        raise HTTPException(400, "Enter a stock symbol, or the price and average daily volume.")
    args = body.model_dump()
    args["symbol"] = (body.symbol or "").strip() or None
    out = await asyncio.to_thread(lambda: liquidity.simulate(**args))
    if not out["ok"]:
        raise HTTPException(400, " ".join([out["error"], *out.get("notes", [])]))
    return out


class HypeAuditIn(BaseModel):
    calls: list[dict]
    horizon: int = Field(hype.DEFAULT_HORIZON, ge=1, le=250)
    cost_pct: float = Field(hype.DEFAULT_COST_PCT, ge=0, le=5)
    claimed_accuracy: float | None = Field(None, ge=0, le=100)


@app.post("/api/hype/parse")
def hype_parse(text: str = Form(...)):
    return hype.parse_text(text)


@app.post("/api/hype/audit")
async def hype_audit(body: HypeAuditIn):
    if not body.calls:
        raise HTTPException(400, "No calls to audit. Paste dated calls such as '2024-03-12 BUY TATAPOWER target 450 sl 380'.")
    return await asyncio.to_thread(hype.audit, body.calls, body.horizon, body.cost_pct, body.claimed_accuracy)


async def _calls_flow(inv: Investigation, handle: str, refresh: bool):
    stage = _stager(inv, refresh, ingest=False)
    try:
        rec = (await stage([hype.collect_job(handle)], "Collecting public, dated calls"))[0]
        await inv.emit("calls", calls=hype.from_agent(rec.get("result")), error=rec.get("error"))
        await inv.emit("done")
    except Exception as exc:
        await inv.emit("error", message=f"{exc.__class__.__name__}: {exc}")
    finally:
        await inv.finish()


@app.post("/api/hype/collect")
async def hype_collect(handle: str = Form(...), refresh: bool = Form(False)):
    handle = handle.strip()
    if not handle:
        raise HTTPException(400, "Give a public Telegram channel link, a page URL, or the influencer's name/handle.")
    if not _agents_available():
        raise HTTPException(400, "Collecting calls needs TINYFISH_API_KEY in backend/.env. Paste the calls instead.")
    inv = Investigation(handle, collect.demo_mode())
    _start(inv, _calls_flow(inv, handle, refresh))
    return {"id": inv.id}


class DraftIn(BaseModel):
    kind: str
    source: str
    data: dict = {}
    complainant: dict = {}
    subject: str | None = None


@app.get("/api/drafts/kinds")
def draft_kinds():
    return drafts.KINDS


@app.post("/api/drafts")
def make_draft(body: DraftIn):
    if body.kind not in drafts.KINDS:
        raise HTTPException(400, f"Unknown draft type. Use one of: {', '.join(drafts.KINDS)}")
    return drafts.draft(body.kind, body.source, body.data, body.complainant, body.subject)


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
