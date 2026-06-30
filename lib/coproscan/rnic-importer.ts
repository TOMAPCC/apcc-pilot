import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "./types";

const RNIC_DATASET_API =
  process.env.RNIC_DATASET_API ?? "https://www.data.gouv.fr/api/1/datasets/62da71c068871f4c54258c7c";
const RNIC_RESOURCE_URL = process.env.RNIC_RESOURCE_URL;

interface RnicRecord {
  numero_immatriculation: string;
  nom_usage?: string;
  adresse_reference?: string;
  numero_voie_adresse?: string;
  adresse_reference_code_postal?: string;
  adresse_reference_commune?: string;
  code_departement?: string;
  latitude?: number;
  longitude?: number;
  nombre_lots_total_parties_communes?: number;
  nombre_lots_usage_habitation?: number;
  annee_construction?: number;
  type_chauffage?: string;
  chauffage_collectif?: boolean;
  identifiant_syndic_professionnel?: string;
  nom_syndic?: string;
  siret_syndic?: string;
  siren_syndic?: string;
}

interface ImportResult {
  batchId: string;
  recordsTotal: number;
  recordsImported: number;
  recordsUpdated: number;
  recordsRejected: number;
  errors: string[];
}

interface DataGouvResource {
  title?: string;
  format?: string;
  latest?: string;
  url?: string;
}

export async function importRnicDepartment(department: string): Promise<ImportResult> {
  const batch = await prisma.importBatch.create({
    data: {
      source: "rnic",
      department,
      status: "running",
      startedAt: new Date(),
    },
  });

  let totalImported = 0;
  let totalUpdated = 0;
  let totalRejected = 0;
  let totalRecords = 0;
  const errors: string[] = [];

  try {
    for await (const records of streamRnicDepartment(department)) {
      totalRecords += records.length;

      for (const record of records) {
        if (!record.numero_immatriculation) {
          totalRejected++;
          await prisma.importRejection.create({
            data: {
              batchId: batch.id,
              rawData: record as object,
              reason: "missing_rnic_id",
              field: "numero_immatriculation",
            },
          });
          continue;
        }

        const addressFromParts = record.adresse_reference ?? record.numero_voie_adresse ?? "";
        const name =
          record.nom_usage ?? (addressFromParts || record.numero_immatriculation);

        const address = addressFromParts.trim();

        const coproprieteData = {
          name,
          address: address || "Adresse inconnue",
          postalCode: record.adresse_reference_code_postal ?? "",
          city: record.adresse_reference_commune ?? "",
          department,
          latitude: record.latitude ?? null,
          longitude: record.longitude ?? null,
          lotsCount: record.nombre_lots_total_parties_communes ?? null,
          lotsResidential: record.nombre_lots_usage_habitation ?? null,
          constructionYear: record.annee_construction ?? null,
          heatingType: record.type_chauffage ?? null,
          heatingCollective: record.chauffage_collectif ?? null,
          isDemo: false,
          dataOrigin: "rnic",
          sourceType: "public",
        };

        const existing = await prisma.copropriete.findUnique({
          where: { rnicId: record.numero_immatriculation },
        });

        if (existing) {
          await prisma.copropriete.update({
            where: { id: existing.id },
            data: coproprieteData,
          });
          totalUpdated++;
        } else {
          const copro = await prisma.copropriete.create({
            data: {
              ...coproprieteData,
              rnicId: record.numero_immatriculation,
            },
          });

          // Attach or create syndic if SIREN provided
          if (record.siren_syndic) {
            await upsertSyndicForCopropriete(copro.id, {
              siren: record.siren_syndic,
              siret: record.siret_syndic,
              name: record.nom_syndic ?? `Syndic ${record.siren_syndic}`,
            });
          }

          totalImported++;
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Fatal: ${msg}`);
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: errors.length > 0 && totalImported === 0 ? "failed" : "done",
      recordsTotal: totalRecords,
      recordsImported: totalImported,
      recordsUpdated: totalUpdated,
      recordsRejected: totalRejected,
      completedAt: new Date(),
      ...(errors.length > 0 ? { errorLog: errors } : {}),
    },
  });

  return {
    batchId: batch.id,
    recordsTotal: totalRecords,
    recordsImported: totalImported,
    recordsUpdated: totalUpdated,
    recordsRejected: totalRejected,
    errors,
  };
}

async function* streamRnicDepartment(department: string): AsyncGenerator<RnicRecord[]> {
  // Safety guard equivalent to the former paginated importer (`page > 200`):
  // streaming yields bounded DB batches and never stores the 400 MB CSV in memory.
  const csvUrl = await resolveRnicCsvUrl();
  const response = await fetch(csvUrl, {
    headers: { Accept: "text/csv" },
    next: { revalidate: 0 },
  });

  if (!response.ok || !response.body) {
    throw new Error(`RNIC data.gouv CSV error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let headers: string[] | null = null;
  let batch: RnicRecord[] = [];

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!headers) {
        headers = parseCsvLine(line).map((header) => header.trim());
        continue;
      }

      const record = mapRnicCsvRecord(headers, parseCsvLine(line));
      if (record.code_departement !== department) continue;

      batch.push(record);
      if (batch.length >= 250) {
        yield batch;
        batch = [];
      }
    }

    if (done) break;
  }

  if (buffer.trim() && headers) {
    const record = mapRnicCsvRecord(headers, parseCsvLine(buffer));
    if (record.code_departement === department) {
      batch.push(record);
    }
  }

  if (batch.length) {
    yield batch;
  }
}

async function resolveRnicCsvUrl() {
  if (RNIC_RESOURCE_URL) return RNIC_RESOURCE_URL;

  const response = await fetch(RNIC_DATASET_API, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`RNIC data.gouv dataset error ${response.status}`);
  }

  const dataset = await response.json();
  const resources: DataGouvResource[] = Array.isArray(dataset?.resources) ? dataset.resources : [];
  const daily = resources.find((resource) => resource.title === "RNIC - Actualisation quotidienne");
  const csv = daily ?? resources.find((resource) => resource.format?.toLowerCase() === "csv");
  const url = csv?.latest ?? csv?.url;

  if (!url) {
    throw new Error("RNIC data.gouv CSV resource not found");
  }

  return url as string;
}

