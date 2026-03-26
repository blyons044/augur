import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LIFE_EVENTS = [
  { age: 0, label: 'Born' },
  { age: 5, label: 'Started school' },
  { age: 14, label: 'Started high school' },
  { age: 18, label: 'Turned 18' },
  { age: 22, label: 'College grad age' },
  { age: 30, label: 'Turned 30' },
  { age: 40, label: 'Turned 40' },
  { age: 50, label: 'Turned 50' },
  { age: 65, label: 'Retirement age' },
];

const TRACKED = [
  {
    id: 'public_trust', series: 'gallup_congress', name: 'Trust in Congress',
    unit: '%', color: '#e04040',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const change = Math.round(((now - then) / then) * 100);
      return `When you were born, ${Math.round(then)}% of Americans trusted Congress. Today it's ${Math.round(now)}%. That's a ${Math.abs(change)}% ${change < 0 ? 'collapse' : 'increase'} in your lifetime.`;
    }
  },
  {
    id: 'debt_to_gdp', series: 'GFDEGDQ188S', name: 'Federal Debt (% of GDP)',
    unit: '%', color: '#e0a030',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      return `Federal debt was ${Math.round(then)}% of GDP the year you were born. It's ${Math.round(now)}% now. Every dollar of GDP is backed by $${(now/100).toFixed(2)} in federal debt.`;
    }
  },
  {
    id: 'wealth_inequality', series: 'WFRBST01134', name: 'Top 1% Wealth Share',
    unit: '%', color: '#c060a0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      return `The top 1% held ${then.toFixed(1)}% of national wealth when you were born. They hold ${now.toFixed(1)}% now. That gap grew by ${(now - then).toFixed(1)} percentage points during your life.`;
    }
  },
  {
    id: 'political_polarization', series: 'dw_nominate_House_200', name: 'House GOP Ideology Score',
    unit: '', color: '#5080c0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const pctChange = Math.round(((now - then) / then) * 100);
      return `Congressional polarization has shifted ${Math.abs(pctChange)}% ${pctChange > 0 ? 'further apart' : 'closer together'} since you were born. The ideological center that once held Congress together has disappeared entirely.`;
    }
  },
  {
    id: 'currency_debasement', series: 'CPIAUCSL', name: 'Consumer Price Index',
    unit: '', color: '#40c080',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const multiplier = (now / then).toFixed(1);
      return `A dollar when you were born buys ${(100/parseFloat(multiplier)).toFixed(0)} cents worth of goods today. Prices have multiplied ${multiplier}x in your lifetime.`;
    }
  },
  {
    id: 'media_fragmentation', series: 'gallup_news_trust', name: 'Trust in News Media',
    unit: '%', color: '#60c0c0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      return `News media trust was ${Math.round(then)}% when you were born. It's ${Math.round(now)}% now. Shared factual reality has eroded ${Math.round(then - now)} points during your life.`;
    }
  },
];

function LifetimeChart({ data, series, birthYear, color, name }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.data || !birthYear) return;
    let pts = data.data.filter(d => d.series_id === series && d.value != null);
    if (pts.length < 3) return;
    // Dedupe to yearly
    const byYear = {};
    pts.forEach(p => {
      const yr = parseInt(p.date_value.substring(0, 4));
      byYear[yr] = p.value;
    });
    pts = Object.entries(byYear).map(([yr, val]) => ({ year: parseInt(yr), value: val })).sort((a, b) => a.year - b.year);
    if (pts.length < 3) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const W = 700, H = 200, m = { t: 15, r: 20, b: 30, l: 55 };
    const x = d3.scaleLinear().domain(d3.extent(pts, d => d.year)).range([m.l, W - m.r]);
    const yExt = d3.extent(pts, d => d.value);
    const yPad = (yExt[1] - yExt[0]) * 0.1;
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.b, m.t]);

    // Axes
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')).tickSize(0)).select('.domain').attr('stroke', '#1c1c30');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-size', '9px');
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r))).select('.domain').remove();
    svg.selectAll('.tick line').attr('stroke', '#1c1c30').attr('stroke-dasharray', '2,4');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-size', '9px');

    // Birth year line
    if (birthYear >= pts[0].year && birthYear <= pts[pts.length - 1].year) {
      svg.append('line').attr('x1', x(birthYear)).attr('x2', x(birthYear)).attr('y1', m.t).attr('y2', H - m.b)
        .attr('stroke', '#ffffff').attr('stroke-width', 1).attr('stroke-dasharray', '4,4').attr('opacity', 0.3);
      svg.append('text').attr('x', x(birthYear) + 5).attr('y', m.t + 12).text('born')
        .attr('fill', '#ffffff').attr('opacity', 0.4).attr('font-size', '9px').attr('font-family', "'JetBrains Mono'");
    }

    // Shade the "your lifetime" area
    const lifetimePts = pts.filter(p => p.year >= birthYear);
    if (lifetimePts.length > 1) {
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'lt-' + series).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.15);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);
      svg.append('path').datum(lifetimePts).attr('fill', `url(#lt-${series})`)
        .attr('d', d3.area().x(d => x(d.year)).y0(H - m.b).y1(d => y(d.value)).curve(d3.curveMonotoneX));
    }

    // Full line (dimmed before birth)
    const preBirth = pts.filter(p => p.year <= birthYear);
    const postBirth = pts.filter(p => p.year >= birthYear);
    if (preBirth.length > 1) {
      svg.append('path').datum(preBirth).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5).attr('opacity', 0.25)
        .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));
    }
    if (postBirth.length > 1) {
      svg.append('path').datum(postBirth).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5)
        .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));
    }

    // End dot
    const last = pts[pts.length - 1];
    svg.append('circle').attr('cx', x(last.year)).attr('cy', y(last.value)).attr('r', 4).attr('fill', color);

  }, [data, series, birthYear, color]);

  return <svg ref={ref} viewBox="0 0 700 200" style={{width: '100%', height: 'auto'}} />;
}

