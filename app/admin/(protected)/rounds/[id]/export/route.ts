import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/csv";
import { ASSIGNMENT_STATUS_LABELS, COMPLIANCE_STATUS_LABELS, RESPONSE_TYPE_LABELS, label } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

/** FR-50: 회차 결과 CSV (시스템 × 항목 1행) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return new Response("인증이 필요합니다.", { status: 401 });

  const { id } = await params;
  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      assignments: {
        orderBy: [{ system: { department: "asc" } }, { system: { name: "asc" } }],
        include: { system: true, responses: { include: { _count: { select: { attachments: true } } } } },
      },
    },
  });
  if (!round) return new Response("회차를 찾을 수 없습니다.", { status: 404 });

  const rows: (string | number | null)[][] = [[
    "부서", "시스템", "담당자", "제출상태", "제출일시", "영역", "코드", "항목", "응답유형", "필수",
    "이행여부", "비고", "첨부수", "항목 검토의견", "전체 검토의견",
  ]];
  for (const a of round.assignments) {
    const byItem = new Map(a.responses.map((r) => [r.roundItemId, r]));
    for (const item of round.items) {
      const r = byItem.get(item.id);
      rows.push([
        a.system.department, a.system.name, a.system.managerName,
        label(ASSIGNMENT_STATUS_LABELS, a.status), formatDateTime(a.submittedAt),
        item.categoryName, item.code, item.title, label(RESPONSE_TYPE_LABELS, item.responseType), item.required ? "Y" : "N",
        r?.status ? label(COMPLIANCE_STATUS_LABELS, r.status) : "", r?.note ?? "", r?._count.attachments ?? 0,
        r?.reviewComment ?? "", a.reviewNote,
      ]);
    }
  }

  await audit({ type: "ADMIN", email: session.email }, "EXPORT_CSV", round.name);
  const filename = encodeURIComponent(`${round.name}_결과.csv`);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "no-store",
    },
  });
}
