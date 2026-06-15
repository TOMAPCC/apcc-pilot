import { NextResponse } from "next/server";
import { fetchLatestSheetLeads } from "@/lib/sheets-import";

export async function POST() {
  try {
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
