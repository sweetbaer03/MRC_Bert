import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { SystemPicker } from "@/components/SystemPicker";
import type { FlashParams } from "@/lib/flash";
import { createRound } from "../actions";

export default async function NewRoundPage({ searchParams }: { searchParams: FlashParams }) {
  const { error } = await searchParams;
  const [systems, itemCount] = await Promise.all([
    prisma.system.findMany({ where: { isActive: true }, orderBy: [{ department: "asc" }, { name: "asc" }] }),
    prisma.item.count({ where: { isActive: true, category: { isActive: true } } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">새 회차 만들기</h1>
      <Flash error={error} />
      <form action={createRound} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">회차명 *</label><input className="input" name="name" placeholder="예: 2026년 하반기 정기 점검" required /></div>
          <div className="sm:col-span-2"><label className="label">안내 문구</label><textarea className="input" name="description" rows={3} placeholder="제출 담당자에게 보여줄 안내 사항" /></div>
          <div><label className="label">시작일</label><input className="input" name="startDate" type="date" /></div>
          <div><label className="label">마감일</label><input className="input" name="dueDate" type="date" /></div>
        </div>
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          현재 활성화된 점검 항목 <b>{itemCount}개</b>가 이 회차에 복사됩니다. 이후 항목을 수정해도 이 회차에는 반영되지 않습니다.
        </p>
        <div>
          <div className="label">대상 시스템 ({systems.length}개)</div>
          <SystemPicker systems={systems} />
        </div>
        <SubmitButton pendingText="생성 중...">회차 생성</SubmitButton>
      </form>
    </div>
  );
}
