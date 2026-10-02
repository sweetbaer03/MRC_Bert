import Link from "next/link";
import type { RoundSummary } from "@/lib/stats";
import { formatDate, formatPercent } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export function RoundTable({ rounds }: { rounds: RoundSummary[] }) {
  if (rounds.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">회차가 없습니다.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>회차</th><th className="w-20">상태</th><th className="w-28">마감일</th>
            <th className="w-16">대상</th><th className="w-16">미시작</th><th className="w-16">작성중</th>
            <th className="w-16">제출</th><th className="w-20">보완요청</th><th className="w-20">검토완료</th>
            <th className="w-16">제출률</th><th className="w-16">이행률</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id}>
              <td><Link className="font-medium text-blue-700 hover:underline" href={`/admin/rounds/${r.id}`}>{r.name}</Link></td>
              <td><StatusBadge status={r.status} /></td>
              <td>{formatDate(r.dueDate)}</td>
              <td>{r.assignmentCount}</td>
              <td>{r.byStatus.NOT_STARTED}</td>
              <td>{r.byStatus.IN_PROGRESS}</td>
              <td>{r.byStatus.SUBMITTED}</td>
              <td>{r.byStatus.RETURNED}</td>
              <td>{r.byStatus.APPROVED}</td>
              <td>{formatPercent(r.submitRate)}</td>
              <td>{formatPercent(r.complianceRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
