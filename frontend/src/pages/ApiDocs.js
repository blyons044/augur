import React, { useState } from 'react';

const API_BASE = 'https://augur.up.railway.app';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/health',
    desc: 'Health check and version info',
    example: '{"status":"healthy","timestamp":"...","version":"0.1.0"}',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/indicators',
    desc: 'List all 13 indicator definitions',
    example: '[{"id":"political_polarization","name":"Political Polarization",...},...]',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/indicators/{id}',
    desc: 'Get time series data for a specific indicator',
    example: '{"indicator_id":"debt_to_gdp","country_code":"USA","data":[...],"record_count":9851}',
    params: [
      { name: 'id', type: 'path', desc: 'Indicator ID (e.g. debt_to_gdp, wealth_inequality, political_polarization)' },
      { name: 'country_code', type: 'query', desc: 'ISO 3-letter country code (default: USA)', optional: true },
      { name: 'start_year', type: 'query', desc: 'Filter data from this year onward', optional: true },
    ],
  },
];

const INDICATORS = [
  'political_polarization', 'public_trust', 'rule_of_law', 'civil_unrest',
  'wealth_inequality', 'middle_class_decline', 'debt_to_gdp', 'currency_debasement',
  'elite_overproduction', 'infrastructure_decay', 'media_fragmentation',
  'geopolitical_standing', 'resource_stress',
];

function ApiDocs() {
  const [tryIt, setTryIt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async (url) => {
    setLoading(true);
    setTryIt(url);
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      setResult(JSON.stringify(data, null, 2).substring(0, 2000));
    } catch (e) {
      setResult('Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="app api-docs-page">
      <header className="indicator-header">
        <span className="section-label">For Developers</span>
        <h1 className="indicator-page-title">API Documentation</h1>
        <p className="section-body-intro" style={{maxWidth:'640px'}}>
          Augur's API is free, public, and requires no authentication.
          All endpoints are read-only. CORS is open. Rate limit: 100 requests/minute.
        </p>
        <div className="api-base-url">
          <span className="api-label">Base URL</span>
          <code className="api-url">{API_BASE}</code>
        </div>
      </header>

      <div className="api-endpoints">
        {ENDPOINTS.map((ep, i) => (
          <div className="api-endpoint" key={i}>
            <div className="api-method-line">
              <span className="api-method">{ep.method}</span>
              <code className="api-path">{ep.path}</code>
            </div>
            <p className="api-desc">{ep.desc}</p>
            {ep.params.length > 0 && (
              <div className="api-params">
                <h4 className="api-params-title">Parameters</h4>
                {ep.params.map((p, j) => (
                  <div className="api-param" key={j}>
                    <code className="param-name">{p.name}</code>
                    <span className="param-type">{p.type}</span>
                    {p.optional && <span className="param-optional">optional</span>}
                    <span className="param-desc">{p.desc}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="api-try">
              <h4 className="api-params-title">Try it</h4>
              {ep.path.includes('{id}') ? (
                <div className="api-try-buttons">
                  <button className="try-btn" onClick={() => runQuery(API_BASE+'/api/indicators/debt_to_gdp?country_code=USA&start_year=2020')}>Debt to GDP (USA, 2020+)</button>
                  <button className="try-btn" onClick={() => runQuery(API_BASE+'/api/indicators/geopolitical_standing?country_code=CHN')}>GDP (China)</button>
                  <button className="try-btn" onClick={() => runQuery(API_BASE+'/api/indicators/political_polarization?country_code=USA')}>Polarization (USA)</button>
                </div>
              ) : (
                <button className="try-btn" onClick={() => runQuery(API_BASE+ep.path)}>{ep.method} {ep.path}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tryIt && (
        <div className="api-result">
          <div className="api-result-header">
            <code>{tryIt}</code>
          </div>
          <pre className="api-result-body">{loading ? 'Loading...' : result}</pre>
        </div>
      )}

      <div className="api-indicators-list">
        <h3 className="empire-section-title">Available Indicators</h3>
        <div className="api-indicator-chips">
          {INDICATORS.map(id => (
            <code className="indicator-chip" key={id} onClick={() => runQuery(API_BASE+'/api/indicators/'+id+'?country_code=USA&start_year=2020')}>{id}</code>
          ))}
        </div>
      </div>

      <div className="api-citation">
        <h3 className="empire-section-title">Citation</h3>
        <pre className="citation-block">{'Augur Civilizational Stress Index. (2026). Version 1.0.\nhttps://augur-index.vercel.app\nGitHub: https://github.com/augurofficial/augur'}</pre>
      </div>

      <footer className="dashboard-footer">
        <p className="footer-methodology">All data is free and publicly sourced. No API key required. No rate limiting for reasonable use.</p>
      </footer>
    </div>
  );
}

export default ApiDocs;
