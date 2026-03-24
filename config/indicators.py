"""
Augur Configuration — Indicator Framework & Data Source Mappings

Every indicator, every data source, every FRED series ID.
This is the single source of truth for what Augur measures and where the data comes from.
"""

# ============================================================================
# PILLAR & INDICATOR DEFINITIONS
# ============================================================================

PILLARS = {
    "social_cohesion": {
        "id": "social_cohesion",
        "name": "Social Cohesion",
        "order": 1,
        "indicators": [
            "political_polarization",
            "public_trust",
            "rule_of_law",
            "civil_unrest",
        ],
    },
    "economic_structure": {
        "id": "economic_structure",
        "name": "Economic Structure",
        "order": 2,
        "indicators": [
            "wealth_inequality",
            "middle_class_decline",
            "debt_to_gdp",
            "currency_debasement",
        ],
    },
    "systemic_capacity": {
        "id": "systemic_capacity",
        "name": "Systemic Capacity",
        "order": 3,
        "indicators": [
            "elite_overproduction",
            "infrastructure_decay",
            "media_fragmentation",
        ],
    },
    "external_environment": {
        "id": "external_environment",
        "name": "External Environment",
        "order": 4,
        "indicators": [
            "geopolitical_standing",
            "resource_stress",
        ],
    },
}

INDICATORS = {
    # ---- PILLAR I: SOCIAL COHESION ----
    "political_polarization": {
        "id": "political_polarization",
        "pillar": "social_cohesion",
        "name": "Political Polarization",
        "order": 1,
        "description": "Divergence of political attitudes toward ideological extremes, specifically affective polarization — citizens viewing opponents as existential threats.",
        "data_streams": ["dw_nominate", "anes_thermometer", "pew_polarization"],
        "update_frequency": "annual",
    },
    "public_trust": {
        "id": "public_trust",
        "pillar": "social_cohesion",
        "name": "Public Trust in Institutions",
        "order": 2,
        "description": "Degree to which a population believes foundational structures of governance, justice, information, and civic life are legitimate and operating in good faith.",
        "data_streams": ["gallup_confidence", "pew_trust", "wvs_trust", "oecd_trust"],
        "update_frequency": "annual",
    },
    "rule_of_law": {
        "id": "rule_of_law",
        "pillar": "social_cohesion",
        "name": "Rule of Law Erosion",
        "order": 3,
        "description": "Whether laws apply equally regardless of status, administered by independent institutions insulated from political interference.",
        "data_streams": ["wjp_index", "vdem_judicial", "doj_bjs"],
        "update_frequency": "annual",
    },
    "civil_unrest": {
        "id": "civil_unrest",
        "pillar": "social_cohesion",
        "name": "Civil Unrest Frequency",
        "order": 4,
        "description": "Frequency and intensity of destabilizing political violence — organized violence, armed confrontation, extra-legal efforts to overturn legitimate outcomes.",
        "data_streams": ["acled_events", "cnts_violence", "fbi_nibrs"],
        "update_frequency": "monthly",
    },

    # ---- PILLAR II: ECONOMIC STRUCTURE ----
    "wealth_inequality": {
        "id": "wealth_inequality",
        "pillar": "economic_structure",
        "name": "Wealth Inequality",
        "order": 5,
        "description": "Concentration of accumulated wealth (net worth), not income. Gini coefficient of net worth and share held by top percentiles.",
        "data_streams": ["fred_dfa", "scf_wealth", "wid_wealth", "oecd_wealth"],
        "update_frequency": "quarterly",
    },
    "middle_class_decline": {
        "id": "middle_class_decline",
        "pillar": "economic_structure",
        "name": "Decline of the Middle Class",
        "order": 6,
        "description": "Share of households earning 67-200% of median income. Size and economic security of the stabilizing middle.",
        "data_streams": ["fred_median_income", "census_cps", "fred_shed"],
        "update_frequency": "annual",
    },
    "debt_to_gdp": {
        "id": "debt_to_gdp",
        "pillar": "economic_structure",
        "name": "Government Debt to GDP",
        "order": 7,
        "description": "State fiscal capacity — debt level, trajectory, interest burden as share of revenue, crowding out of core functions.",
        "data_streams": ["fred_debt", "fred_interest", "cbo_projections", "imf_debt"],
        "update_frequency": "quarterly",
    },
    "currency_debasement": {
        "id": "currency_debasement",
        "pillar": "economic_structure",
        "name": "Currency Debasement / Inflation",
        "order": 8,
        "description": "Long-run purchasing power erosion and international reserve currency position trajectory.",
        "data_streams": ["fred_cpi", "fred_pce", "imf_cofer", "fred_gold"],
        "update_frequency": "monthly",
    },

    # ---- PILLAR III: SYSTEMIC CAPACITY ----
    "elite_overproduction": {
        "id": "elite_overproduction",
        "pillar": "systemic_capacity",
        "name": "Elite Overproduction",
        "order": 9,
        "description": "Society generating more credentialed aspirants than elite positions available. Measured through proxies — credential inflation, professional saturation, lobbying growth.",
        "data_streams": ["bls_education", "aba_legal", "lobbying_data"],
        "update_frequency": "annual",
    },
    "infrastructure_decay": {
        "id": "infrastructure_decay",
        "pillar": "systemic_capacity",
        "name": "Infrastructure Decay",
        "order": 10,
        "description": "Physical and digital substrate decay — bridges, water systems, power grid. Outcome measures, not condition grades.",
        "data_streams": ["fhwa_bridges", "eia_grid", "epa_water"],
        "update_frequency": "annual",
    },
    "media_fragmentation": {
        "id": "media_fragmentation",
        "pillar": "systemic_capacity",
        "name": "Media Fragmentation & Epistemic Divergence",
        "order": 11,
        "description": "Degree to which citizens share a common factual baseline sufficient for democratic deliberation. Measured as factual divergence by partisan group.",
        "data_streams": ["gallup_media_trust", "pew_news", "reuters_dnr"],
        "update_frequency": "annual",
    },

    # ---- PILLAR IV: EXTERNAL ENVIRONMENT ----
    "geopolitical_standing": {
        "id": "geopolitical_standing",
        "pillar": "external_environment",
        "name": "Geopolitical Standing & External Pressure",
        "order": 12,
        "description": "Relative global power trajectory — not absolute dominance but erosion of position relative to rising competitors and alliance health.",
        "data_streams": ["world_bank_gdp", "sipri_military", "imf_gdp_ppp"],
        "update_frequency": "annual",
    },
    "resource_stress": {
        "id": "resource_stress",
        "pillar": "external_environment",
        "name": "Resource & Environmental Stress",
        "order": 13,
        "description": "Physical resource constraints — aquifer depletion, water allocation crises, energy supply vulnerability. Where technological substitution is most constrained.",
        "data_streams": ["usgs_groundwater", "usbr_colorado", "eia_energy"],
        "update_frequency": "monthly",
    },
}


