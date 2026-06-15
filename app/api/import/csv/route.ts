import { NextResponse } from "next/server";
import { parseCsvLeads } from "@/lib/crm";

export async function POST(request: Request) {
  const body = await request.text();
  const rows = parseCsvLeads(body);
  const duplicates = rows.filter((row) => row.duplicate).length;

  return NextResponse.json({
    importedPreview: rows.length,
    duplicates,
    rows,
    message: `${rows.length} ligne(s) analysee(s), ${duplicates} doublon(s) potentiel(s).`
  });
}
