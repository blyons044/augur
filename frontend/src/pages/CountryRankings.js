import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://augur.up.railway.app';

const COUNTRIES = {
  USA:'United States', GBR:'United Kingdom', DEU:'Germany', FRA:'France',
  JPN:'Japan', CHN:'China', IND:'India', BRA:'Brazil', RUS:'Russia',
  KOR:'South Korea', CAN:'Canada', AUS:'Australia', ITA:'Italy',
  MEX:'Mexico', IDN:'Indonesia', TUR:'Turkey', ZAF:'South Africa',
  ARG:'Argentina', NGA:'Nigeria', SWE:'Sweden',
  SAU:'Saudi Arabia', ARE:'UAE', ISR:'Israel', EGY:'Egypt',
  THA:'Thailand', VNM:'Vietnam', PHL:'Philippines', MYS:'Malaysia',
  SGP:'Singapore', NZL:'New Zealand', NOR:'Norway', DNK:'Denmark',
  FIN:'Finland', CHE:'Switzerland', NLD:'Netherlands', BEL:'Belgium',
  AUT:'Austria', POL:'Poland', CZE:'Czech Republic', GRC:'Greece',
  PRT:'Portugal', CHL:'Chile', COL:'Colombia', PER:'Peru',
  PAK:'Pakistan', BGD:'Bangladesh', KEN:'Kenya', ETH:'Ethiopia',
  IRN:'Iran', UKR:'Ukraine'
};

const FLAGS = {
  USA:'\u{1F1FA}\u{1F1F8}', GBR:'\u{1F1EC}\u{1F1E7}', DEU:'\u{1F1E9}\u{1F1EA}', FRA:'\u{1F1EB}\u{1F1F7}',
  JPN:'\u{1F1EF}\u{1F1F5}', CHN:'\u{1F1E8}\u{1F1F3}', IND:'\u{1F1EE}\u{1F1F3}', BRA:'\u{1F1E7}\u{1F1F7}',
  RUS:'\u{1F1F7}\u{1F1FA}', KOR:'\u{1F1F0}\u{1F1F7}', CAN:'\u{1F1E8}\u{1F1E6}', AUS:'\u{1F1E6}\u{1F1FA}',
  ITA:'\u{1F1EE}\u{1F1F9}', MEX:'\u{1F1F2}\u{1F1FD}', IDN:'\u{1F1EE}\u{1F1E9}', TUR:'\u{1F1F9}\u{1F1F7}',
  ZAF:'\u{1F1FF}\u{1F1E6}', ARG:'\u{1F1E6}\u{1F1F7}', NGA:'\u{1F1F3}\u{1F1EC}', SWE:'\u{1F1F8}\u{1F1EA}',
  SAU:'🇸🇦',  ARE:'🇦🇪',  ISR:'🇮🇱',  EGY:'🇪🇬',  THA:'🇹🇭',  VNM:'🇻🇳',  PHL:'🇵🇭',  MYS:'🇲🇾',  SGP:'🇸🇬',  NZL:'🇳🇿',  NOR:'🇳🇴',  DNK:'🇩🇰',  FIN:'🇫🇮',  CHE:'🇨🇭',  NLD:'🇳🇱',  BEL:'🇧🇪',  AUT:'🇦🇹',  POL:'🇵🇱',  CZE:'🇨🇿',  GRC:'🇬🇷',  PRT:'🇵🇹',  CHL:'🇨🇱',  COL:'🇨🇴',  PER:'🇵🇪',  PAK:'🇵🇰',  BGD:'🇧🇩',  KEN:'🇰🇪',  ETH:'🇪🇹',  IRN:'🇮🇷',  UKR:'🇺🇦',
};

