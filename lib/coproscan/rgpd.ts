import { prisma } from "@/lib/db";

export async function logGdprAction(params: {
  entityType: string;
  entityId: string;
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
}) {
  return prisma.gdprLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actor: params.actor ?? null,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
  });
}

export async function addOpposition(params: {
  entityType: "syndic" | "contact";
  entityId: string;
  email?: string;
  siren?: string;
  reason?: string;
  source?: string;
}) {
  // Mark the entity itself
  if (params.entityType === "syndic") {
    await prisma.syndic.update({
      where: { id: params.entityId },
      data: { gdprOpposedAt: new Date() },
    });
    // Cancel pending Clay jobs
    await prisma.clayJob.updateMany({
      where: { syndicId: params.entityId, status: { in: ["pending", "sent"] } },
      data: { status: "failed", errorMessage: "gdpr_opposition" },
    });
  } else if (params.entityType === "contact") {
    await prisma.contact.update({
      where: { id: params.entityId },
      data: { gdprOpposedAt: new Date(), contactStatus: "opposed" },
    });
  }

  // Add to opposition list
  await prisma.oppositionList.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      email: params.email ?? null,
      siren: params.siren ?? null,
      reason: params.reason ?? null,
      source: params.source ?? "manual",
    },
  });

  await logGdprAction({
    entityType: params.entityType,
    entityId: params.entityId,
    action: "opposition",
    details: { source: params.source, reason: params.reason },
  });
}

export async function isOpposed(params: {
  email?: string;
  siren?: string;
  entityId?: string;
}): Promise<boolean> {
  const checks = [];
  if (params.email) checks.push({ email: params.email });
  if (params.siren) checks.push({ siren: params.siren });
  if (params.entityId) checks.push({ entityId: params.entityId });
  if (checks.length === 0) return false;

  const found = await prisma.oppositionList.findFirst({
    where: { OR: checks },
  });
  return !!found;
}

export async function purgeEntity(params: {
  entityType: "syndic" | "contact";
  entityId: string;
  actor: string;
}) {
  if (params.entityType === "syndic") {
    await prisma.contact.updateMany({
      where: { syndicId: params.entityId },
      data: {
        emailPro: null,
        phonePro: null,
        linkedinUrl: null,
        contactStatus: "opposed",
      },
    });
    await prisma.syndic.update({
      where: { id: params.entityId },
      data: {
        email: null,
        phone: null,
        website: null,
        gdprOpposedAt: new Date(),
      },
    });
  } else {
    await prisma.contact.update({
      where: { id: params.entityId },
      data: {
        emailPro: null,
        phonePro: null,
        linkedinUrl: null,
        contactStatus: "opposed",
        gdprOpposedAt: new Date(),
      },
    });
  }

  await logGdprAction({
    entityType: params.entityType,
    entityId: params.entityId,
    action: "anonymize",
    actor: params.actor,
  });
}

export async function purgeAllDemoData() {
  const isDev = process.env.APP_ENV !== "production";
  if (!isDev) {
    throw new Error("purgeAllDemoData is only allowed in development mode.");
  }

  await prisma.$transaction([
    prisma.emailDraft.deleteMany({ where: { isDemo: true } }),
    prisma.contact.deleteMany({ where: { isDemo: true } }),
    prisma.syndic.deleteMany({ where: { isDemo: true } }),
    prisma.copropriete.deleteMany({ where: { isDemo: true } }),
  ]);
}
