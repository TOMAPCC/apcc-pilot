import { AppShell } from "@/components/AppShell";
import { PipelineBoard } from "@/components/PipelineBoard";
import { getCrmProspects } from "@/lib/sheet-prospects";

export default async function PipelinePage() {
  const prospects = await getCrmProspects();

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Pipeline commercial</h1>
          <p>Kanban de suivi avec probabilite de chiffre d'affaires par etape.</p>
        </div>
      </div>
      <PipelineBoard initialProspects={prospects} />
    </AppShell>
  );
}
