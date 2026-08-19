import { PublicFooter, PublicNav } from "@/components/funding/PublicNav";
import { StatusBadge } from "@/components/funding/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { deadlineDistance, formatCurrency, formatDate } from "@/lib/funding";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

function Fact({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eff6ef] text-[#47776a]"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#799087]">{label}</p><p className="mt-1 leading-5 text-[#38564d]">{value}</p></div></div>;
}

export default function OpportunityDetail() {
  const [, params] = useRoute("/funding/:slug");
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data, isLoading } = trpc.opportunities.bySlug.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  const utils = trpc.useUtils();
  const save = trpc.saved.toggle.useMutation({
    onSuccess: result => {
      toast.success(result.saved ? "Opportunity saved to your workspace." : "Opportunity removed from saved items.");
      utils.opportunities.bySlug.invalidate();
    },
    onError: () => toast.error("Sign in to save this opportunity."),
  });
  const createApplication = trpc.applications.create.useMutation({
    onSuccess: application => {
      toast.success("Application workspace created.");
      navigate(`/applications/${application?.application.id}`);
    },
    onError: error => toast.error(error.message),
  });

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#fcfdfb]"><Loader2 className="h-6 w-6 animate-spin text-[#3a6d60]" /></div>;
  const opportunity = data?.opportunity;
  if (!opportunity) return <div className="min-h-screen bg-[#fcfdfb]"><PublicNav /><main className="container py-24 text-center"><h1 className="font-display text-4xl text-[#17443c]">This opportunity is unavailable</h1><p className="mt-3 text-[#63776f]">It may have been archived or its source record may no longer be published.</p><Button asChild className="mt-7 rounded-full bg-[#0f3d36] text-white"><Link href="/funding">Return to catalogue</Link></Button></main></div>;

  const award = formatCurrency(opportunity.maxGrantEur) ?? formatCurrency(opportunity.totalBudgetEur);
  const makeApplication = () => {
    if (!isAuthenticated) return startLogin();
    createApplication.mutate({ opportunityId: opportunity.id, title: `${opportunity.title} application`, ownerName: user?.name ?? null });
  };

  return <div className="min-h-screen bg-[#fcfdfb]"><PublicNav /><main className="container py-8 sm:py-12"><Link href="/funding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#54736a] hover:text-[#174d42]"><ArrowLeft className="h-4 w-4" />All opportunities</Link><div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]"><article><div className="flex flex-wrap items-center gap-3"><StatusBadge status={opportunity.statusComputed} /><span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6d887e]">{opportunity.programme ?? "Official funding opportunity"}</span></div><h1 className="mt-5 max-w-4xl font-display text-[clamp(2.65rem,5vw,4.8rem)] leading-[0.96] tracking-[-0.055em] text-[#163e37]">{opportunity.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[#5d7169]">{opportunity.summary}</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={makeApplication} disabled={createApplication.isPending} className="rounded-full bg-[#0f3d36] px-5 text-white hover:bg-[#174c43]">{createApplication.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Create application</Button><Button onClick={() => isAuthenticated ? save.mutate({ opportunityId: opportunity.id }) : startLogin()} variant="outline" className="rounded-full border-[#b8cec3] bg-white px-5 text-[#1b574b]"><Bookmark className={`mr-2 h-4 w-4 ${data.isSaved ? "fill-current" : ""}`} />{data.isSaved ? "Saved" : "Save opportunity"}</Button><Button asChild variant="outline" className="rounded-full border-[#b8cec3] bg-white px-5 text-[#1b574b]"><Link href={`/funding/${opportunity.slug}/assessment`}><ShieldCheck className="mr-2 h-4 w-4" />Assess fit</Link></Button></div><div className="mt-11 border-t border-[#dce7e0] pt-10"><section><h2 className="font-display text-3xl tracking-[-0.035em] text-[#17443c]">Opportunity overview</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-[#4f665d]">{opportunity.description}</p></section><section className="mt-11"><h2 className="font-display text-3xl tracking-[-0.035em] text-[#17443c]">Eligibility and fit</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-[#4f665d]">{opportunity.eligibilityText}</p><div className="mt-5 rounded-xl border border-[#d8e6dd] bg-[#f3f8f3] p-4 text-sm leading-6 text-[#547068]"><ShieldCheck className="mb-2 h-5 w-5 text-[#4d7668]" />Use the self-assessment as an indicative planning tool. The official call documents and funding authority are the sole authority on eligibility.</div></section><section className="mt-11"><h2 className="font-display text-3xl tracking-[-0.035em] text-[#17443c]">Documents and source links</h2><div className="mt-4 grid gap-3">{opportunity.documents?.length ? opportunity.documents.map(document => <a href={document.url} target="_blank" rel="noreferrer" key={document.url} className="flex items-center justify-between rounded-xl border border-[#dce6df] bg-white px-4 py-3 text-sm font-semibold text-[#22564a] hover:bg-[#f4f8f4]"><span className="flex items-center gap-3"><FileText className="h-4 w-4" />{document.title}</span><ArrowUpRight className="h-4 w-4" /></a>) : <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[#dce6df] bg-white px-4 py-3 text-sm font-semibold text-[#22564a] hover:bg-[#f4f8f4]"><span className="flex items-center gap-3"><Landmark className="h-4 w-4" />View official opportunity record and documentation</span><ArrowUpRight className="h-4 w-4" /></a>}</div></section></div></article><aside className="h-fit rounded-2xl border border-[#d9e5de] bg-white p-5 shadow-[0_14px_40px_rgba(26,61,51,0.06)] xl:sticky xl:top-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b887d]">At a glance</p><div className="mt-5 space-y-5"><Fact icon={CalendarDays} label="Deadline" value={opportunity.deadlineAt ? `${formatDate(opportunity.deadlineAt)} · ${deadlineDistance(opportunity.deadlineAt)}` : "To be confirmed"} /><Fact icon={MapPin} label="Geography" value={opportunity.countries.join(", ")} /><Fact icon={UsersRound} label="Applicant types" value={opportunity.applicantTypes.join(", ")} /><Fact icon={CircleDollarSign} label="Funding context" value={award ? `${opportunity.maxGrantEur ? "Up to " : "Budget "}${award}` : "See official call"} /><Fact icon={Landmark} label="Source" value={opportunity.sourceName} /></div><a href={opportunity.applicationUrl ?? opportunity.sourceUrl} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7f1bc] px-4 py-3 text-sm font-bold text-[#254538] transition hover:bg-[#dceb9b]">View official opportunity <ArrowUpRight className="h-4 w-4" /></a><p className="mt-4 text-xs leading-5 text-[#71827b]">Source checked {formatDate(opportunity.lastCheckedAt)}. The platform does not submit applications on your behalf.</p></aside></div></main><PublicFooter /></div>;
}
