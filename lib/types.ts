export type RoleName =
  | "Administrateur"
  | "Direction"
  | "Responsable commercial"
  | "Commercial"
  | "Conducteur de travaux"
  | "Technicien"
  | "Assistant administratif";

export type Priority = "Basse" | "Normale" | "Haute" | "Urgente";

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
  assignedTo: string;
  status: ProspectStatus;
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
};

export type PipelineStage = {
  id: string;
  name: ProspectStatus;
  probability: number;
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
