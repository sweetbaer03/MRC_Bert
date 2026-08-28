import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import { EVIDENCE_TYPES } from "@/lib/constants";

const createSchema = z.object({
  categoryId: z.string().min(1),
  code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  evidenceType: z.enum([
    EVIDENCE_TYPES.STATUS,
    EVIDENCE_TYPES.STATUS_FILE,
    EVIDENCE_TYPES.TEXT,
    EVIDENCE_TYPES.FILE,
  ]),
  required: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const maxOrder = await prisma.item.aggregate({
    _max: { order: true },
    where: { categoryId: parsed.data.categoryId },
  });

  const item = await prisma.item.create({
    data: {
      categoryId: parsed.data.categoryId,
      code: parsed.data.code,
      title: parsed.data.title,
      description: parsed.data.description,
      evidenceType: parsed.data.evidenceType,
      required: parsed.data.required ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
