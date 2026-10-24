"""Thin adapter around the TinyFish web-agent API.

Every agent run = one goal in plain English + a starting URL. TinyFish drives a real
browser, decides where to click/search/read, streams progress over SSE, and finally
returns structured JSON. We normalise its events into three kinds:
  {"kind": "step",   "text": ..., "url": ...}
  {"kind": "live",   "url": ...}            # live browser view, if TinyFish sends one
  {"kind": "result", "data": {...}}
  {"kind": "error",  "text": ...}
The parser is deliberately tolerant so small changes in event names don't break the demo.
"""
import asyncio
import json
import os
import re

import httpx


def _cfg():
    return {
        "key": os.getenv("TINYFISH_API_KEY", "").strip(),
        "base": os.getenv("TINYFISH_BASE_URL", "https://agent.tinyfish.ai").rstrip("/"),
        "path": os.getenv("TINYFISH_RUN_SSE_PATH", "/v1/automation/run-sse"),
        "stealth": os.getenv("TINYFISH_STEALTH", "0") == "1",
        "timeout": float(os.getenv("AGENT_TIMEOUT_SECONDS", "240")),
    }


def is_live() -> bool:
    return bool(_cfg()["key"])


def _parse_json_blob(value):
    if isinstance(value, (dict, list)):
        return value
    if not isinstance(value, str):
        return None
    text = re.sub(r"^```(?:json)?|```$", "", value.strip(), flags=re.M).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
    return None


def _normalise(ev: dict):
    typ = str(ev.get("type") or ev.get("event") or ev.get("status") or "").upper()

    live = ev.get("streamingUrl") or ev.get("streaming_url") or ev.get("liveUrl") or ev.get("live_url")
    if live:
        yield {"kind": "live", "url": live}

    if typ in {"ERROR", "FAILED", "FAILURE"}:
        yield {"kind": "error", "text": ev.get("message") or ev.get("error") or "Agent failed"}
        return

    payload = None
    for key in ("resultJson", "result_json", "result", "output", "data"):
        if key in ev and ev[key] not in (None, ""):
            payload = ev[key]
            break
    if typ in {"COMPLETE", "COMPLETED", "DONE", "RESULT", "FINISHED"} or (payload is not None and typ not in {"PROGRESS", "STEP"}):
        parsed = _parse_json_blob(payload)
        if parsed is not None:
            yield {"kind": "result", "data": parsed}
            return
        if typ in {"COMPLETE", "COMPLETED", "DONE", "RESULT", "FINISHED"}:
            yield {"kind": "error", "text": "Agent finished without readable JSON"}
            return

    text = ev.get("purpose") or ev.get("message") or ev.get("action") or ev.get("description") or ev.get("step")
    if isinstance(text, str) and text.strip():
        yield {"kind": "step", "text": text.strip()[:240], "url": ev.get("url") or ev.get("currentUrl")}


async def run_agent(task):
    """Async generator of normalised events for one TinyFish run."""
    cfg = _cfg()
    if not cfg["key"]:
        yield {"kind": "error", "text": "TINYFISH_API_KEY is not set"}
        return

    body = {"url": task.url, "goal": task.goal}
    if cfg["stealth"]:
        body["browser_profile"] = "stealth"
    headers = {
        "X-API-Key": cfg["key"],
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    timeout = httpx.Timeout(connect=20, read=cfg["timeout"], write=20, pool=20)

    try:
        async with asyncio.timeout(cfg["timeout"] + 30):
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", cfg["base"] + cfg["path"], headers=headers, json=body) as resp:
                    if resp.status_code >= 400:
                        detail = (await resp.aread()).decode(errors="ignore")[:300]
                        yield {"kind": "error", "text": f"TinyFish returned {resp.status_code}: {detail}"}
                        return
                    got_result = False
                    async for line in resp.aiter_lines():
                        line = line.strip()
                        if not line.startswith("data:"):
                            continue
                        raw = line[5:].strip()
                        if not raw or raw == "[DONE]":
                            continue
                        try:
                            ev = json.loads(raw)
                        except json.JSONDecodeError:
                            continue
                        for norm in _normalise(ev):
                            if norm["kind"] == "result":
                                got_result = True
                            yield norm
                        if got_result:
                            return
                    if not got_result:
                        yield {"kind": "error", "text": "Stream ended before the agent returned a result"}
    except TimeoutError:
        yield {"kind": "error", "text": f"Agent timed out after {int(cfg['timeout'])}s"}
    except httpx.HTTPError as exc:
        yield {"kind": "error", "text": f"Network error talking to TinyFish: {exc.__class__.__name__}"}
