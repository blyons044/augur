import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Nav from './components/Nav';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import IndicatorPage from './pages/IndicatorPage';
import EmpireExplorer from './pages/EmpireExplorer';
import CountryRankings from './pages/CountryRankings';
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
    }
    fetchData();
  }, []);

  return (
    <Router>
      <Nav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/empires" element={<EmpireExplorer />} />
        <Route path="/rankings" element={<CountryRankings />} />
        <Route path="/rankings" element={<CountryRankings />} />
        <Route path="/indicator/:id" element={
          <IndicatorPage indicatorData={indicatorData} loading={loading} error={error} />
        } />
        <Route path="/dashboard" element={
          <DashboardPage
            indicators={indicators}
            indicatorData={indicatorData}
            loading={loading}
            error={error}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;
