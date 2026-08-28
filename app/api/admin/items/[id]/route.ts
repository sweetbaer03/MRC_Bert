import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import { EVIDENCE_TYPES } from "@/lib/constants";

const updateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  evidenceType: z
    .enum([EVIDENCE_TYPES.STATUS, EVIDENCE_TYPES.STATUS_FILE, EVIDENCE_TYPES.TEXT, EVIDENCE_TYPES.FILE])
    .optional(),
  required: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
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

  const item = await prisma.item.update({ where: { id }, data: parsed.data });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  // 이미 회차 스냅샷(RoundItem)에서 참조 중인 항목은 실제 삭제 대신 비활성화 처리해
  // 과거 취합 자료의 무결성을 보존합니다.
  const usedInRound = await prisma.roundItem.count({ where: { itemId: id } });
  if (usedInRound > 0) {
    const item = await prisma.item.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true, item });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
