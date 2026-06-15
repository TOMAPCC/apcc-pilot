import { appointments, connectors, pipelineStages, prospects, tasks, worksites } from "./demo-data";
import type { Prospect } from "./types";

export function getDashboardMetrics() {
  const signed = prospects.filter((prospect) => prospect.status === "Dossier signe");
  const openWorksites = worksites.filter((worksite) => worksite.status !== "Dossier cloture");
  const quotePipeline = prospects
    .filter((prospect) => prospect.status !== "Dossier perdu")
    .reduce((sum, prospect) => sum + prospect.estimatedBudget, 0);
  const weightedPipeline = prospects.reduce((sum, prospect) => {
    const stage = pipelineStages.find((item) => item.name === prospect.status);
    return sum + prospect.estimatedBudget * ((stage?.probability ?? 0) / 100);
  }, 0);

  return {
    newProspects: prospects.filter((prospect) => prospect.status === "Nouveau lead").length,
    followUpsToday: tasks.filter((task) => task.dueDate <= "2026-06-15" && task.status !== "Terminee").length,
    upcomingAppointments: appointments.length,
    quotesToFollow: prospects.filter((prospect) => prospect.status === "Devis envoye").length,
    signedRevenue: signed.reduce((sum, prospect) => sum + prospect.estimatedBudget, 0),
    forecastRevenue: Math.round(weightedPipeline),
    pipelineRevenue: quotePipeline,
    conversionRate: Math.round((signed.length / Math.max(prospects.length, 1)) * 100),
    worksitesInProgress: openWorksites.length,
    overdueTasks: tasks.filter((task) => task.status === "En retard").length
  };
}

export function findPotentialDuplicate(input: Pick<Prospect, "phone" | "email" | "lastName" | "postalCode" | "worksiteAddress">) {
  const normalizedPhone = normalize(input.phone);
  const normalizedEmail = normalize(input.email);
  const normalizedNameZip = `${normalize(input.lastName)}-${normalize(input.postalCode)}`;
  const normalizedAddress = normalize(input.worksiteAddress);

  return prospects.find((prospect) => {
    return (
      normalize(prospect.phone) === normalizedPhone ||
      normalize(prospect.email) === normalizedEmail ||
      `${normalize(prospect.lastName)}-${normalize(prospect.postalCode)}` === normalizedNameZip ||
      normalize(prospect.worksiteAddress) === normalizedAddress
    );
  });
}

export function parseCsvLeads(csv: string) {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine).map((header) => normalizeKey(header));

  return rows
    .filter(Boolean)
    .map((row) => {
      const values = splitCsvLine(row);
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      const prospect = {
        civility: "Mme",
        firstName: record.prenom || record.firstname || "",
        lastName: record.nom || record.lastname || "",
        phone: record.telephone || record.phone || "",
        email: record.email || "",
        city: record.ville || record.city || "",
        postalCode: record.codepostal || record.postalcode || "",
        worksiteAddress: record.adressechantier || record.address || "",
        projectTypes: (record.projet || record.project || "Autre projet").split(";").map((item) => item.trim()),
        source: record.source || "Import CSV"
      };
      return {
        prospect,
        duplicate: findPotentialDuplicate({
          phone: prospect.phone,
          email: prospect.email,
          lastName: prospect.lastName,
          postalCode: prospect.postalCode,
          worksiteAddress: prospect.worksiteAddress
        })
      };
    });
}

function normalize(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeKey(value: string) {
  return normalize(value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function getConnectorSummary() {
  return connectors.map((connector) => ({
    ...connector,
    configured: connector.status === "Actif" || connector.status === "Simulation"
  }));
}
