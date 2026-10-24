"""IPO Promise Tracker Engine for IPO X-Ray 360.
Extracts measurable commitments from DRHP/RHP filings and verifies post-listing performance
against subsequent Annual Reports, Exchange Filings, and statutory disclosures.
Classifies commitments as: Met, Partially Met, Missed, or Unverified.
"""
import json
import os
import re
import time
import uuid
import database
from extractor import _llm


def get_all_promises(company: str | None = None, status: str | None = None, category: str | None = None) -> list[dict]:
    """Retrieves promises filtered by company, status, and category."""
    return database.get_promises(company=company, status=status, category=category)


def get_active_alerts(company: str | None = None) -> list[dict]:
    """Retrieves critical and warning alerts where promises diverged or deadlines were missed."""
    return database.get_promise_alerts(company=company)


async def extract_promises_from_prospectus(company: str, text: str) -> list[dict]:
    """Extracts measurable commitments from prospectus text using LLM or structured rules."""
    extracted = []

    # 1. Try LLM extraction if Gemini API is available
    if os.getenv("GEMINI_API_KEY", "").strip() and len(text.strip()) > 100:
        prompt = f"""
You are reading the offer document (DRHP) for the Indian SME IPO '{company}'.
Extract 4 to 6 measurable commitments made by the promoters and management:
- Promised use of IPO proceeds (with exact ₹ amounts)
- Employee headcount expansion
- Revenue and margin targets
- Plant / Showroom / Capex expansion plans
- Specific client acquisitions or contract milestones

CRITICAL:
1. Every commitment MUST include an exact verbatim quotation from the text.
2. Clearly identify baseline value vs target value.
3. State the expected measurement period (e.g., '1 Year Post-Listing (FY26)').
4. Initial status must be 'Unverified' until subsequent post-listing annual reports or filings are uploaded.

Respond ONLY with JSON:
{{
  "commitments": [
    {{
      "category": "use_of_proceeds|headcount|revenue_target|capex_expansion|contracts|client_acquisition",
      "title": "short descriptive title",
      "quotation": "verbatim text from DRHP",
      "source_ref": "DRHP Page number or section",
      "baseline_val": "current value",
      "target_val": "promised target",
      "measurement_period": "1 Year Post-Listing",
      "deadline": "YYYY-MM-DD or reporting period"
    }}
  ]
}}

Prospectus text excerpt:
{text[:45000]}
"""
        try:
            raw = await _llm(prompt, max_tokens=2500)
            if raw:
                cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
                match = re.search(r"\{.*\}", cleaned, re.S)
                if match:
                    data = json.loads(match.group(0))
                    for item in data.get("commitments", []):
                        pid = f"p_{uuid.uuid4().hex[:8]}"
                        item["id"] = pid
                        item["company"] = company
                        item["status"] = "Unverified"
                        item["alert_severity"] = "none"
                        item["alert_message"] = "Extracted from DRHP. Awaiting subsequent post-listing disclosures."
                        database.save_promise(item)
                        extracted.append(item)
                    if extracted:
                        return extracted
        except Exception as exc:
            print(f"Promise extraction LLM error: {exc}. Using fallback rules.")

    # 2. Deterministic Rule-Based Fallback
    # Check for use of proceeds patterns
    proceeds_matches = re.finditer(r"(?:₹|Rs\.?)\s*([\d.]+)\s*(?:crore|lakhs?|cr)?\s*(?:for|towards|shall be deployed|allocated to)\s*([^.\n]{15,100})", text, re.I)
    for m in proceeds_matches:
        amt = m.group(1)
        purpose = m.group(2).strip()
        item = {
            "id": f"p_{uuid.uuid4().hex[:8]}",
            "company": company,
            "category": "use_of_proceeds",
            "title": f"Deployment of ₹{amt} Cr for {purpose[:40]}",
            "quotation": m.group(0),
            "source_ref": "Objects of the Issue",
            "baseline_val": "Unutilized issue proceeds",
            "target_val": f"₹{amt} Cr deployed for {purpose}",
            "measurement_period": "1 Year Post-Listing",
            "deadline": "FY2026",
            "status": "Unverified",
            "alert_severity": "none",
            "alert_message": "Extracted from offer document. Awaiting statutory monitoring agency report."
        }
        database.save_promise(item)
        extracted.append(item)
        if len(extracted) >= 4:
            break

    return extracted


