# Creative Diversity · Hovers

Internal tool for creative audits. It reads a brand's Meta creatives, tags each one on six levers (persona, angle, format, visual world, hook, awareness stage), places it in the funnel, groups look-alike ads into the "entities" Meta likely treats as one, and scores how diverse the account really is.

## What you see
- **Diversity score (0–100)**: 40% entity spread + 30% spend-weighted grid coverage + 30% spend balance. Low < 40, Medium 40–69, High 70+.
- **Funnel map**: every ad placed in Top / Middle / Bottom / Reactivation, sized by spend, split by any lever.
- **Entities**: groups of near-identical ads and their share of spend.
- **Persona × angle grid** and the 12-format library, with gaps.
- **Ad panel**: clarity scores, diversity, tags, metrics, closest look-alikes, winner verdict (needs 5%+ of spend).
- **OJAN read-out** for the audit.

All rules live in `lib/scoring.ts` and are explained on `/method`.

## Adding a brand
1. Export ad-level Meta data (spend, impressions, reach, link clicks, LPV, ATC, purchases, purchase value, 3s plays, ThruPlays; audience-segment split if available).
2. Put creatives in `public/creatives/<slug>/`.
3. Tag each creative and save `data/brands/<slug>.json` (shape: `lib/types.ts` → `Brand`).
4. Register it in `lib/brands.ts`.

## Develop
```
npm install
npm run dev
npm run demo:data   # regenerate the demo shampoo account
```
