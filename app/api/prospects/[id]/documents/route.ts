import { NextResponse } from "next/server";
import { z } from "zod";
import { createProspectDocument, getProspectDocuments, isDatabaseConfigured } from "@/lib/prospect-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const documentSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.coerce.number().min(1).max(MAX_FILE_SIZE),
  dataUrl: z.string().startsWith("data:")
});

export async function GET(_: Request, { params }: Readonly<{ params: Promise<{ id: string }> }>) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ documents: [] });
  }

  const { id } = await params;
  const documents = await getProspectDocuments(id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: Readonly<{ params: Promise<{ id: string }> }>) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { message: "DATABASE_URL absent: depot de fichier indisponible cote serveur." },
      { status: 409 }
    );
  }

  const { id } = await params;
  const payload = documentSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Fichier invalide ou trop volumineux.", errors: payload.error.flatten() }, { status: 400 });
  }

  const document = await createProspectDocument({
    prospectId: id,
    ...payload.data
  });

  return NextResponse.json({
    status: "created",
    document,
    message: "Document classe dans la fiche prospect."
  });
}
