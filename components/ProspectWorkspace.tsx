"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BusinessLine, Prospect, ProspectStatus } from "@/lib/types";

const statuses: Array<ProspectStatus | "Tous"> = [
  "Tous",
  "Nouveau lead",
  "A qualifier",
  "A contacter",
  "N'a pas repondu",
  "Contact etabli",
  "Rendez-vous planifie",
  "Devis envoye",
  "Negociation",
  "Dossier signe",
  "Dossier perdu"
];

const businessLines: Array<BusinessLine | "Toutes"> = ["Toutes", "Pompe a chaleur", "Prime Adapt"];

export function ProspectWorkspace({
  prospects,
  initialQuery
}: Readonly<{ prospects: Prospect[]; initialQuery?: string }>) {
  const [visibleProspects, setVisibleProspects] = useState(prospects);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [source, setSource] = useState("Toutes");
  const [businessLine, setBusinessLine] = useState<(typeof businessLines)[number]>("Toutes");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Tous");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    setVisibleProspects(applyStoredProspectEdits(prospects));
  }, [prospects]);

  const sources = useMemo(() => ["Toutes", ...Array.from(new Set(visibleProspects.map((prospect) => prospect.source)))], [visibleProspects]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);

    return visibleProspects
      .filter((prospect) => source === "Toutes" || prospect.source === source)
      .filter((prospect) => businessLine === "Toutes" || prospect.businessLine === businessLine)
      .filter((prospect) => status === "Tous" || prospect.status === status)
      .filter((prospect) => {
        if (!normalizedQuery) return true;
        return normalize([
          prospect.firstName,
          prospect.lastName,
          prospect.phone,
          prospect.email,
          prospect.postalCode,
          prospect.city,
          prospect.source,
          prospect.businessLine,
          prospect.projectTypes.join(" "),
          prospect.comments
        ].join(" ")).includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === "score") return b.score - a.score;
        if (sort === "source") return a.source.localeCompare(b.source);
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
  }, [visibleProspects, query, source, businessLine, status, sort]);

  const highPriority = filtered.filter((prospect) => prospect.priority === "Haute" || prospect.priority === "Urgente").length;
  const heatPumpCount = visibleProspects.filter((prospect) => prospect.businessLine === "Pompe a chaleur").length;
  const primeAdaptCount = visibleProspects.filter((prospect) => prospect.businessLine === "Prime Adapt").length;

  return (
    <div className="workspace">
      <section className="command-panel">
        <div>
          <span className="eyebrow">Centre de pilotage leads</span>
          <h2>{filtered.length} prospects</h2>
          <p>Recherche instantanee, activites separees et ouverture directe des fiches.</p>
        </div>
        <div className="mini-metrics">
          <div><strong>{heatPumpCount}</strong><span>Pompes a chaleur</span></div>
          <div><strong>{primeAdaptCount}</strong><span>Prime Adapt</span></div>
          <div><strong>{highPriority}</strong><span>Prioritaires</span></div>
        </div>
      </section>

      <section className="filters-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, telephone, e-mail, ville..." />
        <select value={businessLine} onChange={(event) => setBusinessLine(event.target.value as typeof businessLine)}>
          {businessLines.map((item) => <option key={item} value={item}>{formatBusinessLine(item)}</option>)}
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          {sources.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Plus recents</option>
          <option value="score">Score</option>
          <option value="source">Source</option>
        </select>
      </section>

      <section className="lead-grid">
        {filtered.map((prospect) => (
          <Link className="lead-card" href={`/prospects/${prospect.id}`} key={prospect.id}>
            <div className="lead-card-head">
              <span className={getSourceClassName(prospect)}>{formatBusinessLine(prospect.businessLine)}</span>
              <span className="score-ring">{prospect.score}</span>
            </div>
            <strong>{prospect.firstName} {prospect.lastName}</strong>
            <p>{prospect.projectTypes.join(", ")}</p>
            <div className="lead-meta">
              <span>{prospect.postalCode} {prospect.city}</span>
              <span>{prospect.phone || "Telephone manquant"}</span>
              <span>{prospect.email || "Email manquant"}</span>
            </div>
            <div className="lead-footer">
              <span className="badge">{prospect.status}</span>
              <span className={prospect.priority === "Basse" ? "badge" : "badge hot"}>{prospect.priority}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function formatBusinessLine(value: BusinessLine | "Toutes") {
  if (value === "Pompe a chaleur") return "Pompes a chaleur";
  if (value === "Prime Adapt") return "Prime Adapt'";
  return value;
}

function getSourceClassName(prospect: Prospect) {
  if (prospect.businessLine === "Prime Adapt") return "source-pill prime";
  if (prospect.source === "ClubTravaux") return "source-pill club";
  return "source-pill";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function applyStoredProspectEdits(prospects: Prospect[]) {
  return prospects.map((prospect) => {
    const stored = window.localStorage.getItem(`apcc-prospect-edits:${prospect.id}`);
    return stored ? { ...prospect, ...JSON.parse(stored) } : prospect;
  });
}
