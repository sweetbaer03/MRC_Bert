import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import type { FlashParams } from "@/lib/flash";
import { saveSystem, toggleSystem } from "./actions";

type SystemLike = {
  id: string; name: string; department: string | null; managerName: string | null;
  managerEmail: string | null; managerPhone: string | null; memo: string | null;
};

export default async function SystemsPage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, error } = await searchParams;
  const systems = await prisma.system.findMany({
    orderBy: [{ isActive: "desc" }, { department: "asc" }, { name: "asc" }],
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">점검 대상 시스템</h1>
        <p className="text-sm text-slate-500">자료를 제출할 개인정보 처리시스템(또는 부서)과 담당자를 관리합니다.</p>
      </div>
      <Flash ok={ok} error={error} />

      <section className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>시스템명</th><th>부서</th><th>담당자</th><th>연락처</th><th className="w-16">회차</th><th className="w-28"></th></tr>
          </thead>
          <tbody>
            {systems.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-slate-500">등록된 시스템이 없습니다.</td></tr>
            )}
            {systems.map((s) => (
              <tr key={s.id} className={s.isActive ? "" : "opacity-50"}>
                <td>
                  <div className="font-medium">{s.name}{!s.isActive && " (비활성)"}</div>
                  {s.memo && <div className="text-xs text-slate-500">{s.memo}</div>}
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-blue-700">수정</summary>
                    <SystemForm system={s} />
                  </details>
                </td>
                <td>{s.department ?? "-"}</td>
                <td>{s.managerName ?? "-"}</td>
                <td className="text-xs">{s.managerEmail}<br />{s.managerPhone}</td>
                <td>{s._count.assignments}</td>
                <td>
                  <form action={toggleSystem}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton className="btn-secondary">{s.isActive ? "비활성화" : "활성화"}</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-1 font-semibold">새 시스템 등록</h2>
        <SystemForm />
      </section>
    </div>
  );
}

function SystemForm({ system }: { system?: SystemLike }) {
  return (
    <form action={saveSystem} className="mt-2 grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="id" value={system?.id ?? ""} />
      <div><label className="label">시스템명 *</label><input className="input" name="name" defaultValue={system?.name ?? ""} required /></div>
      <div><label className="label">부서</label><input className="input" name="department" defaultValue={system?.department ?? ""} /></div>
      <div><label className="label">담당자</label><input className="input" name="managerName" defaultValue={system?.managerName ?? ""} /></div>
      <div><label className="label">이메일</label><input className="input" name="managerEmail" type="email" defaultValue={system?.managerEmail ?? ""} /></div>
      <div><label className="label">연락처</label><input className="input" name="managerPhone" defaultValue={system?.managerPhone ?? ""} /></div>
      <div><label className="label">메모</label><input className="input" name="memo" defaultValue={system?.memo ?? ""} /></div>
      <div className="sm:col-span-3"><SubmitButton>저장</SubmitButton></div>
    </form>
  );
}
