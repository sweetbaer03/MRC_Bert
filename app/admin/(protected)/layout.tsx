import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../login/actions";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/rounds", label: "회차 관리" },
  { href: "/admin/systems", label: "대상 시스템" },
  { href: "/admin/checklist", label: "점검 항목" },
  { href: "/admin/audit", label: "감사 로그" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">점검 자료 취합 · 관리자</Link>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-blue-700">{n.label}</Link>
            ))}
          </nav>
          <form action={logout} className="ml-auto flex items-center gap-3 text-sm text-slate-500">
            <span>{session.name}</span>
            <button className="btn-secondary" type="submit">로그아웃</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
