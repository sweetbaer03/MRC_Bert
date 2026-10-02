import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { FileUploader } from "@/components/FileUploader";
import {
  COMPLIANCE_STATUSES,
  COMPLIANCE_STATUS_LABELS,
  RESPONSE_TYPE_LABELS,
  ROUND_STATUS_LABELS,
  label,
} from "@/lib/constants";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { groupByCategory } from "@/lib/group";
import { findAssignmentByToken, isEditable } from "@/lib/submission";
import type { FlashParams } from "@/lib/flash";
import { submitterAction } from "./actions";

export const metadata = { referrer: "no-referrer" as const };

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: FlashParams;
}) {
  const { token } = await params;
  const { ok, error } = await searchParams;
  const a = await findAssignmentByToken(token);
  if (!a) notFound();

  const editable = isEditable(a);
  const byItem = new Map(a.responses.map((r) => [r.roundItemId, r]));
  const answered = a.round.items.filter((i) => {
    const r = byItem.get(i.id);
    return r && (r.status || r.note || r.attachments.length > 0);
  }).length;
  const action = submitterAction.bind(null, token);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="card">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{a.round.name}</h1>
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
          <div>대상: <b>{a.system.name}</b> {a.system.department && `(${a.system.department})`}</div>
          <div>마감일: <b>{formatDate(a.round.dueDate)}</b></div>
          <div>작성: {answered}/{a.round.items.length} 항목</div>
        </div>
        {a.round.description && <p className="mt-3 whitespace-pre-line rounded bg-slate-50 p-3 text-sm">{a.round.description}</p>}
      </header>

      <Flash ok={ok} error={error} />
      <Notice status={a.status} roundStatus={a.round.status} submittedAt={a.submittedAt} />
      {a.reviewNote && (a.status === "RETURNED" || a.status === "APPROVED") && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
          <div className="mb-1 font-medium text-blue-900">보호담당자 검토 의견</div>
          <p className="whitespace-pre-line text-blue-900">{a.reviewNote}</p>
        </div>
      )}

      <form action={action} className="space-y-6">
        {groupByCategory(a.round.items).map(([category, items]) => (
          <section key={category} className="card">
            <h2 className="mb-2 font-semibold">{category}</h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const r = byItem.get(item.id);
                const hasStatus = item.responseType.startsWith("STATUS");
                const hasFile = item.responseType === "STATUS_FILE" || item.responseType === "FILE";
                return (
                  <div key={item.id} className="space-y-2 py-4">
                    <div>
                      <div className="font-medium">
                        {item.code && <span className="mr-1 text-slate-500">{item.code}</span>}
                        {item.title}
                        {item.required && <span className="ml-1 text-red-600" title="필수">*</span>}
                        <span className="ml-2 text-xs font-normal text-slate-500">{label(RESPONSE_TYPE_LABELS, item.responseType)}</span>
                      </div>
                      {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                    </div>

                    {hasStatus && (
                      <fieldset className="flex flex-wrap gap-4 text-sm" disabled={!editable}>
                        <legend className="sr-only">이행여부</legend>
                        {COMPLIANCE_STATUSES.map((s) => (
                          <label key={s} className="flex items-center gap-1">
                            <input type="radio" name={`status_${item.id}`} value={s} defaultChecked={r?.status === s} />
                            {COMPLIANCE_STATUS_LABELS[s]}
                          </label>
                        ))}
                      </fieldset>
                    )}

                    <textarea
                      className="input"
                      name={`note_${item.id}`}
                      rows={item.responseType === "TEXT" ? 4 : 2}
                      maxLength={4000}
                      placeholder={item.responseType === "TEXT" ? "내용을 입력해주세요." : "비고 (선택)"}
                      defaultValue={r?.note ?? ""}
                      readOnly={!editable}
                    />

                    {(hasFile || (r && r.attachments.length > 0)) && (
                      <div className="space-y-1">
                        {r?.attachments.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 text-sm">
                            <a className="text-blue-700 hover:underline" href={`/api/submit/${token}/files/${f.id}`}>{f.filename}</a>
                            <span className="text-xs text-slate-500">{formatBytes(f.size)} · {formatDateTime(f.uploadedAt)}</span>
                            {editable && (
                              <SubmitButton name="intent" value={`delete:${f.id}`} className="btn-secondary !px-2 !py-0.5 text-xs"
                                confirm={`'${f.filename}'을(를) 삭제할까요?`} pendingText="...">삭제</SubmitButton>
                            )}
                          </div>
                        ))}
                        {editable && hasFile && <FileUploader token={token} roundItemId={item.id} />}
                      </div>
                    )}

                    {r?.reviewComment && (
                      <p className="rounded bg-blue-50 p-2 text-sm text-blue-900">검토 의견: {r.reviewComment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {editable && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <SubmitButton name="intent" value="save" className="btn-secondary" pendingText="저장 중...">임시저장</SubmitButton>
            <SubmitButton name="intent" value="submit" pendingText="제출 중..."
              confirm="제출 후에는 보완요청 전까지 수정할 수 없습니다. 제출할까요?">제출</SubmitButton>
          </div>
        )}
      </form>
    </main>
  );
}

function Notice({ status, roundStatus, submittedAt }: { status: string; roundStatus: string; submittedAt: Date | null }) {
  let text: string | null = null;
  if (roundStatus !== "OPEN") {
    text = `이 회차는 '${label(ROUND_STATUS_LABELS, roundStatus)}' 상태로 열람만 가능합니다.`;
  } else if (status === "SUBMITTED") {
    text = `${formatDateTime(submittedAt)}에 제출했습니다. 검토 중에는 수정할 수 없습니다.`;
  } else if (status === "APPROVED") {
    text = "검토가 완료되었습니다.";
  } else if (status === "RETURNED") {
    text = "보완요청이 있습니다. 검토 의견을 확인하고 수정한 뒤 다시 제출해주세요.";
  }
  if (!text) return null;
  return <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{text}</div>;
}
