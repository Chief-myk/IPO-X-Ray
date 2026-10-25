/**
 * IPO X-Ray 360 - Comprehensive IPO Catalog
 * Contains detailed metadata for Indian Mainboard & SME IPOs:
 * - Status: 'open', 'upcoming', 'closed', 'listed'
 * - Board: 'NSE Mainboard', 'BSE Mainboard', 'NSE Emerge SME', 'BSE SME'
 * - Risk Assessment, Financials, Documents, Bull/Bear points, Timeline & Historical Comparables
 */

export const IPO_CATALOG = [
  {
    id: 'kalindi-smart-mobility',
    name: 'Kalindi Smart Mobility Limited',
    symbol: 'KALINDI-SM',
    board: 'NSE Emerge SME',
    sector: 'Smart Transit & IoT Infrastructure',
    status: 'closed', // Closed awaiting allotment / newly listed
    issueDates: 'Oct 14 - Oct 17, 2026',
    openDate: '2026-10-14',
    closeDate: '2026-10-17',
    allotmentDate: '2026-10-20',
    refundDate: '2026-10-21',
    listingDate: '2026-10-24',
    priceBand: '₹85 - ₹90',
    minPrice: 85,
    maxPrice: 90,
    lotSize: 1600,
    minInvestment: 144000,
    issueSize: '₹38.40 Cr',
    issueSizeCr: 38.4,
    freshIssue: '₹32.00 Cr',
    ofs: '₹6.40 Cr',
    qibQuota: '50%',
    niiQuota: '15%',
    retailQuota: '35%',
    subscription: {
      total: 42.8,
      qib: 18.2,
      nii: 58.4,
      retail: 51.6,
      updatedAt: '2026-10-17 17:00 IST'
    },
    gmp: {
      value: 38,
      percentage: 42.2,
      trend: 'down',
      updatedAt: '2026-10-24'
    },
    riskScore: 78, // High Forensic Risk (0-100)
    riskLevel: 'critical',
    riskLabel: 'Critical Forensic Flags',
    forensicFlagsCount: 5,
    summary: 'Supplier of adaptive traffic signaling systems and automated controllers to municipal corporations. Forensic screening detected critical vendor concentration and unconstructed manufacturing site.',
    businessModel: 'Assembles smart signaling controllers and provides deployment services to municipal corporations in Delhi NCR. Operates on government EPC contracts with high receivables and 68% procurement routed through a single vendor (Vyom Signal Technologies).',
    financials: {
      revenueFY24: '₹14.20 Cr',
      revenueFY25: '₹22.60 Cr',
      revenueFY26: '₹38.10 Cr',
      patFY24: '₹0.85 Cr',
      patFY25: '₹1.92 Cr',
      patFY26: '₹4.15 Cr',
      eps: '₹4.82',
      pe: 18.67,
      industryPe: 28.4,
      ronw: '21.4%',
      debtToEquity: '1.42',
      totalDebt: '₹16.8 Cr'
    },
    forensicHighlights: [
      {
        title: 'Undisclosed Promoter Vendor Link',
        severity: 'critical',
        source: 'DRHP Page 143 & MCA ROC Filing',
        description: 'Vendor Vyom Signal Technologies accounts for 68.3% of total component procurement. MCA records show common registered office and shared directorship with promoter’s first cousin.'
      },
      {
        title: 'Manufacturing Site Inconsistency',
        severity: 'critical',
        source: 'DRHP Page 84 vs Exchange Inspection',
        description: '₹18.50 Cr of net proceeds allocated for controller manufacturing unit at Kalindi Industrial Estate. ROC site inspection indicates plot remains barren residential land with no active construction.'
      },
      {
        title: 'Abnormal Headcount to Revenue Ratio',
        severity: 'high',
        source: 'EPFO Active Establishment Records',
        description: 'Reported 4.2x revenue growth over 24 months with only 9 active EPFO registered employees (down from 11 in prior fiscal).'
      },
      {
        title: 'Cash Flow Divergence',
        severity: 'medium',
        source: 'Restated Financial Statements Page 162',
        description: 'Positive PAT of ₹4.15 Cr accompanied by negative operating cash flow (-₹6.80 Cr) due to surging trade receivables older than 180 days.'
      }
    ],
    documents: [
      {
        name: 'Draft Red Herring Prospectus (DRHP)',
        type: 'DRHP',
        date: '2026-08-12',
        size: '14.2 MB',
        url: 'https://www.sebi.gov.in',
        isOfficial: true
      },
      {
        name: 'Red Herring Prospectus (RHP)',
        type: 'RHP',
        date: '2026-10-04',
        size: '16.8 MB',
        url: 'https://www.nseindia.com',
        isOfficial: true
      },
      {
        name: 'Anchor Investor Allocation List',
        type: 'Anchor',
        date: '2026-10-13',
        size: '1.1 MB',
        url: 'https://www.nseindia.com',
        isOfficial: true
      },
      {
        name: 'Independent Forensic Audit & Site Inspection',
        type: 'Forensic Audit',
        date: '2026-10-22',
        size: '3.4 MB',
        url: '/api/investigations/kalindi-smart-mobility',
        isOfficial: false
      }
    ],
    promoterNetwork: {
      promoters: ['Rajeev Kalindi', 'Sunita Kalindi'],
      promoterHoldingsPre: '89.4%',
      promoterHoldingsPost: '64.2%',
      linkedEntities: [
        { name: 'Vyom Signal Technologies Pvt Ltd', relation: 'Common Address & 68% Vendor', risk: 'critical' },
        { name: 'Kalindi Infra EPC LLP', relation: 'Promoter Owned Entity', risk: 'medium' },
        { name: 'Urban Green Mobility Solutions', relation: 'Cross-Guarantee Provider', risk: 'high' }
      ]
    },
    historicalComparables: [
      { name: 'Trafiksol ITS Technologies', year: 2024, listingGain: '-4.2%', return1Y: '-58.4%', issuePE: 21.2, outcome: 'SEBI Post-Listing Probe' },
      { name: 'Resourceful Automobile', year: 2024, listingGain: '+12.5%', return1Y: '-44.2%', issuePE: 34.0, outcome: 'High Headcount Discrepancy' },
      { name: 'Effwa Infra & Research', year: 2024, listingGain: '+85.0%', return1Y: '+112.0%', issuePE: 16.5, outcome: 'Strong Cash Flows Verified' }
    ]
  },
  {
    id: 'premier-clean-energies',
    name: 'Premier Clean Energies Limited',
    symbol: 'PREMIERENG',
    board: 'NSE Mainboard',
    sector: 'Solar PV Modules & Renewable EPC',
    status: 'open',
    issueDates: 'Oct 23 - Oct 27, 2026',
    openDate: '2026-10-23',
    closeDate: '2026-10-27',
    allotmentDate: '2026-10-28',
    refundDate: '2026-10-29',
    listingDate: '2026-11-03',
    priceBand: '₹425 - ₹450',
    minPrice: 425,
    maxPrice: 450,
    lotSize: 33,
    minInvestment: 14850,
    issueSize: '₹2,830 Cr',
    issueSizeCr: 2830,
    freshIssue: '₹1,500 Cr',
    ofs: '₹1,330 Cr',
    qibQuota: '50%',
    niiQuota: '15%',
    retailQuota: '35%',
    subscription: {
      total: 14.6,
      qib: 24.1,
      nii: 19.8,
      retail: 8.4,
      updatedAt: '2026-10-25 15:30 IST'
    },
    gmp: {
      value: 125,
      percentage: 27.8,
      trend: 'up',
      updatedAt: '2026-10-25'
    },
    riskScore: 18, // Low Forensic Risk (Clean)
    riskLevel: 'clear',
    riskLabel: 'Low Forensic Risk (Clean)',
    forensicFlagsCount: 0,
    summary: 'Leading Indian integrated solar cell and module manufacturer with 4.8 GW operational capacity. Robust balance sheet, certified manufacturing sites, and clean related-party disclosures.',
    businessModel: 'Designs, manufactures, and supplies high-efficiency mono-PERC and TOPCon solar cells and modules. Serves utility-scale developers and commercial rooftop EPC clients with long-term take-or-pay supply contracts.',
    financials: {
      revenueFY24: '₹1,460 Cr',
      revenueFY25: '₹2,140 Cr',
      revenueFY26: '₹3,210 Cr',
      patFY24: '₹84 Cr',
      patFY25: '₹188 Cr',
      patFY26: '₹342 Cr',
      eps: '₹18.40',
      pe: 24.45,
      industryPe: 38.6,
      ronw: '26.8%',
      debtToEquity: '0.45',
      totalDebt: '₹480 Cr'
    },
    forensicHighlights: [
      {
        title: 'Verifiable Manufacturing Assets',
        severity: 'clear',
        source: 'SEBI DRHP & Satellite Imagery Verification',
        description: 'Physical facilities verified in Hyderabad and Gujarat. EPC orders substantiated through public filings of utility customers (NTPC, Tata Power).'
      },
      {
        title: 'Independent Statutory Audit',
        severity: 'clear',
        source: 'Big-4 Auditor Report FY25-26',
        description: 'Unqualified audit report with clean internal financial controls over financial reporting.'
      }
    ],
    documents: [
      {
        name: 'Draft Red Herring Prospectus (DRHP)',
        type: 'DRHP',
        date: '2026-07-15',
        size: '28.4 MB',
        url: 'https://www.sebi.gov.in',
        isOfficial: true
      },
      {
        name: 'Red Herring Prospectus (RHP)',
        type: 'RHP',
        date: '2026-10-15',
        size: '32.1 MB',
        url: 'https://www.bseindia.com',
        isOfficial: true
      }
    ],
    promoterNetwork: {
      promoters: ['Chiranjeevi Saluja', 'Surender Pal Singh'],
      promoterHoldingsPre: '82.1%',
      promoterHoldingsPost: '68.5%',
      linkedEntities: []
    },
    historicalComparables: [
      { name: 'Waaree Energies', year: 2024, listingGain: '+69.7%', return1Y: '+140.2%', issuePE: 28.5, outcome: 'Market Leader in Solar' },
      { name: 'Premier Energies', year: 2024, listingGain: '+120.4%', return1Y: '+165.0%', issuePE: 26.0, outcome: 'Strong Margin Expansion' }
    ]
  },
  {
    id: 'cybercore-technologies',
    name: 'CyberCore Defense & AI Limited',
    symbol: 'CYBERCORE',
    board: 'BSE Mainboard',
    sector: 'Cybersecurity & Defense AI',
    status: 'upcoming',
    issueDates: 'Nov 04 - Nov 07, 2026',
    openDate: '2026-11-04',
    closeDate: '2026-11-07',
    allotmentDate: '2026-11-10',
    refundDate: '2026-11-11',
    listingDate: '2026-11-14',
    priceBand: '₹510 - ₹540',
    minPrice: 510,
    maxPrice: 540,
    lotSize: 27,
    minInvestment: 14580,
    issueSize: '₹950 Cr',
    issueSizeCr: 950,
    freshIssue: '₹750 Cr',
    ofs: '₹200 Cr',
    qibQuota: '50%',
    niiQuota: '15%',
    retailQuota: '35%',
    subscription: {
      total: 0,
      qib: 0,
      nii: 0,
      retail: 0,
      updatedAt: 'Bidding starts Nov 04'
    },
    gmp: {
      value: 165,
      percentage: 30.5,
      trend: 'up',
      updatedAt: '2026-10-25'
    },
    riskScore: 32, // Low-Medium Risk
    riskLevel: 'low',
    riskLabel: 'Low-to-Moderate Risk',
    forensicFlagsCount: 1,
    summary: 'Proprietary automated cyber threat intelligence and zero-trust orchestration for defense ministries, aerospace contractors, and scheduled commercial banks.',
    businessModel: 'Subscription SaaS licenses combined with mission-critical security operations center (SOC) deployment contracts. Over 74% recurring revenue model with 124% net retention rate.',
    financials: {
      revenueFY24: '₹185 Cr',
      revenueFY25: '₹294 Cr',
      revenueFY26: '₹460 Cr',
      patFY24: '₹22 Cr',
      patFY25: '₹48 Cr',
      patFY26: '₹89 Cr',
      eps: '₹14.20',
      pe: 38.02,
      industryPe: 52.4,
      ronw: '29.5%',
      debtToEquity: '0.08',
      totalDebt: '₹14 Cr'
    },
    forensicHighlights: [
      {
        title: 'High Client Concentration in Defense',
        severity: 'medium',
        source: 'DRHP Page 98, Risk Factors',
        description: 'Top 3 government defense procurement contracts contribute 58% of total revenue. Any tender delay directly impacts quarterly EBITDA.'
      }
    ],
    documents: [
      {
        name: 'Draft Red Herring Prospectus (DRHP)',
        type: 'DRHP',
        date: '2026-08-28',
        size: '18.9 MB',
        url: 'https://www.sebi.gov.in',
        isOfficial: true
      }
    ],
    promoterNetwork: {
      promoters: ['Vikramaditya Rao', 'Ananya Deshmukh'],
      promoterHoldingsPre: '76.4%',
      promoterHoldingsPost: '59.2%',
      linkedEntities: []
    },
    historicalComparables: [
      { name: 'Ideaforge Technology', year: 2023, listingGain: '+94.2%', return1Y: '-28.0%', issuePE: 87.5, outcome: 'Valuation De-rating Post Listing' },
      { name: 'Data Patterns India', year: 2021, listingGain: '+47.6%', return1Y: '+184.0%', issuePE: 45.2, outcome: 'Consistent Order Book Conversion' }
    ]
  },
  {
    id: 'aarogya-biomedical',
    name: 'Aarogya Biomedical Devices Limited',
    symbol: 'AAROGYA-SM',
    board: 'BSE SME',
    sector: 'Medical Devices & Diagnostics',
    status: 'open',
    issueDates: 'Oct 24 - Oct 28, 2026',
    openDate: '2026-10-24',
    closeDate: '2026-10-28',
    allotmentDate: '2026-10-29',
    refundDate: '2026-10-30',
    listingDate: '2026-11-04',
    priceBand: '₹118 - ₹124',
    minPrice: 118,
    maxPrice: 124,
    lotSize: 1000,
    minInvestment: 124000,
    issueSize: '₹24.80 Cr',
    issueSizeCr: 24.8,
    freshIssue: '₹24.80 Cr',
    ofs: '₹0.00 Cr',
    qibQuota: '0%',
    niiQuota: '50%',
    retailQuota: '50%',
    subscription: {
      total: 8.9,
      qib: 0,
      nii: 12.4,
      retail: 5.4,
      updatedAt: '2026-10-25 16:00 IST'
    },
    gmp: {
      value: 22,
      percentage: 17.7,
      trend: 'neutral',
      updatedAt: '2026-10-25'
    },
    riskScore: 52, // Moderate Forensic Risk
    riskLevel: 'medium',
    riskLabel: 'Moderate Forensic Risk',
    forensicFlagsCount: 2,
    summary: 'Manufacturer of hospital hemodialysis consumables and orthopedic implants with domestic hospital network distribution.',
    businessModel: 'Operates an ISO 13485 facility in Baddi, Himachal Pradesh. Sells single-use dialysis lines and surgical screws via dealer networks across North India.',
    financials: {
      revenueFY24: '₹12.4 Cr',
      revenueFY25: '₹19.2 Cr',
      revenueFY26: '₹28.5 Cr',
      patFY24: '₹0.9 Cr',
      patFY25: '₹1.8 Cr',
      patFY26: '₹3.1 Cr',
      eps: '₹5.10',
      pe: 24.31,
      industryPe: 34.0,
      ronw: '18.2%',
      debtToEquity: '0.92',
      totalDebt: '₹11.2 Cr'
    },
    forensicHighlights: [
      {
        title: 'Pending CDSCO Regulatory License Renewal',
        severity: 'high',
        source: 'CDSCO Medical Device Regulatory Portal',
        description: 'Manufacturing license for Class C invasive device up for mandatory quinquennial renewal; audit inspection pending since June 2026.'
      },
      {
        title: 'Extended Dealer Credit Cycles',
        severity: 'medium',
        source: 'RHP Balance Sheet Footnote 19',
        description: 'Debtor collection days stretched from 88 days in FY24 to 142 days in FY26.'
      }
    ],
    documents: [
      {
        name: 'Red Herring Prospectus (RHP)',
        type: 'RHP',
        date: '2026-10-18',
        size: '12.4 MB',
        url: 'https://www.bseindia.com',
        isOfficial: true
      }
    ],
    promoterNetwork: {
      promoters: ['Dr. Harish Nambiar', 'Meena Nambiar'],
      promoterHoldingsPre: '92.0%',
      promoterHoldingsPost: '68.0%',
      linkedEntities: []
    },
    historicalComparables: [
      { name: 'Poly Medicure', year: 2020, listingGain: '+35.0%', return1Y: '+180.0%', issuePE: 32.0, outcome: 'Compounding Export Player' },
      { name: 'Hemant Surgical', year: 2023, listingGain: '+92.0%', return1Y: '+14.0%', issuePE: 19.5, outcome: 'Moderate Growth' }
    ]
  },
  {
    id: 'bajaj-housing-finance',
    name: 'Bajaj Housing Finance Limited',
    symbol: 'BAJAJHFL',
    board: 'NSE Mainboard',
    sector: 'Housing Finance (NBFC-UL)',
    status: 'listed',
    issueDates: 'Sep 09 - Sep 11, 2024',
    openDate: '2024-09-09',
    closeDate: '2024-09-11',
    allotmentDate: '2024-09-12',
    refundDate: '2024-09-13',
    listingDate: '2024-09-16',
    priceBand: '₹66 - ₹70',
    minPrice: 66,
    maxPrice: 70,
    lotSize: 214,
    minInvestment: 14980,
    issueSize: '₹6,560 Cr',
    issueSizeCr: 6560,
    freshIssue: '₹3,560 Cr',
    ofs: '₹3,000 Cr',
    qibQuota: '50%',
    niiQuota: '15%',
    retailQuota: '35%',
    subscription: {
      total: 67.4,
      qib: 111.4,
      nii: 43.8,
      retail: 7.4,
      updatedAt: 'Closed'
    },
    gmp: {
      value: 78,
      percentage: 111.4,
      trend: 'up',
      updatedAt: 'Listed'
    },
    riskScore: 12,
    riskLevel: 'clear',
    riskLabel: 'Institutional Grade Governance',
    forensicFlagsCount: 0,
    summary: 'RBI upper-layer non-deposit-taking housing finance company belonging to the Bajaj Group. Clean asset quality, lowest GNPA in sector, and blue-chip promoter backing.',
    businessModel: 'Provides retail mortgage loans, home loans, developer finance, and loan against property (LAP) with prime underwriting criteria.',
    financials: {
      revenueFY24: '₹7,617 Cr',
      revenueFY25: '₹9,840 Cr',
      revenueFY26: '₹12,450 Cr',
      patFY24: '₹1,731 Cr',
      patFY25: '₹2,180 Cr',
      patFY26: '₹2,840 Cr',
      eps: '₹2.70',
      pe: 48.2,
      industryPe: 22.0,
      ronw: '15.2%',
      debtToEquity: '5.2',
      totalDebt: '₹62,000 Cr'
    },
    forensicHighlights: [
      {
        title: 'Zero Material Regulatory Infractions',
        severity: 'clear',
        source: 'RBI & NHB Inspection Reports',
        description: 'Clean regulatory standing with lowest GNPA (0.28%) and NNPA (0.11%) among Indian housing finance companies.'
      }
    ],
    documents: [
      {
        name: 'Prospectus (Final)',
        type: 'Prospectus',
        date: '2024-09-13',
        size: '42.5 MB',
        url: 'https://www.bseindia.com',
        isOfficial: true
      }
    ],
    promoterNetwork: {
      promoters: ['Bajaj Finance Limited', 'Bajaj Finserv Limited'],
      promoterHoldingsPre: '100%',
      promoterHoldingsPost: '88.75%',
      linkedEntities: []
    },
    historicalComparables: [
      { name: 'Aavas Financiers', year: 2018, listingGain: '-8.0%', return1Y: '+84.0%', issuePE: 38.0, outcome: 'Affordable Housing Compounder' },
      { name: 'Home First Finance', year: 2021, listingGain: '+19.0%', return1Y: '+52.0%', issuePE: 28.0, outcome: 'Consistent ROE Execution' }
    ]
  },
  {
    id: 'trafiksol-its-technologies',
    name: 'Trafiksol ITS Technologies Limited',
    symbol: 'TRAFIKSOL-SM',
    board: 'BSE SME',
    sector: 'Intelligent Transportation Systems',
    status: 'listed',
    issueDates: 'Sep 10 - Sep 12, 2024',
    openDate: '2024-09-10',
    closeDate: '2024-09-12',
    allotmentDate: '2024-09-13',
    refundDate: '2024-09-16',
    listingDate: 'Deferred / Scrutiny',
    priceBand: '₹66 - ₹70',
    minPrice: 66,
    maxPrice: 70,
    lotSize: 2000,
    minInvestment: 140000,
    issueSize: '₹44.87 Cr',
    issueSizeCr: 44.87,
    freshIssue: '₹44.87 Cr',
    ofs: '₹0.00 Cr',
    qibQuota: '50%',
    niiQuota: '15%',
    retailQuota: '35%',
    subscription: {
      total: 345.6,
      qib: 129.8,
      nii: 695.4,
      retail: 317.2,
      updatedAt: 'Suspended by Exchange'
    },
    gmp: {
      value: 0,
      percentage: 0,
      trend: 'down',
      updatedAt: 'Halted'
    },
    riskScore: 92,
    riskLevel: 'critical',
    riskLabel: 'Severe Regulatory Intervention',
    forensicFlagsCount: 6,
    summary: 'SME IPO that witnessed 345x subscription before BSE and SEBI halted listing following investor complaints regarding non-existent software vendor capabilities and promoter connections.',
    businessModel: 'Claimed to deliver advanced toll collection and camera surveillance systems, but outsourced entire proprietary software supply to a shell firm founded months prior to the IPO.',
    financials: {
      revenueFY24: '₹65.4 Cr',
      revenueFY25: '₹12.0 Cr',
      revenueFY26: '₹4.2 Cr',
      patFY24: '₹12.1 Cr',
      patFY25: '-₹3.4 Cr',
      patFY26: '-₹8.9 Cr',
      eps: '-₹2.10',
      pe: -33.3,
      industryPe: 25.0,
      ronw: '-18.4%',
      debtToEquity: '2.8',
      totalDebt: '₹34.0 Cr'
    },
    forensicHighlights: [
      {
        title: 'Listing Delayed and Halted by BSE',
        severity: 'critical',
        source: 'BSE Official Press Release & SEBI Directive',
        description: 'Exchange postponed listing following whistle-blower disclosure that software development partner had zero engineering headcount and shared postal address with statutory auditor.'
      },
      {
        title: 'Fabricated Vendor Track Record',
        severity: 'critical',
        source: 'SEBI Investigation Order WTM/2024/098',
        description: 'Vendor claims of previous toll project execution in Maharashtra were refuted by State Highway Development Corporation.'
      }
    ],
    documents: [
      {
        name: 'DRHP Offer Document',
        type: 'DRHP',
        date: '2024-07-20',
        size: '11.8 MB',
        url: 'https://www.bseindia.com',
        isOfficial: true
      },
      {
        name: 'BSE Listing Suspension Notice',
        type: 'Regulatory Notice',
        date: '2024-09-17',
        size: '0.4 MB',
        url: 'https://www.bseindia.com',
        isOfficial: true
      }
    ],
    promoterNetwork: {
      promoters: ['Poonam Sharma', 'Gaurav Sharma'],
      promoterHoldingsPre: '94.2%',
      promoterHoldingsPost: '69.0%',
      linkedEntities: [
        { name: 'Otosys Technologies LLP', relation: 'Sole Software Provider', risk: 'critical' }
      ]
    },
    historicalComparables: []
  }
];

export const SECTORS = [
  'All Sectors',
  'Smart Transit & IoT Infrastructure',
  'Solar PV Modules & Renewable EPC',
  'Cybersecurity & Defense AI',
  'Medical Devices & Diagnostics',
  'Housing Finance (NBFC-UL)',
  'Intelligent Transportation Systems'
];

export const BOARDS = [
  'All Boards',
  'NSE Mainboard',
  'BSE Mainboard',
  'NSE Emerge SME',
  'BSE SME'
];

export const RISK_LEVELS = [
  'All Risk Levels',
  'Clean / Low Risk',
  'Moderate Risk',
  'Critical Forensic Flags'
];

