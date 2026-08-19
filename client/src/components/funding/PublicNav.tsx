import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Compass, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "../ui/button";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f3d36] text-[#d9f27c] shadow-[0_8px_20px_rgba(15,61,54,0.18)]"><Compass className="h-4 w-4" /></span>
      {!compact && <span className="font-display text-xl tracking-[-0.03em]">Fundwise<span className="text-[#4e796f]">.eu</span></span>}
    </Link>
  );
}

export function PublicNav({ transparent = false }: { transparent?: boolean }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [open, setOpen] = useState(false);
  const destination = user?.role === "admin" ? "/admin" : "/dashboard";
  const links = [
    ["Discover", "/funding"],
    ["How it works", "/#methodology"],
    ["For organisations", "/#platform"],
  ];
  return (
    <header className={`relative z-30 ${transparent ? "" : "border-b border-[#dce4df] bg-[#fcfdfb]/90 backdrop-blur"}`}>
      <div className="container flex h-[76px] items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={label} href={href} className="text-sm font-medium text-[#4b5f5a] transition-colors hover:text-[#0f3d36]">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {!loading && isAuthenticated ? (
            <Button asChild className="rounded-full bg-[#0f3d36] px-5 text-white hover:bg-[#174c43]"><Link href={destination}>Open workspace</Link></Button>
          ) : (
            <Button onClick={() => startLogin()} className="rounded-full bg-[#0f3d36] px-5 text-white hover:bg-[#174c43]">Sign in</Button>
          )}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-[#dce4df] md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </div>
      {open && <div className="container border-t border-[#dce4df] py-4 md:hidden"><nav className="flex flex-col gap-4" aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)} className="text-sm font-medium">{label}</Link>)}<Button onClick={() => startLogin()} className="mt-2 w-full rounded-full bg-[#0f3d36] text-white">{isAuthenticated ? "Open workspace" : "Sign in"}</Button></nav></div>}
    </header>
  );
}

export function PublicFooter() {
  return <footer className="border-t border-[#dce4df] bg-[#f3f6f2]"><div className="container grid gap-8 py-10 md:grid-cols-[1fr_auto]"><div><Brand /><p className="mt-4 max-w-xl text-sm leading-6 text-[#5a6b65]">Independent funding information service. Fundwise organises official public information; it does not determine legal eligibility. Always verify deadlines, conditions and submissions on the linked official source.</p></div><div className="flex gap-5 text-sm text-[#526760]"><Link href="/funding">Discover funding</Link><a href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/" target="_blank" rel="noreferrer">Official EU portal</a></div></div></footer>;
}
