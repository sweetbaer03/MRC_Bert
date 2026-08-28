import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().nullable().optional(),
  managerName: z.string().nullable().optional(),
  managerEmail: z.string().nullable().optional(),
  managerPhone: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  regenerateToken: z.boolean().optional(),
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

  const { regenerateToken, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (regenerateToken) {
    data.token = randomUUID();
  }

  const system = await prisma.system.update({ where: { id }, data });
  return NextResponse.json(system);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const usedInRound = await prisma.roundSystem.count({ where: { systemId: id } });
  if (usedInRound > 0) {
    const system = await prisma.system.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true, system });
  }

  await prisma.system.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
