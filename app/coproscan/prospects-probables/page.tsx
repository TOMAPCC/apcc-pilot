import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { CoproprieteRow } from "@/lib/coproscan/db-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProspectsProbablesPage() {
  let items: CoproprieteRow[] = [];
  try {
    items = await prisma.copropriete.findMany({
      where: {
        isDemo: false,
        department: { in: TARGET_DEPARTMENTS },
        classificationStatus: "probable",
        energyClass: { in: ["E", "F", "G"] },
      },
      include: {
        syndic: { select: { id: true, name: true } },
        _count: { select: { dpeProofs: true } },
      },
      orderBy: [{ classificationScore: "desc" }, { classificationConfidence: "desc" }],
      take: 200,
    }) as CoproprieteRow[];
  } catch {
    // DB unavailable — serve empty list
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>EFG probables</h1>
          <p>
            Copropriétés à confiance 65–79 % ou preuves partielles — non envoyables sans validation humaine
          </p>
        </div>
        <span className="muted" style={{ fontSize: 13 }}>{items.length} copropriétés</span>
      </div>

      <div
        className="panel"
        style={{ background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 16 }}
      >
        <strong>Validation requise</strong>
        <p style={{ margin: "6px 0 0", fontSize: 13 }}>
          Ces copropriétés ne peuvent pas être incluses dans des campagnes ou exports sans validation humaine.
          Vérifiez les preuves et reclassifiez manuellement en &quot;confirmé&quot; si applicable.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="panel">
          <p className="muted">Aucune copropriété EFG probable. Lancez un import DPE pour enrichir les données.</p>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Copropriété</th>
                <th>Ville</th>
                <th>DPE</th>
                <th>Confiance</th>
                <th>Preuves DPE</th>
                <th>Syndic</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{item.address}, {item.city}</div>
                  </td>
                  <td>{item.city}</td>
                  <td>
                    <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>
                      {item.energyClass}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--warning)", fontSize: 13 }}>
                      {Math.round(item.classificationConfidence * 100)} %
                    </span>
                  </td>
                  <td>{item._count.dpeProofs}</td>
                  <td>{item.syndic?.name ?? <span className="muted">—</span>}</td>
                  <td>
                    <span className="badge" style={{ fontSize: 11 }}>À valider</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
