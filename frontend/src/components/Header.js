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
          <span className="header-link">GitHub</span>
          <span className="header-link">Methodology</span>
          <span className="header-link">Data Integrity</span>
        </div>
      </div>
    </header>
  );
}
export default Header;
