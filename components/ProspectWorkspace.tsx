"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Prospect, ProspectStatus } from "@/lib/types";

const statuses: Array<ProspectStatus | "Tous"> = [
  "Tous",
  "Nouveau lead",
  "A qualifier",
  "A contacter",
  "Rendez-vous planifie",
  "Dossier perdu"
];

export function ProspectWorkspace({
  prospects,
  initialQuery
}: Readonly<{ prospects: Prospect[]; initialQuery?: string }>) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [source, setSource] = useState("Toutes");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Tous");
  const [sort, setSort] = useState("recent");

  const sources = useMemo(() => ["Toutes", ...Array.from(new Set(prospects.map((prospect) => prospect.source)))], [prospects]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);

    return prospects
      .filter((prospect) => source === "Toutes" || prospect.source === source)
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
          prospect.comments
        ].join(" ")).includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === "score") return b.score - a.score;
        if (sort === "source") return a.source.localeCompare(b.source);
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
  }, [prospects, query, source, status, sort]);

  const highPriority = filtered.filter((prospect) => prospect.priority === "Haute" || prospect.priority === "Urgente").length;

  return (
    <div className="workspace">
      <section className="command-panel">
        <div>
          <span className="eyebrow">Centre de pilotage leads</span>
          <h2>{filtered.length} prospects</h2>
          <p>Recherche instantanee, filtres par source et ouverture directe des fiches.</p>
        </div>
        <div className="mini-metrics">
          <div><strong>{prospects.length}</strong><span>Total CRM</span></div>
          <div><strong>{highPriority}</strong><span>Prioritaires</span></div>
          <div><strong>{sources.length - 1}</strong><span>Sources</span></div>
        </div>
      </section>

      <section className="filters-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, telephone, e-mail, ville..." />
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
              <span className={prospect.source === "ClubTravaux" ? "source-pill club" : "source-pill"}>{prospect.source}</span>
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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
