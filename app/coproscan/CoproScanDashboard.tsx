"use client";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

const BLUE = "#263A7A";
const RED = "#C82333";
const BORDER = "#e5e5e3";
const SURFACE1 = "#f8f8f7";
const MUTED = "#9c9a92";

// ── Serializable types (dates = ISO strings) ──────────────────────────────────

export type ConfirmedItem = {
  id: string; name: string; address: string; city: string; department: string;
  energyClass: string | null; classificationConfidence: number;
  lotsResidential: number | null; lotsCount: number | null;
  syndic: { id: string; name: string } | null;
  dpeProofsCount: number; emailDraftsCount: number;
};
export type ProbableItem = {
  id: string; name: string; address: string; city: string;
  energyClass: string | null; classificationConfidence: number;
  dpeProofsCount: number; syndic: { id: string; name: string } | null;
};
export type UnknownItem = {
  id: string; name: string; address: string; city: string;
  lotsResidential: number | null; lotsCount: number | null;
  syndic: { id: string; name: string } | null;
  dpeProofsCount: number; energyProofsCount: number;
};
export type SyndicItem = {
  id: string; name: string; city: string | null; siren: string | null;
  copropCount: number; contactsCount: number; clayJobsCount: number;
};
export type ClayJobItem = {
  id: string; jobType: string; status: string;
  syndicName: string; createdAt: string;
};
export type ContactItem = {
  id: string; firstName: string | null; lastName: string; role: string | null;
  emailPro: string | null; contactStatus: string; emailVerified: boolean;
  syndicName: string;
};
export type DraftItem = {
  id: string; subject: string; draftStatus: string;
  contactEmail: string | null; copropName: string | null; createdAt: string;
};
export type PipelineItem = {
  id: string; name: string; city: string | null;
  copropCount: number; contactsCount: number;
  lastInteractionType: string | null;
  lastInteractionDate: string | null;
  lastInteractionOutcome: string | null;
};
export type BatchItem = {
  id: string; source: string; department: string | null; status: string;
  recordsImported: number; recordsUpdated: number; recordsRejected: number;
  createdAt: string; startedAt: string | null; completedAt: string | null;
};
export type OppositionItem = {
  id: string; entityType: string; email: string | null;
  siren: string | null; reason: string | null; source: string; opposedAt: string;
};
export type GdprLogItem = {
  id: string; entityType: string; entityId: string;
  action: string; actor: string | null; createdAt: string;
};

export type DashboardData = {
  isProduction: boolean;
  departments: string[];
  metrics: {
    confirmed: number; probable: number; unknown: number;
    syndics: number; contacts: number; drafts: number;
    contactsOpposed: number; syndicsOpposed: number;
  };
  classCounts: { G: number; F: number; E: number };
  confirmed: ConfirmedItem[];
  probable: ProbableItem[];
  unknown: UnknownItem[];
  syndics: SyndicItem[];
  clayJobs: ClayJobItem[];
  contacts: ContactItem[];
  drafts: DraftItem[];
  pipeline: PipelineItem[];
  batches: BatchItem[];
  oppositions: OppositionItem[];
  gdprLogs: GdprLogItem[];
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const EFG_BG: Record<string, string> = { E: "#fef3c7", F: "#ffedd5", G: "#fee2e2" };
const EFG_TXT: Record<string, string> = { E: "#92400e", F: "#9a3412", G: "#991b1b" };

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  );
}

function EfgBadge({ cls }: { cls: string | null }) {
  if (!cls) return <Badge label="?" bg={SURFACE1} color={MUTED} />;
  return <Badge label={cls} bg={EFG_BG[cls] ?? SURFACE1} color={EFG_TXT[cls] ?? MUTED} />;
}

const CLAY_COLOR: Record<string, string> = {
  pending: MUTED, sent: "#d97706", processing: "#d97706", done: "#16a34a", failed: RED,
};
const BATCH_COLOR: Record<string, string> = {
  done: "#16a34a", running: "#d97706", failed: RED, pending: MUTED,
};
const CONTACT_COLOR: Record<string, string> = {
  verified: "#16a34a", public_professional: "#16a34a", enrichment_required: MUTED, invalid: RED,
};

