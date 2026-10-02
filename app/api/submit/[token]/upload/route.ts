import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { saveUpload, validateUpload } from "@/lib/storage";
import { findAssignmentByToken, isEditable, submitterLabel } from "@/lib/submission";

/** 제출 담당자 증적파일 업로드 (FR-31) */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await findAssignmentByToken(token);
  if (!a) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  if (!isEditable(a)) return NextResponse.json({ error: "현재는 수정할 수 없습니다." }, { status: 409 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const roundItemId = form?.get("roundItemId");
  if (!(file instanceof File) || typeof roundItemId !== "string") {
    return NextResponse.json({ error: "파일을 선택해주세요." }, { status: 400 });
  }
  const item = a.round.items.find((i) => i.id === roundItemId);
  if (!item || (item.responseType !== "STATUS_FILE" && item.responseType !== "FILE")) {
    return NextResponse.json({ error: "파일을 첨부할 수 없는 항목입니다." }, { status: 400 });
  }
  const invalid = validateUpload(file);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const storedName = await saveUpload(file);
  const response = await prisma.response.upsert({
    where: { assignmentId_roundItemId: { assignmentId: a.id, roundItemId } },
    update: {},
    create: { assignmentId: a.id, roundItemId },
  });
  const att = await prisma.attachment.create({
    data: {
      responseId: response.id,
      filename: path.basename(file.name).slice(0, 255),
      storedName,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  });
  if (a.status === "NOT_STARTED") {
    await prisma.assignment.update({ where: { id: a.id }, data: { status: "IN_PROGRESS" } });
  }
  await audit({ type: "SUBMITTER", label: submitterLabel(a) }, "FILE_UPLOAD", att.filename, a.round.name);
  return NextResponse.json({ id: att.id, filename: att.filename }, { status: 201 });
}
