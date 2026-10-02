import { prisma } from "@/lib/prisma";
import { fileResponse } from "@/lib/download";

/** 제출 담당자는 자신의 배정에 속한 파일만 내려받을 수 있습니다. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const att = await prisma.attachment.findFirst({
    where: { id, response: { assignment: { token } } },
  });
  if (!att) return new Response("파일을 찾을 수 없습니다.", { status: 404 });
  return fileResponse(att);
}
