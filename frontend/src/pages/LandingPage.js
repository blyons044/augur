import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const EMPIRES = [
  { name: 'Roman Republic', years: '509–27 BC', duration: '482 years', cause: 'Elite factional conflict escaped institutional containment' },
  { name: 'Ottoman Empire', years: '1299–1922', duration: '623 years', cause: 'Reform paralysis from irreconcilable internal factions' },
  { name: 'British Empire', years: '1583–1997', duration: '414 years', cause: 'Imperial overextension beyond economic capacity' },
  { name: 'Spanish Empire', years: '1492–1976', duration: '484 years', cause: 'Currency debasement and resource extraction collapse' },
  { name: 'Mongol Empire', years: '1206–1368', duration: '162 years', cause: 'Succession crises and administrative fragmentation' },
];

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.3 + 0.05,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 64, 64, ' + p.o + ')';
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(224, 64, 64, ' + (0.06 * (1 - dist/120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal-section').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="landing">

      {/* ---- HERO ---- */}
      <section className="hero">
        <div className="hero-bg" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
        <canvas ref={canvasRef} className="hero-particles" />
        <div className="hero-content">
          <p className="hero-pre">Every empire before yours has fallen</p>
          <h1 className="hero-title">AUGUR</h1>
          <p className="hero-subtitle">Civilizational Stress Index</p>
          <p className="hero-description">
            13 indicators. 4 pillars. 36,000+ data points from the Federal Reserve,
            World Bank, UCLA, and primary government sources. Every number publicly
            sourced, cryptographically verified, and politically symmetrical.
          </p>
          <div className="hero-actions">
            <Link to="/story" className="hero-cta">The Story in 5 Minutes</Link>
            <Link to="/empires" className="hero-secondary">Empire Explorer</Link>
          </div>
        </div>
      </section>

      {/* ---- WHAT IS AUGUR ---- */}
      <section className={`content-section reveal-section ${isVisible('what') ? 'visible' : ''}`} id="what">
        <div className="section-inner">
          <span className="section-label">What is Augur</span>
          <h2 className="section-title">A mirror, not a crystal ball</h2>
          <div className="section-body">
            <p>
              Augur tracks 13 structural indicators that political scientists and
              historians have identified in every major civilizational decline on record.
              Not predictions. Not opinions. Primary-source data from the Federal Reserve,
              World Bank, and government statistical agencies — processed with full
              transparency and zero editorial intervention.
            </p>
            <p>
              The data is either accurate or it isn't. Every number links to its
              source. Every transformation is logged. If anything here were wrong,
              anyone with a laptop could prove it.
            </p>
            <blockquote className="pull-quote">
              The question is never whether empires decline. The question is whether the people living through it can see the data clearly enough to act.
              <span className="quote-context">Augur exists to make the data visible.</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ---- THE FRAMEWORK ---- */}
      <section className={`content-section dark-section reveal-section ${isVisible('framework') ? 'visible' : ''}`} id="framework">
        <div className="section-inner">
          <span className="section-label">The Framework</span>
          <h2 className="section-title">13 indicators across 4 pillars</h2>
          <div className="pillars-grid">
            <div className="pillar-block">
              <h3 className="pillar-block-title">Social Cohesion</h3>
              <ul className="pillar-indicators">
                <li>Political Polarization</li>
                <li>Public Trust in Institutions</li>
                <li>Rule of Law Erosion</li>
                <li>Civil Unrest Frequency</li>
              </ul>
            </div>
            <div className="pillar-block">
              <h3 className="pillar-block-title">Economic Structure</h3>
              <ul className="pillar-indicators">
                <li>Wealth Inequality</li>
                <li>Decline of the Middle Class</li>
                <li>Government Debt to GDP</li>
                <li>Currency Debasement</li>
              </ul>
            </div>
            <div className="pillar-block">
              <h3 className="pillar-block-title">Systemic Capacity</h3>
              <ul className="pillar-indicators">
                <li>Elite Overproduction</li>
                <li>Infrastructure Decay</li>
                <li>Media Fragmentation</li>
              </ul>
            </div>
            <div className="pillar-block">
              <h3 className="pillar-block-title">External Environment</h3>
              <ul className="pillar-indicators">
                <li>Geopolitical Standing</li>
                <li>Resource Stress</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- HISTORICAL PATTERN ---- */}
      <section className={`content-section reveal-section ${isVisible('history') ? 'visible' : ''}`} id="history">
        <div className="section-inner">
          <span className="section-label">The Historical Pattern</span>
          <h2 className="section-title">Every empire before America has fallen</h2>
          <p className="section-body-intro">
            This is the most consistent pattern in recorded history. Rome,
            the Ottomans, the British, the Spanish — each followed structurally
            similar trajectories. The indicators below are not metaphors.
            They are the specific, measurable conditions that preceded
            every documented case of institutional collapse.
          </p>
          <div className="empire-timeline">
            {EMPIRES.map((empire, i) => (
              <div className="empire-entry" key={empire.name} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="empire-marker" />
                <div className="empire-info">
                  <h4 className="empire-name">{empire.name}</h4>
                  <span className="empire-years">{empire.years} · {empire.duration}</span>
                  <p className="empire-cause">{empire.cause}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- PRINCIPLES ---- */}
      <section className={`content-section dark-section reveal-section ${isVisible('principles') ? 'visible' : ''}`} id="principles">
        <div className="section-inner">
          <span className="section-label">Non-Negotiables</span>
          <h2 className="section-title">The rules that make Augur trustworthy</h2>
          <div className="principles-grid">
            <div className="principle">
              <span className="principle-number">01</span>
              <h4 className="principle-title">All data is free and publicly sourced</h4>
              <p className="principle-desc">Zero paywalled data. Anyone with a computer can verify every number independently.</p>
            </div>
            <div className="principle">
              <span className="principle-number">02</span>
              <h4 className="principle-title">Political symmetry is absolute</h4>
              <p className="principle-desc">Identical analytical treatment regardless of partisan implications. Every indicator, every country.</p>
            </div>
            <div className="principle">
              <span className="principle-number">03</span>
              <h4 className="principle-title">No timing claims, ever</h4>
              <p className="principle-desc">The timing of civilizational decline is never knowable from structural data alone. Augur measures stress, not destiny.</p>
            </div>
            <div className="principle">
              <span className="principle-number">04</span>
              <h4 className="principle-title">Fully open source</h4>
              <p className="principle-desc">Public GitHub, public methodology, public data hashes. The strongest defense against tampering claims is total transparency.</p>
            </div>
            <div className="principle">
              <span className="principle-number">05</span>
              <h4 className="principle-title">Cryptographic integrity</h4>
              <p className="principle-desc">Every data point is SHA-256 fingerprinted. Every transformation is logged. If any number were altered, anyone could prove it.</p>
            </div>
            <div className="principle">
              <span className="principle-number">06</span>
              <h4 className="principle-title">No user accounts, ever</h4>
              <p className="principle-desc">Eliminates the entire PII attack surface. Augur collects nothing about you. The product is the data, not the user.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className={`content-section cta-section reveal-section ${isVisible('cta') ? 'visible' : ''}`} id="cta">
        <div className="section-inner cta-inner">
          <h2 className="cta-title">See the data</h2>
          <p className="cta-description">
            36,000+ data points. 13 indicators. Every number traced to its source.
          </p>
          <Link to="/dashboard" className="hero-cta">Enter the Dashboard</Link>
          <div className="cta-links">
            <a href="https://github.com/augurofficial/augur" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="cta-divider">·</span>
            <a href="https://augur.up.railway.app/api/docs" target="_blank" rel="noopener noreferrer">API Documentation</a>
            <span className="cta-divider">·</span>
            <a href="https://augur.up.railway.app/api/integrity/hashes" target="_blank" rel="noopener noreferrer">Verify Data Integrity</a>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="landing-footer">
        <p>AUGUR — Civilizational Stress Index</p>
        <p className="footer-small">
          Every number on Augur traces directly to a publicly available primary source.
          No data has ever been silently altered. If any of this were untrue, anyone with a computer could prove it.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
