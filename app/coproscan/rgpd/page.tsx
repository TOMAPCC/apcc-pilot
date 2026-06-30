import { prisma } from "@/lib/db";
import type { OppositionRow, GdprLogRow } from "@/lib/coproscan/db-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RgpdPage() {
  const [oppositions, recentLogs, contactsOpposed, syndicsOpposed]: [OppositionRow[], GdprLogRow[], number, number] = await Promise.all([
    prisma.oppositionList.findMany({
      orderBy: { opposedAt: "desc" },
      take: 50,
    }),
    prisma.gdprLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.contact.count({ where: { gdprOpposedAt: { not: null } } }),
    prisma.syndic.count({ where: { gdprOpposedAt: { not: null } } }),
  ]);

  const retentionMonths = parseInt(process.env.GDPR_RETENTION_MONTHS ?? "24", 10);

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>RGPD & Conformité</h1>
          <p>Droit d&apos;opposition, exports, suppressions et journal des traitements</p>
        </div>
      </div>

      {/* Info RGPD */}
      <div className="panel" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 20 }}>
        <strong>Principes appliqués</strong>
        <ul style={{ margin: "8px 0 0", fontSize: 13, paddingLeft: 18 }}>
          <li>Données professionnelles uniquement (B2B) — aucun résident ni contact privé.</li>
          <li>Source, date et finalité documentées pour chaque donnée.</li>
          <li>Opposition simple et gratuite : répondre STOP ou contacter {process.env.APCC_EMAIL ?? "apcc.mg@gmail.com"}.</li>
          <li>Durée de conservation configurée : <strong>{retentionMonths} mois</strong> après dernier contact.</li>
          <li>Un contact opposé est exclu de Clay, des exports, des emails et du CRM.</li>
          <li>Prospection téléphonique : vérification Bloctel obligatoire avant activation.</li>
          <li>Règles CEE versionnées avec sources officielles.</li>
          <li>Journal des exports et messages conservé.</li>
        </ul>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>Oppositions contacts</span>
          <strong style={{ color: contactsOpposed > 0 ? "var(--danger)" : "var(--success)" }}>
            {contactsOpposed}
          </strong>
        </div>
        <div className="card metric">
          <span>Oppositions syndics</span>
          <strong style={{ color: syndicsOpposed > 0 ? "var(--danger)" : "var(--success)" }}>
            {syndicsOpposed}
          </strong>
        </div>
        <div className="card metric">
          <span>Rétention configurée</span>
          <strong>{retentionMonths} mois</strong>
        </div>
      </div>

      {/* Actions RGPD */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="section-head">
          <h2>Enregistrer une opposition</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
          Utilisez l&apos;API <code>POST /api/coproscan/rgpd</code> avec <code>action: &quot;oppose&quot;</code>, <code>entityType</code> et <code>entityId</code>.
          L&apos;opposition est immédiatement bloquante pour Clay, les exports et les emails.
        </p>
        <div style={{ fontSize: 13, background: "#f8fafc", borderRadius: 6, padding: 12, fontFamily: "monospace" }}>
          {`POST /api/coproscan/rgpd
{
  "action": "oppose",
  "entityType": "syndic",     // ou "contact"
  "entityId": "...",
  "reason": "Demande par email",
  "source": "email_reply"
}`}
        </div>
      </div>

      {/* Liste des oppositions */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="section-head">
          <h2>Liste repoussoir ({oppositions.length})</h2>
        </div>
        {oppositions.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Aucune opposition enregistrée.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Email</th>
                <th>SIREN</th>
                <th>Raison</th>
                <th>Source</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {oppositions.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontSize: 13 }}>{o.entityType}</td>
                  <td style={{ fontSize: 12 }}>{o.email ?? "—"}</td>
                  <td style={{ fontSize: 12 }}>{o.siren ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{o.reason ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{o.source}</td>
                  <td style={{ fontSize: 12 }}>{new Date(o.opposedAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Journal RGPD */}
      <div className="panel">
        <div className="section-head">
          <h2>Journal des traitements (50 derniers)</h2>
        </div>
        {recentLogs.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Aucune action RGPD enregistrée.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Entité</th>
                <th>Action</th>
                <th>Acteur</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: 13 }}>{l.entityType}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{l.entityId.substring(0, 12)}…</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        fontSize: 11,
                        color: l.action === "opposition" || l.action === "anonymize" ? "var(--danger)" : "var(--muted)",
                      }}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{l.actor ?? "système"}</td>
                  <td style={{ fontSize: 12 }}>{new Date(l.createdAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
