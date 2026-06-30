import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const result: Record<string, unknown> = {
    status: "ok",
    ts: new Date().toISOString(),
    hasDatabaseUrl,
  };

  if (!hasDatabaseUrl) {
    result.status = "error";
    result.db = "DATABASE_URL is not set in this environment";
    return NextResponse.json(result, { status: 500 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.db = "connected";

    try {
      const copropCount = await prisma.copropriete.count();
      result.tables = { copropriete: copropCount };
    } catch (tableErr) {
      result.status = "error";
      result.tablesError = tableErr instanceof Error ? tableErr.message : String(tableErr);
    }
  } catch (err) {
    result.status = "error";
    result.db = "connection failed";
    result.dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result, { status: result.status === "ok" ? 200 : 500 });
}
