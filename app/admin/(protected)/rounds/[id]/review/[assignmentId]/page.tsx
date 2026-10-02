import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { RESPONSE_TYPE_LABELS, label } from "@/lib/constants";
import { formatBytes, formatDateTime } from "@/lib/format";
import { groupByCategory } from "@/lib/group";
import type { FlashParams } from "@/lib/flash";
import { reviewAssignment } from "../../../actions";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
  searchParams: FlashParams;
}) {
  const { id, assignmentId } = await params;
  const { ok, error } = await searchParams;

  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      system: true,
      round: { include: { items: { orderBy: { order: "asc" } } } },
      responses: { include: { attachments: { orderBy: { uploadedAt: "asc" } } } },
    },
  });
  if (!a || a.roundId !== id) notFound();

  const byItem = new Map(a.responses.map((r) => [r.roundItemId, r]));
  const canDecide = a.status === "SUBMITTED" || a.status === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/rounds/${id}`} className="text-sm text-slate-500 hover:underline">← {a.round.name}</Link>
        <h1 className="text-xl font-semibold">{a.system.name}</h1>
        <StatusBadge status={a.status} />
      </div>
      <Flash ok={ok} error={error} />

      <section className="card grid gap-2 text-sm sm:grid-cols-3">
        <div><span className="text-slate-500">부서</span> {a.system.department ?? "-"}</div>
        <div><span className="text-slate-500">담당자</span> {a.system.managerName ?? "-"} {a.system.managerEmail}</div>
        <div><span className="text-slate-500">제출일시</span> {formatDateTime(a.submittedAt)}</div>
        <div><span className="text-slate-500">검토일시</span> {formatDateTime(a.reviewedAt)}</div>
      </section>

      <form action={reviewAssignment} className="space-y-6">
        <input type="hidden" name="id" value={a.id} />
        {groupByCategory(a.round.items).map(([category, items]) => (
          <section key={category} className="card">
            <h2 className="mb-3 font-semibold">{category}</h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const r = byItem.get(item.id);
                return (
                  <div key={item.id} className="grid gap-3 py-3 md:grid-cols-[1fr_1fr]">
                    <div>
                      <div className="text-sm font-medium">
                        {item.code && <span className="mr-1 text-slate-500">{item.code}</span>}
                        {item.title}
                        {item.required && <span className="ml-1 text-red-600">*</span>}
                      </div>
                      <div className="text-xs text-slate-500">{label(RESPONSE_TYPE_LABELS, item.responseType)}</div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <StatusBadge status={r?.status ?? null} />
                      </div>
                      {r?.note && <p className="mt-2 whitespace-pre-line rounded bg-slate-50 p-2 text-sm">{r.note}</p>}
                      {r && r.attachments.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm">
                          {r.attachments.map((f) => (
                            <li key={f.id}>
                              <a className="text-blue-700 hover:underline" href={`/api/files/${f.id}`}>{f.filename}</a>
                              <span className="ml-1 text-xs text-slate-500">{formatBytes(f.size)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      {r ? (
                        <textarea
                          className="input"
                          name={`comment_${r.id}`}
                          rows={2}
                          placeholder="항목별 검토 의견 (제출자에게 표시됩니다)"
                          defaultValue={r.reviewComment ?? ""}
                        />
                      ) : (
                        <p className="text-xs text-slate-400">응답 없음</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="card space-y-3">
          <label className="label" htmlFor="reviewNote">전체 검토 의견</label>
          <textarea id="reviewNote" className="input" name="reviewNote" rows={3} defaultValue={a.reviewNote ?? ""}
            placeholder="보완요청 시 필수. 제출자에게 표시됩니다." />
          <div className="flex flex-wrap gap-2">
            <SubmitButton name="decision" value="SAVE" className="btn-secondary">의견만 저장</SubmitButton>
            {canDecide && (
              <>
                <SubmitButton name="decision" value="RETURNED" className="btn-danger" confirm="보완요청하면 제출자가 다시 수정할 수 있습니다. 계속할까요?">보완요청</SubmitButton>
                <SubmitButton name="decision" value="APPROVED" confirm="검토완료 처리할까요?">검토완료</SubmitButton>
              </>
            )}
          </div>
          {!canDecide && <p className="text-xs text-slate-500">제출완료 상태에서만 검토완료·보완요청을 할 수 있습니다.</p>}
        </section>
      </form>
    </div>
  );
}
