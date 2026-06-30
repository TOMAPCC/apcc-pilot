import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import type { SyndicRow, ContactRow, CoproprieteRow } from "@/lib/coproscan/db-types";
import Link from "next/link";

type SyndicListItem = SyndicRow & {
  coproprietes: Pick<CoproprieteRow, "lotsResidential" | "city" | "department">[];
  contacts: Pick<ContactRow, "id" | "firstName" | "lastName" | "role">[];
  _count: { coproprietes: number; contacts: number; clayJobs: number };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SyndicsPage() {
  let syndics: SyndicListItem[] = [];
  try {
    syndics = await prisma.syndic.findMany({
      where: {
        isDemo: false,
        gdprOpposedAt: null,
        coproprietes: {
          some: {
            department: { in: TARGET_DEPARTMENTS },
            isDemo: false,
            classificationStatus: { in: ["confirmed", "probable"] },
            energyClass: { in: ["E", "F", "G"] },
          },
        },
      },
      include: {
        _count: { select: { coproprietes: true, contacts: true, clayJobs: true } },
        contacts: {
          where: { contactStatus: { in: ["verified", "public_professional"] } },
          select: { id: true, firstName: true, lastName: true, role: true },
          take: 2,
        },
        coproprietes: {
          where: {
            department: { in: TARGET_DEPARTMENTS },
            classificationStatus: "confirmed",
            energyClass: { in: ["E", "F", "G"] },
            isDemo: false,
          },
          select: { lotsResidential: true, city: true, department: true },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    }) as SyndicListItem[];
  } catch {
    // DB unavailable — serve empty list
  }

  const enrichmentColors: Record<string, string> = {
    done: "var(--success)",
    in_progress: "var(--warning)",
    failed: "var(--danger)",
    pending: "var(--muted)",
    skipped: "var(--muted)",
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Syndics</h1>
          <p>
            Syndics rattachés à des copropriétés EFG (Gard et Hérault) — {syndics.length} identifiés
          </p>
        </div>
      </div>

      {syndics.length === 0 ? (
        <div className="panel" style={{ background: "#fff8e1", border: "1px solid #f59e0b" }}>
          <strong>Aucun syndic identifié</strong>
          <p style={{ margin: "8px 0 0", fontSize: 13 }}>
            Importez d&apos;abord le RNIC puis les DPE pour qualifier les copropriétés EFG.
          </p>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Syndic</th>
                <th>SIREN</th>
                <th>Copros EFG</th>
                <th>Lots</th>
                <th>Contacts</th>
                <th>Clay</th>
                <th>Enrichissement</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {syndics.map((s) => {
                const totalLots = s.coproprietes.reduce(
                  (sum, c) => sum + (c.lotsResidential ?? 0),
                  0
                );
                const depts = [...new Set(s.coproprietes.map((c) => c.department))].join(", ");

                return (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/coproscan/syndics/${s.id}` as never} style={{ fontWeight: 600, color: "var(--apcc-blue)" }}>
                        {s.name}
                      </Link>
                      {s.city && (
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.city} · {depts}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{s.siren ?? "—"}</td>
                    <td>{s._count.coproprietes}</td>
                    <td>{totalLots > 0 ? totalLots : "—"}</td>
                    <td>
                      {s.contacts.length > 0 ? (
                        <div>
                          {s.contacts.map((c) => (
                            <div key={c.id} style={{ fontSize: 12 }}>
                              {c.firstName} {c.lastName}
                              {c.role && <span style={{ color: "var(--muted)" }}> · {c.role}</span>}
                            </div>
                          ))}
                          {s._count.contacts > 2 && (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                              +{s._count.contacts - 2} autres
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Aucun contact vérifié</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        {s._count.clayJobs} job{s._count.clayJobs !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: enrichmentColors[s.enrichmentStatus] ?? "var(--muted)",
                        }}
                      >
                        {s.enrichmentStatus}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/coproscan/syndics/${s.id}` as never}
                        className="secondary-button"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
