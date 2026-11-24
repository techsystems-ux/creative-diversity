import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { analyse } from "@/lib/scoring";
import { money } from "@/lib/format";

export default function Home() {
  return (
    <main className="wrap page">
      <p className="eyebrow">Creative audits</p>
      <h1 className="h1">How diverse are a brand’s creatives, really?</h1>
      <p className="lede">
        Every creative is read and tagged on six levers: persona, angle, format, visual world, hook and awareness stage.
        Ads that differ on too few levers are grouped into one entity, the way Meta groups them. The score shows how much
        of the spend goes to genuinely different ideas.
      </p>
      <div className="brandlist">
        {BRANDS.map((b) => {
          const a = analyse(b);
          return (
            <Link key={b.slug} href={`/b/${b.slug}`} className="brandcard">
              <div className="brandcard-top">
                <div>
                  <h2 className="h3">{b.name}</h2>
                  <p className="muted small">{b.category} · {b.period} · {b.ads.length} ads · {money(a.totalSpend, b.currency)}</p>
                </div>
                {b.isDemo && <span className="pill pill-demo">Demo data</span>}
              </div>
              <div className="brandcard-score">
                <span className={`score score-${a.account.band.toLowerCase()}`}>{a.account.score}</span>
                <span className="muted small">Diversity score · <b>{a.account.band}</b></span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="muted small" style={{ marginTop: 24 }}>
        To add a brand, see “Adding a brand” on the <Link href="/method#add">scoring page</Link>.
      </p>
    </main>
  );
}