async def verify_commitment(promise_id: str, disclosure_text: str, disclosure_source: str) -> dict:
    """Evaluates whether an extracted promise was Met, Partially Met, Missed, or Unverified based on new filing text."""
    conn = database.get_connection()
    row = conn.execute("SELECT * FROM promises WHERE id = ?", (promise_id,)).fetchone()
    conn.close()
    if not row:
        raise ValueError("Promise not found")

    promise = dict(row)

    # Use LLM verification if available
    if os.getenv("GEMINI_API_KEY", "").strip() and len(disclosure_text.strip()) > 50:
        prompt = f"""
You are an institutional audit specialist verifying an Indian SME IPO commitment against a subsequent public filing.
Commitment:
Company: {promise['company']}
Category: {promise['category']}
Title: {promise['title']}
Original DRHP Quotation: "{promise['quotation']}"
Baseline: {promise['baseline_val']}
Target: {promise['target_val']}

Subsequent Disclosure Text:
Source: {disclosure_source}
"{disclosure_text[:12000]}"

TASK:
Determine whether this promise is:
1. 'Met': The filing confirms full achievement of the target.
2. 'Partially Met': Progress is confirmed, but only partially achieved.
3. 'Missed': The filing confirms failure to achieve, deviation, cancellation, or fund diversion.
4. 'Unverified': The provided disclosure does NOT contain sufficient evidence or mention of this commitment (distinguish strictly from 'Missed'!).

Respond ONLY with JSON:
{{
  "status": "Met|Partially Met|Missed|Unverified",
  "evidence_quote": "exact quote from the subsequent disclosure",
  "alert_severity": "none|info|warning|critical",
  "alert_message": "1-sentence plain English summary of finding"
}}
"""
        try:
            raw = await _llm(prompt, max_tokens=1000)
            if raw:
                cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
                match = re.search(r"\{.*\}", cleaned, re.S)
                if match:
                    res = json.loads(match.group(0))
                    promise["status"] = res.get("status", "Unverified")
                    promise["evidence_quote"] = res.get("evidence_quote", "")
                    promise["evidence_source"] = disclosure_source
                    promise["verification_date"] = time.strftime("%Y-%m-%d")
                    promise["alert_severity"] = res.get("alert_severity", "none")
                    promise["alert_message"] = res.get("alert_message", "")
                    database.save_promise(promise)
                    return promise
        except Exception as exc:
            print(f"Commitment verification LLM error: {exc}")

    # Fallback heuristic analysis
    text_lower = disclosure_text.lower()
    if "cancel" in text_lower or "fraud" in text_lower or "divert" in text_lower or "delay" in text_lower or "unable" in text_lower:
        promise["status"] = "Missed"
        promise["alert_severity"] = "critical"
        promise["alert_message"] = "Disclosures indicate delays, non-performance, or material deviation."
    elif "achieved" in text_lower or "completed" in text_lower or "commissioned" in text_lower:
        promise["status"] = "Met"
        promise["alert_severity"] = "none"
        promise["alert_message"] = "Commitment corroborated as fully met in subsequent filing."
    elif "ongoing" in text_lower or "partially" in text_lower or "progress" in text_lower:
        promise["status"] = "Partially Met"
        promise["alert_severity"] = "info"
        promise["alert_message"] = "Partial milestone execution reported."
    else:
        promise["status"] = "Unverified"
        promise["alert_severity"] = "none"
        promise["alert_message"] = "Disclosure does not contain sufficient verified data to confirm status."

    promise["evidence_quote"] = disclosure_text[:300]
    promise["evidence_source"] = disclosure_source
    promise["verification_date"] = time.strftime("%Y-%m-%d")
    database.save_promise(promise)
    return promise
