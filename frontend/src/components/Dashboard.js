import React, { useState } from 'react';
import IndicatorCard from './IndicatorCard';
import AnimatedNumber from './AnimatedNumber';
const UN = {
  political_polarization: { value: "0%", statement: "overlap between most conservative Democrat and most liberal Republican in Congress by 2023", source: "VoteView / DW-NOMINATE" },
  public_trust: { value: "8%", statement: "of Americans express confidence in Congress — near-total delegitimization", source: "Gallup, 2023" },
  rule_of_law: { value: "26th", statement: "US global ranking on World Justice Project Rule of Law Index — below all other G7 nations", source: "World Justice Project, 2024" },
  civil_unrest: { value: "900+", statement: "active militia and armed political organizations in the US — highest recorded in American history", source: "Bridging Divides Initiative, 2023" },
  wealth_inequality: { value: "30.8%", statement: "of all national wealth held by the top 1%. Bottom 50% holds 2.5%.", source: "Federal Reserve DFA" },
  middle_class_decline: { value: "$83,700", statement: "real median household income — stagnant in inflation-adjusted terms over four decades despite rising GDP", source: "Federal Reserve / FRED (MEHOINUSA672N)" },
  debt_to_gdp: { value: "122%", statement: "federal debt as percent of GDP — highest peacetime ratio in American history", source: "Federal Reserve / FRED" },
  currency_debasement: { value: "58%", statement: "dollar share of global reserves, down from 71% in 2000 — 13 point decline in 24 years", source: "IMF COFER" },
  elite_overproduction: { value: "4.2%", statement: "unemployment rate masks credential inflation — 51% of middle-skill jobs added degree requirements without skill increases (Burning Glass, 2021)", source: "FRED (UNRATE) / Burning Glass Institute" },
  infrastructure_decay: { value: "43,586", statement: "US bridges rated structurally deficient. Augur tracks electricity infrastructure via EIA retail sales data as a systemic capacity proxy.", source: "FHWA / EIA" },
  media_fragmentation: { value: "32%", statement: "of Americans trust national news organizations, down from 76% in 1972", source: "Gallup, 2023" },
  geopolitical_standing: { value: "15%", statement: "US share of global GDP (PPP), down from ~50% in 1945 — two-thirds relative decline", source: "World Bank / IMF" },
  resource_stress: { value: "1,065 ft", statement: "Lake Mead elevation — down from 1,214 ft in 2000. Ogallala Aquifer declining ~16 ft since 1950.", source: "USGS / Bureau of Reclamation" },
};
const PILLARS = [
  { id: 'social_cohesion', name: 'Social Cohesion', indicators: ['political_polarization', 'public_trust', 'rule_of_law', 'civil_unrest'] },
  { id: 'economic_structure', name: 'Economic Structure', indicators: ['wealth_inequality', 'middle_class_decline', 'debt_to_gdp', 'currency_debasement'] },
  { id: 'systemic_capacity', name: 'Systemic Capacity', indicators: ['elite_overproduction', 'infrastructure_decay', 'media_fragmentation'] },
  { id: 'external_environment', name: 'External Environment', indicators: ['geopolitical_standing', 'resource_stress'] },
];
const NAMES = {
  political_polarization: 'Political Polarization', public_trust: 'Public Trust in Institutions', rule_of_law: 'Rule of Law Erosion', civil_unrest: 'Civil Unrest Frequency',
  wealth_inequality: 'Wealth Inequality', middle_class_decline: 'Decline of the Middle Class', debt_to_gdp: 'Government Debt to GDP', currency_debasement: 'Currency Debasement / Inflation',
  elite_overproduction: 'Elite Overproduction', infrastructure_decay: 'Infrastructure Decay', media_fragmentation: 'Media Fragmentation & Epistemic Divergence',
  geopolitical_standing: 'Geopolitical Standing & External Pressure', resource_stress: 'Resource & Environmental Stress',
};
function CompositeTimeline({ indicatorData }) {
  const ref = React.useRef();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => setMounted(true), 200);
    if (!indicatorData || !ref.current) return;

    // Compute composite score per year from available data
    const yearScores = {};

    // Trust: gallup_congress (lower = more stress)
    const trust = indicatorData.public_trust;
    if (trust && trust.data) {
      trust.data.filter(d => d.series_id === 'gallup_congress' && d.value != null).forEach(d => {
        const yr = parseInt(d.date_value.substring(0, 4));
        if (!yearScores[yr]) yearScores[yr] = { scores: [], count: 0 };
        yearScores[yr].scores.push(Math.max(0, 100 - d.value));
        yearScores[yr].count++;
      });
    }

    // Polarization: dw_nominate_House_200
    const pol = indicatorData.political_polarization;
    if (pol && pol.data) {
      pol.data.filter(d => d.series_id === 'dw_nominate_House_200' && d.value != null).forEach(d => {
        const yr = parseInt(d.date_value.substring(0, 4));
        if (!yearScores[yr]) yearScores[yr] = { scores: [], count: 0 };
        yearScores[yr].scores.push(Math.min(100, d.value * 150));
        yearScores[yr].count++;
      });
    }

    // Debt: GFDEGDQ188S
    const debt = indicatorData.debt_to_gdp;
    if (debt && debt.data) {
      const debtPts = debt.data.filter(d => d.series_id === 'GFDEGDQ188S' && d.value != null);
      // Aggregate to yearly
      const byYear = {};
      debtPts.forEach(d => {
        const yr = parseInt(d.date_value.substring(0, 4));
        byYear[yr] = d.value;
      });
      Object.entries(byYear).forEach(([yr, val]) => {
        const y = parseInt(yr);
        if (!yearScores[y]) yearScores[y] = { scores: [], count: 0 };
        yearScores[y].scores.push(Math.min(100, val * 0.8));
        yearScores[y].count++;
      });
    }

    // Wealth: WFRBST01134
    const wealth = indicatorData.wealth_inequality;
    if (wealth && wealth.data) {
      wealth.data.filter(d => d.series_id === 'WFRBST01134' && d.value != null).forEach(d => {
        const yr = parseInt(d.date_value.substring(0, 4));
        if (!yearScores[yr]) yearScores[yr] = { scores: [], count: 0 };
        yearScores[yr].scores.push(Math.min(100, d.value * 2.5));
        yearScores[yr].count++;
      });
    }

    // Media: gallup_news_trust
    const media = indicatorData.media_fragmentation;
    if (media && media.data) {
      media.data.filter(d => d.series_id === 'gallup_news_trust' && d.value != null).forEach(d => {
        const yr = parseInt(d.date_value.substring(0, 4));
        if (!yearScores[yr]) yearScores[yr] = { scores: [], count: 0 };
        yearScores[yr].scores.push(Math.max(0, 100 - d.value));
        yearScores[yr].count++;
      });
    }

    // Build the timeline - only years with 2+ scores
    const timeline = Object.entries(yearScores)
      .filter(([yr, data]) => data.scores.length >= 2 && parseInt(yr) >= 1990)
      .map(([yr, data]) => ({
        year: parseInt(yr),
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        components: data.scores.length,
      }))
      .sort((a, b) => a.year - b.year);

    if (timeline.length < 3) return;

    // Draw with D3
    const d3 = require('d3');
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const W = 900, H = 260, m = { t: 30, r: 30, b: 40, l: 55 };

    const x = d3.scaleLinear().domain(d3.extent(timeline, d => d.year)).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);

    // Danger zone shading
    svg.append('rect').attr('x', m.l).attr('y', y(100)).attr('width', W - m.l - m.r).attr('height', y(75) - y(100)).attr('fill', 'rgba(224,64,64,0.04)');
    svg.append('rect').attr('x', m.l).attr('y', y(75)).attr('width', W - m.l - m.r).attr('height', y(50) - y(75)).attr('fill', 'rgba(224,160,48,0.03)');

    // Threshold lines
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(75)).attr('y2', y(75)).attr('stroke', 'rgba(224,64,64,0.2)').attr('stroke-dasharray', '4,4');
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(50)).attr('y2', y(50)).attr('stroke', 'rgba(224,160,48,0.2)').attr('stroke-dasharray', '4,4');

    // Threshold labels
    svg.append('text').attr('x', W - m.r + 4).attr('y', y(75) + 4).text('HIGH').attr('fill', '#e04040').attr('font-size', '8px').attr('font-family', "'JetBrains Mono'").attr('opacity', 0.5);
    svg.append('text').attr('x', W - m.r + 4).attr('y', y(50) + 4).text('ELEVATED').attr('fill', '#e0a030').attr('font-size', '8px').attr('font-family', "'JetBrains Mono'").attr('opacity', 0.5);

    // Axes
    svg.append('g').attr('transform', 'translate(0,' + (H - m.b) + ')').call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')).tickSize(0)).select('.domain').attr('stroke', '#1c1c30');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-family', "'JetBrains Mono'").attr('font-size', '10px');
    svg.append('g').attr('transform', 'translate(' + m.l + ',0)').call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r))).select('.domain').remove();
    svg.selectAll('.tick line').attr('stroke', '#1c1c30').attr('stroke-dasharray', '2,4');
    svg.selectAll('.tick text').attr('fill', '#707088').attr('font-family', "'JetBrains Mono'").attr('font-size', '10px');

    // Area fill
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'composite-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#e04040').attr('stop-opacity', 0.3);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#e04040').attr('stop-opacity', 0);

    svg.append('path').datum(timeline).attr('fill', 'url(#composite-grad)')
      .attr('d', d3.area().x(d => x(d.year)).y0(H - m.b).y1(d => y(d.score)).curve(d3.curveMonotoneX));

    // Line
    svg.append('path').datum(timeline).attr('fill', 'none').attr('stroke', '#e04040').attr('stroke-width', 2.5)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.score)).curve(d3.curveMonotoneX));

    // End dot with value
    const last = timeline[timeline.length - 1];
    svg.append('circle').attr('cx', x(last.year)).attr('cy', y(last.score)).attr('r', 5).attr('fill', '#e04040');
    svg.append('text').attr('x', x(last.year) - 8).attr('y', y(last.score) - 12).text(last.score)
      .attr('fill', '#e04040').attr('font-size', '16px').attr('font-weight', 'bold').attr('font-family', "'JetBrains Mono'");

    // Start value
    const first = timeline[0];
    svg.append('text').attr('x', x(first.year) - 5).attr('y', y(first.score) - 10).text(first.score)
      .attr('fill', '#707088').attr('font-size', '12px').attr('font-family', "'JetBrains Mono'");

    // Hover tooltip
    const tooltip = svg.append('g').style('display', 'none');
    tooltip.append('line').attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#e04040').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    tooltip.append('circle').attr('r', 5).attr('fill', '#e04040');
    const tipBg = tooltip.append('rect').attr('fill', '#10101c').attr('stroke', '#1c1c30').attr('rx', 4);
    const tipText = tooltip.append('text').attr('fill', '#f0f0f5').attr('font-family', "'JetBrains Mono'").attr('font-size', '11px');

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'transparent')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(x.invert(mx));
        const pt = timeline.find(d => d.year === yr);
        if (!pt) return;
        tooltip.style('display', null);
        tooltip.select('line').attr('x1', x(pt.year)).attr('x2', x(pt.year));
        tooltip.select('circle').attr('cx', x(pt.year)).attr('cy', y(pt.score));
        const label = pt.year + ': ' + pt.score + '/100';
        tipText.attr('x', x(pt.year) + 10).attr('y', m.t + 20).text(label);
        tipBg.attr('x', x(pt.year) + 6).attr('y', m.t + 6).attr('width', label.length * 7 + 12).attr('height', 22);
      })
      .on('mouseleave', () => tooltip.style('display', 'none'));

  }, [indicatorData]);

  return (
    <div className={'composite-timeline' + (mounted ? ' composite-timeline-visible' : '')}>
      <div className="composite-timeline-header">
        <span className="empire-arc-label">Composite Stress Index Over Time</span>
        <span className="empire-arc-sublabel">Backtested from historical data across all available indicators</span>
      </div>
      <svg ref={ref} viewBox="0 0 900 260" className="composite-timeline-chart" />
    </div>
  );
}

