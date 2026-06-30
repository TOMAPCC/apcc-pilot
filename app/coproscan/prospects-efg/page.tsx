import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { CoproprieteRow } from "@/lib/coproscan/db-types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProspectsEfgPage() {
  const isProduction = process.env.APP_ENV === "production" && process.env.DEMO_MODE !== "true";

  let items: CoproprieteRow[] = [];
  try {
    items = await prisma.copropriete.findMany({
      where: {
        isDemo: false,
        department: { in: TARGET_DEPARTMENTS },
        classificationStatus: "confirmed",
        energyClass: { in: ["E", "F", "G"] },
      },
      include: {
        syndic: { select: { id: true, name: true, enrichmentStatus: true } },
        _count: { select: { dpeProofs: true, emailDrafts: true } },
      },
      orderBy: [{ classificationScore: "desc" }, { lotsResidential: "desc" }],
      take: 200,
    }) as CoproprieteRow[];
  } catch {
    // DB unavailable — serve empty list
  }

  const efgColors: Record<string, string> = {
    E: "#f59e0b",
    F: "#f97316",
    G: "#ef4444",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Prospects EFG confirmés</h1>
          <p>Copropriétés classées E, F ou G — preuve bâtiment/collective, confiance ≥ 80 %</p>
        </div>
        <div className="page-actions">
          <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>
            {items.length} copropriété{items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {!isProduction && items.length === 0 && (
        <div className="panel" style={{ background: "#fff8e1", border: "1px solid #f59e0b" }}>
          <strong>Aucune donnée — importez le RNIC</strong>
          <p style={{ margin: "8px 0 0" }}>
            Allez dans <Link href="/coproscan/imports">Imports & qualité</Link> pour lancer l&apos;import RNIC des départements 30 et 34.
          </p>
        </div>
      )}

      {isProduction && items.length === 0 && (
        <div className="panel" style={{ background: "#fff4f2", border: "1px solid #ffd1cc" }}>
          <strong>Aucune copropriété EFG confirmée</strong>
          <p style={{ margin: "8px 0 0" }}>
            L&apos;import RNIC doit être lancé pour alimenter cette liste.
            Aucune donnée fictive ne sera affichée.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Copropriété</th>
                <th>Ville</th>
                <th>Dept</th>
                <th>DPE</th>
                <th>Score</th>
                <th>Confiance</th>
                <th>Lots</th>
                <th>Syndic</th>
                <th>DPE prouvés</th>
                <th>Brouillons</th>
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
                  <td>{item.department}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        background: efgColors[item.energyClass ?? ""] ?? "#e5e7eb",
                        color: "white",
                        fontWeight: 700,
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 13,
                      }}
                    >
                      {item.energyClass ?? "?"}
                    </span>
                  </td>
                  <td>{item.classificationScore}</td>
                  <td>
                    <span style={{ fontSize: 12, color: item.classificationConfidence >= 0.8 ? "var(--success)" : "var(--warning)" }}>
                      {Math.round(item.classificationConfidence * 100)} %
                    </span>
                  </td>
                  <td>{item.lotsResidential ?? item.lotsCount ?? "—"}</td>
                  <td>
                    {item.syndic ? (
                      <Link href={`/coproscan/syndics/${item.syndic.id}` as never} style={{ color: "var(--apcc-blue)" }}>
                        {item.syndic.name}
                      </Link>
                    ) : (
                      <span className="muted">Non rattaché</span>
                    )}
                  </td>
                  <td>{item._count.dpeProofs}</td>
                  <td>{item._count.emailDrafts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
