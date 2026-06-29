import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, updatePersistentProspect } from "@/lib/prospect-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateSchema = z.object({
  civility: z.enum(["M.", "Mme", "M. et Mme"]).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional(),
  worksiteAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  source: z.string().optional(),
  businessLine: z.enum(["Pompe a chaleur", "Prime Adapt"]).optional(),
  status: z.enum([
    "Nouveau lead",
    "A qualifier",
    "A contacter",
    "N'a pas repondu",
    "Contact etabli",
    "Rendez-vous planifie",
    "Devis envoye",
    "Negociation",
    "Dossier signe",
    "Dossier perdu"
  ]).optional(),
  priority: z.enum(["Basse", "Normale", "Haute", "Urgente"]).optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  estimatedBudget: z.coerce.number().min(0).optional(),
  expectedDecisionDate: z.string().optional(),
  nextAction: z.string().optional(),
  nextFollowUp: z.string().optional(),
  projectTypes: z.array(z.string()).optional(),
  housingType: z.string().optional(),
  heatingSystem: z.string().optional(),
  maprimeCategory: z.string().optional(),
  comments: z.string().optional(),
  appointmentStartsAt: z.string().optional(),
  appointmentAddress: z.string().optional(),
  appointmentNotes: z.string().optional(),
  lossReason: z.string().optional()
});

export async function PATCH(request: Request, { params }: Readonly<{ params: Promise<{ id: string }> }>) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { status: "fallback", message: "DATABASE_URL absent: modification conservee uniquement dans le navigateur." },
      { status: 202 }
    );
  }

  const { id } = await params;
  const payload = updateSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Mise a jour invalide.", errors: payload.error.flatten() }, { status: 400 });
  }

  const prospect = await updatePersistentProspect(id, payload.data);

  if (!prospect) {
    return NextResponse.json({ message: "Prospect introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    status: "updated",
    prospect,
    message: "Prospect enregistre dans PostgreSQL."
  });
}
