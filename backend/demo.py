"""Sample case for rehearsals and judging without burning API credits.
Kalindi Smart Mobility Limited and every name below are FICTIONAL."""
import asyncio
import random

COMPANY = "Kalindi Smart Mobility Limited"

CLAIMS = [
    {"id": "c1", "type": "company", "name": COMPANY, "detail": "Issuer of a ₹38.4 crore SME IPO", "page": 1},
    {"id": "c2", "type": "vendor", "name": "Vyom Signal Technologies Pvt Ltd", "detail": "Supplied 61.4% of purchases in FY2025", "page": 142, "website": "vyomsignal.example"},
    {"id": "c3", "type": "vendor", "name": "Arcturus Cabling Solutions", "detail": "Installation subcontractor, ₹6.2 crore in FY2025", "page": 143},
    {"id": "c4", "type": "client", "name": "Northern Metro Transit Corporation", "detail": "Largest customer, 34% of revenue", "page": 144},
    {"id": "c5", "type": "client", "name": "Yamuna Urban Roads Authority", "detail": "Customer, 21% of revenue", "page": 144},
    {"id": "c6", "type": "director", "name": "Rakesh Vardhan", "detail": "Managing Director and Promoter", "page": 201},
    {"id": "c7", "type": "director", "name": "Sunita Malhotra", "detail": "Independent Director", "page": 203},
    {"id": "c8", "type": "address", "name": "Registered office", "detail": "Plot 14, Sector 9, Kalindi Industrial Estate, Delhi 110039", "page": 3},
    {"id": "c9", "type": "financial", "name": "Revenue from operations", "detail": "₹48.6 crore in FY2025, up from ₹11.2 crore in FY2024", "page": 260, "growth_multiple": 4.3},
]

STEPS = {
    "news_litigation": ["Searching news for the issuer and promoters", "Opening SEBI enforcement orders search", "Reading 2 news articles", "Checking e-Courts style case listings", "Compiling findings"],
    "entity_check": ["Searching for the vendor's official site", "Opening vyomsignal.example", "Site has one page and a contact form, no address", "Looking up directors on registry aggregators", "Director Meera Vardhan, same residential address as promoter", "Searching LinkedIn for staff"],
    "domain_age": ["Opening WHOIS lookup", "Reading creation date", "Registrar privacy enabled"],
    "client_mention": ["Searching the client's tender portal", "Reading 2024-25 annual report", "Searching press releases for the issuer's name", "No mention found"],
    "director_network": ["Searching DIN on registry aggregators", "Listing past directorships", "3 of 6 companies are struck off", "Cross-checking with disclosed vendors"],
    "address_check": ["Opening maps for the stated address", "Reading street-level listings", "Checking business directories at this pin code"],
    "financial_sanity": ["Searching LinkedIn for employees", "Reading job portals", "Comparing staff count with reported revenue"],
}

RESULTS = {
    "c1": {"articles": [{"title": "Kalindi Smart Mobility files for SME listing", "url": "https://news.example/kalindi-ipo", "tone": "neutral"}],
           "sebi_orders": [], "court_cases": [{"title": "Cheque dishonour complaint by former supplier", "url": "https://courts.example/case/4471"}], "complaints_count": 1},
    "c2": {"has_website": True, "website_url": "https://vyomsignal.example", "signs_of_real_operations": [], "employees_estimate": 1,
           "registry_status": "active", "linked_to_promoter": True,
           "link_evidence": "Vendor director Meera Vardhan shares a surname and residential address with promoter Rakesh Vardhan.",
           "sources": ["https://registry.example/vyom-signal"]},
    "c2_domain": {"domain": "vyomsignal.example", "created": "2025-06-02", "age_days": 74, "registrant": "Privacy protected"},
    "c3": {"has_website": True, "website_url": "https://arcturuscabling.example", "signs_of_real_operations": ["Project photos", "GST listed"],
           "employees_estimate": 40, "registry_status": "active", "linked_to_promoter": False, "sources": ["https://arcturuscabling.example"]},
    "c4": {"mentions_found": False, "evidence": []},
    "c5": {"mentions_found": True, "evidence": [{"url": "https://yura.example/tenders/2024-17", "snippet": "Work order awarded to Kalindi Smart Mobility Ltd"}]},
    "c6": {"other_companies": [{"name": "Vardhan Infra Projects", "status": "struck off"}, {"name": "Vyom Signal Technologies", "status": "former director"}],
           "struck_off_companies": 3, "sebi_orders": [], "shared_with_vendor": ["Vyom Signal Technologies Pvt Ltd"], "sources": ["https://registry.example/din/0812"]},
    "c7": {"other_companies": [{"name": "Two listed companies", "status": "active"}], "struck_off_companies": 0, "sebi_orders": [], "shared_with_vendor": []},
    "c8": {"business_found": False, "businesses": [], "looks_residential": True, "matches_company": False},
    "c9": {"employees_estimate": 11, "growth_multiple": 4.3, "footprint_note": "About 11 people on LinkedIn and no plant visible for ₹48.6 crore of revenue.", "sources": ["https://linkedin.example/kalindi"]},
}


async def simulate(task):
    await asyncio.sleep(random.uniform(0.2, 2.0))
    for step in STEPS.get(task.kind, ["Working"]):
        await asyncio.sleep(random.uniform(0.9, 2.1))
        yield {"kind": "step", "text": step, "url": None}
    await asyncio.sleep(random.uniform(0.3, 0.8))
    key = task.claim_id + ("_domain" if task.kind == "domain_age" else "")
    yield {"kind": "result", "data": RESULTS.get(key)}


SUMMARY = ("Kalindi's main supplier, which accounts for most of its purchases, looks tied to the promoter family and its website "
           "is only weeks old, while the promoter also sits in that supplier's director history. The registered office shows no "
           "operating business and staff numbers look far too small for a fourfold jump in revenue. Before applying, read the "
           "related-party section of the DRHP and ask the lead manager to explain the supplier relationship.")
