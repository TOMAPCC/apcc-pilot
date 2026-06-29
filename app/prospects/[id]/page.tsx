import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProspectEditor } from "@/components/ProspectEditor";
import { getCrmProspects } from "@/lib/sheet-prospects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProspectDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const prospects = await getCrmProspects();
  const prospect = prospects.find((item) => item.id === id);

  if (!prospect) {
    notFound();
  }

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Fiche prospect</h1>
          <p>Detail, qualification, coordonnees et edition rapide.</p>
        </div>
        <Link className="secondary-button" href="/prospects">Retour prospects</Link>
      </div>
      <ProspectEditor prospect={prospect} />
    </AppShell>
  );
}
