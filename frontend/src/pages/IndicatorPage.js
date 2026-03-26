import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as d3 from 'd3';

const SERIES_NAMES = {
  'GFDEGDQ188S': 'Debt to GDP Ratio', 'GFDEBTN': 'Total Federal Debt', 'DGS10': '10-Year Treasury Yield',
  'A191RL1Q225SBEA': 'Real GDP Growth', 'GDP': 'Nominal GDP', 'A091RC1Q027SBEA': 'Federal Interest Payments',
  'FYOIGDA188S': 'Interest to GDP', 'FYFRGDA188S': 'Federal Revenue to GDP',
  'WFRBST01134': 'Top 1% Wealth Share', 'WFRBSB50215': 'Bottom 50% Wealth Share',
  'WFRBSN09153': 'Next 40% Wealth Share', 'SI.POV.GINI': 'Gini Index', 'GINIALLRH': 'US Gini Index',
  'CPIAUCSL': 'Consumer Price Index', 'PCEPI': 'PCE Price Index', 'FEDFUNDS': 'Federal Funds Rate',
  'UNRATE': 'Unemployment Rate', 'CIVPART': 'Labor Force Participation', 'MEHOINUSA672N': 'Median Household Income',
  'NY.GDP.MKTP.PP.CD': 'GDP (PPP)', 'MS.MIL.XPND.GD.ZS': 'Military Spending % GDP',
  'elec_retail_sales_res': 'Residential Electricity Sales',
  'gallup_congress': 'Congress', 'gallup_scotus': 'Supreme Court', 'gallup_newspapers': 'Newspapers',
  'gallup_tvnews': 'TV News', 'gallup_military': 'Military', 'pew_govt_trust': 'Federal Govt Trust',
  'gallup_news_trust': 'Overall News Trust', 'gallup_news_trust_rep': 'Republican Trust', 'gallup_news_trust_dem': 'Democratic Trust',
  'wjp_us_overall': 'WJP Overall Score', 'wjp_us_rank': 'WJP Global Rank',
  'armed_groups_count': 'Armed Groups Count', 'political_violence_justified': 'Political Violence Attitudes',
  'ogallala_decline_avg': 'Ogallala Aquifer Decline', 'lake_mead_elevation': 'Lake Mead Elevation',
  'dw_nominate_House_100': 'House Democrats', 'dw_nominate_House_200': 'House Republicans',
  'dw_nominate_Senate_100': 'Senate Democrats', 'dw_nominate_Senate_200': 'Senate Republicans',
  'dw_nominate_Senate_328': 'Senate Independents',
  'MSPUS': 'Median Home Sale Price',
  'CSUSHPINSA': 'Case-Shiller Home Price Index',
  'MORTGAGE30US': '30-Year Mortgage Rate',
  'RSAFS': 'Retail Sales',
  'INDPRO': 'Industrial Production Index',
  'M2SL': 'M2 Money Supply',
  'BOGMBASE': 'Monetary Base',
  'JTSJOL': 'Job Openings (JOLTS)',
  'LES1252881600Q': 'Median Weekly Earnings',
  'W270RE1A156NBEA': 'Labor Share of Output',
  'CP': 'Corporate Profits',
  'GC.DOD.TOTL.GD.ZS': 'Govt Debt (% GDP)',
  'BX.KLT.DINV.WD.GD.ZS': 'Foreign Direct Investment (% GDP)',
  'IT.NET.USER.ZS': 'Internet Users (%)',
  'SE.ADT.LITR.ZS': 'Literacy Rate',
  'SP.POP.65UP.TO.ZS': 'Population 65+',
  'SP.URB.TOTL.IN.ZS': 'Urbanization (%)',
  'NE.TRD.GNFS.ZS': 'Trade (% GDP)',
  'NY.GNS.ICTR.ZS': 'Gross Savings (% GDP)',
  'ST.INT.ARVL': 'Tourism Arrivals',
  'drug_overdose_deaths': 'Drug Overdose Deaths',
  'deaths_of_despair': 'Deaths of Despair',
  'suicide_rate_us': 'US Suicide Rate',
  'life_expectancy_cdc': 'US Life Expectancy (CDC)',
  'incarceration_rate': 'Incarceration Rate',
  'incarcerated_population': 'Incarcerated Population',
  'homeless_count': 'Homeless Population',
  'food_insecure_millions': 'Food Insecure (millions)',
  'bankruptcy_filings': 'Bankruptcy Filings',
  'maternal_mortality_us': 'Maternal Mortality',
  'infant_mortality_us': 'Infant Mortality',
  'gun_deaths': 'Firearm Deaths',
  'uninsured_rate': 'Uninsured Rate',
  'child_poverty_rate': 'Child Poverty Rate',
};

