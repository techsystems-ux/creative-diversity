import type { Ad, Brand, CreativeTags, Stage } from "./types";

/* ------------------------------------------------------------------ */
/*  1. Funnel position                                                 */
/* ------------------------------------------------------------------ */

export const STAGES: { key: Stage; label: string; sub: string }[] = [
  { key: "TOF", label: "Top of funnel", sub: "New people (prospecting)" },
  { key: "MOF", label: "Middle of funnel", sub: "Engaged, still warming" },
  { key: "BOF", label: "Bottom of funnel", sub: "Engaged and saturated (high frequency)" },
  { key: "REACT", label: "Reactivation", sub: "Existing customers" },
];

export const RULES = {
  reactExisting: 0.4, // 40%+ of spend on existing customers → Reactivation
  tofNew: 0.6,        // 60%+ of spend on new people → Top of funnel
  bofFrequency: 2.5,  // engaged audience at frequency 2.5+ → Bottom (saturated)
  sameEntity: 0.35,   // distance below this → Meta likely treats the two ads as one
  minSpendShareForCoverage: 0.01, // ads under 1% of spend don't count towards coverage
  winnerSpendShare: 0.05,         // need 5%+ of spend before calling a winner
  targets: { personas: 4, angles: 12, formats: 12 },
};

export function frequency(ad: Ad) {
  return ad.metrics.reach > 0 ? ad.metrics.impressions / ad.metrics.reach : 0;
}

/**
 * Where an ad sits in the funnel.
 * With Meta's audience-segment split: decided by who the money reached.
 * Without it: decided by the awareness stage the AI read gives the creative.
 */
export function stageOf(ad: Ad): { stage: Stage; source: "audience" | "creative" } {
  const a = ad.audience;
  if (a) {
    if (a.existingPct >= RULES.reactExisting) return { stage: "REACT", source: "audience" };
    if (a.newPct >= RULES.tofNew) return { stage: "TOF", source: "audience" };
    return { stage: frequency(ad) >= RULES.bofFrequency ? "BOF" : "MOF", source: "audience" };
  }
  const map: Record<string, Stage> = {
    Unaware: "TOF",
    "Problem-aware": "TOF",
    "Solution-aware": "MOF",
    "Product-aware": "BOF",
    "Most-aware": "BOF",
  };
  return { stage: map[ad.tags.awareness] ?? "MOF", source: "creative" };
}

/* ------------------------------------------------------------------ */
/*  2. Levers and distance between two creatives                       */
/* ------------------------------------------------------------------ */

export type LeverKey = keyof Pick<CreativeTags, "persona" | "angle" | "format" | "visualWorld" | "hook" | "awareness">;

export const LEVERS: { key: LeverKey; label: string; weight: number; help: string }[] = [
  { key: "persona", label: "Persona", weight: 0.25, help: "Who the ad is for" },
  { key: "angle", label: "Angle", weight: 0.25, help: "The reason to buy it argues" },
  { key: "format", label: "Format", weight: 0.2, help: "How it is made" },
  { key: "visualWorld", label: "Visual world", weight: 0.15, help: "Setting, people, light, pace" },
  { key: "hook", label: "Hook type", weight: 0.1, help: "How the first seconds open" },
  { key: "awareness", label: "Awareness stage", weight: 0.05, help: "How much the viewer already knows" },
];

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();

/** 0 = identical on every lever, 1 = different on every lever. */
export function distance(a: Ad, b: Ad) {
  let d = 0;
  for (const l of LEVERS) if (norm(a.tags[l.key]) !== norm(b.tags[l.key])) d += l.weight;
  return Math.round(d * 100) / 100;
}

/** Which levers differ between two ads. */
export function differingLevers(a: Ad, b: Ad) {
  return LEVERS.filter((l) => norm(a.tags[l.key]) !== norm(b.tags[l.key])).map((l) => l.label);
}

/* ------------------------------------------------------------------ */
/*  3. Entities: groups of ads Meta likely sees as one                 */
/* ------------------------------------------------------------------ */

export interface Entity {
  id: number;
  adIds: string[];
  spend: number;
  share: number;
  label: string; // persona · angle · format
}

