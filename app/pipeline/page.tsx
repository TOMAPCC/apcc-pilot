"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { pipelineStages, prospects as initialProspects } from "@/lib/demo-data";
import type { ProspectStatus } from "@/lib/types";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function PipelinePage() {
  const [prospects, setProspects] = useState(initialProspects);

  function moveProspect(id: string, status: ProspectStatus) {
    setProspects((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Pipeline commercial</h1>
          <p>Kanban de suivi avec probabilite de chiffre d'affaires par etape.</p>
        </div>
      </div>
      <section className="kanban" aria-label="Pipeline commercial">
        {pipelineStages.map((stage) => (
          <div className="column" key={stage.id}>
            <h3>{stage.name} - {stage.probability}%</h3>
            {prospects.filter((prospect) => prospect.status === stage.name).map((prospect) => (
              <article className="deal-card" key={prospect.id}>
                <strong>{prospect.firstName} {prospect.lastName}</strong>
                <p>{prospect.city} - {prospect.projectTypes.join(", ")}</p>
                <p>{euro.format(prospect.estimatedBudget)} - {prospect.assignedTo}</p>
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
    </AppShell>
  );
}
