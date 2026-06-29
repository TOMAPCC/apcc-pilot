import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getPersistentClients, isDatabaseConfigured } from "@/lib/prospect-repository";
import { getCrmProspects } from "@/lib/sheet-prospects";
import type { ClientSummary } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Clients</h1>
          <p>Dossiers valides, documents, projets et suivi apres signature.</p>
        </div>
        <Link className="secondary-button" href="/prospects?status=Dossier+signe">Voir prospects signes</Link>
      </div>

      <section className="grid cols-3">
        <div className="panel">
          <div className="section-head">
            <h2>Dossiers clients</h2>
            <span className="badge blue">{clients.length}</span>
          </div>
          <p className="muted">Un prospect apparait ici uniquement apres validation en client.</p>
        </div>
        <div className="panel">
          <div className="section-head">
            <h2>Documents classes</h2>
            <span className="badge">{clients.reduce((sum, client) => sum + client.documentsCount, 0)}</span>
          </div>
          <p className="muted">Les fichiers sont rattaches au dossier client, pas au lead brut.</p>
        </div>
        <div className="panel">
          <div className="section-head">
            <h2>Suivi</h2>
            <span className="badge hot">A structurer</span>
          </div>
          <p className="muted">Prochaine etape: devis, chantier, facturation et SAV depuis cette base client.</p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Portefeuille client</h2>
          <span className="badge">{clients.length} actif(s)</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Projet</th>
              <th>Adresse</th>
              <th>Documents</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.firstName} {client.lastName}</strong>
                  <div className="muted">{client.number}</div>
                </td>
                <td>{client.projectTypes.join(", ") || "Projet a preciser"}</td>
                <td>{client.address || `${client.postalCode} ${client.city}`}</td>
                <td>{client.documentsCount}</td>
                <td>
                  {client.prospectId ? <Link className="secondary-button" href={`/prospects/${client.prospectId}`}>Ouvrir</Link> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clients.length ? <p className="muted">Aucun client valide pour le moment. Passe une fiche prospect en client pour creer le premier dossier.</p> : null}
      </section>
    </AppShell>
  );
}

async function getClients(): Promise<ClientSummary[]> {
  if (isDatabaseConfigured()) {
    return getPersistentClients();
  }

  const prospects = await getCrmProspects();
  return prospects
    .filter((prospect) => prospect.status === "Dossier signe")
    .map((prospect) => ({
      id: `client-${prospect.id}`,
      number: prospect.clientNumber ?? `APCC-${prospect.id.slice(-6).toUpperCase()}`,
      prospectId: prospect.id,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      address: prospect.worksiteAddress || prospect.address,
      postalCode: prospect.postalCode,
      city: prospect.city,
      projectTypes: prospect.projectTypes,
      documentsCount: 0,
      createdAt: prospect.updatedAt
    }));
}
