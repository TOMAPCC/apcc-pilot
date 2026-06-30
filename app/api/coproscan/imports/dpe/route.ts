import { NextRequest, NextResponse } from "next/server";
import { importDpeForDepartment } from "@/lib/coproscan/dpe-importer";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { department } = body as { department?: string };

  if (!department) {
    return NextResponse.json(
      { error: "department required", availableDepartments: TARGET_DEPARTMENTS },
      { status: 400 }
    );
  }

  try {
    const result = await importDpeForDepartment(department);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DPE import failed";
    return NextResponse.json({ error: message, data: [] }, { status: 500 });
  }
}
