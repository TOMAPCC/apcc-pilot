import { prisma } from "@/lib/db";
import {
  CONFIDENCE_CONFIRMED,
  CONFIDENCE_PROBABLE,
  type ClassificationStatus,
} from "./types";

interface ClassificationInput {
  coproprieteId: string;
}

interface ClassificationResult {
  energyClass: string | null;
  classificationStatus: ClassificationStatus;
  classificationScore: number;
  classificationConfidence: number;
}

// Derive classification from all proofs for a copropriété.
// A single apartment DPE does NOT confirm the whole building.
export async function classifyCopropriete(
  input: ClassificationInput
): Promise<ClassificationResult> {
  type DpeProofRow = { isCollective: boolean; energyClass: string; matchConfidence: number };
  type EnergyProofRow = { id: string };
  const [dpeProofs, energyProofs]: [DpeProofRow[], EnergyProofRow[]] = await Promise.all([
    prisma.dpeProof.findMany({ where: { coproprieteId: input.coproprieteId } }),
    prisma.energyProof.findMany({ where: { coproprieteId: input.coproprieteId } }),
  ]);

  // Only collective DPE proofs can confirm a whole building
  const collectiveProofs = dpeProofs.filter((p) => p.isCollective);
  const apartmentProofs = dpeProofs.filter((p) => !p.isCollective);

  if (collectiveProofs.length === 0 && energyProofs.length === 0 && apartmentProofs.length === 0) {
    return {
      energyClass: null,
      classificationStatus: "unknown",
      classificationScore: 0,
      classificationConfidence: 0,
    };
  }

  // Scoring: collective proof is worth 1.0, apartment cluster worth 0.5 max
  let bestClass: string | null = null;
  let totalWeight = 0;
  let weightedConfidence = 0;

  for (const proof of collectiveProofs) {
    const w = proof.matchConfidence > 0 ? proof.matchConfidence : 0.85;
    totalWeight += w;
    weightedConfidence += w;
    if (!bestClass || classOrder(proof.energyClass) > classOrder(bestClass)) {
      bestClass = proof.energyClass;
    }
  }

  // Apartment DPEs provide weak signal only when many agree
  if (apartmentProofs.length >= 3) {
    const classCounts = apartmentProofs.reduce<Record<string, number>>((acc, p) => {
      acc[p.energyClass] = (acc[p.energyClass] ?? 0) + 1;
      return acc;
    }, {});
    const dominant = Object.entries(classCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    if (dominant) {
      const w = Math.min(0.5, (dominant[1] as number) / apartmentProofs.length * 0.5);
      totalWeight += w;
      weightedConfidence += w * 0.5;
      if (!bestClass || classOrder(dominant[0]) > classOrder(bestClass)) {
        bestClass = dominant[0];
      }
    }
  }

  const confidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

  const efgClasses = new Set(["E", "F", "G"]);

  if (!bestClass) {
    return {
      energyClass: null,
      classificationStatus: "unknown",
      classificationScore: 0,
      classificationConfidence: confidence,
    };
  }

  if (!efgClasses.has(bestClass)) {
    return {
      energyClass: bestClass,
      classificationStatus: "non_target",
      classificationScore: 0,
      classificationConfidence: confidence,
    };
  }

  // Score: G=100, F=80, E=60
  const score = bestClass === "G" ? 100 : bestClass === "F" ? 80 : 60;

  let status: ClassificationStatus;
  if (collectiveProofs.length > 0 && confidence >= CONFIDENCE_CONFIRMED) {
    status = "confirmed";
  } else if (confidence >= CONFIDENCE_PROBABLE) {
    status = "probable";
  } else {
    status = "unknown";
  }

  return {
    energyClass: bestClass,
    classificationStatus: status,
    classificationScore: score,
    classificationConfidence: Math.round(confidence * 1000) / 1000,
  };
}

function classOrder(cls: string): number {
  return { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 }[cls] ?? 0;
}

export async function reclassifyAll() {
  const ids = await prisma.copropriete.findMany({
    select: { id: true },
    where: { isDemo: false },
  }) as { id: string }[];

  let updated = 0;
  for (const { id } of ids) {
    const result = await classifyCopropriete({ coproprieteId: id });
    await prisma.copropriete.update({
      where: { id },
      data: result,
    });
    updated++;
  }
  return updated;
}
