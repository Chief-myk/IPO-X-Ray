import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

import demo
import tinyfish
from ml.model import get_model, reload_model
from pipeline import Investigation, run_investigation

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
app = FastAPI(title="IPO X-Ray")
RUNS: dict[str, Investigation] = {}
BACKGROUND: set[asyncio.Task] = set()


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


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")


app.mount("/", StaticFiles(directory=FRONTEND), name="static")
