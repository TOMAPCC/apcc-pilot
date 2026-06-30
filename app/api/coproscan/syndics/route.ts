import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TARGET_DEPARTMENTS } from "@/lib/coproscan/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = (page - 1) * limit;
  const q = searchParams.get("q") ?? "";

  const where = {
    isDemo: false,
    gdprOpposedAt: null,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    coproprietes: {
      some: {
        department: { in: TARGET_DEPARTMENTS },
        isDemo: false,
        classificationStatus: { in: ["confirmed", "probable"] },
        energyClass: { in: ["E", "F", "G"] },
      },
    },
  };

  const [items, total] = await Promise.all([
    prisma.syndic.findMany({
      where,
      include: {
        _count: { select: { coproprietes: true, contacts: true, clayJobs: true } },
        contacts: {
          where: { contactStatus: { in: ["verified", "public_professional"] } },
          select: { id: true, firstName: true, lastName: true, role: true, contactStatus: true },
          take: 3,
        },
      },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.syndic.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}
