# AUGUR

### Civilizational Stress Index

**13 indicators. 4 pillars. 50 countries. 350,000+ data points. 10 primary sources.**

Augur is a data-driven civilizational stress index that tracks the structural conditions historians and political scientists have documented as precursors to institutional decline across every empire that has ever fallen.

Every number is publicly sourced. Every transformation is logged. Every data point is cryptographically fingerprinted. Politically symmetrical. No timing claims. Fully open source.

**[Live Site](https://augur-index.vercel.app)** | **[API](https://augur.up.railway.app/api/health)** | **[Methodology](METHODOLOGY.md)**

---

## Composite Stress Index: 84/100

| Pillar | Score | Key Indicators |
|--------|-------|---------------|
| Social Cohesion | 86 | 8% confidence in Congress; zero partisan overlap in Congress |
| Economic Structure | 89 | 122% debt-to-GDP; top 1% holds 30.8% of wealth |
| Systemic Capacity | 68 | 32% news trust (down from 76% in 1972) |
| External Environment | 88 | US share of global GDP (PPP): ~50% in 1945, ~15% today |

## The 13 Indicators

**Social Cohesion**
- Political Polarization (VoteView DW-NOMINATE)
- Public Trust in Institutions (Gallup)
- Rule of Law (World Justice Project, Freedom House, Transparency International)
- Civil Unrest Frequency (Bridging Divides Initiative)

**Economic Structure**
- Wealth Inequality (Federal Reserve DFA, World Bank Gini)
- Middle Class Decline (FRED median income, housing, savings)
- Debt to GDP (FRED, IMF)
- Currency Debasement (FRED CPI, PCE, M2, commodity prices)

**Systemic Capacity**
- Elite Overproduction (FRED employment, JOLTS, demographics)
- Infrastructure Decay (EIA, Chicago Fed indices)
- Media Fragmentation (Gallup news trust)

**External Environment**
- Geopolitical Standing (World Bank GDP, military, trade)
- Resource Stress (USGS, Bureau of Reclamation)

## Data Sources

| Source | Data | Records |
|--------|------|---------|
| Federal Reserve (FRED) | Wealth, debt, CPI, employment, housing, markets, credit | ~200,000+ |
| World Bank | GDP, military, Gini, health, education, governance for 50 countries | ~80,000+ |
| UCLA VoteView | Congressional voting ideology (DW-NOMINATE) | ~800 |
| Gallup | Institutional trust, media trust | ~200 |
| Freedom House | Freedom in the World scores for 50 countries | ~500 |
| Transparency International | Corruption Perceptions Index | ~200 |
| World Justice Project | Rule of law index | ~20 |
| EIA | Electricity and infrastructure data | ~25 |
| USGS / Bureau of Reclamation | Groundwater, reservoir levels | ~25 |
| IMF | World Economic Outlook projections | ~200 |

## Architecture
## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Editorial introduction with academic citations |
| The Story | `/story` | Guided 8-chapter narrative walkthrough with live charts |
| Dashboard | `/dashboard` | Composite score, pillar breakdown, timeline, empire arc, indicator cards |
| Deep Dives | `/indicator/:id` | Multi-series charts, benchmarks, rate-of-change analysis, cross-country context |
| Empire Explorer | `/empires` | Rome, Ottoman, British decline patterns vs modern US |
| Country Rankings | `/rankings` | 50 countries across 19 metrics |
| Country Compare | `/compare` | Head-to-head comparison with overlay charts |
| Correlations | `/correlations` | Cross-indicator correlation matrix with key findings |
| Your Lifetime | `/your-lifetime` | Personalized view by birth year |
| API Docs | `/api-docs` | Interactive API playground |

## API

Free, public, no authentication required. CORS open.
```bash
## Principles

1. **All data is free and publicly sourced.** Zero paywalled data.
2. **Political symmetry is absolute.** Identical treatment regardless of partisan implications.
3. **No timing claims.** Augur measures stress, not destiny.
4. **Fully open source.** This repository, the API, and the methodology.
5. **Cryptographic integrity.** SHA-256 on every data point.
6. **No user accounts.** The product is the data, not the user.

## Intellectual Foundations

Augur's framework draws on:
- **Peter Turchin** - *Ages of Discord* (2016), *End Times* (2023). Structural-demographic theory.
- **Joseph Tainter** - *The Collapse of Complex Societies* (1988). Diminishing returns on complexity.
- **Ray Dalio** - *Principles for Dealing with the Changing World Order* (2021). Reserve currency cycles.
- **Daron Acemoglu & James Robinson** - *Why Nations Fail* (2012). Institutional quality as determinant.
- **Carmen Reinhart & Kenneth Rogoff** - *This Time Is Different* (2009). Eight centuries of financial crises.

## Local Development
```bash
# Backend
cd augur
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add FRED_API_KEY and DATABASE_URL
python -m uvicorn backend.app.api.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

## Citation
BibTeX:
```bibtex
@misc{augur2026,
  title={Augur: Civilizational Stress Index},
  author={Adkins, Becca},
  year={2026},
  url={https://augur-index.vercel.app},
  note={Open source. 350,000+ data points across 50 countries from 10 primary sources.}
}
```

## License

MIT

---

*The structural conditions that preceded every major civilizational decline in recorded history are measurable. All of them are currently present in the United States. This is federal government data. Public. Verifiable. Uncomfortable.*
