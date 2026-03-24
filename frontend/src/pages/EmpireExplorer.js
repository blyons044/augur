import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EMPIRES = {
  rome: {
    name: 'Roman Republic → Empire',
    period: '509 BC – 476 AD',
    peak: '~117 AD under Trajan',
    duration: '985 years (Republic + Empire)',
    color: '#c0a050',
    phases: [
      { name: 'Expansion & Consolidation', years: '509–133 BC', desc: 'Conquest of Italy, Punic Wars, Mediterranean dominance. Functional institutions, citizen-soldier army, expanding franchise.' },
      { name: 'Crisis of the Republic', years: '133–27 BC', desc: 'Gracchi reforms fail. Marius and Sulla. Civil wars. Institutional norms collapse faster than institutions themselves.' },
      { name: 'Imperial Zenith', years: '27 BC–180 AD', desc: 'Augustus through Marcus Aurelius. Peak territorial extent, infrastructure, trade. But republican institutions hollowed out.' },
      { name: 'Crisis & Fragmentation', years: '180–284 AD', desc: 'Year of Five Emperors. Currency debasement (denarius silver content: 95% → 5%). 50 years of military anarchy.' },
      { name: 'Terminal Decline', years: '284–476 AD', desc: 'Diocletian splits empire. Constantine moves capital. Western empire becomes ungovernable. Institutional memory lost.' },
    ],
    parallels: [
      { indicator: 'Political Polarization', roman: 'Optimates vs Populares — elimination of centrist senators', us: 'DW-NOMINATE party overlap: 50%+ → 0% (1970s–2023)' },
      { indicator: 'Wealth Inequality', roman: 'Latifundia concentration — 2% owned most land by 100 BC', us: 'Top 1% holds 30.8% of national wealth; bottom 50% holds 2.5%' },
      { indicator: 'Currency Debasement', roman: 'Denarius: 95% silver → 5% over 200 years', us: 'Dollar purchasing power declined 87% since 1971; reserve share: 71% → 58%' },
      { indicator: 'Elite Overproduction', roman: 'More senators than positions — cursus honorum bottleneck', us: '51% of jobs added degree requirements without skill increases' },
      { indicator: 'Infrastructure Decay', roman: 'Aqueduct maintenance abandoned by 3rd century', us: '43,586 structurally deficient bridges; 240K water main breaks/year' },
      { indicator: 'Civil Unrest', roman: 'Armed political factions (Clodius vs Milo) by 50s BC', us: '900+ armed militia organizations — highest recorded count' },
    ],
  },
  ottoman: {
    name: 'Ottoman Empire',
    period: '1299 – 1922',
    peak: '~1590 under Suleiman\'s successors',
    duration: '623 years',
    color: '#50a080',
    phases: [
      { name: 'Expansion', years: '1299–1453', desc: 'Conquest of Anatolia, Balkans. Fall of Constantinople. Devshirme system creates meritocratic elite.' },
      { name: 'Classical Age', years: '1453–1566', desc: 'Suleiman the Magnificent. Peak territorial extent, legal codification, architectural achievement.' },
      { name: 'Stagnation', years: '1566–1718', desc: 'Military defeats begin. Janissaries become hereditary, resist reform. Provincial autonomy grows.' },
      { name: 'Reform Attempts', years: '1718–1876', desc: 'Tulip Era, Tanzimat reforms. Every modernization effort blocked by entrenched interests.' },
      { name: 'Collapse', years: '1876–1922', desc: 'Young Turks. WWI. Partition. The "Sick Man of Europe" label becomes self-fulfilling.' },
    ],
    parallels: [
      { indicator: 'Public Trust', ottoman: 'Sultanate legitimacy eroded as reforms failed repeatedly', us: '8% confidence in Congress — lowest in measurement history' },
      { indicator: 'Rule of Law', ottoman: 'Parallel legal systems — sharia, kanun, capitulations — no unified framework', us: 'WJP Rule of Law ranking: 26th globally, below all G7 peers' },
      { indicator: 'Elite Overproduction', ottoman: 'Devshirme abolished — hereditary elite captured all positions', us: 'Credential inflation without corresponding opportunity expansion' },
      { indicator: 'Debt to GDP', ottoman: 'Ottoman Public Debt Administration (1881) — foreign creditors controlled fiscal policy', us: '122% debt-to-GDP — highest peacetime ratio in American history' },
      { indicator: 'Media Fragmentation', ottoman: 'Competing newspapers in 5 languages — no shared information space', us: 'News trust: 76% (1972) → 32% (2023); partisan gap: 44 points' },
    ],
  },
  british: {
    name: 'British Empire',
    period: '1583 – 1997',
    peak: '~1920 (largest territorial extent)',
    duration: '414 years',
    color: '#5080c0',
    phases: [
      { name: 'Colonial Foundation', years: '1583–1707', desc: 'Virginia, East India Company, Acts of Union. Naval power as strategic doctrine.' },
      { name: 'First Empire', years: '1707–1783', desc: 'Global trade dominance, slave economy, loss of American colonies. Sterling as reserve currency.' },
      { name: 'Imperial Zenith', years: '1783–1914', desc: 'Pax Britannica. Industrial revolution. Quarter of world\'s land surface. But costs rising.' },
      { name: 'Managed Decline', years: '1914–1956', desc: 'Two World Wars drain treasury. Suez Crisis (1956) ends illusion of independent great-power action.' },
      { name: 'Post-Imperial Adjustment', years: '1956–1997', desc: 'Hong Kong handover. Sterling crises. "Special relationship" as managed dependency on successor hegemon.' },
    ],
    parallels: [
      { indicator: 'Geopolitical Standing', british: 'GDP share: ~25% of world (1870) → ~4% (1980)', us: 'GDP share (PPP): ~50% (1945) → 15% (2024)' },
      { indicator: 'Currency Debasement', british: 'Sterling: world reserve currency → 1967 devaluation → floating', us: 'Dollar reserve share: 71% (2000) → 58% (2024)' },
      { indicator: 'Debt to GDP', british: 'Post-WWII debt: 250% of GDP — took 50 years to resolve', us: '122% and accelerating — no plan for stabilization' },
      { indicator: 'Infrastructure Decay', british: 'Victorian-era infrastructure still in use by 1970s — chronic underinvestment', us: 'Average bridge age: 44 years. American Society of Civil Engineers grade: C-' },
      { indicator: 'Wealth Inequality', british: 'Landed aristocracy controlled 70%+ of wealth through 19th century', us: 'Top 1% holds 30.8% — approaching Gilded Age levels' },
    ],
  },
};

