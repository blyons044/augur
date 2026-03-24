#!/usr/bin/env python3
"""
Augur Pipeline Runner

Orchestrates the full data ingestion pipeline:
1. FRED API pull (automated economic data)
2. Static dataset processing (annual downloads)
3. Validation across all sources
4. Database insertion with integrity checks
5. Hash publication for public verification

Usage:
    # Full pipeline run
    python -m backend.scripts.run_pipeline --all

    # FRED only
    python -m backend.scripts.run_pipeline --fred

    # Specific FRED series
    python -m backend.scripts.run_pipeline --fred --series GFDEGDQ188S CPIAUCSL

    # Static datasets only
    python -m backend.scripts.run_pipeline --static

    # Dry run (validate without database writes)
    python -m backend.scripts.run_pipeline --all --dry-run
"""

from dotenv import load_dotenv
load_dotenv()

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from config.indicators import FRED_SERIES, VALIDATION_RULES
from backend.app.core.integrity import AuditLogger
from backend.app.pipelines.fred.pipeline import FREDPipeline, prepare_for_db
from backend.app.pipelines.static.pipeline import StaticDatasetPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("augur.runner")

# Directories
AUDIT_LOG_DIR = Path("data/audit")
OUTPUT_DIR = Path("data/processed")


def run_fred_pipeline(
    series_ids: list[str] | None = None,
    dry_run: bool = False,
    audit: AuditLogger | None = None,
) -> dict:
    """Run the FRED data pipeline."""
    logger.info("=" * 60)
    logger.info("FRED PIPELINE — Starting")
    logger.info("=" * 60)

    audit = audit or AuditLogger()

    pipeline = FREDPipeline(
        series_config=FRED_SERIES,
        validation_rules=VALIDATION_RULES,
        audit_logger=audit,
    )

    # Fetch all configured series (or specified subset)
    result = pipeline.fetch_all_series(series_ids=series_ids)

    # Prepare DB-ready rows for all passing series
    all_db_rows = []
    for series_id, series_result in result["results"].items():
        if "error" in series_result:
            continue
        if not series_result["validation"].passed:
            logger.warning(f"Skipping {series_id} — validation failed")
            continue

        config = FRED_SERIES.get(series_id, {})
        db_rows = prepare_for_db(
            series_id=series_id,
            series_config=config,
            observations=series_result["observations"],
            raw_hash=series_result["raw_hash"],
        )
        all_db_rows.extend(db_rows)

    logger.info(f"FRED pipeline produced {len(all_db_rows)} DB-ready rows")

    if not dry_run and all_db_rows:
        try:
            from backend.app.core.database import AugurDB
            db = AugurDB(audit=audit)
            inserted = db.insert_data_points(all_db_rows)
            logger.info(f"Inserted {inserted} rows into database")
        except Exception as e:
            logger.error(f"Database insertion failed: {e}")
            logger.info("Saving to JSON fallback...")
            _save_json_fallback(all_db_rows, "fred")
    elif dry_run:
        logger.info("[DRY RUN] Would insert %d rows", len(all_db_rows))
        _save_json_fallback(all_db_rows, "fred_dryrun")

    return {
        "pipeline": "fred",
        "summary": result["summary"],
        "dataset_hash": result.get("dataset_hash"),
        "db_rows_prepared": len(all_db_rows),
    }


