import type { Ad } from "@/lib/types";

export default function Thumb({ ad, showText = false, className = "" }: { ad: Ad; showText?: boolean; className?: string }) {
  if (ad.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ad.image} alt={ad.headline ?? ad.name} className={`thumb ${className}`} loading="lazy" />;
  }
  const m = ad.mock ?? { bg: "#ddd", fg: "#222", headline: ad.headline ?? ad.name };
  return (
    <div className={`thumb thumb-mock ${className}`} style={{ background: m.bg, color: m.fg }} aria-label={m.headline} role="img">
      {showText && (
        <>
          <span className="thumb-head">{m.headline}</span>
          {m.sub && <span className="thumb-sub">{m.sub}</span>}
        </>
      )}
      {ad.mediaType === "Video" && <span className="thumb-play" aria-hidden="true">▶</span>}
    </div>
  );
}
