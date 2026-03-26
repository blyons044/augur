"""
Augur Scoring Engine v3.0 — Academically Defensible Composite Index
"""
import math, random, hashlib, json
from dataclasses import dataclass, field, asdict
from typing import Optional
from enum import Enum

class IndicatorRole(str, Enum):
    LEADING = "leading"
    COINCIDENT = "coincident"
    LAGGING = "lagging"

class TheoreticalDomain(str, Enum):
    POPULATION = "population"
    ELITE = "elite"
    STATE = "state"
    AUGMENTED = "augmented"

@dataclass
class IndicatorSpec:
    id: str
    name: str
    pillar: str
    role: IndicatorRole
    domain: TheoreticalDomain
    direction: str
    norm_method: str
    norm_reference: str
    default_weight: float = 1.0
    weight_justification: str = ""
    red_flag_threshold: Optional[float] = None
    red_flag_label: str = ""
    primary_series: dict = field(default_factory=dict)
    equivalence_notes: str = ""
    citations: list = field(default_factory=list)

INDICATORS = {
    "institutional_trust": IndicatorSpec(
        id="institutional_trust", name="Institutional Trust",
        pillar="social_cohesion", role=IndicatorRole.LEADING,
        domain=TheoreticalDomain.STATE, direction="lower_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. Trust is a leading indicator of state legitimacy (Goldstone 1991).",
        red_flag_threshold=85, red_flag_label="Below crisis threshold",
        primary_series={"USA": "gallup_congress"},
        equivalence_notes="US: Gallup Congressional approval. International: Gallup World Poll govt confidence. Different constructs.",
        citations=["Goldstone (1991) Revolution and Rebellion", "Turchin (2016) Ages of Discord Ch.8"],
    ),
    "political_polarization": IndicatorSpec(
        id="political_polarization", name="Political Polarization",
        pillar="social_cohesion", role=IndicatorRole.LEADING,
        domain=TheoreticalDomain.ELITE, direction="higher_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. Elite polarization is the most important leading indicator in SDT.",
        red_flag_threshold=80, red_flag_label="Historically extreme levels",
        primary_series={"USA": "dw_nominate_House_200"},
        equivalence_notes="US: DW-NOMINATE (behavioral). International: V-Dem (expert-coded). Not directly comparable.",
        citations=["Poole & Rosenthal (1997)", "Turchin (2013) Cliodynamics 4(2)"],
    ),
    "debt_burden": IndicatorSpec(
        id="debt_burden", name="Government Debt Burden",
        pillar="economic_structure", role=IndicatorRole.COINCIDENT,
        domain=TheoreticalDomain.STATE, direction="higher_is_worse",
        norm_method="percentile_rank", norm_reference="oecd_historical",
        weight_justification="Equal weight. State fiscal distress is a core SDT component.",
        red_flag_threshold=90, red_flag_label="Exceeds sustainability threshold",
        primary_series={"USA": "GFDEGDQ188S"},
        equivalence_notes="US: FRED federal debt/GDP. International: World Bank general govt debt. Different scope.",
        citations=["Reinhart & Rogoff (2010)", "Turchin & Nefedov (2009) Secular Cycles"],
    ),
    "wealth_concentration": IndicatorSpec(
        id="wealth_concentration", name="Wealth Concentration",
        pillar="economic_structure", role=IndicatorRole.LEADING,
        domain=TheoreticalDomain.ELITE, direction="higher_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. Proxies elite resource capture (Piketty 2014, Turchin 2016).",
        red_flag_threshold=80, red_flag_label="Gilded Age levels",
        primary_series={"USA": "WFRBST01134"},
        equivalence_notes="US: Fed Distributional Financial Accounts. International: WID. Different methodologies.",
        citations=["Piketty (2014) Capital in the 21st Century", "Saez & Zucman (2016)"],
    ),
    "epistemic_fracture": IndicatorSpec(
        id="epistemic_fracture", name="Epistemic Fracture",
        pillar="social_cohesion", role=IndicatorRole.COINCIDENT,
        domain=TheoreticalDomain.AUGMENTED, direction="lower_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. AUGMENTED indicator — not in core SDT. Shared epistemic frameworks are prerequisites for democratic governance.",
        red_flag_threshold=75, red_flag_label="Below functional democracy threshold",
        primary_series={"USA": "gallup_news_trust"},
        equivalence_notes="US: Gallup media trust. International: Reuters Digital News Report. Different constructs.",
        citations=["Sunstein (2017) #Republic"],
    ),
    "employment_ratio": IndicatorSpec(
        id="employment_ratio", name="Employment-Population Ratio",
        pillar="economic_structure", role=IndicatorRole.COINCIDENT,
        domain=TheoreticalDomain.POPULATION, direction="lower_is_worse",
        norm_method="percentile_rank", norm_reference="oecd_historical",
        weight_justification="Equal weight. Captures labor market health including discouraged workers. Proxies popular immiseration.",
        red_flag_threshold=80, red_flag_label="Below historical trend",
        primary_series={"USA": "EMRATIO"},
        equivalence_notes="Comparable across OECD via harmonized labor force surveys.",
    ),
    "unemployment": IndicatorSpec(
        id="unemployment", name="Unemployment Rate",
        pillar="economic_structure", role=IndicatorRole.LAGGING,
        domain=TheoreticalDomain.POPULATION, direction="higher_is_worse",
        norm_method="percentile_rank", norm_reference="oecd_historical",
        weight_justification="Equal weight. LAGGING — rises after structural problems manifest. Weight could be reduced.",
        red_flag_threshold=85, red_flag_label="Above structural rate",
        primary_series={"USA": "UNRATE"},
        equivalence_notes="ILO-harmonized rates are broadly comparable.",
    ),
    "consumer_sentiment": IndicatorSpec(
        id="consumer_sentiment", name="Consumer Sentiment",
        pillar="economic_structure", role=IndicatorRole.LAGGING,
        domain=TheoreticalDomain.AUGMENTED, direction="lower_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. LAGGING + AUGMENTED. Population stress thermometer. Reviewers may argue for reduced weight.",
        red_flag_threshold=80, red_flag_label="Recessionary levels",
        primary_series={"USA": "UMCSENT"},
        equivalence_notes="Michigan CSI is US-only. No international equivalent. EXCLUDED from non-US composites.",
    ),
    "savings_rate": IndicatorSpec(
        id="savings_rate", name="Personal Savings Rate",
        pillar="economic_structure", role=IndicatorRole.LAGGING,
        domain=TheoreticalDomain.POPULATION, direction="lower_is_worse",
        norm_method="percentile_rank", norm_reference="us_historical",
        weight_justification="Equal weight. LAGGING — responds to conditions. Proxies household financial resilience.",
        red_flag_threshold=75, red_flag_label="Household financial fragility",
        primary_series={"USA": "PSAVERT"},
        equivalence_notes="US: BEA personal savings/disposable income. World Bank: gross national savings/GDP. NOT comparable.",
    ),
}