# ============================================================================
# FRED API SERIES MAPPINGS
# ============================================================================
# These are the exact FRED series IDs for automated pipeline ingestion.
# FRED is the economic data backbone — covers most of Pillar II and parts of others.

FRED_SERIES = {
    # --- Wealth Inequality (Indicator 5) ---
    "WFRBST01134": {
        "indicator": "wealth_inequality",
        "description": "Share of Total Net Worth Held by the Top 1%",
        "unit": "percent",
        "frequency": "quarterly",
    },
    "WFRBSB50215": {
        "indicator": "wealth_inequality",
        "description": "Share of Total Net Worth Held by the Bottom 50%",
        "unit": "percent",
        "frequency": "quarterly",
    },
    "WFRBST01104": {
        "indicator": "wealth_inequality",
        "description": "Share of Total Net Worth Held by the Top 10%",
        "unit": "percent",
        "frequency": "quarterly",
    },
    "WFRBSN09153": {
        "indicator": "wealth_inequality",
        "description": "Share of Total Net Worth Held by the 50th-90th Percentile",
        "unit": "percent",
        "frequency": "quarterly",
    },

    # --- Middle Class / Income (Indicator 6) ---
    "MEHOINUSA672N": {
        "indicator": "middle_class_decline",
        "description": "Real Median Household Income in the United States",
        "unit": "2023_dollars",
        "frequency": "annual",
    },
    "GINIALLRH": {
        "indicator": "wealth_inequality",
        "description": "Income Gini Ratio for Households (Census)",
        "unit": "ratio",
        "frequency": "annual",
    },

    # --- Government Debt (Indicator 7) ---
    "GFDEBTN": {
        "indicator": "debt_to_gdp",
        "description": "Federal Debt: Total Public Debt",
        "unit": "millions_usd",
        "frequency": "quarterly",
    },
    "GFDEGDQ188S": {
        "indicator": "debt_to_gdp",
        "description": "Federal Debt: Total Public Debt as Percent of GDP",
        "unit": "percent_gdp",
        "frequency": "quarterly",
    },
    "A091RC1Q027SBEA": {
        "indicator": "debt_to_gdp",
        "description": "Federal Government: Interest Payments",
        "unit": "billions_usd",
        "frequency": "quarterly",
    },
    "FYOIGDA188S": {
        "indicator": "debt_to_gdp",
        "description": "Federal Net Interest as Percent of GDP",
        "unit": "percent_gdp",
        "frequency": "annual",
    },
    "FYFRGDA188S": {
        "indicator": "debt_to_gdp",
        "description": "Federal Receipts as Percent of GDP",
        "unit": "percent_gdp",
        "frequency": "annual",
    },

    # --- Currency / Inflation (Indicator 8) ---
    "CPIAUCSL": {
        "indicator": "currency_debasement",
        "description": "Consumer Price Index for All Urban Consumers: All Items",
        "unit": "index_1982_84_100",
        "frequency": "monthly",
    },

    "PCEPI": {
        "indicator": "currency_debasement",
        "description": "Personal Consumption Expenditures: Chain-type Price Index",
        "unit": "index_2017_100",
        "frequency": "monthly",
    },
    "DGS10": {
        "indicator": "debt_to_gdp",
        "description": "Market Yield on US Treasury Securities at 10-Year Constant Maturity",
        "unit": "percent",
        "frequency": "daily",
    },
    "FEDFUNDS": {
        "indicator": "currency_debasement",
        "description": "Federal Funds Effective Rate",
        "unit": "percent",
        "frequency": "monthly",
    },

    # --- GDP for ratio calculations ---
    "GDP": {
        "indicator": "debt_to_gdp",
        "description": "Gross Domestic Product",
        "unit": "billions_usd",
        "frequency": "quarterly",
    },
    "A191RL1Q225SBEA": {
        "indicator": "debt_to_gdp",
        "description": "Real GDP Growth Rate (quarterly, annualized)",
        "unit": "percent_change",
        "frequency": "quarterly",
    },

    # --- Infrastructure / Grid Reliability (Indicator 10) ---
    # Note: Most infrastructure data comes from FHWA/EIA downloads, not FRED.
    # FRED provides supplementary economic context.

    # --- Labor / Elite Overproduction proxies (Indicator 9) ---
    "CIVPART": {
        "indicator": "elite_overproduction",
        "description": "Labor Force Participation Rate",
        "unit": "percent",
        "frequency": "monthly",
    },
    "UNRATE": {
        "indicator": "elite_overproduction",
        "description": "Unemployment Rate",
        "unit": "percent",
        "frequency": "monthly",
    },
}


