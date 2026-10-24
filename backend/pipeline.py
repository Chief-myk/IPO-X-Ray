import asyncio
import os
import time
import uuid

import demo
import tinyfish
from extractor import extract_claims, summarise
from planner import plan_tasks, discovery_task
from scoring import assess, findings_for, build_report


class Investigation:
    def __init__(self, company: str, is_demo: bool):
        self.id = uuid.uuid4().hex[:10]
        self.company, self.demo = company, is_demo
        self.started = time.time()
        self.events: list[dict] = []
        self.done = False
        self._cond = asyncio.Condition()
        self.outcomes: list[dict] = []
        self.score_lock = asyncio.Lock()

    async def emit(self, type_: str, **data):
        async with self._cond:
            self.events.append({"type": type_, "t": round(time.time() - self.started, 2), **data})
            self._cond.notify_all()

    async def finish(self):
        async with self._cond:
            self.done = True
            self._cond.notify_all()

    async def subscribe(self):
        """Replays everything so far, then follows live. Yields None as a heartbeat."""
        i = 0
        while True:
            batch, finished = [], False
            async with self._cond:
                if i >= len(self.events) and not self.done:
                    try:
                        await asyncio.wait_for(self._cond.wait(), 15)
                    except asyncio.TimeoutError:
                        pass
                batch = self.events[i:]
                i += len(batch)
                finished = self.done and i >= len(self.events)
            if not batch and not finished:
                yield None
            for ev in batch:
                yield ev
            if finished:
                return


async def _run_task(inv: Investigation, task, sem, score=True):
    async with sem:
        await inv.emit("agent_start", agent=task.public())
        runner = demo.simulate if inv.demo else tinyfish.run_agent
        result = None
        async for ev in runner(task):
            if ev["kind"] == "step":
                await inv.emit("agent_step", id=task.id, text=ev["text"], url=ev.get("url"))
            elif ev["kind"] == "live":
                await inv.emit("agent_live", id=task.id, url=ev["url"])
            elif ev["kind"] == "result":
                result = ev["data"]
            elif ev["kind"] == "error":
                await inv.emit("agent_step", id=task.id, text=ev["text"], error=True)
        outcome = {"task": task.public(), "result": result}
        if not score:
            await inv.emit("agent_done", id=task.id, result=result, findings=[{"severity": "clear" if result else "unverified", "title": "Document read" if result else "Could not find the DRHP"}])
            return outcome
        async with inv.score_lock:   # re-score the whole IPO with everything known so far
            inv.outcomes.append(outcome)
            _, pred, flags = await asyncio.to_thread(assess, list(inv.outcomes))
        await inv.emit("agent_done", id=task.id, result=result, findings=findings_for(task.id, flags))
        await inv.emit("score", score=pred["score"], probability=pred["probability"], flags=flags, drivers=pred.get("drivers", []))
        return outcome


async def _discover(inv: Investigation):
    task = discovery_task(inv.company)
    out = await _run_task(inv, task, asyncio.Semaphore(1), score=False)
    raw = (out["result"] or {}).get("claims", []) if isinstance(out["result"], dict) else []
    from extractor import _number_claims
    return _number_claims(inv.company, raw)


async def run_investigation(inv: Investigation, pdf: bytes | None):
    try:
        await inv.emit("phase", phase="read", label="Reading the offer document")
        if inv.demo:
            await asyncio.sleep(1.2)
            claims = demo.CLAIMS
        elif pdf:
            claims = await extract_claims(inv.company, pdf)
        else:
            await inv.emit("phase", phase="read", label="Finding the DRHP online")
            claims = await _discover(inv)
        if len(claims) <= 1:
            await inv.emit("phase", phase="read", label="Few claims found, running company-level checks only")
        await inv.emit("claims", claims=claims)

        tasks = plan_tasks(inv.company, claims)
        await inv.emit("phase", phase="dispatch", label=f"Dispatching {len(tasks)} agents", count=len(tasks))
        sem = asyncio.Semaphore(int(os.getenv("MAX_PARALLEL_AGENTS", "10")))
        await inv.emit("phase", phase="verify", label="Agents are checking claims on the open web")
        await asyncio.gather(*(_run_task(inv, t, sem) for t in tasks))

        await inv.emit("phase", phase="report", label="Scoring with the risk model")
        feats, pred, flags = await asyncio.to_thread(assess, inv.outcomes)
        report = build_report(inv.company, claims, inv.outcomes, feats, pred, flags, demo=inv.demo)
        report["summary"] = demo.SUMMARY if inv.demo else await summarise(report)
        report["elapsed"] = round(time.time() - inv.started, 1)
        report["id"] = inv.id
        try:
            import database
            await asyncio.to_thread(database.save_investigation, report)
        except Exception as e:
            print(f"Error saving to database: {e}")
        await inv.emit("report", report=report)
    except Exception as exc:  # surface any failure to the UI instead of hanging
        await inv.emit("error", message=f"{exc.__class__.__name__}: {exc}")
    finally:
        await inv.finish()
