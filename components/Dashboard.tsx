"use client";
import { useMemo, useState } from "react";
import type { Brand } from "@/lib/types";
import { analyse, stats, STAGES, LEVERS, FORMAT_LIBRARY, type AnalysedAd, type LeverKey } from "@/lib/scoring";
import { ojan, scoreSentence } from "@/lib/insights";
import { money, num, pct, x } from "@/lib/format";
import Funnel from "./Funnel";
import Thumb from "./Thumb";
import AdDrawer from "./AdDrawer";

type SplitKey = "none" | LeverKey | "talent";
const SPLITS: { key: SplitKey; label: string }[] = [
  { key: "none", label: "One funnel" },
  ...LEVERS.map((l) => ({ key: l.key as SplitKey, label: l.label })),
  { key: "talent", label: "Talent" },
];
const COLORS = ["#E2553B", "#2F6FDB", "#1E8C5A", "#B7791F", "#7A4FD0", "#C23A7A", "#4A5568", "#0E8A8A"];

export default function Dashboard({ brand }: { brand: Brand }) {
  const a = useMemo(() => analyse(brand), [brand]);
  const read = useMemo(() => ojan(brand, a), [brand, a]);
  const [split, setSplit] = useState<SplitKey>("persona");
  const [selected, setSelected] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const cur = brand.currency;
  const maxSpend = Math.max(...a.ads.map((ad) => ad.metrics.spend));
  const tagOf = (ad: AnalysedAd, k: SplitKey) => (k === "none" ? "All ads" : (ad.tags as unknown as Record<string, string | undefined>)[k] ?? "Untagged");

  const groups = useMemo(() => {
    const m = new Map<string, AnalysedAd[]>();
    a.ads.forEach((ad) => {
      const k = tagOf(ad, split);
      m.set(k, [...(m.get(k) ?? []), ad]);
    });
    return [...m.entries()]
      .map(([k, ads]) => ({ k, ads, spend: ads.reduce((s, x) => s + x.metrics.spend, 0) }))
      .sort((p, q) => q.spend - p.spend);
  }, [a.ads, split]);
  const shown = groups.slice(0, 8);

  const o = a.overall;
  const sel = a.ads.find((ad) => ad.id === selected) ?? null;
  const bandClass = `score-${a.account.band.toLowerCase()}`;

  return (
    <main className="wrap page">
      {/* Header */}
      <div className="dash-head">
        <div>
          <p className="eyebrow">{brand.category} · {brand.period}</p>
          <h1 className="h1 h1-sm">{brand.name}</h1>
          {brand.note && <p className="muted small" style={{ marginTop: 6 }}>{brand.note}</p>}
        </div>
        {brand.isDemo && <span className="pill pill-demo">Demo data</span>}
      </div>

      <div className="kpis" aria-label="Account totals">
        <Kpi l="Creatives" v={num(a.ads.length)} />
        <Kpi l="Spend" v={money(a.totalSpend, cur)} />
        <Kpi l="ROAS" v={x(o.roas)} />
        <Kpi l="Purchases" v={num(o.purchases, 0, cur)} />
        <Kpi l="CTR (link)" v={pct(o.ctr, 2)} />
        <Kpi l="CPC" v={money(o.cpc, cur, 2)} />
        <Kpi l="Cost / LPV" v={money(o.costLpv, cur, 2)} />
        <Kpi l="Cost / ATC" v={money(o.costAtc, cur)} />
        <Kpi l="CPA" v={money(o.cpa, cur)} />
      </div>

      {/* Score + OJAN */}
      <section className="grid-2">
        <div className="card score-card">
          <p className="eyebrow">Diversity score</p>
          <div className="score-row">
            <span className={`score score-xl ${bandClass}`}>{a.account.score}</span>
            <div>
              <span className={`pill ${bandClass}-pill`}>{a.account.band}</span>
              <p className="small" style={{ marginTop: 8 }}>{scoreSentence(a.account.score, a.account.band)}</p>
            </div>
          </div>
          <Bar label="Entity spread" w="40%" v={a.account.entitySpread}
            note={`${a.account.effectiveEntities.toFixed(1)} effective different ads out of ${a.ads.length}`} />
          <Bar label="Grid coverage" w="30%" v={a.account.coverage}
            note={`Spend-weighted: ${a.account.effectiveCounts.personas.toFixed(1)}/4 personas · ${a.account.effectiveCounts.angles.toFixed(1)}/12 angles · ${a.account.effectiveCounts.formats.toFixed(1)}/12 formats`} />
          <Bar label="Spend balance" w="30%" v={a.account.balance}
            note={`Largest entity takes ${pct(a.account.topEntityShare * 100, 0)} of spend (healthy: 25% or less)`} />
          <p className="muted tiny" style={{ marginTop: 10 }}>Low under 40 · Medium 40–69 · High 70+. <a href="/method">How it’s worked out</a></p>
        </div>
        <div className="card ojan">
          <p className="eyebrow">Audit read-out (OJAN)</p>
          <dl>
            <dt>Observation</dt><dd>{read.observation}</dd>
            <dt>Justification</dt><dd>{read.justification}</dd>
            <dt>Analysis</dt><dd>{read.analysis}</dd>
            <dt>Next steps</dt><dd><ul>{read.next.map((n, i) => <li key={i}>{n}</li>)}</ul></dd>
          </dl>
        </div>
      </section>

      {/* Funnel map */}
      <section className="section">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Funnel map</p>
            <h2 className="h2">Where every creative sits</h2>
            <p className="muted small">Each card is one ad, sized by spend. Click any card to read it.</p>
          </div>
          <label className="select">
            <span>Split funnels by</span>
            <select value={split} onChange={(e) => setSplit(e.target.value as SplitKey)}>
              {SPLITS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <div className="funnel-wrap">
          <div className={split === "none" ? "funnels-one" : "funnels-many"}>
            {split === "none" ? (
              <Funnel ads={a.ads} maxSpend={maxSpend} onSelect={setSelected} />
            ) : (
              shown.map((g, i) => (
                <Funnel key={g.k} ads={g.ads} title={g.k} color={COLORS[i % COLORS.length]} maxSpend={maxSpend} onSelect={setSelected} compact />
              ))
            )}
          </div>
          <ol className="stage-legend">
            {STAGES.map((s, i) => (
              <li key={s.key}>
                <span className={`legend-sw band-${i}`} />
                <b>{s.label}</b> <span className="muted">{a.ads.filter((ad) => ad.stage === s.key).length}</span>
                <span className="muted tiny">{s.sub}</span>
              </li>
            ))}
          </ol>
        </div>
        {groups.length > shown.length && <p className="muted tiny">Showing the 8 largest groups by spend; the table below lists all {groups.length}.</p>}

        <div className="tablewrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{SPLITS.find((s) => s.key === split)?.label === "One funnel" ? "Funnel stage" : SPLITS.find((s) => s.key === split)?.label}</th>
                <th className="r">Ads</th><th className="r">Spend</th><th className="r">Share</th><th className="r">CTR</th>
                <th className="r">CPC</th><th className="r">Cost/LPV</th><th className="r">Cost/ATC</th><th className="r">ROAS</th><th className="r">CPA</th>
              </tr>
            </thead>
            <tbody>
              {(split === "none" ? [{ k: "All ads", ads: a.ads, spend: a.totalSpend }] : groups).map((g, gi) => {
                const st = stats(g.ads, a.totalSpend);
                const open = split === "none" || openGroups[g.k];
                return (
                  <FragmentRows key={g.k}>
                    {split !== "none" && (
                      <tr className="grp" onClick={() => setOpenGroups((s) => ({ ...s, [g.k]: !s[g.k] }))}>
                        <td>
                          <button type="button" className="linkbtn" aria-expanded={!!open}>
                            <span className="caret">{open ? "▾" : "▸"}</span>
                            <span className="dot" style={{ background: COLORS[gi % COLORS.length] }} /> {g.k}
                          </button>
                        </td>
                        <StatCells st={st} cur={cur} o={o} />
                      </tr>
                    )}
                    {open && STAGES.map((s) => {
                      const sub = g.ads.filter((ad) => ad.stage === s.key);
                      if (!sub.length) return null;
                      return (
                        <tr key={s.key} className="sub">
                          <td>{s.label}</td>
                          <StatCells st={stats(sub, a.totalSpend)} cur={cur} o={o} />
                        </tr>
                      );
                    })}
                  </FragmentRows>
                );
              })}
            </tbody>
          </table>
          <p className="muted tiny tbl-note">Green and red compare each row with the account average. Creatives are judged on CTR, CPC, cost per LPV and cost per ATC, never on CPM.</p>
        </div>
      </section>

      {/* Entities */}
      <section className="section">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Entities</p>
            <h2 className="h2">Ads Meta likely sees as one</h2>
            <p className="muted small">Ads that share persona, angle and format (and differ only in backdrop, hook or similar) are grouped. Each group gets one shot at the auction.</p>
          </div>
        </div>
        <div className="entities">
          {a.account.entities.slice(0, 10).map((e) => {
            const eads = a.ads.filter((ad) => ad.entityId === e.id).sort((p, q) => q.metrics.spend - p.metrics.spend);
            return (
              <div key={e.id} className={`entity ${e.adIds.length >= 3 ? "entity-crowded" : ""}`}>
                <div className="entity-head">
                  <span className="entity-id">E{e.id}</span>
                  <div className="entity-label"><b>{e.label}</b>
                    <span className="muted tiny">{e.adIds.length} ad{e.adIds.length > 1 ? "s" : ""} · {pct(e.share * 100, 0)} of spend{e.adIds.length >= 3 ? " · too many copies" : ""}</span>
                  </div>
                  <div className="sharebar" aria-hidden="true"><span style={{ width: `${Math.min(100, e.share * 100 / Math.max(a.account.topEntityShare, 0.01))}%` }} /></div>
                </div>
                <div className="entity-thumbs">
                  {eads.slice(0, 12).map((ad) => (
                    <button key={ad.id} type="button" className="mini" onClick={() => setSelected(ad.id)} aria-label={`Open ${ad.headline}`}>
                      <Thumb ad={ad} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coverage grid */}
      <section className="section">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Coverage</p>
            <h2 className="h2">The persona × angle grid</h2>
            <p className="muted small">Share of spend in each cell. Empty cells are concepts nobody has briefed yet.</p>
          </div>
        </div>
        <Coverage ads={a.ads} total={a.totalSpend} />
        <div className="formats">
          <p className="small"><b>Format library</b> <span className="muted">· {12 - a.gaps.unusedFormats.length} of 12 used</span></p>
          <div className="chips">
            {FORMAT_LIBRARY.map((f) => {
              const used = !a.gaps.unusedFormats.includes(f);
              return <span key={f} className={`chip ${used ? "chip-on" : "chip-off"}`}>{used ? "✓ " : ""}{f}</span>;
            })}
          </div>
        </div>
      </section>

      {/* All ads */}
      <section className="section">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Every creative</p>
            <h2 className="h2">All ads, by spend</h2>
          </div>
        </div>
        <div className="adgrid">
          {[...a.ads].sort((p, q) => q.metrics.spend - p.metrics.spend).map((ad) => (
            <button key={ad.id} type="button" className="adcard" onClick={() => setSelected(ad.id)}>
              <Thumb ad={ad} showText className="adcard-thumb" />
              <span className="adcard-meta">
                <span className="tiny muted">{ad.tags.persona} · {ad.tags.angle}</span>
                <span className="adcard-row"><b>{money(ad.metrics.spend, cur)}</b><span className={`div-badge ${ad.diversity < 35 ? "low" : ad.diversity < 60 ? "mid" : "high"}`}>Diversity {ad.diversity}</span></span>
                <span className="tiny muted">{ad.tags.format} · E{ad.entityId}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {sel && <AdDrawer ad={sel} all={a.ads} brand={brand} overall={o} totalSpend={a.totalSpend} onClose={() => setSelected(null)} onSelect={setSelected} />}
    </main>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Kpi({ l, v }: { l: string; v: string }) {
  return <div className="kpi"><span className="tiny muted">{l}</span><b>{v}</b></div>;
}

function Bar({ label, w, v, note }: { label: string; w: string; v: number; note: string }) {
  return (
    <div className="bar">
      <div className="bar-top"><span className="small"><b>{label}</b> <span className="muted tiny">weight {w}</span></span><span className="small">{Math.round(v * 100)}</span></div>
      <div className="bar-track"><span style={{ width: `${Math.round(v * 100)}%` }} /></div>
      <p className="tiny muted">{note}</p>
    </div>
  );
}

function StatCells({ st, cur, o }: { st: ReturnType<typeof stats>; cur: Brand["currency"]; o: ReturnType<typeof stats> }) {
  const cmp = (v: number, base: number, lowerBetter: boolean) => {
    if (!isFinite(v) || !isFinite(base) || st.share < 0.03) return "";
    const d = (v - base) / base;
    if (Math.abs(d) < 0.1) return "";
    return (lowerBetter ? d < 0 : d > 0) ? "good" : "bad";
  };
  return (
    <>
      <td className="r">{st.n}</td>
      <td className="r">{money(st.spend, cur)}</td>
      <td className="r">{pct(st.share * 100, 0)}</td>
      <td className={`r ${cmp(st.ctr, o.ctr, false)}`}>{pct(st.ctr, 2)}</td>
      <td className={`r ${cmp(st.cpc, o.cpc, true)}`}>{money(st.cpc, cur, 2)}</td>
      <td className={`r ${cmp(st.costLpv, o.costLpv, true)}`}>{money(st.costLpv, cur, 2)}</td>
      <td className={`r ${cmp(st.costAtc, o.costAtc, true)}`}>{money(st.costAtc, cur)}</td>
      <td className={`r ${cmp(st.roas, o.roas, false)}`}>{x(st.roas)}</td>
      <td className={`r ${cmp(st.cpa, o.cpa, true)}`}>{money(st.cpa, cur)}</td>
    </>
  );
}

function Coverage({ ads, total }: { ads: AnalysedAd[]; total: number }) {
  const personas = [...new Set(ads.map((a) => a.tags.persona))];
  return (
    <div className="coverage">
      {personas.map((p) => {
        const pads = ads.filter((a) => a.tags.persona === p);
        const angles = [...new Set(pads.map((a) => a.tags.angle))];
        const share = pads.reduce((s, a) => s + a.metrics.spend, 0) / (total || 1);
        return (
          <div key={p} className="cov-row">
            <div className="cov-p"><b>{p}</b><span className="tiny muted">{pct(share * 100, 0)} of spend · {angles.length} angle{angles.length > 1 ? "s" : ""}</span></div>
            <div className="cov-cells">
              {angles.map((ang) => {
                const c = pads.filter((a) => a.tags.angle === ang);
                const s = c.reduce((t, a) => t + a.metrics.spend, 0) / (total || 1);
                const formats = [...new Set(c.map((a) => a.tags.format))];
                return (
                  <div key={ang} className="cov-cell" style={{ ["--fill" as string]: `${Math.min(1, s / 0.3)}` }}>
                    <b>{ang}</b>
                    <span className="tiny">{pct(s * 100, 0)} · {c.length} ad{c.length > 1 ? "s" : ""}</span>
                    <span className="tiny muted">{formats.join(", ")}</span>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 3 - angles.length) }).map((_, i) => (
                <div key={`gap${i}`} className="cov-cell cov-gap"><b>Open slot</b><span className="tiny muted">Brief a new angle</span></div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
