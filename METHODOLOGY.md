# AUGUR — Methodology

## Civilizational Stress Index: Technical Documentation

**Version 2.0 | March 2026**

---

## 1. Overview

Augur is a quantitative civilizational stress index that tracks 13 structural indicators across 4 pillars for 50 countries. The dataset contains 329,000+ data points from 15 primary sources. Every indicator is derived from publicly available primary-source data. Every transformation is logged. Every published data point is cryptographically fingerprinted using SHA-256 hashing.

Augur measures structural stress, not destiny. The index identifies conditions that historians, political scientists, and economists have documented as precursors to institutional decline.

## 2. Principles

1. **All data is free and publicly sourced.** Zero paywalled data.
2. **Political symmetry is absolute.** Identical analytical treatment regardless of partisan implications.
3. **No timing claims.** Civilizational transitions are never predictable from structural data alone.
4. **Fully open source.** Public GitHub repository, public API, public methodology.
5. **Cryptographic integrity.** Every data point is SHA-256 fingerprinted.
6. **No user accounts.** The product is the data, not the user.

## 3. Data Sources (15)

| Source | Provider | Data | Access |
|--------|----------|------|--------|
| FRED | Federal Reserve Bank of St. Louis | Wealth, debt, CPI, employment, housing, credit, money supply, markets, industrial production | REST API, automated weekly |
| World Bank | World Bank Group | GDP, military, Gini, health, education, governance, demographics, trade, environment for 50 countries | REST API, automated weekly |
| VoteView | UCLA | Congressional voting ideology (DW-NOMINATE scores) | Direct download |
| Gallup | Gallup Inc | Institutional trust (10 institutions), media trust (partisan breakdown) | Published reports, manual entry |
| Freedom House | Freedom House | Freedom in the World scores for 50 countries (0-100) | Published reports, manual entry |
| Transparency International | TI | Corruption Perceptions Index for 50 countries (0-100) | Published reports, manual entry |
| World Justice Project | WJP | Rule of law index and global rankings | Published reports, manual entry |
| IMF | International Monetary Fund | World Economic Outlook projections | REST API |
| CDC | Centers for Disease Control | Overdose deaths, deaths of despair, suicide rates, life expectancy, maternal/infant mortality | Published data, manual entry |
| BJS | Bureau of Justice Statistics | Incarceration rates and population | Published data, manual entry |
| HUD | Dept of Housing and Urban Development | Point-in-time homelessness counts | Published reports, manual entry |
| USDA | Dept of Agriculture | Food insecurity data | Published reports, manual entry |
| US Courts | Federal Judiciary | Bankruptcy filings | Published data, manual entry |
| EIA | Energy Information Administration | Electricity, infrastructure utilization | REST API |
| USGS / Bureau of Reclamation | Dept of Interior | Groundwater levels, reservoir data, drought | Published data, manual entry |

## 4. The 13 Indicators

### Pillar I: Social Cohesion

**4.1 Political Polarization**
- Source: UCLA VoteView DW-NOMINATE scores
- Series: House Democrats, House Republicans, Senate Democrats, Senate Republicans, Senate Independents
- Method: Raw DW-NOMINATE first dimension scores. Party means computed per chamber per Congress.
- Records: ~165

**4.2 Public Trust in Institutions**
- Source: Gallup Confidence in Institutions, Pew Research
- Series: Congress, Supreme Court, military, TV news, newspapers, presidency, police, criminal justice, churches, banks, public schools, medical system, federal government
- Method: Percentage responding "a great deal" or "quite a lot" of confidence.
- Records: ~330

**4.3 Rule of Law**
- Sources: World Justice Project, Freedom House, Transparency International
- Series: WJP overall score, Freedom in the World score (50 countries), Corruption Perceptions Index (50 countries)
- Method: Direct scores from published indices. No transformations.
- Records: ~800+

**4.4 Civil Unrest Frequency**
- Sources: ACLED/BDI, CDC, BJS, FBI
- Series: Armed groups count, political violence attitudes, drug overdose deaths, deaths of despair, suicide rate, incarceration rate, incarcerated population, gun deaths, hate crimes, mass shootings, police killings, protest events, domestic terrorism cases
- Method: Annual counts and rates from published data.
- Records: ~350+

### Pillar II: Economic Structure

**4.5 Wealth Inequality**
- Sources: Federal Reserve DFA, World Bank, Census Bureau
- Series: Top 1% wealth share, bottom 50% wealth share, next 40% share, Gini index (US + 50 countries), child poverty rate, household net worth, credit card debt, student loan debt, motor vehicle loans, mortgage debt
- Method: Direct values from source. No transformations applied.
- Records: ~6,000+

**4.6 Middle Class Decline**
- Sources: FRED, CDC, HUD, USDA, US Courts, Census
- Series: Median household income, median home price, Case-Shiller index, mortgage rate, homeownership rate, personal savings rate, consumer sentiment, vehicle sales, homelessness count, food insecurity, bankruptcy filings, life expectancy, maternal mortality, infant mortality, uninsured rate, housing affordability
- Method: Direct values. Housing affordability tracked through price-to-income dynamics.
- Records: ~14,000+

**4.7 Government Debt to GDP**
- Sources: FRED, IMF
- Series: Debt-to-GDP ratio, total federal debt, GDP, real GDP, interest payments, interest-to-GDP ratio, federal receipts, federal expenditures, surplus/deficit, foreign-held debt, Fed-held debt, bank credit, delinquency rates, lending standards
- Method: Direct values from FRED quarterly releases.
- Records: ~17,000+

