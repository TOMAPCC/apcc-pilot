import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import { isClayConfigured } from "@/lib/coproscan/clay-provider";

export async function GET() {
  const [
    confirmed,
    probable,
    unknown,
    nonTarget,
    syndicTotal,
    syndicWithContacts,
    clayDone,
    clayPartial,
    clayFailed,
    contactsVerified,
    contactsToEnrich,
    draftsGenerated,
    batches,
  ] = await Promise.all([
    prisma.copropriete.count({
      where: { isDemo: false, department: { in: TARGET_DEPARTMENTS }, classificationStatus: "confirmed", energyClass: { in: ["E", "F", "G"] } },
    }),
    prisma.copropriete.count({
      where: { isDemo: false, department: { in: TARGET_DEPARTMENTS }, classificationStatus: "probable", energyClass: { in: ["E", "F", "G"] } },
    }),
    prisma.copropriete.count({
      where: { isDemo: false, department: { in: TARGET_DEPARTMENTS }, classificationStatus: "unknown" },
    }),
    prisma.copropriete.count({
      where: { isDemo: false, department: { in: TARGET_DEPARTMENTS }, classificationStatus: "non_target" },
    }),
    prisma.syndic.count({ where: { isDemo: false } }),
    prisma.syndic.count({
      where: {
        isDemo: false,
        contacts: { some: { contactStatus: { in: ["verified", "public_professional"] } } },
      },
    }),
    prisma.clayJob.count({ where: { status: "done" } }),
    prisma.clayJob.count({ where: { status: { in: ["sent", "processing"] } } }),
    prisma.clayJob.count({ where: { status: "failed" } }),
    prisma.contact.count({ where: { isDemo: false, contactStatus: { in: ["verified", "public_professional"] } } }),
    prisma.contact.count({ where: { isDemo: false, contactStatus: "enrichment_required" } }),
    prisma.emailDraft.count({ where: { isDemo: false, draftStatus: { not: "sent" } } }),
    prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        source: true,
        department: true,
        status: true,
        recordsImported: true,
        recordsTotal: true,
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  const missingConfig: string[] = [];
  if (!isClayConfigured()) missingConfig.push("Clay (CLAY_INGEST_WEBHOOK_URL, CLAY_CALLBACK_SECRET, CLAY_ENRICHMENT_ENABLED=true)");
  if (!process.env.APCC_SALES_NAME) missingConfig.push("APCC_SALES_NAME");
  if (!process.env.BOOKING_URL) missingConfig.push("BOOKING_URL");
  if (!process.env.SIRENE_API_KEY) missingConfig.push("SIRENE_API_KEY");

  return NextResponse.json({
    rnic: { confirmed, probable, unknown, nonTarget, total: confirmed + probable + unknown + nonTarget },
    syndics: { total: syndicTotal, withContacts: syndicWithContacts },
    clay: { done: clayDone, processing: clayPartial, failed: clayFailed },
    contacts: { verified: contactsVerified, toEnrich: contactsToEnrich },
    emailDrafts: draftsGenerated,
    recentBatches: batches,
    missingConfig,
    clayConfigured: isClayConfigured(),
    productionMode: process.env.APP_ENV === "production" && process.env.DEMO_MODE !== "true",
  });
}
