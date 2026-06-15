import { NextResponse } from "next/server";
import { z } from "zod";

const appointmentSchema = z.object({
  title: z.string().min(1),
  template: z.string().min(1),
  startsAt: z.string().min(1),
  owner: z.string().min(1),
  address: z.string().min(1),
  guestEmail: z.string().email().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const payload = appointmentSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Rendez-vous invalide.", errors: payload.error.flatten() }, { status: 400 });
  }

  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return NextResponse.json({
    status: googleReady ? "calendar-ready" : "simulation",
    message: googleReady
      ? `Rendez-vous "${payload.data.title}" pret pour creation Google Calendar.`
      : `Rendez-vous "${payload.data.title}" valide en simulation. Ajoute les identifiants Google pour la creation Calendar reelle.`
  });
}
