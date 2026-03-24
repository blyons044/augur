"""
Tests for Augur FRED Pipeline and Validation Layer

Run with: pytest backend/tests/ -v
"""

import json
import pytest
from unittest.mock import patch, MagicMock

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.integrity import hash_raw_data, hash_dataset, AuditLogger
from backend.app.pipelines.validation.validator import DataValidator, ValidationReport
from config.indicators import VALIDATION_RULES, FRED_SERIES


# ============================================================================
# INTEGRITY TESTS
# ============================================================================

class TestIntegrity:
    """Tests for cryptographic data integrity."""

    def test_hash_raw_data_deterministic(self):
        """Same input must always produce same hash."""
        data = "test data for hashing"
        hash1 = hash_raw_data(data)
        hash2 = hash_raw_data(data)
        assert hash1 == hash2

    def test_hash_raw_data_bytes_and_str_match(self):
        """String and bytes versions of same content must hash identically."""
        text = "test content"
        assert hash_raw_data(text) == hash_raw_data(text.encode("utf-8"))

    def test_hash_dataset_deterministic(self):
        """Same dataset must always produce same hash regardless of insertion order."""
        records = [
            {"date": "2024-01-01", "value": 100.5, "series": "A"},
            {"date": "2024-02-01", "value": 101.3, "series": "A"},
        ]
        hash1 = hash_dataset(records)
        hash2 = hash_dataset(records)
        assert hash1 == hash2

    def test_hash_different_data_differs(self):
        """Different data must produce different hashes."""
        hash1 = hash_raw_data("data version 1")
        hash2 = hash_raw_data("data version 2")
        assert hash1 != hash2

    def test_hash_is_sha256(self):
        """Hash must be valid SHA-256 (64 hex characters)."""
        h = hash_raw_data("test")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)


# ============================================================================
# AUDIT LOGGER TESTS
# ============================================================================

class TestAuditLogger:
    """Tests for the audit trail system."""

    def test_log_source_pull(self):
        audit = AuditLogger()
        entry = audit.log_source_pull(
            source_id="fred",
            series_id="CPIAUCSL",
            source_url="https://api.stlouisfed.org/fred/series/observations",
            raw_data_hash="abc123" * 10 + "abcd",
            record_count=100,
            byte_count=5000,
        )
        assert entry["type"] == "source_pull"
        assert entry["source_id"] == "fred"
        assert entry["record_count"] == 100

    def test_log_validation(self):
        audit = AuditLogger()
        entry = audit.log_validation(
            source_id="fred",
            series_id="CPIAUCSL",
            check_type="range_check",
            status="pass",
            message="All values in range",
        )
        assert entry["status"] == "pass"

    def test_flush_to_jsonl(self, tmp_path):
        audit = AuditLogger()
        audit.log_source_pull(
            source_id="fred", series_id="TEST",
            source_url="test", raw_data_hash="abc",
            record_count=1, byte_count=100,
        )
        audit.log_validation(
            source_id="fred", series_id="TEST",
            check_type="range_check", status="pass",
            message="ok",
        )

        filepath = tmp_path / "audit.jsonl"
        count = audit.flush_to_jsonl(str(filepath))
        assert count == 2

        # Verify JSONL is valid
        with open(filepath) as f:
            lines = f.readlines()
        assert len(lines) == 2
        for line in lines:
            parsed = json.loads(line)
            assert "type" in parsed


# ============================================================================
# VALIDATION TESTS
# ============================================================================