# ============================================================================
# STATIC DATASET SOURCES (Tier 2 & 3)
# ============================================================================
# These are downloaded periodically, not via live API.

STATIC_SOURCES = {
    "dw_nominate": {
        "indicator": "political_polarization",
        "name": "DW-NOMINATE Congressional Voting Scores",
        "url": "https://voteview.com/static/data/out/members/HSall_members.csv",
        "format": "csv",
        "update_frequency": "annual",
        "provider": "VoteView / UCLA",
    },
    "wjp_rule_of_law": {
        "indicator": "rule_of_law",
        "name": "World Justice Project Rule of Law Index",
        "url": "https://worldjusticeproject.org/rule-of-law-index/downloads",
        "format": "xlsx",
        "update_frequency": "annual",
        "provider": "World Justice Project",
    },
    "vdem": {
        "indicator": "rule_of_law",
        "name": "V-Dem Dataset (Varieties of Democracy)",
        "url": "https://v-dem.net/data/dataset-archive/",
        "format": "csv",
        "update_frequency": "annual",
        "provider": "University of Gothenburg",
    },
    "sipri": {
        "indicator": "geopolitical_standing",
        "name": "SIPRI Military Expenditure Database",
        "url": "https://www.sipri.org/databases/milex",
        "format": "xlsx",
        "update_frequency": "annual",
        "provider": "Stockholm International Peace Research Institute",
    },
    "fhwa_bridges": {
        "indicator": "infrastructure_decay",
        "name": "National Bridge Inventory",
        "url": "https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm",
        "format": "csv",
        "update_frequency": "annual",
        "provider": "Federal Highway Administration",
    },
    "wid": {
        "indicator": "wealth_inequality",
        "name": "World Inequality Database",
        "url": "https://wid.world/data/",
        "format": "csv",
        "update_frequency": "annual",
        "provider": "World Inequality Lab (Piketty/Saez/Zucman)",
    },
    "anes": {
        "indicator": "political_polarization",
        "name": "ANES Feeling Thermometer Data",
        "url": "https://electionstudies.org/data-center/",
        "format": "csv",
        "update_frequency": "event_driven",
        "provider": "University of Michigan / Stanford",
    },
    "world_bank_wdi": {
        "indicator": "geopolitical_standing",
        "name": "World Development Indicators",
        "url": "https://api.worldbank.org/v2/",
        "format": "api_json",
        "update_frequency": "quarterly",
        "provider": "World Bank",
    },
    "imf_cofer": {
        "indicator": "currency_debasement",
        "name": "Currency Composition of Official Foreign Exchange Reserves",
        "url": "https://data.imf.org/regular.aspx?key=41175",
        "format": "xlsx",
        "update_frequency": "quarterly",
        "provider": "International Monetary Fund",
    },
}


