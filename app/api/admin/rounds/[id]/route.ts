import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import { ROUND_STATUSES } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      roundItems: { orderBy: { order: "asc" } },
      roundSystems: {
        include: {
          system: true,
          responses: { include: { attachments: true } },
        },
        orderBy: { system: { name: "asc" } },
      },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "회차를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(round);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum([ROUND_STATUSES.DRAFT, ROUND_STATUSES.OPEN, ROUND_STATUSES.CLOSED]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { startDate, dueDate, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

  const round = await prisma.round.update({ where: { id }, data });
  return NextResponse.json(round);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  await prisma.round.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
