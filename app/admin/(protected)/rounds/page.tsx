import Link from "next/link";
import { getRoundSummaries } from "@/lib/stats";
import { RoundTable } from "@/components/RoundTable";

export default async function RoundsPage() {
  const rounds = await getRoundSummaries();
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">회차 관리</h1>
        <Link href="/admin/rounds/new" className="btn-primary ml-auto">새 회차</Link>
      </div>
      <section className="card"><RoundTable rounds={rounds} /></section>
    </div>
  );
}
