import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="app not-found-page">
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-desc">This page doesn't exist in the index. Unlike civilizational decline, this one's easy to fix.</p>
        <div className="not-found-links">
          <Link to="/" className="hero-cta">Back to Home</Link>
          <Link to="/dashboard" className="hero-secondary">View Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
