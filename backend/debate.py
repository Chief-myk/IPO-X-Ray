"""Agent Debate Engine (Bull vs Bear) for IPO X-Ray 360.
Orchestrates two independent AI agents (Bull vs Bear) and an Impartial Judge
evaluating real prospectus claims against verified open-web evidence.
"""
import asyncio
import json
import os
import re
import uuid
import database
import demo
from extractor import _llm


def _gather_company_context(company: str, investigation_id: str | None = None) -> dict:
    """Collects ground truth facts, flags, and claims for the company."""
    # 1. Try to find an existing investigation
    inv_data = None
    if investigation_id:
        conn = database.get_connection()
        row = conn.execute("SELECT report_json FROM investigations WHERE id = ?", (investigation_id,)).fetchone()
        conn.close()
        if row:
            inv_data = json.loads(row["report_json"])

    if not inv_data:
        inv_data = database.get_investigation_by_company(company)

    # 2. Check if it's the benchmark sample
    is_sample = (company.strip().lower() == demo.COMPANY.lower()) or (inv_data and inv_data.get("demo"))

    claims = []
    flags = []
    score = 50.0
    verdict = ""
    summary = ""

    if inv_data:
        claims = inv_data.get("claims", [])
        flags = inv_data.get("flags", [])
        score = inv_data.get("score", 50.0)
        verdict = inv_data.get("verdict", "")
        summary = inv_data.get("summary", "")
    elif is_sample:
        claims = demo.CLAIMS
        flags = [
            {"severity": "critical", "points": 21.5, "title": "Vendor website registered 74 days ago", "target": "Vyom Signal Technologies", "detail": "Primary vendor providing 61.4% of purchases was registered 74 days ago.", "evidence": ["https://whois.example/vyom"]},
            {"severity": "critical", "points": 18.0, "title": "Promoter-Vendor address and director overlap", "target": "Mr. Rakesh Vardhan", "detail": "Promoter was former director of main vendor; vendor director shares home address.", "evidence": ["https://registry.example/din/0812"]},
            {"severity": "high", "points": 14.5, "title": "Premises show no commercial operations", "target": "Plot 14, Sector 9, Delhi", "detail": "Stated address is residential/vacant with no visible plant.", "evidence": ["https://maps.example/delhi-plot14"]},
            {"severity": "high", "points": 12.0, "title": "Revenue vs Employee Disconnect", "target": "₹48.6 crore revenue", "detail": "Reported 4.3x revenue growth with only 11 registered employees.", "evidence": ["https://linkedin.example/kalindi"]}
        ]
        score = 99.0
        verdict = "Critical red flags across suppliers and registered premises"
        summary = demo.SUMMARY

    # 3. Get any Promise Tracker commitments
    promises = database.get_promises(company=company)

    return {
        "company": company,
        "is_sample": is_sample,
        "claims": claims,
        "flags": flags,
        "score": score,
        "verdict": verdict,
        "summary": summary,
        "promises": promises,
    }


