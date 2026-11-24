"use client";
import type { AnalysedAd } from "@/lib/scoring";
import { STAGES } from "@/lib/scoring";
import Thumb from "./Thumb";

const W = 600;
const H = 430;
const BANDS: Record<string, [number, number]> = { TOF: [0, 150], MOF: [150, 260], BOF: [260, 350], REACT: [350, 430] };
const half = (y: number) => 300 - (y / H) * 240; // 300 at the top, 60 at the bottom

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export default function Funnel({
  ads, title, maxSpend, onSelect, compact = false, color,
}: {
  ads: AnalysedAd[]; title?: string; maxSpend: number; onSelect: (id: string) => void; compact?: boolean; color?: string;
}) {
  const counts = Object.fromEntries(STAGES.map((s) => [s.key, ads.filter((a) => a.stage === s.key).length]));
  const placed = STAGES.flatMap((s) => {
    const [y0, y1] = BANDS[s.key];
    const inBand = ads.filter((a) => a.stage === s.key).sort((a, b) => a.metrics.spend - b.metrics.spend);
    return inBand.map((ad) => {
      const size = (compact ? 22 : 18) + 34 * Math.sqrt(ad.metrics.spend / (maxSpend || 1));
      const y = y0 + 12 + hash(ad.id + "y") * Math.max(4, y1 - y0 - size * 1.25 - 16);
      const hw = half(y + size) - size / 2 - 8;
      const x = 300 + (hash(ad.id + "x") * 2 - 1) * Math.max(0, hw) - size / 2;
      return { ad, x, y, size };
    });
  });

  return (
    <figure className={`funnel ${compact ? "funnel-compact" : ""}`}>
      {title && (
        <figcaption className="funnel-title">
          <span className="dot" style={{ background: color }} />
          <b>{title}</b> <span className="muted">{ads.length}</span>
          <span className="funnel-counts muted">Top {counts.TOF} · Mid {counts.MOF} · Bottom {counts.BOF} · React {counts.REACT}</span>
        </figcaption>
      )}
      <div className="funnel-stage" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="funnel-svg" aria-hidden="true">
          {STAGES.map((s, i) => {
            const [y0, y1] = BANDS[s.key];
            const pts = `${300 - half(y0)},${y0} ${300 + half(y0)},${y0} ${300 + half(y1)},${y1} ${300 - half(y1)},${y1}`;
            return <polygon key={s.key} points={pts} className={`band band-${i}`} />;
          })}
        </svg>
        {placed.map(({ ad, x, y, size }) => (
          <button
            key={ad.id}
            type="button"
            className="funnel-thumb"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(size / W) * 100}%` }}
            onClick={() => onSelect(ad.id)}
            title={`${ad.headline ?? ad.name} · diversity ${ad.diversity}/100`}
            aria-label={`Open ${ad.headline ?? ad.name}`}
          >
            <Thumb ad={ad} />
          </button>
        ))}
      </div>
    </figure>
  );
}
