import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';

function MiniChart({ data, seriesId, color }) {
  const ref = useRef();
  useEffect(() => {
    if (!data || !data.data) return;
    let pts = data.data.filter(d => d.series_id === seriesId && d.value != null);
    if (!pts.length) {
      const sc = {}; data.data.forEach(d => { if (d.value != null) sc[d.series_id] = (sc[d.series_id]||0)+1; });
      const b = Object.entries(sc).sort((a,b) => b[1]-a[1])[0];
      if (b) pts = data.data.filter(d => d.series_id === b[0] && d.value != null);
    }
    if (pts.length < 2) return;
    if (pts.length > 200) { const yr = {}; pts.forEach(p => { const y = p.date_value.substring(0,4); if(!yr[y]) yr[y]=p; }); pts = Object.values(yr); }
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const W=600, H=180, m={t:10,r:10,b:30,l:50};
    const parse = d => new Date(d.date_value);
    const x = d3.scaleTime().domain(d3.extent(pts, parse)).range([m.l,W-m.r]);
    const y = d3.scaleLinear().domain(d3.extent(pts, d=>d.value)).nice().range([H-m.b,m.t]);
    svg.append('g').attr('transform','translate(0,'+(H-m.b)+')').call(d3.axisBottom(x).ticks(6).tickSize(0)).select('.domain').attr('stroke','#1c1c30');
    svg.selectAll('.tick text').attr('fill','#707088').attr('font-size','10px');
    svg.append('g').attr('transform','translate('+m.l+',0)').call(d3.axisLeft(y).ticks(4).tickSize(-(W-m.l-m.r))).select('.domain').remove();
    svg.selectAll('.tick line').attr('stroke','#1c1c30').attr('stroke-dasharray','2,4');
    svg.selectAll('.tick text').attr('fill','#707088').attr('font-size','10px');
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id','ng-'+(seriesId||'x')).attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    grad.append('stop').attr('offset','0%').attr('stop-color',color||'#e04040').attr('stop-opacity',0.2);
    grad.append('stop').attr('offset','100%').attr('stop-color',color||'#e04040').attr('stop-opacity',0);
    svg.append('path').datum(pts).attr('fill','url(#ng-'+(seriesId||'x')+')').attr('d',d3.area().x(d=>x(parse(d))).y0(H-m.b).y1(d=>y(d.value)).curve(d3.curveMonotoneX));
    svg.append('path').datum(pts).attr('fill','none').attr('stroke',color||'#e04040').attr('stroke-width',2).attr('d',d3.line().x(d=>x(parse(d))).y(d=>y(d.value)).curve(d3.curveMonotoneX));
    const last = pts[pts.length-1];
    svg.append('circle').attr('cx',x(parse(last))).attr('cy',y(last.value)).attr('r',4).attr('fill',color||'#e04040');
  },[data,seriesId,color]);
  return <svg ref={ref} viewBox="0 0 600 180" className="narrative-chart" />;
}

