import { NextResponse } from "next/server";
import { fetchLatestSheetLeads } from "@/lib/sheets-import";
import { isDatabaseConfigured, syncExternalProspectsIfDue } from "@/lib/prospect-repository";

export async function POST() {
  try {
    if (isDatabaseConfigured()) {
      const sync = await syncExternalProspectsIfDue(true);
      return NextResponse.json({
        mode: "database",
        imported: sync.imported,
        duplicates: 0,
        latest: [],
        message: `${sync.imported} lead(s) synchronises dans PostgreSQL depuis Google Sheets et ClubTravaux.`
      });
    }

    const result = await fetchLatestSheetLeads(25);
    return NextResponse.json({
      mode: "public-csv",
      ...result,
      duplicates: result.latest.filter((lead) => lead.duplicateId).length,
      message: `${result.latest.length} dernier(s) lead(s) recuperes depuis Google Sheets.`
    });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "error",
        message: error instanceof Error ? error.message : "Impossible de lire le Google Sheets.",
        latest: []
      },
      { status: 502 }
    );
  }
}
