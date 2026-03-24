import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import './index.css';
const API_BASE = process.env.REACT_APP_API_URL || 'https://augur.up.railway.app';
function App() {
  const [indicators, setIndicators] = useState(null);
  const [indicatorData, setIndicatorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const defRes = await axios.get(`${API_BASE}/api/indicators`);
        setIndicators(defRes.data);
        const ids = ['wealth_inequality','debt_to_gdp','currency_debasement','elite_overproduction','political_polarization','geopolitical_standing','middle_class_decline','infrastructure_decay','public_trust','rule_of_law','civil_unrest','media_fragmentation','resource_stress'];
        const results = await Promise.all(ids.map(async (id) => {
          try { const r = await axios.get(`${API_BASE}/api/indicators/${id}?country_code=USA&start_year=1990`); return [id, r.data]; }
          catch { return [id, null]; }
        }));
        const dm = {}; results.forEach(([id, d]) => { if (d) dm[id] = d; }); setIndicatorData(dm); setLoading(false);
      } catch (err) { setError(err.message); setLoading(false); }
    } fetchData();
  }, []);
  if (loading) return (<div className="loading-screen"><h1 className="augur-title">AUGUR</h1><p className="loading-text">Loading civilizational stress data...</p></div>);
  if (error) return (<div className="loading-screen"><h1 className="augur-title">AUGUR</h1><p className="error-text">Failed to connect: {error}</p><p className="loading-text">Make sure the API is running on port 8000</p></div>);
  return (<div className="app"><Header /><Dashboard indicators={indicators} indicatorData={indicatorData} /></div>);
}
export default App;
