import { AppShell } from "@/components/AppShell";
import { PipelineBoard } from "@/components/PipelineBoard";
import { getCrmProspects } from "@/lib/sheet-prospects";
import type { Prospect } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PipelinePage() {
  const prospects = await getCrmProspects() as Prospect[];

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Pipeline commercial</h1>
          <p>Kanban de suivi avec probabilite de chiffre d&apos;affaires par etape.</p>
        </div>
      </div>
      <PipelineBoard initialProspects={prospects} />
    </AppShell>
  );
}
