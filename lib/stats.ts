import "server-only";
import { prisma } from "@/lib/prisma";
import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "@/lib/constants";
import { complianceRate } from "@/lib/validation";

export type RoundSummary = {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  itemCount: number;
  assignmentCount: number;
  byStatus: Record<AssignmentStatus, number>;
  /** 제출완료 + 보완요청 + 검토완료 비율 */
  submitRate: number | null;
  /** 제출·검토완료 건 기준 이행률 */
  complianceRate: number | null;
};

export async function getRoundSummaries(where: { status?: string } = {}): Promise<RoundSummary[]> {
  const rounds = await prisma.round.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      assignments: {
        select: { status: true, responses: { select: { status: true } } },
      },
    },
  });

  return rounds.map((r) => {
    const byStatus = Object.fromEntries(ASSIGNMENT_STATUSES.map((s) => [s, 0])) as Record<AssignmentStatus, number>;
    const submittedStatuses: (string | null)[] = [];
    for (const a of r.assignments) {
      byStatus[a.status as AssignmentStatus] = (byStatus[a.status as AssignmentStatus] ?? 0) + 1;
      if (a.status === "SUBMITTED" || a.status === "APPROVED") {
        submittedStatuses.push(...a.responses.map((x) => x.status));
      }
    }
    const total = r.assignments.length;
    const submitted = byStatus.SUBMITTED + byStatus.RETURNED + byStatus.APPROVED;
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      dueDate: r.dueDate,
      itemCount: r._count.items,
      assignmentCount: total,
      byStatus,
      submitRate: total === 0 ? null : submitted / total,
      complianceRate: complianceRate(submittedStatuses),
    };
  });
}
