import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";
import CoproScanDashboard from "./CoproScanDashboard";
import type { DashboardData } from "./CoproScanDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawCopro = {
  id: string; name: string; address: string; city: string; department: string;
  energyClass: string | null; classificationConfidence: number;
  lotsResidential: number | null; lotsCount: number | null;
  classificationScore: number;
  syndic: { id: string; name: string } | null;
  _count: { dpeProofs: number; emailDrafts?: number; energyProofs?: number };
};

type RawSyndic = {
  id: string; name: string; city: string | null; siren: string | null;
  _count: { coproprietes: number; contacts: number; clayJobs: number };
};

type RawClayJob = {
  id: string; jobType: string; status: string; createdAt: Date;
  syndic: { name: string };
};

type RawContact = {
  id: string; firstName: string | null; lastName: string; role: string | null;
  emailPro: string | null; contactStatus: string; emailVerified: boolean;
  syndic: { name: string };
};

type RawDraft = {
  id: string; subject: string; draftStatus: string; createdAt: Date;
  contact: { emailPro: string | null } | null;
  copropriete: { name: string } | null;
};

type RawPipelineSyndic = {
  id: string; name: string; city: string | null;
  _count: { coproprietes: number; contacts: number; clayJobs: number };
  interactions: { type: string; outcome: string | null; occurredAt: Date }[];
};

type RawBatch = {
  id: string; source: string; department: string | null; status: string;
  recordsImported: number; recordsUpdated: number; recordsRejected: number;
  createdAt: Date; startedAt: Date | null; completedAt: Date | null;
};

type RawOpposition = {
  id: string; entityType: string; email: string | null;
  siren: string | null; reason: string | null; source: string; opposedAt: Date;
};

type RawGdprLog = {
  id: string; entityType: string; entityId: string;
  action: string; actor: string | null; createdAt: Date;
};

type ClassGroupRow = { energyClass: string | null; _count: { _all: number } };

