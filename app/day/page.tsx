import Link from "next/link";
import type { Route } from "next";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { getCrmProspects } from "@/lib/sheet-prospects";
import { buildWorkQueues } from "@/lib/work-queues";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DayPage() {
  const prospects = await getCrmProspects();
  const queues = buildWorkQueues(prospects);
  const todayQueue = queues.find((queue) => queue.id === "today");
  const overdueQueue = queues.find((queue) => queue.id === "overdue");
  const noAnswerQueue = queues.find((queue) => queue.id === "no-answer");
  const appointmentsQueue = queues.find((queue) => queue.id === "appointments");
  const focusProspects = [
    ...(overdueQueue?.prospects ?? []),
    ...(todayQueue?.prospects ?? [])
  ].filter((prospect, index, items) => items.findIndex((item) => item.id === prospect.id) === index).slice(0, 12);

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Ma journee</h1>
          <p>Les actions commerciales a traiter en priorite, branchees sur les vrais prospects.</p>
        </div>
        <Link className="button" href="/prospects/new">Ajouter un prospect</Link>
      </div>

      <section className="grid cols-4">
        <MetricCard label="A faire aujourd'hui" value={todayQueue?.count ?? 0} hint="Relances et qualifications" />
        <MetricCard label="En retard" value={overdueQueue?.count ?? 0} hint="A reprendre en premier" />
        <MetricCard label="Injoignables" value={noAnswerQueue?.count ?? 0} hint="Relance closer + rappel" />
        <MetricCard label="Rendez-vous" value={appointmentsQueue?.count ?? 0} hint="A preparer ou confirmer" />
      </section>

      <section className="grid cols-3 queue-overview">
        {queues.slice(0, 3).map((queue) => (
          <Link className="queue-card" href={queue.href as Route} key={queue.id}>
            <span className={queue.urgentCount ? "badge hot" : "badge"}>{queue.urgentCount} urgent(s)</span>
            <strong>{queue.title}</strong>
            <p>{queue.description}</p>
            <em>{queue.count} dossier(s)</em>
          </Link>
        ))}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Priorites a appeler / relancer</h2>
          <Link className="secondary-button" href={"/work-queues" as Route}>Voir toutes les files</Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Projet</th>
              <th>Action</th>
              <th>Echeance</th>
            </tr>
          </thead>
          <tbody>
            {focusProspects.map((prospect) => (
              <tr key={prospect.id}>
                <td>
                  <Link href={`/prospects/${prospect.id}`}>
                    <strong>{prospect.firstName} {prospect.lastName}</strong>
                    <div className="muted">{prospect.phone || "Telephone manquant"} - {prospect.email || "Email manquant"}</div>
                  </Link>
                </td>
                <td>
                  <span className={prospect.businessLine === "Prime Adapt" ? "source-pill prime" : "source-pill"}>{prospect.businessLine === "Prime Adapt" ? "Prime Adapt'" : "Pompe a chaleur"}</span>
                  <div className="muted">{prospect.postalCode} {prospect.city}</div>
                </td>
                <td>{prospect.nextAction || prospect.status}</td>
                <td>{formatDate(prospect.nextFollowUp)}</td>
              </tr>
            ))}
            {!focusProspects.length ? (
              <tr>
                <td colSpan={4} className="muted">Aucune urgence detectee pour aujourd&apos;hui.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non date";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
