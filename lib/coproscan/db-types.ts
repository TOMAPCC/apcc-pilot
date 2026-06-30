// Plain TypeScript types mirroring Prisma query shapes.
// Used by server components to avoid dependency on generated Prisma client types.

export interface CoproprieteRow {
  id: string;
  rnicId: string | null;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  department: string;
  latitude: number | null;
  longitude: number | null;
  lotsCount: number | null;
  lotsResidential: number | null;
  constructionYear: number | null;
  heatingType: string | null;
  heatingCollective: boolean | null;
  energyClass: string | null;
  classificationStatus: string;
  classificationScore: number;
  classificationConfidence: number;
  isDemo: boolean;
  dataOrigin: string;
  sourceType: string;
  gdprOpposedAt: Date | null;
  syndicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  syndic?: { id: string; name: string; enrichmentStatus?: string } | null;
  _count: { dpeProofs: number; energyProofs?: number; emailDrafts?: number; interactions?: number };
}

export interface SyndicRow {
  id: string;
  siren: string | null;
  siret: string | null;
  name: string;
  brandName: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  enrichmentStatus: string;
  enrichedAt: Date | null;
  isDemo: boolean;
  gdprOpposedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coproprietes?: CoproprieteRow[];
  contacts?: ContactRow[];
  clayJobs?: ClayJobRow[];
  _count?: { coproprietes: number; contacts: number; clayJobs: number };
  interactions?: InteractionRow[];
}

export interface ContactRow {
  id: string;
  syndicId: string;
  syndic: { id: string; name: string; siren: string | null };
  firstName: string | null;
  lastName: string;
  role: string | null;
  emailPro: string | null;
  phonePro: string | null;
  linkedinUrl: string | null;
  contactStatus: string;
  emailVerified: boolean;
  sourceProvider: string | null;
  sourceUrl: string | null;
  sourceDate: Date | null;
  relevanceScore: number;
  gdprOpposedAt: Date | null;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { contactProofs: number; emailDrafts: number };
}

export interface ClayJobRow {
  id: string;
  syndicId: string;
  syndic: { name: string; siren?: string | null };
  jobType: string;
  status: string;
  idempotencyKey: string;
  requestPayload: unknown;
  resultPayload: unknown;
  errorMessage: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  gdprBasis: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDraftRow {
  id: string;
  coproprieteId: string | null;
  copropriete?: { name: string; city: string; energyClass: string | null } | null;
  syndicId: string | null;
  contactId: string | null;
  contact?: { firstName: string | null; lastName: string; emailPro: string | null } | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  subjectVariants: unknown;
  claims: unknown;
  draftStatus: string;
  followUpJ4: string | null;
  followUpJ9: string | null;
  followUpJ15: string | null;
  proposedSlots: unknown;
  bookingUrl: string | null;
  oppositionCheckedAt: Date | null;
  gmailDraftId: string | null;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportBatchRow {
  id: string;
  source: string;
  department: string | null;
  status: string;
  recordsTotal: number;
  recordsImported: number;
  recordsUpdated: number;
  recordsRejected: number;
  recordsSkipped: number;
  errorLog: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  _count?: { rejections?: number };
}

export interface OppositionRow {
  id: string;
  entityType: string;
  entityId: string | null;
  email: string | null;
  phone: string | null;
  siren: string | null;
  reason: string | null;
  source: string;
  opposedAt: Date;
}

export interface GdprLogRow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string | null;
  details: unknown;
  createdAt: Date;
}

export interface InteractionRow {
  id: string;
  coproprieteId: string | null;
  syndicId: string | null;
  contactId: string | null;
  type: string;
  direction: string | null;
  outcome: string | null;
  notes: string | null;
  occurredAt: Date;
  createdAt: Date;
}
