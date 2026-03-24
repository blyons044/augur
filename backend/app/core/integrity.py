"""
Augur Data Integrity Module

Every number on Augur traces to a source. Every transformation is logged.
Every dataset is cryptographically fingerprinted. This module enforces that.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("augur.integrity")


def hash_raw_data(data: bytes | str) -> str:
    """
    Generate SHA-256 hash of raw source data.
    Called immediately upon receiving any data from any source.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def hash_dataset(records: list[dict]) -> str:
    """
    Generate SHA-256 hash of a processed dataset.
    Deterministic: sorts keys, ensures consistent serialization.
    """
    canonical = json.dumps(records, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class AuditLogger:
    """
    Records every operation in the data pipeline.
    Nothing happens silently.
    """

    def __init__(self, db_connection=None):
        self.db = db_connection
        self._log_buffer: list[dict] = []

    def log_source_pull(
        self,
        source_id: str,
        series_id: Optional[str],
        source_url: str,
        raw_data_hash: str,
        record_count: int,
        byte_count: int,
        api_version: Optional[str] = None,
    ) -> dict:
        """Log a raw data pull with its SHA-256 hash."""
        entry = {
            "type": "source_pull",
            "source_id": source_id,
            "series_id": series_id,
            "source_url": source_url,
            "raw_data_hash": raw_data_hash,
            "record_count": record_count,
            "byte_count": byte_count,
            "api_version": api_version,
            "pull_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._log_buffer.append(entry)
        logger.info(
            f"Source pull: {source_id}/{series_id} — "
            f"{record_count} records, hash={raw_data_hash[:16]}..."
        )
        return entry

    def log_transformation(
        self,
        data_point_id: Optional[int],
        transformation_type: str,
        input_values: dict,
        output_value: float,
        function_name: str,
        function_version: str = "1.0",
        notes: Optional[str] = None,
    ) -> dict:
        """Log every transformation applied to data."""
        entry = {
            "type": "transformation",
            "data_point_id": data_point_id,
            "transformation_type": transformation_type,
            "input_values": input_values,
            "output_value": output_value,
            "function_name": function_name,
            "function_version": function_version,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "notes": notes,
        }
        self._log_buffer.append(entry)
        logger.debug(
            f"Transform: {transformation_type} via {function_name} → {output_value}"
        )
        return entry

    def log_validation(
        self,
        source_id: str,
        series_id: Optional[str],
        check_type: str,
        status: str,
        message: str,
        details: Optional[dict] = None,
    ) -> dict:
        """Log every validation check — pass, warn, or fail."""
        entry = {
            "type": "validation",
            "source_id": source_id,
            "series_id": series_id,
            "check_type": check_type,
            "status": status,
            "message": message,
            "details": details or {},
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }
        self._log_buffer.append(entry)

        log_fn = logger.info if status == "pass" else (
            logger.warning if status == "warn" else logger.error
        )
        log_fn(f"Validation [{status.upper()}] {source_id}/{series_id}: {message}")
        return entry

    def log_hash_publication(
        self,
        dataset_name: str,
        dataset_hash: str,
        record_count: int,
        date_range: tuple[str, str],
        git_commit: Optional[str] = None,
    ) -> dict:
        """Log publication of a dataset hash for independent verification."""
        entry = {
            "type": "hash_publication",
            "dataset_name": dataset_name,
            "dataset_hash": dataset_hash,
            "record_count": record_count,
            "date_range_start": date_range[0],
            "date_range_end": date_range[1],
            "published_at": datetime.now(timezone.utc).isoformat(),
            "git_commit_hash": git_commit,
        }
        self._log_buffer.append(entry)
        logger.info(
            f"Hash published: {dataset_name} — "
            f"{record_count} records, hash={dataset_hash[:16]}..."
        )
        return entry

    def flush_to_db(self):
        """Write buffered log entries to database."""
        if not self.db:
            logger.warning("No DB connection — log buffer contains %d entries", len(self._log_buffer))
            return self._log_buffer

        # TODO: Implement actual DB writes in Phase 1b when Railway DB is live
        entries = self._log_buffer.copy()
        self._log_buffer.clear()
        return entries

    def flush_to_jsonl(self, filepath: str):
        """Write buffered log entries to JSONL file (for pre-DB development)."""
        with open(filepath, "a") as f:
            for entry in self._log_buffer:
                f.write(json.dumps(entry, default=str) + "\n")
        count = len(self._log_buffer)
        self._log_buffer.clear()
        logger.info(f"Flushed {count} audit entries to {filepath}")
        return count
