import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "confirmed";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = (page - 1) * limit;

  // Always enforce production filter: no demo, only target departments
  const where = {
    isDemo: false,
    department: { in: TARGET_DEPARTMENTS },
    classificationStatus: status,
    energyClass: status === "non_target" ? undefined : { in: ["E", "F", "G"] as string[] },
  };

  // A-D and unknown must never appear in commercial views
  if (status === "confirmed" || status === "probable") {
    Object.assign(where, { energyClass: { in: ["E", "F", "G"] } });
  }

  const [items, total] = await Promise.all([
    prisma.copropriete.findMany({
      where,
      include: {
        syndic: { select: { id: true, name: true, siren: true, enrichmentStatus: true } },
        _count: {
          select: { dpeProofs: true, interactions: true, emailDrafts: true },
        },
      },
      orderBy: [{ classificationScore: "desc" }, { lotsResidential: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.copropriete.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