const CHAPTERS = [
  {
    id: 'intro',
    title: 'Five minutes that might change how you see your country',
    body: "What you're about to see is publicly available data from the Federal Reserve, the World Bank, UCLA, and government statistical agencies \u2014 presented exactly as the sources publish it.",
    note: "Every number links to its source. If anything here were wrong, anyone with a laptop could prove it.",
  },
  {
    id: 'trust',
    title: 'Start with the foundation: do people trust the system?',
    body: "In 1979, 34% of Americans expressed confidence in Congress. Today that number is 8%. The Supreme Court has dropped from 56% to 27%. Trust in news media: 76% in 1972, now 32%. These aren't cultural vibes. They're the structural legitimacy that makes governance possible without coercion.",
    indicator: 'public_trust',
    series: 'gallup_congress',
    color: '#e04040',
    stat: '8%',
    statLabel: 'confidence in Congress',
  },
  {
    id: 'polarization',
    title: 'The center didn\u2019t hold',
    body: "DW-NOMINATE scores measure the ideology of every member of Congress from their voting record. In the 1970s, the most conservative Democrat and the most liberal Republican overlapped significantly. Today that overlap is zero. Mathematically, from roll-call votes. Zero overlap.",
    indicator: 'political_polarization',
    series: 'dw_nominate_House_200',
    color: '#e04040',
    stat: '0%',
    statLabel: 'ideological overlap remaining',
  },
  {
    id: 'wealth',
    title: 'Follow the money',
    body: "The top 1% of American households now hold 30.8% of all national wealth. The bottom 50% holds 2.5%. This isn't income \u2014 it's accumulated wealth: real estate, stocks, business equity. The Federal Reserve publishes this data quarterly.",
    indicator: 'wealth_inequality',
    series: 'WFRBST01134',
    color: '#e0a030',
    stat: '30.8%',
    statLabel: 'of wealth held by top 1%',
  },
  {
    id: 'debt',
    title: 'The bill comes due',
    body: "Federal debt as a percentage of GDP is now 122% \u2014 the highest peacetime ratio in American history, exceeding even World War II levels. The trajectory is accelerating, not stabilizing. There is no plan, from either party, to reverse it.",
    indicator: 'debt_to_gdp',
    series: 'GFDEGDQ188S',
    color: '#e04040',
    stat: '122%',
    statLabel: 'debt to GDP',
  },
  {
    id: 'global',
    title: 'The world is watching',
    body: "In 1945, the United States produced roughly half of global GDP. Today that share is 15% on a purchasing-power basis. China passed the US in PPP GDP in 2017. This is not decline in absolute terms \u2014 the US economy is larger than ever. It is relative decline, which is what determines geopolitical leverage.",
    indicator: 'geopolitical_standing',
    series: 'NY.GDP.MKTP.PP.CD',
    color: '#5080c0',
    stat: '15%',
    statLabel: 'of global GDP (PPP)',
  },
  {
    id: 'pattern',
    title: 'You\u2019ve seen this before',
    body: "Every one of these indicators \u2014 polarization, institutional distrust, wealth concentration, sovereign debt, relative decline \u2014 has been documented in every major civilizational transition in recorded history. Rome. The Ottomans. The British Empire. The specifics differ. The structural pattern rhymes.",
    note: "Every one of those societies had people who saw it coming. The ones who acted early had options. The ones who waited didn't.",
  },
  {
    id: 'resilience',
    title: 'What people did when they saw it early',
    body: "Throughout history, the communities that weathered these transitions best shared a few things in common. Strong local networks. Practical skills that didn't depend on centralized systems. Financial resilience outside of a single currency or institution. Knowledge of how food, water, and energy actually work. These aren't fringe behaviors. They're what every stable community in human history has been built on.",
    note: "Preparation isn't about predicting a date. It's about building a life that's resilient regardless of what happens. The data says the structural conditions are here. What you do with that is up to you.",
  },
  {
    id: 'cta',
    title: 'Now look at all 13',
    body: "What you just saw was five of thirteen indicators. The full dashboard tracks civil unrest, infrastructure decay, media fragmentation, credential inflation, currency debasement, resource stress, rule of law erosion, and middle class decline. The more people who see this clearly, the more resilient we all become.",
  },
];

function NarrativeMode({ indicatorData }) {
  const [chapter, setChapter] = useState(0);
  const [visible, setVisible] = useState(true);

  const advance = () => {
    setVisible(false);
    setTimeout(() => {
      setChapter(prev => Math.min(prev + 1, CHAPTERS.length - 1));
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const goBack = () => {
    setVisible(false);
    setTimeout(() => {
      setChapter(prev => Math.max(prev - 1, 0));
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const ch = CHAPTERS[chapter];
  const data = ch.indicator ? indicatorData[ch.indicator] : null;
  const isLast = chapter === CHAPTERS.length - 1;
  const isFirst = chapter === 0;

  return (
    <div className="app narrative-page">
      <div className="editorial-disclaimer">
        <span className="disclaimer-label">EDITORIAL ANALYSIS</span>
        <span className="disclaimer-text">This guided walkthrough presents data with interpretive context. For raw data without editorial framing, use the <a href="/dashboard">Dashboard</a> or <a href="/api-docs">API</a>.</span>
      </div>
      <div className="narrative-progress">
        <div className="narrative-progress-fill" style={{width: ((chapter+1)/CHAPTERS.length*100)+'%'}} />
      </div>

      <div className={'narrative-content' + (visible ? ' narrative-visible' : ' narrative-hidden')}>
        <div className="narrative-chapter-num">{(chapter+1) + ' / ' + CHAPTERS.length}</div>

        <h1 className="narrative-title">{ch.title}</h1>

        {ch.stat && (
          <div className="narrative-stat">
            <span className="narrative-stat-value" style={{color: ch.color || 'var(--red)'}}>{ch.stat}</span>
            <span className="narrative-stat-label">{ch.statLabel}</span>
          </div>
        )}

        <p className="narrative-body">{ch.body}</p>

        {ch.note && (
          <p className="narrative-note">{ch.note}</p>
        )}

        {data && (
          <div className="narrative-chart-container">
            <MiniChart data={data} seriesId={ch.series} color={ch.color} />
          </div>
        )}

        <div className="narrative-controls">
          {!isFirst && (
            <button className="narrative-btn narrative-btn-back" onClick={goBack}>&larr; Previous</button>
          )}
          {!isLast ? (
            <button className="narrative-btn narrative-btn-next" onClick={advance}>Continue &rarr;</button>
          ) : (
            <Link to="/dashboard" className="hero-cta">Enter the Dashboard</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default NarrativeMode;
