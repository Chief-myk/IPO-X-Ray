"""SQLite database layer for IPO X-Ray 360.
Provides persistent storage for Investigations, Bull vs Bear Debates,
Investment Decision Simulations, IPO Promise Tracker commitments, and AI Chatbot sessions.
"""
import json
import os
import sqlite3
import time
import uuid
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "ipo_xray.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS investigations (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            is_demo INTEGER DEFAULT 0,
            score REAL DEFAULT 0,
            probability REAL DEFAULT 0,
            verdict TEXT,
            summary TEXT,
            report_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS debates (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            investigation_id TEXT,
            bull_case TEXT NOT NULL,
            bear_case TEXT NOT NULL,
            judge_verdict TEXT NOT NULL,
            citations TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS simulations (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            investment_amount REAL NOT NULL,
            horizon_months INTEGER NOT NULL,
            risk_score REAL NOT NULL,
            best_case TEXT NOT NULL,
            base_case TEXT NOT NULL,
            worst_case TEXT NOT NULL,
            expected_value REAL NOT NULL,
            assumptions TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS promises (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            quotation TEXT NOT NULL,
            source_ref TEXT NOT NULL,
            baseline_val TEXT,
            target_val TEXT,
            measurement_period TEXT NOT NULL,
            deadline TEXT,
            status TEXT NOT NULL CHECK(status IN ('Met', 'Partially Met', 'Missed', 'Unverified')),
            evidence_quote TEXT,
            evidence_source TEXT,
            verification_date TEXT,
            alert_severity TEXT DEFAULT 'none' CHECK(alert_severity IN ('none', 'info', 'warning', 'critical')),
            alert_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            company TEXT,
            investigation_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            citations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_investigations_company ON investigations(company);
        CREATE INDEX IF NOT EXISTS idx_debates_company ON debates(company);
        CREATE INDEX IF NOT EXISTS idx_promises_company ON promises(company);
        CREATE INDEX IF NOT EXISTS idx_promises_status ON promises(status);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
        """)
    seed_initial_data(conn)
    conn.close()


def seed_initial_data(conn: sqlite3.Connection):
    """Seed benchmark promise tracking records and sample investigation data."""

    # Seed Kalindi Smart Mobility Limited commitments
    sample_promises = [
        {
            "id": "p_kalindi_1",
            "company": "Kalindi Smart Mobility Limited",
            "category": "use_of_proceeds",
            "title": "Automated Controller Manufacturing Facility",
            "quotation": "₹18.50 crore from net issue proceeds shall be deployed towards setting up an automated controller manufacturing unit at Kalindi Industrial Estate by Q3 FY2026.",
            "source_ref": "DRHP Page 84, Objects of the Issue",
            "baseline_val": "Zero manufacturing capacity; 100% outsourced to Vyom Signal",
            "target_val": "Operational factory with 1,200 units/mo capacity",
            "measurement_period": "1 Year Post-Listing (FY26)",
            "deadline": "December 31, 2025",
            "status": "Missed",
            "evidence_quote": "Physical site inspection and ROC filings reveal Plot 14 remains an unconstructed residential plot. Capital expenditure bank escrow shows ₹14.2 crore withdrawn as vendor advances to Vyom Signal Technologies without plant machinery delivery.",
            "evidence_source": "Exchange Disclosure NSE/SME/2026/041 & MCA Statutory Filing",
            "verification_date": "2026-01-15",
            "alert_severity": "critical",
            "alert_message": "Proceeds diverted as advances to promoter-linked vendor with no plant construction.",
        },
        {
            "id": "p_kalindi_2",
            "company": "Kalindi Smart Mobility Limited",
            "category": "headcount",
            "title": "Engineering and Technical Team Expansion",
            "quotation": "The Company intends to scale its specialized technical workforce from 11 engineers to 45 software and traffic systems engineers across Delhi NCR.",
            "source_ref": "DRHP Page 112, Human Capital",
            "baseline_val": "11 registered employees (EPFO records)",
            "target_val": "45 specialized engineers",
            "measurement_period": "1 Year Post-Listing",
            "deadline": "March 31, 2026",
            "status": "Missed",
            "evidence_quote": "EPFO active establishment portal shows only 9 contributing members as of December 2025. LinkedIn talent mapping shows no new engineering hires.",
            "evidence_source": "EPFO Portal Establishment ID: DLCPM004812",
            "verification_date": "2026-02-01",
            "alert_severity": "warning",
            "alert_message": "Headcount dropped from 11 to 9 despite ₹38.4 Cr public fundraise.",
        },
        {
            "id": "p_kalindi_3",
            "company": "Kalindi Smart Mobility Limited",
            "category": "revenue_target",
            "title": "Municipal Tender Order Book Conversion",
            "quotation": "Securing ₹32.0 crore in executed smart signaling orders under Yamuna Urban Roads Authority framework agreement.",
            "source_ref": "DRHP Page 144, Business Operations",
            "baseline_val": "₹11.2 crore annual operational revenue",
            "target_val": "₹32.0 crore verified municipal execution",
            "measurement_period": "Annual Report FY25-26",
            "deadline": "March 31, 2026",
            "status": "Partially Met",
            "evidence_quote": "Yamuna Urban Roads Authority tender portal confirms project work order #YURA-4409 for ₹8.4 crore executed and billed. Northern Metro tender was cancelled.",
            "evidence_source": "YURA Tender Contract Portal & Q2 Performance Update",
            "verification_date": "2026-01-20",
            "alert_severity": "info",
            "alert_message": "₹8.4 Cr executed out of ₹32.0 Cr target (26.2% achievement rate).",
        },
        {
            "id": "p_kalindi_4",
            "company": "Kalindi Smart Mobility Limited",
            "category": "contracts",
            "title": "Direct Component Sourcing Diversification",
            "quotation": "Management commits to reducing purchase concentration from single vendor Vyom Signal from 61.4% to below 25% by onboarding 3 Tier-1 certified suppliers.",
            "source_ref": "DRHP Page 143, Risk Factors #4",
            "baseline_val": "61.4% purchases concentrated in single vendor",
            "target_val": "Single vendor purchase share < 25%",
            "measurement_period": "H1 FY26 Reporting",
            "deadline": "September 30, 2025",
            "status": "Missed",
            "evidence_quote": "H1 FY26 related-party disclosure reports ₹22.1 crore in procurement, of which Vyom Signal accounted for 68.3% (concentration increased by 6.9%).",
            "evidence_source": "NSE Related-Party Disclosure H1-FY26",
            "verification_date": "2025-11-14",
            "alert_severity": "critical",
            "alert_message": "Vendor concentration worsened instead of diversifying; promoter ties persist.",
        },
        {
            "id": "p_kalindi_5",
            "company": "Kalindi Smart Mobility Limited",
            "category": "client_acquisition",
            "title": "Smart City Expansion to 3 New Municipal Corporations",
            "quotation": "Targeting expansion into Jaipur, Lucknow, and Chandigarh municipal smart transit networks during FY2026.",
            "source_ref": "DRHP Page 98, Strategy",
            "baseline_val": "Operational exclusively in Delhi NCR",
            "target_val": "3 new municipal client frameworks",
            "measurement_period": "18 Months Post-Listing",
            "deadline": "June 30, 2026",
            "status": "Unverified",
            "evidence_quote": "No contract awards or bids filed on Rajasthan or UP state procurement portals to date. Measurement period ongoing.",
            "evidence_source": "State Public Procurement Portals (Jaipur/Lucknow)",
            "verification_date": "2026-02-10",
            "alert_severity": "none",
            "alert_message": "Monitoring period active; next scheduled exchange filing expected Q4.",
        },

        # Seed Trafiksol ITS Technologies
        {
            "id": "p_trafiksol_1",
            "company": "Trafiksol ITS Technologies",
            "category": "use_of_proceeds",
            "title": "Software Acquisition from Third-Party Vendor",
            "quotation": "₹17.70 crore of issue proceeds allocated for purchasing proprietary intelligent traffic control software from vendor.",
            "source_ref": "DRHP Page 62, Objects of the Issue",
            "baseline_val": "No in-house software code repository",
            "target_val": "Acquisition of production software IP",
            "measurement_period": "Listing Date",
            "deadline": "September 2024",
            "status": "Missed",
            "evidence_quote": "SEBI interim order confirmed the vendor had no physical presence, no operations, and zero tax filings. Listing cancelled and refund ordered.",
            "evidence_source": "SEBI Order WTM/AS/CFD/2024/71",
            "verification_date": "2024-09-18",
            "alert_severity": "critical",
            "alert_message": "Regulatory halt: Vendor proved fictitious; IPO cancelled by SEBI.",
        },

        # Seed Resourceful Automobile
        {
            "id": "p_resourceful_1",
            "company": "Resourceful Automobile",
            "category": "capex_expansion",
            "title": "Expansion from 2 Showrooms to New Regional Outlets",
            "quotation": "Net proceeds of ₹12 crore to be utilized for opening two new premium showroom outlets in Delhi NCR and expanding dealership inventory.",
            "source_ref": "Prospectus Page 48",
            "baseline_val": "2 showrooms (Sawhney Automobile) with 8 employees",
            "target_val": "4 operational dealerships",
            "measurement_period": "1 Year Post-Listing",
            "deadline": "August 31, 2025",
            "status": "Partially Met",
            "evidence_quote": "One lease signed in Rohini Sector 11; fit-out ongoing. Staff headcount increased from 8 to 14. Second showroom delayed.",
            "evidence_source": "Annual Report FY2024-25, Management Discussion",
            "verification_date": "2025-09-10",
            "alert_severity": "info",
            "alert_message": "1 out of 2 showrooms opened. Slower rollout than marketed in prospectus.",
        }
    ]

    with conn:
        for p in sample_promises:
            conn.execute("""
            INSERT OR REPLACE INTO promises (
                id, company, category, title, quotation, source_ref,
                baseline_val, target_val, measurement_period, deadline,
                status, evidence_quote, evidence_source, verification_date,
                alert_severity, alert_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"], p["company"], p["category"], p["title"], p["quotation"],
                p["source_ref"], p["baseline_val"], p["target_val"], p["measurement_period"],
                p["deadline"], p["status"], p["evidence_quote"], p["evidence_source"],
                p["verification_date"], p["alert_severity"], p["alert_message"]
            ))

        # Seed a sample investigation record for Kalindi
        conn.execute("""
        INSERT OR REPLACE INTO investigations (
            id, company, is_demo, score, probability, verdict, summary, report_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "inv_kalindi_sample",
            "Kalindi Smart Mobility Limited",
            1,
            99.0,
            0.99,
            "Critical red flags across suppliers and registered premises",
            "Kalindi's main supplier accounts for 61.4% of purchases, was incorporated weeks before filing, and is tied to the promoter. The registered office shows no operating business and staff headcount of 11 is implausible for ₹48.6 crore revenue.",
            json.dumps({
                "company": "Kalindi Smart Mobility Limited",
                "score": 99,
                "probability": 0.99,
                "verdict": "Critical red flags across suppliers and registered premises",
                "flags": [
                    {"severity": "critical", "points": 21.5, "title": "Vendor website registered 74 days ago", "target": "Vyom Signal Technologies", "detail": "Primary vendor providing 61.4% of procurement was registered shortly before DRHP filing.", "evidence": ["https://whois.example/vyom"]},
                    {"severity": "critical", "points": 18.0, "title": "Promoter-Vendor address and director overlap", "target": "Mr. Rakesh Vardhan", "detail": "Promoter previously directed main supplier; vendor director shares residential address.", "evidence": ["https://mca.gov.in/din/0812"]},
                    {"severity": "high", "points": 14.5, "title": "Premises show no commercial operations", "target": "Plot 14, Sector 9, Delhi", "detail": "Registered address is residential/vacant with no visible plant machinery.", "evidence": ["https://maps.example/delhi-plot14"]},
                    {"severity": "high", "points": 12.0, "title": "Revenue vs Employee Disconnect", "target": "₹48.6 crore revenue", "detail": "Reported 4.3x revenue growth with only 11 registered employees on payroll.", "evidence": ["https://epfindia.gov.in"]}
                ]
            })
        ))


# --- Database Operations Helper Functions ---

def save_investigation(inv_data: dict):
    conn = get_connection()
    with conn:
        conn.execute("""
        INSERT OR REPLACE INTO investigations (
            id, company, is_demo, score, probability, verdict, summary, report_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inv_data["id"],
            inv_data["company"],
            1 if inv_data.get("demo") else 0,
            inv_data.get("score", 0),
            inv_data.get("probability", 0),
            inv_data.get("verdict", ""),
            inv_data.get("summary", ""),
            json.dumps(inv_data)
        ))
    conn.close()


def get_investigation_by_company(company: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM investigations WHERE LOWER(company) = LOWER(?) ORDER BY created_at DESC LIMIT 1",
        (company.strip(),)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return json.loads(row["report_json"])


def save_debate(debate_data: dict):
    conn = get_connection()
    with conn:
        conn.execute("""
        INSERT OR REPLACE INTO debates (
            id, company, investigation_id, bull_case, bear_case, judge_verdict, citations
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            debate_data["id"],
            debate_data["company"],
            debate_data.get("investigation_id"),
            json.dumps(debate_data["bull_case"]),
            json.dumps(debate_data["bear_case"]),
            json.dumps(debate_data["judge_verdict"]),
            json.dumps(debate_data.get("citations", []))
        ))
    conn.close()


def get_latest_debate(company: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM debates WHERE LOWER(company) = LOWER(?) ORDER BY created_at DESC LIMIT 1",
        (company.strip(),)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "company": row["company"],
        "investigation_id": row["investigation_id"],
        "bull_case": json.loads(row["bull_case"]),
        "bear_case": json.loads(row["bear_case"]),
        "judge_verdict": json.loads(row["judge_verdict"]),
        "citations": json.loads(row["citations"]),
        "created_at": row["created_at"],
    }


def save_simulation(sim_data: dict):
    conn = get_connection()
    with conn:
        conn.execute("""
        INSERT OR REPLACE INTO simulations (
            id, company, investment_amount, horizon_months, risk_score,
            best_case, base_case, worst_case, expected_value, assumptions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sim_data["id"],
            sim_data["company"],
            sim_data["investment_amount"],
            sim_data["horizon_months"],
            sim_data["risk_score"],
            json.dumps(sim_data["best_case"]),
            json.dumps(sim_data["base_case"]),
            json.dumps(sim_data["worst_case"]),
            sim_data["expected_value"],
            json.dumps(sim_data["assumptions"])
        ))
    conn.close()


def get_latest_simulation(company: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM simulations WHERE LOWER(company) = LOWER(?) ORDER BY created_at DESC LIMIT 1",
        (company.strip(),)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "company": row["company"],
        "investment_amount": row["investment_amount"],
        "horizon_months": row["horizon_months"],
        "risk_score": row["risk_score"],
        "best_case": json.loads(row["best_case"]),
        "base_case": json.loads(row["base_case"]),
        "worst_case": json.loads(row["worst_case"]),
        "expected_value": row["expected_value"],
        "assumptions": json.loads(row["assumptions"]),
        "created_at": row["created_at"],
    }


def get_promises(company: str | None = None, status: str | None = None, category: str | None = None) -> list[dict]:
    conn = get_connection()
    query = "SELECT * FROM promises WHERE 1=1"
    params = []
    if company:
        query += " AND LOWER(company) LIKE LOWER(?)"
        params.append(f"%{company.strip()}%")
    if status:
        query += " AND status = ?"
        params.append(status)
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY CASE alert_severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 ELSE 4 END, created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_promise_alerts(company: str | None = None) -> list[dict]:
    conn = get_connection()
    query = "SELECT * FROM promises WHERE alert_severity IN ('critical', 'warning', 'info')"
    params = []
    if company:
        query += " AND LOWER(company) LIKE LOWER(?)"
        params.append(f"%{company.strip()}%")
    query += " ORDER BY CASE alert_severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, updated_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_promise(promise: dict) -> str:
    pid = promise.get("id") or f"p_{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    with conn:
        conn.execute("""
        INSERT OR REPLACE INTO promises (
            id, company, category, title, quotation, source_ref,
            baseline_val, target_val, measurement_period, deadline,
            status, evidence_quote, evidence_source, verification_date,
            alert_severity, alert_message, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            pid,
            promise["company"],
            promise["category"],
            promise["title"],
            promise["quotation"],
            promise.get("source_ref", "DRHP"),
            promise.get("baseline_val", ""),
            promise.get("target_val", ""),
            promise.get("measurement_period", "1 Year Post-Listing"),
            promise.get("deadline", ""),
            promise.get("status", "Unverified"),
            promise.get("evidence_quote", ""),
            promise.get("evidence_source", ""),
            promise.get("verification_date", time.strftime("%Y-%m-%d")),
            promise.get("alert_severity", "none"),
            promise.get("alert_message", "")
        ))
    conn.close()
    return pid


def get_chat_history(session_id: str) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT role, content, citations, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
        (session_id,)
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            "role": r["role"],
            "content": r["content"],
            "citations": json.loads(r["citations"]) if r["citations"] else [],
            "created_at": r["created_at"],
        })
    return out


def save_chat_message(session_id: str, role: str, content: str, citations: list | None = None, company: str | None = None, investigation_id: str | None = None):
    conn = get_connection()
    with conn:
        conn.execute("""
        INSERT OR IGNORE INTO chat_sessions (session_id, company, investigation_id)
        VALUES (?, ?, ?)
        """, (session_id, company, investigation_id))
        
        conn.execute("""
        UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP, company = COALESCE(?, company), investigation_id = COALESCE(?, investigation_id)
        WHERE session_id = ?
        """, (company, investigation_id, session_id))

        msg_id = f"msg_{uuid.uuid4().hex[:10]}"
        conn.execute("""
        INSERT INTO chat_messages (id, session_id, role, content, citations)
        VALUES (?, ?, ?, ?, ?)
        """, (msg_id, session_id, role, content, json.dumps(citations or [])))
    conn.close()


def clear_chat_history(session_id: str):
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
    conn.close()
