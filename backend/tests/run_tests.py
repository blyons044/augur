#!/usr/bin/env python3
"""
Augur Standalone Test Runner

Tests the core modules that don't require external dependencies.
Run with: python3 backend/tests/run_tests.py
"""

import sys
import os
import json
import traceback
import tempfile
from pathlib import Path

# Add project root to path
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
sys.path.insert(0, PROJECT_ROOT)

passed = 0
failed = 0
errors = []


def test(name):
    """Decorator to register and run a test."""
    def wrapper(fn):
        global passed, failed
        try:
            fn()
            passed += 1
            print(f"  ✓ {name}")
        except AssertionError as e:
            failed += 1
            errors.append((name, str(e)))
            print(f"  ✗ {name}: {e}")
        except Exception as e:
            failed += 1
            errors.append((name, traceback.format_exc()))
            print(f"  ✗ {name}: {type(e).__name__}: {e}")
        return fn
    return wrapper


# ============================================================================
# INTEGRITY MODULE TESTS
# ============================================================================
print("\n── Integrity Module ──")

from backend.app.core.integrity import hash_raw_data, hash_dataset, AuditLogger

@test("hash_raw_data is deterministic")
def _():
    h1 = hash_raw_data("test data")
    h2 = hash_raw_data("test data")
    assert h1 == h2, f"Hashes differ: {h1} vs {h2}"

@test("hash_raw_data: str and bytes match")
def _():
    text = "test content"
    assert hash_raw_data(text) == hash_raw_data(text.encode("utf-8"))

@test("hash_raw_data produces SHA-256 (64 hex chars)")
def _():
    h = hash_raw_data("anything")
    assert len(h) == 64, f"Length {len(h)}, expected 64"
    assert all(c in "0123456789abcdef" for c in h), "Non-hex characters found"

@test("hash_raw_data: different inputs produce different hashes")
def _():
    h1 = hash_raw_data("version 1")
    h2 = hash_raw_data("version 2")
    assert h1 != h2

@test("hash_dataset is deterministic")
def _():
    records = [
        {"date": "2024-01-01", "value": 100.5},
        {"date": "2024-02-01", "value": 101.3},
    ]
    assert hash_dataset(records) == hash_dataset(records)

@test("hash_dataset: different data produces different hash")
def _():
    r1 = [{"date": "2024-01-01", "value": 100}]
    r2 = [{"date": "2024-01-01", "value": 101}]
    assert hash_dataset(r1) != hash_dataset(r2)

@test("AuditLogger records source pulls")
def _():
    audit = AuditLogger()
    entry = audit.log_source_pull(
        source_id="fred", series_id="CPIAUCSL",
        source_url="https://api.stlouisfed.org/fred",
        raw_data_hash="a" * 64, record_count=100, byte_count=5000,
    )
    assert entry["type"] == "source_pull"
    assert entry["source_id"] == "fred"
    assert entry["record_count"] == 100

@test("AuditLogger records transformations")
def _():
    audit = AuditLogger()
    entry = audit.log_transformation(
        data_point_id=1, transformation_type="normalize",
        input_values={"raw": 310.5, "base": 100.0},
        output_value=3.105, function_name="normalize_to_base",
    )
    assert entry["type"] == "transformation"
    assert entry["output_value"] == 3.105

@test("AuditLogger records validations")
def _():
    audit = AuditLogger()
    entry = audit.log_validation(
        source_id="fred", series_id="CPIAUCSL",
        check_type="range_check", status="pass",
        message="All values in range",
    )
    assert entry["status"] == "pass"

