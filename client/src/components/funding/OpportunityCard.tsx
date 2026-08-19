import { ArrowUpRight, Bookmark, CalendarDays, MapPin, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { deadlineDistance, formatCurrency, formatDate, type OpportunityRecord } from "@/lib/funding";
import { StatusBadge } from "./StatusBadge";

export function OpportunityCard({ opportunity, saved, onSave }: { opportunity: OpportunityRecord; saved?: boolean; onSave?: (id: number) => void }) {
  const amount = formatCurrency(opportunity.maxGrantEur) ?? formatCurrency(opportunity.totalBudgetEur);
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[#dce4df] bg-white p-5 shadow-[0_8px_30px_rgba(25,54,46,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b7cbc3] hover:shadow-[0_14px_40px_rgba(25,54,46,0.10)]">
      <div className="flex items-start justify-between gap-3"><StatusBadge status={opportunity.statusComputed} /><button onClick={() => onSave?.(opportunity.id)} aria-label={saved ? "Remove saved opportunity" : "Save opportunity"} className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${saved ? "border-[#b2ce46] bg-[#edf5cd] text-[#486009]" : "border-[#dce4df] text-[#587069] hover:bg-[#f2f6f4]"}`}><Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /></button></div>
      <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#597369]">{opportunity.programme ?? "Official funding opportunity"}</p><h3 className="mt-2 font-display text-[1.38rem] leading-[1.14] tracking-[-0.025em] text-[#153d36]"><Link href={`/funding/${opportunity.slug}`} className="outline-offset-4 hover:underline">{opportunity.title}</Link></h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#63746e]">{opportunity.summary ?? "Review the official call record and its linked documentation for complete information."}</p></div>
      <div className="mt-5 grid gap-2 border-t border-[#edf1ee] pt-4 text-xs text-[#53655f]">
        <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#6d8c82]" />{opportunity.deadlineAt ? `${formatDate(opportunity.deadlineAt)} · ${deadlineDistance(opportunity.deadlineAt)}` : "Deadline to be confirmed"}</span>
        <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#6d8c82]" />{opportunity.countries.join(" · ")}</span>
        {amount && <span className="flex items-center gap-2"><WalletCards className="h-3.5 w-3.5 text-[#6d8c82]" />{opportunity.maxGrantEur ? `Up to ${amount}` : `Budget ${amount}`}</span>}
      </div>
      <Link href={`/funding/${opportunity.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f584b] transition-transform group-hover:translate-x-0.5">Review opportunity <ArrowUpRight className="h-4 w-4" /></Link>
    </article>
  );
}
