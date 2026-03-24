import React from 'react';
import { Link } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import Header from '../components/Header';

function DashboardPage({ indicators, indicatorData, loading, error }) {
  if (loading) {
    return (
      <div className="loading-screen">
        <h1 className="augur-title">AUGUR</h1>
        <p className="loading-text">Loading civilizational stress data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <h1 className="augur-title">AUGUR</h1>
        <p className="error-text">Failed to connect: {error}</p>
        <p className="loading-text">Make sure the API is running</p>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="dashboard-nav">
        <Link to="/" className="nav-back">← Back to Augur</Link>
      </nav>
      <Header />
      <Dashboard indicators={indicators} indicatorData={indicatorData} />
    </div>
  );
}

export default DashboardPage;
