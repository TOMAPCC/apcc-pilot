import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { CoproprieteRow } from "@/lib/coproscan/db-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AQualifierPage() {
  const [unknownCount, totalImported] = await Promise.all([
    prisma.copropriete.count({
      where: {
        isDemo: false,
        department: { in: TARGET_DEPARTMENTS },
        classificationStatus: "unknown",
      },
    }),
    prisma.copropriete.count({
      where: { isDemo: false, department: { in: TARGET_DEPARTMENTS } },
    }),
  ]);

  const items = await prisma.copropriete.findMany({
    where: {
      isDemo: false,
      department: { in: TARGET_DEPARTMENTS },
      classificationStatus: "unknown",
    },
    include: {
      syndic: { select: { id: true, name: true } },
      _count: { select: { dpeProofs: true, energyProofs: true } },
    },
    orderBy: { lotsResidential: "desc" },
    take: 100,
  }) as CoproprieteRow[];

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Copropriétés à qualifier</h1>
          <p>
            Aucune preuve énergétique suffisante — {unknownCount} sur {totalImported} importées
          </p>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <span>À qualifier</span>
          <strong>{unknownCount}</strong>
        </div>
        <div className="card metric">
          <span>Total importées</span>
          <strong>{totalImported}</strong>
        </div>
        <div className="card metric">
          <span>Taux qualification</span>
          <strong>
            {totalImported > 0 ? Math.round(((totalImported - unknownCount) / totalImported) * 100) : 0} %
          </strong>
        </div>
      </div>

      <div className="panel" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 16 }}>
        <strong>Comment qualifier ?</strong>
        <ul style={{ margin: "8px 0 0", fontSize: 13, paddingLeft: 18 }}>
          <li>Lancez un import DPE ADEME pour trouver des DPE collectifs correspondants.</li>
          <li>Rapprochez manuellement un DPE de bâtiment connu.</li>
          <li>Consultez la BDNB pour des données bâtiment complémentaires.</li>
        </ul>
      </div>

      {items.length > 0 && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Copropriété</th>
                <th>Ville</th>
                <th>Lots</th>
                <th>Syndic</th>
                <th>DPE</th>
                <th>Autres preuves</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{item.address}</div>
                  </td>
                  <td>{item.city}</td>
                  <td>{item.lotsResidential ?? item.lotsCount ?? "—"}</td>
                  <td>{item.syndic?.name ?? <span className="muted">Non rattaché</span>}</td>
                  <td>
                    <span style={{ color: item._count.dpeProofs > 0 ? "var(--success)" : "var(--muted)", fontSize: 12 }}>
                      {item._count.dpeProofs} preuve{item._count.dpeProofs !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {item._count.energyProofs}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unknownCount > 100 && (
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              Affichage limité à 100 copropriétés. Utilisez les imports pour qualifier l&apos;ensemble.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
