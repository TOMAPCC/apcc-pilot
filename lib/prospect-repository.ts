import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getClubTravauxProspects } from "./clubtravaux-leads";
import { getProspectPipelineStageKey, pipelineStageKeyToStatus, statusToPipelineStageKey } from "./pipeline";
import { getSheetProspects } from "./sheet-prospects";
import { buildWorkQueues } from "./work-queues";
import type { Appointment, BusinessLine, Campaign, ClientSummary, PipelineStageKey, Priority, Prospect, ProspectDocument, ProspectStatus, WorkQueue } from "./types";

const SYNC_TTL_MS = 5 * 60 * 1000;

const globalSyncState = globalThis as unknown as {
  apccLastExternalSyncAt?: number;
};

type ProspectWithRelations = Prisma.ProspectGetPayload<{
  include: {
    addresses: true;
    property: true;
    projects: true;
    source: true;
    campaign: true;
    appointments: true;
    client: true;
  };
}>;

export type ProspectUpdateInput = Partial<
  Pick<
    Prospect,
    | "civility"
    | "firstName"
    | "lastName"
    | "phone"
    | "secondaryPhone"
    | "email"
    | "address"
    | "worksiteAddress"
    | "postalCode"
    | "city"
    | "department"
    | "source"
    | "campaignId"
    | "pipelineStageKey"
    | "subStatus"
    | "lostReason"
    | "lostComment"
    | "lostCompetitor"
    | "lostAmount"
    | "reactivationDate"
    | "lastContactedAt"
    | "contactAttempts"
    | "businessLine"
    | "status"
    | "priority"
    | "score"
    | "estimatedBudget"
    | "expectedDecisionDate"
    | "nextAction"
    | "nextFollowUp"
    | "projectTypes"
    | "housingType"
    | "heatingSystem"
    | "maprimeCategory"
    | "comments"
  >
> & {
  appointmentStartsAt?: string;
  appointmentAddress?: string;
  appointmentNotes?: string;
  lossReason?: string;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPersistentCrmProspects() {
  await ensureDefaultCampaign();
  const prospects = await prisma.prospect.findMany({
    include: {
      addresses: true,
      property: true,
      projects: true,
      source: true,
      campaign: true,
      appointments: true,
      client: true
    },
    orderBy: { createdAt: "desc" }
  });

  return prospects.map(databaseProspectToProspect);
}

export async function getActiveCampaign(): Promise<Campaign> {
  const campaign = await ensureDefaultCampaign();

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    active: campaign.active,
    description: campaign.description ?? undefined
  };
}

export async function getPersistentWorkQueues(): Promise<WorkQueue[]> {
  const prospects = await getPersistentCrmProspects();
  return buildWorkQueues(prospects);
}

export async function getPersistentAppointments(): Promise<Appointment[]> {
  const appointments = await prisma.appointment.findMany({
    include: { prospect: { include: { source: true, projects: true } } },
    orderBy: { startsAt: "asc" }
  });

  return appointments.map((appointment) => ({
    id: appointment.id,
    prospectId: appointment.prospectId ?? "",
    owner: "Thomas Cauquil",
    title: appointment.title,
    startsAt: appointment.startsAt.toISOString(),
    address: appointment.address ?? "",
    template: appointment.template ?? "Rendez-vous APCC"
  }));
}

export async function getPersistentClients(): Promise<ClientSummary[]> {
  const clients = await prisma.client.findMany({
    include: {
      prospect: { include: { projects: true } },
      addresses: true,
      projects: true,
      documents: true
    },
    orderBy: { createdAt: "desc" }
  });

  return clients.map((client) => {
    const address = client.addresses[0];
    const projectTypes = client.projects.length
      ? client.projects.map((project) => project.type)
      : client.prospect?.projects.map((project) => project.type) ?? [];

    return {
      id: client.id,
      number: client.number,
      prospectId: client.prospectId ?? undefined,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: address?.line1 ?? "",
      postalCode: address?.postalCode ?? "",
      city: address?.city ?? "",
      projectTypes,
      documentsCount: client.documents.length,
      createdAt: client.createdAt.toISOString()
    };
  });
}

