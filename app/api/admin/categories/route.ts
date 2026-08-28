import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(categories);
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "카테고리명을 입력해주세요." }, { status: 400 });
  }

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
