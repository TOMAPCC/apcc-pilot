"use client";

import { useState } from "react";
import { pipelineStages } from "@/lib/demo-data";
import type { Prospect, ProspectStatus } from "@/lib/types";

export function PipelineBoard({ initialProspects }: Readonly<{ initialProspects: Prospect[] }>) {
  const [prospects, setProspects] = useState(initialProspects);

  function moveProspect(id: string, status: ProspectStatus) {
    setProspects((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <section className="kanban" aria-label="Pipeline commercial">
      {pipelineStages.map((stage) => (
        <div className="column" key={stage.id}>
          <h3>{stage.name} - {prospects.filter((prospect) => prospect.status === stage.name).length}</h3>
          {prospects.filter((prospect) => prospect.status === stage.name).map((prospect) => (
            <article className="deal-card" key={prospect.id}>
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
  );
}
