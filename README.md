# AUGUR — Civilizational Stress Index

A globally comparative, data-driven civilizational stress index that scores every country on 13 indicators across 4 pillars, grounded entirely in free, publicly available primary-source data.

## Non-Negotiables

- **All data is free and publicly sourced** — zero paywalled data, ever
- **Fully open source** — public methodology, public data hashes, public code
- **No user accounts** — eliminates PII attack surface entirely
- **No timing claims** — structural stress measurement, not prediction
- **Political symmetry is absolute** — identical treatment regardless of partisan implications

## The Framework

**13 indicators across 4 pillars:**

| Pillar | Indicators |
|--------|-----------|
| Social Cohesion | Political Polarization · Public Trust in Institutions · Rule of Law Erosion · Civil Unrest Frequency |
| Economic Structure | Wealth Inequality · Decline of the Middle Class · Government Debt to GDP · Currency Debasement / Inflation |
| Systemic Capacity | Elite Overproduction · Infrastructure Decay · Media Fragmentation & Epistemic Divergence |
| External Environment | Geopolitical Standing & External Pressure · Resource & Environmental Stress |

## Stack

- **Frontend:** React + D3.js
- **Backend:** Python / FastAPI
- **Database:** PostgreSQL
- **Hosting:** Vercel (frontend) + Railway (backend + database)
- **Data Integrity:** SHA-256 hashing, DVC, public hash publication

## Data Sources

Every number traces directly to a publicly available primary source. See `/docs/methodology/` for full indicator specifications.

### Automated API Sources (Tier 1)
FRED, BLS, Census Bureau, EIA, USGS, FEC, World Bank, IMF, ACLED

### Annual Download Sources (Tier 2)
VoteView/DW-NOMINATE, World Justice Project, V-Dem, SIPRI, FHWA, Pew, Gallup, Reuters Institute

### Static Historical Data (Tier 3)
ANES, World Inequality Database, IMF COFER, Turchin/Seshat

## Build Sequence

- [x] Phase 1 — Data Foundation (FRED pipeline, static datasets, PostgreSQL schema, validation)
- [ ] Phase 2 — MVP Dashboard (React frontend, 13 indicator panels, D3 visualizations)
- [ ] Phase 3 — Deep Dive Pages (full indicator treatment, methodology docs, historical context)
- [ ] Phase 4 — Empire/Country Explorer (interactive historical comparison tool)
- [ ] Phase 5 — Living News Feed (real-time event tagging, editorial oversight)

## Security

Every number on Augur traces directly to a publicly available primary source. Every transformation is logged and publicly auditable. Every published data point is cryptographically fingerprinted and independently verifiable. No data has ever been silently altered. If any of this were untrue, anyone with a computer could prove it.

## License

MIT
