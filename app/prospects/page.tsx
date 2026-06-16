import { AppShell } from "@/components/AppShell";
import { getCrmProspects } from "@/lib/sheet-prospects";

export default async function ProspectsPage() {
  const prospects = await getCrmProspects();

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Prospects</h1>
          <p>{prospects.length} leads recuperes depuis Google Sheets et ClubTravaux.</p>
        </div>
        <a className="button" href="/prospects/new">Nouveau prospect</a>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Projet</th>
              <th>Source</th>
              <th>Commercial</th>
              <th>Statut</th>
              <th>Score</th>
              <th>Prochaine action</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id}>
                <td>
                  <strong>{prospect.civility} {prospect.firstName} {prospect.lastName}</strong>
                  <div className="muted">{prospect.phone} - {prospect.email}</div>
                  <div className="muted">{prospect.postalCode} {prospect.city}</div>
                </td>
                <td>{prospect.projectTypes.join(", ")}</td>
                <td>{prospect.source}</td>
                <td>{prospect.assignedTo}</td>
                <td><span className="badge">{prospect.status}</span></td>
                <td>{prospect.score}/100</td>
                <td>{prospect.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
