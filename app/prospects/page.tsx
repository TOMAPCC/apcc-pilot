import { AppShell } from "@/components/AppShell";
import { ProspectWorkspace } from "@/components/ProspectWorkspace";
import { getCrmProspects } from "@/lib/sheet-prospects";

export default async function ProspectsPage({
  searchParams
}: Readonly<{ searchParams?: Promise<{ q?: string }> }>) {
  const params = await searchParams;
  const prospects = await getCrmProspects();

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Prospects</h1>
          <p>{prospects.length} leads recuperes depuis Google Sheets et ClubTravaux.</p>
        </div>
        <a className="button" href="/prospects/new">Nouveau prospect</a>
      </div>

      <ProspectWorkspace prospects={prospects} initialQuery={params?.q ?? ""} />
    </AppShell>
  );
}
