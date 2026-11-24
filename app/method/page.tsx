import { LEVERS, RULES, STAGES, FORMAT_LIBRARY } from "@/lib/scoring";

export const metadata = { title: "How the scoring works · Creative Diversity" };

export default function Method() {
  return (
    <main className="wrap page prose">
      <p className="eyebrow">For the team</p>
      <h1 className="h1 h1-sm">How the scoring works</h1>
      <p className="lede">
        Five steps turn a brand’s ads into a diversity score: read each creative, place it in the funnel, measure how far
        apart ads are, group look-alikes into entities, then score the account. Every number on the dashboard comes from
        the rules on this page.
      </p>

      <h2 className="h2">1. Read each creative</h2>
      <p>Each ad is looked at (image or video frames plus its copy) and tagged on six levers. These are the same levers as the creative grid training.</p>
      <table className="tbl tbl-prose">
        <thead><tr><th>Lever</th><th>What it captures</th><th className="r">Weight</th></tr></thead>
        <tbody>
          {LEVERS.map((l) => <tr key={l.key}><td><b>{l.label}</b></td><td>{l.help}</td><td className="r">{Math.round(l.weight * 100)}%</td></tr>)}
        </tbody>
      </table>
      <p>The read also scores three kinds of clarity, each 0–100: <b>visual</b> (is it easy to take in at a glance), <b>product</b> (is the product obvious and large enough), and <b>message</b> (is the one promise clear).</p>
      <p>Formats come from the 12-format library: {FORMAT_LIBRARY.join(", ")}.</p>

      <h2 className="h2">2. Place it in the funnel</h2>
      <p>When Meta’s audience-segment breakdown is available, the ad is placed by who the money actually reached:</p>
      <ul>
        <li><b>Reactivation</b> if {RULES.reactExisting * 100}% or more of its spend reached existing customers.</li>
        <li><b>Top of funnel</b> if {RULES.tofNew * 100}% or more reached new people.</li>
        <li>Otherwise it is mostly reaching engaged people: <b>Bottom of funnel</b> if frequency is {RULES.bofFrequency} or higher (saturated), else <b>Middle of funnel</b> (still warming).</li>
      </ul>
      <p>Without the breakdown, the ad is placed by the awareness stage the creative speaks to: unaware and problem-aware go to the top, solution-aware to the middle, product-aware and most-aware to the bottom. The ad’s panel says which method placed it.</p>
      <ol className="stage-list">{STAGES.map((s) => <li key={s.key}><b>{s.label}</b>: {s.sub}</li>)}</ol>

      <h2 className="h2">3. Measure how different two ads are</h2>
      <p>Distance between two ads is the sum of the weights of the levers on which they differ. Two ads with the same persona, angle and format that differ only in backdrop are 15% apart. Two ads that differ on everything are 100% apart.</p>

      <h2 className="h2">4. Group look-alikes into entities</h2>
      <p>
        Two ads less than {Math.round(RULES.sameEntity * 100)}% apart are treated as one entity, and groups chain together. In practice an entity is
        “same persona, same angle, same format”, with only the backdrop, hook or awareness wording changed. That is our model of how Meta
        groups look-alike ads: each entity gets one shot at the auction, however many copies sit inside it.
      </p>

      <h2 className="h2">5. Score</h2>
      <h3 className="h3">Ad diversity (0–100)</h3>
      <p>How different this ad is from the rest of the account. Half of it is the distance to its closest look-alike; half is the average distance to every other ad, weighted by their spend. A copy of an existing ad scores low, however small the copy is.</p>
      <p className="formula">Ad diversity = 100 × (½ × distance to closest ad + ½ × Σ (spend of other ad × distance) ÷ Σ spend of other ads)</p>

      <h3 className="h3">Account diversity (0–100)</h3>
      <p className="formula">Score = 40% × entity spread + 30% × grid coverage + 30% × spend balance</p>
      <ul>
        <li><b>Entity spread.</b> The effective number of entities the money is spread over (e to the power of the spend entropy across entities), divided by the smaller of the ad count and 12.</li>
        <li><b>Grid coverage.</b> Average of personas ÷ {RULES.targets.personas}, angles ÷ {RULES.targets.angles} and formats ÷ {RULES.targets.formats}, each capped at 1. Counts are spend-weighted (the effective number, from spend entropy), so a persona with 1% of spend barely counts.</li>
        <li><b>Spend balance.</b> Full marks while the largest entity takes 25% of spend or less, falling to zero at 75%.</li>
      </ul>
      <p><b>Bands:</b> Low under 40, Medium 40–69, High 70 and above.</p>

      <h2 className="h2">Judging performance</h2>
      <ul>
        <li>Creatives are compared on CTR, CPC, cost per landing page view, cost per add to cart, ROAS and CPA against the account average. CPM is not used to judge a creative.</li>
        <li>An ad is only called a winner or an underperformer once it has {RULES.winnerSpendShare * 100}% or more of account spend. Below that it is “too little spend to judge”.</li>
      </ul>

      <h2 className="h2">Using it in an audit</h2>
      <ol>
        <li>Lead with the score and band: “Your diversity score is 38, which is low.”</li>
        <li>Show the largest entity: how many copies, and what share of spend it takes.</li>
        <li>Show the grid: which personas and angles are missing, and which formats are unused.</li>
        <li>Close with the OJAN read-out and the next concepts to brief.</li>
      </ol>

      <h2 className="h2" id="add">Adding a brand</h2>
      <ol>
        <li>Export ad-level data from Meta for the period: spend, impressions, reach, link clicks, landing page views, adds to cart, purchases, purchase value, 3-second plays and ThruPlays. Add the audience-segment breakdown if the account has it.</li>
        <li>Download the creatives (images, or a key frame for videos) named by ad ID.</li>
        <li>Each creative is read and tagged (persona, angle, format, visual world, hook, awareness, clarity scores) and saved as <code>data/brands/&lt;brand&gt;.json</code>, with images in <code>public/creatives/&lt;brand&gt;/</code>.</li>
        <li>Register the file in <code>lib/brands.ts</code>. The dashboard, funnel and scores update on the next deploy.</li>
      </ol>
    </main>
  );
}
