import { fetchAllSheetLeads } from "./sheets-import";
import type { ImportedLead } from "./sheets-import";
import type { Priority, Prospect, ProspectStatus } from "./types";
import { getClubTravauxProspects } from "./clubtravaux-leads";

export async function getSheetProspects() {
  const leads = await fetchAllSheetLeads();
  return leads.map(importedLeadToProspect);
}

export async function getCrmProspects() {
  const sheetProspects = await getSheetProspects();
  const clubTravauxProspects = getClubTravauxProspects();

  return [...sheetProspects, ...clubTravauxProspects].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function importedLeadToProspect(lead: ImportedLead): Prospect {
  const status = inferStatus(lead);
  const projectType = normalizeProject(lead.project);

  return {
    id: `${lead.businessLine === "Prime Adapt" ? "sheet-prime-adapt" : "sheet-pac"}-${lead.rowNumber}`,
    civility: "M.",
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    email: lead.email,
    address: "",
    worksiteAddress: "",
    postalCode: lead.postalCode,
    city: inferCityLabel(lead.postalCode),
    department: lead.postalCode.slice(0, 2),
    source: lead.source,
    businessLine: lead.businessLine,
    assignedTo: "A attribuer",
    status,
    priority: inferPriority(lead),
    score: inferScore(lead),
    estimatedBudget: 0,
    nextAction: inferNextAction(lead, status),
    nextFollowUp: lead.entryDate,
    projectTypes: [projectType],
    housingType: cleanEligibilityText(lead.housing),
    heatingSystem: cleanEligibilityText(lead.heating),
    createdAt: normalizeDate(lead.entryDate),
    updatedAt: normalizeDate(lead.entryDate),
    comments: lead.comment
  };
}

export function getSheetDashboardMetrics(prospects: Prospect[]) {
  const newProspects = prospects.filter((prospect) => prospect.status === "Nouveau lead").length;
  const appointments = prospects.filter((prospect) => prospect.status === "Rendez-vous planifie").length;
  const toContact = prospects.filter((prospect) => prospect.status === "A contacter").length;
  const lost = prospects.filter((prospect) => prospect.status === "Dossier perdu").length;

  return {
    totalLeads: prospects.length,
    newProspects,
    toContact,
    appointments,
    lost,
    duplicates: 0
  };
}

function inferStatus(lead: ImportedLead): ProspectStatus {
  const comment = lead.comment.toLowerCase();

  if (comment.includes("rdv")) {
    return "Rendez-vous planifie";
  }

  if (
    comment.includes("faux") ||
    comment.includes("hors cible") ||
    comment.includes("plus d'actualité") ||
    comment.includes("plus 'actualité") ||
    comment.includes("ne souhaite rien") ||
    comment.includes("voulait du 1")
  ) {
    return "Dossier perdu";
  }

  if (comment.includes("nrp") || comment.includes("rappeler") || comment.includes("mail")) {
    return "A contacter";
  }

  return "Nouveau lead";
}

function inferPriority(lead: ImportedLead): Priority {
  const comment = lead.comment.toLowerCase();

  if (comment.includes("rdv")) {
    return "Haute";
  }

  if (comment.includes("nrp x3") || comment.includes("faux") || comment.includes("hors cible")) {
    return "Basse";
  }

  return "Normale";
}

function inferScore(lead: ImportedLead) {
  let score = 50;
  const text = `${lead.housing} ${lead.situation} ${lead.heating} ${lead.comment}`.toLowerCase();

  if (text.includes("éligible")) score += 15;
  if (text.includes("propriétaire")) score += 10;
  if (text.includes("fioul") || text.includes("gaz")) score += 10;
  if (text.includes("rdv")) score += 15;
  if (text.includes("hors cible") || text.includes("faux")) score -= 35;

  return Math.max(0, Math.min(100, score));
}

function inferNextAction(lead: ImportedLead, status: ProspectStatus) {
  if (status === "Rendez-vous planifie") {
    return "Confirmer le rendez-vous et preparer l'etude";
  }

  if (status === "Dossier perdu") {
    return "Verifier motif de perte";
  }

  if (lead.comment.toLowerCase().includes("nrp")) {
    return "Relancer telephone, SMS et e-mail";
  }

  return "Qualifier le lead";
}

function normalizeProject(project: string) {
  if (project.toLowerCase().includes("prime adapt")) {
    return "Prime Adapt - salle de bain PMR";
  }

  return cleanEligibilityText(project || "Pompe a chaleur").replace("Pompe à chaleur", "Pompe a chaleur");
}

function cleanEligibilityText(value: string) {
  return value.replaceAll("_", " ").replace("(éligible)", "").replace("(non éligible)", "non eligible").trim();
}

function normalizeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function inferCityLabel(postalCode: string) {
  return postalCode ? `CP ${postalCode}` : "Ville non renseignee";
}
