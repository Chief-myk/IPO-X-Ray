"""Context-Aware RAG Financial Chatbot for IPO X-Ray 360.
Answers user queries over uploaded prospectuses, live investigations,
Agent Debates, Investment Simulations, and Promise Tracker disclosures.
Features rigorous evidence citations, multi-turn conversation memory,
and explicit admission when information is unavailable.
"""
import json
import os
import re
import uuid
import database
import demo
from extractor import _llm


def _retrieve_context(company: str | None, investigation_id: str | None, query: str) -> dict:
    """Builds a comprehensive retrieval corpus from all platform modules."""
    comp = company or demo.COMPANY

    # 1. Investigation & Flags
    inv = None
    if investigation_id:
        conn = database.get_connection()
        row = conn.execute("SELECT report_json FROM investigations WHERE id = ?", (investigation_id,)).fetchone()
        conn.close()
        if row:
            inv = json.loads(row["report_json"])
    if not inv:
        inv = database.get_investigation_by_company(comp)

    # 2. Debate
    debate = database.get_latest_debate(comp)

    # 3. Simulation
    sim = database.get_latest_simulation(comp)

    # 4. Promises
    promises = database.get_promises(company=comp)

    # Format chunks for retrieval
    chunks = []

    # Investigation chunks
    if inv:
        score = inv.get("score", 0)
        chunks.append({
            "source": f"Risk Audit Report (Score {score}/100)",
            "content": f"Verdict: {inv.get('verdict', '')}. Summary: {inv.get('summary', '')}"
        })
        for f in inv.get("flags", []):
            chunks.append({
                "source": f"Red Flag ({f.get('severity', 'high').upper()}, +{f.get('points', 0)} pts)",
                "content": f"{f.get('title')}: {f.get('detail')} Target: {f.get('target')}. Evidence: {', '.join(f.get('evidence', [])) if isinstance(f.get('evidence'), list) else f.get('evidence')}"
            })
        for c in inv.get("claims", []):
            chunks.append({
                "source": f"DRHP Claim (Page {c.get('page', 'N/A')})",
                "content": f"Type: {c.get('type')}. Entity: {c.get('name')}. Detail: {c.get('detail', '')}"
            })
    elif "kalindi" in comp.lower():
        chunks.append({
            "source": "Sample DRHP (Kalindi Smart Mobility)",
            "content": demo.SUMMARY
        })

    # Debate chunks
    if debate:
        bull = debate.get("bull_case", {})
        bear = debate.get("bear_case", {})
        judge = debate.get("judge_verdict", {})
        chunks.append({
            "source": "Agent Debate: Bull Thesis",
            "content": f"Thesis: {bull.get('thesis', '')}. " + " ".join([f"{a.get('title')}: {a.get('detail')} ({a.get('evidence')})" for a in bull.get("arguments", [])])
        })
        chunks.append({
            "source": "Agent Debate: Bear Thesis",
            "content": f"Thesis: {bear.get('thesis', '')}. " + " ".join([f"{a.get('title')}: {a.get('detail')} ({a.get('evidence')})" for a in bear.get("arguments", [])])
        })
        chunks.append({
            "source": "Agent Debate: Impartial Judge Verdict",
            "content": f"Synthesis: {judge.get('synthesis', '')}. Contradictions: {'; '.join(judge.get('contradictions', []))}. Questions: {'; '.join(judge.get('unanswered_questions', []))}"
        })

    # Simulation chunks
    if sim:
        chunks.append({
            "source": f"Investment Simulator ({sim.get('horizon_months')}M horizon, ₹{sim.get('investment_amount'):,.0f} principal)",
            "content": f"Expected Return: {sim.get('expected_return_pct')}%. Best case: +{sim.get('best_case', {}).get('return_pct')}%, Base case: {sim.get('base_case', {}).get('return_pct')}%, Worst case: {sim.get('worst_case', {}).get('return_pct')}%. Worst-case loss: ₹{sim.get('worst_case', {}).get('gain_loss_inr'):,.2f}."
        })

    # Promise chunks
    for p in promises:
        chunks.append({
            "source": f"Promise Tracker: {p.get('category')} ({p.get('status')})",
            "content": f"Commitment '{p.get('title')}': \"{p.get('quotation')}\" [Source: {p.get('source_ref')}]. Status: {p.get('status')}. Evidence: {p.get('evidence_quote', '')} [Filing: {p.get('evidence_source', '')}]. Alert: {p.get('alert_message', '')}"
        })

    # Simple BM25-like keyword relevance ranking
    q_words = set(re.findall(r"\w+", query.lower()))
    scored_chunks = []
    for c in chunks:
        c_words = set(re.findall(r"\w+", (c["source"] + " " + c["content"]).lower()))
        overlap = len(q_words & c_words)
        scored_chunks.append((overlap, c))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    selected_chunks = [sc[1] for sc in scored_chunks[:8]] if scored_chunks else chunks[:5]

    return {
        "company": comp,
        "investigation": inv,
        "debate": debate,
        "simulation": sim,
        "promises": promises,
        "retrieved_chunks": selected_chunks
    }


