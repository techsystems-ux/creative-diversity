"use client";
import { useEffect } from "react";
import type { Brand } from "@/lib/types";
import { distance, differingLevers, verdict, STAGES, type AnalysedAd, type GroupStats } from "@/lib/scoring";
import { money, num, pct, x } from "@/lib/format";
import Thumb from "./Thumb";

export default function AdDrawer({
  ad, all, brand, overall, totalSpend, onClose, onSelect,
}: {
  ad: AnalysedAd; all: AnalysedAd[]; brand: Brand; overall: GroupStats; totalSpend: number;
  onClose: () => void; onSelect: (id: string) => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const cur = brand.currency;
  const m = ad.metrics;
  const v = verdict(ad, overall, totalSpend);
  const rank = [...all].sort((p, q) => q.metrics.spend - p.metrics.spend).findIndex((a) => a.id === ad.id) + 1;
  const near = all.filter((b) => b.id !== ad.id).map((b) => ({ b, d: distance(ad, b) })).sort((p, q) => p.d - q.d).slice(0, 4);
  const stage = STAGES.find((s) => s.key === ad.stage)!;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={ad.headline ?? ad.name} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2 className="h3">{ad.headline ?? ad.name}</h2>
            <p className="tiny muted mono">{ad.name}</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-media"><Thumb ad={ad} showText className="drawer-thumb" /></div>
          <div className="drawer-info">
            <p className="tiny muted">#{rank} of {all.length} by spend · {stage.label}{ad.audience ? ` · ${pct(ad.audience.newPct * 100, 0)} of spend on new people` : " · placed from the creative read"}</p>
            <div className="drawer-kpis">
              <div><span className="tiny muted">Spend</span><b>{money(m.spend, cur)}</b></div>
              <div><span className="tiny muted">ROAS</span><b>{x(v.st.roas)}</b></div>
              <div><span className="tiny muted">Purchases</span><b>{num(m.purchases)}</b></div>
              <div><span className="tiny muted">CTR (link)</span><b>{pct(v.st.ctr, 2)}</b></div>
            </div>
            <p className={`verdict verdict-${v.tone}`}>{v.label}{v.tone === "neutral" && v.st.share < 0.05 ? ` (${pct(v.st.share * 100, 1)} of spend; needs 5%+)` : ""}</p>

            <h3 className="drawer-h">Creative scores</h3>
            <Score l="Visual clarity" v={ad.clarity.visual} />
            <Score l="Product clarity" v={ad.clarity.product} />
            <Score l="Message clarity" v={ad.clarity.message} />
            <Score l="Diversity" v={ad.diversity} accent />

            <h3 className="drawer-h">Tags from the creative read</h3>
            <div className="tags">
              <Tag k="Persona" v={ad.tags.persona} /><Tag k="Angle" v={ad.tags.angle} /><Tag k="Format" v={ad.tags.format} />
              <Tag k="Visual world" v={ad.tags.visualWorld} /><Tag k="Hook" v={ad.tags.hook} /><Tag k="Awareness" v={ad.tags.awareness} />
              {ad.tags.talent && <Tag k="Talent" v={ad.tags.talent} />}{ad.tags.offer && <Tag k="Offer" v={ad.tags.offer} />}
              {ad.tags.emotion && <Tag k="Emotion" v={ad.tags.emotion} />}
              <Tag k="Entity" v={`E${ad.entityId}`} />
            </div>

            <h3 className="drawer-h">Metrics</h3>
            <div className="mgrid">
              <Row k="Revenue" v={money(m.revenue, cur)} /><Row k="Impressions" v={num(m.impressions)} />
              <Row k="Reach" v={num(m.reach)} /><Row k="Frequency" v={ad.freq.toFixed(2)} />
              <Row k="Link clicks" v={num(m.linkClicks)} /><Row k="CPC" v={money(v.st.cpc, cur, 2)} />
              <Row k="Landing page views" v={num(m.lpv)} /><Row k="Cost / LPV" v={money(v.st.costLpv, cur, 2)} />
              <Row k="Adds to cart" v={num(m.atc)} /><Row k="Cost / ATC" v={money(v.st.costAtc, cur)} />
              <Row k="CPA" v={money(v.st.cpa, cur)} /><Row k="ATC → purchase" v={pct((m.purchases / (m.atc || 1)) * 100, 1)} />
              {m.plays3s != null && <Row k="Hook rate" v={pct((m.plays3s / m.impressions) * 100, 1)} />}
              {m.thruplays != null && m.plays3s ? <Row k="Hold rate" v={pct((m.thruplays / m.plays3s) * 100, 1)} /> : null}
            </div>

            <h3 className="drawer-h">Closest ads in the account</h3>
            <div className="near">
              {near.map(({ b, d }) => (
                <button key={b.id} type="button" className="near-row" onClick={() => onSelect(b.id)}>
                  <Thumb ad={b} className="near-thumb" />
                  <span className="small"><b>{b.headline}</b><br />
                    <span className="tiny muted">{d < 0.35 ? "Same entity" : `${Math.round(d * 100)}% different`} · {differingLevers(ad, b).join(", ") || "identical tags"}</span>
                  </span>
                </button>
              ))}
            </div>

            <h3 className="drawer-h">Facts</h3>
            <div className="mgrid">
              <Row k="Campaign" v={ad.campaign} /><Row k="Ad set" v={ad.adset} /><Row k="Status" v={ad.status} />
              <Row k="Media" v={ad.mediaType} /><Row k="Call to action" v={ad.cta ?? "—"} /><Row k="Ad ID" v={ad.id} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Score({ l, v, accent }: { l: string; v: number; accent?: boolean }) {
  return (
    <div className="sc">
      <span className="small">{l}</span>
      <span className={`sc-track ${accent ? "sc-accent" : ""}`}><span style={{ width: `${v}%` }} /></span>
      <span className="small mono">{v}/100</span>
    </div>
  );
}
function Tag({ k, v }: { k: string; v: string }) {
  return <span className="tag"><span className="muted">{k}</span> {v}</span>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="mrow"><span className="muted small">{k}</span><span className="small">{v}</span></div>;
}
