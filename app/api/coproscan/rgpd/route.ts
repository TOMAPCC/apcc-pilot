import { NextRequest, NextResponse } from "next/server";
import { addOpposition, purgeEntity, logGdprAction } from "@/lib/coproscan/rgpd";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { action, entityType, entityId, reason, source, actor } = body as {
    action: "oppose" | "purge" | "export";
    entityType: "syndic" | "contact";
    entityId: string;
    reason?: string;
    source?: string;
    actor?: string;
  };

  if (!action || !entityType || !entityId) {
    return NextResponse.json({ error: "action, entityType, entityId required" }, { status: 400 });
  }

  try {
    if (action === "oppose") {
      let email: string | undefined;
      let siren: string | undefined;

      if (entityType === "contact") {
        const contact = await prisma.contact.findUnique({ where: { id: entityId } });
        email = contact?.emailPro ?? undefined;
      } else if (entityType === "syndic") {
        const syndic = await prisma.syndic.findUnique({ where: { id: entityId } });
        siren = syndic?.siren ?? undefined;
        email = syndic?.email ?? undefined;
      }

      await addOpposition({ entityType, entityId, email, siren, reason, source });
      return NextResponse.json({ success: true, action: "opposition_recorded" });
    }

    if (action === "purge") {
      if (!actor) {
        return NextResponse.json({ error: "actor required for purge" }, { status: 400 });
      }
      await purgeEntity({ entityType, entityId, actor });
      return NextResponse.json({ success: true, action: "entity_purged" });
    }

    if (action === "export") {
      await logGdprAction({ entityType, entityId, action: "export", actor });
      // Return the entity data
      if (entityType === "syndic") {
        const data = await prisma.syndic.findUnique({
          where: { id: entityId },
          include: { contacts: true },
        });
        return NextResponse.json({ data });
      } else {
        const data = await prisma.contact.findUnique({ where: { id: entityId } });
        return NextResponse.json({ data });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RGPD action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const [oppositions, logs] = await Promise.all([
    prisma.oppositionList.findMany({ orderBy: { opposedAt: "desc" }, take: 100 }),
    prisma.gdprLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return NextResponse.json({ oppositions, logs });
}
