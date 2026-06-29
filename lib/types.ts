export type RoleName =
  | "Administrateur"
  | "Direction"
  | "Responsable commercial"
  | "Commercial"
  | "Conducteur de travaux"
  | "Technicien"
  | "Assistant administratif";

export type Priority = "Basse" | "Normale" | "Haute" | "Urgente";

export type BusinessLine = "Pompe a chaleur" | "Prime Adapt";

export type ProspectStatus =
  | "Nouveau lead"
  | "A qualifier"
  | "A contacter"
  | "N'a pas repondu"
  | "Contact etabli"
  | "Rendez-vous planifie"
  | "Devis envoye"
  | "Negociation"
  | "Dossier signe"
  | "Dossier perdu";

export type PipelineStageKey =
  | "nouveau"
  | "a-contacter"
  | "contact-en-cours"
  | "rendez-vous"
  | "etude-proposition"
  | "negociation"
  | "gagne"
  | "perdu";

export type Campaign = {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | string;
  active: boolean;
  description?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
};

export type Prospect = {
  id: string;
  civility: "M." | "Mme" | "M. et Mme";
  firstName: string;
  lastName: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  address: string;
  worksiteAddress: string;
  postalCode: string;
  city: string;
  department: string;
  source: string;
  campaignId?: string;
  campaignName?: string;
  businessLine: BusinessLine;
  assignedTo: string;
  status: ProspectStatus;
  pipelineStageKey?: PipelineStageKey;
  subStatus?: string;
  lostReason?: string;
  lostComment?: string;
  lostCompetitor?: string;
  lostAmount?: number;
  reactivationDate?: string;
  lastContactedAt?: string;
  contactAttempts: number;
  priority: Priority;
  score: number;
  estimatedBudget: number;
  expectedDecisionDate?: string;
  nextAction: string;
  nextFollowUp: string;
  projectTypes: string[];
  housingType: string;
  heatingSystem?: string;
  maprimeCategory?: string;
  createdAt: string;
  updatedAt: string;
  comments: string;
  clientNumber?: string;
};

export type PipelineStage = {
  id: PipelineStageKey;
  name: string;
  status: ProspectStatus;
  probability: number;
};

export type WorkQueue = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  urgentCount: number;
  prospects: Prospect[];
};

export type Task = {
  id: string;
  type: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  status: "A faire" | "En cours" | "Terminee" | "En retard";
  prospectId?: string;
};

export type Appointment = {
  id: string;
  title: string;
  prospectId: string;
  owner: string;
  startsAt: string;
  address: string;
  template: string;
};

export type ProspectDocument = {
  id: string;
  name: string;
  category: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type ClientSummary = {
  id: string;
  number: string;
  prospectId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  projectTypes: string[];
  documentsCount: number;
  createdAt: string;
};

export type Connector = {
  id: string;
  name: string;
  type: "Google Sheets" | "Webhook" | "CSV" | "Email" | "API externe";
  status: "Actif" | "Simulation" | "Erreur" | "Inactif";
  lastSync?: string;
  importedCount: number;
  errors: string[];
};

export type Worksite = {
  id: string;
  reference: string;
  clientName: string;
  type: string;
  amount: number;
  status: string;
  foreman: string;
  plannedStart: string;
};