export default async function CoproScanPage() {
  const depts = TARGET_DEPARTMENTS;
  const efgIn = ["E", "F", "G"];
  const isProduction = process.env.APP_ENV === "production" && process.env.DEMO_MODE !== "true";

  let confirmedList: unknown[] = [], probableList: unknown[] = [], unknownList: unknown[] = [],
    topSyndics: unknown[] = [], classGroupBy: unknown[] = [], clayJobsList: unknown[] = [],
    contactsList: unknown[] = [], draftsList: unknown[] = [], pipelineSyndics: unknown[] = [],
    batchList: unknown[] = [], oppositionList: unknown[] = [], gdprLogList: unknown[] = [],
    contactsOpposed = 0, syndicsOpposed = 0,
    confirmedCount = 0, probableCount = 0, unknownCount = 0,
    syndicCount = 0, contactCount = 0, draftCount = 0;

  try {
  [
    confirmedList,
    probableList,
    unknownList,
    topSyndics,
    classGroupBy,
    clayJobsList,
    contactsList,
    draftsList,
    pipelineSyndics,
    batchList,
    oppositionList,
    gdprLogList,
    contactsOpposed,
    syndicsOpposed,
    confirmedCount,
    probableCount,
    unknownCount,
    syndicCount,
    contactCount,
    draftCount,
  ] = await Promise.all([
    prisma.copropriete.findMany({
      where: { isDemo: false, department: { in: depts }, classificationStatus: "confirmed", energyClass: { in: efgIn } },
      include: { syndic: { select: { id: true, name: true } }, _count: { select: { dpeProofs: true, emailDrafts: true } } },
      orderBy: [{ classificationScore: "desc" }, { lotsResidential: "desc" }],
      take: 50,
    }),
    prisma.copropriete.findMany({
      where: { isDemo: false, department: { in: depts }, classificationStatus: "probable" },
      include: { syndic: { select: { id: true, name: true } }, _count: { select: { dpeProofs: true } } },
      orderBy: { classificationConfidence: "desc" },
      take: 30,
    }),
    prisma.copropriete.findMany({
      where: { isDemo: false, department: { in: depts }, classificationStatus: "unknown" },
      include: { syndic: { select: { id: true, name: true } }, _count: { select: { dpeProofs: true, energyProofs: true } } },
      orderBy: { lotsResidential: "desc" },
      take: 30,
    }),
    prisma.syndic.findMany({
      where: { isDemo: false, gdprOpposedAt: null },
      include: { _count: { select: { coproprietes: true, contacts: true, clayJobs: true } } },
      take: 20,
    }),
    prisma.copropriete.groupBy({
      by: ["energyClass"],
      where: { isDemo: false, department: { in: depts }, classificationStatus: "confirmed", energyClass: { in: efgIn } },
      _count: { _all: true },
    }),
    prisma.clayJob.findMany({
      include: { syndic: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.contact.findMany({
      where: { isDemo: false, gdprOpposedAt: null },
      include: { syndic: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.emailDraft.findMany({
      include: { contact: { select: { emailPro: true } }, copropriete: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.syndic.findMany({
      where: {
        isDemo: false, gdprOpposedAt: null,
        coproprietes: { some: { department: { in: depts }, classificationStatus: "confirmed", energyClass: { in: efgIn }, isDemo: false } },
      },
      include: {
        _count: { select: { coproprietes: true, contacts: true, clayJobs: true } },
        interactions: { orderBy: { occurredAt: "desc" }, take: 1, select: { type: true, outcome: true, occurredAt: true } },
      },
      take: 100,
    }),
    prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.oppositionList.findMany({ orderBy: { opposedAt: "desc" }, take: 20 }),
    prisma.gdprLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.contact.count({ where: { gdprOpposedAt: { not: null } } }),
    prisma.syndic.count({ where: { gdprOpposedAt: { not: null } } }),
    prisma.copropriete.count({ where: { isDemo: false, department: { in: depts }, classificationStatus: "confirmed", energyClass: { in: efgIn } } }),
    prisma.copropriete.count({ where: { isDemo: false, department: { in: depts }, classificationStatus: "probable" } }),
    prisma.copropriete.count({ where: { isDemo: false, department: { in: depts }, classificationStatus: "unknown" } }),
    prisma.syndic.count({ where: { isDemo: false, gdprOpposedAt: null } }),
    prisma.contact.count({ where: { isDemo: false, gdprOpposedAt: null } }),
    prisma.emailDraft.count(),
  ]);
  } catch {
    // DB unavailable — serve empty dashboard
  }

  const confirmed = (confirmedList as RawCopro[]).map((c) => ({
    id: c.id, name: c.name, address: c.address, city: c.city, department: c.department,
    energyClass: c.energyClass, classificationConfidence: c.classificationConfidence,
    lotsResidential: c.lotsResidential, lotsCount: c.lotsCount,
    syndic: c.syndic,
    dpeProofsCount: c._count.dpeProofs,
    emailDraftsCount: c._count.emailDrafts ?? 0,
  }));

  const probable = (probableList as RawCopro[]).map((c) => ({
    id: c.id, name: c.name, address: c.address, city: c.city,
    energyClass: c.energyClass, classificationConfidence: c.classificationConfidence,
    dpeProofsCount: c._count.dpeProofs, syndic: c.syndic,
  }));

  const unknown = (unknownList as RawCopro[]).map((c) => ({
    id: c.id, name: c.name, address: c.address, city: c.city,
    lotsResidential: c.lotsResidential, lotsCount: c.lotsCount,
    syndic: c.syndic,
    dpeProofsCount: c._count.dpeProofs,
    energyProofsCount: c._count.energyProofs ?? 0,
  }));

  const syndics = (topSyndics as RawSyndic[]).map((s) => ({
    id: s.id, name: s.name, city: s.city, siren: s.siren,
    copropCount: s._count.coproprietes,
    contactsCount: s._count.contacts,
    clayJobsCount: s._count.clayJobs,
  }));

  const classRows = classGroupBy as ClassGroupRow[];
  const classCounts = {
    G: classRows.find((r) => r.energyClass === "G")?._count._all ?? 0,
    F: classRows.find((r) => r.energyClass === "F")?._count._all ?? 0,
    E: classRows.find((r) => r.energyClass === "E")?._count._all ?? 0,
  };

  const clayJobs = (clayJobsList as RawClayJob[]).map((j) => ({
    id: j.id, jobType: j.jobType, status: j.status,
    syndicName: j.syndic?.name ?? "",
    createdAt: j.createdAt.toISOString(),
  }));

  const contacts = (contactsList as RawContact[]).map((c) => ({
    id: c.id, firstName: c.firstName, lastName: c.lastName, role: c.role,
    emailPro: c.emailPro, contactStatus: c.contactStatus, emailVerified: c.emailVerified,
    syndicName: c.syndic?.name ?? "",
  }));

  const drafts = (draftsList as RawDraft[]).map((d) => ({
    id: d.id, subject: d.subject, draftStatus: d.draftStatus,
    contactEmail: d.contact?.emailPro ?? null,
    copropName: d.copropriete?.name ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  const pipeline = (pipelineSyndics as RawPipelineSyndic[]).map((s) => ({
    id: s.id, name: s.name, city: s.city,
    copropCount: s._count.coproprietes,
    contactsCount: s._count.contacts,
    lastInteractionType: s.interactions[0]?.type ?? null,
    lastInteractionDate: s.interactions[0]?.occurredAt.toISOString() ?? null,
    lastInteractionOutcome: s.interactions[0]?.outcome ?? null,
  }));

  const batches = (batchList as RawBatch[]).map((b) => ({
    id: b.id, source: b.source, department: b.department, status: b.status,
    recordsImported: b.recordsImported, recordsUpdated: b.recordsUpdated, recordsRejected: b.recordsRejected,
    createdAt: b.createdAt.toISOString(),
    startedAt: b.startedAt?.toISOString() ?? null,
    completedAt: b.completedAt?.toISOString() ?? null,
  }));

  const oppositions = (oppositionList as RawOpposition[]).map((o) => ({
    id: o.id, entityType: o.entityType, email: o.email, siren: o.siren,
    reason: o.reason, source: o.source, opposedAt: o.opposedAt.toISOString(),
  }));

  const gdprLogs = (gdprLogList as RawGdprLog[]).map((l) => ({
    id: l.id, entityType: l.entityType, entityId: l.entityId,
    action: l.action, actor: l.actor, createdAt: l.createdAt.toISOString(),
  }));

  const data: DashboardData = {
    isProduction,
    departments: [...depts],
    metrics: {
      confirmed: confirmedCount as number,
      probable: probableCount as number,
      unknown: unknownCount as number,
      syndics: syndicCount as number,
      contacts: contactCount as number,
      drafts: draftCount as number,
      contactsOpposed: contactsOpposed as number,
      syndicsOpposed: syndicsOpposed as number,
    },
    classCounts,
    confirmed,
    probable,
    unknown,
    syndics,
    clayJobs,
    contacts,
    drafts,
    pipeline,
    batches,
    oppositions,
    gdprLogs,
  };

  return <CoproScanDashboard data={data} />;
}
