# AUGUR — Methodology

## Civilizational Stress Index: Technical Documentation

**Version 1.0 | March 2026**

---

## 1. Overview

Augur is a quantitative civilizational stress index that tracks 13 structural indicators across 4 pillars. Every indicator is derived from publicly available primary-source data. Every transformation is logged. Every published data point is cryptographically fingerprinted using SHA-256 hashing and independently verifiable.

Augur measures structural stress, not destiny. The index identifies conditions that historians, political scientists, and economists have documented as precursors to institutional decline — without making timing claims or policy prescriptions.

## 2. Principles

1. **All data is free and publicly sourced.** Zero paywalled data. Anyone with a computer can verify every number.
2. **Political symmetry is absolute.** Identical analytical treatment regardless of partisan implications.
3. **No timing claims.** The timing of civilizational transitions is never knowable from structural data alone.
4. **Fully open source.** Public GitHub repository, public API, public methodology.
5. **Cryptographic integrity.** Every data point is SHA-256 fingerprinted. Every transformation is logged.
6. **No user accounts.** Eliminates the entire PII attack surface. The product is the data, not the user.

## 3. Data Sources

| Source | Indicators | Access Method | Update Frequency |
|--------|-----------|---------------|-----------------|
| Federal Reserve (FRED) | Wealth inequality, debt-to-GDP, CPI, unemployment, labor participation, Treasury yields, GDP | REST API | Weekly (automated) |
| UCLA VoteView | Political polarization (DW-NOMINATE) | Direct download | Per Congress |
| World Bank | GDP PPP, military spending, Gini index, education, healthcare, life expectancy, unemployment, inflation | REST API | Weekly (automated) |
| Gallup | Public trust, media fragmentation | Manual entry from published reports | Annual |
| World Justice Project | Rule of law index | Manual entry from published reports | Annual |
| Bridging Divides Initiative | Civil unrest / armed groups | Manual entry from published reports | Annual |
| EIA | Electricity / infrastructure data | REST API | Annual |
| USGS / Bureau of Reclamation | Groundwater levels, reservoir data | Manual entry | Annual |

## 4. Pillar I: Social Cohesion

### 4.1 Political Polarization
- **Source:** VoteView DW-NOMINATE scores (UCLA)
- **Methodology:** Raw DW-NOMINATE scores downloaded directly. Party means computed per chamber per Congress. The gap between party means is the polarization measure.
- **Series:** dw_nominate_House_100, dw_nominate_House_200, dw_nominate_Senate_100, dw_nominate_Senate_200
- **URL:** https://voteview.com/data

### 4.2 Public Trust in Institutions
- **Source:** Gallup Confidence in Institutions survey
- **Methodology:** Percentage responding "a great deal" or "quite a lot" of confidence. Multiple institutional series tracked independently (Congress, Supreme Court, military, media, federal government).
- **Series:** gallup_congress, gallup_scotus, gallup_military, gallup_newspapers, gallup_tvnews, pew_govt_trust
- **URL:** https://news.gallup.com/poll/1597/confidence-institutions.aspx

### 4.3 Rule of Law Erosion
- **Source:** World Justice Project Rule of Law Index
- **Methodology:** WJP overall score (0-1 scale) and global rank. Eight dimensions measured: constraints on government powers, absence of corruption, open government, fundamental rights, order and security, regulatory enforcement, civil justice, criminal justice.
- **Series:** wjp_us_overall, wjp_us_rank
- **URL:** https://worldjusticeproject.org/rule-of-law-index/

### 4.4 Civil Unrest Frequency
- **Source:** Bridging Divides Initiative (Princeton University)
- **Methodology:** Annual count of active militia and armed political organizations. Supplemented with YouGov survey data on attitudes toward political violence.
- **Series:** armed_groups_count, political_violence_justified
- **URL:** https://bridgingdivides.princeton.edu/

## 5. Pillar II: Economic Structure

### 5.1 Wealth Inequality
- **Source:** Federal Reserve Distributional Financial Accounts
- **Methodology:** Top 1% wealth share from FRED series WFRBST01134. Quarterly data, seasonally adjusted. No transformations applied. Cross-country comparison via World Bank Gini Index (SI.POV.GINI).
- **Series:** WFRBST01134, WFRBSB50215, WFRBSN09153, SI.POV.GINI
- **URL:** https://www.federalreserve.gov/releases/z1/dataviz/dfa/

### 5.2 Decline of the Middle Class
- **Source:** Federal Reserve / FRED
- **Methodology:** Real median household income (MEHOINUSA672N). Annual data in inflation-adjusted dollars.
- **Series:** MEHOINUSA672N
- **URL:** https://fred.stlouisfed.org/series/MEHOINUSA672N

