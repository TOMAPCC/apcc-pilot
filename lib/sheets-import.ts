const DEFAULT_SPREADSHEET_ID = "1dFXhXlD3g7NU8H7HjJJ2V3B4n3GrhUFfWoUpYeVWNzA";
const HEAT_PUMP_GID = "1926972254";
const PRIME_ADAPT_GID = "535542387";
const START_LEAD_LAST_NAME = "Moktar Mazard";

export type ImportedBusinessLine = "Pompe a chaleur" | "Prime Adapt";

export type ImportedLead = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  postalCode: string;
  phone: string;
  email: string;
  entryDate: string;
  housing: string;
  situation: string;
  heating: string;
  project: string;
  comment: string;
  source: string;
  businessLine: ImportedBusinessLine;
  duplicateId?: string;
};

export function getPublicCsvUrl(gid = process.env.GOOGLE_SHEETS_DEFAULT_GID || HEAT_PUMP_GID) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

export async function fetchLatestSheetLeads(limit = 25) {
  const response = await fetch(getPublicCsvUrl(HEAT_PUMP_GID), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Google Sheets a repondu ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  const [headers = [], ...dataRows] = rows;
  const allRows = dataRows
    .map((row, index) => mapLead(headers, row, index + 2))
    .filter((lead) => lead.lastName || lead.firstName || lead.phone || lead.email)
    .filter((lead) => !lead.lastName.toLowerCase().includes("nouvelle commnade"));
  const scopedRows = keepRowsFromLead(allRows, START_LEAD_LAST_NAME);
  const mappedRows = markDuplicates(scopedRows)
    .sort((a, b) => Date.parse(b.entryDate || "1970-01-01") - Date.parse(a.entryDate || "1970-01-01"));

  return {
    sourceUrl: getPublicCsvUrl(HEAT_PUMP_GID),
    startsFrom: START_LEAD_LAST_NAME,
    totalRows: mappedRows.length,
    latest: mappedRows.slice(0, limit)
  };
}

export async function fetchAllSheetLeads() {
  const [heatPumpResult, primeAdaptResult] = await Promise.all([
    fetchLatestSheetLeads(Number.MAX_SAFE_INTEGER),
    fetchLatestPrimeAdaptLeads(Number.MAX_SAFE_INTEGER)
  ]);

  return [...heatPumpResult.latest, ...primeAdaptResult.latest].sort(
    (a, b) => Date.parse(b.entryDate || "1970-01-01") - Date.parse(a.entryDate || "1970-01-01")
  );
}

export async function fetchLatestPrimeAdaptLeads(limit = 25) {
  const response = await fetch(getPublicCsvUrl(PRIME_ADAPT_GID), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Google Sheets Prime Adapt a repondu ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  const [headers = [], ...dataRows] = rows;
  const mappedRows = markDuplicates(
    dataRows
      .map((row, index) => mapPrimeAdaptLead(headers, row, index + 2))
      .filter((lead) => lead.lastName || lead.firstName || lead.phone || lead.email)
  ).sort((a, b) => Date.parse(b.entryDate || "1970-01-01") - Date.parse(a.entryDate || "1970-01-01"));

  return {
    sourceUrl: getPublicCsvUrl(PRIME_ADAPT_GID),
    startsFrom: "Premier lead Prime Adapt",
    totalRows: mappedRows.length,
    latest: mappedRows.slice(0, limit)
  };
}

function mapLead(headers: string[], row: string[], rowNumber: number): ImportedLead {
  const record = Object.fromEntries(headers.map((header, index) => [normalizeHeader(header), row[index]?.trim() ?? ""]));
  const rawName = record.nom || "";
  const firstName = record.prenom || "";
  const lastName = rawName.trim();
  const postalCode = normalizePostalCode(record.codepostal || "");
  const phone = normalizePhoneDisplay(record.telephone || "");
  const email = record.email || "";
  const project = record.dateappel || "Pompe a chaleur";
  const comment = record.commentaire || "";
  return {
    rowNumber,
    firstName,
    lastName,
    postalCode,
    phone,
    email,
    entryDate: record.date || "",
    housing: record.habitation || "",
    situation: record.situation || "",
    heating: record.chauffage || "",
    project,
    comment,
    source: "Google Sheets",
    businessLine: "Pompe a chaleur"
  };
}

function mapPrimeAdaptLead(headers: string[], row: string[], rowNumber: number): ImportedLead {
  const record = Object.fromEntries(headers.map((header, index) => [normalizeHeader(header), row[index]?.trim() ?? ""]));
  const { firstName, lastName } = splitFullName(record.nom || "");
  const age = cleanEligibilityText(record.age || "");
  const household = record.nombredepersonnesdanslefoyer || "";
  const income = cleanEligibilityText(record.tranchedurevenufiscal || "");
  const optIn = record.optin || "";
  const callDate = record.dateheureappel || "";
  const comment = [
    age ? `Profil: ${age}` : "",
    household ? `Foyer: ${household} personne(s)` : "",
    income ? `Revenu fiscal: ${income}` : "",
    optIn ? `Opt-in: ${optIn}` : "",
    callDate ? `Appel: ${callDate}` : ""
  ].filter(Boolean).join("\n");

  return {
    rowNumber,
    firstName,
    lastName,
    postalCode: normalizePostalCode(record.codepostal || ""),
    phone: normalizePhoneDisplay(record.telephone || ""),
    email: record.mail || "",
    entryDate: record.datedulead || "",
    housing: "Salle de bain a adapter PMR",
    situation: income,
    heating: age,
    project: "Prime Adapt - salle de bain PMR",
    comment,
    source: "Google Sheets - Prime Adapt",
    businessLine: "Prime Adapt"
  };
}

function keepRowsFromLead(leads: ImportedLead[], startLastName: string) {
  const startIndex = leads.findIndex((lead) => normalizeIdentity(lead.lastName) === normalizeIdentity(startLastName));

  if (startIndex === -1) {
    return leads;
  }

  return leads.slice(startIndex);
}

function markDuplicates(leads: ImportedLead[]) {
  const seen = new Map<string, ImportedLead>();

  return leads.map((lead) => {
    const keys = [
      normalizeIdentity(lead.phone),
      normalizeIdentity(lead.email),
      `${normalizeIdentity(lead.lastName)}-${normalizeIdentity(lead.postalCode)}`
    ].filter((key) => key && key !== "-");

    const firstDuplicate = keys.map((key) => seen.get(key)).find(Boolean);

    for (const key of keys) {
      if (!seen.has(key)) {
        seen.set(key, lead);
      }
    }

    return firstDuplicate ? { ...lead, duplicateId: `sheet-row-${firstDuplicate.rowNumber}` } : lead;
  });
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header: string) {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: "", lastName: parts[0] || "" };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function cleanEligibilityText(value: string) {
  return value.replaceAll("_", " ").replaceAll("’", "'").trim();
}

function normalizePostalCode(value: string) {
  return value.padStart(value.length === 4 ? 5 : value.length, "0");
}

function normalizePhoneDisplay(value: string) {
  const clean = value.replace(/[^\d+]/g, "");

  if (clean.startsWith("33") && clean.length === 11) {
    return `0${clean.slice(2, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
  }

  if (clean.length === 10 && clean.startsWith("0")) {
    return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
  }

  return value;
}

function normalizeIdentity(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