**4.8 Currency Debasement**
- Sources: FRED
- Series: CPI (all items + 10 subcategories), PCE price index, core PCE, M1/M2/MZM money supply, monetary base, Fed balance sheet, Fed Treasury holdings, commodity prices (gas, diesel, corn, wheat), exchange rates
- Method: Direct values. No seasonal adjustments beyond what the source provides.
- Records: ~26,000+

### Pillar III: Systemic Capacity

**4.9 Elite Overproduction**
- Sources: FRED, BLS
- Series: Unemployment rate (total + by race + by education), labor force participation, employment-population ratio, U6 underemployment, nonfarm payrolls, sector employment (manufacturing, services, government, finance, information, construction, trade, transportation, education/health, leisure), JOLTS (openings, hires, quits, separations, layoffs), average hourly earnings, weekly hours, jobless claims, mean unemployment duration, part-time for economic reasons, multiple jobholders, unit labor costs
- Method: Direct values from BLS/FRED.
- Records: ~27,000+

**4.10 Infrastructure Decay**
- Sources: FRED, EIA, FHWA, ASCE
- Series: Industrial production (total + manufacturing + business equipment + consumer goods + materials), capacity utilization, transportation services freight, Chicago Fed activity index, retail sales, manufacturing inventories/shipments/orders, bridges deficient, ASCE grade, power outages, rail accidents, pipeline incidents, broadband penetration, average commute time
- Method: Direct values from source agencies.
- Records: ~10,000+

**4.11 Media Fragmentation**
- Source: Gallup
- Series: Overall news trust, Republican news trust, Democratic news trust, Independent news trust, newspaper circulation, local news deserts
- Method: Survey percentages and industry data.
- Records: ~120+

### Pillar IV: External Environment

**4.12 Geopolitical Standing**
- Sources: World Bank, FRED, IMF
- Series: 168 World Bank indicators for 50 countries covering GDP, trade, governance, demographics, health, education, military, technology, environment, financial sector. FRED trade data. IMF projections.
- Method: Direct values from World Bank API. Cross-country comparison on identical methodology.
- Records: ~228,000+

**4.13 Resource Stress**
- Sources: USGS, Bureau of Reclamation, EPA
- Series: Lake Mead elevation, Ogallala Aquifer decline, Colorado River flow, groundwater depletion, water main breaks, lead service lines, US drought percentage, Superfund sites, drinking water violations, dam safety deficiencies
- Method: Direct values from agency reports and monitoring data.
- Records: ~100+

## 5. Composite Stress Index

The composite score (0-100) is computed as the unweighted mean of five normalized sub-indicators:

1. **Institutional Trust** = 100 - (Congress confidence %)
2. **Polarization** = min(100, House Republican DW-NOMINATE mean * 150)
3. **Debt Burden** = min(100, Debt-to-GDP ratio * 0.8)
4. **Wealth Concentration** = min(100, Top 1% wealth share * 2.5)
5. **Epistemic Fracture** = 100 - (News trust %)

The current composite score is **84/100**. Higher scores indicate greater structural stress.

**Pillar scores** are computed as the mean of their constituent sub-indicators:
- Social Cohesion: mean of Trust + Polarization = 86
- Economic Structure: mean of Debt + Wealth = 89
- Systemic Capacity: Epistemic Fracture = 68
- External Environment: Relative decline proxy = 88

**Note on methodology:** The composite formula uses a deliberately simple approach (unweighted mean of normalized values) for transparency. More sophisticated approaches (principal component analysis, factor loading) could produce different results. The choice of normalization coefficients (e.g., multiplying debt-to-GDP by 0.8) affects the output and represents an editorial judgment about scale. These choices are documented and can be independently evaluated.

## 6. Data Integrity

Every data pull is logged with:
- Source URL and timestamp
- SHA-256 hash of raw response
- Record count
- Validation results

## 7. Intellectual Foundations

Augur's framework draws on:

- **Peter Turchin**, *Ages of Discord* (2016) and *End Times* (2023). Structural-demographic theory identifying elite overproduction, popular immiseration, and state fiscal crisis as quantifiable precursors to political instability.
- **Joseph Tainter**, *The Collapse of Complex Societies* (1988). Diminishing returns on increasing complexity as a driver of civilizational decline.
- **Ray Dalio**, *Principles for Dealing with the Changing World Order* (2021). Quantitative framework for comparing reserve currency cycles and great power transitions.
- **Daron Acemoglu and James Robinson**, *Why Nations Fail* (2012). Institutional quality as the primary determinant of long-run national outcomes.
- **Carmen Reinhart and Kenneth Rogoff**, *This Time Is Different* (2009). Eight centuries of financial crisis data.

## 8. Limitations

- Manual data entry for some indicators introduces update lag
- The composite score normalization uses editorial judgments about scale
- Historical empire comparisons are structural analogies, not predictive models
- Some proxy measures (unemployment for elite overproduction, electricity for infrastructure) are imperfect
- The index currently covers 50 countries; expansion is planned
- Daily-frequency data is excluded to manage storage; all data is monthly, quarterly, or annual

## 9. Citation
BibTeX:
```bibtex
@misc{augur2026,
  title={Augur: Civilizational Stress Index},
  author={Adkins, Becca},
  year={2026},
  url={https://augur-index.vercel.app},
  note={Open source. 329,000+ data points across 50 countries from 15 primary sources.}
}
```

## 10. License

MIT. Data is sourced from public APIs and government databases.

---

*Version 2.0 — March 2026*
