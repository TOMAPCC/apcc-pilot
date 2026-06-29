// Classification EFG statuses
export type ClassificationStatus = "confirmed" | "probable" | "unknown" | "non_target";

// Contact validation states
export type ContactStatus =
  | "verified"
  | "public_professional"
  | "probable_review"
  | "enrichment_required"
  | "invalid"
  | "opposed";

// Email draft workflow
export type DraftStatus = "generated" | "reviewed" | "approved" | "draft_created" | "sent";

// Clay job types
export type ClayJobType = "company_enrichment" | "people_search" | "email_waterfall";

// Clay job statuses
export type ClayJobStatus = "pending" | "sent" | "processing" | "done" | "failed";

// Import batch sources
export type ImportSource = "rnic" | "bdnb" | "dpe_ademe" | "sirene" | "manual";

// Syndic enrichment statuses
export type EnrichmentStatus = "pending" | "in_progress" | "done" | "failed" | "skipped";

export interface EfgSummary {
  confirmed: number;
  probable: number;
  unknown: number;
  nonTarget: number;
  total: number;
}

export interface SyndicPortfolio {
  syndicId: string;
  name: string;
  siren?: string | null;
  totalCoproprietes: number;
  efgConfirmed: number;
  efgProbable: number;
  totalLots: number;
  departments: string[];
  enrichmentStatus: string;
  contactCount: number;
}

export interface ClaimWithProof {
  claim: string;
  source: string;
  reference?: string;
  date?: string;
  url?: string;
}

// Roles searched in Clay (ordered by priority)
export const CLAY_CONTACT_ROLES = [
  "Directeur copropriété",
  "Responsable copropriété",
  "Principal copropriété",
  "Gestionnaire copropriété",
  "Directeur d'agence",
  "Responsable technique",
  "Responsable patrimoine",
  "Responsable énergie",
  "Dirigeant",
  "Gérant",
] as const;

// Departments targeted
export const TARGET_DEPARTMENTS = (process.env.COPROSCAN_TARGET_DEPARTMENTS ?? "30,34").split(",").map((d) => d.trim());

// EFG energy classes targeted commercially
export const EFG_CLASSES = ["E", "F", "G"] as const;

// Confidence thresholds
export const CONFIDENCE_CONFIRMED = parseFloat(process.env.COPROSCAN_EFG_CONFIDENCE_CONFIRMED ?? "0.80");
export const CONFIDENCE_PROBABLE = parseFloat(process.env.COPROSCAN_EFG_CONFIDENCE_PROBABLE ?? "0.65");

export function isProductionMode(): boolean {
  return process.env.APP_ENV === "production" && process.env.DEMO_MODE !== "true";
}
