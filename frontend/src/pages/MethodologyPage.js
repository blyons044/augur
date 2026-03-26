import React from 'react';
import { Link } from 'react-router-dom';

const METHODOLOGY = {
  version: "3.0",
  aggregation: { method: "Weighted geometric mean", formula: "(\u220F s\u1D62^w\u1D62)^(1/\u03A3w\u1D62)" },
  indicators: [
    { name:"Institutional Trust", role:"leading", domain:"state", redFlag:85, justification:"Leading indicator of state legitimacy (Goldstone 1991)." },
    { name:"Political Polarization", role:"leading", domain:"elite", redFlag:80, justification:"Most important leading indicator in SDT (Turchin 2013)." },
    { name:"Wealth Concentration", role:"leading", domain:"elite", redFlag:80, justification:"Proxies elite resource capture (Piketty 2014)." },
    { name:"Debt Burden", role:"coincident", domain:"state", redFlag:90, justification:"Core SDT component: state fiscal distress." },
    { name:"Epistemic Fracture", role:"coincident", domain:"augmented", redFlag:75, justification:"AUGMENTED. Shared epistemic frameworks prerequisite for governance." },
    { name:"Employment Ratio", role:"coincident", domain:"population", redFlag:80, justification:"Proxies popular immiseration including discouraged workers." },
    { name:"Unemployment", role:"lagging", domain:"population", redFlag:85, justification:"LAGGING. Rises after structural problems manifest." },
    { name:"Consumer Sentiment", role:"lagging", domain:"augmented", redFlag:80, justification:"LAGGING + AUGMENTED. Population stress thermometer." },
    { name:"Savings Rate", role:"lagging", domain:"population", redFlag:75, justification:"LAGGING. Responds to conditions, not a driver." },
  ],
  references: [
    "Turchin, P. (2003) Historical Dynamics. Princeton University Press.",
    "Turchin, P. (2016) Ages of Discord. Beresta Books.",
    "Turchin, P. & Nefedov, S. (2009) Secular Cycles. Princeton University Press.",
    "Goldstone, J. (1991) Revolution and Rebellion in the Early Modern World.",
    "Turchin, P. (2013) Modeling Social Pressures toward Instability. Cliodynamics 4(2).",
    "OECD/JRC (2008) Handbook on Constructing Composite Indicators.",
    "Piketty, T. (2014) Capital in the Twenty-First Century.",
    "Saisana, M. et al. (2005) Uncertainty and Sensitivity Analysis Techniques.",
  ],
};

const roleColor = { leading:"#e04040", coincident:"#e0a030", lagging:"#6090c0" };
const roleBg = { leading:"rgba(224,64,64,0.12)", coincident:"rgba(224,160,48,0.12)", lagging:"rgba(96,144,192,0.12)" };
const domainBg = { state:"rgba(96,144,192,0.08)", elite:"rgba(224,64,64,0.08)", population:"rgba(224,160,48,0.08)", augmented:"rgba(128,128,128,0.08)" };

