import type { Appointment, Connector, PipelineStage, Prospect, Task, User, Worksite } from "./types";

export const users: User[] = [
  { id: "u-admin", name: "Thomas Cauquil", email: "admin@apcc.fr", role: "Administrateur" },
  { id: "u-dir", name: "Direction APCC", email: "direction@apcc.fr", role: "Direction" },
  { id: "u-camille", name: "Camille Martin", email: "commercial@apcc.fr", role: "Commercial" },
  { id: "u-julien", name: "Julien Moreau", email: "travaux@apcc.fr", role: "Conducteur de travaux" }
];

export const pipelineStages: PipelineStage[] = [
  { id: "new", name: "Nouveau lead", probability: 10 },
  { id: "qualify", name: "A qualifier", probability: 18 },
  { id: "contact", name: "A contacter", probability: 22 },
  { id: "met", name: "Contact etabli", probability: 35 },
  { id: "visit", name: "Rendez-vous planifie", probability: 50 },
  { id: "quote", name: "Devis envoye", probability: 65 },
  { id: "nego", name: "Negociation", probability: 82 },
  { id: "won", name: "Dossier signe", probability: 100 },
  { id: "lost", name: "Dossier perdu", probability: 0 }
];

export const prospects: Prospect[] = [
  {
    id: "p-1001",
    civility: "Mme",
    firstName: "Sophie",
    lastName: "Leroy",
    phone: "06 12 45 78 90",
    email: "sophie.leroy@example.fr",
    address: "18 rue des Mimosas",
    worksiteAddress: "18 rue des Mimosas",
    postalCode: "31700",
    city: "Blagnac",
    department: "31",
    source: "Google Sheets",
    assignedTo: "Camille Martin",
    status: "Nouveau lead",
    priority: "Haute",
    score: 82,
    estimatedBudget: 17800,
    expectedDecisionDate: "2026-07-05",
    nextAction: "Appel de qualification",
    nextFollowUp: "2026-06-16",
    projectTypes: ["Pompe a chaleur air/eau", "Ballon thermodynamique"],
    housingType: "Maison individuelle",
    heatingSystem: "Fioul",
    maprimeCategory: "Jaune",
    createdAt: "2026-06-14T08:30:00.000Z",
    updatedAt: "2026-06-14T08:30:00.000Z",
    comments: "Facture energetique recue, souhaite une estimation rapide."
  },
  {
    id: "p-1002",
    civility: "M.",
    firstName: "Nicolas",
    lastName: "Bernard",
    phone: "07 22 10 11 12",
    email: "n.bernard@example.fr",
    address: "9 avenue Jean Jaures",
    worksiteAddress: "9 avenue Jean Jaures",
    postalCode: "31000",
    city: "Toulouse",
    department: "31",
    source: "clubtravaux.app",
    assignedTo: "Camille Martin",
    status: "Rendez-vous planifie",
    priority: "Normale",
    score: 71,
    estimatedBudget: 9400,
    expectedDecisionDate: "2026-07-12",
    nextAction: "Rendez-vous etude climatisation",
    nextFollowUp: "2026-06-18",
    projectTypes: ["Climatisation multisplit"],
    housingType: "Appartement",
    heatingSystem: "Electrique",
    createdAt: "2026-06-10T11:15:00.000Z",
    updatedAt: "2026-06-12T16:20:00.000Z",
    comments: "Appartement dernier etage, contraintes copropriete a verifier."
  },
  {
    id: "p-1003",
    civility: "M. et Mme",
    firstName: "Claire et Hugo",
    lastName: "Ramos",
    phone: "06 98 77 54 31",
    email: "ramos@example.fr",
    address: "42 chemin du Pastel",
    worksiteAddress: "42 chemin du Pastel",
    postalCode: "31670",
    city: "Labege",
    department: "31",
    source: "Recommandation",
    assignedTo: "Thomas Cauquil",
    status: "Devis envoye",
    priority: "Urgente",
    score: 91,
    estimatedBudget: 48600,
    expectedDecisionDate: "2026-06-28",
    nextAction: "Relance devis globale",
    nextFollowUp: "2026-06-15",
    projectTypes: ["Renovation complete", "Salle de bain", "Adaptation PMR"],
    housingType: "Maison individuelle",
    heatingSystem: "Gaz",
    maprimeCategory: "Violet",
    createdAt: "2026-05-28T09:00:00.000Z",
    updatedAt: "2026-06-11T14:05:00.000Z",
    comments: "Dossier prioritaire, decision attendue avant depart en vacances."
  },
  {
    id: "p-1004",
    civility: "Mme",
    firstName: "Amina",
    lastName: "Boukari",
    phone: "06 31 31 31 31",
    email: "amina.boukari@example.fr",
    address: "3 impasse des Lilas",
    worksiteAddress: "3 impasse des Lilas",
    postalCode: "31200",
    city: "Toulouse",
    department: "31",
    source: "Site web",
    assignedTo: "Camille Martin",
    status: "Dossier signe",
    priority: "Haute",
    score: 96,
    estimatedBudget: 22400,
    expectedDecisionDate: "2026-06-01",
    nextAction: "Creation chantier et acompte",
    nextFollowUp: "2026-06-17",
    projectTypes: ["Pompe a chaleur air/eau"],
    housingType: "Maison individuelle",
    heatingSystem: "Gaz",
    maprimeCategory: "Bleu",
    createdAt: "2026-05-14T12:00:00.000Z",
    updatedAt: "2026-06-07T10:00:00.000Z",
    comments: "Devis accepte, acompte annonce cette semaine."
  }
];

