import { NextRequest, NextResponse } from "next/server";
import { importRnicDepartment, importAllTargetDepartments } from "@/lib/coproscan/rnic-importer";
import { isProductionMode, TARGET_DEPARTMENTS } from "@/lib/coproscan/types";

export async function POST(request: NextRequest) {
  // In production, no demo data can leak in
  if (isProductionMode() && process.env.DEMO_MODE === "true") {
    return NextResponse.json({ error: "Demo mode is disabled in production." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { department, all } = body as { department?: string; all?: boolean };

  try {
    if (all) {
      const results = await importAllTargetDepartments();
      return NextResponse.json({ success: true, results });
    }

    if (!department) {
      return NextResponse.json(
        { error: "department or all required", availableDepartments: TARGET_DEPARTMENTS },
        { status: 400 }
      );
    }

    const result = await importRnicDepartment(department);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message, data: [] }, { status: 500 });
  }
}