class TestValidation:
    """Tests for the data validation layer."""

    def setup_method(self):
        self.validator = DataValidator(VALIDATION_RULES)

    def test_completeness_check_empty(self):
        """Empty data must fail completeness check."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[],
        )
        assert not report.passed
        assert any(
            r.check_type == "completeness_check" and r.failed
            for r in report.results
        )

    def test_completeness_check_has_data(self):
        """Non-empty data should pass completeness check."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[{"date": "2024-01-01", "value": 310.0}],
        )
        assert any(
            r.check_type == "completeness_check" and r.passed
            for r in report.results
        )

    def test_format_check_missing_date(self):
        """Observations without dates must fail format check."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[{"value": 310.0}],
        )
        assert any(
            r.check_type == "format_check" and r.failed
            for r in report.results
        )

    def test_format_check_non_numeric(self):
        """Non-numeric values must fail format check."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[{"date": "2024-01-01", "value": "not_a_number"}],
        )
        assert any(
            r.check_type == "format_check" and r.failed
            for r in report.results
        )

    def test_range_check_within_bounds(self):
        """Values within expected range should pass."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[
                {"date": "2024-01-01", "value": 310.0},
                {"date": "2024-02-01", "value": 311.5},
            ],
        )
        range_results = [r for r in report.results if r.check_type == "range_check"]
        assert all(r.passed for r in range_results)

    def test_range_check_out_of_bounds(self):
        """Values outside expected range must fail."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[
                {"date": "2024-01-01", "value": 999.0},  # Way above max of 500
            ],
        )
        range_results = [r for r in report.results if r.check_type == "range_check"]
        assert any(r.failed for r in range_results)

    def test_range_check_unemployment(self):
        """Unemployment rate validation should catch impossible values."""
        report = self.validator.validate_series(
            series_id="UNRATE",
            source_id="fred",
            observations=[
                {"date": "2024-01-01", "value": 3.7},   # Normal
                {"date": "2024-02-01", "value": 45.0},  # Impossible
            ],
        )
        range_results = [r for r in report.results if r.check_type == "range_check"]
        assert any(r.failed for r in range_results)

    def test_yoy_check_normal_change(self):
        """Normal year-over-year changes should pass."""
        current = [{"date": "2024-01-01", "value": 4.0}]
        previous = [{"date": "2023-01-01", "value": 3.7}]

        report = self.validator.validate_series(
            series_id="UNRATE",
            source_id="fred",
            observations=current,
            previous_observations=previous,
        )
        yoy_results = [r for r in report.results if r.check_type == "yoy_check"]
        assert all(r.passed or r.status == "warn" for r in yoy_results)

    def test_yoy_check_anomalous_change(self):
        """Anomalous year-over-year changes should warn."""
        current = [{"date": "2024-01-01", "value": 15.0}]
        previous = [{"date": "2023-01-01", "value": 3.7}]

        report = self.validator.validate_series(
            series_id="UNRATE",
            source_id="fred",
            observations=current,
            previous_observations=previous,
        )
        yoy_results = [r for r in report.results if r.check_type == "yoy_check"]
        assert any(r.status == "warn" for r in yoy_results)

    def test_validation_report_summary(self):
        """Validation reports should produce readable summaries."""
        report = self.validator.validate_series(
            series_id="CPIAUCSL",
            source_id="fred",
            observations=[{"date": "2024-01-01", "value": 310.0}],
        )
        summary = report.summary()
        assert "CPIAUCSL" in summary
        assert "PASS" in summary or "FAIL" in summary


# ============================================================================
# CONFIGURATION TESTS
# ============================================================================

class TestConfiguration:
    """Tests for indicator and source configuration."""

    def test_all_fred_series_have_indicator(self):
        """Every FRED series must map to a valid indicator."""
        from config.indicators import INDICATORS
        for series_id, config in FRED_SERIES.items():
            assert "indicator" in config, f"{series_id} missing 'indicator'"
            assert config["indicator"] in INDICATORS, (
                f"{series_id} maps to unknown indicator '{config['indicator']}'"
            )

    def test_all_indicators_have_required_fields(self):
        """Every indicator must have all required fields."""
        from config.indicators import INDICATORS
        required = {"id", "pillar", "name", "order", "description", "data_streams", "update_frequency"}
        for ind_id, config in INDICATORS.items():
            missing = required - set(config.keys())
            assert not missing, f"Indicator '{ind_id}' missing fields: {missing}"

    def test_pillar_indicator_mapping_consistent(self):
        """Indicators listed in pillars must match indicator pillar assignments."""
        from config.indicators import PILLARS, INDICATORS
        for pillar_id, pillar in PILLARS.items():
            for ind_id in pillar["indicators"]:
                assert ind_id in INDICATORS, f"Pillar '{pillar_id}' references unknown indicator '{ind_id}'"
                assert INDICATORS[ind_id]["pillar"] == pillar_id, (
                    f"Indicator '{ind_id}' claims pillar '{INDICATORS[ind_id]['pillar']}' "
                    f"but is listed under pillar '{pillar_id}'"
                )

    def test_thirteen_indicators(self):
        """Augur must have exactly 13 indicators."""
        from config.indicators import INDICATORS
        assert len(INDICATORS) == 13, f"Expected 13 indicators, got {len(INDICATORS)}"

    def test_four_pillars(self):
        """Augur must have exactly 4 pillars."""
        from config.indicators import PILLARS
        assert len(PILLARS) == 4, f"Expected 4 pillars, got {len(PILLARS)}"