export async function syncExternalProspectsIfDue(force = false) {
  if (!isDatabaseConfigured()) {
    return { imported: 0, skipped: 0, mode: "fallback" as const };
  }

  const now = Date.now();
  if (!force && globalSyncState.apccLastExternalSyncAt && now - globalSyncState.apccLastExternalSyncAt < SYNC_TTL_MS) {
    return { imported: 0, skipped: 0, mode: "cached" as const };
  }

  const [sheetProspects, clubTravauxProspects] = await Promise.all([
    getSheetProspects(),
    Promise.resolve(getClubTravauxProspects())
  ]);
  const externalProspects = [...sheetProspects, ...clubTravauxProspects];

  let imported = 0;
  for (const prospect of externalProspects) {
    await upsertProspect(prospect);
    imported += 1;
  }

  globalSyncState.apccLastExternalSyncAt = now;
  return { imported, skipped: 0, mode: "database" as const };
}

export async function createManualProspect(input: ProspectUpdateInput) {
  const prospect = normalizeProspectInput({
    id: `manual-${crypto.randomUUID()}`,
    civility: "M.",
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
    address: input.address ?? input.worksiteAddress ?? "",
    worksiteAddress: input.worksiteAddress ?? input.address ?? "",
    postalCode: input.postalCode ?? "",
    city: input.city ?? "",
    department: input.department ?? input.postalCode?.slice(0, 2) ?? "",
    source: input.source ?? "Saisie manuelle",
    campaignId: input.campaignId,
    businessLine: input.businessLine ?? "Pompe a chaleur",
    assignedTo: "Thomas Cauquil",
    status: input.status ?? "Nouveau lead",
    pipelineStageKey: input.pipelineStageKey,
    subStatus: input.subStatus,
    lostReason: input.lostReason ?? input.lossReason,
    lostComment: input.lostComment,
    lostCompetitor: input.lostCompetitor,
    lostAmount: input.lostAmount,
    reactivationDate: input.reactivationDate,
    lastContactedAt: input.lastContactedAt,
    contactAttempts: input.contactAttempts ?? 0,
    priority: input.priority ?? "Normale",
    score: input.score ?? 50,
    estimatedBudget: input.estimatedBudget ?? 0,
    expectedDecisionDate: input.expectedDecisionDate,
    nextAction: input.nextAction ?? "Qualifier le lead",
    nextFollowUp: input.nextFollowUp ?? new Date().toISOString(),
    projectTypes: input.projectTypes?.length ? input.projectTypes : [input.businessLine ?? "Pompe a chaleur"],
    housingType: input.housingType ?? "",
    heatingSystem: input.heatingSystem,
    maprimeCategory: input.maprimeCategory,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: input.comments ?? ""
  });

  return upsertProspect(prospect, input);
}

export async function updatePersistentProspect(id: string, input: ProspectUpdateInput) {
  const existing = await prisma.prospect.findUnique({
    where: { id },
    include: {
      addresses: true,
      property: true,
      projects: true,
      source: true,
      campaign: true,
      appointments: true,
      client: true
    }
  });

  if (!existing) {
    return null;
  }

  const merged = {
    ...databaseProspectToProspect(existing),
    ...input,
    pipelineStageKey: input.pipelineStageKey ?? (input.status ? statusToPipelineStageKey(input.status) : databaseProspectToProspect(existing).pipelineStageKey),
    projectTypes: input.projectTypes?.length ? input.projectTypes : databaseProspectToProspect(existing).projectTypes,
    updatedAt: new Date().toISOString()
  };

  return upsertProspect(merged, input);
}