const META = {
  political_polarization: {
    title: 'Political Polarization',
    number: '0%', numberContext: 'ideological overlap between the most conservative Democrat and most liberal Republican in Congress — down from 50%+ in the 1970s.',
    what: 'DW-NOMINATE scores measure the ideological position of every member of Congress on a liberal-conservative scale, computed from roll-call voting records. When party distributions stop overlapping, bipartisan governance becomes significantly more difficult.',
    why: 'Multiple cases of republican (small-r) institutional breakdown — Rome, Weimar Germany, the French Fourth Republic — were preceded by the elimination of centrist overlap between factional groups. When this overlap narrows significantly, legislative compromise becomes increasingly difficult.',
    series: 'dw_nominate_House_200', source: 'VoteView / UCLA', sourceUrl: 'https://voteview.com/data',
    practical: 'When legislative systems lose the ability to compromise, governance shifts to executive action and judicial intervention. Communities that maintained cross-partisan local relationships and local governance capacity historically fared better during these periods.',
    methodology: 'Raw DW-NOMINATE scores downloaded directly from UCLA VoteView. Party means computed per chamber per Congress. No editorial adjustment. The gap between party means is the polarization measure.',
    benchmarks: [
      { label: 'Pre-Civil War US (1850s)', value: 0.52, color: '#a06050' },
      { label: 'Current level', value: 0.53, color: '#e04040', current: true },
      { label: 'Functional bipartisan era (1970s)', value: 0.35, color: '#40c080' },
    ],
    thresholds: [
      { level: 0.45, label: 'Zero legislative overlap between parties typically occurs above this level' },
    ],
    crossCountry: [
      { country: 'Weimar Germany', value: null, year: 1932, outcome: 'Complete elimination of centrist parties. Coalition government became impossible. Democratic collapse within 14 months.' },
      { country: 'Chile', value: null, year: 1973, outcome: 'Legislative deadlock between irreconcilable factions. Military intervention followed within months.' },
      { country: 'United Kingdom', value: null, year: 2016, outcome: 'Brexit polarization. Functional but strained. Three PMs in one year. Institutions bent but held.' },
    ],
    crossCountry: [
      { country: 'Weimar Germany', value: null, year: 1932, outcome: 'Complete elimination of centrist parties. Coalition government became impossible. Democratic collapse within 14 months.' },
      { country: 'Chile', value: null, year: 1973, outcome: 'Legislative deadlock between irreconcilable factions. Military intervention followed within months.' },
      { country: 'United Kingdom', value: null, year: 2016, outcome: 'Brexit polarization. Functional but strained. Three PMs in one year. Institutions bent but held.' },
    ],
  },
  public_trust: {
    title: 'Public Trust in Institutions',
    number: '8%', numberContext: 'of Americans express confidence in Congress — the lowest sustained level in the history of the measurement.',
    what: 'Gallup has measured public confidence in major American institutions since 1973. Trust in Congress, the Supreme Court, the presidency, and media have all declined, though at different rates.',
    why: 'Institutional legitimacy is the invisible infrastructure of governance. When citizens stop believing institutions function in good faith, compliance becomes coercive rather than voluntary — and coercive compliance is expensive, fragile, and historically unsustainable.',
    series: 'gallup_congress', source: 'Gallup Confidence in Institutions', sourceUrl: 'https://news.gallup.com/poll/1597/confidence-institutions.aspx',
    practical: 'When institutional trust drops below 20%, voluntary compliance with laws and public health measures becomes unreliable. Communities with strong local institutions and mutual aid networks navigated these periods with less disruption.',
    methodology: 'Annual survey data from Gallup. Percentage responding "a great deal" or "quite a lot" of confidence. Multiple institutional series tracked independently.',
    benchmarks: [
      { label: 'Watergate-era low (1976)', value: 36, color: '#e0a030' },
      { label: 'Current Congress confidence', value: 8, color: '#e04040', current: true },
      { label: 'Functional governance threshold', value: 30, color: '#40c080' },
    ],
    thresholds: [
      { level: 20, label: 'Below 20% confidence, institutions typically lose voluntary compliance' },
    ],
    crossCountry: [
      { country: 'Italy', value: 12, year: 2024, outcome: 'Chronically low trust. 70 governments since 1946. Functional but inefficient governance.' },
      { country: 'Denmark', value: 73, year: 2024, outcome: 'Highest institutional trust in EU. Lowest corruption, highest social mobility.' },
      { country: 'Venezuela', value: 5, year: 2015, outcome: 'Near-zero trust preceded economic collapse, hyperinflation, and mass emigration.' },
    ],
    crossCountry: [
      { country: 'Italy', value: 12, year: 2024, outcome: 'Chronically low trust. 70 governments since 1946. Functional but inefficient governance.' },
      { country: 'Denmark', value: 73, year: 2024, outcome: 'Highest institutional trust in EU. Lowest corruption, highest social mobility.' },
      { country: 'Venezuela', value: 5, year: 2015, outcome: 'Near-zero trust preceded economic collapse, hyperinflation, and mass emigration.' },
    ],
  },
  rule_of_law: {
    title: 'Rule of Law Erosion',
    number: '26th', numberContext: 'US global ranking on the World Justice Project Rule of Law Index — below Estonia, the Czech Republic, and every other G7 nation.',
    what: 'The WJP Rule of Law Index measures eight dimensions: constraints on government powers, absence of corruption, open government, fundamental rights, order and security, regulatory enforcement, civil justice, and criminal justice.',
    why: 'Rule of law is the operating system of complex societies. When it degrades, economic contracts become unenforceable, political competition becomes zero-sum, and institutional trust enters a self-reinforcing decline spiral.',
    series: 'wjp_us_overall', source: 'World Justice Project', sourceUrl: 'https://worldjusticeproject.org/rule-of-law-index/',
    methodology: 'WJP overall score for the United States, published annually. Scale of 0 to 1. Global rank computed relative to all indexed countries.',
  },
  civil_unrest: {
    title: 'Civil Unrest Frequency',
    number: '900+', numberContext: 'active militia and armed political organizations operating in the United States — the highest count ever recorded.',
    what: 'The Bridging Divides Initiative at Princeton University tracks armed groups, political violence incidents, and militia activity across the United States.',
    why: 'Armed political organization outside state structures is one of the strongest leading indicators of institutional instability in the historical record. It signals that factions have concluded institutional channels cannot resolve their grievances.',
    series: 'armed_groups_count', source: 'Bridging Divides Initiative / Princeton', sourceUrl: 'https://bridgingdivides.princeton.edu/',
    methodology: 'Annual count of active militia and armed political organizations from BDI database. Supplemented with survey data on attitudes toward political violence from YouGov.',
  },
  wealth_inequality: {
    title: 'Wealth Inequality',
    number: '30.8%', numberContext: 'of all national wealth held by the top 1% of households. The bottom 50% holds 2.5%.',
    what: 'The Federal Reserve Distributional Financial Accounts track wealth distribution across American households, updated quarterly. This is not income — it is accumulated wealth: real estate, financial assets, business equity.',
    why: 'Extreme wealth concentration is a recurring feature of societies experiencing institutional decline (Turchin 2016, Piketty 2014). The instability risk comes not from inequality itself but from its political consequences: elite capture of institutions, erosion of social mobility, and delegitimization of the economic system.',
    series: 'WFRBST01134', source: 'Federal Reserve DFA', sourceUrl: 'https://www.federalreserve.gov/releases/z1/dataviz/dfa/distribute/chart/',
    practical: 'Extreme wealth concentration correlates with declining social mobility and political instability. Communities with strong local economies and skills-based employment have historically been more resilient during these periods.',
    methodology: 'Top 1% wealth share from Federal Reserve Distributional Financial Accounts (WFRBST01134). Quarterly data, seasonally adjusted. No transformations applied.',
    benchmarks: [
      { label: 'Gilded Age peak (~1928)', value: 36, color: '#a06050' },
      { label: 'Current top 1% share', value: 31, color: '#e04040', current: true },
      { label: 'Post-war low (1978)', value: 22, color: '#40c080' },
      { label: 'OECD average top 1%', value: 18, color: '#5080c0' },
    ],
    thresholds: [
      { level: 30, label: 'Above 30% top-1% share, democratic institutions historically face legitimacy challenges' },
    ],
    crossCountry: [
      { country: 'South Africa', value: 63, year: 2024, outcome: 'Highest Gini globally. Persistent social instability. Growth constrained by demand collapse.' },
      { country: 'Brazil', value: 53, year: 2024, outcome: 'Decades of political instability correlated with inequality. Multiple constitutional crises.' },
      { country: 'Sweden', value: 29, year: 2024, outcome: 'Low inequality correlates with high trust, strong mobility, and political stability.' },
    ],
    crossCountry: [
      { country: 'South Africa', value: 63, year: 2024, outcome: 'Highest Gini globally. Persistent social instability. Growth constrained by demand collapse.' },
      { country: 'Brazil', value: 53, year: 2024, outcome: 'Decades of political instability correlated with inequality. Multiple constitutional crises.' },
      { country: 'Sweden', value: 29, year: 2024, outcome: 'Low inequality correlates with high trust, strong mobility, and political stability.' },
    ],
  },
  middle_class_decline: {
    title: 'Decline of the Middle Class',
    number: '$83,700', numberContext: 'real median household income — stagnant in inflation-adjusted terms over four decades despite rising GDP and productivity.',
    what: 'The Census Bureau measures median household income annually. This single number captures the economic reality of the typical American household more accurately than GDP, stock indices, or unemployment rates.',
    why: 'A shrinking middle class is both a symptom and an accelerant of institutional stress. It reduces the constituency for institutional stability, increases demand for radical alternatives, and concentrates political power at the extremes.',
    series: 'MEHOINUSA672N', source: 'Federal Reserve / FRED', sourceUrl: 'https://fred.stlouisfed.org/series/MEHOINUSA672N',
    methodology: 'Real median household income from FRED series MEHOINUSA672N. Annual data in 2023 CPI-adjusted dollars. No additional transformations.',
  },
  debt_to_gdp: {
    title: 'Government Debt to GDP',
    number: '122%', numberContext: 'federal debt as a percentage of GDP — the highest peacetime ratio in American history, exceeding World War II levels.',
    what: 'Federal debt held by the public as a percentage of gross domestic product. This ratio measures the government\'s debt burden relative to the economy\'s capacity to service it.',
    why: 'Sovereign debt crises are among the most common proximate triggers of institutional rupture. The debt itself is less important than the trajectory — accelerating debt-to-GDP ratios reduce fiscal capacity to respond to crises, creating fragility.',
    series: 'GFDEGDQ188S', source: 'Federal Reserve / FRED', sourceUrl: 'https://fred.stlouisfed.org/series/GFDEGDQ188S',
    practical: 'Countries that crossed 100% debt-to-GDP resolved it through austerity, inflation, default, or growth. Each affects savings and wages differently. Financial diversification across asset classes and jurisdictions has historically been the most effective individual response.',
    methodology: 'Federal debt to GDP ratio from FRED series GFDEGDQ188S. Quarterly data. No transformations applied to source data.',
    benchmarks: [
      { label: 'WWII peak (1946)', value: 106, color: '#e0a030' },
      { label: 'Current US', value: 122, color: '#e04040', current: true },
      { label: 'Eurozone crisis threshold', value: 90, color: '#a06050' },
      { label: 'OECD average', value: 68, color: '#40c080' },
    ],
    thresholds: [
      { level: 90, label: 'Reinhart-Rogoff threshold: GDP growth historically slows above 90% debt-to-GDP' },
    ],
    crossCountry: [
      { country: 'Japan', value: 225, year: 2024, outcome: 'Three decades of stagnation. Debt monetized by central bank. GDP growth averaged 0.7% since 1995.' },
      { country: 'Greece', value: 103, year: 2009, outcome: 'Sovereign debt crisis. GDP contracted 25%. Required international bailout.' },
      { country: 'Italy', value: 134, year: 2020, outcome: 'Chronic low growth. Repeated austerity. Brain drain of educated workforce.' },
      { country: 'United Kingdom', value: 250, year: 1946, outcome: 'Post-war austerity lasted 9 years. Lost reserve currency status. Empire dissolved.' },
    ],
    crossCountry: [
      { country: 'Japan', value: 225, year: 2024, outcome: 'Three decades of stagnation. Debt monetized by central bank. GDP growth averaged 0.7% since 1995.' },
      { country: 'Greece', value: 103, year: 2009, outcome: 'Sovereign debt crisis. GDP contracted 25%. Required international bailout.' },
      { country: 'Italy', value: 134, year: 2020, outcome: 'Chronic low growth. Repeated austerity. Brain drain of educated workforce.' },
      { country: 'United Kingdom', value: 250, year: 1946, outcome: 'Post-war austerity lasted 9 years. Lost reserve currency status. Empire dissolved.' },
    ],
  },
  currency_debasement: {
    title: 'Currency Debasement & Inflation',
    number: '58%', numberContext: 'dollar share of global reserves, down from 71% in 2000 — a 13-point decline in 24 years.',
    what: 'CPI measures domestic purchasing power erosion. The dollar\'s share of global reserves measures international confidence in the currency. Together they capture both internal and external dimensions of monetary stability.',
    why: 'Currency debasement is the oldest fiscal strategy in history, and one of the most reliable indicators of institutional decline. Rome clipped coins. Spain inflated with New World silver. Every reserve currency in history has eventually lost that status.',
    series: 'CPIAUCSL', source: 'Federal Reserve / FRED + IMF COFER', sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
    methodology: 'CPI-U All Items (CPIAUCSL) from FRED. Monthly data, seasonally adjusted. Index with 1982-84 base period. Reserve share data from IMF COFER database.',
  },
  elite_overproduction: {
    title: 'Elite Overproduction',
    number: '4.2%', numberContext: 'unemployment rate — but the headline number masks credential inflation. 51% of middle-skill jobs added degree requirements without corresponding skill increases (Burning Glass Institute, 2021).',
    what: 'Peter Turchin\'s theory of elite overproduction: when a society produces more credentialed aspirants to elite positions than those positions can absorb, the surplus competes destructively for status, destabilizing institutions.',
    why: 'Credential inflation, combined with stagnant elite-track opportunities, creates a class of frustrated aspirants who become natural leaders of counter-elite movements. This pattern is documented in pre-revolutionary France, late Ottoman Turkey, and Weimar Germany.',
    series: 'UNRATE', source: 'Federal Reserve / FRED + Burning Glass Institute', sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
    methodology: 'Unemployment rate (UNRATE) and labor force participation (CIVPART) from FRED as structural proxies. Credential inflation data from Burning Glass Institute.',
  },
  infrastructure_decay: {
    title: 'Infrastructure Decay',
    number: '43,586', numberContext: 'US bridges classified as structurally deficient — with an average bridge age of 44 years.',
    what: 'Infrastructure utilization and condition tracked through EIA electricity retail sales data as a proxy for systemic capacity. Bridge deficiency data (43,586 structurally deficient) from FHWA National Bridge Inventory provides the headline figure.',
    why: 'Infrastructure decay is simultaneously a cause and symptom of institutional decline. It reduces economic productivity, increases maintenance costs exponentially, and signals a society consuming inherited capital rather than investing in future capacity.',
    series: 'elec_retail_sales_res', source: 'EIA (Energy Information Administration)', sourceUrl: 'https://www.eia.gov/electricity/data/',
    methodology: 'Bridge data from FHWA National Bridge Inventory. Electricity data from EIA retail sales database. Annual observations.',
  },
  media_fragmentation: {
    title: 'Media Fragmentation & Epistemic Divergence',
    number: '32%', numberContext: 'of Americans trust national news organizations — down from 76% in 1972.',
    what: 'The collapse of shared information sources and the emergence of ideologically siloed media ecosystems. Measured through trust surveys and the growing partisan gap in media confidence.',
    why: 'Shared epistemic frameworks are prerequisites for democratic governance. When citizens cannot agree on basic facts, policy negotiation becomes impossible and political competition shifts from interests to identities.',
    series: 'gallup_news_trust', source: 'Gallup', sourceUrl: 'https://news.gallup.com/poll/321116/americans-remain-distrustful-mass-media.aspx',
    methodology: 'Gallup annual survey on trust in mass media. Percentage responding "a great deal" or "a fair amount." Partisan breakdowns tracked separately.',
  },
  geopolitical_standing: {
    title: 'Geopolitical Standing & External Pressure',
    number: '15%', numberContext: 'US share of global GDP (PPP), down from approximately 50% in 1945 — a two-thirds relative decline.',
    what: 'The relative economic and military position of the United States in the global system, measured through GDP share (PPP), military expenditure ratios, and alliance structure stability.',
    why: 'Relative decline in geopolitical standing increases external pressure on domestic institutions while simultaneously reducing the resources available to manage that pressure. This is the classic imperial overextension dynamic.',
    series: 'NY.GDP.MKTP.PP.CD', source: 'World Bank / IMF', sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.PP.CD',
    practical: 'Relative decline affects currency stability, trade terms, and alliance reliability. Understanding supply chain dependencies and maintaining locally-sourced alternatives for essential goods has historically mattered during hegemonic transitions.',
    methodology: 'GDP PPP in current international dollars from World Bank API. 20 countries tracked for cross-national comparison. Military expenditure as percentage of GDP from World Bank indicator MS.MIL.XPND.GD.ZS.',
  },
  resource_stress: {
    title: 'Resource & Environmental Stress',
    number: '1,065 ft', numberContext: 'Lake Mead water elevation, down from 1,214 ft in 2000. The Ogallala Aquifer has declined approximately 16 feet since 1950.',
    what: 'Critical resource sustainability indicators: aquifer depletion rates, reservoir levels, water infrastructure integrity, and energy system resilience.',
    why: 'Resource constraints function as hard limits on institutional adaptability. When critical resources are depleted or infrastructure fails to deliver them, the margin for institutional error narrows dramatically.',
    series: 'lake_mead_elevation', source: 'USGS / Bureau of Reclamation', sourceUrl: 'https://www.usbr.gov/lc/region/g4000/hourly/mead-elv.html',
    methodology: 'Ogallala Aquifer average water level decline from USGS monitoring wells. Lake Mead elevation from Bureau of Reclamation. Both in feet.',
  },
};