def normalize_percentile_rank(value, historical_values, direction):
    if not historical_values: return None
    sorted_vals = sorted(historical_values)
    n = len(sorted_vals)
    rank = sum(1 for v in sorted_vals if v <= value)
    percentile = (rank / n) * 100
    if direction == "lower_is_worse":
        return round(100 - percentile, 2)
    return round(percentile, 2)

def aggregate_arithmetic(scores, weights=None):
    if not scores: return None
    if weights is None: weights = [1.0] * len(scores)
    total_weight = sum(weights)
    weighted_sum = sum(s["stress_score"] * w for s, w in zip(scores, weights))
    return round(weighted_sum / total_weight, 2)

def aggregate_geometric(scores, weights=None):
    """Geometric mean — penalizes imbalance. HDI switched to this in 2010."""
    if not scores: return None
    if weights is None: weights = [1.0] * len(scores)
    total_weight = sum(weights)
    log_sum = sum(w * math.log(max(s["stress_score"], 1.0)) for s, w in zip(scores, weights))
    return round(math.exp(log_sum / total_weight), 2)

def check_red_flags(scores, indicators):
    flags = []
    for s in scores:
        spec = indicators.get(s["indicator_id"])
        if spec and spec.red_flag_threshold and s["stress_score"] >= spec.red_flag_threshold:
            flags.append({
                "indicator_id": s["indicator_id"], "indicator_name": spec.name,
                "stress_score": s["stress_score"], "threshold": spec.red_flag_threshold,
                "label": spec.red_flag_label, "role": spec.role.value, "domain": spec.domain.value,
            })
    return flags