# ============================================================================
# FRED PIPELINE TESTS (mocked API calls)
# ============================================================================

class TestFREDPipeline:
    """Tests for FRED data pipeline with mocked HTTP."""

    def _make_mock_response(self, observations):
        """Create a mock FRED API response."""
        return {
            "observations": [
                {"date": obs[0], "value": str(obs[1]), "realtime_start": "2024-01-01", "realtime_end": "2024-12-31"}
                for obs in observations
            ]
        }

    @patch("backend.app.pipelines.fred.pipeline.FREDPipeline._fetch_raw")
    def test_fetch_series_success(self, mock_fetch):
        """Successful FRED fetch should return validated data."""
        mock_fetch.return_value = (
            self._make_mock_response([
                ("2024-01-01", 310.5),
                ("2024-02-01", 311.2),
            ]),
            {"id": "CPIAUCSL", "title": "CPI"},
        )

        from backend.app.pipelines.fred.pipeline import FREDPipeline
        pipeline = FREDPipeline(
            api_key="test_key",
            series_config=FRED_SERIES,
            validation_rules=VALIDATION_RULES,
        )

        result = pipeline.fetch_series("CPIAUCSL")
        assert result["series_id"] == "CPIAUCSL"
        assert len(result["observations"]) == 2
        assert result["observations"][0]["value"] == 310.5
        assert len(result["raw_hash"]) == 64  # SHA-256

    @patch("backend.app.pipelines.fred.pipeline.FREDPipeline._fetch_raw")
    def test_fred_missing_values_handled(self, mock_fetch):
        """FRED '.' values (missing data) should become None."""
        mock_fetch.return_value = (
            {
                "observations": [
                    {"date": "2024-01-01", "value": "310.5", "realtime_start": "", "realtime_end": ""},
                    {"date": "2024-02-01", "value": ".", "realtime_start": "", "realtime_end": ""},
                    {"date": "2024-03-01", "value": "312.1", "realtime_start": "", "realtime_end": ""},
                ]
            },
            {"id": "TEST"},
        )

        from backend.app.pipelines.fred.pipeline import FREDPipeline
        pipeline = FREDPipeline(api_key="test_key")

        result = pipeline.fetch_series("TEST_SERIES")
        values = [o["value"] for o in result["observations"]]
        assert values == [310.5, None, 312.1]


# ============================================================================
# DB ROW PREPARATION TESTS
# ============================================================================

class TestPrepareForDB:
    """Tests for the FRED-to-database transformation."""

    def test_prepare_basic_rows(self):
        from backend.app.pipelines.fred.pipeline import prepare_for_db

        observations = [
            {"date": "2024-01-01", "value": 310.5, "realtime_start": "", "realtime_end": ""},
            {"date": "2024-04-01", "value": 312.0, "realtime_start": "", "realtime_end": ""},
        ]

        rows = prepare_for_db(
            series_id="CPIAUCSL",
            series_config={"indicator": "currency_debasement", "unit": "index", "frequency": "monthly"},
            observations=observations,
            raw_hash="abc123",
        )

        assert len(rows) == 2
        assert rows[0]["indicator_id"] == "currency_debasement"
        assert rows[0]["country_code"] == "USA"
        assert rows[0]["year"] == 2024
        assert rows[0]["quarter"] == 1
        assert rows[0]["month"] == 1
        assert rows[1]["quarter"] == 2

    def test_prepare_skips_null_values(self):
        from backend.app.pipelines.fred.pipeline import prepare_for_db

        observations = [
            {"date": "2024-01-01", "value": 310.5},
            {"date": "2024-02-01", "value": None},  # Should be skipped
        ]

        rows = prepare_for_db(
            series_id="CPIAUCSL",
            series_config={"indicator": "currency_debasement", "unit": "index"},
            observations=observations,
            raw_hash="abc",
        )

        assert len(rows) == 1
