import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const rounds = await prisma.round.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { roundSystems: true, roundItems: true } },
    },
  });
  return NextResponse.json(rounds);
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  systemIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "회차명을 입력해주세요." }, { status: 400 });
  }

  const activeItems = await prisma.item.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  if (activeItems.length === 0) {
    return NextResponse.json(
      { error: "활성화된 점검 항목이 없습니다. 먼저 체크리스트 관리에서 항목을 등록해주세요." },
      { status: 400 }
    );
  }

  const round = await prisma.$transaction(async (tx) => {
    const created = await tx.round.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
    });

    await tx.roundItem.createMany({
      data: activeItems.map((it, idx) => ({
        roundId: created.id,
        itemId: it.id,
        categoryName: it.category.name,
        code: it.code,
        title: it.title,
        description: it.description,
        evidenceType: it.evidenceType,
        required: it.required,
        order: idx,
      })),
    });

    const systemIds = parsed.data.systemIds ?? [];
    if (systemIds.length > 0) {
      await tx.roundSystem.createMany({
        data: systemIds.map((systemId) => ({ roundId: created.id, systemId })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  return NextResponse.json(round, { status: 201 });
}
