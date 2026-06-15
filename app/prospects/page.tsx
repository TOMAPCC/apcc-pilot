import { AppShell } from "@/components/AppShell";
import { prospects } from "@/lib/demo-data";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function ProspectsPage() {
  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Prospects</h1>
          <p>Qualification, suivi commercial, projets et prochaines actions.</p>
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
              <th>Montant</th>
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
                <td>{euro.format(prospect.estimatedBudget)}</td>
                <td>{prospect.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