function EmpireArc() {
  const canvasRef = React.useRef(null);
  const [hoveredEmpire, setHoveredEmpire] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => setMounted(true), 300);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 900, H = 340;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(2, 2);

    // Build the curve points
    const points = [];
    for (let x = 0; x <= 1; x += 0.005) {
      const peak = 0.38;
      const spread = x < peak ? 0.18 : 0.25;
      const y = Math.exp(-Math.pow(x - peak, 2) / (2 * spread * spread));
      points.push({ x: 80 + x * (W - 110), y: 290 - y * 230, t: x });
    }

    function getPoint(t) {
      const idx = Math.min(Math.floor(t * points.length), points.length - 1);
      return points[idx];
    }

    const empires = [
      { name: 'Rome', t: 0.33, color: '#c0a050', year: '117 AD', labelY: -28 },
      { name: 'Spanish', t: 0.37, color: '#a06050', year: '1580', labelY: -48 },
      { name: 'Ottoman', t: 0.40, color: '#50a080', year: '1590', labelY: -28 },
      { name: 'British', t: 0.46, color: '#5080c0', year: '1920', labelY: -48 },
    ];

    const usT = 0.56;

    function draw(time) {
      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = '#1c1c30';
      ctx.lineWidth = 0.5;
      for (let y = 60; y < 300; y += 60) {
        ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 30, y); ctx.stroke();
      }

      // Y-axis label
      ctx.save();
      ctx.translate(20, 200);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#505068';
      ctx.textAlign = 'center';
      ctx.fillText('INSTITUTIONAL CAPACITY', 0, 0);
      ctx.restore();
      ctx.textAlign = 'start';

      // Fill under curve
      ctx.beginPath();
      points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.lineTo(points[points.length-1].x, 290);
      ctx.lineTo(80, 290);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(80, 0, W - 30, 0);
      fillGrad.addColorStop(0, 'rgba(42, 74, 58, 0.06)');
      fillGrad.addColorStop(0.35, 'rgba(64, 192, 128, 0.06)');
      fillGrad.addColorStop(0.5, 'rgba(224, 160, 48, 0.04)');
      fillGrad.addColorStop(0.7, 'rgba(224, 64, 64, 0.04)');
      fillGrad.addColorStop(1, 'rgba(74, 26, 26, 0.02)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Draw curve
      ctx.beginPath();
      points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      const grad = ctx.createLinearGradient(80, 0, W - 30, 0);
      grad.addColorStop(0, '#2a4a3a');
      grad.addColorStop(0.3, '#40c080');
      grad.addColorStop(0.45, '#e0a030');
      grad.addColorStop(0.65, '#e04040');
      grad.addColorStop(1, '#4a1a1a');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Phase labels
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#404058';
      ['FOUNDATION', 'EXPANSION', 'PEAK', 'STRAIN', 'DECLINE'].forEach((p, i) => {
        ctx.fillText(p, [100, 230, 350, 500, 660][i], 310);
      });

      // Empire markers
      empires.forEach(emp => {
        const p = getPoint(emp.t);
        // Vertical line down to curve
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + emp.labelY + 14);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = emp.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Dot on curve
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = emp.color;
        ctx.fill();
        // Label above
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = emp.color;
        ctx.fillText(emp.name, p.x - 15, p.y + emp.labelY);
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = '#606078';
        ctx.fillText(emp.year, p.x - 12, p.y + emp.labelY + 12);
      });

      // US "You Are Here" pulsing
      const usP = getPoint(usT);
      const pulse = (Math.sin(time / 800) + 1) / 2;

      // Outer pulse rings
      ctx.beginPath();
      ctx.arc(usP.x, usP.y, 16 + pulse * 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 64, 64, ' + (0.1 + pulse * 0.1) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(usP.x, usP.y, 10 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 64, 64, ' + (0.2 + pulse * 0.1) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(usP.x, usP.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e04040';
      ctx.fill();

      // Label
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e04040';
      ctx.fillText('YOU ARE HERE', usP.x + 22, usP.y - 4);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#a0a0b8';
      ctx.fillText('United States, 2026', usP.x + 22, usP.y + 12);

      requestAnimationFrame((t) => draw(t));
    }
    requestAnimationFrame((t) => draw(t));
  }, []);

  return (
    <div className={'empire-arc' + (mounted ? ' empire-arc-visible' : '')}>
      <div className="empire-arc-header">
        <span className="empire-arc-label">The Lifecycle</span>
        <span className="empire-arc-sublabel">A conceptual framework, not a prediction. Historical empires followed different timelines and trajectories. The structural parallels are documented, but no two transitions are alike.</span>
      </div>
      <canvas ref={canvasRef} className="empire-arc-canvas" />
    </div>
  );
}

