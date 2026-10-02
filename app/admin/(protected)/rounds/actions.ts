"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ROUND_STATUSES, ROUND_STATUS_LABELS, type RoundStatus } from "@/lib/constants";
import { optDate, optStr, redirectWith, str } from "@/lib/flash";
import { generateSubmitToken } from "@/lib/token";

const roundPath = (id: string) => `/admin/rounds/${id}`;

/** FR-20, FR-04: 회차 생성 시 활성 항목을 스냅샷으로 복사하고 대상 시스템을 배정합니다. */
export async function createRound(form: FormData) {
  const admin = await requireAdmin();
  const name = str(form, "name");
  const systemIds = form.getAll("systemIds").filter((v): v is string => typeof v === "string");
  if (!name) redirectWith("/admin/rounds/new", { error: "회차명을 입력해주세요." });

  const items = await prisma.item.findMany({
    where: { isActive: true, category: { isActive: true } },
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { category: { createdAt: "asc" } }, { order: "asc" }, { createdAt: "asc" }],
  });
  if (items.length === 0) {
    redirectWith("/admin/rounds/new", { error: "활성화된 점검 항목이 없습니다. 점검 항목을 먼저 등록해주세요." });
  }

  const round = await prisma.$transaction(async (tx) => {
    const created = await tx.round.create({
      data: {
        name,
        description: optStr(form, "description"),
        startDate: optDate(form, "startDate"),
        dueDate: optDate(form, "dueDate"),
      },
    });
    await tx.roundItem.createMany({
      data: items.map((it, idx) => ({
        roundId: created.id,
        sourceItemId: it.id,
        categoryName: it.category.name,
        code: it.code,
        title: it.title,
        description: it.description,
        responseType: it.responseType,
        required: it.required,
        order: idx,
      })),
    });
    if (systemIds.length > 0) {
      await tx.assignment.createMany({
        data: systemIds.map((systemId) => ({ roundId: created.id, systemId, token: generateSubmitToken() })),
      });
    }
    return created;
  });

  await audit({ type: "ADMIN", email: admin.email }, "ROUND_CREATE", name, `항목 ${items.length}개, 대상 ${systemIds.length}개`);
  redirectWith(roundPath(round.id), { ok: "회차를 생성했습니다. 준비가 끝나면 '진행 시작'을 눌러 제출을 받으세요." });
}

export async function updateRound(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name");
  if (!name) redirectWith(roundPath(id), { error: "회차명을 입력해주세요." });

  await prisma.round.update({
    where: { id },
    data: {
      name,
      description: optStr(form, "description"),
      startDate: optDate(form, "startDate"),
      dueDate: optDate(form, "dueDate"),
    },
  });
  await audit({ type: "ADMIN", email: admin.email }, "ROUND_UPDATE", name);
  redirectWith(roundPath(id), { ok: "회차 정보를 저장했습니다." });
}

/** FR-21 */
export async function setRoundStatus(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const status = str(form, "status");
  if (!(ROUND_STATUSES as readonly string[]).includes(status)) {
    redirectWith(roundPath(id), { error: "잘못된 상태입니다." });
  }
  const round = await prisma.round.update({ where: { id }, data: { status } });
  await audit({ type: "ADMIN", email: admin.email }, "ROUND_STATUS", round.name, status);
  redirectWith(roundPath(id), { ok: `회차 상태를 '${ROUND_STATUS_LABELS[status as RoundStatus]}'(으)로 변경했습니다.` });
}