export async function findPersistentDuplicate(input: Pick<Prospect, "phone" | "email" | "lastName" | "postalCode" | "worksiteAddress">) {
  const prospects = await prisma.prospect.findMany({
    include: {
      addresses: true,
      property: true,
      projects: true,
      source: true,
      campaign: true,
      appointments: true,
      client: true
    }
  });

  return prospects.map(databaseProspectToProspect).find((prospect) => {
    return (
      normalize(prospect.phone) === normalize(input.phone) ||
      normalize(prospect.email) === normalize(input.email) ||
      `${normalize(prospect.lastName)}-${normalize(prospect.postalCode)}` === `${normalize(input.lastName)}-${normalize(input.postalCode)}` ||
      normalize(prospect.worksiteAddress) === normalize(input.worksiteAddress)
    );
  });
}

export async function getProspectDocuments(prospectId: string): Promise<ProspectDocument[]> {
  const client = await prisma.client.findUnique({ where: { prospectId } });
  if (!client) return [];

  const documents = await prisma.document.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" }
  });

  return documents.map(databaseDocumentToDocument);
}

export async function createProspectDocument(input: {
  prospectId: string;
  name: string;
  category: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}) {
  const client = await prisma.client.findUnique({ where: { prospectId: input.prospectId } });

  if (!client) {
    throw new Error("Le prospect doit d'abord etre valide en client avant de classer des documents.");
  }

  const document = await prisma.document.create({
    data: {
      clientId: client.id,
      name: `${input.category} - ${input.name}`,
      path: input.dataUrl,
      mimeType: `${input.mimeType};size=${input.size}`
    }
  });

  return databaseDocumentToDocument(document);
}

async function upsertProspect(prospect: Prospect, updateInput: ProspectUpdateInput = {}) {
  const normalized = normalizeProspectInput(prospect);
  const source = await prisma.leadSource.upsert({
    where: { name: normalized.source },
    create: { name: normalized.source },
    update: {}
  });
  const campaign = await resolveCampaign(normalized.campaignId);
  const nextPipelineStageKey = normalized.pipelineStageKey ?? statusToPipelineStageKey(normalized.status);
  const nextStatus = normalized.status ?? pipelineStageKeyToStatus(nextPipelineStageKey);

  const saved = await prisma.prospect.upsert({
    where: { id: normalized.id },
    create: {
      id: normalized.id,
      civility: normalized.civility,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      phone: normalized.phone,
      secondaryPhone: normalized.secondaryPhone,
      email: normalized.email,
      status: nextStatus,
      campaignId: campaign.id,
      pipelineStageKey: nextPipelineStageKey,
      subStatus: normalized.subStatus,
      lostReason: normalized.lostReason ?? updateInput.lossReason,
      lostComment: normalized.lostComment,
      lostCompetitor: normalized.lostCompetitor,
      lostAmount: normalized.lostAmount === undefined ? undefined : new Prisma.Decimal(normalized.lostAmount),
      reactivationDate: parseOptionalDate(normalized.reactivationDate),
      lastContactedAt: parseOptionalDate(normalized.lastContactedAt),
      contactAttempts: normalized.contactAttempts,
      priority: normalized.priority,
      score: normalized.score,
      estimatedBudget: new Prisma.Decimal(normalized.estimatedBudget),
      expectedDecisionDate: parseOptionalDate(normalized.expectedDecisionDate),
      nextAction: normalized.nextAction,
      nextFollowUp: parseOptionalDate(normalized.nextFollowUp),
      comments: normalized.comments,
      sourceId: source.id
    },
    update: {
      civility: normalized.civility,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      phone: normalized.phone,
      secondaryPhone: normalized.secondaryPhone,
      email: normalized.email,
      status: nextStatus,
      campaignId: campaign.id,
      pipelineStageKey: nextPipelineStageKey,
      subStatus: normalized.subStatus,
      lostReason: normalized.lostReason ?? updateInput.lossReason,
      lostComment: normalized.lostComment,
      lostCompetitor: normalized.lostCompetitor,
      lostAmount: normalized.lostAmount === undefined ? undefined : new Prisma.Decimal(normalized.lostAmount),
      reactivationDate: parseOptionalDate(normalized.reactivationDate),
      lastContactedAt: parseOptionalDate(normalized.lastContactedAt),
      contactAttempts: normalized.contactAttempts,
      priority: normalized.priority,
      score: normalized.score,
      estimatedBudget: new Prisma.Decimal(normalized.estimatedBudget),
      expectedDecisionDate: parseOptionalDate(normalized.expectedDecisionDate),
      nextAction: normalized.nextAction,
      nextFollowUp: parseOptionalDate(normalized.nextFollowUp),
      comments: normalized.comments,
      sourceId: source.id
    },
    include: {
      addresses: true,
      property: true,
      projects: true,
      source: true,
      campaign: true,
      appointments: true,
      client: true
    }
  });

  await replaceProspectDetails(saved.id, normalized, updateInput);

  const refreshed = await prisma.prospect.findUniqueOrThrow({
    where: { id: saved.id },
    include: {
      addresses: true,
      property: true,
      projects: true,
      source: true,
      campaign: true,
      appointments: true,
      client: true
    }
  });

  return databaseProspectToProspect(refreshed);
}

