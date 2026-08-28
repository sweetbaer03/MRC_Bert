import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
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

  const category = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const itemCount = await prisma.item.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: "해당 카테고리에 속한 점검 항목이 있어 삭제할 수 없습니다. 먼저 항목을 삭제하거나 다른 카테고리로 이동해주세요." },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
