import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const systems = await prisma.system.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(systems);
}

const createSchema = z.object({
  name: z.string().min(1),
  department: z.string().optional(),
  managerName: z.string().optional(),
  managerEmail: z.string().email().optional().or(z.literal("")),
  managerPhone: z.string().optional(),
  memo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "시스템/부서명을 입력해주세요." }, { status: 400 });
  }

  const system = await prisma.system.create({
    data: {
      name: parsed.data.name,
      department: parsed.data.department || undefined,
      managerName: parsed.data.managerName || undefined,
      managerEmail: parsed.data.managerEmail || undefined,
      managerPhone: parsed.data.managerPhone || undefined,
      memo: parsed.data.memo || undefined,
    },
  });
  return NextResponse.json(system, { status: 201 });
}
