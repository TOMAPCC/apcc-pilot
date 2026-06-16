"use client";

import { useEffect, useState } from "react";
import { pipelineStages } from "@/lib/demo-data";
import type { BusinessLine, Prospect, ProspectStatus } from "@/lib/types";

const businessLines: Array<BusinessLine | "Toutes"> = ["Toutes", "Pompe a chaleur", "Prime Adapt"];

export function PipelineBoard({ initialProspects }: Readonly<{ initialProspects: Prospect[] }>) {
  const [prospects, setProspects] = useState(initialProspects);
  const [businessLine, setBusinessLine] = useState<(typeof businessLines)[number]>("Toutes");

  useEffect(() => {
    setProspects(applyStoredProspectEdits(initialProspects));
  }, [initialProspects]);

  function moveProspect(id: string, status: ProspectStatus) {
    setProspects((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const visibleProspects = prospects.filter((prospect) => businessLine === "Toutes" || prospect.businessLine === businessLine);

  return (
    <div className="pipeline-workspace">
      <section className="filters-bar compact">
        <select value={businessLine} onChange={(event) => setBusinessLine(event.target.value as typeof businessLine)}>
          {businessLines.map((item) => <option key={item} value={item}>{formatBusinessLine(item)}</option>)}
        </select>
      </section>

      <section className="kanban" aria-label="Pipeline commercial">
        {pipelineStages.map((stage) => (
          <div className="column" key={stage.id}>
            <h3>{stage.name} - {visibleProspects.filter((prospect) => prospect.status === stage.name).length}</h3>
            {visibleProspects.filter((prospect) => prospect.status === stage.name).map((prospect) => (
              <article className="deal-card" key={prospect.id}>
                <span className={prospect.businessLine === "Prime Adapt" ? "source-pill prime" : "source-pill"}>{formatBusinessLine(prospect.businessLine)}</span>
                <strong>{prospect.firstName} {prospect.lastName}</strong>
                <p>{prospect.postalCode} - {prospect.projectTypes.join(", ")}</p>
                <p>{prospect.phone || "Telephone manquant"}</p>
                <p>{prospect.nextAction}</p>
                <select
                  aria-label="Changer l'etape"
                  value={prospect.status}
                  onChange={(event) => moveProspect(prospect.id, event.target.value as ProspectStatus)}
                >
                  {pipelineStages.map((option) => <option key={option.id}>{option.name}</option>)}
                </select>
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

function applyStoredProspectEdits(prospects: Prospect[]) {
  return prospects.map((prospect) => {
    const stored = window.localStorage.getItem(`apcc-prospect-edits:${prospect.id}`);
    return stored ? { ...prospect, ...JSON.parse(stored) } : prospect;
  });
}

function formatBusinessLine(value: BusinessLine | "Toutes") {
  if (value === "Pompe a chaleur") return "Pompes a chaleur";
  if (value === "Prime Adapt") return "Prime Adapt'";
  return value;
}
