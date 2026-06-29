import { prisma } from "@/lib/db";
import type { EmailDraftRow } from "@/lib/coproscan/db-types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmailStudioPage() {
  const [drafts, readyContacts]: [EmailDraftRow[], number] = await Promise.all([
    prisma.emailDraft.findMany({
      where: { isDemo: false },
      include: {
        copropriete: { select: { name: true, city: true, energyClass: true } },
        contact: { select: { firstName: true, lastName: true, emailPro: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.contact.count({
      where: {
        isDemo: false,
        gdprOpposedAt: null,
        contactStatus: { in: ["verified", "public_professional"] },
        emailPro: { not: null },
      },
    }),
  ]);

  const apcc = {
    salesName: process.env.APCC_SALES_NAME ?? "",
    bookingUrl: process.env.BOOKING_URL ?? "",
    deliveryMode: process.env.EMAIL_DELIVERY_MODE ?? "draft_only",
  };

  const statusColor: Record<string, string> = {
    generated: "var(--muted)",
    reviewed: "var(--warning)",
    approved: "var(--apcc-blue)",
    draft_created: "var(--success)",
    sent: "var(--success)",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Email Studio APCC</h1>
          <p>
            Génération de brouillons personnalisés — mode :{" "}
            <strong>{apcc.deliveryMode === "draft_only" ? "Brouillon uniquement" : apcc.deliveryMode}</strong>
          </p>
        </div>
      </div>

      {/* Config warnings */}
      {(!apcc.salesName || !apcc.bookingUrl) && (
        <div className="panel" style={{ background: "#fff8e1", border: "1px solid #fde68a", marginBottom: 16 }}>
          <strong>Configuration incomplète</strong>
          <ul style={{ margin: "8px 0 0", fontSize: 13, paddingLeft: 18 }}>
            {!apcc.salesName && <li><code>APCC_SALES_NAME</code> non défini — la signature sera vide.</li>}
            {!apcc.bookingUrl && <li><code>BOOKING_URL</code> non défini — deux créneaux proposés dans l&apos;email.</li>}
          </ul>
        </div>
      )}

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>Brouillons générés</span>
          <strong>{drafts.length}</strong>
        </div>
        <div className="card metric">
          <span>Contacts approuvés</span>
          <strong>{readyContacts}</strong>
          <small>avec email vérifié</small>
        </div>
        <div className="card metric">
          <span>Mode envoi</span>
          <strong style={{ fontSize: 16 }}>{apcc.deliveryMode}</strong>
        </div>
      </div>

      {readyContacts > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="section-head">
            <h2>Générer un brouillon</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
            Sélectionnez une copropriété EFG confirmée et un contact approuvé pour générer un email personnalisé.
            Toutes les affirmations seront sourcées.
          </p>
          <GenerateDraftForm />
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="panel">
          <p className="muted" style={{ fontSize: 13 }}>
            Aucun brouillon généré. Vérifiez qu&apos;il existe des contacts approuvés (statut verified ou public_professional) et des copropriétés EFG confirmées.
          </p>
        </div>
      ) : (
        <div className="panel">
          <div className="section-head">
            <h2>Brouillons ({drafts.length})</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Copropriété</th>
                <th>Contact</th>
                <th>Sujet</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.copropriete ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.copropriete.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{d.copropriete.city} · DPE {d.copropriete.energyClass}</div>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {d.contact ? (
                      <div style={{ fontSize: 13 }}>{d.contact.firstName} {d.contact.lastName}</div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.subject}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ fontSize: 11, color: statusColor[d.draftStatus] ?? "var(--muted)" }}>
                      {d.draftStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel" style={{ marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
        <strong>Mentions légales automatiques dans chaque email :</strong>
        <ul style={{ marginTop: 8 }}>
          <li>Information B2B professionnelle.</li>
          <li>Lien opposition simple et gratuit.</li>
          <li>Aucune garantie CEE, éligibilité ou reste à charge — confirmation uniquement après analyse technique.</li>
          <li>Aucun envoi automatique — validation humaine requise pour passer en statut &quot;sent&quot;.</li>
        </ul>
      </div>
    </div>
  );
}

function GenerateDraftForm() {
  return (
    <form style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <input
        name="coproprieteId"
        placeholder="ID copropriété confirmée EFG"
        style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "8px 12px", width: 260 }}
        required
      />
      <input
        name="contactId"
        placeholder="ID contact approuvé"
        style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "8px 12px", width: 260 }}
        required
      />
      <Link
        href="/coproscan/contact-review"
        className="secondary-button"
        style={{ alignSelf: "center" }}
      >
        Trouver un contact
      </Link>
      <p style={{ width: "100%", margin: 0, fontSize: 12, color: "var(--muted)" }}>
        Utilisez l&apos;API <code>POST /api/coproscan/emails/generate</code> avec <code>coproprieteId</code> et <code>contactId</code>.
      </p>
    </form>
  );
}
