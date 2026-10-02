"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { RESPONSE_TYPES } from "@/lib/constants";
import { optStr, redirectWith, str } from "@/lib/flash";

const PATH = "/admin/checklist";

function parseOrder(form: FormData) {
  const n = Number(str(form, "order"));
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export async function saveCategory(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name");
  if (!name) redirectWith(PATH, { error: "영역명을 입력해주세요." });

  const data = { name, description: optStr(form, "description"), order: parseOrder(form) };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });

  await audit({ type: "ADMIN", email: admin.email }, id ? "CATEGORY_UPDATE" : "CATEGORY_CREATE", name);
  revalidatePath(PATH);
  redirectWith(PATH, { ok: "점검 영역을 저장했습니다." });
}

export async function toggleCategory(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const cat = await prisma.category.findUniqueOrThrow({ where: { id } });
  await prisma.category.update({ where: { id }, data: { isActive: !cat.isActive } });
  await audit({ type: "ADMIN", email: admin.email }, cat.isActive ? "CATEGORY_DISABLE" : "CATEGORY_ENABLE", cat.name);
  revalidatePath(PATH);
}

export async function saveItem(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const categoryId = str(form, "categoryId");
  const title = str(form, "title");
  const responseType = str(form, "responseType");

  if (!title || !categoryId) redirectWith(PATH, { error: "영역과 항목명을 입력해주세요." });
  if (!(RESPONSE_TYPES as readonly string[]).includes(responseType)) {
    redirectWith(PATH, { error: "응답 유형이 올바르지 않습니다." });
  }

  const data = {
    categoryId,
    title,
    responseType,
    code: optStr(form, "code"),
    description: optStr(form, "description"),
    required: form.get("required") === "on",
    order: parseOrder(form),
  };
  if (id) await prisma.item.update({ where: { id }, data });
  else await prisma.item.create({ data });

  await audit({ type: "ADMIN", email: admin.email }, id ? "ITEM_UPDATE" : "ITEM_CREATE", title);
  revalidatePath(PATH);
  redirectWith(PATH, { ok: "점검 항목을 저장했습니다. 이미 생성된 회차에는 반영되지 않습니다." });
}

export async function toggleItem(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const item = await prisma.item.findUniqueOrThrow({ where: { id } });
  await prisma.item.update({ where: { id }, data: { isActive: !item.isActive } });
  await audit({ type: "ADMIN", email: admin.email }, item.isActive ? "ITEM_DISABLE" : "ITEM_ENABLE", item.title);
  revalidatePath(PATH);
}
