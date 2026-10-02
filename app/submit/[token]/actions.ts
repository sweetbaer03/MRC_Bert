"use server";

import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { COMPLIANCE_STATUSES } from "@/lib/constants";
import { redirectWith } from "@/lib/flash";
import { deleteUpload } from "@/lib/storage";
import { findAssignmentByToken, isEditable, submitterLabel, type LoadedAssignment } from "@/lib/submission";
import { findMissingItems } from "@/lib/validation";

const MAX_NOTE_LENGTH = 4000;

/**
 * 제출 화면의 모든 버튼이 이 액션을 사용합니다. 어떤 버튼이든 입력값을 먼저 저장하므로
 * 첨부 삭제 등으로 작성 중인 내용이 사라지지 않습니다.
 *  - intent=save: 임시저장 (FR-32)
 *  - intent=submit: 필수 항목 검증 후 제출 (FR-33)
 *  - intent=delete:<attachmentId>: 첨부 삭제
 */
export async function submitterAction(token: string, form: FormData) {
  const path = `/submit/${token}`;
  const a = await findAssignmentByToken(token);
  if (!a) redirectWith(path, { error: "유효하지 않은 링크입니다." });
  if (!isEditable(a)) redirectWith(path, { error: "현재는 수정할 수 없습니다." });

  await saveResponses(a, form);

  const intent = String(form.get("intent") ?? "save");
  const actor = { type: "SUBMITTER" as const, label: submitterLabel(a) };

  if (intent.startsWith("delete:")) {
    const attachmentId = intent.slice("delete:".length);
    const att = await prisma.attachment.findFirst({
      where: { id: attachmentId, response: { assignmentId: a.id } },
    });
    if (att) {
      await prisma.attachment.delete({ where: { id: att.id } });
      await deleteUpload(att.storedName);
      await audit(actor, "FILE_DELETE", att.filename, a.round.name);
    }
    redirectWith(path, { ok: "첨부파일을 삭제했습니다." });
  }

  if (intent === "submit") {
    const fresh = await prisma.response.findMany({
      where: { assignmentId: a.id },
      include: { _count: { select: { attachments: true } } },
    });
    const responses = new Map(
      fresh.map((r) => [r.roundItemId, { status: r.status, note: r.note, attachmentCount: r._count.attachments }]),
    );
    const missing = findMissingItems(a.round.items, responses);
    if (missing.length > 0) {
      const lines = missing.slice(0, 10).map((m) => `· ${m.item.code ?? ""} ${m.item.title}: ${m.reason}`);
      if (missing.length > 10) lines.push(`외 ${missing.length - 10}건`);
      redirectWith(path, { error: `작성 내용은 저장했지만, 아래 항목을 확인한 뒤 제출해주세요.\n${lines.join("\n")}` });
    }
    await prisma.assignment.update({
      where: { id: a.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await audit(actor, "SUBMIT", a.round.name);
    redirectWith(path, { ok: "제출했습니다. 보호담당자가 검토 후 결과를 알려드립니다." });
  }

  await audit(actor, "SAVE_DRAFT", a.round.name);
  redirectWith(path, { ok: "임시저장했습니다." });
}

async function saveResponses(a: LoadedAssignment, form: FormData) {
  const ops = a.round.items.map((item) => {
    const rawStatus = form.get(`status_${item.id}`);
    const status =
      item.responseType.startsWith("STATUS") &&
      typeof rawStatus === "string" &&
      (COMPLIANCE_STATUSES as readonly string[]).includes(rawStatus)
        ? rawStatus
        : null;
    const rawNote = form.get(`note_${item.id}`);
    const note = typeof rawNote === "string" && rawNote.trim() ? rawNote.trim().slice(0, MAX_NOTE_LENGTH) : null;

    return prisma.response.upsert({
      where: { assignmentId_roundItemId: { assignmentId: a.id, roundItemId: item.id } },
      update: { status, note },
      create: { assignmentId: a.id, roundItemId: item.id, status, note },
    });
  });

  await prisma.$transaction([
    ...ops,
    ...(a.status === "NOT_STARTED"
      ? [prisma.assignment.update({ where: { id: a.id }, data: { status: "IN_PROGRESS" } })]
      : []),
  ]);
}
