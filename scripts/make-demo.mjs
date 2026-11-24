// Generates data/brands/demo-shampoo.json: a made-up shampoo account used to show the logic.
// It is deliberately under-diversified: one template (helmet commuter, itch relief, studio static)
// is copied 12 times with new backgrounds and takes a large share of spend.
import { writeFileSync } from "node:fs";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a, b) => a + rnd() * (b - a);
const round = (v) => Math.round(v);

const PALETTE = {
  "Helmet commuter": { bg: "#1E2A3A", fg: "#F5F1E8" },
  "Hair-fall worrier": { bg: "#F3E6D8", fg: "#3A2418" },
  "Dandruff sufferer": { bg: "#111418", fg: "#E9F0F7" },
  "Daily gym-goer": { bg: "#D9F0E4", fg: "#12382A" },
  "Existing customers": { bg: "#ECE9E1", fg: "#1A1A1A" },
};

const VIDEO_FORMATS = new Set([
  "Talking-head UGC", "Founder story", "Product demo", "Problem–solution skit",
  "Unboxing", "Street interview", "Lo-fi native",
]);

const defs = [];
const add = (d) => defs.push(d);

// --- The over-used template: 12 near-copies --------------------------------
const backdrops = ["mint", "blue", "lilac", "peach", "grey", "teal", "sand", "black", "white", "yellow", "rose", "olive"];
backdrops.forEach((c, i) =>
  add({
    persona: "Helmet commuter", angle: "Itch relief", format: "Studio static",
    visualWorld: `Studio, ${c} backdrop`, hook: "Bold claim", awareness: "Problem-aware",
    headline: "No more helmet itch", sub: `Itch-free scalp · v${i + 1}`,
    spend: [62000, 54000, 41000, 30000, 22000, 16000, 12000, 9000, 7000, 5000, 3500, 2500][i],
    talent: "No person", emotion: "Relief",
  }),
);

// --- The genuinely different ads (the shampoo grid) -------------------------
const grid = [
  ["Helmet commuter", "Itch relief", "Talking-head UGC", "Office parking, after the ride", "Problem in action", "Problem-aware", "Three hours in a helmet. No itch.", 38000, "Customer"],
  ["Helmet commuter", "Helmet-hair smell", "Problem–solution skit", "Crowded lift", "Problem in action", "Problem-aware", "Everyone stepped back in the lift", 21000, "Creator"],
  ["Helmet commuter", "Cooling feel", "Product demo", "Lather close-up, midday traffic", "Result first", "Solution-aware", "A cool scalp under a hot helmet", 14000, "Creator"],
  ["Hair-fall worrier", "Fewer strands", "Before and after", "Comb on a bathroom shelf", "Result first", "Problem-aware", "Count the strands. Then again in 4 weeks.", 26000, "Customer"],
  ["Hair-fall worrier", "What's inside", "Listicle carousel", "Plain ingredient cards", "Question", "Solution-aware", "3 ingredients that matter for hair fall", 9000, "No person"],
  ["Hair-fall worrier", "How it's made", "Founder story", "Lab bench", "Bold claim", "Product-aware", "Why we left out the harsh stuff", 6000, "Founder"],
  ["Dandruff sufferer", "Black shirt test", "Studio static", "Black shirt on a hanger", "Result first", "Problem-aware", "A black shirt. Not one flake.", 17000, "No person"],
  ["Dandruff sufferer", "The awkward moment", "Street interview", "College campus", "Question", "Unaware", "Your most embarrassing hair moment?", 8000, "Public"],
  ["Dandruff sufferer", "Vs the usual bottle", "Comparison static", "Two bottles side by side", "Bold claim", "Product-aware", "Your bottle vs ours", 11000, "No person"],
  ["Daily gym-goer", "Gentle enough daily", "Review screenshots", "Review cards", "Social proof", "Product-aware", "What daily washers say", 7000, "Customer"],
  ["Daily gym-goer", "Gym to office", "Lo-fi native", "Gym mirror", "Relatable POV", "Unaware", "POV: gym shower, good hair", 12000, "Creator"],
  ["Daily gym-goer", "Gym-bag essential", "Unboxing", "Gym bag on a bench", "Result first", "Solution-aware", "The bottle that lives in my gym bag", 4000, "Creator"],
];
grid.forEach(([persona, angle, format, visualWorld, hook, awareness, headline, spend, talent]) =>
  add({ persona, angle, format, visualWorld, hook, awareness, headline, spend, talent }),
);

// --- An iteration set: three new opening lines on the winning UGC -----------
["Question", "Bold claim", "Social proof"].forEach((hook, i) =>
  add({
    persona: "Helmet commuter", angle: "Itch relief", format: "Talking-head UGC",
    visualWorld: "Office parking, after the ride", hook, awareness: "Problem-aware",
    headline: ["Itchy after your ride?", "Zero itch by 6pm", "10,000 riders switched"][i],
    sub: "Hook test", spend: [9000, 6000, 3000][i], talent: "Customer",
  }),
);