async function replaceProspectDetails(prospectId: string, prospect: Prospect, updateInput: ProspectUpdateInput) {
  await prisma.address.deleteMany({ where: { prospectId } });

  const addressWrites = [
    prospect.address
      ? prisma.address.create({
          data: {
            prospectId,
            label: "Adresse personnelle",
            line1: prospect.address,
            postalCode: prospect.postalCode,
            city: prospect.city,
            department: prospect.department
          }
        })
      : null,
    prospect.worksiteAddress
      ? prisma.address.create({
          data: {
            prospectId,
            label: "Adresse chantier",
            line1: prospect.worksiteAddress,
            postalCode: prospect.postalCode,
            city: prospect.city,
            department: prospect.department
          }
        })
      : null
  ].filter(Boolean) as Prisma.PrismaPromise<unknown>[];

  await Promise.all(addressWrites);

  await prisma.project.deleteMany({ where: { prospectId } });
  await Promise.all(
    prospect.projectTypes.map((type) =>
      prisma.project.create({
        data: {
          prospectId,
          type,
          description: prospect.businessLine
        }
      })
    )
  );

  await prisma.property.upsert({
    where: { prospectId },
    create: {
      prospectId,
      housingType: prospect.housingType,
      heatingSystem: prospect.heatingSystem,
      maprimeCategory: prospect.maprimeCategory
    },
    update: {
      housingType: prospect.housingType,
      heatingSystem: prospect.heatingSystem,
      maprimeCategory: prospect.maprimeCategory
    }
  });

  await syncAppointmentFromProspect(prospectId, prospect, updateInput);
  await syncClientFromProspect(prospectId, prospect);
  await recordProspectActivity(prospectId, prospect, updateInput);
}

async function syncAppointmentFromProspect(prospectId: string, prospect: Prospect, updateInput: ProspectUpdateInput) {
  const appointmentId = `appointment-${prospectId}`;

  if (prospect.status !== "Rendez-vous planifie") {
    await prisma.appointment.deleteMany({ where: { id: appointmentId } });
    return;
  }

  const startsAt = parseOptionalDate(updateInput.appointmentStartsAt) ?? tomorrowAtNine();
  const address = updateInput.appointmentAddress ?? prospect.worksiteAddress ?? prospect.address ?? `${prospect.postalCode} ${prospect.city}`;

  await prisma.appointment.upsert({
    where: { id: appointmentId },
    create: {
      id: appointmentId,
      prospectId,
      title: `${prospect.firstName} ${prospect.lastName} - ${prospect.businessLine}`,
      template: prospect.businessLine === "Prime Adapt" ? "RDV Prime Adapt" : "RDV pompe a chaleur",
      startsAt,
      address
    },
    update: {
      title: `${prospect.firstName} ${prospect.lastName} - ${prospect.businessLine}`,
      template: prospect.businessLine === "Prime Adapt" ? "RDV Prime Adapt" : "RDV pompe a chaleur",
      startsAt,
      address
    }
  });
}

