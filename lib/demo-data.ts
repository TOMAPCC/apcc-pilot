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
  { id: "no-answer", name: "N'a pas repondu", probability: 20 },
  { id: "met", name: "Contact etabli", probability: 35 },
  { id: "visit", name: "Rendez-vous planifie", probability: 50 },
  { id: "quote", name: "Devis envoye", probability: 65 },
  { id: "nego", name: "Negociation", probability: 82 },
  { id: "won", name: "Dossier signe", probability: 100 },
  { id: "lost", name: "Dossier perdu", probability: 0 }
];

export const prospects: Prospect[] = [];

export const tasks: Task[] = [];

export const appointments: Appointment[] = [];

export const worksites: Worksite[] = [];

export const connectors: Connector[] = [
  {
    id: "c-sheets",
    name: "Google Sheets leads APCC",
    type: "Google Sheets",
    status: "Actif",
    importedCount: 0,
    errors: []
  },
  {
    id: "c-clubtravaux",
    name: "clubtravaux.app",
    type: "API externe",
    status: "Actif",
    lastSync: "2026-06-17T08:18:00.000Z",
    importedCount: 9,
    errors: ["Import manuel depuis Clubtravaux - Export 17-6-2026.xlsx. API officielle a connecter ensuite."]
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
