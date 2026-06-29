import { NextRequest, NextResponse } from "next/server";
import { enqueueCompanyEnrichment, isClayConfigured } from "@/lib/coproscan/clay-provider";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { syndicId } = body as { syndicId?: string };

  if (!syndicId) {
    return NextResponse.json({ error: "syndicId required" }, { status: 400 });
  }

  // Guard: syndic must exist and not be opposed
  const syndic = await prisma.syndic.findUnique({ where: { id: syndicId } });
  if (!syndic) {
    return NextResponse.json({ error: "Syndic introuvable" }, { status: 404 });
  }
  if (syndic.gdprOpposedAt) {
    return NextResponse.json(
      { error: "Opposition RGPD active pour ce syndic" },
      { status: 409 }
    );
  }
  if (syndic.isDemo) {
    return NextResponse.json({ error: "Données de démonstration non envoyées à Clay" }, { status: 400 });
  }

  const result = await enqueueCompanyEnrichment(syndicId);
  return NextResponse.json({
    ...result,
    clayConfigured: isClayConfigured(),
    message: isClayConfigured()
      ? "Job envoyé à Clay"
      : "Job créé en attente — Clay non configuré. Voir docs/clay-setup.md",
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const syndicId = searchParams.get("syndicId");
  const status = searchParams.get("status");

  const where = {
    ...(syndicId ? { syndicId } : {}),
    ...(status ? { status } : {}),
  };

  const jobs = await prisma.clayJob.findMany({
    where,
    include: { syndic: { select: { name: true, siren: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ jobs });
}
