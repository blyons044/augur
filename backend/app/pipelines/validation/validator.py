"""
Augur Validation Layer

Validation failures trigger alerts rather than silently passing bad data downstream.
Every check is logged. Every anomaly is recorded. Nothing slips through.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("augur.validation")


@dataclass
class ValidationResult:
    """Result of a single validation check."""
    check_type: str
    status: str  # "pass", "warn", "fail"
    message: str
    series_id: Optional[str] = None
    details: dict = field(default_factory=dict)
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def passed(self) -> bool:
        return self.status == "pass"

    @property
    def failed(self) -> bool:
        return self.status == "fail"


@dataclass
class ValidationReport:
    """Aggregate report from all validation checks on a dataset."""
    source_id: str
    series_id: Optional[str]
    results: list[ValidationResult] = field(default_factory=list)
    started_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def passed(self) -> bool:
        return not any(r.failed for r in self.results)

    @property
    def has_warnings(self) -> bool:
        return any(r.status == "warn" for r in self.results)

    @property
    def failure_count(self) -> int:
        return sum(1 for r in self.results if r.failed)

    @property
    def warning_count(self) -> int:
        return sum(1 for r in self.results if r.status == "warn")

    def summary(self) -> str:
        total = len(self.results)
        passes = sum(1 for r in self.results if r.passed)
        warns = self.warning_count
        fails = self.failure_count
        status = "PASS" if self.passed else "FAIL"
        return (
            f"[{status}] {self.source_id}/{self.series_id}: "
            f"{passes}/{total} passed, {warns} warnings, {fails} failures"
        )


class DataValidator:
    """
    Validates incoming data against expected rules.
    Rules come from config/indicators.py VALIDATION_RULES.
    """

    def __init__(self, validation_rules: dict):
        self.rules = validation_rules

    def validate_series(
        self,
        series_id: str,
        source_id: str,
        observations: list[dict],
        previous_observations: Optional[list[dict]] = None,
    ) -> ValidationReport:
        """
        Run all applicable validation checks on a data series.

        Args:
            series_id: The FRED series ID or equivalent
            source_id: The data source identifier
            observations: List of {"date": ..., "value": ...} dicts
            previous_observations: Prior data for YoY comparison
        """
        report = ValidationReport(source_id=source_id, series_id=series_id)
        rules = self.rules.get(series_id)

        # Always run structural checks
        report.results.append(self._check_completeness(series_id, observations))
        report.results.append(self._check_format(series_id, observations))

        # Only proceed to rule-based checks if format check passed
        format_passed = all(
            r.passed for r in report.results if r.check_type == "format_check"
        )

        # Run rule-based checks if rules exist and format is valid
        if rules and observations and format_passed:
            report.results.append(
                self._check_range(series_id, observations, rules)
            )
            report.results.append(
                self._check_staleness(series_id, observations)
            )
            if previous_observations:
                report.results.append(
                    self._check_yoy_change(
                        series_id, observations, previous_observations, rules
                    )
                )

        # Log summary
        if report.passed:
            logger.info(report.summary())
        else:
            logger.error(report.summary())
            for r in report.results:
                if r.failed:
                    logger.error(f"  FAIL: {r.message}")

        return report

    def _check_completeness(
        self, series_id: str, observations: list[dict]
    ) -> ValidationResult:
        """Check that we received data at all."""
        if not observations:
            return ValidationResult(
                check_type="completeness_check",
                status="fail",
                series_id=series_id,
                message=f"No observations received for {series_id}",
            )
        return ValidationResult(
            check_type="completeness_check",
            status="pass",
            series_id=series_id,
            message=f"Received {len(observations)} observations",
            details={"count": len(observations)},
        )

    def _check_format(
        self, series_id: str, observations: list[dict]
    ) -> ValidationResult:
        """Check that observations have expected structure."""
        issues = []
        for i, obs in enumerate(observations):
            if "date" not in obs:
                issues.append(f"Observation {i} missing 'date'")
            if "value" not in obs:
                issues.append(f"Observation {i} missing 'value'")
            elif obs["value"] is not None:
                try:
                    float(obs["value"])
                except (ValueError, TypeError):
                    issues.append(
                        f"Observation {i} value '{obs['value']}' not numeric"
                    )

        if issues:
            return ValidationResult(
                check_type="format_check",
                status="fail",
                series_id=series_id,
                message=f"Format issues: {len(issues)} problems found",
                details={"issues": issues[:10]},  # Cap at 10
            )
        return ValidationResult(
            check_type="format_check",
            status="pass",
            series_id=series_id,
            message="All observations have valid format",
        )

    def _check_range(
        self,
        series_id: str,
        observations: list[dict],
        rules: dict,
    ) -> ValidationResult:
        """Check values fall within expected historical ranges."""
        min_val = rules.get("min")
        max_val = rules.get("max")
        out_of_range = []

        for obs in observations:
            if obs["value"] is None:
                continue
            val = float(obs["value"])
            if min_val is not None and val < min_val:
                out_of_range.append(
                    {"date": obs["date"], "value": val, "issue": f"below min {min_val}"}
                )
            if max_val is not None and val > max_val:
                out_of_range.append(
                    {"date": obs["date"], "value": val, "issue": f"above max {max_val}"}
                )

        if out_of_range:
            return ValidationResult(
                check_type="range_check",
                status="fail",
                series_id=series_id,
                message=(
                    f"{len(out_of_range)} values outside expected range "
                    f"[{min_val}, {max_val}] for {series_id}"
                ),
                details={
                    "out_of_range": out_of_range[:10],
                    "expected_range": {"min": min_val, "max": max_val},
                    "description": rules.get("description", ""),
                },
            )
        return ValidationResult(
            check_type="range_check",
            status="pass",
            series_id=series_id,
            message=f"All values within expected range [{min_val}, {max_val}]",
        )

    def _check_staleness(
        self, series_id: str, observations: list[dict]
    ) -> ValidationResult:
        """Check that data is reasonably current."""
        if not observations:
            return ValidationResult(
                check_type="staleness_check",
                status="fail",
                series_id=series_id,
                message="No data to check staleness",
            )

        # Find most recent observation
        dates = [obs["date"] for obs in observations if obs.get("date")]
        if not dates:
            return ValidationResult(
                check_type="staleness_check",
                status="fail",
                series_id=series_id,
                message="No valid dates found",
            )

        most_recent = max(dates)
        try:
            most_recent_dt = datetime.strptime(str(most_recent), "%Y-%m-%d")
        except ValueError:
            return ValidationResult(
                check_type="staleness_check",
                status="warn",
                series_id=series_id,
                message=f"Could not parse most recent date: {most_recent}",
            )

        days_old = (datetime.now() - most_recent_dt).days

        if days_old > 1095:  # More than 2 years old
            return ValidationResult(
                check_type="staleness_check",
                status="fail",
                series_id=series_id,
                message=f"Most recent data is {days_old} days old ({most_recent})",
                details={"most_recent_date": most_recent, "days_old": days_old},
            )
        elif days_old > 730:  # More than 1 year old
            return ValidationResult(
                check_type="staleness_check",
                status="warn",
                series_id=series_id,
                message=f"Data may be stale — most recent is {days_old} days old ({most_recent})",
                details={"most_recent_date": most_recent, "days_old": days_old},
            )
        return ValidationResult(
            check_type="staleness_check",
            status="pass",
            series_id=series_id,
            message=f"Data current — most recent observation: {most_recent}",
            details={"most_recent_date": most_recent, "days_old": days_old},
        )

    def _check_yoy_change(
        self,
        series_id: str,
        observations: list[dict],
        previous_observations: list[dict],
        rules: dict,
    ) -> ValidationResult:
        """Check for anomalous year-over-year changes."""
        max_yoy = rules.get("max_yoy_change")
        if max_yoy is None:
            return ValidationResult(
                check_type="yoy_check",
                status="pass",
                series_id=series_id,
                message="No YoY rule defined — skipped",
            )

        # Build lookup of previous values by date
        prev_lookup = {}
        for obs in previous_observations:
            if obs.get("date") and obs.get("value") is not None:
                prev_lookup[obs["date"]] = float(obs["value"])

        anomalies = []
        for obs in observations:
            if obs.get("value") is None or obs.get("date") is None:
                continue

            val = float(obs["value"])
            date_str = str(obs["date"])

            # Try to find corresponding prior year observation
            try:
                year = int(date_str[:4])
                prior_date = f"{year - 1}{date_str[4:]}"
                if prior_date in prev_lookup:
                    change = abs(val - prev_lookup[prior_date])
                    if change > max_yoy:
                        anomalies.append({
                            "date": date_str,
                            "value": val,
                            "prior_value": prev_lookup[prior_date],
                            "change": change,
                            "max_allowed": max_yoy,
                        })
            except (ValueError, IndexError):
                continue

        if anomalies:
            return ValidationResult(
                check_type="yoy_check",
                status="warn",  # Warn, not fail — anomalous doesn't mean wrong
                series_id=series_id,
                message=(
                    f"{len(anomalies)} observations with YoY change "
                    f"exceeding {max_yoy}"
                ),
                details={"anomalies": anomalies[:10]},
            )
        return ValidationResult(
            check_type="yoy_check",
            status="pass",
            series_id=series_id,
            message=f"All YoY changes within expected threshold ({max_yoy})",
        )