def run_sensitivity_analysis(scores, indicators, n_simulations=10000, seed=42):
    """Monte Carlo: randomize weights, compute distribution of composites."""
    random.seed(seed)
    n_ind = len(scores)
    if n_ind == 0: return None
    composites = []
    weight_draws = []
    for _ in range(n_simulations):
        weights = [random.uniform(0.5, 1.5) for _ in range(n_ind)]
        composites.append(aggregate_geometric(scores, weights))
        weight_draws.append(weights)
    composites_sorted = sorted(composites)
    n = len(composites_sorted)
    mean_val = sum(composites) / n
    ci_lower = composites_sorted[int(n * 0.05)]
    ci_upper = composites_sorted[int(n * 0.95)]
    variance = sum((c - mean_val) ** 2 for c in composites) / n
    # First-order sensitivity
    indicator_influence = {}
    for i, s in enumerate(scores):
        ind_weights = [wd[i] for wd in weight_draws]
        w_mean = sum(ind_weights) / n
        cov = sum((w - w_mean) * (c - mean_val) for w, c in zip(ind_weights, composites)) / n
        w_var = sum((w - w_mean) ** 2 for w in ind_weights) / n
        corr = abs(cov / (math.sqrt(w_var) * math.sqrt(variance))) if w_var > 0 and variance > 0 else 0
        indicator_influence[s["indicator_id"]] = round(corr, 4)
    total_inf = sum(indicator_influence.values())
    if total_inf > 0:
        indicator_influence = {k: round(v/total_inf, 4) for k, v in indicator_influence.items()}
    return {
        "composite_mean": round(mean_val, 2), "ci_90_lower": round(ci_lower, 2),
        "ci_90_upper": round(ci_upper, 2), "ci_90_width": round(ci_upper - ci_lower, 2),
        "std_dev": round(math.sqrt(variance), 2), "n_simulations": n_simulations,
        "indicator_influence": indicator_influence, "random_seed": seed,
    }

@dataclass
class CoverageReport:
    country_code: str
    total_indicators: int
    available_indicators: int
    missing_indicators: list
    coverage_ratio: float
    sufficient_coverage: bool
    excluded_reason: dict = field(default_factory=dict)

def assess_coverage(country_code, available_data, indicators):
    total = len(indicators)
    missing = []
    reasons = {}
    for ind_id, spec in indicators.items():
        if country_code not in spec.primary_series:
            missing.append(ind_id)
            reasons[ind_id] = "No equivalent series for this country"
        elif ind_id not in available_data or available_data[ind_id] is None:
            missing.append(ind_id)
            reasons[ind_id] = "Series mapped but no data available"
    available = total - len(missing)
    coverage = available / total if total > 0 else 0
    return CoverageReport(country_code=country_code, total_indicators=total,
        available_indicators=available, missing_indicators=missing,
        coverage_ratio=round(coverage, 3), sufficient_coverage=coverage >= 0.67,
        excluded_reason=reasons)

def compute_composite(country_code, year, raw_values, historical_distributions, run_sens=True):
    coverage = assess_coverage(country_code, raw_values, INDICATORS)
    component_scores = []
    for ind_id, spec in INDICATORS.items():
        if ind_id in raw_values and raw_values[ind_id] is not None:
            hist = historical_distributions.get(ind_id, [])
            stress = normalize_percentile_rank(raw_values[ind_id], hist, spec.direction)
            if stress is not None:
                component_scores.append({
                    "indicator_id": ind_id, "indicator_name": spec.name,
                    "raw_value": raw_values[ind_id], "stress_score": stress,
                    "role": spec.role.value, "domain": spec.domain.value,
                    "weight": spec.default_weight, "red_flag_threshold": spec.red_flag_threshold,
                })
    if not component_scores: return None
    weights = [s["weight"] for s in component_scores]
    geometric = aggregate_geometric(component_scores, weights)
    arithmetic = aggregate_arithmetic(component_scores, weights)
    red_flags = check_red_flags(component_scores, INDICATORS)
    sensitivity = run_sensitivity_analysis(component_scores, INDICATORS) if run_sens and len(component_scores) >= 3 else None
    leading = [s["stress_score"] for s in component_scores if s["role"] == "leading"]
    lagging = [s["stress_score"] for s in component_scores if s["role"] == "lagging"]
    leading_avg = sum(leading) / len(leading) if leading else 0
    lagging_avg = sum(lagging) / len(lagging) if lagging else 0
    hash_input = json.dumps({"country": country_code, "year": year,
        "scores": [(s["indicator_id"], s["stress_score"]) for s in component_scores],
        "geometric": geometric}, sort_keys=True)
    data_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
    return {
        "country_code": country_code, "year": year,
        "geometric_composite": geometric, "arithmetic_composite": arithmetic,
        "component_scores": component_scores, "red_flags": red_flags,
        "has_red_flags": len(red_flags) > 0,
        "coverage": asdict(coverage), "sensitivity": sensitivity or {},
        "methodology_version": "3.0", "aggregation_method": "weighted_geometric_mean",
        "n_indicators_used": len(component_scores), "n_indicators_total": len(INDICATORS),
        "data_hash": data_hash,
        "leading_indicators_stress": round(leading_avg, 2),
        "lagging_indicators_stress": round(lagging_avg, 2),
        "leading_lagging_gap": round(leading_avg - lagging_avg, 2),
    }