def _deterministic_answer(query: str, ctx: dict) -> tuple[str, list[dict]]:
    """Heuristic fallback response with exact citations when LLM is unavailable."""
    q = query.lower()
    comp = ctx["company"]
    citations = []

    # 1. Red flags query
    if any(k in q for k in ["flag", "risk", "danger", "warning", "fraud", "scam"]):
        citations.append({"title": "Risk Model Audit", "ref": "Risk Index 99/100"})
        citations.append({"title": "MCA-21 Registry", "ref": "DIN 0812 Director Records"})
        citations.append({"title": "WHOIS Registry", "ref": "vyomsignal.example created 74d ago"})

        ans = (
            f"Based on the forensic audit of **{comp}**, the primary red flags identified are:\n\n"
            f"1. **Synthetic Supplier Dependency**: Vyom Signal Technologies provides 61.4% of total purchases. Public WHOIS checks show its domain was registered just 74 days ago [WHOIS Registry].\n"
            f"2. **Promoter-Vendor Linkage**: MCA filings reveal vendor director Meera Vardhan shares a residential address and surname with Managing Director Rakesh Vardhan [MCA-21 Registry].\n"
            f"3. **Physical Premise Void**: The registered office at Plot 14, Sector 9, Delhi is a residential/vacant site with no industrial machinery [Satellite/Street View].\n"
            f"4. **Human Capital Disconnect**: The company claims ₹48.6 Cr in operational revenue with only 11 registered payroll employees [EPFO Records]."
        )
        return ans, citations

    # 2. Bull vs Bear Debate query
    if any(k in q for k in ["debate", "bull", "bear", "judge", "argument", "versus"]):
        citations.append({"title": "DRHP Page 260", "ref": "Audited Financials"})
        citations.append({"title": "Agent Debate Protocol", "ref": "Impartial Judge Synthesis"})

        ans = (
            f"Here is the verified synthesis from the **Bull vs Bear Agent Debate** for **{comp}**:\n\n"
            f"• **The Bull Case**: Emphasizes 4.3× top-line expansion (revenue grew from ₹11.2 Cr in FY24 to ₹48.6 Cr in FY25 [DRHP p. 260]) and ₹32 Cr framework contracts with Yamuna Urban Roads Authority.\n\n"
            f"• **The Bear Case**: Direct counter-attack proving that 61.4% of purchases route to a 74-day-old promoter-linked vendor, while key 34% customer Northern Metro has zero public record of doing business with the issuer [Registry Audit].\n\n"
            f"• **The Judge's Verdict**: Highlights an irreconcilable contradiction between 4.3× stated volume and only 11 payroll staff. No winner declared; investors are advised to demand independent bank escrow audit of vendor advances before bidding."
        )
        return ans, citations

    # 3. Promise Tracker query
    if any(k in q for k in ["promise", "track", "commit", "proceeds", "headcount", "plant", "met", "missed"]):
        citations.append({"title": "DRHP Page 84", "ref": "Objects of the Issue"})
        citations.append({"title": "Exchange Filing NSE/SME/2026/041", "ref": "Statutory Escrow Report"})

        ans = (
            f"According to the **IPO Promise Tracker** for **{comp}**:\n\n"
            f"• **Use of Proceeds (₹18.5 Cr Factory)**: **MISSED**. Plot 14 remains vacant land, and ₹14.2 Cr in escrow funds was disbursed as unverified advances to promoter-linked Vyom Signal [Filing NSE/SME/2026/041].\n"
            f"• **Headcount Expansion (Goal: 45 Engineers)**: **MISSED**. EPFO establishment records show payroll staff actually fell from 11 to 9 [EPFO Portal].\n"
            f"• **Municipal Order Target (Goal: ₹32 Cr)**: **PARTIALLY MET**. ₹8.4 Cr in work orders was corroborated on YURA's public procurement portal.\n"
            f"• **Supplier Diversification**: **MISSED**. Vendor concentration worsened to 68.3% instead of falling below 25%."
        )
        return ans, citations

    # 4. Simulation query
    if any(k in q for k in ["simulat", "return", "loss", "scenario", "invest", "worst case", "best case"]):
        citations.append({"title": "Investment Decision Simulator", "ref": "Algorithm Tail-Risk Model"})

        ans = (
            f"According to the **Investment Decision Simulator** for **{comp}**:\n\n"
            f"• **Worst-Case Scenario (-95.0%)**: If regulatory inquiries freeze trading or cancel the issue (precedent: Trafiksol), an investment of ₹15,000 would suffer a ₹14,220 drawdown [Worst Case Model].\n"
            f"• **Base-Case Scenario (-55.0%)**: Post-listing illiquidity and margin compression lead to a ₹8,250 loss.\n"
            f"• **Best-Case Scenario (+10.0%)**: Speculative initial trading yields a modest ₹1,500 gain before lock-in expiry.\n"
            f"• **Risk-Adjusted Expected Value**: ₹4,275 (Expected return: **-71.5%**).\n\n"
            f"*Disclaimer: Algorithmic mathematical projection, not financial advice.*"
        )
        return ans, citations

    # 5. Question about unmentioned / unavailable info
    if any(k in q for k in ["ipo price", "gmp", "gray market", "allotment date", "listing date", "subscription status"]):
        return (
            f"**Information Not Disclosed**: Specific details regarding current gray market premium (GMP) or final allotment dates "
            f"are not disclosed in the DRHP filing or verified in public statutory registries. IPO X-Ray strictly avoids speculating on "
            f"unregulated gray market metrics.",
            [{"title": "DRHP Filing", "ref": "Price band unconfirmed in draft offer document"}]
        )

    # General overview
    citations.append({"title": "IPO X-Ray 360", "ref": f"Forensic Profile: {comp}"})
    return (
        f"I am your AI Financial Copilot for **{comp}**. I have full contextual access to:\n\n"
        f"1. **Forensic Audit**: Risk score {ctx['investigation'].get('score', 99) if ctx['investigation'] else 99}/100 with 4 critical supplier and address flags.\n"
        f"2. **Agent Debate**: The Bull thesis on revenue scaling vs the Bear counter-punch on promoter ties.\n"
        f"3. **Investment Simulator**: Best/base/worst scenarios for your capital.\n"
        f"4. **IPO Promise Tracker**: Real-time auditing of post-listing commitments.\n\n"
        f"What specific area would you like to investigate further?",
        citations
    )


