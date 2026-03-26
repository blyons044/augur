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
      yearlyData[ind.id + '_' + ind.series] = byYear;
    });
    const allYears = new Set();
    Object.values(yearlyData).forEach(yd => Object.keys(yd).forEach(y => allYears.add(parseInt(y))));
    const years = [...allYears].sort();
    const mat = [];
    INDICATORS.forEach((ind1, i) => {
      const row = [];
      INDICATORS.forEach((ind2, j) => {
        if (i === j) { row.push(1); return; }
        const yd1 = yearlyData[ind1.id + '_' + ind1.series] || {};
        const yd2 = yearlyData[ind2.id + '_' + ind2.series] || {};
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
    if (val === 1) return 'rgba(160, 160, 180, 0.1)';
    const abs = Math.abs(val);
    if (val > 0) return 'rgba(224, 64, 64, ' + (abs * 0.5) + ')';
    return 'rgba(64, 192, 128, ' + (abs * 0.5) + ')';
  }

  function getStrengthLabel(val) {
    const abs = Math.abs(val);
    if (abs > 0.9) return 'Very strong';
    if (abs > 0.7) return 'Strong';
    if (abs > 0.5) return 'Moderate';
    if (abs > 0.3) return 'Weak';
    return 'Very weak';
  }

  const PAIR_CONTEXT = {
    'Polarization+Inst. Trust': 'When people lose trust in institutions, they retreat to partisan identity as their primary political framework. The collapse of institutional legitimacy removes the shared ground that makes compromise possible.',
    'Inst. Trust+Polarization': 'When people lose trust in institutions, they retreat to partisan identity as their primary political framework. The collapse of institutional legitimacy removes the shared ground that makes compromise possible.',
    'Debt/GDP+Wealth Ineq.': 'Government borrowing increasingly finances returns to asset holders (through bond interest and monetary policy) while costs are distributed across the tax base. Rising debt and rising wealth concentration have reinforced each other in every documented case.',
    'Wealth Ineq.+Debt/GDP': 'Government borrowing increasingly finances returns to asset holders (through bond interest and monetary policy) while costs are distributed across the tax base. Rising debt and rising wealth concentration have reinforced each other in every documented case.',
    'Media Trust+Polarization': 'When shared information sources collapse, people sort into separate factual realities. Without agreed-upon facts, political compromise becomes structurally impossible. Every historical period of extreme polarization was preceded by media fragmentation.',
    'Polarization+Media Trust': 'When shared information sources collapse, people sort into separate factual realities. Without agreed-upon facts, political compromise becomes structurally impossible. Every historical period of extreme polarization was preceded by media fragmentation.',
    'Wealth Ineq.+Inst. Trust': 'When people feel the economic system no longer serves them, they stop trusting the institutions that maintain it. This feedback loop between concentration and delegitimization appears in every major civilizational transition.',
    'Inst. Trust+Wealth Ineq.': 'When people feel the economic system no longer serves them, they stop trusting the institutions that maintain it. This feedback loop between concentration and delegitimization appears in every major civilizational transition.',
    'CPI+Debt/GDP': 'Higher government debt often leads to monetary expansion to service that debt, which drives inflation. Alternatively, both can be symptoms of the same underlying fiscal stress.',
    'Debt/GDP+CPI': 'Higher government debt often leads to monetary expansion to service that debt, which drives inflation. Alternatively, both can be symptoms of the same underlying fiscal stress.',
    'Overdose Deaths+Wealth Ineq.': 'Deaths of despair concentrate in communities that experienced the sharpest economic decline. As wealth concentrates, the communities left behind show rising mortality from drugs, alcohol, and suicide. This is the human cost of structural inequality.',
    'Wealth Ineq.+Overdose Deaths': 'Deaths of despair concentrate in communities that experienced the sharpest economic decline. As wealth concentrates, the communities left behind show rising mortality from drugs, alcohol, and suicide. This is the human cost of structural inequality.',
    'Overdose Deaths+Inst. Trust': 'Communities with the highest overdose rates also show the lowest institutional trust. When systems fail people, they stop believing in those systems and self-medicate the consequences.',
    'Inst. Trust+Overdose Deaths': 'Communities with the highest overdose rates also show the lowest institutional trust. When systems fail people, they stop believing in those systems and self-medicate the consequences.',
    'Home Price+Wealth Ineq.': 'Rising home prices transfer wealth from buyers (typically younger, less wealthy) to owners (typically older, wealthier). Housing becomes a wealth concentration mechanism rather than a path to the middle class.',
    'Wealth Ineq.+Home Price': 'Rising home prices transfer wealth from buyers (typically younger, less wealthy) to owners (typically older, wealthier). Housing becomes a wealth concentration mechanism rather than a path to the middle class.',
    'Home Price+CPI': 'Housing costs are a major component of inflation. When home prices rise faster than wages, the CPI follows, but the lived experience of inflation is worse than the headline number suggests.',
    'CPI+Home Price': 'Housing costs are a major component of inflation. When home prices rise faster than wages, the CPI follows, but the lived experience of inflation is worse than the headline number suggests.',
    'Savings Rate+Debt/GDP': 'As government debt rises and real wages stagnate, household savings decline. People draw down savings to maintain living standards, making them more vulnerable to economic shocks.',
    'Debt/GDP+Savings Rate': 'As government debt rises and real wages stagnate, household savings decline. People draw down savings to maintain living standards, making them more vulnerable to economic shocks.',
    'Unemployment+Overdose Deaths': 'Unemployment and overdose deaths often move together, but the relationship is complicated. Economic despair drives substance abuse, but overdose deaths continued rising even as unemployment fell, suggesting deeper structural damage.',
    'Overdose Deaths+Unemployment': 'Unemployment and overdose deaths often move together, but the relationship is complicated. Economic despair drives substance abuse, but overdose deaths continued rising even as unemployment fell, suggesting deeper structural damage.',
    'Media Trust+Inst. Trust': 'Media and institutional trust have collapsed together. When people distrust the press, they lose the mechanism through which institutional accountability is maintained. Without accountability, institutional trust erodes further.',
    'Inst. Trust+Media Trust': 'Media and institutional trust have collapsed together. When people distrust the press, they lose the mechanism through which institutional accountability is maintained. Without accountability, institutional trust erodes further.',
  };

  const insights = [];
  if (matrix) {
    for (let i = 0; i < INDICATORS.length; i++) {
      for (let j = i + 1; j < INDICATORS.length; j++) {
        const val = matrix[i][j];
        if (val !== null && Math.abs(val) > 0.5) {
          const direction = val > 0 ? 'move together' : 'move inversely';
          const pairKey = INDICATORS[i].name + '+' + INDICATORS[j].name;
          let meaning = PAIR_CONTEXT[pairKey] || '';
          if (!meaning) {
            if (val > 0.7) {
              meaning = 'When ' + INDICATORS[i].name + ' rises, ' + INDICATORS[j].name + ' tends to rise with it. This suggests shared structural drivers.';
            } else if (val < -0.7) {
              meaning = 'When ' + INDICATORS[i].name + ' rises, ' + INDICATORS[j].name + ' tends to fall. This suggests a structural tradeoff or feedback loop.';
            } else if (val > 0) {
              meaning = 'These indicators show a moderate tendency to move in the same direction.';
            } else {
              meaning = 'These indicators show a moderate tendency to move in opposite directions.';
            }
          }
          insights.push({
            ind1: INDICATORS[i].name, ind2: INDICATORS[j].name,
            corr: val, direction, meaning,
            strength: getStrengthLabel(val),
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
        <h1 className="indicator-page-title">How the indicators connect</h1>
        <p className="section-body-intro" style={{maxWidth: '640px'}}>
          These 11 indicators don't move independently. When one shifts, others
          tend to follow. Red means they move together. Green means they move
          in opposite directions. Stronger color means stronger connection.
        </p>
      </header>

      {matrix ? (
        <>
          {insights.length > 0 && (
            <section className="corr-insights">
              <h3 className="empire-section-title">Strongest connections in the data</h3>
              <div className="insights-list">
                {insights.slice(0, 9).map((ins, i) => (
                  <div className="insight-card" key={i}>
                    <div className="insight-pair">
                      <span className="insight-ind">{ins.ind1}</span>
                      <span className="insight-connector" style={{color: ins.corr > 0 ? 'var(--red)' : 'var(--green)'}}>
                        {ins.corr > 0 ? '\u2194' : '\u21C4'}
                      </span>
                      <span className="insight-ind">{ins.ind2}</span>
                    </div>
                    <div className="insight-bar-container">
                      <div className="insight-bar" style={{
                        width: Math.abs(ins.corr) * 100 + '%',
                        background: ins.corr > 0 ? 'var(--red)' : 'var(--green)',
                        opacity: 0.6 + Math.abs(ins.corr) * 0.4
                      }} />
                    </div>
                    <div className="insight-meta">
                      <span className="insight-strength" style={{color: ins.corr > 0 ? 'var(--red)' : 'var(--green)'}}>
                        {ins.strength} {ins.direction}
                      </span>
                      <span className="insight-corr">r = {ins.corr > 0 ? '+' : ''}{ins.corr.toFixed(2)}</span>
                    </div>
                    <p className="insight-meaning">{ins.meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="corr-matrix-section">
            <h3 className="empire-section-title">Full correlation matrix</h3>
            <p className="corr-matrix-explainer">
              Each cell shows how strongly two indicators are connected.
              Values range from -1 (perfectly opposite) to +1 (perfectly aligned).
              Hover over any cell for details.
            </p>
            <div className="corr-matrix-container">
              <div className="corr-matrix" style={{display:'grid', gridTemplateColumns: '90px repeat(11, 1fr)', gap: '2px'}}>
                <div />
                {INDICATORS.map(ind => (
                  <div className="corr-header" key={ind.short}>{ind.short}</div>
                ))}
                {INDICATORS.map((ind1, i) => (
                  <React.Fragment key={ind1.short + i}>
                    <div className="corr-row-label">{ind1.short}</div>
                    {INDICATORS.map((ind2, j) => {
                      const val = matrix[i][j];
                      return (
                        <div className="corr-cell" key={ind2.short + j}
                          style={{background: getCellColor(val)}}
                          title={val !== null ? ind1.name + ' vs ' + ind2.name + ': r = ' + (val === 1 ? '1.00 (same indicator)' : val.toFixed(3) + ' (' + getStrengthLabel(val) + ')') : 'Insufficient data'}>
                          <span className="corr-value">{val !== null && val !== 1 ? val.toFixed(2) : (val === 1 ? '\u2014' : '')}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          <section className="corr-reading">
            <h3 className="empire-section-title">How to read this</h3>
            <div className="reading-grid">
              <div className="reading-card">
                <span className="reading-value" style={{color:'var(--red)'}}>+0.9</span>
                <p className="reading-text">Very strong positive. These indicators almost always move in the same direction. When one goes up, the other goes up.</p>
              </div>
              <div className="reading-card">
                <span className="reading-value" style={{color:'var(--red)'}}>+0.5</span>
                <p className="reading-text">Moderate positive. These indicators tend to move together, but not always. Other factors are at play.</p>
              </div>
              <div className="reading-card">
                <span className="reading-value" style={{color:'var(--text-muted)'}}>0.0</span>
                <p className="reading-text">No relationship. These indicators move independently of each other.</p>
              </div>
              <div className="reading-card">
                <span className="reading-value" style={{color:'var(--green)'}}>-0.7</span>
                <p className="reading-text">Strong negative. When one goes up, the other tends to go down. This suggests a structural tradeoff.</p>
              </div>
            </div>
          </section>

          <section className="corr-methodology">
            <h3 className="empire-section-title">Methodology</h3>
            <p className="section-body-intro">
              Pearson correlations across common annual observations. Minimum 5
              overlapping years required. Correlation identifies patterns, not causes.
              Two indicators moving together doesn't mean one causes the other.

              Important caveat: many of these indicators have been trending in the same
              direction for decades. Two things that both trend upward will show high
              correlation even if they're unrelated. The correlations here identify
              co-movement, not necessarily structural connection. The contextual
              explanations above draw on historical research, not just the statistical
              relationship.
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
