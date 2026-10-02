import {
  ASSIGNMENT_STATUS_LABELS,
  COMPLIANCE_STATUS_LABELS,
  ROUND_STATUS_LABELS,
  label,
} from "@/lib/constants";

const COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-200 text-slate-700",
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  RETURNED: "bg-red-100 text-red-800",
  APPROVED: "bg-green-100 text-green-800",
  COMPLIANT: "bg-green-100 text-green-800",
  PARTIAL: "bg-amber-100 text-amber-800",
  NON_COMPLIANT: "bg-red-100 text-red-800",
  NOT_APPLICABLE: "bg-slate-100 text-slate-600",
};

const LABELS = { ...ROUND_STATUS_LABELS, ...ASSIGNMENT_STATUS_LABELS, ...COMPLIANCE_STATUS_LABELS };

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">-</span>;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-slate-100"}`}>
      {label(LABELS, status)}
    </span>
  );
}