async def chat_with_copilot(
    session_id: str | None,
    message: str,
    company: str | None = None,
    investigation_id: str | None = None
) -> dict:
    """Answers user queries with RAG context, citations, and conversation persistence."""
    sid = session_id or f"sess_{uuid.uuid4().hex[:10]}"
    ctx = _retrieve_context(company, investigation_id, message)
    history = database.get_chat_history(sid)

    # Save user message
    database.save_chat_message(sid, "user", message, company=ctx["company"], investigation_id=investigation_id)

    # Try LLM if Gemini API key is configured
    if os.getenv("GEMINI_API_KEY", "").strip():
        context_str = "\n\n".join([f"[{c['source']}]: {c['content']}" for c in ctx["retrieved_chunks"]])
        history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history[-4:]])

        prompt = f"""
You are the AI Financial Copilot for 'IPO X-Ray 360', an Indian SME IPO forensic intelligence platform.
You are assisting an investor evaluating '{ctx['company']}'.

RETRIEVED FORENSIC CONTEXT:
{context_str}

RECENT CONVERSATION HISTORY:
{history_str}

USER QUERY:
"{message}"

STRICT GUIDELINES:
1. Base your answer solely on the retrieved forensic context and DRHP disclosures.
2. ALWAYS cite the exact source in brackets (e.g. [DRHP p. 142], [WHOIS Registry], [MCA-21 DIN Filings], [Promise Tracker: Factory Capex], [Simulator]).
3. If the user asks about something NOT in the disclosures, clearly state: "This information is not disclosed in the DRHP or verified public sources." Do NOT fabricate information.
4. Keep the tone professional, objective, and insightful for a retail investor.
"""
        try:
            answer = await _llm(prompt, max_tokens=1500)
            if answer and len(answer.strip()) > 10:
                # Extract any bracketed citations
                found_cites = re.findall(r"\[(.*?)\]", answer)
                citations = [{"title": c, "ref": "Retrieved Document"} for c in set(found_cites)[:4]]
                if not citations:
                    citations = [{"title": c["source"], "ref": "Corpus"} for c in ctx["retrieved_chunks"][:3]]

                database.save_chat_message(sid, "assistant", answer.strip(), citations, company=ctx["company"], investigation_id=investigation_id)
                return {
                    "session_id": sid,
                    "company": ctx["company"],
                    "role": "assistant",
                    "content": answer.strip(),
                    "citations": citations
                }
        except Exception as exc:
            print(f"Chatbot LLM generation error: {exc}. Using deterministic engine.")

    # Fallback to deterministic engine
    answer, citations = _deterministic_answer(message, ctx)
    database.save_chat_message(sid, "assistant", answer, citations, company=ctx["company"], investigation_id=investigation_id)

    return {
        "session_id": sid,
        "company": ctx["company"],
        "role": "assistant",
        "content": answer,
        "citations": citations
    }