const SOURCE_LABEL: Record<string, string> = {
  rnic: "RNIC", dpe_ademe: "DPE ADEME", bdnb: "BDNB", sirene: "SIRENE", manual: "Manuel",
};

function frDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}
function frDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR");
}
function duration(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return `${s}s`;
}

// ── Shared table shell ────────────────────────────────────────────────────────

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: "8px 14px", background: SURFACE1, borderBottom: `1px solid ${BORDER}`, fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", ...style }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, fontSize: 12, verticalAlign: "middle", ...style }}>{children}</td>;
}

// ── Metric cards ──────────────────────────────────────────────────────────────

function MetricGrid({ items }: { items: { label: string; value: number | string; color?: string; sub?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, marginBottom: 16 }}>
      {items.map((m) => (
        <div key={m.label} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: m.color ?? "#1a1a18" }}>{m.value}</div>
          {m.sub && <div style={{ fontSize: 10, color: "#5c5c5a", marginTop: 2 }}>{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function STitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#5c5c5a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{children}</div>;
}

// ── Alert banner ──────────────────────────────────────────────────────────────

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#713f12", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Two-col layout ────────────────────────────────────────────────────────────

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Card({ children, title, icon }: { children: React.ReactNode; title: string; icon?: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#1a1a18", display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span>{icon}</span>}{title}
      </div>
      {children}
    </div>
  );
}

// ── VIEW MORE link ────────────────────────────────────────────────────────────

function ViewMore({ href, label = "Voir tout →" }: { href: string; label?: string }) {
  return (
    <div style={{ textAlign: "right", marginTop: 8 }}>
      <Link href={href as Route<string>} style={{ fontSize: 12, color: BLUE }}>{label}</Link>
    </div>
  );
}

// ── PIPELINE helpers ──────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "identified", label: "Identifié", color: "#94a3b8" },
  { key: "enriched", label: "Enrichi", color: "#60a5fa" },
  { key: "contacted", label: "Contacté", color: "#f59e0b" },
  { key: "meeting", label: "RDV diag.", color: "#a78bfa" },
  { key: "study", label: "Étude", color: "#34d399" },
  { key: "opportunity", label: "Opportunité", color: "#10b981" },
];

function getPipelineStage(s: PipelineItem): string {
  if (s.contactsCount === 0) return "identified";
  if (!s.lastInteractionType) return "enriched";
  if (s.lastInteractionOutcome === "meeting_scheduled") return "meeting";
  if (s.lastInteractionOutcome === "study_started") return "study";
  if (s.lastInteractionOutcome === "opportunity_confirmed") return "opportunity";
  return "contacted";
}

// ── TAB PANELS ────────────────────────────────────────────────────────────────

function TabConfirmed({ d }: { d: DashboardData }) {
  const total = d.metrics.confirmed;
  return (
    <div>
      <MetricGrid items={[
        { label: "EFG confirmés", value: d.metrics.confirmed, color: RED, sub: "confiance ≥ 80 %" },
        { label: "EFG probables", value: d.metrics.probable, color: "#d97706", sub: "validation requise" },
        { label: "Syndics ciblés", value: d.metrics.syndics, color: BLUE, sub: d.departments.join(" + ") },
        { label: "Contacts enrichis", value: d.metrics.contacts, color: "#16a34a", sub: "via Clay" },
      ]} />
      <STitle>Copropriétés EFG confirmées — {d.departments.join(", ")}</STitle>
      {d.confirmed.length === 0 ? (
        <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>
          Aucune donnée — lancez un import RNIC dans l&apos;onglet Imports.
        </div>
      ) : (
        <TableWrap>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <Th>Copropriété</Th><Th>Classe</Th><Th>Confiance</Th>
              <Th>Lots</Th><Th>Syndic</Th><Th>DPE</Th><Th>Brouillons</Th>
            </tr></thead>
            <tbody>
              {d.confirmed.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{item.city} · {item.department}</div>
                  </Td>
                  <Td><EfgBadge cls={item.energyClass} /></Td>
                  <Td style={{ color: "#16a34a", fontWeight: 600 }}>
                    {Math.round(item.classificationConfidence * 100)} %
                  </Td>
                  <Td>{item.lotsResidential ?? item.lotsCount ?? "—"}</Td>
                  <Td>
                    {item.syndic
                      ? <Link href={`/coproscan/syndics/${item.syndic.id}` as Route<string>} style={{ color: BLUE }}>{item.syndic.name}</Link>
                      : <span style={{ color: MUTED }}>—</span>}
                  </Td>
                  <Td style={{ color: item.dpeProofsCount > 0 ? "#16a34a" : MUTED }}>{item.dpeProofsCount}</Td>
                  <Td style={{ color: item.emailDraftsCount > 0 ? "#d97706" : MUTED }}>{item.emailDraftsCount}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      {total > d.confirmed.length && (
        <ViewMore href="/coproscan/prospects-efg" label={`Voir les ${total} copropriétés EFG →`} />
      )}
    </div>
  );
}

function TabProbable({ d }: { d: DashboardData }) {
  return (
    <div>
      <Alert>EFG probables (confiance 65–79 %). Aucune campagne automatique. Validation manuelle requise avant tout envoi ou export.</Alert>
      {d.probable.length === 0 ? (
        <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>Aucune copropriété EFG probable.</div>
      ) : (
        <TableWrap>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <Th>Copropriété</Th><Th>Classe estimée</Th><Th>Confiance</Th><Th>DPE</Th><Th>Syndic</Th>
            </tr></thead>
            <tbody>
              {d.probable.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{item.address}, {item.city}</div>
                  </Td>
                  <Td><EfgBadge cls={item.energyClass} /></Td>
                  <Td style={{ color: "#d97706", fontWeight: 600 }}>{Math.round(item.classificationConfidence * 100)} %</Td>
                  <Td style={{ color: item.dpeProofsCount > 0 ? "#16a34a" : MUTED }}>{item.dpeProofsCount}</Td>
                  <Td style={{ color: MUTED }}>{item.syndic?.name ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <div style={{ fontSize: 11, color: MUTED }}>
        Un DPE d&apos;appartement isolé ne confirme pas tout l&apos;immeuble — preuve collective requise.
      </div>
      <ViewMore href="/coproscan/prospects-probables" />
    </div>
  );
}

function TabUnknown({ d }: { d: DashboardData }) {
  const total = d.metrics.unknown;
  const rate = d.metrics.confirmed + d.metrics.probable + total > 0
    ? Math.round(((d.metrics.confirmed + d.metrics.probable) / (d.metrics.confirmed + d.metrics.probable + total)) * 100)
    : 0;
  return (
    <div>
      <MetricGrid items={[
        { label: "À qualifier", value: total, color: MUTED },
        { label: "Qualifiées (EFG)", value: d.metrics.confirmed + d.metrics.probable, color: "#16a34a" },
        { label: "Taux qualification", value: `${rate} %`, color: rate > 50 ? "#16a34a" : "#d97706" },
      ]} />
      {d.unknown.length === 0 ? (
        <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>Toutes les copropriétés importées sont qualifiées.</div>
      ) : (
        <TableWrap>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <Th>Copropriété</Th><Th>Ville</Th><Th>Lots</Th><Th>DPE</Th><Th>Autres preuves</Th><Th>Syndic</Th>
            </tr></thead>
            <tbody>
              {d.unknown.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{item.address}</div>
                  </Td>
                  <Td>{item.city}</Td>
                  <Td>{item.lotsResidential ?? item.lotsCount ?? "—"}</Td>
                  <Td style={{ color: item.dpeProofsCount > 0 ? "#16a34a" : MUTED }}>{item.dpeProofsCount}</Td>
                  <Td style={{ color: MUTED }}>{item.energyProofsCount}</Td>
                  <Td style={{ color: MUTED }}>{item.syndic?.name ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      {total > d.unknown.length && (
        <ViewMore href="/coproscan/a-qualifier" label={`Voir les ${total} copropriétés à qualifier →`} />
      )}
    </div>
  );
}

function TabSyndics({ d }: { d: DashboardData }) {
  const total = d.metrics.confirmed;
  const { G, F, E } = d.classCounts;
  const maxBar = Math.max(G, F, E, 1);
  return (
    <TwoCol>
      <Card title="Top syndics par portefeuille EFG" icon="🏢">
        {d.syndics.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 13 }}>Aucun syndic identifié.</div>
        ) : (
          d.syndics.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <Link href={`/coproscan/syndics/${s.id}` as Route<string>} style={{ fontWeight: 600, color: "#1a1a18", fontSize: 13 }}>{s.name}</Link>
                <div style={{ fontSize: 11, color: MUTED }}>{s.siren ? `SIREN ${s.siren}` : "SIREN inconnu"}{s.city ? ` · ${s.city}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: RED, fontSize: 12 }}>{s.copropCount} copros</div>
                <div style={{ fontSize: 11, color: MUTED }}>{s.contactsCount} contacts</div>
              </div>
            </div>
          ))
        )}
        <ViewMore href="/coproscan/syndics" />
      </Card>
      <Card title="Répartition EFG confirmés" icon="📊">
        {[
          { cls: "G", count: G, bg: "#fee2e2", bar: RED },
          { cls: "F", count: F, bg: "#ffedd5", bar: "#ea580c" },
          { cls: "E", count: E, bg: "#fef9c3", bar: "#ca8a04" },
        ].map(({ cls, count, bg, bar }) => (
          <div key={cls} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Classe {cls}</span>
              <span style={{ fontWeight: 700, color: EFG_TXT[cls] }}>{count}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: bg, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((count / maxBar) * 100)}%`, background: bar, borderRadius: 3 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontSize: 10, color: MUTED }}>
          A–D et classe inconnue exclus de tous exports et campagnes EFG
        </div>
      </Card>
    </TwoCol>
  );
}

function TabClay({ d }: { d: DashboardData }) {
  return (
    <TwoCol>
      <Card title="Clay Enrichment Center" icon="✨">
        <div style={{ fontSize: 10, color: "#166534", marginBottom: 10, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
          Mode webhook · configurer CLAY_ENRICHMENT_ENABLED dans .env
        </div>
        {d.clayJobs.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 13 }}>Aucun job Clay.</div>
        ) : (
          d.clayJobs.map((j) => (
            <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: CLAY_COLOR[j.status] ?? MUTED, display: "inline-block", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{j.syndicName}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{j.jobType} · {frDate(j.createdAt)}</div>
                </div>
              </div>
              <Badge label={j.status} bg={j.status === "done" ? "#dcfce7" : j.status === "failed" ? "#fee2e2" : SURFACE1} color={CLAY_COLOR[j.status] ?? MUTED} />
            </div>
          ))
        )}
        <ViewMore href="/coproscan/clay-center" />
      </Card>
      <Card title="Contact Review" icon="👤">
        <div style={{ fontSize: 11, color: "#5c5c5a", marginBottom: 10 }}>
          Seuls les contacts <strong>verified</strong> ou <strong>public_professional</strong> peuvent générer un brouillon envoyable.
        </div>
        {d.contacts.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 13 }}>Aucun contact enrichi.</div>
        ) : (
          d.contacts.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.firstName} {c.lastName}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{c.role ?? "—"} · {c.syndicName}</div>
              </div>
              <Badge
                label={c.contactStatus}
                bg={c.contactStatus === "verified" || c.contactStatus === "public_professional" ? "#dcfce7" : SURFACE1}
                color={CONTACT_COLOR[c.contactStatus] ?? MUTED}
              />
            </div>
          ))
        )}
        <ViewMore href="/coproscan/contact-review" />
      </Card>
    </TwoCol>
  );
}

function TabEmailStudio({ d }: { d: DashboardData }) {
  const first = d.drafts[0];
  return (
    <TwoCol>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <STitle>Email Studio APCC</STitle>
          <Badge label="EMAIL_DELIVERY_MODE=draft_only" bg="#fef9c3" color="#713f12" />
        </div>
        {!first ? (
          <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>Aucun brouillon généré.</div>
        ) : (
          <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, fontSize: 12, color: "#5c5c5a", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: "#1a1a18", marginBottom: 6, fontSize: 13 }}>{first.subject}</div>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 8 }}>
              {first.contactEmail ?? "—"} · {first.copropName ?? "—"} · {frDate(first.createdAt)}
            </div>
            <Badge label={first.draftStatus} bg={first.draftStatus === "approved" ? "#dcfce7" : "#fef9c3"} color={first.draftStatus === "approved" ? "#166534" : "#713f12"} />
          </div>
        )}
        {d.drafts.length > 1 && (
          <div style={{ marginTop: 10 }}>
            <STitle>{d.metrics.drafts} brouillon{d.metrics.drafts !== 1 ? "s" : ""} au total</STitle>
            <ViewMore href="/coproscan/email-studio" />
          </div>
        )}
        <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
          L&apos;envoi exige une action humaine explicite et la vérification opposition au moment de l&apos;approbation.
        </div>
      </div>
      <Card title="Checklist brouillon" icon="✅">
        {[
          { ok: true, label: "Contact verified ou public_professional" },
          { ok: true, label: "Fait EFG réel sourcé (RNIC · DPE ADEME)" },
          { ok: true, label: "Aucune promesse CEE garantie" },
          { ok: true, label: "CTA unique · diagnostic sans engagement" },
          { ok: true, label: "Mention B2B + opposition simple incluse" },
          { ok: true, label: "Signature APCC configurable" },
          { ok: false, label: "Opposition vérifiée à l'envoi (requis)" },
          { ok: null, label: "Validation humaine requise avant envoi" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12 }}>
            <span style={{ color: item.ok === true ? "#16a34a" : item.ok === false ? RED : MUTED }}>
              {item.ok === true ? "✓" : item.ok === false ? "✗" : "○"}
            </span>
            <span style={{ color: item.ok === null ? MUTED : "#1a1a18" }}>{item.label}</span>
          </div>
        ))}
      </Card>
    </TwoCol>
  );
}