function EmpireExplorer() {
  const [selected, setSelected] = useState('rome');
  const empire = EMPIRES[selected];

  return (
    <div className="app empire-explorer">
      

      <header className="indicator-header">
        <span className="section-label">Empire Explorer</span>
        <h1 className="indicator-page-title">Patterns of Decline</h1>
        <p className="section-body-intro" style={{maxWidth:'640px'}}>
          Every major empire follows structurally similar trajectories.
          The indicators differ in specifics but rhyme in pattern.
          Select an empire to see how its decline maps to Augur's 13 indicators.
        </p>
      </header>

      <div className="empire-selector">
        {Object.entries(EMPIRES).map(([key, emp]) => (
          <button
            key={key}
            className={`empire-tab ${selected === key ? 'active' : ''}`}
            onClick={() => setSelected(key)}
            style={selected === key ? {borderColor: emp.color, color: emp.color} : {}}
          >
            {emp.name}
          </button>
        ))}
      </div>

      <section className="empire-detail">
        <div className="empire-detail-header">
          <h2 className="empire-detail-name" style={{color: empire.color}}>{empire.name}</h2>
          <div className="empire-detail-meta">
            <span>{empire.period}</span>
            <span>Peak: {empire.peak}</span>
            <span>{empire.duration}</span>
          </div>
        </div>

        <div className="empire-phases">
          <h3 className="empire-section-title">Trajectory</h3>
          <div className="phases-timeline">
            {empire.phases.map((phase, i) => (
              <div className="phase-entry" key={i}>
                <div className="phase-marker" style={{borderColor: empire.color}} />
                <div className="phase-content">
                  <h4 className="phase-name">{phase.name}</h4>
                  <span className="phase-years">{phase.years}</span>
                  <p className="phase-desc">{phase.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="empire-parallels">
          <h3 className="empire-section-title">Structural Parallels</h3>
          <p className="parallels-intro">
            Side-by-side comparison of specific indicators between {empire.name.split('→')[0].trim()} and the modern United States.
          </p>
          <div className="parallels-grid">
            {empire.parallels.map((p, i) => (
              <div className="parallel-card" key={i}>
                <h4 className="parallel-indicator">{p.indicator}</h4>
                <div className="parallel-comparison">
                  <div className="parallel-side">
                    <span className="parallel-label" style={{color: empire.color}}>
                      {selected === 'rome' ? 'ROME' : selected === 'ottoman' ? 'OTTOMAN' : 'BRITISH'}
                    </span>
                    <p>{p[selected === 'rome' ? 'roman' : selected === 'ottoman' ? 'ottoman' : 'british']}</p>
                  </div>
                  <div className="parallel-divider" />
                  <div className="parallel-side">
                    <span className="parallel-label" style={{color: 'var(--red)'}}>UNITED STATES</span>
                    <p>{p.us}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="empire-cta">
        <Link to="/dashboard" className="hero-cta">View Current US Data →</Link>
      </div>

      <footer className="dashboard-footer">
        <p className="footer-methodology">
          Historical comparisons are structural, not predictive. Augur does not claim the United States will follow any specific trajectory.
        </p>
      </footer>
    </div>
  );
}

export default EmpireExplorer;
