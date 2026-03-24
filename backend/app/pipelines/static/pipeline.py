"""
Augur Static Dataset Pipeline

Handles Tier 2 (annual download) and Tier 3 (static historical) data sources.
These are datasets downloaded periodically rather than pulled via live API.

Priority static datasets for Phase 1:
1. VoteView / DW-NOMINATE (Political Polarization)
2. World Inequality Database (Wealth Inequality, long-run)
3. World Justice Project Rule of Law Index (Rule of Law)
4. SIPRI Military Expenditure (Geopolitical Standing)
5. National Bridge Inventory / FHWA (Infrastructure Decay)
6. IMF COFER (Currency Debasement — reserve currency share)
"""

import csv
import io
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

from backend.app.core.integrity import AuditLogger, hash_raw_data
from backend.app.pipelines.validation.validator import DataValidator

logger = logging.getLogger("augur.pipeline.static")

# Where raw downloads are stored before processing
RAW_DATA_DIR = Path("data/raw")
PROCESSED_DATA_DIR = Path("data/processed")


class StaticDatasetPipeline:
    """
    Downloads, validates, and processes static datasets.

    Each dataset has a dedicated processor that understands its format
    and extracts the specific fields Augur needs.
    """

    def __init__(
        self,
        audit_logger: Optional[AuditLogger] = None,
        validation_rules: Optional[dict] = None,
    ):
        self.audit = audit_logger or AuditLogger()
        self.validator = DataValidator(validation_rules or {})
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Augur-Stress-Index/1.0"})

        # Ensure directories exist
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # ========================================================================
    # 1. DW-NOMINATE (VoteView) — Political Polarization
    # ========================================================================

    def fetch_dw_nominate(self) -> dict:
        """
        Download DW-NOMINATE Congressional voting scores from VoteView.

        Source: https://voteview.com/static/data/out/members/HSall_members.csv
        Contains: every member of Congress, 1st through current Congress,
                  with ideology scores on two dimensions.

        What Augur extracts:
        - Mean party ideology scores per Congress (dim1 = liberal-conservative)
        - Overlap between parties (distance between closest members)
        - Separate House and Senate series
        """
        url = "https://voteview.com/static/data/out/members/HSall_members.csv"
        logger.info("Fetching DW-NOMINATE data from VoteView...")

        response = self.session.get(url, timeout=120)
        response.raise_for_status()

        raw_hash = hash_raw_data(response.content)
        raw_path = RAW_DATA_DIR / "dw_nominate_raw.csv"
        raw_path.write_bytes(response.content)

        self.audit.log_source_pull(
            source_id="voteview",
            series_id="dw_nominate",
            source_url=url,
            raw_data_hash=raw_hash,
            record_count=-1,  # Will count after parsing
            byte_count=len(response.content),
        )

        # Parse and process
        records = self._process_dw_nominate(response.text)

        logger.info(
            f"DW-NOMINATE: {len(records)} processed records, hash={raw_hash[:16]}..."
        )

        return {
            "source_id": "voteview",
            "dataset": "dw_nominate",
            "records": records,
            "raw_hash": raw_hash,
            "record_count": len(records),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    def _process_dw_nominate(self, csv_text: str) -> list[dict]:
        """
        Process raw DW-NOMINATE CSV into Augur format.

        Extracts per-Congress, per-chamber, per-party mean ideology scores.
        This is the core metric for legislative polarization.
        """
        reader = csv.DictReader(io.StringIO(csv_text))

        # Aggregate by Congress number, chamber, party
        aggregates = {}  # (congress, chamber, party_code) -> list of nominate_dim1 scores

        for row in reader:
            try:
                congress = int(row.get("congress", 0))
                chamber = row.get("chamber", "").strip()
                party_code = int(row.get("party_code", 0))
                nominate_dim1 = row.get("nominate_dim1", "").strip()

                if not nominate_dim1 or nominate_dim1 == "NA":
                    continue

                score = float(nominate_dim1)
                key = (congress, chamber, party_code)

                if key not in aggregates:
                    aggregates[key] = []
                aggregates[key].append(score)

            except (ValueError, TypeError):
                continue

        # Calculate mean scores per group
        records = []
        for (congress, chamber, party_code), scores in aggregates.items():
            if not scores:
                continue

            mean_score = sum(scores) / len(scores)

            # Map party codes: 100 = Democrat, 200 = Republican
            if party_code == 100:
                party = "Democrat"
            elif party_code == 200:
                party = "Republican"
            else:
                party = f"Party_{party_code}"

            # Approximate year from Congress number
            # 1st Congress = 1789, each Congress is ~2 years
            year = 1789 + (congress - 1) * 2

            records.append({
                "indicator_id": "political_polarization",
                "country_code": "USA",
                "source_id": "voteview",
                "series_id": f"dw_nominate_{chamber}_{party_code}",
                "year": year,
                "congress": congress,
                "chamber": chamber,
                "party": party,
                "party_code": party_code,
                "value": round(mean_score, 4),
                "member_count": len(scores),
                "unit": "nominate_dim1_mean",
            })

        return sorted(records, key=lambda r: (r["year"], r["chamber"], r["party_code"]))

    # ========================================================================
    # 2. World Inequality Database — Long-run Wealth Inequality
    # ========================================================================

    def process_wid_data(self, filepath: str) -> list[dict]:
        """
        Process World Inequality Database CSV export.

        WID provides long-run (1913-present) wealth and income share data
        for top percentiles. This is the U-shaped curve data.

        Note: WID requires manual download or specific API queries.
        This processor handles the downloaded CSV format.
        """
        logger.info(f"Processing WID data from {filepath}")

        with open(filepath, "r") as f:
            raw_content = f.read()

        raw_hash = hash_raw_data(raw_content)
        self.audit.log_source_pull(
            source_id="wid",
            series_id="wealth_shares",
            source_url=f"file://{filepath}",
            raw_data_hash=raw_hash,
            record_count=-1,
            byte_count=len(raw_content),
        )

        reader = csv.DictReader(io.StringIO(raw_content))
        records = []

        for row in reader:
            try:
                country = row.get("country", "").strip()
                year = int(row.get("year", 0))
                percentile = row.get("percentile", "").strip()
                value = float(row.get("value", 0))

                # WID uses ISO 2-letter codes; we'll map to 3-letter
                records.append({
                    "indicator_id": "wealth_inequality",
                    "country_code": country,  # Needs ISO mapping
                    "source_id": "wid",
                    "series_id": f"wid_{percentile}",
                    "year": year,
                    "date_value": f"{year}-12-31",
                    "value": round(value, 6),
                    "unit": "share",
                    "percentile": percentile,
                })
            except (ValueError, TypeError):
                continue

        logger.info(f"WID: {len(records)} processed records")
        return records

    # ========================================================================
    # 3. World Justice Project — Rule of Law Index
    # ========================================================================

    def process_wjp_data(self, filepath: str) -> list[dict]:
        """
        Process World Justice Project Rule of Law Index.

        WJP publishes annual scores for 142 countries across 8 dimensions.
        Augur uses the overall score and sub-factor scores.

        Note: WJP data requires download from their site.
        """
        logger.info(f"Processing WJP data from {filepath}")

        with open(filepath, "r") as f:
            raw_content = f.read()

        raw_hash = hash_raw_data(raw_content)
        self.audit.log_source_pull(
            source_id="wjp",
            series_id="rule_of_law_index",
            source_url=f"file://{filepath}",
            raw_data_hash=raw_hash,
            record_count=-1,
            byte_count=len(raw_content),
        )

        reader = csv.DictReader(io.StringIO(raw_content))
        records = []

        for row in reader:
            try:
                country = row.get("Country", "").strip()
                country_code = row.get("Country Code", "").strip()
                year = int(row.get("Year", 0))
                overall_score = float(row.get("Overall Score", 0))

                records.append({
                    "indicator_id": "rule_of_law",
                    "country_code": country_code,
                    "country_name": country,
                    "source_id": "wjp",
                    "series_id": "wjp_overall",
                    "year": year,
                    "date_value": f"{year}-10-01",  # WJP publishes in October
                    "value": round(overall_score, 4),
                    "unit": "index_score",
                })

                # Extract sub-factors if present
                for factor_num in range(1, 9):
                    factor_key = f"Factor {factor_num}"
                    if factor_key in row and row[factor_key]:
                        try:
                            factor_val = float(row[factor_key])
                            records.append({
                                "indicator_id": "rule_of_law",
                                "country_code": country_code,
                                "source_id": "wjp",
                                "series_id": f"wjp_factor_{factor_num}",
                                "year": year,
                                "date_value": f"{year}-10-01",
                                "value": round(factor_val, 4),
                                "unit": "index_score",
                            })
                        except (ValueError, TypeError):
                            continue

            except (ValueError, TypeError):
                continue

        logger.info(f"WJP: {len(records)} processed records")
        return records

    # ========================================================================
    # 4. SIPRI — Military Expenditure
    # ========================================================================

    def process_sipri_data(self, filepath: str) -> list[dict]:
        """
        Process SIPRI Military Expenditure Database.

        SIPRI provides military spending data for 170+ countries.
        Used for Indicator 12: Geopolitical Standing.

        Augur tracks: absolute spending, spending as % GDP,
        and spending relative to global total.
        """
        logger.info(f"Processing SIPRI data from {filepath}")

        with open(filepath, "r") as f:
            raw_content = f.read()

        raw_hash = hash_raw_data(raw_content)
        self.audit.log_source_pull(
            source_id="sipri",
            series_id="military_expenditure",
            source_url=f"file://{filepath}",
            raw_data_hash=raw_hash,
            record_count=-1,
            byte_count=len(raw_content),
        )

        # SIPRI format: countries as rows, years as columns
        reader = csv.DictReader(io.StringIO(raw_content))
        records = []

        for row in reader:
            country = row.get("Country", "").strip()
            country_code = row.get("Country Code", "").strip()

            for key, value in row.items():
                if key in ("Country", "Country Code", "Notes", ""):
                    continue
                try:
                    year = int(key.strip())
                    if value and value.strip() not in ("", "...", "xxx"):
                        spending = float(value.replace(",", "").strip())
                        records.append({
                            "indicator_id": "geopolitical_standing",
                            "country_code": country_code,
                            "country_name": country,
                            "source_id": "sipri",
                            "series_id": "sipri_milex",
                            "year": year,
                            "date_value": f"{year}-12-31",
                            "value": spending,
                            "unit": "millions_usd_constant",
                        })
                except (ValueError, TypeError):
                    continue

        logger.info(f"SIPRI: {len(records)} processed records")
        return records

    # ========================================================================
    # 5. FHWA National Bridge Inventory — Infrastructure Decay
    # ========================================================================

    def process_bridge_data(self, filepath: str) -> list[dict]:
        """
        Process FHWA National Bridge Inventory.

        Extracts: total bridges, structurally deficient count,
        average bridge age, condition ratings.
        """
        logger.info(f"Processing FHWA bridge data from {filepath}")

        with open(filepath, "r") as f:
            raw_content = f.read()

        raw_hash = hash_raw_data(raw_content)
        self.audit.log_source_pull(
            source_id="fhwa",
            series_id="bridge_inventory",
            source_url=f"file://{filepath}",
            raw_data_hash=raw_hash,
            record_count=-1,
            byte_count=len(raw_content),
        )

        # NBI format varies by year — this handles the common CSV format
        reader = csv.DictReader(io.StringIO(raw_content))
        records = []

        total_bridges = 0
        structurally_deficient = 0
        total_age = 0

        for row in reader:
            total_bridges += 1

            # FHWA uses various condition rating fields
            # Structurally deficient: deck, superstructure, or substructure rating <= 4
            try:
                deck = int(row.get("DECK_COND_058", 9))
                super_cond = int(row.get("SUPERSTRUCTURE_COND_059", 9))
                sub_cond = int(row.get("SUBSTRUCTURE_COND_060", 9))
                year_built = int(row.get("YEAR_BUILT_027", 0))

                if any(r <= 4 for r in [deck, super_cond, sub_cond] if r < 9):
                    structurally_deficient += 1

                if year_built > 1800:
                    age = datetime.now().year - year_built
                    total_age += age

            except (ValueError, TypeError):
                continue

        if total_bridges > 0:
            current_year = datetime.now().year
            records.append({
                "indicator_id": "infrastructure_decay",
                "country_code": "USA",
                "source_id": "fhwa",
                "series_id": "bridges_total",
                "year": current_year,
                "date_value": f"{current_year}-01-01",
                "value": total_bridges,
                "unit": "count",
            })
            records.append({
                "indicator_id": "infrastructure_decay",
                "country_code": "USA",
                "source_id": "fhwa",
                "series_id": "bridges_structurally_deficient",
                "year": current_year,
                "date_value": f"{current_year}-01-01",
                "value": structurally_deficient,
                "unit": "count",
            })
            records.append({
                "indicator_id": "infrastructure_decay",
                "country_code": "USA",
                "source_id": "fhwa",
                "series_id": "bridges_deficient_pct",
                "year": current_year,
                "date_value": f"{current_year}-01-01",
                "value": round(structurally_deficient / total_bridges * 100, 2),
                "unit": "percent",
            })
            if total_bridges > 0:
                records.append({
                    "indicator_id": "infrastructure_decay",
                    "country_code": "USA",
                    "source_id": "fhwa",
                    "series_id": "bridges_avg_age",
                    "year": current_year,
                    "date_value": f"{current_year}-01-01",
                    "value": round(total_age / total_bridges, 1),
                    "unit": "years",
                })

        logger.info(
            f"FHWA Bridges: {total_bridges} total, "
            f"{structurally_deficient} structurally deficient "
            f"({round(structurally_deficient/max(total_bridges,1)*100, 1)}%)"
        )
        return records

    # ========================================================================
    # 6. IMF COFER — Reserve Currency Shares
    # ========================================================================

    def process_cofer_data(self, filepath: str) -> list[dict]:
        """
        Process IMF COFER (Currency Composition of Official Foreign Exchange Reserves).

        Tracks USD share of global reserves — the "exorbitant privilege" trajectory.
        """
        logger.info(f"Processing IMF COFER data from {filepath}")

        with open(filepath, "r") as f:
            raw_content = f.read()

        raw_hash = hash_raw_data(raw_content)
        self.audit.log_source_pull(
            source_id="imf",
            series_id="cofer",
            source_url=f"file://{filepath}",
            raw_data_hash=raw_hash,
            record_count=-1,
            byte_count=len(raw_content),
        )

        reader = csv.DictReader(io.StringIO(raw_content))
        records = []

        for row in reader:
            try:
                year = int(row.get("Year", 0))
                quarter = int(row.get("Quarter", 0)) if row.get("Quarter") else None

                # USD share of allocated reserves
                usd_share = row.get("USD Share", "").strip()
                if usd_share and usd_share not in ("", "..."):
                    records.append({
                        "indicator_id": "currency_debasement",
                        "country_code": "USA",  # Global metric, indexed to USD
                        "source_id": "imf",
                        "series_id": "cofer_usd_share",
                        "year": year,
                        "quarter": quarter,
                        "date_value": f"{year}-{(quarter or 1) * 3:02d}-01",
                        "value": float(usd_share),
                        "unit": "percent",
                    })

                # EUR share for comparison
                eur_share = row.get("EUR Share", "").strip()
                if eur_share and eur_share not in ("", "..."):
                    records.append({
                        "indicator_id": "currency_debasement",
                        "country_code": "USA",
                        "source_id": "imf",
                        "series_id": "cofer_eur_share",
                        "year": year,
                        "quarter": quarter,
                        "date_value": f"{year}-{(quarter or 1) * 3:02d}-01",
                        "value": float(eur_share),
                        "unit": "percent",
                    })

                # CNY share — tracks China's reserve currency trajectory
                cny_share = row.get("CNY Share", "").strip()
                if cny_share and cny_share not in ("", "..."):
                    records.append({
                        "indicator_id": "currency_debasement",
                        "country_code": "USA",
                        "source_id": "imf",
                        "series_id": "cofer_cny_share",
                        "year": year,
                        "quarter": quarter,
                        "date_value": f"{year}-{(quarter or 1) * 3:02d}-01",
                        "value": float(cny_share),
                        "unit": "percent",
                    })

            except (ValueError, TypeError) as e:
                logger.debug(f"Skipping COFER row: {e}")
                continue

        logger.info(f"IMF COFER: {len(records)} processed records")
        return records
