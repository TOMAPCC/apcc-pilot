import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { getCrmProspects, getSheetDashboardMetrics } from "@/lib/sheet-prospects";
import { buildWorkQueues } from "@/lib/work-queues";
import Link from "next/link";
import type { Route } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const prospects = await getCrmProspects();
  const metrics = getSheetDashboardMetrics(prospects);
  const latestProspects = prospects.slice(0, 8);
  const queues = buildWorkQueues(prospects);
  const todayQueue = queues.find((queue) => queue.id === "today");
  const overdueQueue = queues.find((queue) => queue.id === "overdue");
  const clubTravauxCount = prospects.filter((prospect) => prospect.source === "ClubTravaux").length;
  const heatPumpCount = prospects.filter((prospect) => prospect.businessLine === "Pompe a chaleur").length;
  const primeAdaptCount = prospects.filter((prospect) => prospect.businessLine === "Prime Adapt").length;

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Cockpit APCC</h1>
          <p>Vue operationnelle CRM: leads, relances, rendez-vous, clients et sources entrantes.</p>
        </div>
        <div className="page-actions">
          <Link className="secondary-button" href={"/day" as Route}>Ouvrir ma journee</Link>
          <Link className="button" href="/prospects/new">Creer un prospect</Link>
        </div>
      </div>

      <section className="grid cols-4">
        <MetricCard label="Pompes a chaleur" value={heatPumpCount} hint="Google Sheets + ClubTravaux" />
        <MetricCard label="Prime Adapt" value={primeAdaptCount} hint="Salles de bain PMR" />
        <MetricCard label="A traiter aujourd'hui" value={todayQueue?.count ?? 0} hint="Relance telephone/e-mail" />
        <MetricCard label="En retard" value={overdueQueue?.count ?? 0} hint={`${clubTravauxCount} ClubTravaux importes`} />
      </section>

      <section className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="section-head">
            <h2>Derniers leads</h2>
            <span className="badge hot">{metrics.lost} hors cible/perdus</span>
          </div>
          <table className="table">
            <tbody>
              {latestProspects.map((prospect) => (
                <tr key={prospect.id}>
                  <td>
                    <strong>{prospect.firstName} {prospect.lastName}</strong>
                    <div className="muted">{prospect.postalCode} - {prospect.projectTypes.join(", ")}</div>
                    <span className={prospect.businessLine === "Prime Adapt" ? "source-pill prime" : "source-pill"}>{prospect.businessLine === "Prime Adapt" ? "Prime Adapt'" : "Pompe a chaleur"}</span>
                  </td>
                  <td><span className="badge">{prospect.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Rendez-vous reperes</h2>
            <span className="badge blue">{metrics.appointments}</span>
          </div>
          {prospects.filter((prospect) => prospect.status === "Rendez-vous planifie").slice(0, 5).map((prospect) => (
            <div className="deal-card" key={prospect.id}>
              <strong>{prospect.firstName} {prospect.lastName}</strong>
              <p>{prospect.phone}</p>
              <p>{prospect.comments || "Commentaire Google Sheet"}</p>
            </div>
          ))}
          {!metrics.appointments ? <p className="muted">Aucun rendez-vous detecte dans les commentaires.</p> : null}
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>A traiter</h2>
            <span className="badge">{metrics.toContact + metrics.newProspects}</span>
          </div>
          {prospects.filter((prospect) => prospect.status === "A contacter" || prospect.status === "Nouveau lead").slice(0, 5).map((prospect) => (
            <div className="deal-card" key={prospect.id}>
              <strong>{prospect.firstName} {prospect.lastName}</strong>
              <p>{prospect.nextAction}</p>
              <p>{prospect.phone} - {prospect.email}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Sources et synchronisation</h2>
          <a className="secondary-button" href="/admin/connectors">Synchroniser</a>
        </div>
        <p className="muted">
          Les leads Google Sheets, Prime Adapt et ClubTravaux alimentent PostgreSQL. Les changements de statut creent maintenant une trajectoire claire:
          pipeline, rendez-vous, dossier client et classement documentaire apres validation client.
        </p>
      </section>
    </AppShell>
  );
}
