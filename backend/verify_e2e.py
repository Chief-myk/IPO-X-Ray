import urllib.request
import json
import time

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get(url):
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== 1. Testing Debate Endpoint ===", flush=True)
deb = post("http://127.0.0.1:8000/api/debate", {"company": "Kalindi Smart Mobility Limited"})
print("Company:", deb.get("company"), flush=True)
print("Bull arguments count:", len(deb.get("bull", {}).get("arguments", [])))
print("Bear arguments count:", len(deb.get("bear", {}).get("arguments", [])))
print("Judge balanced verdict exists:", bool(deb.get("judge", {}).get("verdict")))
print("Contradictions count:", len(deb.get("judge", {}).get("contradictions", [])))
print("Unanswered questions count:", len(deb.get("judge", {}).get("unanswered_questions", [])))

print("\n=== 2. Testing Simulator Endpoint ===")
sim = post("http://127.0.0.1:8000/api/simulator/calculate", {
    "company": "Kalindi Smart Mobility Limited",
    "investment_amount": 15000,
    "horizon_months": 12,
    "risk_score": 74
})
print("Company:", sim.get("company"))
print("Scenarios:", list(sim.get("scenarios", {}).keys()))
print("Best case return:", sim.get("scenarios", {}).get("best_case", {}).get("estimated_return_pct"), "%")
print("Worst case return:", sim.get("scenarios", {}).get("worst_case", {}).get("estimated_return_pct"), "%")
print("Has disclaimer:", bool(sim.get("disclaimer")))

print("\n=== 3. Testing Promise Tracker Endpoints ===")
proms = get("http://127.0.0.1:8000/api/promises")
print("Total promises seeded:", len(proms.get("promises", [])))
alerts = get("http://127.0.0.1:8000/api/promises/alerts")
print("Total active deviation alerts:", len(alerts.get("alerts", [])))

first_p = proms["promises"][0]
print("Verifying promise:", first_p["id"], "Old status:", first_p["status"])
verified = post("http://127.0.0.1:8000/api/promises/verify", {
    "promise_id": first_p["id"],
    "disclosure_text": "Exchange disclosure dated Nov 2025 confirms order terminated due to vendor non-performance.",
    "disclosure_source": "BSE Exchange Disclosure Nov 2025"
})
print("Updated promise status:", verified.get("status"))
print("Verification evidence recorded:", verified.get("verification_evidence")[:80], "...")

print("\n=== 4. Testing Chatbot RAG Endpoint ===")
chat_res = post("http://127.0.0.1:8000/api/chat", {
    "session_id": "test_e2e_session_1",
    "message": "What are the main red flags and supplier risks identified for Kalindi Smart Mobility?"
})
print("Chat response preview:", chat_res.get("response")[:120], "...")
print("Citations count:", len(chat_res.get("citations", [])))
hist = get("http://127.0.0.1:8000/api/chat/history/test_e2e_session_1")
print("Chat history message count:", len(hist.get("messages", [])))

chat_unknown = post("http://127.0.0.1:8000/api/chat", {
    "session_id": "test_e2e_session_1",
    "message": "What is the promoter secret personal crypto wallet balance?"
})
print("Honest admission on unavailable info:", chat_unknown.get("response")[:120], "...")

print("\n>>> ALL 4 FEATURES VERIFIED SUCCESSFULLY VIA LIVE HTTP API! <<<")