const METRICS = [
  { id:'gdp_ppp', name:'GDP (PPP)', indicator:'geopolitical_standing', series:'NY.GDP.MKTP.PP.CD', format: v=>'$'+(v/1e12).toFixed(1)+'T', desc:'Economic output adjusted for purchasing power', higherIs:'stronger', sortDir:1 },
  { id:'gdp_pc', name:'GDP Per Capita', indicator:'geopolitical_standing', series:'NY.GDP.PCAP.PP.CD', format: v=>'$'+(v/1000).toFixed(1)+'K', desc:'GDP per person adjusted for purchasing power', higherIs:'wealthier', sortDir:1 },
  { id:'gini', name:'Gini Index', indicator:'wealth_inequality', series:'SI.POV.GINI', format: v=>v.toFixed(1), desc:'Income inequality (0 = perfect equality, 100 = maximum)', higherIs:'most equal first', sortDir:-1 },
  { id:'military', name:'Military (% GDP)', indicator:'geopolitical_standing', series:'MS.MIL.XPND.GD.ZS', format: v=>v.toFixed(1)+'%', desc:'Defense expenditure as share of economy', higherIs:'highest spending first', sortDir:1 },
  { id:'health', name:'Healthcare (% GDP)', indicator:'geopolitical_standing', series:'SH.XPD.CHEX.GD.ZS', format: v=>v.toFixed(1)+'%', desc:'Current health expenditure as share of GDP (higher spending does not necessarily mean better outcomes)', higherIs:'highest spending first', sortDir:1 },
  { id:'education', name:'Education (% GDP)', indicator:'geopolitical_standing', series:'SE.XPD.TOTL.GD.ZS', format: v=>v.toFixed(1)+'%', desc:'Government education spending as share of GDP', higherIs:'higher investment', sortDir:1 },
  { id:'life', name:'Life Expectancy', indicator:'geopolitical_standing', series:'SP.DYN.LE00.IN', format: v=>v.toFixed(1)+' yrs', desc:'Life expectancy at birth in years', higherIs:'longer lived', sortDir:1 },
  { id:'unemployment', name:'Unemployment', indicator:'geopolitical_standing', series:'SL.UEM.TOTL.ZS', format: v=>v.toFixed(1)+'%', desc:'Unemployment rate as percentage of labor force', higherIs:'lowest unemployment first', sortDir:-1 },
  { id:'trade', name:'Trade (% GDP)', indicator:'geopolitical_standing', series:'NE.TRD.GNFS.ZS', format: v=>v.toFixed(1)+'%', desc:'Total trade as share of GDP', higherIs:'more open', sortDir:1 },
  { id:'savings', name:'Gross Savings (% GDP)', indicator:'geopolitical_standing', series:'NY.GNS.ICTR.ZS', format: v=>v.toFixed(1)+'%', desc:'Gross national savings rate', higherIs:'higher savings', sortDir:1 },
  { id:'fdi', name:'FDI Inflows (% GDP)', indicator:'geopolitical_standing', series:'BX.KLT.DINV.WD.GD.ZS', format: v=>v.toFixed(1)+'%', desc:'Foreign direct investment as share of GDP', higherIs:'more investment', sortDir:1 },
  { id:'internet', name:'Internet Users (%)', indicator:'geopolitical_standing', series:'IT.NET.USER.ZS', format: v=>v.toFixed(1)+'%', desc:'Population using the internet', higherIs:'more connected', sortDir:1 },
  { id:'urban', name:'Urbanization (%)', indicator:'geopolitical_standing', series:'SP.URB.TOTL.IN.ZS', format: v=>v.toFixed(1)+'%', desc:'Urban population as share of total (neutral metric)', higherIs:'most urbanized first', sortDir:1 },
  { id:'aging', name:'Population 65+ (%)', indicator:'geopolitical_standing', series:'SP.POP.65UP.TO.ZS', format: v=>v.toFixed(1)+'%', desc:'Share of population aged 65 and older (neutral metric, indicates demographic aging)', higherIs:'oldest populations first', sortDir:1 },
  { id:'corruption', name:'Corruption Control', indicator:'geopolitical_standing', series:'CC.EST', format: v=>v.toFixed(2), desc:'Control of corruption estimate (-2.5 to 2.5)', higherIs:'less corrupt', sortDir:1 },
  { id:'govt_eff', name:'Govt Effectiveness', indicator:'geopolitical_standing', series:'GE.EST', format: v=>v.toFixed(2), desc:'Government effectiveness estimate (-2.5 to 2.5)', higherIs:'more effective', sortDir:1 },
  { id:'pol_stability', name:'Political Stability', indicator:'geopolitical_standing', series:'PV.EST', format: v=>v.toFixed(2), desc:'Political stability and absence of violence (-2.5 to 2.5)', higherIs:'more stable', sortDir:1 },
  { id:'fertility', name:'Fertility Rate', indicator:'geopolitical_standing', series:'SP.DYN.TFRT.IN', format: v=>v.toFixed(2), desc:'Total fertility rate (replacement level is ~2.1 births per woman)', higherIs:'highest fertility first', sortDir:1 },
  { id:'freedom', name:'Freedom Score', indicator:'rule_of_law', series:'freedom_score', format: v=>v.toFixed(0)+'/100', desc:'Freedom House Freedom in the World score (0-100)', higherIs:'most free first', sortDir:1 },
  { id:'cpi', name:'Corruption Index', indicator:'rule_of_law', series:'cpi_score', format: v=>v.toFixed(0)+'/100', desc:'Transparency International Corruption Perceptions Index (higher = less corrupt)', higherIs:'least corrupt first', sortDir:1 },
  { id:'inflation', name:'Inflation Rate', indicator:'geopolitical_standing', series:'FP.CPI.TOTL.ZG', format: v=>v.toFixed(1)+'%', desc:'Consumer price inflation rate', higherIs:'lowest inflation first', sortDir:-1 },
];

