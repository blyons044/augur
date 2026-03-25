import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'https://augur.up.railway.app';

const COUNTRIES = {
  USA:'United States', GBR:'United Kingdom', DEU:'Germany', FRA:'France',
  JPN:'Japan', CHN:'China', IND:'India', BRA:'Brazil', RUS:'Russia',
  KOR:'South Korea', CAN:'Canada', AUS:'Australia', ITA:'Italy',
  MEX:'Mexico', IDN:'Indonesia', TUR:'Turkey', ZAF:'South Africa',
  ARG:'Argentina', NGA:'Nigeria', SWE:'Sweden'
};

const COMPARE_METRICS = [
  { series:'NY.GDP.MKTP.PP.CD', name:'GDP (PPP)', format:v=>'$'+(v/1e12).toFixed(1)+'T' },
  { series:'NY.GDP.PCAP.PP.CD', name:'GDP Per Capita', format:v=>'$'+(v/1000).toFixed(1)+'K' },
  { series:'SI.POV.GINI', name:'Gini Index', format:v=>v.toFixed(1) },
  { series:'MS.MIL.XPND.GD.ZS', name:'Military % GDP', format:v=>v.toFixed(1)+'%' },
  { series:'SH.XPD.CHEX.GD.ZS', name:'Healthcare % GDP', format:v=>v.toFixed(1)+'%' },
  { series:'SP.DYN.LE00.IN', name:'Life Expectancy', format:v=>v.toFixed(1)+' yrs' },
  { series:'SL.UEM.TOTL.ZS', name:'Unemployment', format:v=>v.toFixed(1)+'%' },
  { series:'FP.CPI.TOTL.ZG', name:'Inflation', format:v=>v.toFixed(1)+'%' },
];

function CompareChart({ data1, data2, series, country1, country2 }) {
  const ref = useRef();
  useEffect(() => {
    if (!data1 || !data2) return;
    const pts1 = (data1.data||[]).filter(d=>d.series_id===series&&d.value!=null);
    const pts2 = (data2.data||[]).filter(d=>d.series_id===series&&d.value!=null);
    if (pts1.length<2 && pts2.length<2) return;
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const W=400, H=200, m={t:15,r:20,b:30,l:50};
    const parse = d=>new Date(d.date_value);
    const allPts = [...pts1,...pts2];
    const x = d3.scaleTime().domain(d3.extent(allPts,parse)).range([m.l,W-m.r]);
    const y = d3.scaleLinear().domain(d3.extent(allPts,d=>d.value)).nice().range([H-m.b,m.t]);
    svg.append('g').attr('transform','translate(0,'+(H-m.b)+')').call(d3.axisBottom(x).ticks(5).tickSize(0)).select('.domain').attr('stroke','#1c1c30');
    svg.selectAll('.tick text').attr('fill','#707088').attr('font-size','9px');
    svg.append('g').attr('transform','translate('+m.l+',0)').call(d3.axisLeft(y).ticks(4).tickSize(-(W-m.l-m.r))).select('.domain').remove();
    svg.selectAll('.tick line').attr('stroke','#1c1c30').attr('stroke-dasharray','2,4');
    svg.selectAll('.tick text').attr('fill','#707088').attr('font-size','9px');
    if(pts1.length>=2) svg.append('path').datum(pts1).attr('fill','none').attr('stroke','#e04040').attr('stroke-width',2).attr('d',d3.line().x(d=>x(parse(d))).y(d=>y(d.value)).curve(d3.curveMonotoneX));
    if(pts2.length>=2) svg.append('path').datum(pts2).attr('fill','none').attr('stroke','#40c080').attr('stroke-width',2).attr('d',d3.line().x(d=>x(parse(d))).y(d=>y(d.value)).curve(d3.curveMonotoneX));
  },[data1,data2,series]);
  return <svg ref={ref} viewBox="0 0 400 200" className="compare-chart" />;
}

function CountryCompare() {
  const [c1, setC1] = useState('USA');
  const [c2, setC2] = useState('CHN');
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const [r1, r2] = await Promise.all([
          axios.get(API_BASE+'/api/indicators/geopolitical_standing?country_code='+c1),
          axios.get(API_BASE+'/api/indicators/geopolitical_standing?country_code='+c2),
        ]);
        setData1(r1.data); setData2(r2.data);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [c1, c2]);

  return (
    <div className="app compare-page">
      <header className="indicator-header">
        <span className="section-label">Head to Head</span>
        <h1 className="indicator-page-title">Country Comparison</h1>
        <p className="section-body-intro" style={{maxWidth:'640px'}}>
          Select two countries to compare across economic, military, and social indicators over time.
        </p>
      </header>

      <div className="compare-selectors">
        <div className="compare-selector">
          <span className="compare-dot" style={{background:'#e04040'}} />
          <select value={c1} onChange={e=>setC1(e.target.value)} className="country-select">
            {Object.entries(COUNTRIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <span className="compare-vs">vs</span>
        <div className="compare-selector">
          <span className="compare-dot" style={{background:'#40c080'}} />
          <select value={c2} onChange={e=>setC2(e.target.value)} className="country-select">
            {Object.entries(COUNTRIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading comparison data...</p>
      ) : (
        <div className="compare-grid">
          {COMPARE_METRICS.map(m => {
            const v1 = data1 && data1.data ? data1.data.filter(d=>d.series_id===m.series&&d.value!=null) : [];
            const v2 = data2 && data2.data ? data2.data.filter(d=>d.series_id===m.series&&d.value!=null) : [];
            const latest1 = v1.length ? v1[v1.length-1].value : null;
            const latest2 = v2.length ? v2[v2.length-1].value : null;
            return (
              <div className="compare-card" key={m.series}>
                <h3 className="compare-metric-name">{m.name}</h3>
                <div className="compare-values">
                  <span className="compare-val" style={{color:'#e04040'}}>{latest1 !== null ? m.format(latest1) : 'N/A'}</span>
                  <span className="compare-val" style={{color:'#40c080'}}>{latest2 !== null ? m.format(latest2) : 'N/A'}</span>
                </div>
                <CompareChart data1={data1} data2={data2} series={m.series} country1={c1} country2={c2} />
              </div>
            );
          })}
        </div>
      )}

      <footer className="dashboard-footer">
        <p className="footer-methodology">All data from World Bank Open Data API. Identical methodology applied to every nation.</p>
      </footer>
    </div>
  );
}

export default CountryCompare;
