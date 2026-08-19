import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Download, ExternalLink, Mail, type LucideIcon } from "lucide-react";
import type { OpportunityRecord } from "@/lib/funding";

function calendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function createIcs(opportunity: OpportunityRecord) {
  const end = opportunity.deadlineAt ? new Date(opportunity.deadlineAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fundwise.eu//Funding deadline//EN",
    "BEGIN:VEVENT",
    `UID:fundwise-${opportunity.id}@fundwise.eu`,
    `DTSTAMP:${calendarDate(new Date())}`,
    `DTSTART:${calendarDate(start)}`,
    `DTEND:${calendarDate(end)}`,
    `SUMMARY:${escapeIcs(`Funding deadline: ${opportunity.title}`)}`,
    `DESCRIPTION:${escapeIcs(`Official source: ${opportunity.sourceUrl}\n\nThis calendar reminder was created by Fundwise.eu. Confirm the deadline and conditions with the official funding authority.`)}`,
    `URL:${opportunity.sourceUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${opportunity.slug}-deadline.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SaveOption({ icon: Icon, title, detail, href, onClick }: { icon: LucideIcon; title: string; detail: string; href?: string; onClick?: () => void }) {
  const body = <><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3fa] text-[#315f9e]"><Icon className="h-4 w-4" /></span><span className="flex-1 text-left"><span className="block text-sm font-semibold text-[#294f96]">{title}</span><span className="mt-0.5 block text-xs leading-5 text-[#687f9c]">{detail}</span></span>{href && <ExternalLink className="h-4 w-4 text-[#6484b4]" />}</>;
  const className = "flex w-full items-center gap-3 rounded-xl border border-[#dfe8f5] bg-white p-3.5 transition hover:border-[#afc4e4] hover:bg-[#f8fbff]";
  return href ? <a href={href} target="_blank" rel="noreferrer" className={className}>{body}</a> : <button onClick={onClick} className={className}>{body}</button>;
}

export function CalendarSaveDialog({ opportunity }: { opportunity: OpportunityRecord }) {
  const deadline = opportunity.deadlineAt ? new Date(opportunity.deadlineAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(deadline.getTime() + 60 * 60 * 1000);
  const details = `Funding deadline for ${opportunity.title}. Confirm deadline and conditions on the official source: ${opportunity.sourceUrl}`;
  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", `Funding deadline: ${opportunity.title}`);
  google.searchParams.set("dates", `${calendarDate(deadline)}/${calendarDate(end)}`);
  google.searchParams.set("details", details);
  google.searchParams.set("location", opportunity.sourceUrl);
  const outlook = new URL("https://outlook.office.com/calendar/0/deeplink/compose");
  outlook.searchParams.set("subject", `Funding deadline: ${opportunity.title}`);
  outlook.searchParams.set("startdt", deadline.toISOString());
  outlook.searchParams.set("enddt", end.toISOString());
  outlook.searchParams.set("body", details);
  outlook.searchParams.set("location", opportunity.sourceUrl);
  return <Dialog><DialogTrigger asChild><Button className="rounded-full bg-[#1f3f7d] px-5 text-white hover:bg-[#2b57a4]"><CalendarDays className="mr-2 h-4 w-4" />Save deadline to calendar</Button></DialogTrigger><DialogContent className="max-w-md border-[#d8e4f4] bg-[#fcfdff]"><DialogHeader><DialogTitle className="font-display text-3xl text-[#244a8f]">Keep the deadline close.</DialogTitle><DialogDescription className="pt-2 text-sm leading-6 text-[#657c99]">Choose where to save this opportunity deadline. The event includes a link back to the official funding record.</DialogDescription></DialogHeader><div className="mt-2 space-y-3"><SaveOption icon={CalendarDays} title="Google Calendar" detail="Open a pre-filled event in Google Calendar." href={google.toString()} /><SaveOption icon={Mail} title="Microsoft Outlook" detail="Open a pre-filled event in Outlook Calendar." href={outlook.toString()} /><SaveOption icon={Download} title="Download calendar file" detail="Use an .ics file with Apple Calendar, Outlook, or another calendar." onClick={() => createIcs(opportunity)} /></div><p className="mt-1 text-xs leading-5 text-[#778da8]">The calendar reminder is a planning aid. Confirm the deadline and requirements with the official source before applying.</p></DialogContent></Dialog>;
}