function TabPipeline({ d }: { d: DashboardData }) {
  const byStage = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    items: d.pipeline.filter((s) => getPipelineStage(s) === stage.key),
  }));
  if (d.pipeline.length === 0) {
    return (
      <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>
        Pipeline vide — importez le RNIC, qualifiez les EFG et enrichissez les syndics via Clay.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(150px, 1fr))`, gap: 10, overflowX: "auto" }}>
      {byStage.map((stage) => (
        <div key={stage.key}>
          <div style={{ borderRadius: 6, padding: "7px 10px", marginBottom: 8, background: stage.color + "22", borderLeft: `3px solid ${stage.color}` }}>
            <strong style={{ fontSize: 12 }}>{stage.label}</strong>
            <span style={{ float: "right", background: stage.color, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
              {stage.items.length}
            </span>
          </div>
          {stage.items.map((s) => (
            <div key={s.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 12 }}>
              <Link href={`/coproscan/syndics/${s.id}` as Route<string>} style={{ fontWeight: 600, color: "#1a1a18" }}>{s.name}</Link>
              {s.city && <div style={{ fontSize: 10, color: MUTED }}>{s.city}</div>}
              <div style={{ marginTop: 4, fontSize: 10, color: MUTED }}>{s.copropCount} copros · {s.contactsCount} contacts</div>
            </div>
          ))}
          {stage.items.length === 0 && <div style={{ color: MUTED, fontSize: 12, padding: "6px 0" }}>—</div>}
        </div>
      ))}
    </div>
  );
}

function TabImports({ d }: { d: DashboardData }) {
  return (
    <div>
      <STitle>Historique des imports</STitle>
      {d.batches.length === 0 ? (
        <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>Aucun import lancé. Allez dans la page Imports pour démarrer.</div>
      ) : (
        <TableWrap>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <Th>Source</Th><Th>Dept</Th><Th>Statut</Th>
              <Th>Importés</Th><Th>Mis à jour</Th><Th>Rejetés</Th>
              <Th>Date</Th><Th>Durée</Th>
            </tr></thead>
            <tbody>
              {d.batches.map((b) => (
                <tr key={b.id}>
                  <Td><strong>{SOURCE_LABEL[b.source] ?? b.source}</strong></Td>
                  <Td>{b.department ?? "—"}</Td>
                  <Td><span style={{ color: BATCH_COLOR[b.status] ?? MUTED, fontSize: 12 }}>{b.status}</span></Td>
                  <Td style={{ color: "#16a34a" }}>{b.recordsImported}</Td>
                  <Td>{b.recordsUpdated}</Td>
                  <Td style={{ color: b.recordsRejected > 0 ? RED : "inherit" }}>{b.recordsRejected}</Td>
                  <Td style={{ color: MUTED }}>{frDate(b.createdAt)}</Td>
                  <Td style={{ color: MUTED }}>{duration(b.startedAt, b.completedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <ViewMore href="/coproscan/imports" label="Lancer un import →" />
    </div>
  );
}

function TabRgpd({ d }: { d: DashboardData }) {
  return (
    <TwoCol>
      <Card title="Conformité active" icon="🛡">
        {[
          { ok: true, label: "Liste repoussoir bloquante", sub: `${d.metrics.contactsOpposed} contacts · ${d.metrics.syndicsOpposed} syndics opposés` },
          { ok: true, label: "Source & date sur chaque donnée", sub: "DataProvenance systématique" },
          { ok: true, label: "Journal exports & envois", sub: "Traçabilité complète" },
          { ok: true, label: "Finalité B2B documentée", sub: "Professionnels uniquement · pas de particuliers" },
          { ok: "warn" as const, label: "Prospection téléphonique", sub: "Vérification Bloctel à confirmer avant activation" },
          { ok: "warn" as const, label: "PRIVACY_NOTICE_URL", sub: "À définir dans .env" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 14, color: item.ok === true ? "#16a34a" : "#d97706", flexShrink: 0 }}>
              {item.ok === true ? "✓" : "⚠"}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </Card>
      <div>
        <Card title="Journal des traitements" icon="📋">
          {d.gdprLogs.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 13 }}>Aucune action RGPD enregistrée.</div>
          ) : (
            d.gdprLogs.slice(0, 8).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                <div>
                  <span style={{ color: l.action === "opposition" || l.action === "anonymize" ? RED : MUTED, fontSize: 11, fontWeight: 600 }}>
                    {l.action}
                  </span>
                  <span style={{ color: MUTED, fontSize: 11 }}> · {l.entityType}</span>
                </div>
                <div style={{ fontSize: 11, color: MUTED }}>{frDateTime(l.createdAt)}</div>
              </div>
            ))
          )}
          <ViewMore href="/coproscan/rgpd" />
        </Card>
        <div style={{ marginTop: 12 }}>
          <Card title="Liste repoussoir" icon="🚫">
            {d.oppositions.length === 0 ? (
              <div style={{ color: MUTED, fontSize: 13 }}>Aucune opposition enregistrée.</div>
            ) : (
              d.oppositions.slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: MUTED }}>{o.entityType} · {o.email ?? o.siren ?? "—"}</span>
                  <span style={{ color: MUTED, fontSize: 11 }}>{frDate(o.opposedAt)}</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </TwoCol>
  );
}

// ── Main dashboard component ──────────────────────────────────────────────────

const TABS = [
  "EFG confirmés", "EFG probables", "À qualifier", "Syndics",
  "Clay", "Email Studio", "Pipeline", "Imports", "RGPD",
];

export default function CoproScanDashboard({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: BLUE }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>CS</div>
          <div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>CoproScan {data.departments.join("-")}</div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>APCC Neuf et Rénovation · Moteur de prospection EFG</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,.85)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: data.isProduction ? "#4ade80" : "#fbbf24", display: "inline-block" }} />
          {data.isProduction ? "Production" : "Développement · DEMO_MODE actif"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 12px", scrollbarWidth: "none" }}>
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            style={{
              padding: "10px 14px", fontSize: 12, whiteSpace: "nowrap",
              border: "none", background: "none", cursor: "pointer",
              color: tab === i ? BLUE : "#5c5c5a",
              borderBottom: tab === i ? `2px solid ${BLUE}` : "2px solid transparent",
              marginBottom: -1, fontWeight: tab === i ? 600 : 400,
              transition: "color .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16, background: "#f4f4f2", minHeight: 380 }}>
        {tab === 0 && <TabConfirmed d={data} />}
        {tab === 1 && <TabProbable d={data} />}
        {tab === 2 && <TabUnknown d={data} />}
        {tab === 3 && <TabSyndics d={data} />}
        {tab === 4 && <TabClay d={data} />}
        {tab === 5 && <TabEmailStudio d={data} />}
        {tab === 6 && <TabPipeline d={data} />}
        {tab === 7 && <TabImports d={data} />}
        {tab === 8 && <TabRgpd d={data} />}
      </div>
    </div>
  );
}
