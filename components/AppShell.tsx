import Link from "next/link";

const nav = [
  ["Tableau de bord", "/"],
  ["Prospects", "/prospects"],
  ["Pipeline", "/pipeline"],
  ["Taches", "/tasks"],
  ["Rendez-vous", "/appointments"],
  ["Chantiers", "/worksites"],
  ["Administration", "/admin/connectors"]
] as const;

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="APCC PILOT">
          <img className="brand-logo" src="/logo-apcc.png" alt="APCC Neuf et Renovation" />
          <div>
            <strong>APCC PILOT</strong>
            <span>CRM & chantiers</span>
          </div>
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {nav.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <form action="/prospects" className="global-search">
            <input className="search" name="q" placeholder="Rechercher nom, telephone, email, ville, source..." />
            <button className="secondary-button" type="submit">Rechercher</button>
          </form>
          <div className="muted">Administrateur APCC</div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