async function syncClientFromProspect(prospectId: string, prospect: Prospect) {
  if (prospect.status !== "Dossier signe") {
    return;
  }

  const client = await prisma.client.upsert({
    where: { prospectId },
    create: {
      number: prospect.clientNumber ?? buildClientNumber(prospectId),
      prospectId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone
    },
    update: {
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone
    }
  });

  await prisma.address.deleteMany({ where: { clientId: client.id } });

  const line1 = prospect.worksiteAddress || prospect.address;
  if (line1) {
    await prisma.address.create({
      data: {
        clientId: client.id,
        label: "Adresse client",
        line1,
        postalCode: prospect.postalCode,
        city: prospect.city,
        department: prospect.department
      }
    });
  }

  await prisma.project.deleteMany({ where: { clientId: client.id } });
  await Promise.all(
    prospect.projectTypes.map((type) =>
      prisma.project.create({
        data: {
          clientId: client.id,
          type,
          description: prospect.businessLine
        }
      })
    )
  );
}

function databaseProspectToProspect(prospect: ProspectWithRelations): Prospect {
  const personalAddress = prospect.addresses.find((address) => address.label === "Adresse personnelle");
  const worksiteAddress = prospect.addresses.find((address) => address.label === "Adresse chantier") ?? personalAddress;
  const projectTypes = prospect.projects.map((project) => project.type);
  const businessLine = inferBusinessLine(projectTypes, prospect.projects[0]?.description);

  return {
    id: prospect.id,
    civility: (prospect.civility as Prospect["civility"]) ?? "M.",
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    phone: prospect.phone,
    secondaryPhone: prospect.secondaryPhone ?? undefined,
    email: prospect.email ?? "",
    address: personalAddress?.line1 ?? "",
    worksiteAddress: worksiteAddress?.line1 ?? "",
    postalCode: worksiteAddress?.postalCode ?? personalAddress?.postalCode ?? "",
    city: worksiteAddress?.city ?? personalAddress?.city ?? "",
    department: worksiteAddress?.department ?? personalAddress?.department ?? "",
    source: prospect.source?.name ?? "Saisie manuelle",
    campaignId: prospect.campaignId ?? undefined,
    campaignName: prospect.campaign?.name ?? undefined,
    businessLine,
    assignedTo: "Thomas Cauquil",
    status: prospect.status as ProspectStatus,
    pipelineStageKey: (prospect.pipelineStageKey as PipelineStageKey | null) ?? statusToPipelineStageKey(prospect.status as ProspectStatus),
    subStatus: prospect.subStatus ?? undefined,
    lostReason: prospect.lostReason ?? undefined,
    lostComment: prospect.lostComment ?? undefined,
    lostCompetitor: prospect.lostCompetitor ?? undefined,
    lostAmount: prospect.lostAmount === null ? undefined : Number(prospect.lostAmount),
    reactivationDate: prospect.reactivationDate?.toISOString(),
    lastContactedAt: prospect.lastContactedAt?.toISOString(),
    contactAttempts: prospect.contactAttempts,
    priority: prospect.priority as Priority,
    score: prospect.score,
    estimatedBudget: Number(prospect.estimatedBudget),
    expectedDecisionDate: prospect.expectedDecisionDate?.toISOString(),
    nextAction: prospect.nextAction ?? "",
    nextFollowUp: prospect.nextFollowUp?.toISOString() ?? prospect.createdAt.toISOString(),
    projectTypes: projectTypes.length ? projectTypes : [businessLine],
    housingType: prospect.property?.housingType ?? "",
    heatingSystem: prospect.property?.heatingSystem ?? undefined,
    maprimeCategory: prospect.property?.maprimeCategory ?? undefined,
    createdAt: prospect.createdAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
    comments: prospect.comments ?? "",
    clientNumber: prospect.client?.number ?? undefined
  };
}

