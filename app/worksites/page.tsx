import { AppShell } from "@/components/AppShell";
import { worksites } from "@/lib/demo-data";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function WorksitesPage() {
  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Chantiers</h1>
          <p>Suivi operationnel des dossiers signes, acomptes, planification et phases.</p>
        </div>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr><th>Reference</th><th>Client</th><th>Travaux</th><th>Montant</th><th>Conducteur</th><th>Demarrage</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {worksites.map((worksite) => (
              <tr key={worksite.id}>
                <td>{worksite.reference}</td>
                <td>{worksite.clientName}</td>
                <td>{worksite.type}</td>
                <td>{euro.format(worksite.amount)}</td>
                <td>{worksite.foreman}</td>
                <td>{new Date(worksite.plannedStart).toLocaleDateString("fr-FR")}</td>
                <td><span className="badge">{worksite.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
