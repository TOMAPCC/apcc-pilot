import Link from "next/link";
import type { Route } from "next";

const nav = [
  ["Prospects EFG confirmés", "/coproscan/prospects-efg"],
  ["EFG probables", "/coproscan/prospects-probables"],
  ["À qualifier", "/coproscan/a-qualifier"],
  ["Syndics", "/coproscan/syndics"],
  ["Clay Enrichment", "/coproscan/clay-center"],
  ["Contact Review", "/coproscan/contact-review"],
  ["Email Studio", "/coproscan/email-studio"],
  ["Pipeline", "/coproscan/pipeline"],
  ["Imports & qualité", "/coproscan/imports"],
  ["RGPD", "/coproscan/rgpd"],
] as const;

export default function CoproScanLayout({ children }: { children: React.ReactNode }) {
  const isProduction = process.env.APP_ENV === "production" && process.env.DEMO_MODE !== "true";

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="APCC">
          <img className="brand-logo" src="/logo-apcc.png" alt="APCC" />
          <div>
            <strong>CoproScan</strong>
            <span>APCC · B2B Copropriétés</span>
          </div>
        </Link>

        {!isProduction && (
          <div
            style={{
              background: "#fff8e1",
              border: "1px solid #f59e0b",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              color: "#92400e",
              marginBottom: 12,
            }}
          >
            Mode développement — données de démonstration actives
          </div>
        )}

        <nav className="nav" aria-label="CoproScan">
          {nav.map(([label, href]) => (
            <Link href={href as Route} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--muted)" }}>
            ← CRM APCC
          </Link>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span style={{ fontWeight: 700, color: "var(--apcc-navy)" }}>APCC CoproScan</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {isProduction ? "Production" : "Développement · DEMO_MODE actif"}
          </span>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