function normalizeProspectInput(prospect: Prospect): Prospect {
  const pipelineStageKey = prospect.pipelineStageKey ?? statusToPipelineStageKey(prospect.status);

  return {
    ...prospect,
    email: prospect.email ?? "",
    address: prospect.address ?? "",
    worksiteAddress: prospect.worksiteAddress ?? "",
    postalCode: prospect.postalCode ?? "",
    city: prospect.city ?? "",
    department: prospect.department || prospect.postalCode?.slice(0, 2) || "",
    projectTypes: prospect.projectTypes?.length ? prospect.projectTypes : [prospect.businessLine],
    pipelineStageKey,
    status: pipelineStageKeyToStatus(pipelineStageKey) === "Nouveau lead" ? prospect.status : prospect.status,
    contactAttempts: prospect.contactAttempts ?? 0,
    housingType: prospect.housingType ?? "",
    nextAction: prospect.nextAction ?? "",
    nextFollowUp: prospect.nextFollowUp ?? new Date().toISOString(),
    comments: prospect.comments ?? ""
  };
}

async function ensureDefaultCampaign() {
  return prisma.campaign.upsert({
    where: { id: "campaign-historique-apcc" },
    create: {
      id: "campaign-historique-apcc",
      name: "Campagne historique APCC",
      status: "ACTIVE",
      active: true,
      description: "Campagne de reprise pour les leads importes avant la structuration multi-campagnes."
    },
    update: {
      active: true,
      status: "ACTIVE"
    }
  });
}

async function resolveCampaign(campaignId: string | undefined) {
  if (!campaignId) return ensureDefaultCampaign();

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  return campaign ?? ensureDefaultCampaign();
}

async function recordProspectActivity(prospectId: string, prospect: Prospect, updateInput: ProspectUpdateInput) {
  const shouldRecord = Boolean(updateInput.status || updateInput.pipelineStageKey || updateInput.lastContactedAt || updateInput.lossReason || updateInput.lostReason);
  if (!shouldRecord) return;

  await prisma.activity.create({
    data: {
      entityType: "Prospect",
      entityId: prospectId,
      prospectId,
      campaignId: prospect.campaignId,
      type: updateInput.status || updateInput.pipelineStageKey ? "pipeline.updated" : "prospect.updated",
      channel: updateInput.lastContactedAt ? "telephone" : undefined,
      direction: updateInput.lastContactedAt ? "outbound" : undefined,
      body: prospect.nextAction || prospect.comments || undefined,
      metadata: {
        status: prospect.status,
        pipelineStageKey: getProspectPipelineStageKey(prospect),
        lostReason: prospect.lostReason ?? updateInput.lossReason
      }
    }
  });
}

function inferBusinessLine(projectTypes: string[], description: string | null | undefined): BusinessLine {
  const value = `${description ?? ""} ${projectTypes.join(" ")}`.toLowerCase();
  return value.includes("prime adapt") || value.includes("pmr") ? "Prime Adapt" : "Pompe a chaleur";
}

function parseOptionalDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tomorrowAtNine() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

function normalize(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildClientNumber(prospectId: string) {
  const suffix = normalize(prospectId).slice(-6).toUpperCase().padStart(6, "0");
  return `APCC-${new Date().getFullYear()}-${suffix}`;
}

function databaseDocumentToDocument(document: {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  createdAt: Date;
}): ProspectDocument {
  const [mimeType, sizePart] = document.mimeType.split(";size=");

  return {
    id: document.id,
    name: document.name,
    category: document.name.includes(" - ") ? document.name.split(" - ")[0] : "Document",
    mimeType,
    size: Number(sizePart ?? 0),
    url: document.path,
    createdAt: document.createdAt.toISOString()
  };
}
