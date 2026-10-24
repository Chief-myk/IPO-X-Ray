# IPO X-Ray

Agents that read an SME IPO's offer document (DRHP) and check every claim on the open web — vendors, clients, directors, addresses, revenue — before a retail investor puts money in.

## What we are actually building

Not a chatbot, and not a single agent. IPO X-Ray is a **multi-agent orchestrator**:

```
DRHP (PDF, or found online by a discovery agent)
        │
        ▼
 1. Claim extractor ──► list of checkable claims (vendor, client, director, address, financials) with page numbers
        │
        ▼
 2. Planner ──────────► one goal per claim  ("Is this vendor a real operating business?")
        │
        ▼
 3. TinyFish web agents, in parallel (asyncio, MAX_PARALLEL_AGENTS)
        │   each agent opens a real browser, decides where to search/click/read,
        │   streams its steps, returns JSON
        ▼
 4. ML risk model ───► fraud probability (gradient-boosted trees, calibrated)
        │                + Shapley explanation: how many points each finding added
        │                + isolation-forest "how unusual is this IPO" percentile
        │
        ▼
 5. Report (+ optional Gemini summary) streamed live to the UI over SSE
```

We write the brain that decides *what* to investigate and how to judge the evidence. TinyFish supplies the hands: browser agents that figure out *how* to find it on sites we never scripted.

## Run it

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                     # add TINYFISH_API_KEY
uvicorn main:app --reload --port 8000
```
Open http://localhost:8000. The FastAPI server serves the React build from `frontend/dist` if it exists, otherwise the plain-HTML fallback in `frontend/legacy/` (no Node needed).

React front end (Vite + Tailwind):
```bash
cd frontend && npm install
npm run dev      # http://localhost:5173, proxies /api to :8000
npm run build    # writes frontend/dist, which FastAPI then serves
```
The Network · Vendors · Watch page (`frontend/public/xray.html`) is plain HTML copied as-is into the build.

Without a key, **Run the sample case** works fully (fictional company, simulated agents) — use it to rehearse and as a backup during judging.

## The ML model

**What it predicts:** probability that an SME IPO's disclosures don't hold up, from 17 features the agents measure (vendor linked to promoter, youngest vendor website, smallest vendor headcount, clients who never name the issuer, director overlaps, struck-off history, address checks, growth vs. headcount, regulator orders, court cases, complaints, share of claims agents couldn't verify).

**Model:** `HistGradientBoostingClassifier` (handles missing agent results natively, learns interactions such as "4x growth *and* 11 staff"), sigmoid-calibrated so 0.8 means roughly 80%. An `IsolationForest` fitted on clean cases adds an unusualness percentile.

**Explanations:** Monte Carlo Shapley values over observed features. Points per finding add up to the score's rise above the "nothing known" baseline. A flag's severity is the points it added, so the model, not hand-written rules, decides what's critical.

**Training data, honestly:** there is no public labelled dataset of SME IPO frauds. The model starts on 4,000 synthetic cases (`ml/synth.py`, our assumptions in code, with noise, missing values, legit fast-growers and 4% wrong labels; holdout AUC ≈ 0.86). Every real case you label counts 25×:

```bash
# run an investigation on an IPO whose outcome is known, click "Download report", then:
python -m ml.label ipo-xray-<company>.json 1 "SEBI order link"   # 1 = later actioned by SEBI/exchange
python -m ml.label ipo-xray-<company>.json 0 "no action found"
python -m ml.train                                               # prints AUC on your real cases
curl -X POST localhost:8000/api/model/reload                     # pick it up without restart
```
Label from what happened after listing, never from the model's own score. Even 15–20 real cases (SEBI-actioned SME issues + clean ones from the same years) make the "AUC on real cases" line something you can show judges.

## Before the demo: check the TinyFish endpoint

`backend/tinyfish.py` calls `POST {TINYFISH_BASE_URL}{TINYFISH_RUN_SSE_PATH}` with header `X-API-Key` and body `{"url", "goal"}`, and reads SSE events. Confirm the base URL, path and auth header in your TinyFish dashboard/docs and set them in `.env` if they differ. The event parser is tolerant (it accepts `COMPLETE`/`resultJson`/`result`, `purpose`/`message` steps, and a `streamingUrl` live view), so usually only those two env values need changing. Test one agent first:

```bash
curl -N -X POST "$TINYFISH_BASE_URL/v1/automation/run-sse" \
  -H "X-API-Key: $TINYFISH_API_KEY" -H "Content-Type: application/json" \
  -d '{"url":"https://www.bing.com/search?q=Infosys","goal":"Return JSON {\"title\": first result title}"}'
```

If TinyFish's separate Search / Fetch endpoints are in your plan, add them in `tinyfish.py` and call them from `planner.py` for cheap lookups (e.g. WHOIS) before spending a full agent run.

## Files

| Path | Role |
|---|---|
| `backend/main.py` | FastAPI: create investigation, SSE stream, serves UI |
| `backend/pipeline.py` | Orchestrator: extract → plan → parallel agents → score → report |
| `backend/planner.py` | Claim → agent goal + start URL + expected JSON shape |
| `backend/tinyfish.py` | TinyFish SSE client and event normaliser |
| `backend/extractor.py` | DRHP PDF → claims (Gemini if `GEMINI_API_KEY`, else regex) |
| `backend/scoring.py` | Turns model output into flags (severity = points the finding added) |
| `backend/ml/features.py` | Agent results → 17 features per IPO + signals tied to claims |
| `backend/ml/synth.py` | Synthetic bootstrap dataset (assumptions written down) |
| `backend/ml/train.py` | Trains + calibrates the model, isolation forest, saves `models/risk_model.joblib` |
| `backend/ml/model.py` | Prediction + Shapley-value explanations |
| `backend/ml/label.py` | Adds a real, labelled case to `ml/data/labeled_ipos.csv` |
| `backend/demo.py` | Fictional sample case |
| `frontend/src/` | React app (Vite, Tailwind): App.jsx + components |
| `frontend/public/` | xray.html, xray.js — network/vendor/watch page, static |
| `frontend/legacy/` | old plain-HTML UI (GSAP, Lenis), fallback when there's no build |

## Three-minute judging script

1. Hero: the scanner passes over a DRHP page and flags light up — say the one-line pitch.
2. Scroll the "one agent per claim" section — explain orchestrator vs. agents.
3. Type a real SME IPO name (have its DRHP PDF ready to attach) → **Start investigation**. Point at agents running in parallel; click **Watch the browser** on one.
4. Report: verdict, score, each flag with sources. Close with: a flag is a reason to look closer, not a verdict.

Keep the sample case one click away in case venue Wi-Fi or a site's bot check slows a live run.