export function buildEntities(ads: Ad[]): Entity[] {
  const parent = ads.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < ads.length; i++)
    for (let j = i + 1; j < ads.length; j++)
      if (distance(ads[i], ads[j]) < RULES.sameEntity) parent[find(i)] = find(j);

  const groups = new Map<number, Ad[]>();
  ads.forEach((ad, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), ad]);
  });
  const total = sum(ads.map((a) => a.metrics.spend)) || 1;
  return [...groups.values()]
    .map((g) => {
      const spend = sum(g.map((a) => a.metrics.spend));
      const top = [...g].sort((x, y) => y.metrics.spend - x.metrics.spend)[0];
      return {
        id: 0,
        adIds: g.map((a) => a.id),
        spend,
        share: spend / total,
        label: `${top.tags.persona} · ${top.tags.angle} · ${top.tags.format}`,
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .map((e, i) => ({ ...e, id: i + 1 }));
}

/* ------------------------------------------------------------------ */
/*  4. Diversity scores                                                */
/* ------------------------------------------------------------------ */

/**
 * Ad diversity (0–100): how different this ad is from the rest of the account.
 * Half comes from its closest look-alike, half from the spend-weighted average distance
 * to every other ad. A copy of an existing ad scores low even if the copy is small.
 */
export function adDiversity(ad: Ad, ads: Ad[]) {
  let num = 0;
  let den = 0;
  let nearest = 1;
  for (const b of ads) {
    if (b.id === ad.id) continue;
    const d = distance(ad, b);
    const w = Math.max(b.metrics.spend, 1);
    num += w * d;
    den += w;
    nearest = Math.min(nearest, d);
  }
  if (!den) return 0;
  // Half: distance to its closest look-alike. Half: distance to where the money goes.
  return Math.round((0.5 * nearest + 0.5 * (num / den)) * 100);
}

export interface AccountScore {
  score: number;
  band: "Low" | "Medium" | "High";
  entitySpread: number; // 0–1
  coverage: number;     // 0–1
  balance: number;      // 0–1
  effectiveEntities: number;
  entities: Entity[];
  topEntityShare: number;
  unique: { personas: number; angles: number; formats: number };
  effectiveCounts: { personas: number; angles: number; formats: number };
}

/**
 * Account diversity (0–100) = 40% entity spread + 30% grid coverage + 30% spend balance.
 *  - Entity spread: how many truly different ads the money is spread over
 *    (spend-weighted effective number of entities ÷ the smaller of ad count and 12).
 *  - Grid coverage: spend-weighted personas vs 4, angles vs 12, formats vs 12 (the Hovers grid).
 *  - Spend balance: full marks while the largest entity takes 25% or less, zero at 75%.
 */
export function accountScore(ads: Ad[]): AccountScore {
  const entities = buildEntities(ads);
  const shares = entities.map((e) => e.share).filter((s) => s > 0);
  const H = -sum(shares.map((p) => p * Math.log(p)));
  const effectiveEntities = Math.exp(H);
  const ideal = Math.min(ads.length, 12) || 1;
  const entitySpread = Math.min(1, effectiveEntities / ideal);

  const total = sum(ads.map((a) => a.metrics.spend)) || 1;
  const counted = ads.filter((a) => a.metrics.spend / total >= RULES.minSpendShareForCoverage);
  const uniq = (k: LeverKey) => new Set(counted.map((a) => norm(a.tags[k]))).size;
  const unique = { personas: uniq("persona"), angles: uniq("angle"), formats: uniq("format") };
  // Spend-weighted: a persona that gets 1% of spend barely counts.
  const effective = (k: LeverKey) => {
    const m = new Map<string, number>();
    ads.forEach((a) => m.set(norm(a.tags[k]), (m.get(norm(a.tags[k])) ?? 0) + a.metrics.spend / total));
    return Math.exp(-sum([...m.values()].filter((p) => p > 0).map((p) => p * Math.log(p))));
  };
  const effectiveCounts = { personas: effective("persona"), angles: effective("angle"), formats: effective("format") };
  const t = RULES.targets;
  const coverage =
    (Math.min(1, effectiveCounts.personas / t.personas) +
      Math.min(1, effectiveCounts.angles / t.angles) +
      Math.min(1, effectiveCounts.formats / t.formats)) / 3;

  const topEntityShare = entities[0]?.share ?? 0;
  const balance = Math.min(1, Math.max(0, 1 - (topEntityShare - 0.25) / 0.5));

  const score = Math.round(100 * (0.4 * entitySpread + 0.3 * coverage + 0.3 * balance));
  const band = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return { score, band, entitySpread, coverage, balance, effectiveEntities, entities, topEntityShare, unique, effectiveCounts };
}

/* ------------------------------------------------------------------ */
/*  5. Metrics for any group of ads                                    */
/* ------------------------------------------------------------------ */

export interface GroupStats {
  n: number;
  spend: number;
  share: number;
  ctr: number;      // %
  cpc: number;
  costLpv: number;
  costAtc: number;
  cpa: number;
  roas: number;
  hookRate: number; // %
  revenue: number;
  purchases: number;
}

export function stats(ads: Ad[], totalSpend: number): GroupStats {
  const s = (k: keyof Ad["metrics"]) => sum(ads.map((a) => a.metrics[k] ?? 0));
  const spend = s("spend");
  const vids = ads.filter((a) => a.metrics.plays3s != null);
  const vImp = sum(vids.map((a) => a.metrics.impressions));
  return {
    n: ads.length,
    spend,
    share: totalSpend ? spend / totalSpend : 0,
    ctr: div(s("linkClicks"), s("impressions")) * 100,
    cpc: div(spend, s("linkClicks")),
    costLpv: div(spend, s("lpv")),
    costAtc: div(spend, s("atc")),
    cpa: div(spend, s("purchases")),
    roas: div(s("revenue"), spend),
    hookRate: vImp ? div(sum(vids.map((a) => a.metrics.plays3s ?? 0)), vImp) * 100 : NaN,
    revenue: s("revenue"),
    purchases: s("purchases"),
  };
}

/** A creative only counts as a winner with real spend behind it. */
export function verdict(ad: Ad, account: GroupStats, totalSpend: number) {
  const st = stats([ad], totalSpend);
  if (st.share < RULES.winnerSpendShare)
    return { label: "Too little spend to judge", tone: "neutral" as const, st };
  const better =
    (st.costAtc && account.costAtc ? (account.costAtc - st.costAtc) / account.costAtc : 0) +
    (st.roas && account.roas ? (st.roas - account.roas) / account.roas : 0);
  if (better >= 0.3) return { label: "Winner", tone: "good" as const, st };
  if (better <= -0.3) return { label: "Underperformer", tone: "bad" as const, st };
  return { label: "In line with account", tone: "neutral" as const, st };
}

/* ------------------------------------------------------------------ */
/*  6. Analysis: everything the dashboard needs                        */
/* ------------------------------------------------------------------ */

export interface AnalysedAd extends Ad {
  stage: Stage;
  stageSource: "audience" | "creative";
  diversity: number;
  entityId: number;
  freq: number;
}

export function analyse(brand: Brand) {
  const ads = brand.ads;
  const account = accountScore(ads);
  const entityOf = new Map<string, number>();
  account.entities.forEach((e) => e.adIds.forEach((id) => entityOf.set(id, e.id)));
  const analysed: AnalysedAd[] = ads.map((ad) => {
    const st = stageOf(ad);
    return {
      ...ad,
      stage: st.stage,
      stageSource: st.source,
      diversity: adDiversity(ad, ads),
      entityId: entityOf.get(ad.id) ?? 0,
      freq: frequency(ad),
    };
  });
  const totalSpend = sum(ads.map((a) => a.metrics.spend));
  const overall = stats(ads, totalSpend);
  return { ads: analysed, account, totalSpend, overall, gaps: gaps(analysed, account) };
}

/* ------------------------------------------------------------------ */
/*  7. Gaps and what to brief next                                     */
/* ------------------------------------------------------------------ */

export const FORMAT_LIBRARY = [
  "Talking-head UGC", "Founder story", "Product demo", "Before and after",
  "Comparison static", "Review screenshots", "Unboxing", "Problem–solution skit",
  "Listicle carousel", "Studio static", "Street interview", "Lo-fi native",
];

export function gaps(ads: AnalysedAd[], account: AccountScore) {
  const total = sum(ads.map((a) => a.metrics.spend)) || 1;
  const personas = unique(ads.map((a) => a.tags.persona));
  const angles = unique(ads.map((a) => a.tags.angle));
  const formatsUsed = new Set(ads.map((a) => norm(a.tags.format)));
  const unusedFormats = FORMAT_LIBRARY.filter((f) => !formatsUsed.has(norm(f)));

  const perPersona = personas.map((p) => {
    const g = ads.filter((a) => a.tags.persona === p);
    return {
      persona: p,
      ads: g.length,
      share: sum(g.map((a) => a.metrics.spend)) / total,
      angles: unique(g.map((a) => a.tags.angle)).length,
      formats: unique(g.map((a) => a.tags.format)).length,
      stages: unique(g.map((a) => a.stage)) as Stage[],
    };
  });

  const crowded = account.entities.filter((e) => e.adIds.length >= 3);
  const thinPersonas = perPersona.filter((p) => p.angles < 3 || p.formats < 3);
  const missingStages = STAGES.filter((s) => !ads.some((a) => a.stage === s.key));

  return { personas, angles, perPersona, unusedFormats, crowded, thinPersonas, missingStages };
}

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

export function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
export function div(a: number, b: number) {
  return b > 0 ? a / b : NaN;
}
export function unique<T>(xs: T[]) {
  return [...new Set(xs)];
}
