export type Stage = "TOF" | "MOF" | "BOF" | "REACT";

export type Awareness =
  | "Unaware"
  | "Problem-aware"
  | "Solution-aware"
  | "Product-aware"
  | "Most-aware";

/** The six levers from the Hovers creative grid. Each is filled from the AI creative read. */
export interface CreativeTags {
  persona: string;      // who the ad is for
  angle: string;        // the one reason to buy it argues
  format: string;       // how it is made, from the 12-format library
  visualWorld: string;  // setting, people, light, pace
  hook: string;         // type of opening: question, bold claim, problem in action...
  awareness: Awareness; // the buyer's awareness stage the ad speaks to
  offer?: string;
  emotion?: string;
  talent?: string;      // founder, creator, customer, model, no person
}

export interface AdMetrics {
  spend: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  lpv: number;
  atc: number;
  purchases: number;
  revenue: number;
  plays3s?: number;
  thruplays?: number;
}

/** Share of the ad's spend by Meta audience segment (0 to 1). Optional. */
export interface AudienceSplit {
  newPct: number;
  engagedPct: number;
  existingPct: number;
}

export interface Ad {
  id: string;
  name: string;
  image?: string; // path under /public, e.g. /creatives/brand/123.jpg
  mediaType: "Static" | "Video" | "Carousel";
  campaign: string;
  adset: string;
  status: string;
  cta?: string;
  headline?: string;
  primaryText?: string;
  metrics: AdMetrics;
  audience?: AudienceSplit;
  tags: CreativeTags;
  /** 0 to 100, from the AI creative read. */
  clarity: { visual: number; product: number; message: number };
  /** Demo thumbnails only: drawn as a card when there is no image. */
  mock?: { bg: string; fg: string; headline: string; sub?: string };
}

export interface Brand {
  slug: string;
  name: string;
  category: string;
  currency: "INR" | "USD" | "AED";
  period: string;
  isDemo: boolean;
  note?: string;
  ads: Ad[];
}
