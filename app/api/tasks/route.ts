import { NextResponse } from "next/server";
import { z } from "zod";

const taskSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  owner: z.string().min(1),
  dueDate: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
  description: z.string().optional()
});

export async function POST(request: Request) {
  const payload = taskSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Tache invalide.", errors: payload.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({
    status: "created",
    message: `Tache "${payload.data.title}" validee. La sauvegarde PostgreSQL sera activee avec Prisma.`
  });
}
