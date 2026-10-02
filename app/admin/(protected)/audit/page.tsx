import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where = q
    ? { OR: [{ actor: { contains: q } }, { action: { contains: q } }, { target: { contains: q } }] }
    : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `/admin/audit?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">감사 로그</h1>
        <form className="ml-auto flex gap-2">
          <input className="input w-56" name="q" defaultValue={q} placeholder="행위자·행위·대상 검색" />
          <button className="btn-secondary" type="submit">검색</button>
        </form>
      </div>
      <section className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th className="w-40">일시</th><th className="w-24">구분</th><th>행위자</th><th>행위</th><th>대상</th><th>상세</th><th className="w-28">IP</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="text-xs">{l.actorType}</td>
                <td>{l.actor}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td>{l.target ?? "-"}</td>
                <td className="text-xs text-slate-500">{l.detail ?? ""}</td>
                <td className="text-xs">{l.ip ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500">총 {total}건</span>
          <div className="ml-auto flex gap-2">
            {page > 1 && <Link className="btn-secondary" href={href(page - 1)}>이전</Link>}
            <span className="px-2 py-1.5">{page} / {pages}</span>
            {page < pages && <Link className="btn-secondary" href={href(page + 1)}>다음</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
