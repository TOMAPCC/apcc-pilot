import { NextRequest, NextResponse } from "next/server";
import { generateEmailDraft } from "@/lib/coproscan/email-studio";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { coproprieteId, contactId } = body as {
    coproprieteId?: string;
    contactId?: string;
  };

  if (!coproprieteId || !contactId) {
    return NextResponse.json(
      { error: "coproprieteId and contactId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateEmailDraft({ coproprieteId, contactId });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email generation failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
