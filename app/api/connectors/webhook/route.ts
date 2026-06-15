import { NextResponse } from "next/server";
import { z } from "zod";
import { findPotentialDuplicate } from "@/lib/crm";

const webhookLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email(),
  city: z.string().min(1),
  postalCode: z.string().min(4),
  worksiteAddress: z.string().optional().default(""),
  projectTypes: z.array(z.string()).default(["Autre projet"]),
  source: z.string().default("Webhook")
});

export async function POST(request: Request) {
  const payload = webhookLeadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Payload webhook invalide.", errors: payload.error.flatten() }, { status: 400 });
  }

  const duplicate = findPotentialDuplicate(payload.data);

  return NextResponse.json({
    accepted: !duplicate,
    duplicateId: duplicate?.id ?? null,
    message: duplicate
      ? "Lead recu mais bloque par la protection anti-doublon."
      : "Lead webhook valide et pret pour creation."
  });
}
