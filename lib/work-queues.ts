import { getProspectPipelineStageKey } from "./pipeline";
import type { Prospect, WorkQueue } from "./types";

export function buildWorkQueues(prospects: Prospect[]): WorkQueue[] {
  const today = startOfToday().getTime();
  const activeProspects = prospects.filter((prospect) => prospect.status !== "Dossier signe" && prospect.status !== "Dossier perdu");
  const dueToday = activeProspects.filter((prospect) => Date.parse(prospect.nextFollowUp) <= today + 86_399_999);
  const overdue = activeProspects.filter((prospect) => Date.parse(prospect.nextFollowUp) < today);
  const noAnswer = activeProspects.filter((prospect) => prospect.status === "N'a pas repondu");
  const quoteFollowUp = prospects.filter((prospect) => prospect.status === "Devis envoye" || getProspectPipelineStageKey(prospect) === "etude-proposition");
  const appointments = prospects.filter((prospect) => prospect.status === "Rendez-vous planifie" || getProspectPipelineStageKey(prospect) === "rendez-vous");
  const wonWithoutClientNumber = prospects.filter((prospect) => prospect.status === "Dossier signe" && !prospect.clientNumber);

  return [
    makeQueue("today", "A traiter aujourd'hui", "Relances et qualifications avec echeance aujourd'hui.", "/prospects?sort=recent", dueToday),
    makeQueue("overdue", "En retard", "Prospects actifs dont la prochaine action est depassee.", "/prospects?sort=recent", overdue),
    makeQueue("no-answer", "Injoignables", "Leads marques n'a pas repondu, a relancer proprement.", "/prospects?status=N%27a+pas+repondu", noAnswer),
    makeQueue("appointments", "Rendez-vous qualifies", "RDV planifies a preparer ou confirmer.", "/appointments", appointments),
    makeQueue("quotes", "Devis a relancer", "Etudes et propositions qui doivent avancer.", "/prospects?status=Devis+envoye", quoteFollowUp),
    makeQueue("client-validation", "Clients a consolider", "Dossiers signes a verifier cote client/documents.", "/clients", wonWithoutClientNumber)
  ];
}

function makeQueue(id: string, title: string, description: string, href: string, prospects: Prospect[]): WorkQueue {
  const sorted = [...prospects].sort((a, b) => Date.parse(a.nextFollowUp) - Date.parse(b.nextFollowUp));

  return {
    id,
    title,
    description,
    href,
    count: sorted.length,
    urgentCount: sorted.filter((prospect) => prospect.priority === "Haute" || prospect.priority === "Urgente").length,
    prospects: sorted.slice(0, 8)
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
