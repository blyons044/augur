import React from 'react';
function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="augur-title">AUGUR</h1>
        <p className="augur-subtitle">Civilizational Stress Index</p>
      </div>
      <div className="header-meta">
        <p className="header-description">13 indicators across 4 pillars. Every number traces to a publicly available primary source. Politically symmetrical. No timing claims. Fully open source.</p>
        <div className="header-links">
          <a href="https://github.com/augurofficial/augur" target="_blank" rel="noopener noreferrer" className="header-link">GitHub</a>
          <a href="https://github.com/augurofficial/augur/blob/main/METHODOLOGY.md" target="_blank" rel="noopener noreferrer" className="header-link">Methodology</a>
          <a href="https://augur.up.railway.app/api/health" target="_blank" rel="noopener noreferrer" className="header-link">API Status</a>
        </div>
      </div>
    </header>
  );
}
export default Header;
