import { NextResponse } from "next/server";
import { z } from "zod";
import { findPotentialDuplicate } from "@/lib/crm";

const prospectSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email(),
  worksiteAddress: z.string().min(3),
  postalCode: z.string().min(4),
  city: z.string().min(1),
  source: z.string().default("Saisie manuelle"),
  estimatedBudget: z.coerce.number().min(0).default(0),
  projectTypes: z.string().optional(),
  comments: z.string().optional()
});

export async function GET() {
  const { prospects } = await import("@/lib/demo-data");
  return NextResponse.json({ prospects });
}

export async function POST(request: Request) {
  const payload = prospectSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { message: "Le formulaire contient des champs invalides.", errors: payload.error.flatten() },
      { status: 400 }
    );
  }

  const duplicate = findPotentialDuplicate({
    phone: payload.data.phone,
    email: payload.data.email,
    lastName: payload.data.lastName,
    postalCode: payload.data.postalCode,
    worksiteAddress: payload.data.worksiteAddress
  });

  if (duplicate) {
    return NextResponse.json({
      status: "duplicate",
      duplicateId: duplicate.id,
      message: `Doublon potentiel detecte avec ${duplicate.firstName} ${duplicate.lastName}. Choix requis: fusionner, conserver, ignorer ou mettre a jour.`
    });
  }

  return NextResponse.json({
    status: "created",
    message: `Prospect ${payload.data.firstName} ${payload.data.lastName} pret a etre cree. La persistance PostgreSQL sera activee apres migration Prisma.`
  });
}
