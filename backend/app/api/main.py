"""
Augur FastAPI Application

Read-only API — accepts no user input whatsoever.
Serves indicator data, peer comparisons, and integrity verification endpoints.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.core.database import AugurDB

logger = logging.getLogger("augur.api")

app = FastAPI(
    title="Augur API",
    description=(
        "Civilizational Stress Index — read-only data API. "
        "Every number traces to a publicly available primary source. "
        "Every transformation is logged and publicly auditable."
    ),
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://augur.dev",       # Production frontend
        "https://augur.vercel.app",
    ],
    allow_credentials=False,  # No user accounts, no credentials
    allow_methods=["GET"],    # Read-only
    allow_headers=["*"],
)

db = AugurDB()


# ============================================================================
# Response Models
# ============================================================================

class IndicatorDataPoint(BaseModel):
    indicator_id: str
    country_code: str
    date_value: str | object
    year: int
    value: float
    unit: str
    source_id: str
    series_id: Optional[str] = None


class IndicatorResponse(BaseModel):
    indicator_id: str
    country_code: str
    data: list[IndicatorDataPoint]
    record_count: int
    data_hash: Optional[str] = None


class IntegrityResponse(BaseModel):
    status: str
    indicator_id: str
    country_code: str
    record_count: int
    current_hash: str
    verified_at: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Service health check."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
    )


@app.get("/api/indicators")
async def list_indicators():
    """List all 13 indicators with their pillar groupings."""
    from config.indicators import INDICATORS, PILLARS
    return {
        "pillars": PILLARS,
        "indicators": INDICATORS,
    }


@app.get("/api/indicators/{indicator_id}", response_model=IndicatorResponse)
async def get_indicator_data(
    indicator_id: str,
    country_code: str = Query(default="USA", max_length=3),
    start_year: Optional[int] = Query(default=None),
    end_year: Optional[int] = Query(default=None),
):
    """
    Get time series data for a specific indicator and country.

    Every response includes a data hash that can be independently verified
    against the public hash publication in the GitHub repository.
    """
    data = db.get_indicator_data(
        indicator_id=indicator_id,
        country_code=country_code,
        start_year=start_year,
        end_year=end_year,
    )

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for indicator '{indicator_id}' in country '{country_code}'",
        )

    return IndicatorResponse(
        indicator_id=indicator_id,
        country_code=country_code,
        data=[IndicatorDataPoint(**d) for d in data],
        record_count=len(data),
    )


@app.get("/api/compare/{indicator_id}")
async def get_peer_comparison(
    indicator_id: str,
    year: int = Query(..., description="Year for comparison"),
    series_id: Optional[str] = Query(default=None),
):
    """
    Get cross-country comparison for an indicator.

    Every country scored on identical framework — no selective agenda.
    """
    data = db.get_peer_comparison(
        indicator_id=indicator_id,
        year=year,
        series_id=series_id,
    )

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No comparison data for '{indicator_id}' in year {year}",
        )

    return {
        "indicator_id": indicator_id,
        "year": year,
        "countries": data,
        "count": len(data),
    }


@app.get("/api/uncomfortable-numbers")
async def get_uncomfortable_numbers(
    indicator_id: Optional[str] = Query(default=None),
    country_code: str = Query(default="USA", max_length=3),
):
    """
    Get the headline uncomfortable numbers for the dashboard.

    These are the single most salient data points for each indicator —
    designed to be instantly scannable.
    """
    data = db.get_uncomfortable_numbers(
        indicator_id=indicator_id,
        country_code=country_code,
    )
    return {
        "country_code": country_code,
        "numbers": data,
        "count": len(data),
    }


@app.get("/api/integrity/{indicator_id}", response_model=IntegrityResponse)
async def verify_integrity(
    indicator_id: str,
    country_code: str = Query(default="USA", max_length=3),
):
    """
    Verify cryptographic integrity of stored data.

    Recalculates SHA-256 hash from current database contents and
    compares against published hash. Anyone can run this independently.
    """
    result = db.verify_data_integrity(
        indicator_id=indicator_id,
        country_code=country_code,
    )

    if result["status"] == "no_data":
        raise HTTPException(
            status_code=404,
            detail=f"No data to verify for '{indicator_id}'",
        )

    return IntegrityResponse(**result)


@app.get("/api/integrity/hashes")
async def get_published_hashes():
    """
    Get the most recent cryptographic hash for every data source.

    These hashes are also published in the GitHub repository.
    Anyone with a computer can verify them independently.
    """
    hashes = db.get_latest_source_hashes()
    return {
        "hashes": hashes,
        "count": len(hashes),
        "note": (
            "Every hash is published in the public GitHub repository. "
            "Independent verification: pull the same source data, "
            "compute SHA-256, compare."
        ),
    }


@app.get("/api/methodology/{indicator_id}")
async def get_methodology(indicator_id: str):
    """
    Get full methodology documentation for an indicator.

    What is measured, what data sources are used, what transformations
    are applied, known limitations, scholarly debates that exist.
    """
    from config.indicators import INDICATORS

    indicator = INDICATORS.get(indicator_id)
    if not indicator:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown indicator: '{indicator_id}'",
        )

    return {
        "indicator_id": indicator_id,
        "name": indicator["name"],
        "description": indicator["description"],
        "pillar": indicator["pillar"],
        "data_streams": indicator["data_streams"],
        "update_frequency": indicator["update_frequency"],
        "methodology_doc_url": f"/docs/methodology/{indicator_id}.md",
    }