@test("AuditLogger flushes to JSONL")
def _():
    audit = AuditLogger()
    audit.log_source_pull(
        source_id="fred", series_id="T1",
        source_url="test", raw_data_hash="abc",
        record_count=1, byte_count=100,
    )
    audit.log_validation(
        source_id="fred", series_id="T1",
        check_type="range_check", status="pass", message="ok",
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        path = f.name
    count = audit.flush_to_jsonl(path)
    assert count == 2
    with open(path) as f:
        lines = f.readlines()
    assert len(lines) == 2
    for line in lines:
        parsed = json.loads(line)
        assert "type" in parsed
    os.unlink(path)

@test("AuditLogger log_hash_publication works")
def _():
    audit = AuditLogger()
    entry = audit.log_hash_publication(
        dataset_name="fred_full", dataset_hash="b" * 64,
        record_count=500, date_range=("2020-01-01", "2024-12-31"),
        git_commit="abc123",
    )
    assert entry["type"] == "hash_publication"
    assert entry["record_count"] == 500


# ============================================================================
# VALIDATION MODULE TESTS
# ============================================================================
print("\n── Validation Module ──")

from backend.app.pipelines.validation.validator import DataValidator, ValidationReport
from config.indicators import VALIDATION_RULES

validator = DataValidator(VALIDATION_RULES)

@test("Empty data fails completeness check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [])
    assert not report.passed
    fails = [r for r in report.results if r.check_type == "completeness_check" and r.failed]
    assert len(fails) > 0

@test("Non-empty data passes completeness check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2024-01-01", "value": 310.0}])
    passes = [r for r in report.results if r.check_type == "completeness_check" and r.passed]
    assert len(passes) > 0

@test("Missing date fails format check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"value": 310.0}])
    fails = [r for r in report.results if r.check_type == "format_check" and r.failed]
    assert len(fails) > 0

@test("Non-numeric value fails format check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2024-01-01", "value": "bad"}])
    fails = [r for r in report.results if r.check_type == "format_check" and r.failed]
    assert len(fails) > 0

@test("CPI in normal range passes range check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [
        {"date": "2024-01-01", "value": 310.0},
        {"date": "2024-02-01", "value": 311.5},
    ])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert all(r.passed for r in range_results), f"Range check failed: {[r.message for r in range_results]}"

@test("CPI above 500 fails range check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2024-01-01", "value": 999.0}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert any(r.failed for r in range_results)

@test("CPI below 10 fails range check")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2024-01-01", "value": 5.0}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert any(r.failed for r in range_results)

