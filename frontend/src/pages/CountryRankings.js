import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://augur.up.railway.app';

const COUNTRIES = {
  USA:'United States', GBR:'United Kingdom', DEU:'Germany', FRA:'France',
  JPN:'Japan', CHN:'China', IND:'India', BRA:'Brazil', RUS:'Russia',
  KOR:'South Korea', CAN:'Canada', AUS:'Australia', ITA:'Italy',
  MEX:'Mexico', IDN:'Indonesia', TUR:'Turkey', ZAF:'South Africa',
  ARG:'Argentina', NGA:'Nigeria', SWE:'Sweden'
};

const FLAGS = {
  USA:'\u{1F1FA}\u{1F1F8}', GBR:'\u{1F1EC}\u{1F1E7}', DEU:'\u{1F1E9}\u{1F1EA}', FRA:'\u{1F1EB}\u{1F1F7}',
  JPN:'\u{1F1EF}\u{1F1F5}', CHN:'\u{1F1E8}\u{1F1F3}', IND:'\u{1F1EE}\u{1F1F3}', BRA:'\u{1F1E7}\u{1F1F7}',
  RUS:'\u{1F1F7}\u{1F1FA}', KOR:'\u{1F1F0}\u{1F1F7}', CAN:'\u{1F1E8}\u{1F1E6}', AUS:'\u{1F1E6}\u{1F1FA}',
  ITA:'\u{1F1EE}\u{1F1F9}', MEX:'\u{1F1F2}\u{1F1FD}', IDN:'\u{1F1EE}\u{1F1E9}', TUR:'\u{1F1F9}\u{1F1F7}',
  ZAF:'\u{1F1FF}\u{1F1E6}', ARG:'\u{1F1E6}\u{1F1F7}', NGA:'\u{1F1F3}\u{1F1EC}', SWE:'\u{1F1F8}\u{1F1EA}'
};

const METRICS = [
  { id:'gdp_ppp', name:'GDP (PPP)', indicator:'geopolitical_standing', series:'NY.GDP.MKTP.PP.CD', format: v=>'$'+(v/1e12).toFixed(1)+'T', desc:'Economic output adjusted for purchasing power', higherIs:'stronger', sortDir:1 },
  { id:'military', name:'Military Spending (% GDP)', indicator:'geopolitical_standing', series:'MS.MIL.XPND.GD.ZS', format: v=>v.toFixed(1)+'%', desc:'Defense expenditure as share of economy', higherIs:'higher burden', sortDir:1 },
  { id:'gini', name:'Gini Index', indicator:'wealth_inequality', series:'SI.POV.GINI', format: v=>v.toFixed(1), desc:'Income inequality (0 = perfect equality, 100 = maximum)', higherIs:'more unequal', sortDir:1 },
];

function CountryRankings() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('gdp_ppp');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = {};
        for (const cc of Object.keys(COUNTRIES)) {
          try {
            const [geo, ineq] = await Promise.all([
              axios.get(API_BASE+'/api/indicators/geopolitical_standing?country_code='+cc),
              axios.get(API_BASE+'/api/indicators/wealth_inequality?country_code='+cc).catch(()=>null),
            ]);
            results[cc] = { geo: geo.data, ineq: ineq ? ineq.data : null };
          } catch(e) { results[cc] = null; }
        }
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
      <p className="loading-text">Loading cross-country data for 20 nations...</p>
    </div>
  );

  const ranked = getRankedCountries();
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
          20 nations ranked across structural indicators. Same data sources,
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
