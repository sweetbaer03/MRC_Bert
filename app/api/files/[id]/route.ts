import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fileResponse } from "@/lib/download";

/** 관리자 증적파일 다운로드 (FR-40) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return new Response("인증이 필요합니다.", { status: 401 });

  const { id } = await params;
  const att = await prisma.attachment.findUnique({
    where: { id },
    include: { response: { include: { assignment: { include: { system: true } } } } },
  });
  if (!att) return new Response("파일을 찾을 수 없습니다.", { status: 404 });

  await audit({ type: "ADMIN", email: session.email }, "FILE_DOWNLOAD", att.filename, att.response.assignment.system.name);
  return fileResponse(att);
}