export const tasks: Task[] = [
  { id: "t-1", type: "Appeler", title: "Qualifier Sophie Leroy", owner: "Camille Martin", dueDate: "2026-06-16", priority: "Haute", status: "A faire", prospectId: "p-1001" },
  { id: "t-2", type: "Relancer", title: "Relance devis Ramos", owner: "Thomas Cauquil", dueDate: "2026-06-15", priority: "Urgente", status: "En retard", prospectId: "p-1003" },
  { id: "t-3", type: "Planifier un chantier", title: "Preparer chantier Boukari", owner: "Julien Moreau", dueDate: "2026-06-18", priority: "Haute", status: "A faire", prospectId: "p-1004" }
];

export const appointments: Appointment[] = [
  { id: "a-1", title: "Etude climatisation", prospectId: "p-1002", owner: "Camille Martin", startsAt: "2026-06-18T14:00:00.000Z", address: "9 avenue Jean Jaures, Toulouse", template: "Etude climatisation" },
  { id: "a-2", title: "Visite technique PAC", prospectId: "p-1004", owner: "Julien Moreau", startsAt: "2026-06-20T08:30:00.000Z", address: "3 impasse des Lilas, Toulouse", template: "Visite technique" }
];

export const worksites: Worksite[] = [
  { id: "w-1", reference: "APCC-CH-2026-001", clientName: "Amina Boukari", type: "Pompe a chaleur air/eau", amount: 22400, status: "Acompte attendu", foreman: "Julien Moreau", plannedStart: "2026-07-08" },
  { id: "w-2", reference: "APCC-CH-2026-002", clientName: "Philippe Arnaud", type: "Renovation salle de bain PMR", amount: 16600, status: "Chantier planifie", foreman: "Julien Moreau", plannedStart: "2026-06-24" }
];

export const connectors: Connector[] = [
  {
    id: "c-sheets",
    name: "Google Sheets leads APCC",
    type: "Google Sheets",
    status: "Simulation",
    lastSync: "2026-06-15T07:45:00.000Z",
    importedCount: 14,
    errors: []
  },
  {
    id: "c-clubtravaux",
    name: "clubtravaux.app",
    type: "API externe",
    status: "Simulation",
    lastSync: "2026-06-14T18:20:00.000Z",
    importedCount: 6,
    errors: ["API officielle non configuree: utiliser webhook ou import CSV en attente."]
  },
  {
    id: "c-csv",
    name: "Import CSV manuel",
    type: "CSV",
    status: "Actif",
    importedCount: 0,
    errors: []
  }
];
