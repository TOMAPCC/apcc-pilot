import { prisma } from "@/lib/db";
import type { ContactRow } from "@/lib/coproscan/db-types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactReviewPage() {
  const [contacts, toReview, verified]: [ContactRow[], number, number] = await Promise.all([
    prisma.contact.findMany({
      where: { isDemo: false, gdprOpposedAt: null },
      include: {
        syndic: { select: { name: true, id: true } },
        _count: { select: { contactProofs: true, emailDrafts: true } },
      },
      orderBy: [{ relevanceScore: "desc" }, { updatedAt: "desc" }],
      take: 200,
    }),
    prisma.contact.count({
      where: { isDemo: false, gdprOpposedAt: null, contactStatus: "probable_review" },
    }),
    prisma.contact.count({
      where: { isDemo: false, gdprOpposedAt: null, contactStatus: { in: ["verified", "public_professional"] } },
    }),
  ]);

  const statusLabel: Record<string, string> = {
    verified: "Vérifié",
    public_professional: "Pro public",
    probable_review: "À valider",
    enrichment_required: "À enrichir",
    invalid: "Invalide",
    opposed: "Opposition",
  };

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
          <h1>Contact Review</h1>
          <p>
            Seuls les contacts <strong>verified</strong> et <strong>public_professional</strong> (après validation) peuvent générer un brouillon d&apos;envoi
          </p>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>Contacts vérifiés</span>
          <strong>{verified}</strong>
        </div>
        <div className="card metric">
          <span>À valider</span>
          <strong style={{ color: "var(--warning)" }}>{toReview}</strong>
        </div>
        <div className="card metric">
          <span>Total contacts</span>
          <strong>{contacts.length}</strong>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="panel">
          <p className="muted">Aucun contact. Lancez un enrichissement Clay sur les syndics ciblés.</p>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Syndic</th>
                <th>Rôle</th>
                <th>Email pro</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Source</th>
                <th>Preuves</th>
                <th>Brouillons</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {c.firstName} {c.lastName}
                    </div>
                  </td>
                  <td>
                    <Link href={`/coproscan/syndics/${c.syndic.id}` as never} style={{ fontSize: 13, color: "var(--apcc-blue)" }}>
                      {c.syndic.name}
                    </Link>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.role ?? "—"}</td>
                  <td>
                    {c.emailPro ? (
                      <span style={{ fontSize: 13, color: c.emailVerified ? "var(--success)" : "var(--warning)" }}>
                        {c.emailPro}
                        {!c.emailVerified && <span style={{ fontSize: 10 }}> (non vérifié)</span>}
                      </span>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.phonePro ?? "—"}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        fontSize: 11,
                        color: statusColor[c.contactStatus] ?? "var(--muted)",
                        background: "transparent",
                        border: `1px solid ${statusColor[c.contactStatus] ?? "var(--line)"}`,
                      }}
                    >
                      {statusLabel[c.contactStatus] ?? c.contactStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{Math.round(c.relevanceScore * 100)} %</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>
                    {c.sourceProvider ?? "—"}
                    {c.sourceDate && <><br />{new Date(c.sourceDate).toLocaleDateString("fr-FR")}</>}
                  </td>
                  <td style={{ fontSize: 12 }}>{c._count.contactProofs}</td>
                  <td style={{ fontSize: 12 }}>{c._count.emailDrafts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