def generate_methodology_json():
    return {
        "version": "3.0", "title": "Augur Composite Stress Index — Methodology v3.0",
        "last_updated": "2026-03-26",
        "theoretical_framework": {
            "primary_theory": "Structural-Demographic Theory",
            "key_references": [
                "Turchin, P. (2003) Historical Dynamics. Princeton University Press.",
                "Turchin, P. (2016) Ages of Discord. Beresta Books.",
                "Turchin, P. & Nefedov, S. (2009) Secular Cycles. Princeton University Press.",
                "Goldstone, J. (1991) Revolution and Rebellion in the Early Modern World.",
                "Turchin, P. (2013) Modeling Social Pressures toward Instability. Cliodynamics 4(2).",
                "OECD/JRC (2008) Handbook on Constructing Composite Indicators.",
                "Saisana, M. et al. (2005) Uncertainty and Sensitivity Analysis Techniques.",
            ],
            "sdt_components": {
                "population": "General population dynamics, living standards, immiseration",
                "elite": "Elite overproduction, intra-elite competition, wealth concentration",
                "state": "Fiscal health, institutional legitimacy, rule of law",
            },
            "augmented_indicators": ["epistemic_fracture", "consumer_sentiment"],
            "augur_extensions": "Augur extends SDT with epistemic cohesion and consumer sentiment. These are tagged as AUGMENTED and can be excluded for a pure SDT score.",
            "what_augur_is_not": "Augur does not predict collapse or specific events. It measures structural conditions that historical research identifies as instability precursors.",
        },
        "aggregation": {
            "method": "Weighted geometric mean",
            "formula": "(product of s_i^w_i)^(1/sum of w_i)",
            "rationale": "Geometric aggregation penalizes imbalance. A country scoring 95 on trust stress and 5 on savings stress gets ~22 geometrically, not 50 arithmetically. UNDP adopted this for the HDI in 2010.",
        },
        "sensitivity_analysis": {
            "method": "Monte Carlo simulation", "n_simulations": 10000,
            "weight_perturbation": "Uniform[0.5, 1.5] around default weights",
            "robustness_criteria": {"ci_width_threshold": 20, "max_single_indicator_influence": 0.40},
        },
        "missing_data": {
            "policy": "Exclusion (no imputation)", "minimum_coverage": 0.67,
            "rationale": "Missing indicators excluded from composite. Coverage ratio reported. Scores below 67% excluded from rankings.",
        },
        "indicators": {
            ind_id: {
                "name": spec.name, "pillar": spec.pillar, "role": spec.role.value,
                "domain": spec.domain.value, "direction": spec.direction,
                "weight": spec.default_weight, "weight_justification": spec.weight_justification,
                "normalization": {"method": spec.norm_method, "reference_group": spec.norm_reference},
                "red_flag_threshold": spec.red_flag_threshold,
                "cross_country_notes": spec.equivalence_notes,
                "citations": spec.citations,
            } for ind_id, spec in INDICATORS.items()
        },
        "changelog": [
            {"version": "3.0", "date": "2026-03-26", "changes": [
                "Geometric aggregation (replaces arithmetic)",
                "Monte Carlo sensitivity analysis (10K sims)",
                "Red-flag threshold system",
                "Formal missing data policy (exclusion)",
                "Leading/coincident/lagging classification",
                "Cross-country series equivalence docs",
                "SDT domain mapping",
                "Confidence intervals on composite",
            ]},
            {"version": "2.0", "date": "2026-03-24", "changes": ["Blended percentile + range scoring", "Resilience indicators", "Uncertainty disclosure"]},
            {"version": "1.0", "date": "2026-03-22", "changes": ["Initial composite: arithmetic mean of 5 indicators"]},
        ],
    }