function MethodologyPage() {
  return (
    <main style={{maxWidth:"800px",margin:"0 auto",padding:"40px 24px"}}>
      <Link to="/dashboard" style={{font:"400 12px var(--font-mono)",color:"var(--text-muted)",textDecoration:"none"}}>\u2190 Back to Dashboard</Link>
      <h1 style={{font:"400 32px var(--font-display)",color:"var(--text-bright)",margin:"24px 0 8px"}}>Methodology v{METHODOLOGY.version}</h1>
      <p style={{font:"400 13px var(--font-mono)",color:"var(--text-muted)",marginBottom:"40px"}}>Every methodological choice justified, every limitation disclosed.</p>

      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Theoretical Framework</h2>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7,marginBottom:"16px"}}>
          Augur is grounded in structural-demographic theory (Turchin 2003, 2016; Goldstone 1991) but augments it with indicators for epistemic cohesion and consumer sentiment not in the core SDT model. These augmented indicators are tagged as such. Users who wish to compute a pure SDT score can exclude them.
        </p>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7}}>
          Augur does not predict collapse, specific events, or their timing. External validation confirms it correlates with cumulative structural decay (deaths of despair, institutional erosion) but not with contingent events (protests, terrorism). Like a blood pressure reading — it identifies risk factors, not outcomes.
        </p>
      </section>

      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Aggregation</h2>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7,marginBottom:"12px"}}>
          Geometric mean penalizes imbalance. A country scoring 95 on trust stress and 5 on savings stress gets ~22 geometrically, not 50 arithmetically. The UNDP adopted geometric aggregation for the HDI in 2010 for this exact reason.
        </p>
      </section>

      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Sensitivity Analysis</h2>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7}}>
          10,000 Monte Carlo simulations with weights drawn from Uniform[0.5, 1.5] around defaults. The 90% confidence interval shows score stability. A CI width under 20 indicates robust results. No single indicator should drive more than 40% of output variance.
        </p>
      </section>

      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Missing Data Policy</h2>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7}}>
          Missing indicators are excluded from the composite (denominator shrinks). No imputation. Coverage ratio is reported alongside every score. Scores with fewer than 6 of 9 indicators are flagged as insufficient and excluded from cross-country rankings.
        </p>
      </section>

      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Indicator Specifications</h2>
        {METHODOLOGY.indicators.map((ind, i) => (
          <div key={i} style={{marginBottom:"16px",padding:"14px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:"4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <span style={{font:"500 14px var(--font-display)",color:"var(--text-bright)"}}>{ind.name}</span>
              <span style={{font:"400 9px var(--font-mono)",padding:"2px 6px",borderRadius:"3px",letterSpacing:".5px",textTransform:"uppercase",color:roleColor[ind.role],background:roleBg[ind.role]}}>{ind.role}</span>
              <span style={{font:"400 9px var(--font-mono)",padding:"2px 6px",borderRadius:"3px",letterSpacing:".5px",textTransform:"uppercase",color:"var(--text-muted)",background:domainBg[ind.domain]}}>{ind.domain}</span>
            </div>
            <div style={{font:"400 12px var(--font-mono)",color:"var(--text-secondary)",lineHeight:1.5}}>{ind.justification}</div>
            <div style={{font:"400 10px var(--font-mono)",color:"var(--text-muted)",marginTop:"4px"}}>Red flag threshold: \u2265{ind.redFlag}/100</div>
          </div>
        ))}
      </section>
      <section style={{marginBottom:"48px"}}>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>Cross-country validation (n=20)</h2>
        <p style={{font:"400 14px var(--font-body)",color:"var(--text-secondary)",lineHeight:1.7,marginBottom:"16px"}}>
          A simplified stress composite was computed for 20 countries using internationally comparable indicators (World Bank debt/GDP, Gini, unemployment, inflation, savings rate; Freedom House score). This composite was then correlated against World Governance Indicators — which were NOT used in the composite — as an external validation test.
        </p>
        <div style={{overflowX:"auto",marginBottom:"16px"}}>
          <table style={{width:"100%",borderCollapse:"collapse",font:"400 12px var(--font-mono)",color:"var(--text-secondary)"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)",textAlign:"left"}}>
                <th style={{padding:"8px 12px",font:"500 10px var(--font-mono)",letterSpacing:"1px",textTransform:"uppercase",color:"var(--text-muted)"}}>Validation target</th>
                <th style={{padding:"8px 12px",font:"500 10px var(--font-mono)",letterSpacing:"1px",textTransform:"uppercase",color:"var(--text-muted)"}}>r</th>
                <th style={{padding:"8px 12px",font:"500 10px var(--font-mono)",letterSpacing:"1px",textTransform:"uppercase",color:"var(--text-muted)"}}>n</th>
                <th style={{padding:"8px 12px",font:"500 10px var(--font-mono)",letterSpacing:"1px",textTransform:"uppercase",color:"var(--text-muted)"}}>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:"1px solid var(--border)"}}><td style={{padding:"6px 12px"}}>WGI Government Effectiveness</td><td style={{padding:"6px 12px",color:"#40c080",fontWeight:"600"}}>-0.719</td><td style={{padding:"6px 12px"}}>20</td><td style={{padding:"6px 12px",color:"#40c080"}}>Strong · Confirmed</td></tr>
              <tr style={{borderBottom:"1px solid var(--border)"}}><td style={{padding:"6px 12px"}}>Intentional Homicides / 100K</td><td style={{padding:"6px 12px",color:"#40c080"}}>+0.616</td><td style={{padding:"6px 12px"}}>20</td><td style={{padding:"6px 12px",color:"#40c080"}}>Moderate · Confirmed</td></tr>
              <tr style={{borderBottom:"1px solid var(--border)"}}><td style={{padding:"6px 12px"}}>WGI Political Stability</td><td style={{padding:"6px 12px",color:"#40c080"}}>-0.583</td><td style={{padding:"6px 12px"}}>20</td><td style={{padding:"6px 12px",color:"#40c080"}}>Moderate · Confirmed</td></tr>
              <tr style={{borderBottom:"1px solid var(--border)"}}><td style={{padding:"6px 12px"}}>WGI Corruption Control</td><td style={{padding:"6px 12px",color:"#40c080"}}>-0.522</td><td style={{padding:"6px 12px"}}>20</td><td style={{padding:"6px 12px",color:"#40c080"}}>Moderate · Confirmed</td></tr>
              <tr><td style={{padding:"6px 12px"}}>WGI Rule of Law</td><td style={{padding:"6px 12px",color:"#40c080"}}>-0.520</td><td style={{padding:"6px 12px"}}>20</td><td style={{padding:"6px 12px",color:"#40c080"}}>Moderate · Confirmed</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{background:"var(--bg-accent)",padding:"16px",borderRadius:"4px",marginBottom:"16px"}}>
          <div style={{font:"500 10px var(--font-mono)",color:"var(--text-muted)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>Key finding</div>
          <p style={{font:"400 12px var(--font-mono)",color:"var(--text-secondary)",margin:"0 0 8px"}}>5/5 cross-country validation targets confirmed in the expected direction. Government effectiveness achieved the strong threshold (r = -0.719). Countries with higher Augur stress scores have measurably lower governance quality, more homicides, and less political stability — using indicators entirely independent of the composite inputs.</p>
          <p style={{font:"400 12px var(--font-mono)",color:"var(--text-secondary)",margin:"0 0 8px"}}>Country rankings pass face validity: Nigeria (55.7), Argentina (52.2), Brazil (51.0) at the top; Sweden (14.8), Japan (15.0), South Korea (16.1) at the bottom. The US ranks 6th highest (41.7), above all other developed nations in the sample.</p>
          <p style={{font:"400 12px var(--font-mono)",color:"var(--text-muted)",margin:0,fontStyle:"italic"}}>Limitations: China scores low (13.3) due to officially reported statistics that may not reflect structural reality in authoritarian systems. The cross-country composite uses fewer indicators than the US-specific composite. Sample size is 20 countries — results should be replicated on the full 50-country dataset.</p>
        </div>
      </section>



      <section>
        <h2 style={{font:"500 18px var(--font-display)",color:"var(--text-bright)",marginBottom:"16px",borderBottom:"1px solid var(--border)",paddingBottom:"8px"}}>References</h2>
        {METHODOLOGY.references.map((ref, i) => (
          <div key={i} style={{font:"400 12px var(--font-mono)",color:"var(--text-secondary)",padding:"4px 0"}}>[{i+1}] {ref}</div>
        ))}
      </section>
    </main>
  );
}

export default MethodologyPage;