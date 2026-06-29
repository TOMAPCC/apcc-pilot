import Link from "next/link";
import type { Route } from "next";
import { AppShell } from "@/components/AppShell";
import { getCrmProspects } from "@/lib/sheet-prospects";
import { buildWorkQueues } from "@/lib/work-queues";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkQueuesPage() {
  const prospects = await getCrmProspects();
  const queues = buildWorkQueues(prospects);

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Files de travail</h1>
          <p>Chaque file correspond a une action concrete: appeler, relancer, preparer, valider ou consolider.</p>
        </div>
      </div>

      <section className="work-queue-grid">
        {queues.map((queue) => (
          <article className="queue-panel" key={queue.id}>
            <div className="section-head">
              <div>
                <span className={queue.urgentCount ? "badge hot" : "badge"}>{queue.urgentCount} urgent(s)</span>
                <h2>{queue.title}</h2>
              </div>
              <Link className="secondary-button" href={queue.href as Route}>{queue.count} dossier(s)</Link>
            </div>
            <p className="muted">{queue.description}</p>
            <div className="queue-list">
              {queue.prospects.map((prospect) => (
                <Link className="queue-row" href={`/prospects/${prospect.id}`} key={prospect.id}>
                  <span>
                    <strong>{prospect.firstName} {prospect.lastName}</strong>
                    <small>{prospect.postalCode} {prospect.city} - {prospect.phone || "telephone manquant"}</small>
                  </span>
                  <em>{prospect.status}</em>
                </Link>
              ))}
              {!queue.prospects.length ? <p className="muted">File vide pour le moment.</p> : null}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
