import { prisma } from "@/lib/prisma";
import { RESPONSE_TYPES, RESPONSE_TYPE_LABELS } from "@/lib/constants";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import type { FlashParams } from "@/lib/flash";
import { saveCategory, saveItem, toggleCategory, toggleItem } from "./actions";

export default async function ChecklistPage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, error } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">점검 항목 관리</h1>
        <p className="text-sm text-slate-500">
          활성화된 영역·항목만 새 회차에 포함됩니다. 이미 생성된 회차의 항목은 변경되지 않습니다.
        </p>
      </div>
      <Flash ok={ok} error={error} />

      {categories.map((cat) => (
        <section key={cat.id} className={`card ${cat.isActive ? "" : "opacity-60"}`}>
          <details>
            <summary className="flex cursor-pointer flex-wrap items-center gap-2">
              <span className="font-semibold">{cat.name}</span>
              {!cat.isActive && <span className="text-xs text-red-600">(비활성)</span>}
              <span className="text-xs text-slate-500">항목 {cat.items.length}개 · 순서 {cat.order}</span>
              <span className="ml-auto text-xs text-blue-700">영역 수정</span>
            </summary>
            <form action={saveCategory} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_6rem_auto] sm:items-end">
              <input type="hidden" name="id" value={cat.id} />
              <div><label className="label">영역명</label><input className="input" name="name" defaultValue={cat.name} required /></div>
              <div><label className="label">설명</label><input className="input" name="description" defaultValue={cat.description ?? ""} /></div>
              <div><label className="label">순서</label><input className="input" name="order" type="number" defaultValue={cat.order} /></div>
              <SubmitButton>저장</SubmitButton>
            </form>
            <form action={toggleCategory} className="mt-2">
              <input type="hidden" name="id" value={cat.id} />
              <SubmitButton className="btn-secondary">{cat.isActive ? "영역 비활성화" : "영역 활성화"}</SubmitButton>
            </form>
          </details>

          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th className="w-16">코드</th><th>항목</th><th className="w-36">응답 유형</th><th className="w-14">필수</th><th className="w-40"></th></tr>
              </thead>
              <tbody>
                {cat.items.map((it) => (
                  <tr key={it.id} className={it.isActive ? "" : "opacity-50"}>
                    <td>{it.code ?? "-"}</td>
                    <td>
                      <div className="font-medium">{it.title}{!it.isActive && " (비활성)"}</div>
                      {it.description && <div className="text-xs text-slate-500">{it.description}</div>}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-700">수정</summary>
                        <ItemForm categoryId={cat.id} item={it} />
                      </details>
                    </td>
                    <td>{RESPONSE_TYPE_LABELS[it.responseType as keyof typeof RESPONSE_TYPE_LABELS] ?? it.responseType}</td>
                    <td>{it.required ? "Y" : "N"}</td>
                    <td>
                      <form action={toggleItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <SubmitButton className="btn-secondary">{it.isActive ? "비활성화" : "활성화"}</SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-700">+ 이 영역에 항목 추가</summary>
            <ItemForm categoryId={cat.id} />
          </details>
        </section>
      ))}

      <section className="card">
        <h2 className="mb-3 font-semibold">새 점검 영역 추가</h2>
        <form action={saveCategory} className="grid gap-3 sm:grid-cols-[1fr_2fr_6rem_auto] sm:items-end">
          <div><label className="label">영역명</label><input className="input" name="name" required /></div>
          <div><label className="label">설명</label><input className="input" name="description" /></div>
          <div><label className="label">순서</label><input className="input" name="order" type="number" defaultValue={categories.length} /></div>
          <SubmitButton>추가</SubmitButton>
        </form>
      </section>
    </div>
  );
}

type ItemLike = {
  id: string; code: string | null; title: string; description: string | null;
  responseType: string; required: boolean; order: number;
};

function ItemForm({ categoryId, item }: { categoryId: string; item?: ItemLike }) {
  return (
    <form action={saveItem} className="mt-2 grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-6">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="sm:col-span-1"><label className="label">코드</label><input className="input" name="code" defaultValue={item?.code ?? ""} /></div>
      <div className="sm:col-span-5"><label className="label">항목명</label><input className="input" name="title" defaultValue={item?.title ?? ""} required /></div>
      <div className="sm:col-span-6"><label className="label">설명(작성 안내)</label><textarea className="input" name="description" rows={2} defaultValue={item?.description ?? ""} /></div>
      <div className="sm:col-span-2">
        <label className="label">응답 유형</label>
        <select className="input" name="responseType" defaultValue={item?.responseType ?? "STATUS_FILE"}>
          {RESPONSE_TYPES.map((t) => <option key={t} value={t}>{RESPONSE_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-1"><label className="label">순서</label><input className="input" name="order" type="number" defaultValue={item?.order ?? 0} /></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-1 sm:pt-6">
        <input type="checkbox" name="required" defaultChecked={item?.required ?? true} /> 필수
      </label>
      <div className="sm:col-span-2 sm:pt-6"><SubmitButton>저장</SubmitButton></div>
    </form>
  );
}
