import type { Brand } from "./types";
import { analyse, stats, STAGES, RULES } from "./scoring";
import { money, pct } from "./format";

type Analysis = ReturnType<typeof analyse>;

/** The audit read-out, in OJAN: Observation, Justification, Analysis, Next steps. */
export function ojan(brand: Brand, a: Analysis) {
  const cur = brand.currency;
  const { account, ads, totalSpend, gaps, overall } = a;
  const top = account.entities[0];
  const topAds = ads.filter((ad) => ad.entityId === top?.id);

  const observation =
    `${ads.length} ads ran in the ${brand.period.toLowerCase()}, but Meta most likely sees about ` +
    `${account.effectiveEntities.toFixed(1)} genuinely different ads once spend is taken into account. ` +
    (top
      ? `The largest group (${top.label}) holds ${top.adIds.length} near-identical ads and takes ${pct(top.share * 100, 0)} of spend.`
      : "");

  const justification =
    "Meta groups ads that look, read or sound alike and treats each group as one ad in the auction. " +
    "Ads inside one group compete with each other for the same people instead of opening new audiences, so adding copies raises production cost without adding reach.";

  const personaStats = gaps.personas
    .map((p) => ({ p, s: stats(ads.filter((ad) => ad.tags.persona === p), totalSpend) }))
    .filter((r) => r.s.share >= 0.05 && isFinite(r.s.costAtc))
    .sort((m, n) => m.s.costAtc - n.s.costAtc);
  const ec = account.effectiveCounts;
  let perf = "";
  if (personaStats.length >= 2) {
    const best = personaStats[0];
    const worst = personaStats[personaStats.length - 1];
    perf =
      `Among personas with at least 5% of spend, ${best.p} has the lowest cost per add to cart (${money(best.s.costAtc, cur)}, ${pct(best.s.share * 100, 0)} of spend) ` +
      `and ${worst.p} the highest (${money(worst.s.costAtc, cur)}, ${pct(worst.s.share * 100, 0)} of spend); the account average is ${money(overall.costAtc, cur)}. `;
  } else if (personaStats.length === 1) {
    const only = personaStats[0];
    perf = `Only ${only.p} has enough spend (${pct(only.s.share * 100, 0)}) to judge; its cost per add to cart is ${money(only.s.costAtc, cur)} against an account average of ${money(overall.costAtc, cur)}. `;
  }
  const analysis =
    `Weighted by spend, the account effectively covers ${ec.personas.toFixed(1)} of 4 personas, ${ec.angles.toFixed(1)} of 12 angles and ${ec.formats.toFixed(1)} of 12 formats, ` +
    `even though ${account.unique.angles} angles and ${account.unique.formats} formats appear somewhere. ` +
    perf +
    (gaps.thinPersonas.length
      ? `${gaps.thinPersonas.map((t) => t.persona).join(", ")} ${gaps.thinPersonas.length > 1 ? "are" : "is"} covered by fewer than three angles or formats.`
      : "Every persona has at least three angles and three formats.");

  const next: string[] = [];
  if (top && top.share > 0.3 && topAds.length >= 3)
    next.push(`Stop adding versions of “${top.label}”. Keep its 2–3 best ads by cost per add to cart and move the rest of its budget to new concepts.`);
  gaps.thinPersonas.slice(0, 2).forEach((t) => {
    const n = Math.max(1, 3 - t.angles);
    next.push(`Brief ${n} new angle${n > 1 ? "s" : ""} for ${t.persona}, ${n > 1 ? "each " : ""}in a format it doesn’t use yet.`);
  });
  if (gaps.unusedFormats.length)
    next.push(`Formats not used at all: ${gaps.unusedFormats.slice(0, 4).join(", ")}${gaps.unusedFormats.length > 4 ? " and more" : ""}. Assign each to a winning angle.`);
  gaps.missingStages.forEach((s) => next.push(`No ads sit in ${s.label.toLowerCase()} (${s.sub.toLowerCase()}). Add at least one concept written for that stage.`));
  if (!next.length) next.push("Keep the mix: refresh the weakest persona with a new scraped angle every two weeks.");

  return { observation, justification, analysis, next };
}

export function scoreSentence(score: number, band: string) {
  return band === "High"
    ? `Diversity is high (${score}/100): spend is spread over genuinely different ads.`
    : band === "Medium"
      ? `Diversity is medium (${score}/100): some real variety, but a few groups of look-alike ads take too much spend.`
      : `Diversity is low (${score}/100): most spend goes to versions of the same few ads.`;
}

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.key, s.label])) as Record<string, string>;
export { RULES };
