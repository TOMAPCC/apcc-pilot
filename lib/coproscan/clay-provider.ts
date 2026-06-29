import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { CLAY_CONTACT_ROLES } from "./types";
const CLAY_INGEST_WEBHOOK_URL = process.env.CLAY_INGEST_WEBHOOK_URL ?? "";
const CLAY_CALLBACK_SECRET = process.env.CLAY_CALLBACK_SECRET ?? "";
const CLAY_ENRICHMENT_ENABLED = process.env.CLAY_ENRICHMENT_ENABLED === "true";
const CLAY_MAX_DAILY_JOBS = parseInt(process.env.CLAY_MAX_DAILY_JOBS ?? "100", 10);

export function isClayConfigured(): boolean {
  return CLAY_ENRICHMENT_ENABLED && CLAY_INGEST_WEBHOOK_URL.length > 0 && CLAY_CALLBACK_SECRET.length > 0;
}

export interface ClayEnqueueResult {
  jobId: string;
  status: "sent" | "pending" | "skipped";
  reason?: string;
}

// Check daily job quota
async function checkDailyQuota(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await prisma.clayJob.count({
    where: {
      createdAt: { gte: today },
      status: { in: ["sent", "processing", "done"] },
    },
  });
  return count < CLAY_MAX_DAILY_JOBS;
}

// Enqueue a company enrichment job for a syndic
export async function enqueueCompanyEnrichment(syndicId: string): Promise<ClayEnqueueResult> {
  const syndic = await prisma.syndic.findUnique({ where: { id: syndicId } });
  if (!syndic) return { jobId: "", status: "skipped", reason: "syndic_not_found" };

  // Check opposition
  if (syndic.gdprOpposedAt) {
    return { jobId: "", status: "skipped", reason: "gdpr_opposition" };
  }

  if (!isClayConfigured()) {
    // Still create pending job for tracking even if Clay not configured
    const job = await prisma.clayJob.create({
      data: {
        syndicId,
        jobType: "company_enrichment",
        status: "pending",
        idempotencyKey: `company_${syndicId}_${Date.now()}`,
        requestPayload: {
          siren: syndic.siren,
          name: syndic.name,
          website: syndic.website,
        },
        gdprBasis: "legitimate_interest_b2b",
      },
    });
    return { jobId: job.id, status: "pending", reason: "clay_not_configured" };
  }

  const withinQuota = await checkDailyQuota();
  if (!withinQuota) {
    return { jobId: "", status: "skipped", reason: "daily_quota_reached" };
  }

  const idempotencyKey = `company_${syndicId}_${new Date().toISOString().substring(0, 10)}`;

  // Idempotent: don't create duplicate job for same syndic today
  const existing = await prisma.clayJob.findFirst({
    where: { syndicId, jobType: "company_enrichment", idempotencyKey },
  });
  if (existing) {
    return { jobId: existing.id, status: "skipped", reason: "already_enqueued_today" };
  }

  const job = await prisma.clayJob.create({
    data: {
      syndicId,
      jobType: "company_enrichment",
      status: "pending",
      idempotencyKey,
      webhookUrl: CLAY_INGEST_WEBHOOK_URL,
      requestPayload: {
        type: "company_enrichment",
        table: "APCC Syndic Accounts",
        syndic_id: syndicId,
        siren: syndic.siren,
        name: syndic.name,
        website: syndic.website,
        address: syndic.address,
        city: syndic.city,
        roles_to_find: CLAY_CONTACT_ROLES,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/clay/callback`,
      },
      gdprBasis: "legitimate_interest_b2b",
    },
  });

  // Send webhook to Clay
  try {
    const res = await fetch(CLAY_INGEST_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLAY_CALLBACK_SECRET}`,
        "X-Idempotency-Key": idempotencyKey,
        "X-Timestamp": new Date().toISOString(),
      },
      body: JSON.stringify(job.requestPayload),
    });

    if (!res.ok) {
      throw new Error(`Clay webhook returned ${res.status}`);
    }

    await prisma.clayJob.update({
      where: { id: job.id },
      data: {
        status: "sent",
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });

    await prisma.syndic.update({
      where: { id: syndicId },
      data: { enrichmentStatus: "in_progress" },
    });

    return { jobId: job.id, status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.clayJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: msg,
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });
    return { jobId: job.id, status: "pending", reason: `webhook_failed: ${msg}` };
  }
}

