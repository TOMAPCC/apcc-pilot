import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { SyndicRow, CoproprieteRow, ContactRow, ClayJobRow } from "@/lib/coproscan/db-types";
import { notFound } from "next/navigation";
import Link from "next/link";

type SyndicDetail = SyndicRow & {
  coproprietes: (CoproprieteRow & { _count: { dpeProofs: number; energyProofs: number; interactions: number; emailDrafts: number } })[];
  contacts: (ContactRow & { _count: { contactProofs: number; emailDrafts: number } })[];
  clayJobs: ClayJobRow[];
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SyndicDetailPage({ params }: Props) {
  const { id } = await params;

  const syndic = await prisma.syndic.findUnique({
    where: { id },
    include: {
      coproprietes: {
        where: { department: { in: TARGET_DEPARTMENTS }, isDemo: false },
        include: { _count: { select: { dpeProofs: true } } },
        orderBy: [{ classificationScore: "desc" }],
      },
      contacts: {
        orderBy: [{ relevanceScore: "desc" }],
        include: { _count: { select: { contactProofs: true, emailDrafts: true } } },
      },
      clayJobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  }) as SyndicDetail | null;

  if (!syndic) notFound();

  const efgCopros = syndic.coproprietes.filter(
    (c) =>
      ["confirmed", "probable"].includes(c.classificationStatus) &&
      ["E", "F", "G"].includes(c.energyClass ?? "")
  );

  const totalLots = efgCopros.reduce((sum, c) => sum + (c.lotsResidential ?? 0), 0);
  const depts = [...new Set(syndic.coproprietes.map((c) => c.department))].join(", ");
  const cities = [...new Set(efgCopros.map((c) => c.city))].slice(0, 5).join(", ");

  const statusColor: Record<string, string> = {
    verified: "var(--success)",
    public_professional: "var(--success)",
    probable_review: "var(--warning)",
    enrichment_required: "var(--muted)",
    invalid: "var(--danger)",
    opposed: "var(--danger)",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/coproscan/syndics" style={{ color: "var(--muted)", fontSize: 13 }}>
              ← Syndics
            </Link>
          </div>
          <h1>{syndic.name}</h1>
          <p>
            {syndic.siren && <><strong>SIREN :</strong> {syndic.siren} · </>}
            {syndic.city && <>{syndic.city} · </>}
            Depts : {depts}
          </p>
        </div>
        <div className="page-actions">
          {syndic.website && (
            <a href={syndic.website} target="_blank" rel="noopener noreferrer" className="secondary-button">
              Site web
            </a>
          )}
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>Copropriétés EFG</span>
          <strong>{efgCopros.filter((c) => c.classificationStatus === "confirmed").length}</strong>
          <small>confirmées</small>
        </div>
        <div className="card metric">
          <span>Lots résidentiels</span>
          <strong>{totalLots > 0 ? totalLots : "—"}</strong>
        </div>
        <div className="card metric">
          <span>Contacts</span>
          <strong>{syndic.contacts.length}</strong>
        </div>
        <div className="card metric">
          <span>Communes</span>
          <strong>{cities || "—"}</strong>
        </div>
      </div>

      {syndic.gdprOpposedAt && (
        <div className="panel" style={{ background: "#fff4f2", border: "1px solid #ffd1cc", marginBottom: 16 }}>
          <strong>Opposition RGPD enregistrée</strong> — {syndic.gdprOpposedAt.toLocaleDateString("fr-FR")}
          <br />
          <span style={{ fontSize: 13 }}>Ce syndic est exclu de Clay, des exports, des emails et du CRM.</span>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Contacts */}
        <div className="panel">
          <div className="section-head">
            <h2>Contacts professionnels</h2>
            <Link href={`/coproscan/clay-center` as never} className="secondary-button" style={{ fontSize: 12, padding: "4px 10px" }}>
              Enrichir via Clay
            </Link>
          </div>
          {syndic.contacts.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              Aucun contact identifié. Lancez un enrichissement Clay pour rechercher les décideurs.
            </p>
          ) : (
            syndic.contacts.map((c) => (
              <div key={c.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  {c.firstName} {c.lastName}
                </div>
                {c.role && <div style={{ fontSize: 13, color: "var(--muted)" }}>{c.role}</div>}
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: statusColor[c.contactStatus] ?? "var(--muted)" }}>
                    {c.contactStatus}
                  </span>
                  {c.emailPro && (
                    <> · <span style={{ color: c.emailVerified ? "var(--success)" : "var(--warning)" }}>{c.emailPro}{!c.emailVerified && " (non vérifié)"}</span></>
                  )}
                </div>
                {c.sourceProvider && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    Source : {c.sourceProvider}
                    {c.sourceDate && ` — ${new Date(c.sourceDate).toLocaleDateString("fr-FR")}`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Portefeuille copropriétés */}
        <div className="panel">
          <div className="section-head">
            <h2>Portefeuille EFG</h2>
          </div>
          {efgCopros.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Aucune copropriété EFG dans les départements 30/34.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Copropriété</th>
                  <th>DPE</th>
                  <th>Lots</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {efgCopros.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.city}</div>
                    </td>
                    <td>
                      <span style={{
                        background: c.energyClass === "G" ? "#ef4444" : c.energyClass === "F" ? "#f97316" : "#f59e0b",
                        color: "white",
                        borderRadius: 3,
                        padding: "1px 6px",
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {c.energyClass}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.lotsResidential ?? "—"}</td>
                    <td>
                      <span style={{ fontSize: 11, color: c.classificationStatus === "confirmed" ? "var(--success)" : "var(--warning)" }}>
                        {c.classificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Clay jobs */}
      {syndic.clayJobs.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="section-head">
            <h2>Historique Clay</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Statut</th>
                <th>Tentatives</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {syndic.clayJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontSize: 13 }}>{job.jobType}</td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      color: job.status === "done" ? "var(--success)" : job.status === "failed" ? "var(--danger)" : "var(--warning)",
                    }}>
                      {job.status}
                    </span>
                    {job.errorMessage && (
                      <div style={{ fontSize: 11, color: "var(--danger)" }}>{job.errorMessage}</div>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>{job.attempts}</td>
                  <td style={{ fontSize: 12 }}>{new Date(job.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