/** FR-22 */
export async function addAssignments(form: FormData) {
  const admin = await requireAdmin();
  const roundId = str(form, "roundId");
  const systemIds = form.getAll("systemIds").filter((v): v is string => typeof v === "string");
  if (systemIds.length === 0) redirectWith(roundPath(roundId), { error: "추가할 시스템을 선택해주세요." });

  const existing = await prisma.assignment.findMany({ where: { roundId }, select: { systemId: true } });
  const existingIds = new Set(existing.map((e) => e.systemId));
  const toAdd = systemIds.filter((sid) => !existingIds.has(sid));
  await prisma.assignment.createMany({
    data: toAdd.map((systemId) => ({ roundId, systemId, token: generateSubmitToken() })),
  });
  await audit({ type: "ADMIN", email: admin.email }, "ASSIGNMENT_ADD", roundId, `${toAdd.length}개 시스템`);
  redirectWith(roundPath(roundId), { ok: `${toAdd.length}개 시스템을 추가했습니다.` });
}

/** 아직 작성하지 않은 배정만 제외할 수 있습니다. */
export async function removeAssignment(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const a = await prisma.assignment.findUniqueOrThrow({ where: { id }, include: { system: true } });
  if (a.status !== "NOT_STARTED") {
    redirectWith(roundPath(a.roundId), { error: "작성이 시작된 배정은 제외할 수 없습니다." });
  }
  await prisma.assignment.delete({ where: { id } });
  await audit({ type: "ADMIN", email: admin.email }, "ASSIGNMENT_REMOVE", a.system.name, a.roundId);
  redirectWith(roundPath(a.roundId), { ok: `'${a.system.name}'을(를) 회차에서 제외했습니다.` });
}

/** FR-23: 링크 재발급 시 기존 링크는 즉시 무효가 됩니다. */
export async function reissueToken(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const a = await prisma.assignment.update({
    where: { id },
    data: { token: generateSubmitToken() },
    include: { system: true },
  });
  await audit({ type: "ADMIN", email: admin.email }, "TOKEN_REISSUE", a.system.name, a.roundId);
  redirectWith(roundPath(a.roundId), { ok: `'${a.system.name}'의 제출 링크를 재발급했습니다. 기존 링크는 더 이상 사용할 수 없습니다.` });
}

/** FR-41, FR-42: 검토완료 또는 보완요청 */
export async function reviewAssignment(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const decision = str(form, "decision");
  const reviewPath = (roundId: string) => `/admin/rounds/${roundId}/review/${id}`;

  const a = await prisma.assignment.findUniqueOrThrow({
    where: { id },
    include: { system: true, responses: { select: { id: true } } },
  });

  // 항목별 검토 의견은 결정과 무관하게 저장합니다.
  const updates = a.responses.map((r) =>
    prisma.response.update({
      where: { id: r.id },
      data: { reviewComment: optStr(form, `comment_${r.id}`) },
    }),
  );
  await prisma.$transaction(updates);

  if (decision === "SAVE") {
    await prisma.assignment.update({ where: { id }, data: { reviewNote: optStr(form, "reviewNote") } });
    revalidatePath(reviewPath(a.roundId));
    redirectWith(reviewPath(a.roundId), { ok: "검토 의견을 저장했습니다." });
  }

  if (decision !== "APPROVED" && decision !== "RETURNED") {
    redirectWith(reviewPath(a.roundId), { error: "잘못된 요청입니다." });
  }
  if (a.status !== "SUBMITTED" && a.status !== "APPROVED") {
    redirectWith(reviewPath(a.roundId), { error: "제출된 자료만 검토 처리할 수 있습니다." });
  }
  const reviewNote = optStr(form, "reviewNote");
  if (decision === "RETURNED" && !reviewNote) {
    redirectWith(reviewPath(a.roundId), { error: "보완요청 시 전체 검토 의견을 입력해주세요." });
  }

  await prisma.assignment.update({
    where: { id },
    data: { status: decision, reviewNote, reviewedAt: new Date() },
  });
  await audit({ type: "ADMIN", email: admin.email }, decision === "APPROVED" ? "REVIEW_APPROVE" : "REVIEW_RETURN", a.system.name, a.roundId);
  redirect(`${roundPath(a.roundId)}?ok=${encodeURIComponent(`'${a.system.name}' ${decision === "APPROVED" ? "검토완료" : "보완요청"} 처리했습니다.`)}`);
}
