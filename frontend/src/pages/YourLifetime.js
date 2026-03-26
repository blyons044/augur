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
      const lost = Math.round(then - now);
      const pctOfTotal = Math.round((lost / then) * 100);
      return `Congress had ${Math.round(then)}% confidence the year you were born. It's ${Math.round(now)}% now. ${pctOfTotal}% of all institutional trust that existed when you arrived has evaporated while you've been alive.`;
    }
  },
  {
    id: 'debt_to_gdp', series: 'GFDEGDQ188S', name: 'Federal Debt (% of GDP)',
    unit: '%', color: '#e0a030',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const added = Math.round(now - then);
      const totalDebt = 122; // current level
      const yourShare = Math.round((added / totalDebt) * 100);
      return `Debt-to-GDP was ${Math.round(then)}% when you were born. It's ${Math.round(now)}% now. ${yourShare}% of all federal debt relative to the economy was added during your lifetime. Not across 250 years of American history. Just yours.`;
    }
  },
  {
    id: 'wealth_inequality', series: 'WFRBST01134', name: 'Top 1% Wealth Share',
    unit: '%', color: '#c060a0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const postWarLow = 22;
      const gildedAge = 36;
      const range = gildedAge - postWarLow;
      const yourGrowth = now - then;
      const pctOfRange = Math.round((yourGrowth / range) * 100);
      return `The top 1% held ${then.toFixed(1)}% when you were born and ${now.toFixed(1)}% now. To put that in context, the entire swing from the post-war low to the Gilded Age peak was ${range} points. Your lifetime accounts for ${Math.abs(pctOfRange)}% of that swing.`;
    }
  },
  {
    id: 'political_polarization', series: 'dw_nominate_House_200', name: 'House GOP Ideology Score',
    unit: '', color: '#5080c0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const civilWarLevel = 0.52;
      if (now > civilWarLevel) {
        return `Congressional polarization is now higher than it was in the years before the Civil War. When you were born, the score was ${then.toFixed(2)}. The pre-Civil War peak was ${civilWarLevel}. It's ${now.toFixed(2)} now. You grew up while it passed a threshold the country has only crossed once before.`;
      }
      return `Polarization was ${then.toFixed(2)} when you were born and ${now.toFixed(2)} now. The pre-Civil War peak was ${civilWarLevel}. The gap is closing.`;
    }
  },
  {
    id: 'currency_debasement', series: 'CPIAUCSL', name: 'Consumer Price Index',
    unit: '', color: '#40c080',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const multiplier = (now / then).toFixed(1);
      const cents = (100 / parseFloat(multiplier)).toFixed(0);
      return `Prices have multiplied ${multiplier}x since you were born. A dollar from your birth year is worth ${cents} cents today. Your parents' savings lost ${100 - parseInt(cents)}% of their purchasing power during your life.`;
    }
  },
  {
    id: 'media_fragmentation', series: 'gallup_news_trust', name: 'Trust in News Media',
    unit: '%', color: '#60c0c0',
    narrative: (birth, then, now) => {
      if (!then || !now) return null;
      const drop = Math.round(then - now);
      const majority = then > 50;
      return `When you were born, ${Math.round(then)}% of Americans trusted the news. ${majority ? 'A majority. ' : ''}It's ${Math.round(now)}% now. ${drop > 0 ? `${drop} points of shared reality disappeared while you were alive.` : 'Trust has held roughly steady.'}`;
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
      <div className="personalization-caveat" style={{margin:'0 0 24px',padding:'12px 16px',background:'rgba(96,144,192,0.08)',border:'1px solid rgba(96,144,192,0.2)',borderRadius:'4px',font:'400 11px var(--font-mono)',color:'var(--text-muted)',lineHeight:1.6}}>
        <strong>Personalized context, not personalized prediction.</strong> This page overlays your life timeline against structural indicator trends. The juxtaposition is illustrative — it does not imply that these macro trends affected you individually (ecological fallacy). National aggregates do not describe individual experience.
      </div>
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
                All of this happened while you were alive. Every number comes from
                federal government data. The question is what you do with it now.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default YourLifetime;
