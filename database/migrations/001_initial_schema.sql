-- ============================================================================
-- AUGUR — PostgreSQL Schema
-- Civilizational Stress Index Data Foundation
-- ============================================================================
-- Design principles:
--   1. Every data point traces to a source — no orphan numbers
--   2. Every transformation is logged — nothing happens silently
--   3. Every published dataset is cryptographically fingerprinted
--   4. Immutable historical record — data points are never silently altered
-- ============================================================================

-- Schema namespace
CREATE SCHEMA IF NOT EXISTS augur;

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

-- Countries / entities scored by Augur
CREATE TABLE augur.countries (
    country_code    VARCHAR(3) PRIMARY KEY,       -- ISO 3166-1 alpha-3
    country_name    VARCHAR(200) NOT NULL,
    region          VARCHAR(100),
    income_group    VARCHAR(50),                   -- World Bank classification
    is_active       BOOLEAN DEFAULT TRUE,          -- Currently scored
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- The 4 pillars
CREATE TABLE augur.pillars (
    pillar_id       VARCHAR(50) PRIMARY KEY,
    pillar_name     VARCHAR(200) NOT NULL,
    display_order   SMALLINT NOT NULL,
    description     TEXT
);

-- The 13 indicators
CREATE TABLE augur.indicators (
    indicator_id    VARCHAR(50) PRIMARY KEY,
    pillar_id       VARCHAR(50) NOT NULL REFERENCES augur.pillars(pillar_id),
    indicator_name  VARCHAR(200) NOT NULL,
    display_order   SMALLINT NOT NULL,
    description     TEXT,
    methodology_url VARCHAR(500),                  -- Link to public methodology doc
    update_frequency VARCHAR(20) NOT NULL           -- daily, monthly, quarterly, annual
        CHECK (update_frequency IN ('daily', 'monthly', 'quarterly', 'annual', 'event_driven')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources — every source Augur pulls from
CREATE TABLE augur.data_sources (
    source_id       VARCHAR(50) PRIMARY KEY,
    source_name     VARCHAR(300) NOT NULL,
    provider        VARCHAR(200) NOT NULL,          -- e.g., "Federal Reserve", "UCLA"
    source_url      VARCHAR(500),
    source_type     VARCHAR(20) NOT NULL             -- api, csv_download, xlsx_download, manual
        CHECK (source_type IN ('api', 'csv_download', 'xlsx_download', 'manual')),
    update_frequency VARCHAR(20),
    license_info    TEXT,                             -- Data license / terms
    notes           TEXT,                             -- Limitations, methodology caveats
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Map indicators to their data sources (many-to-many)
CREATE TABLE augur.indicator_sources (
    indicator_id    VARCHAR(50) REFERENCES augur.indicators(indicator_id),
    source_id       VARCHAR(50) REFERENCES augur.data_sources(source_id),
    is_primary      BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (indicator_id, source_id)
);


-- ============================================================================
-- CORE DATA TABLES
-- ============================================================================

-- Individual data points — the atomic unit of Augur
-- One row = one measurement, one country, one time period, one source
CREATE TABLE augur.data_points (
    id              BIGSERIAL PRIMARY KEY,
    indicator_id    VARCHAR(50) NOT NULL REFERENCES augur.indicators(indicator_id),
    country_code    VARCHAR(3) NOT NULL REFERENCES augur.countries(country_code),
    source_id       VARCHAR(50) NOT NULL REFERENCES augur.data_sources(source_id),

    -- Time dimensions (flexible for different frequencies)
    date_value      DATE NOT NULL,                   -- Canonical date for this observation
    year            SMALLINT NOT NULL,
    quarter         SMALLINT,                         -- 1-4, NULL if not quarterly
    month           SMALLINT,                         -- 1-12, NULL if not monthly

    -- The measurement
    value           NUMERIC(20, 6) NOT NULL,
    unit            VARCHAR(50) NOT NULL,             -- percent, index, ratio, usd, etc.
    series_id       VARCHAR(100),                     -- e.g., FRED series ID

    -- Metadata
    raw_value       NUMERIC(20, 6),                   -- Original value before any transformation
    transformation  TEXT,                              -- Description of any transformation applied
    notes           TEXT,

    -- Integrity
    ingested_at     TIMESTAMPTZ DEFAULT NOW(),
    source_hash     VARCHAR(64),                      -- SHA-256 of raw source data at ingestion

    -- Uniqueness: one value per indicator/country/date/source/series
    UNIQUE (indicator_id, country_code, date_value, source_id, series_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_data_points_indicator ON augur.data_points(indicator_id);
CREATE INDEX idx_data_points_country ON augur.data_points(country_code);
CREATE INDEX idx_data_points_date ON augur.data_points(date_value);
CREATE INDEX idx_data_points_year ON augur.data_points(year);
CREATE INDEX idx_data_points_indicator_country ON augur.data_points(indicator_id, country_code);
CREATE INDEX idx_data_points_indicator_country_date ON augur.data_points(indicator_id, country_code, date_value);


-- ============================================================================
-- COMPOSITE SCORES
-- ============================================================================

-- Normalized indicator scores (0-1 scale) per country per time period
-- These are the numbers that appear on the dashboard
CREATE TABLE augur.indicator_scores (
    id              BIGSERIAL PRIMARY KEY,
    indicator_id    VARCHAR(50) NOT NULL REFERENCES augur.indicators(indicator_id),
    country_code    VARCHAR(3) NOT NULL REFERENCES augur.countries(country_code),
    year            SMALLINT NOT NULL,
    quarter         SMALLINT,                         -- NULL for annual indicators

    -- The normalized score
    score           NUMERIC(6, 4) NOT NULL             -- 0.0000 to 1.0000
        CHECK (score >= 0 AND score <= 1),
    confidence      NUMERIC(4, 2),                     -- Data quality confidence, 0-1

    -- What data points contributed to this score
    component_data  JSONB,                             -- Array of data_point IDs and weights
    methodology_version VARCHAR(20) NOT NULL,          -- Scoring methodology version

    -- Integrity
    calculated_at   TIMESTAMPTZ DEFAULT NOW(),
    data_hash       VARCHAR(64),                       -- SHA-256 of inputs

    UNIQUE (indicator_id, country_code, year, quarter, methodology_version)
);

-- Pillar-level aggregate scores
CREATE TABLE augur.pillar_scores (
    id              BIGSERIAL PRIMARY KEY,
    pillar_id       VARCHAR(50) NOT NULL REFERENCES augur.pillars(pillar_id),
    country_code    VARCHAR(3) NOT NULL REFERENCES augur.countries(country_code),
    year            SMALLINT NOT NULL,

    score           NUMERIC(6, 4) NOT NULL CHECK (score >= 0 AND score <= 1),
    component_scores JSONB,                            -- Indicator scores that compose this
    methodology_version VARCHAR(20) NOT NULL,
    calculated_at   TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (pillar_id, country_code, year, methodology_version)
);

-- Overall country composite stress score
CREATE TABLE augur.composite_scores (
    id              BIGSERIAL PRIMARY KEY,
    country_code    VARCHAR(3) NOT NULL REFERENCES augur.countries(country_code),
    year            SMALLINT NOT NULL,

    score           NUMERIC(6, 4) NOT NULL CHECK (score >= 0 AND score <= 1),
    pillar_scores   JSONB,                             -- Pillar scores that compose this
    methodology_version VARCHAR(20) NOT NULL,
    calculated_at   TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (country_code, year, methodology_version)
);


-- ============================================================================
-- HISTORICAL CONTEXT (Empire Comparisons)
-- ============================================================================

CREATE TABLE augur.historical_cases (
    id              SERIAL PRIMARY KEY,
    indicator_id    VARCHAR(50) NOT NULL REFERENCES augur.indicators(indicator_id),
    empire          VARCHAR(100) NOT NULL,             -- "Rome", "Ottoman Empire", "British Empire"
    period          VARCHAR(100),                      -- "133-44 BC", "1839-1876"
    narrative       TEXT NOT NULL,                      -- The historical context
    data_points     JSONB,                             -- Any quantifiable data
    scholarly_note  TEXT,                               -- Acknowledged debates / limitations
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- UNCOMFORTABLE NUMBERS (Dashboard headline stats)
-- ============================================================================

CREATE TABLE augur.uncomfortable_numbers (
    id              SERIAL PRIMARY KEY,
    indicator_id    VARCHAR(50) NOT NULL REFERENCES augur.indicators(indicator_id),
    country_code    VARCHAR(3) NOT NULL REFERENCES augur.countries(country_code),
    value           VARCHAR(50) NOT NULL,              -- "40%", "8%", "$659 billion"
    statement       TEXT NOT NULL,                      -- The sentence completing the number
    source_citation TEXT NOT NULL,                      -- "Pew Research Center, 2022"
    source_url      VARCHAR(500),
    year            SMALLINT NOT NULL,
    display_order   SMALLINT DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- DATA INTEGRITY / AUDIT TRAIL
-- ============================================================================

-- SHA-256 hashes of every raw source pull
CREATE TABLE augur.source_hashes (
    id              BIGSERIAL PRIMARY KEY,
    source_id       VARCHAR(50) NOT NULL REFERENCES augur.data_sources(source_id),
    series_id       VARCHAR(100),                      -- FRED series, etc.
    pull_timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_url      VARCHAR(500),
    raw_data_hash   VARCHAR(64) NOT NULL,              -- SHA-256 of raw response
    record_count    INTEGER,
    byte_count      BIGINT,
    api_version     VARCHAR(50),
    notes           TEXT
);

CREATE INDEX idx_source_hashes_source ON augur.source_hashes(source_id);
CREATE INDEX idx_source_hashes_timestamp ON augur.source_hashes(pull_timestamp);

-- Transformation audit log — every transformation logged
CREATE TABLE augur.transformation_log (
    id              BIGSERIAL PRIMARY KEY,
    data_point_id   BIGINT REFERENCES augur.data_points(id),
    transformation_type VARCHAR(100) NOT NULL,          -- normalize, interpolate, aggregate, etc.
    input_values    JSONB NOT NULL,                     -- What went in
    output_value    NUMERIC(20, 6) NOT NULL,            -- What came out
    function_name   VARCHAR(200) NOT NULL,              -- The code function that did it
    function_version VARCHAR(20),
    executed_at     TIMESTAMPTZ DEFAULT NOW(),
    notes           TEXT
);

-- Validation event log — every validation check recorded
CREATE TABLE augur.validation_log (
    id              BIGSERIAL PRIMARY KEY,
    source_id       VARCHAR(50) REFERENCES augur.data_sources(source_id),
    series_id       VARCHAR(100),
    check_type      VARCHAR(50) NOT NULL                -- range_check, staleness_check, yoy_check, hash_check
        CHECK (check_type IN ('range_check', 'staleness_check', 'yoy_check', 'hash_check',
                               'format_check', 'completeness_check', 'anomaly_check')),
    status          VARCHAR(10) NOT NULL                 -- pass, warn, fail
        CHECK (status IN ('pass', 'warn', 'fail')),
    message         TEXT,
    details         JSONB,                               -- Full check details
    checked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validation_log_status ON augur.validation_log(status);
CREATE INDEX idx_validation_log_source ON augur.validation_log(source_id);


-- ============================================================================
-- PUBLIC HASH PUBLICATION (for independent verification)
-- ============================================================================

CREATE TABLE augur.published_hashes (
    id              SERIAL PRIMARY KEY,
    dataset_name    VARCHAR(200) NOT NULL,              -- Human-readable dataset identifier
    dataset_hash    VARCHAR(64) NOT NULL,               -- SHA-256 of processed dataset
    record_count    INTEGER NOT NULL,
    date_range_start DATE,
    date_range_end  DATE,
    published_at    TIMESTAMPTZ DEFAULT NOW(),
    git_commit_hash VARCHAR(40)                         -- Git commit where hash was published
);


-- ============================================================================
-- DATA CHANGELOG (immutable historical record)
-- ============================================================================

CREATE TABLE augur.data_changelog (
    id              BIGSERIAL PRIMARY KEY,
    data_point_id   BIGINT REFERENCES augur.data_points(id),
    indicator_id    VARCHAR(50) REFERENCES augur.indicators(indicator_id),
    country_code    VARCHAR(3) REFERENCES augur.countries(country_code),
    change_type     VARCHAR(20) NOT NULL                 -- correction, revision, source_update
        CHECK (change_type IN ('correction', 'revision', 'source_update', 'methodology_change')),
    old_value       NUMERIC(20, 6),
    new_value       NUMERIC(20, 6),
    reason          TEXT NOT NULL,                        -- Why the change occurred
    changed_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SEED DATA — Pillars
-- ============================================================================

INSERT INTO augur.pillars (pillar_id, pillar_name, display_order, description) VALUES
    ('social_cohesion', 'Social Cohesion', 1, 'The degree to which a society maintains shared identity, mutual trust, and institutional legitimacy sufficient for collective action.'),
    ('economic_structure', 'Economic Structure', 2, 'The distribution of wealth, fiscal capacity of the state, and stability of the economic foundation.'),
    ('systemic_capacity', 'Systemic Capacity', 3, 'The ability of a civilization''s systems — physical, informational, institutional — to function and adapt.'),
    ('external_environment', 'External Environment', 4, 'The geopolitical position and resource constraints that shape the external operating environment.');


-- ============================================================================
-- SEED DATA — Indicators
-- ============================================================================

INSERT INTO augur.indicators (indicator_id, pillar_id, indicator_name, display_order, update_frequency, description) VALUES
    ('political_polarization', 'social_cohesion', 'Political Polarization', 1, 'annual',
     'Divergence of political attitudes toward ideological extremes, specifically affective polarization.'),
    ('public_trust', 'social_cohesion', 'Public Trust in Institutions', 2, 'annual',
     'Degree to which a population believes foundational structures of governance, justice, information, and civic life are legitimate.'),
    ('rule_of_law', 'social_cohesion', 'Rule of Law Erosion', 3, 'annual',
     'Whether laws apply equally regardless of status, administered by independent institutions.'),
    ('civil_unrest', 'social_cohesion', 'Civil Unrest Frequency', 4, 'monthly',
     'Frequency and intensity of destabilizing political violence and organized challenges to state authority.'),
    ('wealth_inequality', 'economic_structure', 'Wealth Inequality', 5, 'quarterly',
     'Concentration of accumulated wealth measured by Gini coefficient of net worth and share held by top percentiles.'),
    ('middle_class_decline', 'economic_structure', 'Decline of the Middle Class', 6, 'annual',
     'Share of households earning 67-200% of median income and economic security of the stabilizing middle.'),
    ('debt_to_gdp', 'economic_structure', 'Government Debt to GDP', 7, 'quarterly',
     'State fiscal capacity — debt level, trajectory, interest burden, crowding out of core functions.'),
    ('currency_debasement', 'economic_structure', 'Currency Debasement / Inflation', 8, 'monthly',
     'Long-run purchasing power erosion and international reserve currency position trajectory.'),
    ('elite_overproduction', 'systemic_capacity', 'Elite Overproduction', 9, 'annual',
     'Society generating more credentialed aspirants than elite positions available.'),
    ('infrastructure_decay', 'systemic_capacity', 'Infrastructure Decay', 10, 'annual',
     'Physical and digital substrate decay — bridges, water systems, power grid.'),
    ('media_fragmentation', 'systemic_capacity', 'Media Fragmentation & Epistemic Divergence', 11, 'annual',
     'Degree to which citizens share a common factual baseline sufficient for democratic deliberation.'),
    ('geopolitical_standing', 'external_environment', 'Geopolitical Standing & External Pressure', 12, 'annual',
     'Relative global power trajectory and alliance system health.'),
    ('resource_stress', 'external_environment', 'Resource & Environmental Stress', 13, 'monthly',
     'Physical resource constraints where technological substitution is most constrained.');


-- ============================================================================
-- SEED DATA — Data Sources
-- ============================================================================

INSERT INTO augur.data_sources (source_id, source_name, provider, source_url, source_type, update_frequency, notes) VALUES
    ('fred', 'Federal Reserve Economic Data', 'Federal Reserve Bank of St. Louis', 'https://fred.stlouisfed.org/', 'api', 'varies',
     'Economic data backbone. Free API with key. Covers most of Pillar II.'),
    ('voteview', 'DW-NOMINATE Congressional Voting Scores', 'UCLA / VoteView', 'https://voteview.com/', 'csv_download', 'annual',
     'Legislative ideology scores 1789-present. Primary source for political polarization measurement.'),
    ('anes', 'American National Election Studies', 'University of Michigan / Stanford', 'https://electionstudies.org/', 'csv_download', 'event_driven',
     'Feeling thermometer surveys 1948-present. Federally funded.'),
    ('wjp', 'World Justice Project Rule of Law Index', 'World Justice Project', 'https://worldjusticeproject.org/', 'xlsx_download', 'annual',
     'Rule of law scores for 142 countries across 8 dimensions.'),
    ('vdem', 'Varieties of Democracy Dataset', 'University of Gothenburg', 'https://v-dem.net/', 'csv_download', 'annual',
     'Judicial independence scores 1900-present. Multi-coder methodology.'),
    ('gallup', 'Gallup Confidence in Institutions', 'Gallup', 'https://news.gallup.com/', 'manual', 'annual',
     'Free summary data only. Full cross-tabs paywalled. Supplemented by ANES.'),
    ('pew', 'Pew Research Center Studies', 'Pew Research Center', 'https://www.pewresearch.org/', 'manual', 'quarterly',
     'Political polarization, institutional trust, news trust studies.'),
    ('wvs', 'World Values Survey', 'World Values Survey Association', 'https://www.worldvaluessurvey.org/', 'csv_download', 'periodic',
     'Cross-national trust comparison. Free, academically rigorous. Replaces Edelman.'),
    ('world_bank', 'World Development Indicators', 'World Bank', 'https://api.worldbank.org/', 'api', 'quarterly',
     'Cross-national GDP, debt, development data. Free API.'),
    ('imf', 'IMF Data', 'International Monetary Fund', 'https://data.imf.org/', 'api', 'quarterly',
     'Fiscal data, debt-to-GDP, COFER reserve currency data.'),
    ('acled', 'Armed Conflict Location & Event Data', 'ACLED', 'https://acleddata.com/', 'api', 'monthly',
     'Political violence and unrest events. Free for non-commercial. Requires registration.'),
    ('sipri', 'SIPRI Military Expenditure Database', 'SIPRI', 'https://www.sipri.org/', 'xlsx_download', 'annual',
     'Military spending data for 170+ countries.'),
    ('fhwa', 'National Bridge Inventory', 'Federal Highway Administration', 'https://www.fhwa.dot.gov/', 'csv_download', 'annual',
     'Bridge condition data for all US highway bridges.'),
    ('eia', 'Energy Information Administration', 'US EIA', 'https://www.eia.gov/', 'api', 'monthly',
     'Power grid reliability, energy production/consumption.'),
    ('usgs', 'USGS Water Services', 'US Geological Survey', 'https://waterservices.usgs.gov/', 'api', 'monthly',
     'Groundwater level monitoring for aquifer systems.'),
    ('wid', 'World Inequality Database', 'World Inequality Lab', 'https://wid.world/', 'csv_download', 'annual',
     'Long-run wealth/income inequality data back to 1913. Piketty/Saez/Zucman.'),
    ('census', 'Current Population Survey', 'US Census Bureau', 'https://api.census.gov/', 'api', 'annual',
     'Income distribution data from CPS.'),
    ('bls', 'Bureau of Labor Statistics', 'US BLS', 'https://api.bls.gov/', 'api', 'monthly',
     'Employment by occupation/wage tier, labor force participation.'),
    ('doj_bjs', 'Bureau of Justice Statistics', 'US Department of Justice', 'https://bjs.ojp.gov/', 'csv_download', 'annual',
     'Federal prosecution rates, conviction rates, sentencing data.'),
    ('oecd', 'OECD Government at a Glance', 'OECD', 'https://data.oecd.org/', 'api', 'annual',
     'International institutional trust and governance comparison. Free tier.');


-- ============================================================================
-- SEED DATA — Core countries (initial set, expandable)
-- ============================================================================

INSERT INTO augur.countries (country_code, country_name, region, income_group) VALUES
    ('USA', 'United States', 'North America', 'High income'),
    ('GBR', 'United Kingdom', 'Europe', 'High income'),
    ('DEU', 'Germany', 'Europe', 'High income'),
    ('FRA', 'France', 'Europe', 'High income'),
    ('JPN', 'Japan', 'East Asia', 'High income'),
    ('CAN', 'Canada', 'North America', 'High income'),
    ('AUS', 'Australia', 'Oceania', 'High income'),
    ('ITA', 'Italy', 'Europe', 'High income'),
    ('BRA', 'Brazil', 'South America', 'Upper middle income'),
    ('IND', 'India', 'South Asia', 'Lower middle income'),
    ('CHN', 'China', 'East Asia', 'Upper middle income'),
    ('RUS', 'Russia', 'Europe/Asia', 'Upper middle income'),
    ('ZAF', 'South Africa', 'Sub-Saharan Africa', 'Upper middle income'),
    ('MEX', 'Mexico', 'North America', 'Upper middle income'),
    ('KOR', 'South Korea', 'East Asia', 'High income'),
    ('TUR', 'Turkey', 'Europe/Asia', 'Upper middle income'),
    ('IDN', 'Indonesia', 'Southeast Asia', 'Upper middle income'),
    ('NGA', 'Nigeria', 'Sub-Saharan Africa', 'Lower middle income'),
    ('ARG', 'Argentina', 'South America', 'Upper middle income'),
    ('SWE', 'Sweden', 'Europe', 'High income');
