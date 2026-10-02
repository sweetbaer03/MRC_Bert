import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRoundSummaries } from "@/lib/stats";
import { RoundTable } from "@/components/RoundTable";

export default async function DashboardPage() {
  const [openRounds, systemCount, itemCount, pendingReview] = await Promise.all([
    getRoundSummaries({ status: "OPEN" }),
    prisma.system.count({ where: { isActive: true } }),
    prisma.item.count({ where: { isActive: true, category: { isActive: true } } }),
    prisma.assignment.count({ where: { status: "SUBMITTED" } }),
  ]);

  const stats = [
    { label: "진행중 회차", value: openRounds.length, href: "/admin/rounds" },
    { label: "검토 대기", value: pendingReview, href: "/admin/rounds" },
    { label: "활성 대상 시스템", value: systemCount, href: "/admin/systems" },
    { label: "활성 점검 항목", value: itemCount, href: "/admin/checklist" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">대시보드</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-blue-300">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
          </Link>
        ))}
      </div>
      <section className="card">
        <div className="mb-3 flex items-center">
          <h2 className="font-semibold">진행중 회차</h2>
          <Link href="/admin/rounds/new" className="btn-primary ml-auto">새 회차</Link>
        </div>
        <RoundTable rounds={openRounds} />
      </section>
    </div>
  );
}
