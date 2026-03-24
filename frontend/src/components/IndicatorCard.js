import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
function fmt(v) {
  if (typeof v !== 'number') return v;
  const a = Math.abs(v);
  if (a >= 1e12) return (v/1e12).toFixed(1) + 'T';
  if (a >= 1e9) return (v/1e9).toFixed(1) + 'B';
  if (a >= 1e6) return (v/1e6).toFixed(1) + 'M';
  if (a >= 1e4) return (v/1e3).toFixed(1) + 'K';
  return v.toFixed(1);
}



function computeTrends(data, seriesId) {
  if (!data || !data.data) return null;
  let pts = data.data.filter(d => d.series_id === seriesId && d.value != null);
  if (pts.length === 0) {
    const sc = {}; data.data.forEach(d => { if (d.value != null) sc[d.series_id] = (sc[d.series_id]||0)+1; });
    const b = Object.entries(sc).sort((a,b) => b[1]-a[1])[0];
    if (b) pts = data.data.filter(d => d.series_id === b[0] && d.value != null);
  }
  if (pts.length < 2) return null;
  const first=pts[0], last=pts[pts.length-1];
  const tc = last.value-first.value, pct = (tc/Math.abs(first.value))*100;
  const vals = pts.map(d=>d.value), mn=Math.min(...vals), mx=Math.max(...vals);
  const r = pts.slice(-10), rc = r[r.length-1].value-r[0].value;
  const dir = rc>0.001?'rising':rc<-0.001?'falling':'neutral';
  const y1=parseInt(first.date_value.substring(0,4)), y2=parseInt(last.date_value.substring(0,4));
  const span=Math.max(y2-y1,1);
  return { firstDate:y1, lastDate:y2, lastValue:last.value, totalPct:pct.toFixed(1), annPct:(pct/span).toFixed(2), min:mn, max:mx, direction:dir, span };
}
function SparkLine({ data, seriesId }) {
  const ref = useRef();
  useEffect(() => {
    if (!data||!data.data) return;
    let pts = data.data.filter(d => d.series_id===seriesId && d.value!=null);
    if (!pts.length) {
      const sc={}; data.data.forEach(d=>{if(d.value!=null) sc[d.series_id]=(sc[d.series_id]||0)+1;});
      const b=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0];
      if(b) pts=data.data.filter(d=>d.series_id===b[0]&&d.value!=null);
    }
    if (pts.length<2) return;
    if (pts.length>200){const yr={};pts.forEach(p=>{const y=p.date_value.substring(0,4);if(!yr[y])yr[y]=p;});pts=Object.values(yr);}
    const svg=d3.select(ref.current); svg.selectAll('*').remove();
    const W=280,H=60,m={t:5,r:5,b:5,l:5};
    const x=d3.scaleLinear().domain([0,pts.length-1]).range([m.l,W-m.r]);
    const y=d3.scaleLinear().domain(d3.extent(pts,d=>d.value)).range([H-m.b,m.t]);
    const defs=svg.append('defs');
    const g=defs.append('linearGradient').attr('id','g-'+data.indicator_id).attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    g.append('stop').attr('offset','0%').attr('stop-color','#e74c3c').attr('stop-opacity',0.25);
    g.append('stop').attr('offset','100%').attr('stop-color','#e74c3c').attr('stop-opacity',0);
    svg.append('path').datum(pts).attr('fill','url(#g-'+data.indicator_id+')').attr('d',d3.area().x((_,i)=>x(i)).y0(H-m.b).y1(d=>y(d.value)).curve(d3.curveMonotoneX));
    svg.append('path').datum(pts).attr('fill','none').attr('stroke','#e74c3c').attr('stroke-width',1.5).attr('d',d3.line().x((_,i)=>x(i)).y(d=>y(d.value)).curve(d3.curveMonotoneX));
    const last=pts[pts.length-1];
    svg.append('circle').attr('cx',x(pts.length-1)).attr('cy',y(last.value)).attr('r',3).attr('fill','#e74c3c');
  },[data,seriesId]);
  return <svg ref={ref} viewBox="0 0 280 60" className="sparkline"/>;
}
const SERIES = { wealth_inequality:'WFRBST01134', debt_to_gdp:'GFDEGDQ188S', currency_debasement:'CPIAUCSL', elite_overproduction:'UNRATE' };
function TrendAnalysis({t}) {
  if(!t) return null;
  const s=parseFloat(t.totalPct)>0?'+':'';
  return (
    <div className="trend-analysis">
      <div className="trend-label">Computed trend · {t.firstDate}–{t.lastDate} · {t.span} years</div>
      <div className="trend-stats">
        <div className="trend-stat"><span className={'trend-stat-value '+t.direction}>{s}{t.totalPct}%</span><span className="trend-stat-label">total change</span></div>
        <div className="trend-stat"><span className={'trend-stat-value '+t.direction}>{s}{t.annPct}%/yr</span><span className="trend-stat-label">annualized</span></div>
        <div className="trend-stat"><span className="trend-stat-value">{typeof t.lastValue==='number'?fmt(t.lastValue):t.lastValue}</span><span className="trend-stat-label">latest</span></div>
        <div className="trend-stat"><span className="trend-stat-value">{fmt(t.min)}–{fmt(t.max)}</span><span className="trend-stat-label">range</span></div>
      </div>
    </div>
  );
}
function IndicatorCard({id,name,uncomfortableNumber,data,hasData}) {
  const trends = hasData ? computeTrends(data, SERIES[id]||'') : null;
  return (
    <div className={'indicator-card '+(hasData?'has-data':'no-data')}>
      <h3 className="indicator-name">{name}</h3>
      <div className="uncomfortable-number">
        <span className="un-value">{uncomfortableNumber.value}</span>
        <span className="un-statement">{uncomfortableNumber.statement}</span>
      </div>
      {hasData ? (<><SparkLine data={data} seriesId={SERIES[id]||''}/><TrendAnalysis t={trends}/></>) : (<div className="no-data-placeholder"><span>Data pipeline pending</span></div>)}
      <div className="card-footer">
        <span className="source">{uncomfortableNumber.source}</span>
        {hasData && <span className="data-count">{data.record_count} obs</span>}
      </div>
    </div>
  );
}
export default IndicatorCard;
