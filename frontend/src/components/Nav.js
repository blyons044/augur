import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Nav() {
  const loc = useLocation();
  useEffect(() => {
    const titles = {
      '/': 'AUGUR — Civilizational Stress Index',
      '/dashboard': 'Dashboard — AUGUR',
      '/empires': 'Empire Explorer — AUGUR',
      '/rankings': 'Country Rankings — AUGUR',
      '/compare': 'Country Comparison — AUGUR',
      '/story': 'The Story — AUGUR',
      '/api-docs': 'API Documentation — AUGUR',
    };
    const match = titles[loc.pathname] || (loc.pathname.startsWith('/indicator/') ? loc.pathname.split('/')[2].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' — AUGUR' : 'AUGUR');
    document.title = match;
  }, [loc.pathname]);
  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/empires', label: 'Empires' },
    { to: '/rankings', label: 'Rankings' },
    { to: '/compare', label: 'Compare' },
    { to: '/api-docs', label: 'API' },
  ];
  return (
    <nav className="site-nav">
      <Link to="/" className="nav-logo">AUGUR</Link>
      <div className="nav-links">
        {links.map(l => (
          <Link key={l.to} to={l.to} className={'nav-link' + (loc.pathname === l.to ? ' nav-active' : '')}>
            {l.label}
          </Link>
        ))}
      </div>
      <a href="https://github.com/augurofficial/augur" className="nav-link nav-github" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>
  );
}

export default Nav;