function CountryRankings() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('gdp_ppp');
  const [error, setError] = useState(null);
  const [incomeFilter, setIncomeFilter] = useState('all');

  useEffect(() => {
    async function fetchAll() {
      try {
        const codes = Object.keys(COUNTRIES);
        const results = {};
        // Fetch all countries in parallel
        const promises = codes.map(async cc => {
          try {
            const [geo, ineq] = await Promise.all([
              axios.get(API_BASE+'/api/indicators/geopolitical_standing?country_code='+cc),
              axios.get(API_BASE+'/api/indicators/wealth_inequality?country_code='+cc).catch(()=>null),
            ]);
            results[cc] = { geo: geo.data, ineq: ineq ? ineq.data : null };
          } catch(e) { results[cc] = null; }
        });
        await Promise.all(promises);
        setData(results);
        setLoading(false);
      } catch(err) { setError(err.message); setLoading(false); }
    }
    fetchAll();
  }, []);

  const metric = METRICS.find(m => m.id === selectedMetric);

  function getLatestValue(cc) {
    const d = data[cc];
    if (!d) return null;
    const source = metric.indicator === 'wealth_inequality' ? d.ineq : d.geo;
    if (!source || !source.data) return null;
    const pts = source.data.filter(p => p.series_id === metric.series && p.value != null);
    if (!pts.length) return null;
    return pts[pts.length - 1];
  }

  function getRankedCountries() {
    const ranked = Object.keys(COUNTRIES).map(cc => {
      const latest = getLatestValue(cc);
      return { cc, value: latest ? latest.value : null, year: latest ? latest.date_value.substring(0,4) : null };
    }).filter(r => r.value != null);
    ranked.sort((a, b) => (b.value - a.value) * metric.sortDir);
    return ranked;
  }

  if (loading) return (
    <div className="loading-screen">
      <h1 className="augur-title">AUGUR</h1>
      <p className="loading-text" style={{marginBottom:'16px'}}>Loading cross-country data for 50 nations...</p>
      <div style={{width:'200px',height:'3px',background:'var(--bg-accent)',borderRadius:'2px',overflow:'hidden'}}>
        <div style={{width:'60%',height:'100%',background:'var(--red)',borderRadius:'2px',animation:'loadPulse 1.5s ease-in-out infinite'}} />
      </div>
      <style>{'@keyframes loadPulse { 0%{width:20%;opacity:0.5} 50%{width:80%;opacity:1} 100%{width:20%;opacity:0.5} }'}</style>
      <div style={{marginTop:'24px',padding:'12px 16px',background:'rgba(80,128,192,0.08)',border:'1px solid rgba(80,128,192,0.2)',borderRadius:'4px',font:'400 11px var(--font-mono)',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'500px',textAlign:'center'}}>
        <strong>International data only.</strong> Rankings use exclusively internationally comparable sources (World Bank, IMF, SIPRI). US-only indicators are excluded.
      </div>
    </div>
  );

  const allRanked = getRankedCountries();
  const INCOME_GROUPS = {USA:'High income',GBR:'High income',DEU:'High income',FRA:'High income',JPN:'High income',CHN:'Upper middle income',IND:'Lower middle income',BRA:'Upper middle income',RUS:'Upper middle income',KOR:'High income',CAN:'High income',AUS:'High income',ITA:'High income',MEX:'Upper middle income',IDN:'Lower middle income',TUR:'Upper middle income',ZAF:'Upper middle income',ARG:'Upper middle income',NGA:'Lower middle income',SWE:'High income',SAU:'High income',ARE:'High income',ISR:'High income',EGY:'Lower middle income',THA:'Upper middle income',VNM:'Lower middle income',PHL:'Lower middle income',MYS:'Upper middle income',SGP:'High income',NZL:'High income',NOR:'High income',DNK:'High income',FIN:'High income',CHE:'High income',NLD:'High income',BEL:'High income',AUT:'High income',POL:'High income',CZE:'High income',GRC:'High income',PRT:'High income',CHL:'High income',COL:'Upper middle income',PER:'Upper middle income',PAK:'Lower middle income',BGD:'Lower middle income',KEN:'Lower middle income',ETH:'Low income',IRN:'Lower middle income',UKR:'Lower middle income'};
  const ranked = incomeFilter === 'all' ? allRanked : allRanked.filter(r => INCOME_GROUPS[r.code] === incomeFilter);
  const maxVal = ranked.length ? Math.max(...ranked.map(r => Math.abs(r.value))) : 1;

  return (
    <div className="app rankings-page">
      <nav className="dashboard-nav">
        <Link to="/" className="nav-back">← Back to Augur</Link>
      </nav>
      <header className="indicator-header">
        <span className="section-label">Global Rankings</span>
        <h1 className="indicator-page-title">Country Comparison</h1>
        <p className="section-body-intro" style={{maxWidth:'640px'}}>
          50 nations ranked across structural indicators. Same data sources,
          same methodology, same political neutrality applied to every country.
        </p>
      </header>
      <div className="metric-selector">
        {METRICS.map(m => (
          <button key={m.id} className={'empire-tab '+(selectedMetric===m.id?'active':'')}
            onClick={()=>setSelectedMetric(m.id)}
            style={selectedMetric===m.id?{borderColor:'var(--red)',color:'var(--red)'}:{}}>
            {m.name}
          </button>
        ))}
      </div>
      <div className="metric-desc">
        <p>{metric.desc}</p>
        <span className="metric-note">Higher value = {metric.higherIs}</span>
      </div>
      <div className="rankings-table">
        {ranked.map((r, i) => {
          const isUS = r.cc === 'USA';
          const barWidth = (Math.abs(r.value) / maxVal) * 100;
          return (
            <div className={'ranking-row '+(isUS?'ranking-row-us':'')} key={r.cc}>
              <div className="ranking-rank">{i + 1}</div>
              <div className="ranking-flag">{FLAGS[r.cc]}</div>
              <div className="ranking-country">{COUNTRIES[r.cc]}</div>
              <div className="ranking-bar-container">
                <div className="ranking-bar" style={{width:barWidth+'%',background:isUS?'var(--red)':'var(--border-hover)',opacity:isUS?1:0.6}} />
              </div>
              <div className="ranking-value">{metric.format(r.value)}</div>
              <div className="ranking-year">{r.year}</div>
            </div>
          );
        })}
      </div>
      <div className="empire-cta">
        <Link to="/dashboard" className="hero-cta">View US Dashboard →</Link>
      </div>
      <footer className="dashboard-footer">
        <p className="footer-methodology">
          All country data sourced from the World Bank Open Data API. Identical methodology applied to every nation.
        </p>
      </footer>
    </div>
  );
}

export default CountryRankings;
