import { AppShell } from "@/components/AppShell";
import { ProspectWorkspace } from "@/components/ProspectWorkspace";
import { SyncSheetsButton } from "@/components/SyncSheetsButton";
import { getCrmProspects } from "@/lib/sheet-prospects";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        <div className="page-actions">
          <SyncSheetsButton />
          <Link className="button" href="/prospects/new">Nouveau prospect</Link>
        </div>
      </div>

      <ProspectWorkspace prospects={prospects} initialQuery={params?.q ?? ""} />
    </AppShell>
  );
}
