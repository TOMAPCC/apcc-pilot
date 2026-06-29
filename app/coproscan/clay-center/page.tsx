import { prisma } from "@/lib/db";
import { isClayConfigured } from "@/lib/coproscan/clay-provider";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { ClayJobRow } from "@/lib/coproscan/db-types";
import Link from "next/link";

type SyndicPendingItem = {
  id: string; name: string; siren: string | null; city: string | null;
  _count: { coproprietes: number };
};
type ClayJobWithSyndic = ClayJobRow & { syndic: { name: string } };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClayCenterPage() {
  const configured = isClayConfigured();

  const [syndicsPending, jobsRecent, totalJobs]: [SyndicPendingItem[], ClayJobWithSyndic[], number] = await Promise.all([
    prisma.syndic.findMany({
      where: {
        isDemo: false,
        gdprOpposedAt: null,
        enrichmentStatus: "pending",
        coproprietes: {
          some: {
            department: { in: TARGET_DEPARTMENTS },
            classificationStatus: "confirmed",
            energyClass: { in: ["E", "F", "G"] },
            isDemo: false,
          },
        },
      },
      select: { id: true, name: true, siren: true, city: true, _count: { select: { coproprietes: true } } },
      take: 50,
    }),
    prisma.clayJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { syndic: { select: { name: true } } },
    }),
    prisma.clayJob.count(),
  ]);

  const statusColors: Record<string, string> = {
    pending: "var(--muted)",
    sent: "var(--warning)",
    processing: "var(--warning)",
    done: "var(--success)",
    failed: "var(--danger)",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Clay Enrichment Center</h1>
          <p>Enrichissement des syndics et recherche de contacts décideurs professionnels</p>
        </div>
        <Link href={"/docs/clay-setup.md" as never} className="secondary-button">
          Documentation Clay
        </Link>
      </div>

      {/* Status Clay */}
      <div
        className="panel"
        style={{
          background: configured ? "#f0fdf4" : "#fff8e1",
          border: `1px solid ${configured ? "#86efac" : "#fde68a"}`,
          marginBottom: 20,
        }}
      >
        <strong>
          {configured ? "Clay configuré" : "Clay non configuré — enrichissement en attente"}
        </strong>
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>
          {configured ? (
            <>Mode : {process.env.CLAY_MODE} · Quota journalier : {process.env.CLAY_MAX_DAILY_JOBS} jobs</>
          ) : (
            <>
              Définissez <code>CLAY_INGEST_WEBHOOK_URL</code>, <code>CLAY_CALLBACK_SECRET</code> et{" "}
              <code>CLAY_ENRICHMENT_ENABLED=true</code> dans votre fichier .env.
              Consultez <strong>docs/clay-setup.md</strong> pour les instructions complètes.
              <br />
              Les jobs restent créés en base en statut <em>pending</em> jusqu&apos;à la configuration.
            </>
          )}
        </p>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>Syndics à enrichir</span>
          <strong>{syndicsPending.length}</strong>
        </div>
        <div className="card metric">
          <span>Jobs Clay total</span>
          <strong>{totalJobs}</strong>
        </div>
        <div className="card metric">
          <span>Statut Clay</span>
          <strong style={{ fontSize: 16, color: configured ? "var(--success)" : "var(--warning)" }}>
            {configured ? "Actif" : "Non configuré"}
          </strong>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Syndics à enrichir */}
        <div className="panel">
          <div className="section-head">
            <h2>Syndics en attente ({syndicsPending.length})</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
            N&apos;envoyez à Clay que les syndics réels identifiés sur des copropriétés EFG confirmées. Aucun résident ni contact privé ne doit être recherché.
          </p>
          {syndicsPending.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              Tous les syndics identifiés ont déjà été soumis à Clay.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Syndic</th>
                  <th>SIREN</th>
                  <th>Copros EFG</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {syndicsPending.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/coproscan/syndics/${s.id}` as never} style={{ color: "var(--apcc-blue)", fontWeight: 600 }}>
                        {s.name}
                      </Link>
                      {s.city && <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.city}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{s.siren ?? "—"}</td>
                    <td>{s._count.coproprietes}</td>
                    <td>
                      <EnrichButton syndicId={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Historique jobs */}
        <div className="panel">
          <div className="section-head">
            <h2>Derniers jobs Clay</h2>
          </div>
          {jobsRecent.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Aucun job Clay lancé.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Syndic</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {jobsRecent.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontSize: 13 }}>{job.syndic.name}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{job.jobType}</td>
                    <td>
                      <span style={{ fontSize: 12, color: statusColors[job.status] ?? "var(--muted)" }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(job.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function EnrichButton({ syndicId }: { syndicId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { enqueueCompanyEnrichment } = await import("@/lib/coproscan/clay-provider");
        await enqueueCompanyEnrichment(syndicId);
      }}
    >
      <button type="submit" className="secondary-button" style={{ fontSize: 12, padding: "4px 10px" }}>
        Enrichir
      </button>
    </form>
  );
}