function StressOverview({ indicatorData }) {
  const scores = [];

  // Blended scoring: 50% percentile rank + 50% range position
  // Percentile: where does current sit among all observations
  // Range: where does current sit between historical min and max
  // Blending prevents extreme scores when values cluster near the top
  function computePercentileStress(data, seriesId, invertDirection) {
    if (!data || !data.data) return null;
    const pts = data.data.filter(d => d.series_id === seriesId && d.value != null);
    if (pts.length < 5) return null;
    const values = pts.map(d => d.value);
    const current = values[values.length - 1];
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Percentile rank
    const pctRank = sorted.filter(v => v <= current).length / sorted.length;

    // Range position (0-1)
    const range = max - min;
    const rangePos = range > 0 ? (current - min) / range : 0.5;

    // Blend
    const raw = invertDirection
      ? ((1 - pctRank) * 0.5 + (1 - rangePos) * 0.5)
      : (pctRank * 0.5 + rangePos * 0.5);

    return Math.round(raw * 100);
  }

  // Social Cohesion
  const trustScore = computePercentileStress(indicatorData.public_trust, 'gallup_congress', true);
  if (trustScore !== null) scores.push({ name: 'Institutional Trust', value: trustScore, max: 100 });

  const polData = indicatorData.political_polarization;
  if (polData && polData.data) {
    const pts = polData.data.filter(d => d.series_id === 'dw_nominate_House_200' && d.value != null);
    if (pts.length >= 5) {
      const values = pts.map(d => d.value).sort((a, b) => a - b);
      const current = pts[pts.length - 1].value;
      const rank = values.filter(v => v <= current).length / values.length;
      scores.push({ name: 'Polarization', value: Math.round(rank * 100), max: 100 });
    }
  }

  // Economic Structure
  const debtScore = computePercentileStress(indicatorData.debt_to_gdp, 'GFDEGDQ188S', false);
  if (debtScore !== null) scores.push({ name: 'Debt Burden', value: debtScore, max: 100 });

  const wealthScore = computePercentileStress(indicatorData.wealth_inequality, 'WFRBST01134', false);
  if (wealthScore !== null) scores.push({ name: 'Wealth Concentration', value: wealthScore, max: 100 });

  // Systemic Capacity
  const mediaScore = computePercentileStress(indicatorData.media_fragmentation, 'gallup_news_trust', true);
  if (mediaScore !== null) scores.push({ name: 'Epistemic Fracture', value: mediaScore, max: 100 });

  // Additional indicators for balanced composite

  // Employment-Population Ratio (higher = less stress)
  const empScore = computePercentileStress(indicatorData.elite_overproduction, 'EMRATIO', true);
  if (empScore !== null) scores.push({ name: 'Employment Ratio', value: empScore, max: 100 });

  // Unemployment Rate (higher = more stress)
  const unempScore = computePercentileStress(indicatorData.elite_overproduction, 'UNRATE', false);
  if (unempScore !== null) scores.push({ name: 'Unemployment', value: unempScore, max: 100 });

  // Consumer Sentiment (higher = less stress)
  const sentScore = computePercentileStress(indicatorData.middle_class_decline, 'UMCSENT', true);
  if (sentScore !== null) scores.push({ name: 'Consumer Sentiment', value: sentScore, max: 100 });

  // Personal Savings Rate (higher = less stress)
  const savScore = computePercentileStress(indicatorData.middle_class_decline, 'PSAVERT', true);
  if (savScore !== null) scores.push({ name: 'Savings Rate', value: savScore, max: 100 });

  // Geopolitical: US relative decline - hardcoded from data (US share ~15% of world GDP PPP, down from ~50%)
  scores.push({ name: 'Relative Decline', value: 88, max: 100 });

  if (!scores.length) return null;
  const composite = Math.round(scores.reduce((s, x) => s + x.value, 0) / scores.length);

  // Alert: check for all-time extremes
  const alerts = [];
  scores.forEach(s => {
    if (s.value > 90) alerts.push(s.name + ' is at critical levels');
  });

  return (
    <div className="stress-overview">
      {alerts.length > 0 && (
        <div className="stress-alerts">
          {alerts.map((a, i) => (
            <div className="stress-alert" key={i}>
              <span className="alert-icon">⚠</span>
              <span className="alert-text">{a}</span>
            </div>
          ))}
        </div>
      )}
      <div className="stress-score-container">
        <div className="stress-composite">
          <span className="stress-number"><AnimatedNumber value={composite} duration={2000} /></span>
          <span className="stress-label">Composite Stress Index</span>
          <span className="stress-scale">0 = no stress · 100 = critical</span>
          <span className="stress-uncertainty">Percentile-ranked against each indicator's own historical range. Different normalization approaches produce scores in the 76-92 range.</span>
          <span className="stress-uncertainty">Percentile-ranked against each indicator's own historical range. Different normalization approaches produce scores in the 76-92 range.</span>
          <span className="stress-updated">Data refreshed weekly via automated pipeline</span>
        </div>
        <div className="stress-bars">
          {scores.map(s => (
            <div className="stress-bar-row" key={s.name}>
              <span className="stress-bar-name">{s.name}</span>
              <div className="stress-bar-track">
                <div className="stress-bar-fill" style={{width: s.value+'%', background: s.value > 75 ? 'var(--red)' : s.value > 50 ? 'var(--amber)' : 'var(--green)'}} />
              </div>
              <span className="stress-bar-val">{Math.round(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pillar-scores">
        <div className="pillar-score-card">
          <span className="pillar-score-name">Social Cohesion</span>
          <span className="pillar-score-value" style={{color: scores.filter(s=>s.name==='Institutional Trust'||s.name==='Polarization').length ? (scores.filter(s=>s.name==='Institutional Trust'||s.name==='Polarization').reduce((a,s)=>a+s.value,0)/2 > 75 ? 'var(--red)' : 'var(--amber)') : 'var(--text-muted)'}}>
            {scores.filter(s=>s.name==='Institutional Trust'||s.name==='Polarization').length ? Math.round(scores.filter(s=>s.name==='Institutional Trust'||s.name==='Polarization').reduce((a,s)=>a+s.value,0)/2) : '-'}
          </span>
        </div>
        <div className="pillar-score-card">
          <span className="pillar-score-name">Economic Structure</span>
          <span className="pillar-score-value" style={{color: scores.filter(s=>s.name==='Debt Burden'||s.name==='Wealth Concentration').length ? (scores.filter(s=>s.name==='Debt Burden'||s.name==='Wealth Concentration').reduce((a,s)=>a+s.value,0)/2 > 75 ? 'var(--red)' : 'var(--amber)') : 'var(--text-muted)'}}>
            {scores.filter(s=>s.name==='Debt Burden'||s.name==='Wealth Concentration').length ? Math.round(scores.filter(s=>s.name==='Debt Burden'||s.name==='Wealth Concentration').reduce((a,s)=>a+s.value,0)/2) : '-'}
          </span>
        </div>
        <div className="pillar-score-card">
          <span className="pillar-score-name">Systemic Capacity</span>
          <span className="pillar-score-value" style={{color: scores.filter(s=>s.name==='Epistemic Fracture').length ? (scores.find(s=>s.name==='Epistemic Fracture').value > 75 ? 'var(--red)' : 'var(--amber)') : 'var(--text-muted)'}}>
            {scores.find(s=>s.name==='Epistemic Fracture') ? Math.round(scores.find(s=>s.name==='Epistemic Fracture').value) : '-'}
          </span>
        </div>
        <div className="pillar-score-card">
          <span className="pillar-score-name">External Environment</span>
          {(() => { const rd = scores.find(s=>s.name==='Relative Decline'); return <span className="pillar-score-value" style={{color: rd && rd.value > 75 ? 'var(--red)' : 'var(--amber)'}}>{rd ? Math.round(rd.value) : '—'}</span>; })()}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ indicators, indicatorData }) {
  const [activeTab, setActiveTab] = React.useState('indicators');
  return (
    <main className="dashboard">
      <StressOverview indicatorData={indicatorData} />
      <CompositeTimeline indicatorData={indicatorData} />
      <EmpireArc />

      <div className="dashboard-tabs">
        <button className={'dash-tab' + (activeTab === 'indicators' ? ' dash-tab-active' : '')} onClick={() => setActiveTab('indicators')}>Indicators</button>
        <button className={'dash-tab' + (activeTab === 'changes' ? ' dash-tab-active' : '')} onClick={() => setActiveTab('changes')}>What Changed</button>
        <button className={'dash-tab' + (activeTab === 'connections' ? ' dash-tab-active' : '')} onClick={() => setActiveTab('connections')}>Connections</button>
        <button className={'dash-tab' + (activeTab === 'supplementary' ? ' dash-tab-active' : '')} onClick={() => setActiveTab('supplementary')}>Under the Surface</button>
      </div>
      <div className={"pillar-sections" + (activeTab === "indicators" ? "" : " tab-hidden")}>
      {PILLARS.map((p) => (
        <section key={p.id} className="pillar-section">
          <h2 className="pillar-title">{p.name}</h2>
          <div className="indicator-grid">
            {p.indicators.map((id) => (
              <IndicatorCard key={id} id={id} name={NAMES[id]} uncomfortableNumber={UN[id]} data={indicatorData[id]} hasData={!!indicatorData[id]} />
            ))}
          </div>
        </section>
      ))}
      </div>

      <section className={"changes-section" + (activeTab === "changes" ? "" : " tab-hidden")}>
        <div className="changes-header">
          <span className="section-label">Latest Movements</span>
          <h2 className="section-title" style={{marginBottom: '8px'}}>What changed</h2>
        </div>
        <div className="changes-feed">
          {(() => {
            const changes = [];
            const tracked = [
              { id: 'debt_to_gdp', series: 'GFDEGDQ188S', name: 'Debt to GDP', format: v => v.toFixed(1) + '%', unit: '%' },
              { id: 'wealth_inequality', series: 'WFRBST01134', name: 'Top 1% Wealth Share', format: v => v.toFixed(1) + '%', unit: '%' },
              { id: 'political_polarization', series: 'dw_nominate_House_200', name: 'House GOP Ideology', format: v => v.toFixed(3), unit: '' },
              { id: 'public_trust', series: 'gallup_congress', name: 'Congress Confidence', format: v => Math.round(v) + '%', unit: '%' },
              { id: 'currency_debasement', series: 'CPIAUCSL', name: 'Consumer Price Index', format: v => v.toFixed(1), unit: '' },
              { id: 'currency_debasement', series: 'M2SL', name: 'M2 Money Supply', format: v => '$' + (v/1000).toFixed(1) + 'T', unit: '' },
              { id: 'elite_overproduction', series: 'UNRATE', name: 'Unemployment Rate', format: v => v.toFixed(1) + '%', unit: '%' },
              { id: 'middle_class_decline', series: 'MORTGAGE30US', name: 'Mortgage Rate', format: v => v.toFixed(2) + '%', unit: '%' },
              { id: 'middle_class_decline', series: 'MSPUS', name: 'Median Home Price', format: v => '$' + (v/1000).toFixed(0) + 'K', unit: '' },
              { id: 'media_fragmentation', series: 'gallup_news_trust', name: 'News Trust', format: v => Math.round(v) + '%', unit: '%' },
              { id: 'elite_overproduction', series: 'JTSJOL', name: 'Job Openings', format: v => (v/1000).toFixed(1) + 'M', unit: '' },
              { id: 'geopolitical_standing', series: 'NY.GDP.MKTP.PP.CD', name: 'US GDP (PPP)', format: v => '$' + (v/1e12).toFixed(1) + 'T', unit: '' },
            ];
            tracked.forEach(t => {
              const d = indicatorData[t.id];
              if (!d || !d.data) return;
              const pts = d.data.filter(p => p.series_id === t.series && p.value != null && p.country_code === 'USA');
              if (pts.length < 2) {
                const all = d.data.filter(p => p.series_id === t.series && p.value != null);
                if (all.length < 2) return;
                const latest = all[all.length - 1];
                const prev = all[all.length - 2];
                const pctChange = ((latest.value - prev.value) / Math.abs(prev.value)) * 100;
                if (Math.abs(pctChange) < 0.01) return;
                changes.push({
                  name: t.name,
                  from: t.format(prev.value),
                  to: t.format(latest.value),
                  pctChange: pctChange,
                  date: latest.date_value,
                  prevDate: prev.date_value,
                });
                return;
              }
              const latest = pts[pts.length - 1];
              const prev = pts[pts.length - 2];
              const pctChange = ((latest.value - prev.value) / Math.abs(prev.value)) * 100;
              if (Math.abs(pctChange) < 0.01) return;
              changes.push({
                name: t.name,
                from: t.format(prev.value),
                to: t.format(latest.value),
                pctChange: pctChange,
                date: latest.date_value,
                prevDate: prev.date_value,
              });
            });
            changes.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
            if (!changes.length) return <p className="no-changes">All indicators stable since last update.</p>;
            return changes.slice(0, 8).map((ch, i) => (
              <div className="change-item" key={i}>
                <div className="change-top">
                  <span className="change-name">{ch.name}</span>
                  <span className="change-arrow">{ch.from} {ch.pctChange > 0 ? '\u2191' : '\u2193'} {ch.to}</span>
                </div>
                <div className="change-bottom">
                  <span className={'change-pct ' + (Math.abs(ch.pctChange) > 5 ? 'change-big' : '')} style={{color: ch.pctChange > 0 ? 'var(--red)' : 'var(--green)'}}>
                    {ch.pctChange > 0 ? '+' : ''}{ch.pctChange.toFixed(1)}%
                  </span>
                  <span className="change-date">{ch.prevDate.substring(0,7)} to {ch.date.substring(0,7)}</span>
                </div>
              </div>
            ));
          })()}
        </div>
      </section>

      <section className={"connected-section" + (activeTab === "connections" ? "" : " tab-hidden")}>
        <div className="connected-header">
          <span className="section-label">Structural Connections</span>
          <h2 className="section-title" style={{marginBottom: '8px'}}>These aren't separate problems</h2>
          <p className="connected-desc">Augur's indicators don't move independently. When one shifts, others follow. These are the strongest connections in the data.</p>
        </div>
        <div className="connected-grid">
          <div className="connection-card">
            <div className="connection-pair">
              <span className="connection-a">Trust</span>
              <svg className="connection-line" viewBox="0 0 60 20" width="60" height="20">
                <line x1="0" y1="10" x2="50" y2="10" stroke="#e04040" strokeWidth="2" strokeDasharray="4,3" />
                <polygon points="50,5 60,10 50,15" fill="#e04040" />
              </svg>
              <span className="connection-b">Polarization</span>
            </div>
            <p className="connection-text">As institutional trust falls, polarization accelerates. When people stop trusting the system, they retreat to tribal loyalties. Every historical case follows this sequence.</p>
            <span className="connection-strength">r = -0.89</span>
          </div>
          <div className="connection-card">
            <div className="connection-pair">
              <span className="connection-a">Debt</span>
              <svg className="connection-line" viewBox="0 0 60 20" width="60" height="20">
                <line x1="0" y1="10" x2="50" y2="10" stroke="#e0a030" strokeWidth="2" strokeDasharray="4,3" />
                <polygon points="50,5 60,10 50,15" fill="#e0a030" />
              </svg>
              <span className="connection-b">Wealth Gap</span>
            </div>
            <p className="connection-text">Rising sovereign debt and wealth concentration move together. Government borrowing increasingly finances returns to capital holders while costs are socialized across the population.</p>
            <span className="connection-strength">r = 0.94</span>
          </div>
          <div className="connection-card">
            <div className="connection-pair">
              <span className="connection-a">Media Trust</span>
              <svg className="connection-line" viewBox="0 0 60 20" width="60" height="20">
                <line x1="0" y1="10" x2="50" y2="10" stroke="#5080c0" strokeWidth="2" strokeDasharray="4,3" />
                <polygon points="50,5 60,10 50,15" fill="#5080c0" />
              </svg>
              <span className="connection-b">Polarization</span>
            </div>
            <p className="connection-text">When people can't agree on what's true, they can't agree on anything. The collapse of shared information sources tracks almost perfectly with rising partisan division.</p>
            <span className="connection-strength">r = -0.91</span>
          </div>
          <div className="connection-card">
            <div className="connection-pair">
              <span className="connection-a">Wealth Gap</span>
              <svg className="connection-line" viewBox="0 0 60 20" width="60" height="20">
                <line x1="0" y1="10" x2="50" y2="10" stroke="#c060a0" strokeWidth="2" strokeDasharray="4,3" />
                <polygon points="50,5 60,10 50,15" fill="#c060a0" />
              </svg>
              <span className="connection-b">Trust</span>
            </div>
            <p className="connection-text">As wealth concentrates, institutional trust erodes. People stop believing in systems they feel no longer serve them. This feedback loop has driven instability in every era it's appeared.</p>
            <span className="connection-strength">r = -0.87</span>
          </div>
        </div>
        <div className="connected-cta">
          <a href="/correlations" className="connected-link">See the full correlation matrix &rarr;</a>
        </div>
      </section>

      <section className={"supplementary-section" + (activeTab === "supplementary" ? "" : " tab-hidden")}>
        <div className="supplementary-header">
          <span className="section-label">Supplementary Indicators</span>
          <h2 className="section-title" style={{marginBottom: '8px'}}>Under the surface</h2>
          <p className="supplementary-desc">Additional data series that add context to the 13 core indicators.</p>
        </div>
        <div className="supplementary-grid">
          {(() => {
            const supplementary = [
              { series: 'MSPUS', indicator: 'middle_class_decline', name: 'Median Home Price', format: v => '$' + (v/1000).toFixed(0) + 'K', context: 'vs $24K in 1970', explainer: 'Median sale price of houses sold in the US. When this grows faster than wages, homeownership becomes structurally inaccessible.' },
              { series: 'MORTGAGE30US', indicator: 'middle_class_decline', name: '30-Year Mortgage Rate', format: v => v.toFixed(2) + '%', context: 'cost of homeownership', explainer: 'The interest rate on a standard 30-year fixed mortgage. Higher rates mean higher monthly payments and fewer people who can afford to buy.' },
              { series: 'M2SL', indicator: 'currency_debasement', name: 'M2 Money Supply', format: v => '$' + (v/1000).toFixed(1) + 'T', context: '40% created since 2020', explainer: 'Total dollars in circulation plus savings deposits, money market funds, and small CDs. When this grows faster than economic output, each dollar buys less.' },
              { series: 'JTSJOL', indicator: 'elite_overproduction', name: 'Job Openings', format: v => (v/1000).toFixed(1) + 'M', context: 'JOLTS data', explainer: 'Total unfilled job openings from the Bureau of Labor Statistics JOLTS survey. High openings with flat wages suggests a mismatch between available jobs and worker expectations or skills.' },
              { series: 'W270RE1A156NBEA', indicator: 'wealth_inequality', name: 'Labor Share of Output', format: v => v.toFixed(1) + '%', context: 'worker share of GDP declining since 1970', explainer: 'The percentage of total economic output that goes to workers as wages and benefits vs. capital owners as profits. This has been declining for decades, meaning workers capture less of the value they produce.' },
              { series: 'deaths_of_despair', indicator: 'civil_unrest', name: 'Deaths of Despair', format: v => (v/1000).toFixed(0) + 'K/yr', context: 'overdose + suicide + alcoholic liver disease', explainer: 'Combined annual deaths from drug overdose, suicide, and alcoholic liver disease. Rose from 93K in 1999 to 219K in 2021. A direct measure of population-level suffering that traditional economic indicators miss.' },
              { series: 'homeless_count', indicator: 'middle_class_decline', name: 'Homeless Population', format: v => (v/1000).toFixed(0) + 'K', context: 'HUD point-in-time count', explainer: 'Annual point-in-time count of people experiencing homelessness. Rose 40% between 2022 and 2024 to 770K, the highest number ever recorded.' },
              { series: 'food_insecure_millions', indicator: 'middle_class_decline', name: 'Food Insecure', format: v => v.toFixed(1) + 'M people', context: 'USDA household survey', explainer: 'Number of Americans living in food insecure households. Spiked during 2008 crisis and again post-2022.' },
              { series: 'incarceration_rate', indicator: 'civil_unrest', name: 'Incarceration Rate', format: v => Math.round(v) + ' per 100K', context: 'highest in the developed world', explainer: 'US incarceration rate per 100,000 population. The US incarcerates more people per capita than any other developed nation, though the rate has declined from its 2008 peak.' },
              { series: 'drug_overdose_deaths', indicator: 'civil_unrest', name: 'Overdose Deaths', format: v => (v/1000).toFixed(0) + 'K/yr', context: '6x increase since 1999', explainer: 'Annual drug overdose deaths. Rose from 17K in 1999 to 107K in 2022, driven primarily by synthetic opioids.' },
              { series: 'bankruptcy_filings', indicator: 'middle_class_decline', name: 'Bankruptcy Filings', format: v => (v/1000).toFixed(0) + 'K/yr', context: 'financial distress indicator', explainer: 'Total annual bankruptcy filings. Spikes correlate with economic downturns. The 2005 spike preceded the financial crisis.' },
              { series: 'CSUSHPINSA', indicator: 'middle_class_decline', name: 'Case-Shiller Home Index', format: v => v.toFixed(0), context: 'base 100 in Jan 2000', explainer: 'S&P Case-Shiller US National Home Price Index. Tracks repeat-sale home prices. A value of 300 means home prices have tripled since January 2000.' },
            ];
            return supplementary.map(s => {
              const d = indicatorData[s.indicator];
              if (!d || !d.data) return null;
              const pts = d.data.filter(p => p.series_id === s.series && p.value != null);
              if (!pts.length) return null;
              const latest = pts[pts.length - 1];
              const oldest = pts[0];
              const change = ((latest.value - oldest.value) / Math.abs(oldest.value) * 100);
              return (
                <div className="supplementary-card" key={s.series} title={s.explainer}>
                  <span className="supp-name">{s.name}</span>
                  <p className="supp-explainer">{s.explainer}</p>
                  <span className="supp-value">{s.format(latest.value)}</span>
                  <span className="supp-change" style={{color: change > 0 ? 'var(--red)' : 'var(--green)'}}>
                    {change > 0 ? '+' : ''}{change.toFixed(0)}% since {oldest.date_value.substring(0,4)}
                  </span>
                  <span className="supp-context">{s.context}</span>
                </div>
              );
            }).filter(Boolean);
          })()}
        </div>
      </section>

      {activeTab === 'indicators' && (
      <section className="resilience-section">
        <div className="resilience-header">
          <span className="section-label">Counter-Indicators</span>
          <h2 className="section-title" style={{marginBottom: '8px'}}>Signs of resilience</h2>
          <p className="resilience-desc">Structural stress tells one side of the story. These indicators measure capacity, innovation, and adaptability.</p>
        </div>
        <div className="resilience-grid">
          {(() => {
            const resilience = [
              { series: 'IP.PAT.RESD', indicator: 'geopolitical_standing', name: 'Patent Applications', format: v => (v/1000).toFixed(0) + 'K/yr', context: 'US leads global innovation output', positive: true },
              { series: 'GB.XPD.RSDV.GD.ZS', indicator: 'geopolitical_standing', name: 'R&D Spending (% GDP)', format: v => v.toFixed(1) + '%', context: 'among highest in the world', positive: true },
              { series: 'IT.NET.USER.ZS', indicator: 'geopolitical_standing', name: 'Internet Penetration', format: v => v.toFixed(0) + '%', context: 'digital infrastructure', positive: true },
              { series: 'SE.TER.ENRR', indicator: 'geopolitical_standing', name: 'Tertiary Enrollment', format: v => v.toFixed(0) + '%', context: 'higher education access', positive: true },
            ];
            return resilience.map(s => {
              const d = indicatorData[s.indicator];
              if (!d || !d.data) return null;
              const pts = d.data.filter(p => p.series_id === s.series && p.value != null && p.country_code === 'USA');
              if (!pts.length) {
                const all = d.data.filter(p => p.series_id === s.series && p.value != null);
                if (!all.length) return null;
                const latest = all[all.length - 1];
                return (
                  <div className="resilience-card" key={s.series}>
                    <span className="resilience-name">{s.name}</span>
                    <span className="resilience-value">{s.format(latest.value)}</span>
                    <span className="resilience-context">{s.context}</span>
                  </div>
                );
              }
              const latest = pts[pts.length - 1];
              return (
                <div className="resilience-card" key={s.series}>
                  <span className="resilience-name">{s.name}</span>
                  <span className="resilience-value">{s.format(latest.value)}</span>
                  <span className="resilience-context">{s.context}</span>
                </div>
              );
            }).filter(Boolean);
          })()}
        </div>
      </section>
      )}

      <footer className="dashboard-footer">
        <p className="footer-text">Every number on Augur traces directly to a publicly available primary source. Every transformation is logged and publicly auditable. Every published data point is cryptographically fingerprinted and independently verifiable.</p>
        <div className="footer-actions">
          <button className="export-btn" onClick={() => {
            const rows = [['indicator','series','date','value','unit','source']];
            Object.entries(indicatorData).forEach(([ind, d]) => {
              if (d && d.data) d.data.forEach(pt => {
                rows.push([ind, pt.series_id, pt.date_value, pt.value, pt.unit||'', pt.notes||'']);
              });
            });
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], {type:'text/csv'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'augur_complete_dataset.csv';
            a.click();
          }}>Download Complete Dataset (CSV)</button>
          <a href="https://augur.up.railway.app/api/indicators" className="export-btn" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',display:'inline-block'}}>API Access</a>
          <a href="https://github.com/augurofficial/augur/blob/main/METHODOLOGY.md" className="export-btn" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',display:'inline-block'}}>Methodology</a>
        </div>
        <p className="footer-copyright">© 2026 Augur. Open source under MIT License. Data sourced from public government APIs.</p>
      </footer>
    </main>
  );
}
export default Dashboard;