@test("Unemployment rate of 45% fails range check")
def _():
    report = validator.validate_series("UNRATE", "fred", [{"date": "2024-01-01", "value": 45.0}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert any(r.failed for r in range_results)

@test("Unemployment rate of 3.7% passes range check")
def _():
    report = validator.validate_series("UNRATE", "fred", [{"date": "2024-01-01", "value": 3.7}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert all(r.passed for r in range_results)

@test("Top 1% wealth share of 30% passes range check")
def _():
    report = validator.validate_series("WFRBST01134", "fred", [{"date": "2024-01-01", "value": 30.8}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert all(r.passed for r in range_results)

@test("Top 1% wealth share of 60% fails range check")
def _():
    report = validator.validate_series("WFRBST01134", "fred", [{"date": "2024-01-01", "value": 60.0}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert any(r.failed for r in range_results)

@test("Debt-to-GDP of 98% passes range check")
def _():
    report = validator.validate_series("GFDEGDQ188S", "fred", [{"date": "2024-01-01", "value": 98.0}])
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert all(r.passed for r in range_results)

@test("Staleness check passes for recent data")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2025-12-01", "value": 320.0}])
    stale_results = [r for r in report.results if r.check_type == "staleness_check"]
    assert all(r.passed for r in stale_results)

@test("Staleness check warns for old data")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2023-01-01", "value": 300.0}])
    stale_results = [r for r in report.results if r.check_type == "staleness_check"]
    assert any(r.status in ("warn", "fail") for r in stale_results)

@test("Staleness check fails for very old data")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2020-01-01", "value": 260.0}])
    stale_results = [r for r in report.results if r.check_type == "staleness_check"]
    assert any(r.failed for r in stale_results)

@test("YoY check passes for normal change")
def _():
    current = [{"date": "2024-01-01", "value": 4.0}]
    previous = [{"date": "2023-01-01", "value": 3.7}]
    report = validator.validate_series("UNRATE", "fred", current, previous)
    yoy = [r for r in report.results if r.check_type == "yoy_check"]
    assert all(r.status in ("pass", "warn") for r in yoy)

@test("YoY check warns for anomalous change")
def _():
    current = [{"date": "2024-01-01", "value": 15.0}]
    previous = [{"date": "2023-01-01", "value": 3.7}]
    report = validator.validate_series("UNRATE", "fred", current, previous)
    yoy = [r for r in report.results if r.check_type == "yoy_check"]
    assert any(r.status == "warn" for r in yoy)

@test("ValidationReport.passed is True when no failures")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2025-06-01", "value": 315.0}])
    assert report.passed

@test("ValidationReport.passed is False when failures exist")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [])
    assert not report.passed

@test("ValidationReport.summary() returns readable string")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [{"date": "2025-06-01", "value": 315.0}])
    s = report.summary()
    assert "CPIAUCSL" in s
    assert "PASS" in s or "FAIL" in s

@test("Null values in observations are handled gracefully")
def _():
    report = validator.validate_series("CPIAUCSL", "fred", [
        {"date": "2024-01-01", "value": 310.0},
        {"date": "2024-02-01", "value": None},
        {"date": "2024-03-01", "value": 312.0},
    ])
    # Should not crash, and should pass (None values skipped in range check)
    range_results = [r for r in report.results if r.check_type == "range_check"]
    assert all(r.passed for r in range_results)


# ============================================================================
# CONFIGURATION TESTS
# ============================================================================
print("\n── Configuration ──")

from config.indicators import INDICATORS, PILLARS, FRED_SERIES, VALIDATION_RULES

@test("Exactly 13 indicators defined")
def _():
    assert len(INDICATORS) == 13, f"Got {len(INDICATORS)}"

@test("Exactly 4 pillars defined")
def _():
    assert len(PILLARS) == 4, f"Got {len(PILLARS)}"

@test("All FRED series map to valid indicators")
def _():
    for series_id, config in FRED_SERIES.items():
        assert "indicator" in config, f"{series_id} missing 'indicator'"
        assert config["indicator"] in INDICATORS, f"{series_id} → unknown indicator '{config['indicator']}'"

@test("All indicators have required fields")
def _():
    required = {"id", "pillar", "name", "order", "description", "data_streams", "update_frequency"}
    for ind_id, config in INDICATORS.items():
        missing = required - set(config.keys())
        assert not missing, f"Indicator '{ind_id}' missing: {missing}"

@test("Pillar-indicator mapping is consistent")
def _():
    for pillar_id, pillar in PILLARS.items():
        for ind_id in pillar["indicators"]:
            assert ind_id in INDICATORS, f"Pillar '{pillar_id}' refs unknown '{ind_id}'"
            assert INDICATORS[ind_id]["pillar"] == pillar_id, (
                f"'{ind_id}' claims pillar '{INDICATORS[ind_id]['pillar']}' but listed under '{pillar_id}'"
            )

@test("All 13 indicators are assigned to a pillar")
def _():
    all_in_pillars = set()
    for p in PILLARS.values():
        all_in_pillars.update(p["indicators"])
    assert all_in_pillars == set(INDICATORS.keys()), (
        f"Mismatch: in pillars but not indicators: {all_in_pillars - set(INDICATORS.keys())}, "
        f"in indicators but not pillars: {set(INDICATORS.keys()) - all_in_pillars}"
    )

@test("Pillar ordering is 1-4")
def _():
    orders = sorted(p["order"] for p in PILLARS.values())
    assert orders == [1, 2, 3, 4]

@test("Indicator ordering is 1-13")
def _():
    orders = sorted(ind["order"] for ind in INDICATORS.values())
    assert orders == list(range(1, 14))

@test("FRED series have unit and frequency")
def _():
    for series_id, config in FRED_SERIES.items():
        assert "unit" in config, f"{series_id} missing 'unit'"
        assert "frequency" in config, f"{series_id} missing 'frequency'"

@test("Validation rules reference valid FRED series")
def _():
    for series_id in VALIDATION_RULES:
        assert series_id in FRED_SERIES, f"Validation rule for unknown series '{series_id}'"

@test("Validation rules have min, max, and max_yoy_change")
def _():
    for series_id, rules in VALIDATION_RULES.items():
        assert "min" in rules, f"{series_id} missing 'min'"
        assert "max" in rules, f"{series_id} missing 'max'"
        assert "max_yoy_change" in rules, f"{series_id} missing 'max_yoy_change'"
        assert rules["min"] < rules["max"], f"{series_id}: min >= max"


# ============================================================================
# FRED PIPELINE UNIT TESTS (no network)
# ============================================================================
print("\n── FRED Pipeline (unit) ──")

from backend.app.pipelines.fred.pipeline import FREDPipeline, prepare_for_db

@test("prepare_for_db produces correct row structure")
def _():
    observations = [
        {"date": "2024-01-01", "value": 310.5},
        {"date": "2024-04-01", "value": 312.0},
    ]
    rows = prepare_for_db(
        series_id="CPIAUCSL",
        series_config={"indicator": "currency_debasement", "unit": "index", "frequency": "monthly"},
        observations=observations,
        raw_hash="abc123",
    )
    assert len(rows) == 2
    r = rows[0]
    assert r["indicator_id"] == "currency_debasement"
    assert r["country_code"] == "USA"
    assert r["source_id"] == "fred"
    assert r["year"] == 2024
    assert r["quarter"] == 1
    assert r["month"] == 1
    assert r["value"] == 310.5
    assert r["series_id"] == "CPIAUCSL"
    assert r["source_hash"] == "abc123"
    assert r["transformation"] is None  # Raw, no transform

@test("prepare_for_db: Q2 date maps to quarter=2")
def _():
    rows = prepare_for_db(
        series_id="TEST",
        series_config={"indicator": "debt_to_gdp", "unit": "percent"},
        observations=[{"date": "2024-04-01", "value": 98.5}],
        raw_hash="x",
    )
    assert rows[0]["quarter"] == 2
    assert rows[0]["month"] == 4

@test("prepare_for_db skips None values")
def _():
    rows = prepare_for_db(
        series_id="TEST",
        series_config={"indicator": "debt_to_gdp", "unit": "percent"},
        observations=[
            {"date": "2024-01-01", "value": 98.5},
            {"date": "2024-02-01", "value": None},
        ],
        raw_hash="x",
    )
    assert len(rows) == 1

@test("prepare_for_db handles all quarters correctly")
def _():
    obs = [
        {"date": "2024-01-15", "value": 1},
        {"date": "2024-04-15", "value": 2},
        {"date": "2024-07-15", "value": 3},
        {"date": "2024-10-15", "value": 4},
    ]
    rows = prepare_for_db("T", {"indicator": "x", "unit": "y"}, obs, "h")
    quarters = [r["quarter"] for r in rows]
    assert quarters == [1, 2, 3, 4]

@test("FREDPipeline._parse_observations handles FRED missing value '.'")
def _():
    # Can't instantiate full pipeline without API key, so test the parsing logic directly
    raw = {
        "observations": [
            {"date": "2024-01-01", "value": "310.5", "realtime_start": "", "realtime_end": ""},
            {"date": "2024-02-01", "value": ".", "realtime_start": "", "realtime_end": ""},
            {"date": "2024-03-01", "value": "", "realtime_start": "", "realtime_end": ""},
            {"date": "2024-04-01", "value": "312.1", "realtime_start": "", "realtime_end": ""},
        ]
    }
    # Use the class method directly
    pipeline = FREDPipeline.__new__(FREDPipeline)
    result = pipeline._parse_observations(raw)
    assert len(result) == 4
    assert result[0]["value"] == 310.5
    assert result[1]["value"] is None  # "." → None
    assert result[2]["value"] is None  # "" → None
    assert result[3]["value"] == 312.1


# ============================================================================
# STATIC PIPELINE UNIT TESTS
# ============================================================================
print("\n── Static Pipeline (unit) ──")

from backend.app.pipelines.static.pipeline import StaticDatasetPipeline

@test("DW-NOMINATE processor handles CSV data")
def _():
    pipeline = StaticDatasetPipeline.__new__(StaticDatasetPipeline)
    pipeline.audit = AuditLogger()

    # Minimal valid DW-NOMINATE CSV
    csv_data = (
        "congress,chamber,party_code,nominate_dim1,bioname\n"
        "117,House,200,0.512,Smith John\n"
        "117,House,200,0.489,Jones Jane\n"
        "117,House,100,-0.412,Doe Alice\n"
        "117,House,100,-0.388,Brown Bob\n"
        "117,Senate,200,0.601,White Carol\n"
        "117,Senate,100,-0.450,Green Dan\n"
    )
    records = pipeline._process_dw_nominate(csv_data)
    assert len(records) > 0

    # Check structure
    r = records[0]
    assert r["indicator_id"] == "political_polarization"
    assert r["country_code"] == "USA"
    assert r["source_id"] == "voteview"
    assert "value" in r
    assert "year" in r

    # Check party mapping
    parties = {r["party"] for r in records}
    assert "Democrat" in parties
    assert "Republican" in parties

@test("DW-NOMINATE processor calculates mean scores")
def _():
    pipeline = StaticDatasetPipeline.__new__(StaticDatasetPipeline)
    pipeline.audit = AuditLogger()

    csv_data = (
        "congress,chamber,party_code,nominate_dim1,bioname\n"
        "117,House,200,0.500,A\n"
        "117,House,200,0.600,B\n"
    )
    records = pipeline._process_dw_nominate(csv_data)
    rep_house = [r for r in records if r["party"] == "Republican" and r["chamber"] == "House"]
    assert len(rep_house) == 1
    assert rep_house[0]["value"] == 0.55  # mean of 0.5 and 0.6

@test("DW-NOMINATE processor skips NA values")
def _():
    pipeline = StaticDatasetPipeline.__new__(StaticDatasetPipeline)
    pipeline.audit = AuditLogger()

    csv_data = (
        "congress,chamber,party_code,nominate_dim1,bioname\n"
        "117,House,200,NA,Smith\n"
        "117,House,200,0.500,Jones\n"
    )
    records = pipeline._process_dw_nominate(csv_data)
    rep = [r for r in records if r["party"] == "Republican"]
    assert len(rep) == 1
    assert rep[0]["value"] == 0.5
    assert rep[0]["member_count"] == 1


# ============================================================================
# SQL SCHEMA VALIDATION
# ============================================================================
print("\n── Schema Validation ──")

@test("Schema SQL file exists and is non-empty")
def _():
    path = Path(PROJECT_ROOT) / "database/migrations/001_initial_schema.sql"
    assert path.exists(), f"Schema file not found at {path}"
    content = path.read_text()
    assert len(content) > 1000, f"Schema seems too short: {len(content)} chars"

@test("Schema creates augur schema namespace")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    assert "CREATE SCHEMA IF NOT EXISTS augur" in schema

@test("Schema has all required tables")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    required_tables = [
        "augur.countries", "augur.pillars", "augur.indicators",
        "augur.data_sources", "augur.data_points", "augur.source_hashes",
        "augur.validation_log", "augur.transformation_log",
        "augur.indicator_scores", "augur.pillar_scores", "augur.composite_scores",
        "augur.historical_cases", "augur.uncomfortable_numbers",
        "augur.published_hashes", "augur.data_changelog",
    ]
    for table in required_tables:
        assert table in schema, f"Missing table: {table}"

@test("Schema seeds all 4 pillars")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    for p in ["social_cohesion", "economic_structure", "systemic_capacity", "external_environment"]:
        assert f"'{p}'" in schema, f"Pillar '{p}' not seeded"

@test("Schema seeds all 13 indicators")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    for ind in INDICATORS.keys():
        assert f"'{ind}'" in schema, f"Indicator '{ind}' not seeded"

@test("Schema seeds initial countries including USA")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    assert "'USA'" in schema
    assert "'GBR'" in schema
    assert "'CHN'" in schema

@test("Schema has data integrity tables (source_hashes, validation_log, changelog)")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    assert "source_hashes" in schema
    assert "validation_log" in schema
    assert "data_changelog" in schema
    assert "SHA-256" in schema or "sha-256" in schema.lower() or "raw_data_hash" in schema

@test("Schema enforces data_points uniqueness constraint")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    assert "UNIQUE (indicator_id, country_code, date_value, source_id, series_id)" in schema

@test("Schema has indexes for common query patterns")
def _():
    schema = Path(PROJECT_ROOT, "database/migrations/001_initial_schema.sql").read_text()
    assert "idx_data_points_indicator" in schema
    assert "idx_data_points_country" in schema
    assert "idx_data_points_date" in schema


# ============================================================================
# RESULTS
# ============================================================================
print("\n" + "=" * 60)
total = passed + failed
print(f"RESULTS: {passed}/{total} passed, {failed} failed")
if errors:
    print(f"\nFailed tests:")
    for name, err in errors:
        print(f"  ✗ {name}")
        # Print first line of error only
        print(f"    {err.strip().split(chr(10))[0]}")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
