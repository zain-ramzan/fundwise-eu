import { statusLabel, type OpportunityRecord } from "@/lib/funding";

export function StatusBadge({ status }: { status: OpportunityRecord["statusComputed"] }) {
  const tone = {
    open: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    closing_soon: "bg-amber-50 text-amber-800 ring-amber-600/15",
    upcoming: "bg-sky-50 text-sky-800 ring-sky-600/15",
    closed: "bg-stone-100 text-stone-600 ring-stone-500/15",
    unknown: "bg-stone-100 text-stone-600 ring-stone-500/15",
  }[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset ${tone}`}>{statusLabel[status]}</span>;
}