def run_static_pipeline(
    dry_run: bool = False,
    audit: AuditLogger | None = None,
) -> dict:
    """Run the static dataset pipeline."""
    logger.info("=" * 60)
    logger.info("STATIC DATASETS PIPELINE — Starting")
    logger.info("=" * 60)

    audit = audit or AuditLogger()
    pipeline = StaticDatasetPipeline(audit_logger=audit)

    results = {}
    all_db_rows = []

    # 1. DW-NOMINATE (always fetch — it's a direct URL download)
    try:
        logger.info("--- DW-NOMINATE (Political Polarization) ---")
        dw_result = pipeline.fetch_dw_nominate()
        results["dw_nominate"] = {
            "status": "success",
            "records": len(dw_result["records"]),
            "hash": dw_result["raw_hash"],
        }
        all_db_rows.extend(dw_result["records"])
    except Exception as e:
        logger.error(f"DW-NOMINATE failed: {e}")
        results["dw_nominate"] = {"status": "error", "error": str(e)}

    # 2-6. File-based datasets (process if files exist)
    file_processors = {
        "wid": {
            "path": "data/raw/wid_wealth_shares.csv",
            "processor": pipeline.process_wid_data,
            "name": "World Inequality Database",
        },
        "wjp": {
            "path": "data/raw/wjp_rule_of_law.csv",
            "processor": pipeline.process_wjp_data,
            "name": "World Justice Project",
        },
        "sipri": {
            "path": "data/raw/sipri_milex.csv",
            "processor": pipeline.process_sipri_data,
            "name": "SIPRI Military Expenditure",
        },
        "fhwa": {
            "path": "data/raw/fhwa_bridges.csv",
            "processor": pipeline.process_bridge_data,
            "name": "FHWA Bridge Inventory",
        },
        "cofer": {
            "path": "data/raw/imf_cofer.csv",
            "processor": pipeline.process_cofer_data,
            "name": "IMF COFER",
        },
    }

    for source_key, config in file_processors.items():
        filepath = Path(config["path"])
        if filepath.exists():
            try:
                logger.info(f"--- {config['name']} ---")
                records = config["processor"](str(filepath))
                results[source_key] = {
                    "status": "success",
                    "records": len(records),
                }
                all_db_rows.extend(records)
            except Exception as e:
                logger.error(f"{config['name']} failed: {e}")
                results[source_key] = {"status": "error", "error": str(e)}
        else:
            logger.info(
                f"--- {config['name']} --- SKIPPED (file not found: {filepath})"
            )
            results[source_key] = {"status": "skipped", "reason": "file not found"}

    logger.info(f"Static pipeline produced {len(all_db_rows)} total records")

    if not dry_run and all_db_rows:
        try:
            from backend.app.core.database import AugurDB
            db = AugurDB(audit=audit)
            inserted = db.insert_data_points(all_db_rows)
            logger.info(f"Inserted {inserted} rows into database")
        except Exception as e:
            logger.error(f"Database insertion failed: {e}")
            _save_json_fallback(all_db_rows, "static")
    elif dry_run:
        logger.info("[DRY RUN] Would insert %d rows", len(all_db_rows))
        _save_json_fallback(all_db_rows, "static_dryrun")

    return {
        "pipeline": "static",
        "sources": results,
        "total_records": len(all_db_rows),
    }


def _save_json_fallback(rows: list[dict], prefix: str):
    """Save processed data to JSON when DB is unavailable."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = OUTPUT_DIR / f"{prefix}_{timestamp}.json"
    with open(filepath, "w") as f:
        json.dump(rows, f, indent=2, default=str)
    logger.info(f"Saved {len(rows)} rows to {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description="Augur Data Pipeline Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m backend.scripts.run_pipeline --all
  python -m backend.scripts.run_pipeline --fred --series GFDEGDQ188S CPIAUCSL
  python -m backend.scripts.run_pipeline --static --dry-run
        """,
    )
    parser.add_argument("--all", action="store_true", help="Run all pipelines")
    parser.add_argument("--fred", action="store_true", help="Run FRED pipeline")
    parser.add_argument("--static", action="store_true", help="Run static dataset pipeline")
    parser.add_argument(
        "--series", nargs="+", help="Specific FRED series IDs to fetch"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and process without writing to database",
    )

    args = parser.parse_args()

    if not any([args.all, args.fred, args.static]):
        parser.print_help()
        sys.exit(1)

    # Set up audit logging
    AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)
    audit = AuditLogger()
    run_results = {}

    start_time = datetime.now(timezone.utc)
    logger.info("=" * 60)
    logger.info(f"AUGUR PIPELINE RUN — {start_time.isoformat()}")
    logger.info("=" * 60)

    # Run requested pipelines
    if args.all or args.fred:
        run_results["fred"] = run_fred_pipeline(
            series_ids=args.series,
            dry_run=args.dry_run,
            audit=audit,
        )

    if args.all or args.static:
        run_results["static"] = run_static_pipeline(
            dry_run=args.dry_run,
            audit=audit,
        )

    # Flush audit log
    timestamp = start_time.strftime("%Y%m%d_%H%M%S")
    audit_path = AUDIT_LOG_DIR / f"audit_{timestamp}.jsonl"
    audit.flush_to_jsonl(str(audit_path))

    # Summary
    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()

    logger.info("=" * 60)
    logger.info(f"PIPELINE RUN COMPLETE — {duration:.1f}s")
    for name, result in run_results.items():
        logger.info(f"  {name}: {json.dumps(result.get('summary', result), default=str)}")
    logger.info(f"Audit log: {audit_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
