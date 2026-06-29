import { prisma } from "@/lib/db";
import { classifyCopropriete } from "./classification";

const ADEME_DPE_API_BASE =
  process.env.ADEME_DPE_API_BASE ?? "https://data.ademe.fr/data-fair/api/v1/datasets";

// ADEME open data dataset IDs for DPE
const DPE_COLLECTIF_DATASET = "dpe-v2-logements-existants";

interface AdemeRecord {
  "N°DPE"?: string;
  "Identifiant__BAN"?: string;
  "Etiquette_DPE"?: string;
  "Conso_5_usages_e_finale"?: number;
  "Emission_GES_5_usages"?: number;
  "Adresse_(BAN)"?: string;
  "Code_postal_(BAN)"?: string;
  "Nom__commune_(BAN)"?: string;
  "Date_réception_DPE"?: string;
  "Année_construction"?: number;
  "Type_bâtiment"?: string;
  [key: string]: unknown;
}

export async function importDpeForDepartment(department: string): Promise<{
  batchId: string;
  imported: number;
  matched: number;
  errors: string[];
}> {
  const batch = await prisma.importBatch.create({
    data: {
      source: "dpe_ademe",
      department,
      status: "running",
      startedAt: new Date(),
    },
  });

  let imported = 0;
  let matched = 0;
  const errors: string[] = [];

  try {
    // Fetch DPE collectif for department
    const url = new URL(
      `${ADEME_DPE_API_BASE}/${DPE_COLLECTIF_DATASET}/lines`
    );
    url.searchParams.set("size", "1000");
    url.searchParams.set("q", department);
    url.searchParams.set("select", "N°DPE,Etiquette_DPE,Adresse_(BAN),Code_postal_(BAN),Nom__commune_(BAN),Date_réception_DPE,Conso_5_usages_e_finale,Emission_GES_5_usages,Type_bâtiment");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`ADEME DPE API error ${res.status}`);
    }

    const data = await res.json();
    const records: AdemeRecord[] = Array.isArray(data?.results) ? data.results : [];

    for (const record of records) {
      const energyClass = record["Etiquette_DPE"];
      if (!energyClass || !["A", "B", "C", "D", "E", "F", "G"].includes(energyClass)) {
        continue;
      }

      const postalCode = String(record["Code_postal_(BAN)"] ?? "");
      const deptCode = postalCode.substring(0, 2);
      if (deptCode !== department) continue;

      const address = record["Adresse_(BAN)"] ?? "";
      const ademeRef = record["N°DPE"] ?? null;

      // Try to match to existing copropriete by postal code + address proximity
      const copros = await prisma.copropriete.findMany({
        where: {
          postalCode: { startsWith: department },
          isDemo: false,
        },
        select: { id: true, address: true, postalCode: true },
        take: 100,
      });

      const match = bestAddressMatch(address, copros);
      const isCollective =
        String(record["Type_bâtiment"] ?? "").toLowerCase().includes("immeuble") ||
        String(record["Type_bâtiment"] ?? "").toLowerCase().includes("collectif");

      imported++;

      if (match) {
        await prisma.dpeProof.create({
          data: {
            coproprieteId: match.id,
            ademeRef: ademeRef ? String(ademeRef) : null,
            energyClass,
            dpeScore: typeof record["Conso_5_usages_e_finale"] === "number"
              ? record["Conso_5_usages_e_finale"]
              : null,
            gesScore: typeof record["Emission_GES_5_usages"] === "number"
              ? record["Emission_GES_5_usages"]
              : null,
            scope: isCollective ? "batiment_collectif" : "appartement",
            isCollective,
            sourceUrl: `https://data.ademe.fr/datasets/${DPE_COLLECTIF_DATASET}`,
            sourceDate: record["Date_réception_DPE"]
              ? new Date(record["Date_réception_DPE"])
              : null,
            matchMethod: "address",
            matchConfidence: match.confidence,
            rawValue: record as object,
          },
        });

        // Re-classify after adding proof
        const classification = await classifyCopropriete({ coproprieteId: match.id });
        await prisma.copropriete.update({
          where: { id: match.id },
          data: classification,
        });

        matched++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: errors.length > 0 && imported === 0 ? "failed" : "done",
      recordsTotal: imported,
      recordsImported: matched,
      recordsUpdated: 0,
      recordsRejected: imported - matched,
      completedAt: new Date(),
      errorLog: errors.length > 0 ? errors : null,
    },
  });

  return { batchId: batch.id, imported, matched, errors };
}

function bestAddressMatch(
  dpeAddress: string,
  candidates: Array<{ id: string; address: string; postalCode: string }>
): { id: string; confidence: number } | null {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const normDpe = norm(dpeAddress);
  let best: { id: string; confidence: number } | null = null;

  for (const c of candidates) {
    const normC = norm(c.address);
    if (!normC || !normDpe) continue;

    const similarity = jaccardSimilarity(normDpe.split(/\s+/), normC.split(/\s+/));
    if (similarity > 0.7 && (!best || similarity > best.confidence)) {
      best = { id: c.id, confidence: similarity };
    }
  }

  return best;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