### 5.3 Government Debt to GDP
- **Source:** Federal Reserve / FRED
- **Methodology:** Federal debt as percentage of GDP (GFDEGDQ188S). Quarterly data. Also tracks absolute federal debt (GFDEBTN), GDP growth (A191RL1Q225SBEA), and interest payments (A091RC1Q027SBEA).
- **Series:** GFDEGDQ188S, GFDEBTN, GDP, A191RL1Q225SBEA, A091RC1Q027SBEA
- **URL:** https://fred.stlouisfed.org/series/GFDEGDQ188S

### 5.4 Currency Debasement / Inflation
- **Source:** Federal Reserve / FRED + IMF COFER
- **Methodology:** CPI-U All Items (CPIAUCSL), PCE Price Index (PCEPI), Federal Funds Rate (FEDFUNDS), 10-Year Treasury (DGS10). Dollar reserve share from IMF COFER database.
- **Series:** CPIAUCSL, PCEPI, FEDFUNDS, DGS10
- **URL:** https://fred.stlouisfed.org/series/CPIAUCSL

## 6. Pillar III: Systemic Capacity

### 6.1 Elite Overproduction
- **Source:** Federal Reserve / FRED + Burning Glass Institute
- **Methodology:** Unemployment rate (UNRATE) and labor force participation (CIVPART) as structural proxies. Credential inflation data from Burning Glass Institute research.
- **Series:** UNRATE, CIVPART
- **URL:** https://fred.stlouisfed.org/series/UNRATE

### 6.2 Infrastructure Decay
- **Source:** FHWA National Bridge Inventory + EIA
- **Methodology:** Bridge structural deficiency data from FHWA. Electricity retail sales from EIA as infrastructure utilization proxy.
- **Series:** elec_retail_sales_res
- **URL:** https://www.fhwa.dot.gov/bridge/nbi.cfm

### 6.3 Media Fragmentation & Epistemic Divergence
- **Source:** Gallup
- **Methodology:** Annual trust in mass media survey. Percentage responding "a great deal" or "a fair amount." Partisan breakdowns tracked separately.
- **Series:** gallup_news_trust, gallup_news_trust_rep, gallup_news_trust_dem
- **URL:** https://news.gallup.com/poll/321116/americans-remain-distrustful-mass-media.aspx

## 7. Pillar IV: External Environment

### 7.1 Geopolitical Standing & External Pressure
- **Source:** World Bank Open Data API
- **Methodology:** GDP PPP (NY.GDP.MKTP.PP.CD) for 20 countries. Military expenditure as % of GDP (MS.MIL.XPND.GD.ZS). Cross-country comparison on GDP per capita, healthcare, education, life expectancy, unemployment, and inflation.
- **Series:** NY.GDP.MKTP.PP.CD, MS.MIL.XPND.GD.ZS, plus 7 additional World Bank indicators
- **URL:** https://data.worldbank.org/

### 7.2 Resource & Environmental Stress
- **Source:** USGS + Bureau of Reclamation
- **Methodology:** Ogallala Aquifer average water level decline from USGS monitoring wells. Lake Mead elevation from Bureau of Reclamation. Both measured in feet.
- **Series:** ogallala_decline_avg, lake_mead_elevation
- **URL:** https://www.usbr.gov/lc/region/g4000/hourly/mead-elv.html

## 8. Composite Stress Index

The composite score (0-100) is computed as the unweighted mean of five normalized sub-indicators:

1. **Institutional Trust** = 100 - (Congress confidence %)
2. **Polarization** = min(100, House Republican DW-NOMINATE mean * 150)
3. **Debt Burden** = min(100, Debt-to-GDP ratio * 0.8)
4. **Wealth Concentration** = min(100, Top 1% wealth share * 2.5)
5. **Epistemic Fracture** = 100 - (News trust %)

Higher scores indicate greater structural stress. The current composite score is **83 out of 100**.

## 9. Data Integrity

Every data pull is logged with:
- Source URL and timestamp
- SHA-256 hash of raw response
- Record count
- Validation results (range checks, staleness checks, year-over-year change limits)

Audit logs are stored in `data/audit/` and can be independently verified.

## 10. Limitations

- Manual data entry for some indicators (Gallup, WJP, BDI) introduces update lag
- The composite score weighting is equal across sub-indicators; alternative weightings could produce different results
- Historical comparisons with empires are structural analogies, not predictive models
- Some proxy measures (unemployment for elite overproduction, electricity sales for infrastructure) are imperfect
- The index currently covers 20 countries for cross-national comparison; expansion to 50+ is planned

## 11. Citation

To cite Augur in academic work:
## 12. License

Augur is fully open source. Data is sourced from public APIs and government databases. The codebase, methodology, and derived datasets are available under MIT License.

---

*This document was last updated March 2026.*
