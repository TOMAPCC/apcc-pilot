import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { AppShell } from "@/components/AppShell";
import { ProspectEditor } from "@/components/ProspectEditor";
import { getCrmProspects } from "@/lib/sheet-prospects";
import type { Prospect } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProspectDetailPage({
  params,
  searchParams
}: Readonly<{ params: Promise<{ id: string }>; searchParams?: Promise<{ from?: string }> }>) {
  const { id } = await params;
  const query = await searchParams;
  const backHref = query?.from?.startsWith("/prospects") ? query.from : "/prospects";
  const prospects = await getCrmProspects() as Prospect[];
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
        <Link className="secondary-button" href={backHref as Route}>Retour prospects</Link>
      </div>
      <ProspectEditor prospect={prospect} />
    </AppShell>
  );
}