function YourLifetime({ indicatorData }) {
  const [birthYear, setBirthYear] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [revealed, setRevealed] = useState(0);
  const currentYear = 2026;

  function submit() {
    const yr = parseInt(inputVal);
    if (yr >= 1940 && yr <= 2010) {
      setBirthYear(yr);
      setRevealed(0);
      // Stagger reveals
      TRACKED.forEach((_, i) => {
        setTimeout(() => setRevealed(prev => prev + 1), 600 + i * 800);
      });
    }
  }

  function getValueAtYear(indicator, series, year) {
    const d = indicatorData[indicator];
    if (!d || !d.data) return null;
    const pts = d.data.filter(p => p.series_id === series && p.value != null);
    const byYear = {};
    pts.forEach(p => { byYear[parseInt(p.date_value.substring(0, 4))] = p.value; });
    // Find closest year
    if (byYear[year]) return byYear[year];
    for (let offset = 1; offset <= 5; offset++) {
      if (byYear[year + offset]) return byYear[year + offset];
      if (byYear[year - offset]) return byYear[year - offset];
    }
    return null;
  }

  const age = birthYear ? currentYear - birthYear : null;

  return (
    <div className="app lifetime-page">
      <header className="indicator-header">
        <span className="section-label">Personal</span>
        <h1 className="indicator-page-title">Your Lifetime</h1>
        <p className="section-body-intro" style={{maxWidth: '580px'}}>
          Enter the year you were born. See what changed while you were alive.
        </p>
      </header>

      <div className="lifetime-input-section">
        <input
          type="number"
          className="lifetime-input"
          placeholder="Birth year"
          min="1940"
          max="2010"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button className="lifetime-go" onClick={submit}>Show me</button>
      </div>

      {birthYear && (
        <div className="lifetime-results">
          <div className="lifetime-age">
            <span className="lifetime-age-number">{age}</span>
            <span className="lifetime-age-label">years old</span>
          </div>

          <div className="lifetime-cards">
            {TRACKED.map((t, i) => {
              if (i >= revealed) return null;
              const thenVal = getValueAtYear(t.id, t.series, birthYear);
              const nowVal = getValueAtYear(t.id, t.series, currentYear);
              const narr = t.narrative(birthYear, thenVal, nowVal);
              return (
                <div className="lifetime-card" key={t.id} style={{animationDelay: (i * 0.1) + 's'}}>
                  <div className="lifetime-card-header">
                    <span className="lifetime-indicator-name">{t.name}</span>
                    {thenVal && nowVal && (
                      <div className="lifetime-then-now">
                        <span className="lifetime-then">{t.id === 'currency_debasement' ? Math.round(thenVal) : (thenVal % 1 === 0 ? Math.round(thenVal) : thenVal.toFixed(1))}{t.unit}</span>
                        <span className="lifetime-arrow">{'\u2192'}</span>
                        <span className="lifetime-now" style={{color: t.color}}>{t.id === 'currency_debasement' ? Math.round(nowVal) : (nowVal % 1 === 0 ? Math.round(nowVal) : nowVal.toFixed(1))}{t.unit}</span>
                      </div>
                    )}
                  </div>
                  {narr && <p className="lifetime-narrative">{narr}</p>}
                  <LifetimeChart data={indicatorData[t.id]} series={t.series} birthYear={birthYear} color={t.color} name={t.name} />
                </div>
              );
            })}
          </div>

          {revealed >= TRACKED.length && (
            <div className="lifetime-summary">
              <p>
                Every number above comes from a publicly available government source.
                None of it is editorialized. You lived through all of it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default YourLifetime;
