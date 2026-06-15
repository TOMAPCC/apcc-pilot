import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { appointments, prospects, tasks, worksites } from "@/lib/demo-data";
import { getDashboardMetrics } from "@/lib/crm";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const metrics = getDashboardMetrics();

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue operationnelle des leads, relances, signatures et chantiers APCC.</p>
        </div>
        <a className="button" href="/prospects/new">Creer un prospect</a>
      </div>

      <section className="grid cols-4">
        <MetricCard label="Nouveaux prospects" value={metrics.newProspects} hint="A traiter rapidement" />
        <MetricCard label="Relances aujourd'hui" value={metrics.followUpsToday} hint={`${metrics.overdueTasks} en retard`} />
        <MetricCard label="CA signe" value={euro.format(metrics.signedRevenue)} hint={`${metrics.conversionRate}% transformation demo`} />
        <MetricCard label="Prevision ponderee" value={euro.format(metrics.forecastRevenue)} hint="Selon etape pipeline" />
      </section>

      <section className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="section-head">
            <h2>Priorites commerciales</h2>
            <span className="badge hot">{metrics.quotesToFollow} devis</span>
          </div>
          <table className="table">
            <tbody>
              {prospects.slice(0, 4).map((prospect) => (
                <tr key={prospect.id}>
                  <td>
                    <strong>{prospect.firstName} {prospect.lastName}</strong>
                    <div className="muted">{prospect.city} - {prospect.projectTypes.join(", ")}</div>
                  </td>
                  <td><span className="badge">{prospect.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Rendez-vous</h2>
            <span className="badge blue">{metrics.upcomingAppointments} a venir</span>
          </div>
          {appointments.map((appointment) => (
            <div className="deal-card" key={appointment.id}>
              <strong>{appointment.title}</strong>
              <p>{new Date(appointment.startsAt).toLocaleString("fr-FR")} - {appointment.owner}</p>
              <p>{appointment.address}</p>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Chantiers</h2>
            <span className="badge">{metrics.worksitesInProgress} ouverts</span>
          </div>
          {worksites.map((worksite) => (
            <div className="deal-card" key={worksite.id}>
              <strong>{worksite.reference}</strong>
              <p>{worksite.clientName} - {worksite.type}</p>
              <p>{worksite.status} - {euro.format(worksite.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Taches critiques</h2>
          <a className="secondary-button" href="/tasks">Tout voir</a>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tache</th>
              <th>Responsable</th>
              <th>Echeance</th>
              <th>Priorite</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.owner}</td>
                <td>{new Date(task.dueDate).toLocaleDateString("fr-FR")}</td>
                <td><span className="badge hot">{task.priority}</span></td>
                <td>{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
