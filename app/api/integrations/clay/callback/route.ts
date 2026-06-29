import { NextRequest, NextResponse } from "next/server";
import { verifyClayCallback, processClayCallback } from "@/lib/coproscan/clay-provider";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const authHeader = request.headers.get("Authorization") ?? request.headers.get("X-Clay-Signature");

  // Reject unsigned callbacks
  if (!verifyClayCallback(rawBody, authHeader)) {
    return NextResponse.json(
      { error: "Unauthorized — invalid signature" },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await processClayCallback(payload);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Callback processing failed";
    console.error("[Clay callback]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
