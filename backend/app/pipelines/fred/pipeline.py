"""
Augur FRED Pipeline

Federal Reserve Economic Data is the economic data backbone.
This pipeline pulls, validates, hashes, and stores FRED series data.

Every pull is fingerprinted. Every anomaly is flagged. Nothing is silent.
"""

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

import requests

from backend.app.core.integrity import AuditLogger, hash_raw_data, hash_dataset
from backend.app.pipelines.validation.validator import DataValidator

logger = logging.getLogger("augur.pipeline.fred")

# FRED API base URL
FRED_API_BASE = "https://api.stlouisfed.org/fred"

# Rate limiting: FRED allows 120 requests per 60 seconds
RATE_LIMIT_DELAY = 0.6  # seconds between requests


class FREDPipeline:
    """
    Pulls economic data from FRED, validates it, and prepares it for storage.

    Design principles:
    - Immediate SHA-256 fingerprinting of every raw response
    - Validation before any data enters the system
    - Complete audit trail of every operation
    - Graceful degradation — partial failures don't corrupt clean data
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        series_config: Optional[dict] = None,
        validation_rules: Optional[dict] = None,
        audit_logger: Optional[AuditLogger] = None,
    ):
        self.api_key = api_key or os.environ.get("FRED_API_KEY")
        if not self.api_key:
            raise ValueError(
                "FRED API key required. Set FRED_API_KEY environment variable. "
                "Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html"
            )

        self.series_config = series_config or {}
        self.validator = DataValidator(validation_rules or {})
        self.audit = audit_logger or AuditLogger()
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Augur-Stress-Index/1.0"})

    def fetch_series(
        self,
        series_id: str,
        observation_start: Optional[str] = None,
        observation_end: Optional[str] = None,
        frequency: Optional[str] = None,
    ) -> dict:
        """
        Fetch a single FRED series.

        Returns:
            {
                "series_id": str,
                "metadata": dict,
                "observations": [{"date": str, "value": float|None}],
                "raw_hash": str,
                "validation": ValidationReport,
                "fetched_at": str,
            }
        """
        logger.info(f"Fetching FRED series: {series_id}")

        # Step 1: Fetch raw data from FRED
        raw_response, metadata = self._fetch_raw(
            series_id, observation_start, observation_end, frequency
        )

        # Step 2: Immediately hash the raw response (before any processing)
        raw_bytes = json.dumps(raw_response, sort_keys=True).encode("utf-8")
        raw_hash = hash_raw_data(raw_bytes)

        # Log the source pull
        self.audit.log_source_pull(
            source_id="fred",
            series_id=series_id,
            source_url=f"{FRED_API_BASE}/series/observations?series_id={series_id}",
            raw_data_hash=raw_hash,
            record_count=len(raw_response.get("observations", [])),
            byte_count=len(raw_bytes),
            api_version="1.0",
        )

        # Step 3: Parse observations
        observations = self._parse_observations(raw_response)

        # Step 4: Validate
        validation_report = self.validator.validate_series(
            series_id=series_id,
            source_id="fred",
            observations=observations,
        )

        if not validation_report.passed:
            logger.error(
                f"Validation FAILED for {series_id} — "
                f"data will NOT be ingested. {validation_report.summary()}"
            )

        return {
            "series_id": series_id,
            "metadata": metadata,
            "observations": observations,
            "raw_hash": raw_hash,
            "validation": validation_report,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    def fetch_all_series(
        self,
        series_ids: Optional[list[str]] = None,
    ) -> dict:
        """
        Fetch all configured FRED series (or a specified subset).

        Returns:
            {
                "results": {series_id: result_dict},
                "summary": {"total": int, "passed": int, "failed": int},
                "dataset_hash": str,
                "completed_at": str,
            }
        """
        ids_to_fetch = series_ids or list(self.series_config.keys())
        results = {}
        passed = 0
        failed = 0

        logger.info(f"Starting FRED pipeline — {len(ids_to_fetch)} series to fetch")

        for i, series_id in enumerate(ids_to_fetch):
            try:
                result = self.fetch_series(series_id)
                results[series_id] = result

                if result["validation"].passed:
                    passed += 1
                else:
                    failed += 1

                # Rate limiting
                if i < len(ids_to_fetch) - 1:
                    time.sleep(RATE_LIMIT_DELAY)

            except Exception as e:
                logger.error(f"Error fetching {series_id}: {e}")
                failed += 1
                results[series_id] = {
                    "series_id": series_id,
                    "error": str(e),
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }

        # Hash the complete output dataset
        all_observations = []
        for sid, result in results.items():
            if "observations" in result:
                for obs in result["observations"]:
                    all_observations.append({
                        "series_id": sid,
                        "date": obs["date"],
                        "value": obs["value"],
                    })

        dataset_hash = hash_dataset(all_observations)

        # Log the dataset hash for public verification
        if all_observations:
            dates = [o["date"] for o in all_observations if o.get("date")]
            self.audit.log_hash_publication(
                dataset_name="fred_pipeline_full",
                dataset_hash=dataset_hash,
                record_count=len(all_observations),
                date_range=(min(dates) if dates else "", max(dates) if dates else ""),
            )

        summary = {
            "total": len(ids_to_fetch),
            "passed": passed,
            "failed": failed,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(
            f"FRED pipeline complete: {passed}/{len(ids_to_fetch)} passed, "
            f"{failed} failed. Dataset hash: {dataset_hash[:16]}..."
        )

        return {
            "results": results,
            "summary": summary,
            "dataset_hash": dataset_hash,
        }

    def _fetch_raw(
        self,
        series_id: str,
        observation_start: Optional[str] = None,
        observation_end: Optional[str] = None,
        frequency: Optional[str] = None,
    ) -> tuple[dict, dict]:
        """
        Make raw API call to FRED.
        Returns (observations_response, series_metadata).
        """
        # Fetch series metadata
        meta_params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
        }
        meta_url = f"{FRED_API_BASE}/series"
        meta_resp = self.session.get(meta_url, params=meta_params, timeout=30)
        meta_resp.raise_for_status()
        metadata = meta_resp.json().get("seriess", [{}])[0]

        # Fetch observations
        obs_params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "sort_order": "asc",
        }
        if observation_start:
            obs_params["observation_start"] = observation_start
        if observation_end:
            obs_params["observation_end"] = observation_end
        if frequency:
            obs_params["frequency"] = frequency

        obs_url = f"{FRED_API_BASE}/series/observations"
        obs_resp = self.session.get(obs_url, params=obs_params, timeout=30)
        obs_resp.raise_for_status()

        # TLS verification is enforced by default in requests
        # This satisfies the source verification security requirement

        return obs_resp.json(), metadata

    def _parse_observations(self, raw_response: dict) -> list[dict]:
        """
        Parse FRED API response into clean observation list.
        FRED uses "." for missing values — we convert to None.
        """
        observations = []
        for obs in raw_response.get("observations", []):
            value = obs.get("value")

            # FRED uses "." to indicate missing/unavailable data
            if value == "." or value is None or value == "":
                parsed_value = None
            else:
                try:
                    parsed_value = float(value)
                except (ValueError, TypeError):
                    logger.warning(
                        f"Non-numeric value '{value}' on {obs.get('date')} — treating as None"
                    )
                    parsed_value = None

            observations.append({
                "date": obs.get("date"),
                "value": parsed_value,
                "realtime_start": obs.get("realtime_start"),
                "realtime_end": obs.get("realtime_end"),
            })

        return observations


def prepare_for_db(
    series_id: str,
    series_config: dict,
    observations: list[dict],
    raw_hash: str,
    country_code: str = "USA",
) -> list[dict]:
    """
    Transform FRED observations into rows ready for augur.data_points table.

    This function is the bridge between raw API data and the database.
    Every transformation is explicit and auditable.
    """
    indicator_id = series_config.get("indicator", "unknown")
    unit = series_config.get("unit", "unknown")
    frequency = series_config.get("frequency", "unknown")

    rows = []
    for obs in observations:
        if obs["value"] is None:
            continue  # Skip missing values — don't insert nulls

        date_str = obs["date"]
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except (ValueError, TypeError):
            logger.warning(f"Skipping observation with invalid date: {date_str}")
            continue

        rows.append({
            "indicator_id": indicator_id,
            "country_code": country_code,
            "source_id": "fred",
            "date_value": date_str,
            "year": date_obj.year,
            "quarter": (date_obj.month - 1) // 3 + 1,
            "month": date_obj.month,
            "value": obs["value"],
            "raw_value": obs["value"],  # No transformation applied
            "unit": unit,
            "series_id": series_id,
            "transformation": None,  # Raw — no transform
            "source_hash": raw_hash,
        })

    return rows
