import type { Appointment, Connector, Prospect, Task, User, Worksite } from "./types";
export { pipelineStages } from "./pipeline";

export const users: User[] = [
  { id: "u-admin", name: "Thomas Cauquil", email: "admin@apcc.fr", role: "Administrateur" },
  { id: "u-dir", name: "Direction APCC", email: "direction@apcc.fr", role: "Direction" },
  { id: "u-camille", name: "Camille Martin", email: "commercial@apcc.fr", role: "Commercial" },
  { id: "u-julien", name: "Julien Moreau", email: "travaux@apcc.fr", role: "Conducteur de travaux" }
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
    lastSync: "2026-06-24T14:06:00.000Z",
    importedCount: 17,
    errors: ["Import manuel depuis Clubtravaux - Export 24-6-2026.xlsx. API officielle a connecter ensuite."]
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
