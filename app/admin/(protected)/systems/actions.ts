"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { optStr, redirectWith, str } from "@/lib/flash";

const PATH = "/admin/systems";

export async function saveSystem(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name");
  if (!name) redirectWith(PATH, { error: "시스템명을 입력해주세요." });

  const data = {
    name,
    department: optStr(form, "department"),
    managerName: optStr(form, "managerName"),
    managerEmail: optStr(form, "managerEmail"),
    managerPhone: optStr(form, "managerPhone"),
    memo: optStr(form, "memo"),
  };
  if (id) await prisma.system.update({ where: { id }, data });
  else await prisma.system.create({ data });

  await audit({ type: "ADMIN", email: admin.email }, id ? "SYSTEM_UPDATE" : "SYSTEM_CREATE", name);
  revalidatePath(PATH);
  redirectWith(PATH, { ok: `'${name}'을(를) 저장했습니다.` });
}

export async function toggleSystem(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const sys = await prisma.system.findUniqueOrThrow({ where: { id } });
  await prisma.system.update({ where: { id }, data: { isActive: !sys.isActive } });
  await audit({ type: "ADMIN", email: admin.email }, sys.isActive ? "SYSTEM_DISABLE" : "SYSTEM_ENABLE", sys.name);
  revalidatePath(PATH);
}
