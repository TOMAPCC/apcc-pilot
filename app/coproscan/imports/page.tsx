import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { ImportBatchRow } from "@/lib/coproscan/db-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ImportsPage() {
  type GroupByRow = { department: string; classificationStatus: string; _count: { _all: number } };
  let batches: ImportBatchRow[] = [];
  let counts: GroupByRow[] = [];
  try {
    [batches, counts] = await Promise.all([
      prisma.importBatch.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { _count: { select: { rejections: true } } },
      }),
      prisma.copropriete.groupBy({
        by: ["department", "classificationStatus"],
        where: { isDemo: false, department: { in: TARGET_DEPARTMENTS } },
        _count: { _all: true },
      }),
    ]);
  } catch {
    // DB unavailable — serve empty lists
  }

  const statusColor: Record<string, string> = {
    done: "var(--success)",
    running: "var(--warning)",
    failed: "var(--danger)",
    pending: "var(--muted)",
  };

  const sourceLabel: Record<string, string> = {
    rnic: "RNIC",
    dpe_ademe: "DPE ADEME",
    bdnb: "BDNB",
    sirene: "SIRENE",
    manual: "Manuel",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Imports & qualité des données</h1>
          <p>Sources publiques : RNIC, DPE ADEME, BDNB, SIRENE/Annuaire entreprises</p>
        </div>
      </div>

      {/* Quick import actions */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="section-head">
          <h2>Lancer un import</h2>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TARGET_DEPARTMENTS.map((dept) => (
            <div key={dept} style={{ display: "flex", gap: 8 }}>
              <ImportButton source="rnic" department={dept} label={`RNIC Dept ${dept}`} />
              <ImportButton source="dpe_ademe" department={dept} label={`DPE Dept ${dept}`} />
            </div>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Les imports sont idempotents : relancer ne duplique pas les données existantes.
          Une erreur laisse une liste vide avec message explicite — jamais de données fictives.
        </p>
      </div>

      {/* Counts by department and classification */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="section-head">
          <h2>Répartition des copropriétés</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Département</th>
              <th>Confirmées EFG</th>
              <th>Probables EFG</th>
              <th>À qualifier</th>
              <th>Non cible (A-D)</th>
            </tr>
          </thead>
          <tbody>
            {TARGET_DEPARTMENTS.map((dept) => {
              const deptCounts = counts.filter((c) => c.department === dept);
              const get = (status: string) =>
                deptCounts.find((c) => c.classificationStatus === status)?._count._all ?? 0;
              return (
                <tr key={dept}>
                  <td><strong>{dept}</strong></td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>{get("confirmed")}</td>
                  <td style={{ color: "var(--warning)" }}>{get("probable")}</td>
                  <td style={{ color: "var(--muted)" }}>{get("unknown")}</td>
                  <td style={{ color: "var(--muted)" }}>{get("non_target")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Import history */}
      <div className="panel">
        <div className="section-head">
          <h2>Historique des imports</h2>
        </div>
        {batches.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Aucun import lancé. Cliquez sur un bouton ci-dessus.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Département</th>
                <th>Statut</th>
                <th>Importés</th>
                <th>Mis à jour</th>
                <th>Rejetés</th>
                <th>Date</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const duration =
                  b.startedAt && b.completedAt
                    ? Math.round((b.completedAt.getTime() - b.startedAt.getTime()) / 1000)
                    : null;
                return (
                  <tr key={b.id}>
                    <td><strong>{sourceLabel[b.source] ?? b.source}</strong></td>
                    <td>{b.department ?? "—"}</td>
                    <td>
                      <span style={{ fontSize: 13, color: statusColor[b.status] ?? "var(--muted)" }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--success)" }}>{b.recordsImported}</td>
                    <td>{b.recordsUpdated}</td>
                    <td style={{ color: b.recordsRejected > 0 ? "var(--danger)" : "inherit" }}>
                      {b.recordsRejected}
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(b.createdAt).toLocaleString("fr-FR")}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>
                      {duration != null ? `${duration}s` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ImportButton({ source, department, label }: { source: string; department: string; label: string }) {
  const endpoint = source === "rnic" ? "/api/coproscan/imports/rnic" : "/api/coproscan/imports/dpe";

  return (
    <form
      action={async () => {
        "use server";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${endpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ department }),
          }
        );
        if (!res.ok) {
          console.error(`Import failed: ${await res.text()}`);
        }
      }}
    >
      <button type="submit" className="secondary-button" style={{ fontSize: 12 }}>
        {label}
      </button>
    </form>
  );
}