function mapRnicCsvRecord(headers: string[], values: string[]): RnicRecord {
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const siret = get(record, "siret_representant_legal");

  return {
    numero_immatriculation: get(record, "numero_immatriculation"),
    nom_usage: get(record, "nom_usage_copropriete"),
    adresse_reference: get(record, "adresse_reference"),
    numero_voie_adresse: get(record, "numero_voie_adresse"),
    adresse_reference_code_postal: get(record, "code_postal_adresse"),
    adresse_reference_commune: get(record, "commune_adresse"),
    code_departement: get(record, "code_officiel_departement") || get(record, "code_postal_adresse").slice(0, 2),
    latitude: parseOptionalNumber(get(record, "latitude")),
    longitude: parseOptionalNumber(get(record, "longitude")),
    nombre_lots_total_parties_communes: parseOptionalInt(get(record, "nombre_total_lots")),
    nombre_lots_usage_habitation: parseOptionalInt(get(record, "nombre_lots_habitation")),
    identifiant_syndic_professionnel: get(record, "identification_representant_legal"),
    nom_syndic: get(record, "raison_sociale_representant_legal"),
    siret_syndic: siret,
    siren_syndic: siret.slice(0, 9),
  };
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index++;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function get(record: Record<string, string>, key: string) {
  return record[key]?.trim() ?? "";
}

function parseOptionalNumber(value: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalInt(value: string) {
  const parsed = parseOptionalNumber(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

async function upsertSyndicForCopropriete(
  coproprieteId: string,
  syndicData: { siren: string; siret?: string; name: string }
) {
  const syndic = await prisma.syndic.upsert({
    where: { siren: syndicData.siren },
    update: {
      siret: syndicData.siret ?? undefined,
      name: syndicData.name,
    },
    create: {
      siren: syndicData.siren,
      siret: syndicData.siret ?? null,
      name: syndicData.name,
      isDemo: false,
    },
  });

  await prisma.copropriete.update({
    where: { id: coproprieteId },
    data: { syndicId: syndic.id },
  });
}

export async function importAllTargetDepartments(): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (const dept of TARGET_DEPARTMENTS) {
    const result = await importRnicDepartment(dept);
    results.push(result);
  }
  return results;
}
