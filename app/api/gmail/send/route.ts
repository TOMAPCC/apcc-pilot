import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCloserEmail } from "@/lib/closer-email";

const payloadSchema = z.object({
  prospect: z.object({
    firstName: z.string().default(""),
    email: z.string().email(),
    postalCode: z.string().default(""),
    city: z.string().default(""),
    projectTypes: z.array(z.string()).default([]),
    heatingSystem: z.string().optional(),
    phone: z.string().default(""),
    address: z.string().default(""),
    worksiteAddress: z.string().default(""),
    businessLine: z.enum(["Pompe a chaleur", "Prime Adapt"]).optional()
  })
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Prospect invalide ou e-mail manquant." }, { status: 400 });
  }

  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GMAIL_FROM_EMAIL"].filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Gmail n'est pas encore connecte.",
        missing,
        setup: "Ajoute les variables OAuth Gmail dans Vercel pour activer l'envoi automatique."
      },
      { status: 409 }
    );
  }

  const email = buildCloserEmail(payload.data.prospect);
  const accessToken = await refreshAccessToken();
  const raw = createRawMessage({
    from: process.env.GMAIL_FROM_EMAIL!,
    to: payload.data.prospect.email,
    subject: email.subject,
    text: email.text,
    html: email.html
  });

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Gmail a refuse l'envoi.", detail: await response.text() },
      { status: response.status }
    );
  }

  return NextResponse.json({ sent: true, result: await response.json() });
}

async function refreshAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Error(`Impossible de rafraichir le token Gmail: ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function createRawMessage(input: { from: string; to: string; subject: string; text: string; html: string }) {
  const boundary = `apcc_${Date.now()}`;
  const message = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    "",
    `--${boundary}--`
  ].join("\r\n");

  return Buffer.from(message, "utf8").toString("base64url");
}