# ============================================================================
# VALIDATION RULES
# ============================================================================
# Expected ranges for automated anomaly detection.
# Values outside these ranges trigger alerts, not silent acceptance.

VALIDATION_RULES = {
    "WFRBST01134": {  # Top 1% wealth share
        "min": 15.0,
        "max": 50.0,
        "max_yoy_change": 5.0,
        "description": "Top 1% wealth share should be 15-50%",
    },
    "WFRBSB50215": {  # Bottom 50% wealth share
        "min": 0.0,
        "max": 15.0,
        "max_yoy_change": 3.0,
        "description": "Bottom 50% wealth share should be 0-15%",
    },
    "GFDEGDQ188S": {  # Debt-to-GDP
        "min": 30.0,
        "max": 250.0,
        "max_yoy_change": 30.0,
        "description": "Debt-to-GDP ratio should be 30-250%",
    },
    "CPIAUCSL": {  # CPI
        "min": 10.0,
        "max": 500.0,
        "max_yoy_change": 30.0,
        "description": "CPI index should be 10-500",
    },
    "MEHOINUSA672N": {  # Median household income
        "min": 20000,
        "max": 150000,
        "max_yoy_change": 15000,
        "description": "Real median household income should be $20k-$150k",
    },
    "UNRATE": {  # Unemployment rate
        "min": 0.0,
        "max": 30.0,
        "max_yoy_change": 10.0,
        "description": "Unemployment rate should be 0-30%",
    },
    "DGS10": {  # 10-year Treasury yield
        "min": -1.0,
        "max": 20.0,
        "max_yoy_change": 5.0,
        "description": "10-year yield should be -1% to 20%",
    },
    "FEDFUNDS": {  # Fed funds rate
        "min": 0.0,
        "max": 25.0,
        "max_yoy_change": 6.0,
        "description": "Fed funds rate should be 0-25%",
    },
}


# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_CONFIG = {
    "schema": "augur",
    "tables": {
        "indicators": "augur.indicators",
        "data_points": "augur.data_points",
        "data_sources": "augur.data_sources",
        "source_hashes": "augur.source_hashes",
        "validation_log": "augur.validation_log",
        "transformation_log": "augur.transformation_log",
        "countries": "augur.countries",
    },
}
