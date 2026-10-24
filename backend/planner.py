"""Turns extracted DRHP claims into agent tasks. Each task is a goal, not a script."""
import os
import urllib.parse
from dataclasses import dataclass, asdict, field

KIND_LABELS = {
    "news_litigation": "News, courts and regulators",
    "entity_check": "Vendor reality check",
    "domain_age": "Website age",
    "client_mention": "Client confirmation",
    "director_network": "Director network",
    "address_check": "Address check",
    "financial_sanity": "Scale vs. revenue",
}


@dataclass
class Task:
    id: str
    kind: str
    claim_id: str
    target: str
    url: str
    goal: str
    meta: dict = field(default_factory=dict)

    def public(self):
        d = asdict(self)
        d["label"] = KIND_LABELS.get(self.kind, self.kind)
        return d


def _search(q: str) -> str:
    tpl = os.getenv("SEARCH_URL_TEMPLATE", "https://www.bing.com/search?q={q}")
    return tpl.replace("{q}", urllib.parse.quote_plus(q))


JSON_RULE = (
    " Work like a careful investigator: open the most relevant results, read them, and do not guess. "
    "If you cannot find something, say so in the JSON. Return ONLY valid JSON, no prose, matching this shape: "
)


def plan_tasks(company: str, claims: list[dict]) -> list[Task]:
    tasks: list[Task] = []
    n = 0

    def add(kind, claim, target, url, goal, **meta):
        nonlocal n
        n += 1
        tasks.append(Task(f"a{n}", kind, claim["id"], target, url, goal, meta))

    for c in claims:
        name, detail, t = c.get("name", ""), c.get("detail", ""), c.get("type")

        if t == "company":
            add("news_litigation", c, name, _search(f'"{name}" SEBI OR court OR fraud OR complaint'),
                f'Investigate the Indian company "{name}". Find news coverage, SEBI orders, stock exchange actions, '
                f"court cases (including cheque bounce or insolvency) and investor complaints about it or its promoters."
                + JSON_RULE +
                '{"articles":[{"title":"","url":"","date":"","tone":"positive|neutral|negative"}],'
                '"sebi_orders":[{"title":"","url":"","date":""}],"court_cases":[{"title":"","url":""}],'
                '"complaints_count":0}')

        elif t == "vendor":
            add("entity_check", c, name, _search(f'"{name}"'),
                f'"{company}" says in its IPO document that "{name}" is a vendor ({detail}). '
                f"Find out if {name} is a real operating business: official website, physical address, staff on LinkedIn, "
                f"customers, MCA/company registry status, and whether any of its directors share names, surnames or addresses "
                f'with the promoters of "{company}".'
                + JSON_RULE +
                '{"has_website":true,"website_url":"","signs_of_real_operations":[""],"employees_estimate":0,'
                '"registry_status":"active|struck off|not found","linked_to_promoter":false,"link_evidence":"","sources":[""]}')
            site = c.get("website")
            if site:
                domain = urllib.parse.urlparse(site if "//" in site else "//" + site).netloc or site
                add("domain_age", c, domain, f"https://www.whois.com/whois/{domain}",
                    f"Read the WHOIS record for {domain}. Report when the domain was created and who registered it."
                    + JSON_RULE + '{"domain":"","created":"YYYY-MM-DD","age_days":0,"registrant":""}', domain=domain)

        elif t == "client":
            add("client_mention", c, name, _search(f'"{name}" "{company}"'),
                f'"{company}" claims "{name}" is a customer ({detail}). Search the client\'s own website, tenders, '
                f"press releases, annual reports and news. Does {name} ever mention {company} as a supplier or partner?"
                + JSON_RULE + '{"mentions_found":false,"evidence":[{"url":"","snippet":""}]}')

        elif t == "director":
            add("director_network", c, name, _search(f'"{name}" director DIN companies'),
                f'"{name}" is listed as {detail} of "{company}". Using public company-registry aggregators and news, '
                f"list other companies where this person is or was a director, how many are struck off, any SEBI orders "
                f"naming them, and any overlap with vendors or customers of {company}."
                + JSON_RULE +
                '{"other_companies":[{"name":"","status":""}],"struck_off_companies":0,'
                '"sebi_orders":[{"title":"","url":""}],"shared_with_vendor":[""],"sources":[""]}')

        elif t == "address":
            addr = detail or name
            add("address_check", c, addr, "https://www.google.com/maps/search/" + urllib.parse.quote(addr),
                f'"{company}" lists this as its {name.lower()}: "{addr}". Check maps, street-level listings and '
                f"business directories. What actually operates at this address? Does it look residential or vacant?"
                + JSON_RULE + '{"business_found":false,"businesses":[""],"looks_residential":false,"matches_company":false}')

        elif t == "financial":
            add("financial_sanity", c, name, _search(f'"{company}" employees LinkedIn'),
                f'"{company}" reports: {detail}. Estimate how many people actually work there (LinkedIn, job posts, '
                f"directories) and whether its offices and online footprint match a business of that size."
                + JSON_RULE + '{"employees_estimate":0,"growth_multiple":0,"footprint_note":"","sources":[""]}',
                growth=c.get("growth_multiple"))
    return tasks


def discovery_task(company: str) -> Task:
    """Used when no DRHP is uploaded: one agent finds and reads the offer document itself."""
    return Task("a0", "discovery", "c0", company, _search(f'"{company}" DRHP SME IPO NSE Emerge OR BSE SME'),
                f'Find the Draft Red Herring Prospectus (DRHP) or Red Herring Prospectus for the SME IPO of "{company}" '
                f"on NSE, BSE, SEBI or the merchant banker's site. Open it and read the sections on business, promoters, "
                f"management and financials. Extract every verifiable claim."
                + JSON_RULE +
                '{"claims":[{"type":"company|vendor|client|director|address|financial","name":"","detail":"","page":0,'
                '"website":""}],"document_url":""}')