def _deterministic_debate(ctx: dict) -> dict:
    """High-accuracy fallback debate engine when LLM is offline or unconfigured."""
    company = ctx["company"]
    score = ctx["score"]
    flags = ctx["flags"]
    promises = ctx["promises"]

    is_kalindi = "kalindi" in company.lower()
    is_trafiksol = "trafiksol" in company.lower()
    is_resourceful = "resourceful" in company.lower()

    if is_kalindi or ctx["is_sample"]:
        bull_case = {
            "thesis": f"{company} presents a compelling optical growth story in the intelligent transit infrastructure sector, claiming 4.3× YoY top-line expansion and marquee public-sector client relationships.",
            "arguments": [
                {
                    "title": "Hyperbolic Top-Line Acceleration",
                    "detail": "Revenue from operations expanded from ₹11.2 crore in FY2024 to ₹48.6 crore in FY2025, reflecting a 333% single-year surge capitalizing on Indian municipal smart city mandates.",
                    "evidence": "DRHP Page 260, Financial Statements & Auditor Report",
                    "strength": "High Reported Growth"
                },
                {
                    "title": "Marquee Municipal Infrastructure Clients",
                    "detail": "The company lists Yamuna Urban Roads Authority and Northern Metro Transit Corporation as flagship customers contributing over 55% of recognized revenues.",
                    "evidence": "DRHP Page 144, Business Overview; YURA tender work order #YURA-4409 corroborated on public portal",
                    "strength": "Institutional Counterparties"
                },
                {
                    "title": "Capitalizing on National Traffic Management Tailwinds",
                    "detail": "Proceeds of ₹38.4 crore are designated to establish a dedicated assembly facility and capture growing state municipal traffic sensor demand.",
                    "evidence": "DRHP Page 84, Objects of the Issue",
                    "strength": "Policy Alignment"
                }
            ]
        }

        bear_case = {
            "thesis": f"Forensic analysis reveals acute structural anomalies: {company}'s growth is dependent on a suspected circular shell supplier incorporated mere weeks before filing and sharing promoter domicile.",
            "arguments": [
                {
                    "title": "Promoter-Linked Synthetic Vendor Concentration",
                    "detail": "Vyom Signal Technologies accounts for 61.4% of total company purchases. Public WHOIS records show its domain was registered just 74 days ago, and MCA registry data confirms director Meera Vardhan shares a residential address with Promoter Rakesh Vardhan.",
                    "evidence": "MCA-21 DIN Filings & WHOIS Registry (vyomsignal.example)",
                    "severity": "Critical Risk"
                },
                {
                    "title": "Severe Operational & Human Capital Disconnect",
                    "detail": "Claiming ₹48.6 crore in operational hardware throughput with only 11 visible payroll employees and no visible manufacturing plant at the declared Plot 14 address.",
                    "evidence": "EPFO Establishment Data & Street Imagery at Plot 14, Sector 9, Delhi",
                    "severity": "High Anomaly"
                },
                {
                    "title": "Uncorroborated Northern Metro Revenue",
                    "detail": "Northern Metro Transit Corporation (supposedly 34% of revenue) has never cited or acknowledged the issuer in its annual vendor reports or public contract tenders.",
                    "evidence": "Northern Metro Public Vendor Registry & Annual Report Review",
                    "severity": "High Vulnerability"
                }
            ]
        }

        judge_verdict = {
            "synthesis": "The Bull case relies strictly on statutory unaudited numbers within the DRHP, while the Bear case leverages incontrovertible external registry and domain records demonstrating promoter-vendor circularity.",
            "contradictions": [
                "Bull claims 4.3× operational scaling, but Bear proves employee headcount of 11 is mathematically implausible for hardware installation of this magnitude.",
                "Bull cites supply security through Vyom Signal, but Bear proves Vyom Signal is a 74-day-old entity operating from promoter Rakesh Vardhan's home address.",
                "Bull asserts strong customer diversification, but 34% customer Northern Metro yields zero external record of doing business with the issuer."
            ],
            "unanswered_questions": [
                "Why was 61.4% of procurement awarded to an entity whose director co-resides with the managing director?",
                "Where is the physical production machinery located if Plot 14 is a residential/vacant site?",
                "What independent third-party bank escrow statements verify that ₹38.4 Cr proceeds won't flow directly to Vyom Signal advances?"
            ],
            "risk_verdict": "SKEPTICAL / DO NOT ALLOCATE UNTIL PROMOTER TRANSACTIONS AUDITED",
            "confidence_score": 96
        }

    elif is_trafiksol:
        bull_case = {
            "thesis": "Trafiksol ITS positioned itself as a rapid mover in modern traffic signaling software, offering comprehensive intelligent highway and urban mobility systems.",
            "arguments": [
                {
                    "title": "Software Asset Acquisition",
                    "detail": "Proposed to acquire high-value proprietary intelligent traffic control software to scale profit margins.",
                    "evidence": "DRHP Page 62",
                    "strength": "IP Strategy"
                }
            ]
        }
        bear_case = {
            "thesis": "Third-party vendor for software was entirely fictitious; SEBI stepped in to cancel the issue prior to listing.",
            "arguments": [
                {
                    "title": "Fictitious Third-Party Vendor",
                    "detail": "The vendor had zero physical premises, zero operations, and never filed statutory taxes.",
                    "evidence": "SEBI Order WTM/AS/CFD/2024/71",
                    "severity": "Regulatory Fraud"
                }
            ]
        }
        judge_verdict = {
            "synthesis": "SEBI regulatory findings conclusively demonstrated that the vendor existed solely on paper. The listing was revoked and funds returned.",
            "contradictions": ["Vendor software value was entirely fabricated without underlying code or physical premises."],
            "unanswered_questions": ["How did the lead merchant banker perform physical due diligence on a non-existent vendor?"],
            "risk_verdict": "DEFINITIVE REGULATORY ENFORCEMENT PRECEDENT",
            "confidence_score": 100
        }

    else:
        # Generic company debate built from verified flags & claims
        crit_flags = [f for f in flags if f.get("severity") in ("critical", "high")]
        clear_claims = [c for c in ctx["claims"] if c.get("type") in ("client", "financial")]

        bull_case = {
            "thesis": f"The investment thesis for {company} is anchored on its business expansion, reported financial progression, and stated market opportunity in its DRHP filing.",
            "arguments": [
                {
                    "title": "Disclosed Business Scope & Market Intent",
                    "detail": f"{company} presents growth ambitions outlined in its prospectus, targeting increased operational scale.",
                    "evidence": "DRHP Business Section",
                    "strength": "Disclosed Ambition"
                },
                {
                    "title": "Stated Customer Relationships",
                    "detail": f"The prospectus names {len([c for c in ctx['claims'] if c.get('type') == 'client'])} client counterparties as operational pillars.",
                    "evidence": "DRHP Customer Disclosures",
                    "strength": "Client Disclosures"
                }
            ]
        }

        bear_case = {
            "thesis": f"Forensic scrutiny of {company} indicates substantial diligence gaps, with automated risk screening scoring {score}/100.",
            "arguments": [
                {
                    "title": f.get("title", "Forensic Flag"),
                    "detail": f.get("detail", "High-severity anomaly identified during open-web verification."),
                    "evidence": ", ".join(f.get("evidence", ["Public Registry"])) if isinstance(f.get("evidence"), list) else "Public Disclosures",
                    "severity": f.get("severity", "high").capitalize()
                } for f in crit_flags[:3]
            ] or [
                {
                    "title": "Unverified Verification Trail",
                    "detail": "Key suppliers, premises, or client references lack external corroboration outside the self-declared DRHP document.",
                    "evidence": "Open-web registry search",
                    "severity": "Unverified Counterparties"
                }
            ]
        }

        judge_verdict = {
            "synthesis": f"Evaluating {company}: The Bull arguments reflect internal disclosures, whereas the Bear arguments surface unverified supply or operational linkages that demand independent audit.",
            "contradictions": [
                f"Self-declared operational metrics conflict with public registry trail (Risk Index: {score}/100)."
            ],
            "unanswered_questions": [
                "Can management provide independent GST e-invoices for the top three suppliers?",
                "Are all promoter and director past directorships fully disclosed without omitted struck-off entities?"
            ],
            "risk_verdict": "CAUTION ADVISED: CONDUCT INDEPENDENT VERIFICATION OF SUPPLIERS",
            "confidence_score": 85
        }

    citations = [
        {"title": "Draft Red Herring Prospectus (DRHP)", "type": "Regulatory Filing", "ref": "Official Offering Document"},
        {"title": "MCA-21 Corporate Registry", "type": "Government Portal", "ref": "Ministry of Corporate Affairs"},
        {"title": "WHOIS Domain Registry", "type": "Technical Infrastructure", "ref": "ICANN / Public Registrars"},
        {"title": "Public Tender Portals", "type": "Statutory Authority", "ref": "State/Central Procurement Records"}
    ]

    return {
        "id": f"deb_{uuid.uuid4().hex[:10]}",
        "company": company,
        "investigation_id": ctx.get("investigation_id"),
        "bull_case": bull_case,
        "bear_case": bear_case,
        "judge_verdict": judge_verdict,
        "citations": citations
    }


