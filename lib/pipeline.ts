import type { PipelineStage, PipelineStageKey, Prospect, ProspectStatus } from "./types";

export const pipelineStages: PipelineStage[] = [
  { id: "nouveau", name: "Nouveaux", status: "Nouveau lead", probability: 10 },
  { id: "a-contacter", name: "A contacter", status: "A contacter", probability: 22 },
  { id: "contact-en-cours", name: "Contact en cours", status: "Contact etabli", probability: 35 },
  { id: "rendez-vous", name: "Rendez-vous", status: "Rendez-vous planifie", probability: 50 },
  { id: "etude-proposition", name: "Etude / proposition", status: "Devis envoye", probability: 65 },
  { id: "negociation", name: "Negociation", status: "Negociation", probability: 82 },
  { id: "gagne", name: "Gagnes", status: "Dossier signe", probability: 100 },
  { id: "perdu", name: "Perdus", status: "Dossier perdu", probability: 0 }
];

export function statusToPipelineStageKey(status: ProspectStatus): PipelineStageKey {
  if (status === "Nouveau lead" || status === "A qualifier") return "nouveau";
  if (status === "A contacter") return "a-contacter";
  if (status === "N'a pas repondu" || status === "Contact etabli") return "contact-en-cours";
  if (status === "Rendez-vous planifie") return "rendez-vous";
  if (status === "Devis envoye") return "etude-proposition";
  if (status === "Negociation") return "negociation";
  if (status === "Dossier signe") return "gagne";
  return "perdu";
}

export function pipelineStageKeyToStatus(stageKey: PipelineStageKey): ProspectStatus {
  return pipelineStages.find((stage) => stage.id === stageKey)?.status ?? "Nouveau lead";
}

export function getProspectPipelineStageKey(prospect: Pick<Prospect, "pipelineStageKey" | "status">): PipelineStageKey {
  return prospect.pipelineStageKey ?? statusToPipelineStageKey(prospect.status);
}
