import React from 'react';
import IndicatorCard from './IndicatorCard';
const UN = {
  political_polarization: { value: "0%", statement: "overlap between most conservative Democrat and most liberal Republican in Congress by 2023", source: "VoteView / DW-NOMINATE" },
  public_trust: { value: "8%", statement: "of Americans express confidence in Congress — near-total delegitimization", source: "Gallup, 2023" },
  rule_of_law: { value: "26th", statement: "US global ranking on World Justice Project Rule of Law Index — below all other G7 nations", source: "World Justice Project, 2024" },
  civil_unrest: { value: "900+", statement: "active militia and armed political organizations in the US — highest recorded in American history", source: "Bridging Divides Initiative, 2023" },
  wealth_inequality: { value: "30.8%", statement: "of all national wealth held by the top 1%. Bottom 50% holds 2.5%.", source: "Federal Reserve DFA" },
  middle_class_decline: { value: "50%", statement: "of American adults in middle-income households — first time below majority in measurement history", source: "Pew Research Center, 2023" },
  debt_to_gdp: { value: "122%", statement: "federal debt as percent of GDP — highest peacetime ratio in American history", source: "Federal Reserve / FRED" },
  currency_debasement: { value: "58%", statement: "dollar share of global reserves, down from 71% in 2000 — 13 point decline in 24 years", source: "IMF COFER" },
  elite_overproduction: { value: "51%", statement: "of middle-skill jobs added degree requirements without corresponding skill increases (2015-2021)", source: "Burning Glass Institute" },
  infrastructure_decay: { value: "43,586", statement: "US bridges classified as structurally deficient — average bridge age: 44 years", source: "FHWA National Bridge Inventory" },
  media_fragmentation: { value: "32%", statement: "of Americans trust national news organizations, down from 76% in 1972", source: "Gallup, 2023" },
  geopolitical_standing: { value: "15%", statement: "US share of global GDP (PPP), down from ~50% in 1945 — two-thirds relative decline", source: "World Bank / IMF" },
  resource_stress: { value: "6B gal", statement: "of treated drinking water lost daily to water main breaks — ~240,000 breaks per year", source: "AWWA" },
};
const PILLARS = [
  { id: 'social_cohesion', name: 'Social Cohesion', indicators: ['political_polarization', 'public_trust', 'rule_of_law', 'civil_unrest'] },
  { id: 'economic_structure', name: 'Economic Structure', indicators: ['wealth_inequality', 'middle_class_decline', 'debt_to_gdp', 'currency_debasement'] },
  { id: 'systemic_capacity', name: 'Systemic Capacity', indicators: ['elite_overproduction', 'infrastructure_decay', 'media_fragmentation'] },
  { id: 'external_environment', name: 'External Environment', indicators: ['geopolitical_standing', 'resource_stress'] },
];
const NAMES = {
  political_polarization: 'Political Polarization', public_trust: 'Public Trust in Institutions', rule_of_law: 'Rule of Law Erosion', civil_unrest: 'Civil Unrest Frequency',
  wealth_inequality: 'Wealth Inequality', middle_class_decline: 'Decline of the Middle Class', debt_to_gdp: 'Government Debt to GDP', currency_debasement: 'Currency Debasement / Inflation',
  elite_overproduction: 'Elite Overproduction', infrastructure_decay: 'Infrastructure Decay', media_fragmentation: 'Media Fragmentation & Epistemic Divergence',
  geopolitical_standing: 'Geopolitical Standing & External Pressure', resource_stress: 'Resource & Environmental Stress',
};
function Dashboard({ indicators, indicatorData }) {
  return (
    <main className="dashboard">
      {PILLARS.map((p) => (
        <section key={p.id} className="pillar-section">
          <h2 className="pillar-title">{p.name}</h2>
          <div className="indicator-grid">
            {p.indicators.map((id) => (
              <IndicatorCard key={id} id={id} name={NAMES[id]} uncomfortableNumber={UN[id]} data={indicatorData[id]} hasData={!!indicatorData[id]} />
            ))}
          </div>
        </section>
      ))}
      <footer className="dashboard-footer">
        <p className="footer-text">Every number on Augur traces directly to a publicly available primary source. Every transformation is logged and publicly auditable. Every published data point is cryptographically fingerprinted and independently verifiable.</p>
        <p className="footer-methodology">Augur measures structural stress, not destiny. Like a cardiologist measuring cholesterol, not predicting a heart attack date.</p>
      </footer>
    </main>
  );
}
export default Dashboard;
