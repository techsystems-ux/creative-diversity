import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Diversity · Hovers",
  description: "Bucket a brand’s Meta creatives by persona, angle and format, see where each sits in the funnel, and score how diverse the account really is.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&display=swap"
        />
      </head>
      <body>
        <header className="topbar">
          <div className="wrap topbar-in">
            <Link href="/" className="brandmark">
              <span className="logo-dot" aria-hidden="true" />
              Hovers <span className="muted-inv">Creative Diversity</span>
            </Link>
            <nav className="topnav">
              <Link href="/">Brands</Link>
              <Link href="/method">How the scoring works</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          <div className="wrap">Hovers internal tool · scores are estimates built on tags from the creative read and Meta ad-level data.</div>
        </footer>
      </body>
    </html>
  );
}
