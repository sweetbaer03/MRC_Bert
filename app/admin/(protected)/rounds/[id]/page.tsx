import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { SystemPicker } from "@/components/SystemPicker";
import { formatDate, formatDateTime, formatPercent, toDateInput } from "@/lib/format";
import { complianceRate } from "@/lib/validation";
import type { FlashParams } from "@/lib/flash";
import { addAssignments, reissueToken, removeAssignment, setRoundStatus, updateRound } from "../actions";

export default async function RoundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: FlashParams;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;

  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      _count: { select: { items: true } },
      assignments: {
        orderBy: [{ system: { department: "asc" } }, { system: { name: "asc" } }],
        include: { system: true, responses: { select: { status: true, _count: { select: { attachments: true } } } } },
      },
    },
  });
  if (!round) notFound();

  const assignedIds = new Set(round.assignments.map((a) => a.systemId));
  const available = await prisma.system.findMany({
    where: { isActive: true, id: { notIn: [...assignedIds] } },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });

  const nextStatus = round.status === "DRAFT" ? ["OPEN", "진행 시작"] : round.status === "OPEN" ? ["CLOSED", "마감"] : ["OPEN", "다시 열기"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/rounds" className="text-sm text-slate-500 hover:underline">← 회차 목록</Link>
        <h1 className="text-xl font-semibold">{round.name}</h1>
        <StatusBadge status={round.status} />
        <div className="ml-auto flex gap-2">
          <a href={`/admin/rounds/${round.id}/export`} className="btn-secondary">CSV 내보내기</a>
          <form action={setRoundStatus}>
            <input type="hidden" name="id" value={round.id} />
            <input type="hidden" name="status" value={nextStatus[0]} />
            <SubmitButton
              className={nextStatus[0] === "CLOSED" ? "btn-danger" : "btn-primary"}
              confirm={`'${nextStatus[1]}' 하시겠습니까?`}
            >
              {nextStatus[1]}
            </SubmitButton>
          </form>
        </div>
      </div>
      <Flash ok={ok} error={error} />

      <section className="card">
        <div className="grid gap-2 text-sm sm:grid-cols-4">
          <div><span className="text-slate-500">점검 항목</span> {round._count.items}개</div>
          <div><span className="text-slate-500">대상</span> {round.assignments.length}개</div>
          <div><span className="text-slate-500">기간</span> {formatDate(round.startDate)} ~ {formatDate(round.dueDate)}</div>
        </div>
        {round.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{round.description}</p>}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-700">회차 정보 수정</summary>
          <form action={updateRound} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={round.id} />
            <div className="sm:col-span-2"><label className="label">회차명</label><input className="input" name="name" defaultValue={round.name} required /></div>
            <div className="sm:col-span-2"><label className="label">안내 문구</label><textarea className="input" name="description" rows={3} defaultValue={round.description ?? ""} /></div>
            <div><label className="label">시작일</label><input className="input" name="startDate" type="date" defaultValue={toDateInput(round.startDate)} /></div>
            <div><label className="label">마감일</label><input className="input" name="dueDate" type="date" defaultValue={toDateInput(round.dueDate)} /></div>
            <div className="sm:col-span-2"><SubmitButton>저장</SubmitButton></div>
          </form>
        </details>
      </section>

      {round.status === "DRAFT" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          준비중인 회차입니다. 제출 링크로 접속하면 열람만 가능하며, &apos;진행 시작&apos; 후 작성할 수 있습니다.
        </p>
      )}

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">제출 현황</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>시스템</th><th className="w-24">상태</th><th className="w-20">응답</th><th className="w-16">첨부</th>
              <th className="w-16">이행률</th><th className="w-36">제출일시</th><th className="w-72">제출 링크 / 관리</th>
            </tr>
          </thead>
          <tbody>
            {round.assignments.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-slate-500">배정된 시스템이 없습니다.</td></tr>
            )}
            {round.assignments.map((a) => {
              const answered = a.responses.filter((r) => r.status).length;
              const files = a.responses.reduce((n, r) => n + r._count.attachments, 0);
              return (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.system.name}</div>
                    <div className="text-xs text-slate-500">{a.system.department} {a.system.managerName && `· ${a.system.managerName}`}</div>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{answered}/{round._count.items}</td>
                  <td>{files}</td>
                  <td>{formatPercent(complianceRate(a.responses.map((r) => r.status)))}</td>
                  <td className="text-xs">{formatDateTime(a.submittedAt)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/admin/rounds/${round.id}/review/${a.id}`} className="btn-primary">
                        {a.status === "SUBMITTED" ? "검토하기" : "상세"}
                      </Link>
                      <CopyButton text={`/submit/${a.token}`} />
                      <form action={reissueToken}>
                        <input type="hidden" name="id" value={a.id} />
                        <SubmitButton className="btn-secondary" confirm="링크를 재발급하면 기존 링크는 즉시 사용할 수 없습니다. 계속할까요?">재발급</SubmitButton>
                      </form>
                      {a.status === "NOT_STARTED" && (
                        <form action={removeAssignment}>
                          <input type="hidden" name="id" value={a.id} />
                          <SubmitButton className="btn-secondary" confirm={`'${a.system.name}'을(를) 회차에서 제외할까요?`}>제외</SubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {available.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-semibold">대상 시스템 추가</h2>
          <form action={addAssignments} className="space-y-3">
            <input type="hidden" name="roundId" value={round.id} />
            <SystemPicker systems={available} />
            <SubmitButton>선택한 시스템 추가</SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
