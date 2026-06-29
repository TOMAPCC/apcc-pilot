import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const syndicId = searchParams.get("syndicId");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  const where = {
    isDemo: false,
    gdprOpposedAt: null,
    ...(status ? { contactStatus: status } : {}),
    ...(syndicId ? { syndicId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        syndic: { select: { id: true, name: true, siren: true } },
        _count: { select: { contactProofs: true, emailDrafts: true } },
      },
      orderBy: [{ relevanceScore: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}
