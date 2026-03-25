# AUGUR

### Civilizational Stress Index

**13 indicators. 4 pillars. 50 countries. 36,000+ data points.**

Augur is a data-driven civilizational stress index that tracks the structural conditions historians and political scientists have documented as precursors to institutional decline — across every empire that has ever fallen.

Every number is publicly sourced. Every transformation is logged. Every data point is cryptographically fingerprinted. Politically symmetrical. No timing claims. Fully open source.

**[Live Site](https://augur-index.vercel.app)** · **[API](https://augur.up.railway.app/api/health)** · **[Methodology](METHODOLOGY.md)**

---

## Composite Stress Index: 84/100

| Pillar | Score | Key Indicator |
|--------|-------|---------------|
| Social Cohesion | 86 | 8% confidence in Congress; 0% partisan overlap |
| Economic Structure | 89 | 122% debt-to-GDP; top 1% holds 30.8% of wealth |
| Systemic Capacity | 68 | 32% news trust, down from 76% in 1972 |
| External Environment | 88 | US share of global GDP (PPP): ~50% → 15% |

## The 13 Indicators

**Social Cohesion**
- Political Polarization — DW-NOMINATE party overlap: 0%
- Public Trust — Congress confidence: 8%
- Rule of Law — WJP ranking: 26th (below all G7 peers)
- Civil Unrest — 900+ armed political organizations

**Economic Structure**
- Wealth Inequality — Top 1% holds 30.8% of national wealth
- Middle Class Decline — Median household income stagnant in real terms
- Debt to GDP — 122%, highest peacetime ratio in US history
- Currency Debasement — Dollar reserve share: 71% → 58%

**Systemic Capacity**
- Elite Overproduction — 51% of jobs added degree requirements without skill increases
- Infrastructure Decay — 43,586 structurally deficient bridges
- Media Fragmentation — News trust: 76% (1972) → 32% (2023)

**External Environment**
- Geopolitical Standing — US GDP share (PPP): ~50% (1945) → 15% (2024)
- Resource Stress — 6B gallons of treated water lost daily to infrastructure failure

## Data Sources

| Source | Data | Access |
|--------|------|--------|
| Federal Reserve (FRED) | Wealth, debt, CPI, employment, Treasury yields | API (automated weekly) |
| UCLA VoteView | Congressional voting ideology | Direct download |
| World Bank | GDP, military, Gini, health, education for 50 countries | API (automated weekly) |
| Gallup | Institutional trust, media trust | Published reports |
| World Justice Project | Rule of law index | Published reports |
| Bridging Divides Initiative | Armed groups, political violence | Published reports |
| EIA | Electricity/infrastructure | API |
| USGS / Bureau of Reclamation | Groundwater, reservoir levels | Published data |

## Architecture
## API

Free, public, no authentication required.
```bash
## API

Free, public, no authentication required.
```bash
# Health check
curl https://augur.up.railway.app/api/health

# Get all indicators
curl https://augur.up.railway.app/api/indicators

# Get specific indicator data
curl https://augur.up.railway.app/api/indicators/debt_to_gdp?country_code=USA&start_year=2020

# Cross-country comparison
curl https://augur.up.railway.app/api/indicators/geopolitical_standing?country_code=CHN
```

## Pages

- **/** — Cinematic landing page with empire timeline
- **/story** — Guided 5-minute narrative walkthrough
- **/dashboard** — Composite stress score + 13 indicator cards
- **/indicator/:id** — Deep dive with interactive charts, methodology, CSV export
- **/empires** — Rome, Ottoman, British decline patterns vs modern US
- **/rankings** — 50 countries ranked across 9 metrics
- **/compare** — Head-to-head country comparison with overlay charts
- **/api-docs** — Interactive API documentation

## Principles

1. **All data is free and publicly sourced.** Zero paywalled data.
2. **Political symmetry is absolute.** Identical treatment regardless of partisan implications.
3. **No timing claims.** Augur measures stress, not destiny.
4. **Fully open source.** This repository, the API, and the methodology.
5. **Cryptographic integrity.** SHA-256 on every data point.
6. **No user accounts.** The product is the data, not the user.

## Local Development
```bash
# Backend
cd augur
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your FRED_API_KEY and DATABASE_URL
python -m uvicorn backend.app.api.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

## Citation
## License

MIT

---

*Augur measures structural stress, not destiny. The data is either accurate or it isn't. Every number links to its source. If anything here were wrong, anyone with a laptop could prove it.*
