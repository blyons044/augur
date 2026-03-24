import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Nav() {
  const loc = useLocation();
  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/empires', label: 'Empires' },
    { to: '/rankings', label: 'Rankings' },
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
