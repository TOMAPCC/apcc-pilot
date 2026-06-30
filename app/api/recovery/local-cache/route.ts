import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, updatePersistentProspect } from "@/lib/prospect-repository";
import type { ProspectStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RECOVERY_TOKEN = "apcc-recovery-20260630";

const statusSchema = z.enum([
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
]);

const editSchema = z.object({
  id: z.string(),
  civility: z.enum(["M.", "Mme", "M. et Mme"]).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  worksiteAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  source: z.string().optional(),
  businessLine: z.enum(["Pompe a chaleur", "Prime Adapt"]).optional(),
  status: statusSchema.optional(),
  priority: z.enum(["Basse", "Normale", "Haute", "Urgente"]).optional(),
  score: z.coerce.number().optional(),
  estimatedBudget: z.coerce.number().optional(),
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
  lossReason: z.string().optional(),
  lostReason: z.string().optional(),
  lastContactedAt: z.string().optional(),
  contactAttempts: z.coerce.number().optional()
});

const appointmentSchema = z.object({
  prospectId: z.string(),
  startsAt: z.string().optional(),
  address: z.string().optional(),
  template: z.string().optional()
});

const payloadSchema = z.object({
  token: z.string(),
  edits: z.array(editSchema),
  appointments: z.array(appointmentSchema).optional()
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: "DATABASE_URL absent." }, { status: 503 });
  }

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Payload invalide.", errors: payload.error.flatten() }, { status: 400 });
  }

  if (payload.data.token !== RECOVERY_TOKEN) {
    return NextResponse.json({ message: "Token recovery invalide." }, { status: 403 });
  }

  const appointmentsByProspect = new Map(payload.data.appointments?.map((appointment) => [appointment.prospectId, appointment]) ?? []);
  const results: Array<{ id: string; status: string; restored: boolean; message?: string }> = [];

  for (const edit of payload.data.edits) {
    const appointment = appointmentsByProspect.get(edit.id);
    const status = (edit.status ?? (appointment ? "Rendez-vous planifie" : undefined)) as ProspectStatus | undefined;

    if (!status || status === "Nouveau lead") {
      results.push({ id: edit.id, status: status ?? "ignore", restored: false, message: "Statut non qualifie ignore." });
      continue;
    }

    try {
      const restored = await updatePersistentProspect(edit.id, {
        ...edit,
        status,
        appointmentStartsAt: edit.appointmentStartsAt ?? appointment?.startsAt,
        appointmentAddress: edit.appointmentAddress ?? appointment?.address,
        appointmentNotes: edit.appointmentNotes ?? appointment?.template,
        lossReason: edit.lossReason ?? edit.lostReason
      });

      results.push({
        id: edit.id,
        status,
        restored: Boolean(restored),
        message: restored ? undefined : "Prospect introuvable en base."
      });
    } catch (error) {
      results.push({ id: edit.id, status, restored: false, message: error instanceof Error ? error.message : "Erreur inconnue." });
    }
  }

  return NextResponse.json({
    restored: results.filter((result) => result.restored).length,
    ignored: results.filter((result) => !result.restored).length,
    results
  });
}
