import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "./types";

const RNIC_API_BASE = process.env.RNIC_API_BASE ?? "https://www.registre-coproprietes.gouv.fr/api";

interface RnicRecord {
  numero_immatriculation: string;
  nom_usage?: string;
  adresse_reference_numero?: string;
  adresse_reference_voie?: string;
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

// Fetch one page from RNIC API (public, no auth required)
async function fetchRnicPage(department: string, page: number, pageSize = 100): Promise<RnicRecord[]> {
  const url = new URL(`${RNIC_API_BASE}/coproprietes`);
  url.searchParams.set("code_departement", department);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`RNIC API error ${res.status} for department ${department} page ${page}`);
  }

  const data = await res.json();
  // API returns { results: [...], count: N } or similar
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
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

  let page = 1;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalRejected = 0;
  let totalRecords = 0;
  const errors: string[] = [];

  try {
    while (true) {
      let records: RnicRecord[];
      try {
        records = await fetchRnicPage(department, page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Page ${page}: ${msg}`);
        break;
      }

      if (records.length === 0) break;
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

        const addressFromParts =
          `${record.adresse_reference_numero ?? ""} ${record.adresse_reference_voie ?? ""}`.trim();
        const name =
          record.nom_usage ?? (addressFromParts || record.numero_immatriculation);

        const address = [
          record.adresse_reference_numero,
          record.adresse_reference_voie,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

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

      page++;
      // Safety: stop after 200 pages per department
      if (page > 200) break;
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