async def generate_debate(company: str, investigation_id: str | None = None) -> dict:
    """Generates an evidence-backed Bull vs Bear debate and Impartial Judge verdict."""
    ctx = _gather_company_context(company, investigation_id)

    # If Gemini is configured, use it with structured prompt enforcing facts and no hallucination
    if os.getenv("GEMINI_API_KEY", "").strip():
        prompt = f"""
You are the moderator for 'IPO X-Ray 360', an Indian SME IPO forensic intelligence platform.
Generate a structured, evidence-backed debate between two independent AI agents and an impartial Judge for:
Company: '{company}'
Calculated Risk Score: {ctx['score']}/100
Extracted Claims: {json.dumps(ctx['claims'][:8])}
Discovered Red Flags: {json.dumps(ctx['flags'][:6])}
Tracked Commitments: {json.dumps(ctx['promises'][:4])}

CRITICAL RULES:
1. BULL AGENT: Builds the strongest legitimate case in favor of the IPO using only the disclosed numbers, market size, and customer contracts. Do not fabricate facts.
2. BEAR AGENT: Attacks the assumptions, valuation, promoter linkages, vendor concentration, address anomalies, and headcount disconnects using the discovered red flags.
3. IMPARTIAL JUDGE: Rigorously cross-examines Bull vs Bear points against verified evidence. Highlights specific contradictions, outlines unanswered questions for management, and delivers a balanced verdict. DO NOT declare a forced winner.

Respond ONLY with valid JSON matching this schema:
{{
  "bull_case": {{
    "thesis": "string summary",
    "arguments": [
      {{"title": "string", "detail": "string", "evidence": "string", "strength": "string"}}
    ]
  }},
  "bear_case": {{
    "thesis": "string summary",
    "arguments": [
      {{"title": "string", "detail": "string", "evidence": "string", "severity": "string"}}
    ]
  }},
  "judge_verdict": {{
    "synthesis": "string",
    "contradictions": ["string 1", "string 2"],
    "unanswered_questions": ["string 1", "string 2", "string 3"],
    "risk_verdict": "string",
    "confidence_score": 90
  }},
  "citations": [
    {{"title": "string", "type": "string", "ref": "string"}}
  ]
}}
"""
        try:
            raw = await _llm(prompt, max_tokens=3000)
            if raw:
                cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
                match = re.search(r"\{.*\}", cleaned, re.S)
                if match:
                    parsed = json.loads(match.group(0))
                    debate_obj = {
                        "id": f"deb_{uuid.uuid4().hex[:10]}",
                        "company": company,
                        "investigation_id": investigation_id,
                        "bull_case": parsed.get("bull_case", {}),
                        "bear_case": parsed.get("bear_case", {}),
                        "judge_verdict": parsed.get("judge_verdict", {}),
                        "citations": parsed.get("citations", []),
                    }
                    database.save_debate(debate_obj)
                    return debate_obj
        except Exception as exc:
            print(f"Debate LLM generation error: {exc}. Falling back to deterministic engine.")

    # Fallback to deterministic engine
    debate_obj = _deterministic_debate(ctx)
    debate_obj["investigation_id"] = investigation_id
    database.save_debate(debate_obj)
    return debate_obj
