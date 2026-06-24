import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { getCrmProspects, getSheetDashboardMetrics } from "@/lib/sheet-prospects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const prospects = await getCrmProspects();
  const metrics = getSheetDashboardMetrics(prospects);
  const latestProspects = prospects.slice(0, 8);
  const clubTravauxCount = prospects.filter((prospect) => prospect.source === "ClubTravaux").length;
  const heatPumpCount = prospects.filter((prospect) => prospect.businessLine === "Pompe a chaleur").length;
  const primeAdaptCount = prospects.filter((prospect) => prospect.businessLine === "Prime Adapt").length;

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue operationnelle basee sur Google Sheets et ClubTravaux.</p>
        </div>
        <a className="button" href="/prospects/new">Creer un prospect</a>
      </div>

      <section className="grid cols-4">
        <MetricCard label="Pompes a chaleur" value={heatPumpCount} hint="Google Sheets + ClubTravaux" />
        <MetricCard label="Prime Adapt" value={primeAdaptCount} hint="Salles de bain PMR" />
        <MetricCard label="A contacter" value={metrics.toContact} hint="Relance telephone/e-mail" />
        <MetricCard label="ClubTravaux" value={clubTravauxCount} hint="Export du 24/06/2026" />
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
          <h2>Toutes les donnees viennent du Google Sheet</h2>
          <a className="secondary-button" href="/admin/connectors">Synchroniser</a>
        </div>
        <p className="muted">
          Les anciennes lignes pompe a chaleur avant Moktar Mazard sont ignorees. Les leads Prime Adapt du second onglet Google Sheet sont ajoutes dans une activite separee.
          Les leads ClubTravaux du fichier exporte sont ajoutes. Les prochaines etapes pour un usage quotidien sont
          la sauvegarde PostgreSQL des statuts, des relances et des rendez-vous.
        </p>
      </section>
    </AppShell>
  );
}