// Verify Clay callback signature (HMAC or Bearer)
export function verifyClayCallback(
  body: string,
  authHeader: string | null
): boolean {
  if (!CLAY_CALLBACK_SECRET) return false;

  // Bearer token mode
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7) === CLAY_CALLBACK_SECRET;
  }

  // HMAC mode
  if (authHeader?.startsWith("sha256=")) {
    const expected = "sha256=" + createHmac("sha256", CLAY_CALLBACK_SECRET)
      .update(body)
      .digest("hex");
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  return false;
}

// Process callback from Clay
export async function processClayCallback(payload: Record<string, unknown>): Promise<void> {
  const idempotencyKey = payload.idempotency_key as string | undefined;
  const jobId = payload.job_id as string | undefined;

  const job = await prisma.clayJob.findFirst({
    where: {
      OR: [
        idempotencyKey ? { idempotencyKey } : {},
        jobId ? { id: jobId } : {},
      ].filter((w) => Object.keys(w).length > 0),
    },
    include: { syndic: true },
  });

  if (!job) return;

  const status = payload.status as string;
  const success = status === "done" || status === "success";

  await prisma.clayJob.update({
    where: { id: job.id },
    data: {
      status: success ? "done" : "failed",
      resultPayload: payload as object,
      updatedAt: new Date(),
    },
  });

  if (!success) {
    await prisma.syndic.update({
      where: { id: job.syndicId },
      data: { enrichmentStatus: "failed" },
    });
    return;
  }

  // Extract contacts from Clay response
  const people = Array.isArray(payload.people) ? payload.people : [];
  for (const person of people) {
    const p = person as Record<string, unknown>;
    const emailRaw = p.email as string | undefined;
    const isEmailVerified =
      typeof p.email_verified === "boolean" ? p.email_verified : false;

    const contact = await prisma.contact.create({
      data: {
        syndicId: job.syndicId,
        firstName: (p.first_name as string) ?? null,
        lastName: (p.last_name as string) ?? "Contact Clay",
        role: (p.role as string) ?? null,
        emailPro: emailRaw ?? null,
        phonePro: (p.phone as string) ?? null,
        linkedinUrl: (p.linkedin_url as string) ?? null,
        contactStatus: isEmailVerified
          ? "verified"
          : emailRaw
          ? "probable_review"
          : "enrichment_required",
        emailVerified: isEmailVerified,
        sourceProvider: "clay",
        sourceUrl: (p.source_url as string) ?? null,
        sourceDate: new Date(),
        relevanceScore: scoreRole((p.role as string) ?? ""),
        isDemo: false,
      },
    });

    await prisma.contactProof.create({
      data: {
        contactId: contact.id,
        provider: "clay",
        sourceType: "clay_waterfall",
        rawData: p as object,
        confidence: isEmailVerified ? 0.9 : 0.6,
        verifiedAt: isEmailVerified ? new Date() : null,
      },
    });
  }

  // Update syndic company data
  const company = payload.company as Record<string, unknown> | undefined;
  if (company) {
    await prisma.syndic.update({
      where: { id: job.syndicId },
      data: {
        website: (company.website as string) ?? job.syndic.website,
        phone: (company.phone as string) ?? job.syndic.phone,
        enrichmentStatus: "done",
        enrichedAt: new Date(),
      },
    });
  } else {
    await prisma.syndic.update({
      where: { id: job.syndicId },
      data: { enrichmentStatus: "done", enrichedAt: new Date() },
    });
  }
}

function scoreRole(role: string): number {
  const r = role.toLowerCase();
  if (r.includes("direct")) return 1.0;
  if (r.includes("responsable copro")) return 0.95;
  if (r.includes("principal")) return 0.9;
  if (r.includes("gestionnaire copro")) return 0.85;
  if (r.includes("direct") && r.includes("agence")) return 0.8;
  if (r.includes("technique")) return 0.7;
  if (r.includes("patrimoine") || r.includes("énergie")) return 0.65;
  if (r.includes("gérant") || r.includes("dirigeant")) return 0.6;
  return 0.3;
}
