"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearAdminSession, createAdminSession, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { redirectWith, str } from "@/lib/flash";

export async function login(form: FormData) {
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");

  const admin = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
  const ok = admin ? await verifyPassword(password, admin.passwordHash) : false;

  if (!admin || !ok) {
    // 계정 존재 여부를 드러내지 않도록 동일한 메시지와 지연을 둡니다.
    await new Promise((r) => setTimeout(r, 500));
    await audit({ type: "ADMIN", email: email || "(빈 값)" }, "LOGIN_FAILED");
    redirectWith("/admin/login", { error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession({ adminId: admin.id, email: admin.email, name: admin.name });
  await audit({ type: "ADMIN", email: admin.email }, "LOGIN");
  redirect("/admin");
}

export async function logout() {
  await clearAdminSession();
  redirect("/admin/login");
}