function FullChart({ data, seriesId, indicatorId, timeRange }) {
  // Color palette for multiple series
  const COLORS = ['#e04040', '#40c080', '#e0a030', '#5080c0', '#c060a0', '#60c0c0'];


  const ref = useRef();
  useEffect(() => {
    if (!data || !data.data) return;
    // Filter by time range
    const now = new Date().getFullYear();
    const minYear = timeRange === '10yr' ? now - 10 : timeRange === '25yr' ? now - 25 : 0;
    let filtered = data.data.filter(d => {
      const yr = parseInt(d.date_value.substring(0,4));
      return yr >= minYear;
    });
    // Fall back to all data if filtered set is too small
    if (filtered.length < 3) filtered = data.data;

    // Group by series
    const seriesMap = {};
    filtered.forEach(d => {
      if (d.value == null) return;
      if (!seriesMap[d.series_id]) seriesMap[d.series_id] = [];
      seriesMap[d.series_id].push(d);
    });
    const allSeries = Object.entries(seriesMap).filter(([k,v]) => v.length >= 2).sort((a,b) => b[1].length - a[1].length);
    if (!allSeries.length) return;
    // Use primary series for main chart, show all
    let pts = seriesMap[seriesId] || allSeries[0][1];
    if (pts.length < 2) pts = allSeries[0][1];
    if (pts.length > 400) {
      const yr = {}; pts.forEach(p => { const y = p.date_value.substring(0, 4); if (!yr[y]) yr[y] = p; }); pts = Object.values(yr);
    }

    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    
    const W = 900, H = 360, m = { t: 20, r: 30, b: 40, l: 60 };

    const parseDate = d => new Date(d.date_value);
    const x = d3.scaleTime().domain(d3.extent(pts, parseDate)).range([m.l, W - m.r]);
    // Scale y-axis to encompass all visible series
    let allVals = pts.map(d => d.value);
    const pMedian = allVals.sort((a,b)=>a-b)[Math.floor(allVals.length/2)];
    allSeries.slice(0, 5).forEach(([sid, spts]) => {
      if (sid === (seriesId || allSeries[0][0])) return;
      const sMedian = spts.map(d=>d.value).sort((a,b)=>a-b)[Math.floor(spts.length/2)];
      const r = Math.abs(sMedian) / Math.max(Math.abs(pMedian), 0.001);
      if (r <= 10 && r >= 0.1) spts.forEach(d => allVals.push(d.value));
    });
    const yExtent = allVals.length ? d3.extent(allVals) : d3.extent(pts, d => d.value);
    const yPad = (yExtent[1] - yExtent[0]) * 0.08;
    const yDomain = [yExtent[0] - yPad, yExtent[1] + yPad];
    const y = d3.scaleLinear().domain(yDomain).nice().range([H - m.b, m.t]);

    // Grid lines
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(8).tickSize(0)).select('.domain').attr('stroke', '#1c1c30');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-family', "'JetBrains Mono'").attr('font-size', '10px');

    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r))).select('.domain').remove();
    svg.selectAll('.tick line').attr('stroke', '#1c1c30').attr('stroke-dasharray', '2,4');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-family', "'JetBrains Mono'").attr('font-size', '10px');

    // Area
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id','chart-clip-'+indicatorId).append('rect').attr('x',m.l).attr('y',m.t).attr('width',W-m.l-m.r).attr('height',H-m.t-m.b);
    const grad = defs.append('linearGradient').attr('id', 'full-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#e04040').attr('stop-opacity', 0.2);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#e04040').attr('stop-opacity', 0);
    svg.append('path').datum(pts).attr('clip-path','url(#chart-clip-'+indicatorId+')').attr('fill', 'url(#full-grad)').attr('d', d3.area().x(d => x(parseDate(d))).y0(H - m.b).y1(d => y(d.value)).curve(d3.curveMonotoneX));

    // Line
    svg.append('path').datum(pts).attr('clip-path','url(#chart-clip-'+indicatorId+')').attr('fill', 'none').attr('stroke', '#e04040').attr('stroke-width', 2).attr('d', d3.line().x(d => x(parseDate(d))).y(d => y(d.value)).curve(d3.curveMonotoneX));

    // End dot
    const last = pts[pts.length - 1];
    svg.append('circle').attr('clip-path','url(#chart-clip-'+indicatorId+')').attr('cx', x(parseDate(last))).attr('cy', y(last.value)).attr('r', 4).attr('fill', '#e04040');

    // Overlay only series with similar scale (within 10x of primary median)
    const primaryMedian = pts.map(d=>d.value).sort((a,b)=>a-b)[Math.floor(pts.length/2)];
    allSeries.slice(0, 5).forEach(([sid, spts], idx) => {
      if (sid === (seriesId || allSeries[0][0])) return;
      const secMedian = spts.map(d=>d.value).sort((a,b)=>a-b)[Math.floor(spts.length/2)];
      const ratio = Math.abs(secMedian) / Math.max(Math.abs(primaryMedian), 0.001);
      if (ratio > 10 || ratio < 0.1) return; // Skip if scale is too different
      let sp = spts;
      if (sp.length > 400) { const yr = {}; sp.forEach(p => { const y = p.date_value.substring(0,4); if(!yr[y]) yr[y]=p; }); sp = Object.values(yr); }
      const col = COLORS[(idx + 1) % COLORS.length];
      svg.append('path').datum(sp).attr('clip-path','url(#chart-clip-'+indicatorId+')').attr('fill','none').attr('stroke',col).attr('stroke-width',1.2).attr('stroke-opacity',0.7)
        .attr('d', d3.line().x(d => x(parseDate(d))).y(d => y(d.value)).curve(d3.curveMonotoneX));
    });

    // Hover tooltip
    const tooltip = svg.append('g').style('display', 'none');
    tooltip.append('line').attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#e04040').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    tooltip.append('circle').attr('r', 5).attr('fill', '#e04040');
    const tipText = tooltip.append('text').attr('fill', '#f0f0f5').attr('font-family', "'JetBrains Mono'").attr('font-size', '12px');

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'transparent')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const date = x.invert(mx);
        const bisect = d3.bisector(d => parseDate(d)).left;
        const i = Math.min(bisect(pts, date), pts.length - 1);
        const d = pts[i];
        tooltip.style('display', null);
        tooltip.select('line').attr('x1', x(parseDate(d))).attr('x2', x(parseDate(d)));
        tooltip.select('circle').attr('cx', x(parseDate(d))).attr('cy', y(d.value));
        tipText.attr('x', x(parseDate(d)) + 10).attr('y', m.t + 15).text(`${d.date_value.substring(0,4)}: ${d.value.toFixed(1)}`);
      })
      .on('mouseleave', () => tooltip.style('display', 'none'));

  }, [data, seriesId, timeRange]);
  return <svg ref={ref} viewBox="0 0 900 360" className="full-chart" />;
}

