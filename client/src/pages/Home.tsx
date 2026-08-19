import { OpportunityCard } from "@/components/funding/OpportunityCard";
import { PublicFooter, PublicNav } from "@/components/funding/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Compass, FolderKanban, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data } = trpc.opportunities.list.useQuery({ page: 1, pageSize: 3, status: "upcoming" });
  const search = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/funding${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfdfb]">
      <PublicNav transparent />
      <main>
        <section className="relative isolate overflow-hidden pb-20 pt-12 sm:pb-28 sm:pt-20">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_8%_0%,#eaf1d7_0%,transparent_29%),radial-gradient(circle_at_97%_8%,#d8ebe6_0%,transparent_27%),linear-gradient(180deg,#fafff6_0%,#fcfdfb_74%)]" />
          <div className="absolute left-[8%] top-24 -z-10 h-64 w-64 rounded-full bg-[#d4e8dc]/40 blur-3xl" />
          <div className="container grid items-end gap-12 lg:grid-cols-[1.15fr_.85fr]">
            <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#c7ddcc] bg-white/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#396157]"><span className="h-1.5 w-1.5 rounded-full bg-[#87ad22]" />Official-source intelligence for European funding</div><h1 className="mt-7 font-display text-[clamp(3rem,6.2vw,5.9rem)] leading-[0.93] tracking-[-0.06em] text-[#123b34]">Find funding that moves your work <span className="text-[#5f8a7d]">forward.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[#516a62]">Discover public funding opportunities, assess organisational fit, and manage every application in one considered workspace.</p>
              <form onSubmit={search} className="mt-9 flex flex-col gap-3 rounded-[1.35rem] border border-[#d9e4dd] bg-white p-3 shadow-[0_18px_50px_rgba(18,59,52,0.10)] sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#668079]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Try “health”, “AI”, or “sustainability”" className="h-12 border-0 bg-transparent pl-11 text-sm shadow-none focus-visible:ring-0" /></div><Button type="submit" className="h-12 rounded-xl bg-[#0f3d36] px-6 text-white hover:bg-[#174c43]">Search funding <ArrowRight className="ml-2 h-4 w-4" /></Button></form><p className="mt-3 text-xs text-[#6d8079]">Built around official public sources. Conditions and eligibility always remain with the funding authority.</p>
            </div>
            <aside className="relative rounded-[1.75rem] border border-white/80 bg-white/75 p-6 shadow-[0_25px_70px_rgba(18,59,52,0.12)] backdrop-blur sm:p-7"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[18px] border-[#d8ec9d]/70" /><div className="relative"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5b776d]">The calmer way to apply</p><Compass className="h-5 w-5 text-[#6e9833]" /></div><div className="mt-7 space-y-5">{[["Discover", "Search a growing catalogue of official funding records."],["Assess", "Build an indicative fit view before committing time."],["Deliver", "Keep your application team, documents and deadlines aligned."]].map(([title, description], index) => <div key={title} className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef5e2] text-xs font-bold text-[#547416]">0{index + 1}</span><div><h2 className="font-display text-xl tracking-[-0.02em] text-[#1a463e]">{title}</h2><p className="mt-1 text-sm leading-5 text-[#60736c]">{description}</p></div></div>)}</div></div></aside>
          </div>
        </section>
        <section id="platform" className="border-y border-[#dce5df] bg-[#f2f6f1] py-10"><div className="container grid gap-7 md:grid-cols-3">{[[ShieldCheck,"Official source first","Every listing points back to its authoritative source and documents."],[Compass,"Organised signal","A focused catalogue with practical filters, deadlines and clear context."],[FolderKanban,"Execution-ready","Move from discovery to a structured application workspace without losing momentum."]].map(([Icon, title, text]) => <div key={title as string} className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#37665b] shadow-sm"><Icon className="h-5 w-5" /></span><div><h2 className="font-display text-xl text-[#17443c]">{title as string}</h2><p className="mt-1 text-sm leading-6 text-[#657770]">{text as string}</p></div></div>)}</div></section>
        <section className="container py-20 sm:py-28"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#668377]">Curated opportunity radar</p><h2 className="mt-3 max-w-xl font-display text-4xl tracking-[-0.045em] text-[#173f38]">Make a confident first pass.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#657770]">Explore a selection of future Horizon Europe topics currently published by the European Commission.</p></div><Button asChild variant="outline" className="rounded-full border-[#abc5bb] bg-transparent px-5 text-[#164a40] hover:bg-[#edf4f0]"><Link href="/funding">Explore all opportunities <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{data?.items.map(opportunity => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}</div></section>
        <section id="methodology" className="container pb-20 sm:pb-28"><div className="grid overflow-hidden rounded-[1.75rem] bg-[#123d36] text-white lg:grid-cols-[.9fr_1.1fr]"><div className="relative p-8 sm:p-12"><Sparkles className="absolute right-8 top-8 h-8 w-8 text-[#cce66c]" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c7dea7]">Trust, not hype</p><h2 className="mt-4 max-w-md font-display text-4xl leading-none tracking-[-0.04em]">Designed to keep the official call in focus.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#c3d3ce]">Fundwise helps you organise public information and your internal work. It does not make eligibility decisions or replace the funding authority's official documentation.</p><Button asChild className="mt-7 rounded-full bg-[#d8ef83] text-[#153d36] hover:bg-[#e3f69d]"><Link href="/funding">Browse the catalogue</Link></Button></div><div className="grid gap-px bg-white/10 sm:grid-cols-2">{[["1","A clear starting point","Search by programme, sector, country, deadline and budget."],["2","An indicative fit view","Answer a concise questionnaire to surface relevant considerations."],["3","A controlled workspace","Create an application and follow its status from Draft to Submitted."],["4","A source-linked record","Keep direct access to the authority's page and documented requirements."]].map(([number, title, text]) => <div key={number} className="bg-[#174a41] p-7"><span className="font-display text-3xl text-[#d8ef83]">{number}</span><h3 className="mt-7 font-display text-2xl tracking-[-0.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#bfd0ca]">{text}</p></div>)}</div></div></section>
      </main>
      <PublicFooter />
    </div>
  );
}
