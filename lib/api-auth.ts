import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };
  }
  return { session, unauthorized: null };
}