// --- Retargeting and existing customers ------------------------------------
add({ persona: "Existing customers", angle: "Offer", format: "Studio static", visualWorld: "Studio, white backdrop", hook: "Offer first", awareness: "Most-aware", headline: "Buy 2, get 1 free", spend: 19000, talent: "No person", offer: "B2G1", react: true });
add({ persona: "Existing customers", angle: "Refill reminder", format: "Lo-fi native", visualWorld: "Bathroom shelf", hook: "Relatable POV", awareness: "Most-aware", headline: "Running low? Refill now", spend: 8000, talent: "No person", react: true });
add({ persona: "Existing customers", angle: "Offer", format: "Studio static", visualWorld: "Studio, yellow backdrop", hook: "Offer first", awareness: "Most-aware", headline: "Last day: 20% off", spend: 15000, talent: "No person", offer: "20% off", saturated: true });

const ads = defs.map((d, i) => {
  const isVideo = VIDEO_FORMATS.has(d.format);
  const cpm = between(110, 210);
  const impressions = round((d.spend / cpm) * 1000);
  const freq = d.saturated ? between(3.0, 3.8) : d.react ? between(2.2, 3.0) : between(1.3, 2.4);
  const reach = round(impressions / freq);
  const quality = d.format === "Studio static" && d.persona === "Helmet commuter" ? 0.85 : between(0.9, 1.35);
  const ctr = between(0.7, 1.6) * quality / 100;
  const linkClicks = round(impressions * ctr);
  const lpv = round(linkClicks * between(0.65, 0.85));
  const atc = round(lpv * between(0.07, 0.14) * quality);
  const purchases = round(atc * between(0.28, 0.45));
  const revenue = round(purchases * between(720, 960));
  const plays3s = isVideo ? round(impressions * between(0.18, 0.38)) : undefined;
  const thruplays = isVideo ? round(plays3s * between(0.15, 0.35)) : undefined;

  let audience;
  if (d.react) audience = { newPct: 0.25, engagedPct: 0.27, existingPct: 0.48 };
  else if (i % 7 === 3) audience = undefined; // a few ads without the split, to show the fallback
  else {
    const n = d.awareness === "Most-aware" || d.awareness === "Product-aware" ? between(0.25, 0.5) : between(0.55, 0.85);
    const ex = between(0.05, 0.15);
    audience = { newPct: +n.toFixed(2), engagedPct: +(1 - n - ex).toFixed(2), existingPct: +ex.toFixed(2) };
  }

  const pal = PALETTE[d.persona];
  const bgOverride = d.visualWorld.startsWith("Studio,")
    ? { mint: "#BFE6D4", blue: "#BFD3F2", lilac: "#D9CDEF", peach: "#F6D3C0", grey: "#D5D7DB", teal: "#B6DEDC", sand: "#EADFC8", black: "#1B1C1F", white: "#F4F3EF", yellow: "#F4E3A1", rose: "#F2CBD3", olive: "#D2D7B5" }[d.visualWorld.split(", ")[1].split(" ")[0]]
    : null;
  const darkBg = bgOverride === "#1B1C1F";

  return {
    id: `9000000${String(1000 + i)}`,
    name: `${d.persona.split(" ")[0].toUpperCase()}_${d.angle.replace(/[^A-Za-z]/g, "")}_${d.format.replace(/[^A-Za-z]/g, "")}_v${i + 1}`,
    mediaType: isVideo ? "Video" : d.format === "Listicle carousel" ? "Carousel" : "Static",
    campaign: d.react ? "DEMO | Retargeting // Existing" : d.saturated ? "DEMO | Retargeting // Engaged" : "DEMO | Prospecting // Advantage+",
    adset: d.react || d.saturated ? "RT // All engagers 30d" : `Broad // ${d.persona}`,
    status: "Active",
    cta: "Shop now",
    headline: d.headline,
    metrics: { spend: d.spend, impressions, reach, linkClicks, lpv, atc, purchases, revenue, ...(isVideo ? { plays3s, thruplays } : {}) },
    ...(audience ? { audience } : {}),
    tags: {
      persona: d.persona, angle: d.angle, format: d.format, visualWorld: d.visualWorld,
      hook: d.hook, awareness: d.awareness, talent: d.talent ?? "No person",
      ...(d.offer ? { offer: d.offer } : {}), ...(d.emotion ? { emotion: d.emotion } : {}),
    },
    clarity: {
      visual: round(between(48, 92)),
      product: round(d.format === "Studio static" ? between(80, 96) : between(45, 90)),
      message: round(between(45, 92)),
    },
    mock: {
      bg: bgOverride ?? pal.bg,
      fg: bgOverride ? (darkBg ? "#F4F3EF" : "#1A1A1A") : pal.fg,
      headline: d.headline,
      sub: d.sub ?? d.format,
    },
  };
});

const brand = {
  slug: "demo-shampoo",
  name: "Demo · Everyday shampoo",
  category: "Hair care",
  currency: "INR",
  period: "Last 14 days",
  isDemo: true,
  note: "Made-up account used to show the logic. One studio template is copied 12 times with new backdrops.",
  ads,
};

writeFileSync(new URL("../data/brands/demo-shampoo.json", import.meta.url), JSON.stringify(brand, null, 2));
console.log(`Wrote ${ads.length} ads, spend ₹${ads.reduce((a, b) => a + b.metrics.spend, 0).toLocaleString("en-IN")}`);