function IndicatorPage({ indicatorData, loading, error }) {
  const { id } = useParams();
  const [timeRange, setTimeRange] = useState('all');
  const meta = META[id];
  const data = indicatorData[id];

  if (!meta) return <div className="app"><p>Indicator not found.</p></div>;

  return (
    <div className="app indicator-page">
      <div className="indicator-methodology-note" style={{margin:'0 0 16px',padding:'10px 14px',borderLeft:'3px solid rgba(96,144,192,0.4)',font:'400 11px var(--font-mono)',color:'var(--text-muted)',lineHeight:1.5}}>
        All data on this page traces to a publicly available primary source. Transformations are documented in the <a href="/methodology" style={{color:'var(--text-secondary)'}}>Methodology</a>. Raw data is available via the <a href="/api-docs" style={{color:'var(--text-secondary)'}}>API</a>.
      </div>
      

      <header className="indicator-header">
        <span className="section-label">{meta.source}</span>
        <h1 className="indicator-page-title">{meta.title}</h1>
        <div className="indicator-hero-number">
          <span className="indicator-big-number">{meta.number}</span>
          <span className="indicator-number-context">{meta.numberContext}</span>
        </div>
      </header>

      {data && (
        <section className="chart-section">
          <div className="time-range-selector">
            {['10yr','25yr','all'].map(r => (
              <button key={r} className={'time-btn'+(timeRange===r?' time-btn-active':'')} onClick={()=>setTimeRange(r)}>
                {r === 'all' ? 'All Data' : r === '25yr' ? '25 Years' : '10 Years'}
              </button>
            ))}
          </div>
          <FullChart data={data} seriesId={meta.series} indicatorId={id} timeRange={timeRange} />
          <div className="chart-meta">
            <span>{data.record_count} observations</span>
            <span>Source: {meta.source}</span>
          </div>
          {data && data.data && (() => {
            let pts = data.data.filter(d => d.series_id === meta.series && d.value != null);
            if (!pts.length) {
              const sc = {}; data.data.forEach(d => { if(d.value!=null) sc[d.series_id]=(sc[d.series_id]||0)+1; });
              const b = Object.entries(sc).sort((a,b)=>b[1]-a[1])[0];
              if(b) pts = data.data.filter(d=>d.series_id===b[0]&&d.value!=null);
            }
            if (pts.length < 10) return null;
            const recent = pts.slice(-5);
            const prior = pts.slice(-10, -5);
            if (recent.length < 3 || prior.length < 3) return null;
            const recentChange = (recent[recent.length-1].value - recent[0].value) / Math.abs(recent[0].value) * 100;
            const priorChange = (prior[prior.length-1].value - prior[0].value) / Math.abs(prior[0].value) * 100;
            const accelerating = Math.abs(recentChange) > Math.abs(priorChange) * 1.2;
            const direction = recentChange > 0 ? 'increasing' : 'decreasing';
            return (
              <div className="acceleration-box">
                <span className="acceleration-label">Rate of Change Analysis</span>
                <div className="acceleration-detail">
                  <span>Recent period: <strong style={{color: Math.abs(recentChange) > Math.abs(priorChange) ? 'var(--red)' : 'var(--green)'}}>{recentChange > 0 ? '+' : ''}{recentChange.toFixed(1)}%</strong></span>
                  <span>Prior period: <strong>{priorChange > 0 ? '+' : ''}{priorChange.toFixed(1)}%</strong></span>
                  <span className={'acceleration-status ' + (accelerating ? 'accel-warning' : 'accel-stable')}>
                    {accelerating ? '⚠ Rate of change is accelerating' : '✓ Rate of change is stable or decelerating'}
                  </span>
                </div>
              </div>
            );
          })()}
          <div className="chart-actions">
            <button className="share-btn" onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                navigator.share({title: meta.title + ' — AUGUR', url: url});
              } else {
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard');
              }
            }}>Share ↗</button>
            <button className="share-btn" onClick={() => {
              const svg = document.querySelector('.full-chart');
              if (!svg) return;
              const svgData = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement('canvas');
              canvas.width = 1800; canvas.height = 720;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#080810';
              ctx.fillRect(0, 0, 1800, 720);
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 1800, 720);
                ctx.fillStyle = '#707088';
                ctx.font = '14px monospace';
                ctx.fillText('AUGUR · ' + meta.title + ' · augur-index.vercel.app', 20, 700);
                const a = document.createElement('a');
                a.download = id + '_augur_chart.png';
                a.href = canvas.toDataURL('image/png');
                a.click();
              };
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            }}>Export PNG ↓</button>
          </div>
          {data.data && (() => {
            const sm = {}; data.data.forEach(d => { if(d.value!=null) { if(!sm[d.series_id]) sm[d.series_id]=0; sm[d.series_id]++; }});
            const series = Object.entries(sm).filter(([k,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,6);
            const COLORS = ['#e04040','#40c080','#e0a030','#5080c0','#c060a0','#60c0c0'];
            return series.length > 1 ? (
              <div className="series-legend">
                {series.map(([sid,count],i) => (
                  <span key={sid} className="legend-item">
                    <span className="legend-dot" style={{background:COLORS[i%COLORS.length]}} />
                    <span className="legend-label">{SERIES_NAMES[sid] || sid.replace(/_/g,' ')}</span>
                    <span className="legend-count">{count}</span>
                  </span>
                ))}
              </div>
            ) : null;
          })()}
        </section>
      )}

      <div className="indicator-content">
        <section className="indicator-section">
          <h2 className="section-title">What this measures</h2>
          <p>{meta.what}</p>
        </section>

        <section className="indicator-section">
          <h2 className="section-title">Why it matters</h2>
          <p>{meta.why}</p>
        </section>

        {meta.practical && (
          <section className="indicator-section">
            <h2 className="section-title">What this means practically</h2>
            <p className="practical-text">{meta.practical}</p>
          </section>
        )}

        {meta.crossCountry && (
          <section className="indicator-section">
            <h2 className="section-title">What happened elsewhere</h2>
            <p className="cross-country-intro">Countries and historical cases that reached similar levels on this indicator.</p>
            <div className="cross-country-list">
              {meta.crossCountry.map((cc, i) => (
                <div className="cross-country-card" key={i}>
                  <div className="cc-header">
                    <span className="cc-country">{cc.country}</span>
                    {cc.value && <span className="cc-value">{cc.value}</span>}
                    <span className="cc-year">{cc.year}</span>
                  </div>
                  <p className="cc-outcome">{cc.outcome}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {meta.benchmarks && (
          <section className="indicator-section">
            <h2 className="section-title">Historical Benchmarks</h2>
            <div className="benchmarks-list">
              {meta.benchmarks.map((b, i) => (
                <div className={'benchmark-row' + (b.current ? ' benchmark-current' : '')} key={i}>
                  <span className="benchmark-dot" style={{background: b.color}} />
                  <span className="benchmark-label">{b.label}</span>
                  <span className="benchmark-value" style={{color: b.color}}>{typeof b.value === 'number' ? b.value.toFixed(1) : b.value}</span>
                </div>
              ))}
            </div>
            {meta.thresholds && meta.thresholds.map((t, i) => (
              <div className="threshold-note" key={i}>
                <span className="threshold-icon">▶</span>
                <span className="threshold-text">{t.label}</span>
              </div>
            ))}
          </section>
        )}

        <section className="indicator-section">
          <h2 className="section-title">Methodology</h2>
          <p>{meta.methodology}</p>
          <a href={meta.sourceUrl} className="source-link" target="_blank" rel="noopener noreferrer">
            View raw data at source →
          </a>
          {data && data.data && (
            <button className="export-btn" style={{marginLeft:"20px"}} onClick={() => {
              const rows = [['date','series','value','unit']];
              data.data.forEach(d => rows.push([d.date_value, d.series_id, d.value, d.unit || '']));
              const csv = rows.map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], {type:'text/csv'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = id + '_augur_data.csv'; a.click();
            }}>
              Download CSV ↓
            </button>
          )}
        </section>
      </div>

      <footer className="dashboard-footer">
        <p className="footer-methodology">
          Every number on this page traces directly to a publicly available primary source.
        </p>
      </footer>
    </div>
  );
}

export default IndicatorPage;
