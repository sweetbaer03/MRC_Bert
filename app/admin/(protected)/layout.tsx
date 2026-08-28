import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import AdminLogoutButton from "./logout-button";

const NAV = [
  { href: "/admin", label: "회차 대시보드" },
  { href: "/admin/rounds", label: "회차 관리" },
  { href: "/admin/systems", label: "시스템/부서 관리" },
  { href: "/admin/items", label: "체크리스트 관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-semibold text-slate-900 text-sm whitespace-nowrap">
              개인정보 처리시스템 점검 자료 취합
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">{session.email}</span>
            <AdminLogoutButton />
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
