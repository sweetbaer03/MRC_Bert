import "server-only";
import { prisma } from "@/lib/prisma";
import { EDITABLE_ASSIGNMENT_STATUSES } from "@/lib/constants";

/** 제출 링크 토큰으로 배정 정보를 조회합니다. 토큰 형식이 아니면 바로 null. */
export async function findAssignmentByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
  return prisma.assignment.findUnique({
    where: { token },
    include: {
      system: true,
      round: { include: { items: { orderBy: { order: "asc" } } } },
      responses: { include: { attachments: { orderBy: { uploadedAt: "asc" } } } },
    },
  });
}

export type LoadedAssignment = NonNullable<Awaited<ReturnType<typeof findAssignmentByToken>>>;

/** FR-34, FR-35: 회차가 진행중이고 제출 전(또는 보완요청) 상태일 때만 수정 가능 */
export function isEditable(a: { status: string; round: { status: string } }) {
  return a.round.status === "OPEN" && EDITABLE_ASSIGNMENT_STATUSES.includes(a.status);
}

export function submitterLabel(a: { id: string; system: { name: string } }) {
  return `${a.system.name}(${a.id.slice(-6)})`;
}
