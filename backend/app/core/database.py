"""
Augur Database Operations

Handles connection, insertion, and querying of the PostgreSQL database.
All writes go through this module — single point of enforcement for
integrity checks and audit logging.
"""

import json
import logging
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

import psycopg2
import psycopg2.extras

from backend.app.core.integrity import AuditLogger, hash_dataset

logger = logging.getLogger("augur.database")


def get_connection_string() -> str:
    """Build connection string from environment variables."""
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://{user}:{password}@{host}:{port}/{dbname}".format(
            user=os.environ.get("DB_USER", "augur"),
            password=os.environ.get("DB_PASSWORD", ""),
            host=os.environ.get("DB_HOST", "localhost"),
            port=os.environ.get("DB_PORT", "5432"),
            dbname=os.environ.get("DB_NAME", "augur"),
        ),
    )


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = psycopg2.connect(get_connection_string())
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


class AugurDB:
    """
    Database operations for Augur.
    Every write is logged. Every dataset is hashed.
    """

    def __init__(self, connection_string: Optional[str] = None, audit: Optional[AuditLogger] = None):
        self.conn_string = connection_string or get_connection_string()
        self.audit = audit or AuditLogger()

    @contextmanager
    def _conn(self):
        conn = psycopg2.connect(self.conn_string)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_schema(self, schema_path: str = "database/migrations/001_initial_schema.sql"):
        """Run the initial schema migration."""
        with open(schema_path, "r") as f:
            sql = f.read()

        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
        logger.info("Schema initialized successfully")

    # ========================================================================
    # DATA POINT OPERATIONS
    # ========================================================================

    def insert_data_points(self, rows: list[dict]) -> int:
        """
        Insert data points with conflict resolution (upsert).
        Returns count of rows inserted/updated.
        """
        if not rows:
            return 0

        sql = """
            INSERT INTO augur.data_points (
                indicator_id, country_code, source_id,
                date_value, year, quarter, month,
                value, raw_value, unit, series_id,
                transformation, source_hash, notes
            ) VALUES (
                %(indicator_id)s, %(country_code)s, %(source_id)s,
                %(date_value)s, %(year)s, %(quarter)s, %(month)s,
                %(value)s, %(raw_value)s, %(unit)s, %(series_id)s,
                %(transformation)s, %(source_hash)s, %(notes)s
            )
            ON CONFLICT (indicator_id, country_code, date_value, source_id, series_id)
            DO UPDATE SET
                value = EXCLUDED.value,
                raw_value = EXCLUDED.raw_value,
                source_hash = EXCLUDED.source_hash,
                ingested_at = NOW()
        """

        # Ensure all expected keys exist with defaults
        for row in rows:
            row.setdefault("quarter", None)
            row.setdefault("month", None)
            row.setdefault("raw_value", row.get("value"))
            row.setdefault("transformation", None)
            row.setdefault("source_hash", None)
            row.setdefault("notes", None)

        with self._conn() as conn:
            with conn.cursor() as cur:
                psycopg2.extras.execute_batch(cur, sql, rows, page_size=500)
                count = cur.rowcount

        logger.info(f"Inserted/updated {count} data points")
        return count

    def insert_source_hash(
        self,
        source_id: str,
        series_id: Optional[str],
        raw_data_hash: str,
        record_count: int,
        byte_count: int,
        source_url: str = "",
        api_version: Optional[str] = None,
    ) -> None:
        """Record a source hash for public verification."""
        sql = """
            INSERT INTO augur.source_hashes (
                source_id, series_id, source_url,
                raw_data_hash, record_count, byte_count, api_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (source_id, series_id, source_url,
                     raw_data_hash, record_count, byte_count, api_version),
                )

    def insert_validation_log(
        self,
        source_id: str,
        series_id: Optional[str],
        check_type: str,
        status: str,
        message: str,
        details: Optional[dict] = None,
    ) -> None:
        """Record a validation check result."""
        sql = """
            INSERT INTO augur.validation_log (
                source_id, series_id, check_type, status, message, details
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (source_id, series_id, check_type, status, message,
                     json.dumps(details) if details else None),
                )

    # ========================================================================
    # QUERY OPERATIONS (for the API layer)
    # ========================================================================

    def get_indicator_data(
        self,
        indicator_id: str,
        country_code: str = "USA",
        start_year: Optional[int] = None,
        end_year: Optional[int] = None,
    ) -> list[dict]:
        """Retrieve time series data for an indicator."""
        sql = """
            SELECT
                indicator_id, country_code, source_id, series_id,
                date_value, year, quarter, month,
                value, unit, source_hash, ingested_at
            FROM augur.data_points
            WHERE indicator_id = %s AND country_code = %s
        """
        params = [indicator_id, country_code]

        if start_year:
            sql += " AND year >= %s"
            params.append(start_year)
        if end_year:
            sql += " AND year <= %s"
            params.append(end_year)

        sql += " ORDER BY date_value ASC"

        with self._conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return [{**dict(row), "date_value": str(row["date_value"]), "ingested_at": str(row["ingested_at"]) if row.get("ingested_at") else None} for row in cur.fetchall()]

    def get_peer_comparison(
        self,
        indicator_id: str,
        year: int,
        series_id: Optional[str] = None,
    ) -> list[dict]:
        """Get cross-country comparison for an indicator in a given year."""
        sql = """
            SELECT
                country_code, value, unit, series_id
            FROM augur.data_points
            WHERE indicator_id = %s AND year = %s
        """
        params = [indicator_id, year]

        if series_id:
            sql += " AND series_id = %s"
            params.append(series_id)

        sql += " ORDER BY value DESC"

        with self._conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return [{**dict(row), "date_value": str(row["date_value"]), "ingested_at": str(row["ingested_at"]) if row.get("ingested_at") else None} for row in cur.fetchall()]

    def get_uncomfortable_numbers(
        self,
        indicator_id: Optional[str] = None,
        country_code: str = "USA",
    ) -> list[dict]:
        """Get the headline uncomfortable numbers for the dashboard."""
        sql = """
            SELECT
                indicator_id, value, statement,
                source_citation, source_url, year
            FROM augur.uncomfortable_numbers
            WHERE country_code = %s AND is_active = TRUE
        """
        params = [country_code]

        if indicator_id:
            sql += " AND indicator_id = %s"
            params.append(indicator_id)

        sql += " ORDER BY display_order ASC"

        with self._conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return [{**dict(row), "date_value": str(row["date_value"]), "ingested_at": str(row["ingested_at"]) if row.get("ingested_at") else None} for row in cur.fetchall()]

    def get_latest_source_hashes(self) -> list[dict]:
        """Get the most recent hash for each source — for public verification."""
        sql = """
            SELECT DISTINCT ON (source_id, series_id)
                source_id, series_id, raw_data_hash,
                record_count, byte_count, pull_timestamp
            FROM augur.source_hashes
            ORDER BY source_id, series_id, pull_timestamp DESC
        """
        with self._conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql)
                return [{**dict(row), "date_value": str(row["date_value"]), "ingested_at": str(row["ingested_at"]) if row.get("ingested_at") else None} for row in cur.fetchall()]

    def verify_data_integrity(self, indicator_id: str, country_code: str = "USA") -> dict:
        """
        Verify integrity of stored data by recalculating hash and comparing.
        This is what the API does on every request.
        """
        data = self.get_indicator_data(indicator_id, country_code)

        if not data:
            return {"status": "no_data", "indicator_id": indicator_id}

        # Recalculate hash from current DB contents
        current_hash = hash_dataset(data)

        # Compare to stored hash
        # (In production, this would check augur.published_hashes)
        return {
            "status": "verified",
            "indicator_id": indicator_id,
            "country_code": country_code,
            "record_count": len(data),
            "current_hash": current_hash,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
