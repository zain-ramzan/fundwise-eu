import { Compass, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "../ui/button";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline"><span className="grid h-9 w-9 place-items-center rounded-xl bg-yorkie-900 text-yorkie-200 shadow-[0_8px_20px_rgba(31,63,125,0.18)]"><Compass className="h-4 w-4" /></span>{!compact && <span className="font-display text-xl tracking-[-0.03em]">Fundwise<span className="text-yorkie-500">.eu</span></span>}</Link>;
}

export function PublicNav({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  return <header className={`relative z-30 ${transparent ? "" : "border-b border-yorkie-100 bg-background/90 backdrop-blur"}`}><div className="container flex h-[76px] items-center justify-between gap-6"><Brand /><nav className="hidden items-center md:flex" aria-label="Primary navigation"><Link href="/funding" className="text-sm font-semibold text-yorkie-700 transition-colors hover:text-yorkie-900">Discover</Link></nav><div className="hidden md:block"><Button asChild className="rounded-full bg-yorkie-900 px-5 text-white hover:bg-yorkie-800"><Link href="/funding">Discover funding</Link></Button></div><button className="grid h-10 w-10 place-items-center rounded-full border border-yorkie-100 md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button></div>{open && <div className="container border-t border-yorkie-100 py-4 md:hidden"><nav className="flex flex-col gap-4" aria-label="Mobile navigation"><Link href="/funding" onClick={() => setOpen(false)} className="text-sm font-semibold">Discover funding</Link><Button asChild className="mt-1 w-full rounded-full bg-yorkie-900 text-white hover:bg-yorkie-800"><Link href="/funding">Browse opportunities</Link></Button></nav></div>}</header>;
}

export function PublicFooter() {
  return <footer className="border-t border-[#dfe7f3] bg-[#f4f7fd]"><div className="container grid gap-8 py-10 md:grid-cols-[1fr_auto]"><div><Brand /><p className="mt-4 max-w-xl text-sm leading-6 text-[#60738f]">Independent funding information service. Fundwise organises official public information; it does not determine legal eligibility. Always verify deadlines, conditions and submissions on the linked official source.</p></div><div className="flex gap-5 text-sm text-[#5c708e]"><Link href="/funding">Discover funding</Link><a href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/" target="_blank" rel="noreferrer">Official EU portal</a></div></div></footer>;
}
