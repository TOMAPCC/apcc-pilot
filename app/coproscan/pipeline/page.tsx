import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
type SyndicPipelineItem = {
  id: string;
  name: string;
  city: string | null;
  _count: { coproprietes: number; contacts: number; clayJobs: number };
  interactions: { type: string; outcome: string | null; occurredAt: Date }[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PIPELINE_STAGES = [
  { key: "identified", label: "Identifié", color: "#94a3b8" },
  { key: "enriched", label: "Enrichi (Clay)", color: "#60a5fa" },
  { key: "contacted", label: "Contacté", color: "#f59e0b" },
  { key: "meeting", label: "RDV diagnostic", color: "#a78bfa" },
  { key: "study", label: "Étude en cours", color: "#34d399" },
  { key: "opportunity", label: "Opportunité confirmée", color: "#10b981" },
];

export default async function PipelinePage() {
  let syndics: SyndicPipelineItem[] = [];
  try {
    syndics = await prisma.syndic.findMany({
      where: {
        isDemo: false,
        gdprOpposedAt: null,
        coproprietes: {
          some: {
            department: { in: TARGET_DEPARTMENTS },
            classificationStatus: "confirmed",
            energyClass: { in: ["E", "F", "G"] },
            isDemo: false,
          },
        },
      },
      include: {
        _count: { select: { coproprietes: true, contacts: true, clayJobs: true } },
        interactions: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { type: true, outcome: true, occurredAt: true },
        },
      },
      take: 200,
    }) as SyndicPipelineItem[];
  } catch {
    // DB unavailable — serve empty list
  }

  // Simple stage derivation from syndic state
  function getStage(s: SyndicPipelineItem): string {
    if (s._count.contacts === 0) return "identified";
    if (s.interactions.length === 0) return "enriched";
    const lastInteraction = s.interactions[0];
    if (lastInteraction?.outcome === "meeting_scheduled") return "meeting";
    if (lastInteraction?.outcome === "study_started") return "study";
    if (lastInteraction?.outcome === "opportunity_confirmed") return "opportunity";
    return "contacted";
  }

  const byStage = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    items: syndics.filter((s) => getStage(s) === stage.key),
  }));

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Pipeline CoproScan</h1>
          <p>Suivi des syndics cibles — appels, emails, rendez-vous, études et opportunités</p>
        </div>
      </div>

      {syndics.length === 0 ? (
        <div className="panel" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <strong>Pipeline vide</strong>
          <p style={{ margin: "8px 0 0", fontSize: 13 }}>
            Importez le RNIC, qualifiez les copropriétés EFG et enrichissez les syndics via Clay pour alimenter le pipeline.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(200px, 1fr))`,
            gap: 12,
            overflowX: "auto",
          }}
        >
          {byStage.map((stage) => (
            <div key={stage.key}>
              <div
                style={{
                  borderRadius: 6,
                  padding: "8px 12px",
                  marginBottom: 8,
                  background: stage.color + "22",
                  borderLeft: `4px solid ${stage.color}`,
                }}
              >
                <strong style={{ fontSize: 13 }}>{stage.label}</strong>
                <span
                  style={{
                    float: "right",
                    background: stage.color,
                    color: "white",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {stage.items.length}
                </span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {stage.items.map((s) => (
                  <div
                    key={s.id}
                    className="card"
                    style={{ padding: "12px", fontSize: 13 }}
                  >
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    {s.city && <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.city}</div>}
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                      {s._count.coproprietes} copros · {s._count.contacts} contacts
                    </div>
                    {s.interactions[0] && (
                      <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                        Dernier : {s.interactions[0].type} — {new Date(s.interactions[0].occurredAt).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                ))}
                {stage.items.length === 0 && (
                  <div style={{ color: "var(--muted)", fontSize: 12, padding: "8px 0" }}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
