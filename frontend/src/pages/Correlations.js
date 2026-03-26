import React, { useState, useEffect } from 'react';

const INDICATORS = [
  { id: 'political_polarization', name: 'Polarization', series: 'dw_nominate_House_200', short: 'POL' },
  { id: 'public_trust', name: 'Inst. Trust', series: 'gallup_congress', short: 'TRU' },
  { id: 'wealth_inequality', name: 'Wealth Ineq.', series: 'WFRBST01134', short: 'WLT' },
  { id: 'debt_to_gdp', name: 'Debt/GDP', series: 'GFDEGDQ188S', short: 'DBT' },
  { id: 'currency_debasement', name: 'CPI', series: 'CPIAUCSL', short: 'CPI' },
  { id: 'media_fragmentation', name: 'Media Trust', series: 'gallup_news_trust', short: 'MED' },
  { id: 'elite_overproduction', name: 'Unemployment', series: 'UNRATE', short: 'UNE' },
  { id: 'civil_unrest', name: 'Overdose Deaths', series: 'drug_overdose_deaths', short: 'OD' },
  { id: 'middle_class_decline', name: 'Home Price', series: 'MSPUS', short: 'HOM' },
  { id: 'middle_class_decline', name: 'Savings Rate', series: 'PSAVERT', short: 'SAV' },
  { id: 'infrastructure_decay', name: 'Ind. Production', series: 'INDPRO', short: 'IND' },
];

function computeCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 5) return null;
  const xs = x.slice(-n), ys = y.slice(-n);
  const mx = xs.reduce((a,b) => a+b, 0) / n;
  const my = ys.reduce((a,b) => a+b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function Correlations({ indicatorData }) {
  const [matrix, setMatrix] = useState(null);

  useEffect(() => {
    if (!indicatorData) return;
    const yearlyData = {};
    INDICATORS.forEach(ind => {
      const d = indicatorData[ind.id];
      if (!d || !d.data) return;
      const byYear = {};
      d.data.filter(p => p.series_id === ind.series && p.value != null).forEach(p => {
        byYear[parseInt(p.date_value.substring(0, 4))] = p.value;
      });
      yearlyData[ind.id] = byYear;
    });
    const allYears = new Set();
    Object.values(yearlyData).forEach(yd => Object.keys(yd).forEach(y => allYears.add(parseInt(y))));
    const years = [...allYears].sort();
    const mat = [];
    INDICATORS.forEach((ind1, i) => {
      const row = [];
      INDICATORS.forEach((ind2, j) => {
        if (i === j) { row.push(1); return; }
        const yd1 = yearlyData[ind1.id] || {};
        const yd2 = yearlyData[ind2.id] || {};
        const common = years.filter(y => yd1[y] !== undefined && yd2[y] !== undefined);
        if (common.length < 5) { row.push(null); return; }
        row.push(computeCorrelation(common.map(y => yd1[y]), common.map(y => yd2[y])));
      });
      mat.push(row);
    });
    setMatrix(mat);
  }, [indicatorData]);

  function getCellColor(val) {
    if (val === null) return 'var(--bg-accent)';
    if (val === 1) return 'rgba(160, 160, 180, 0.15)';
    const abs = Math.abs(val);
    if (val > 0) return 'rgba(224, 64, 64, ' + (abs * 0.5) + ')';
    return 'rgba(64, 192, 128, ' + (abs * 0.5) + ')';
  }

  const insights = [];
  if (matrix) {
    for (let i = 0; i < INDICATORS.length; i++) {
      for (let j = i + 1; j < INDICATORS.length; j++) {
        const val = matrix[i][j];
        if (val !== null && Math.abs(val) > 0.7) {
          insights.push({
            ind1: INDICATORS[i].name, ind2: INDICATORS[j].name, corr: val,
            direction: val > 0 ? 'move together' : 'move inversely',
            strength: Math.abs(val) > 0.9 ? 'Very strong' : 'Strong',
          });
        }
      }
    }
    insights.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  }

  return (
    <div className="app correlations-page">
      <header className="indicator-header">
        <span className="section-label">Structural Analysis</span>
        <h1 className="indicator-page-title">Indicator Correlations</h1>
        <p className="section-body-intro" style={{maxWidth: '640px'}}>
          How do Augur's indicators relate to each other? This matrix shows
          Pearson correlations computed over common time periods.
          Strong correlations suggest structural connections between dimensions of stress.
        </p>
      </header>

      {matrix ? (
        <>
          <div className="corr-matrix-container">
            <div className="corr-matrix" style={{display:'grid', gridTemplateColumns: '80px repeat(11, 1fr)', gap: '2px'}}>
              <div />
              {INDICATORS.map(ind => (
                <div className="corr-header" key={ind.id}>{ind.short}</div>
              ))}
              {INDICATORS.map((ind1, i) => (
                <React.Fragment key={ind1.id}>
                  <div className="corr-row-label">{ind1.short}</div>
                  {INDICATORS.map((ind2, j) => {
                    const val = matrix[i][j];
                    return (
                      <div className="corr-cell" key={ind2.id}
                        style={{background: getCellColor(val)}}
                        title={ind1.name + ' vs ' + ind2.name + ': ' + (val !== null ? val.toFixed(3) : 'N/A')}>
                        <span className="corr-value">{val !== null && val !== 1 ? val.toFixed(2) : (val === 1 ? '\u2014' : '')}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="corr-legend">
              <span style={{color: '#e04040'}}>Red = positive (move together)</span>
              <span style={{color: '#40c080'}}>Green = negative (move inversely)</span>
            </div>
          </div>

          {insights.length > 0 && (
            <section className="corr-insights">
              <h3 className="empire-section-title">Key Findings</h3>
              <div className="insights-list">
                {insights.slice(0, 8).map((ins, i) => (
                  <div className="insight-card" key={i}>
                    <div className="insight-header">
                      <span className="insight-strength" style={{color: ins.corr > 0 ? 'var(--red)' : 'var(--green)'}}>{ins.strength}</span>
                      <span className="insight-corr">{ins.corr > 0 ? '+' : ''}{ins.corr.toFixed(3)}</span>
                    </div>
                    <p className="insight-text">
                      <strong>{ins.ind1}</strong> and <strong>{ins.ind2}</strong> {ins.direction}.
                      {Math.abs(ins.corr) > 0.85 ? ' This suggests shared structural drivers.' : ' This relationship warrants further investigation.'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="corr-methodology">
            <h3 className="empire-section-title">Methodology Note</h3>
            <p className="section-body-intro">
              Pearson correlations across common annual observations. Minimum 5 overlapping years required.
              Correlation does not imply causation. These relationships identify structural connections, not causal claims.
            </p>
          </section>
        </>
      ) : (
        <p className="loading-text">Computing correlations...</p>
      )}
    </div>
  );
}

export default Correlations;
