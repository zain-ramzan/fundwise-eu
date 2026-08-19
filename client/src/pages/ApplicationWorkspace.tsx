import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/funding";
import { trpc } from "@/lib/trpc";
import { Check, ChevronLeft, FileUp, Link2, Loader2, PencilLine, Plus, Save, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

const statusValues = ["Draft", "In Progress", "Submitted", "Awarded", "Rejected"] as const;
const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"] as const;

type ChecklistDocument = { id: number; title: string; isRequired: boolean; uploadStatus: "pending" | "uploaded" | "not_required"; notes: string | null; fileName: string | null; fileUrl: string | null };

function DocumentRow({ document, onUpload, onToggleNotRequired, onSaveNotes }: { document: ChecklistDocument; onUpload: (id: number) => void; onToggleNotRequired: (document: ChecklistDocument) => void; onSaveNotes: (id: number, notes: string) => void }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(document.notes ?? "");
  const tone = document.uploadStatus === "uploaded" ? "bg-[#d7e5fb] text-[#527217]" : document.uploadStatus === "not_required" ? "bg-stone-100 text-stone-500" : "bg-[#eef3fa] text-[#788aa3]";
  const summary = document.uploadStatus === "uploaded" ? `Uploaded ${document.fileName ?? "document"}` : document.uploadStatus === "not_required" ? "Marked not required" : document.isRequired ? "Required" : "Optional";
  return <div className="py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${tone}`}>{document.uploadStatus === "uploaded" ? <Check className="h-3.5 w-3.5" /> : <FileUp className="h-3.5 w-3.5" />}</span><div><p className="text-sm font-semibold text-[#365f9e]">{document.title}</p><p className="mt-1 text-xs text-[#7c91ac]">{summary}</p>{document.notes && !editingNotes && <p className="mt-1.5 text-xs leading-5 text-[#6a819d]">{document.notes}</p>}</div></div><div className="flex shrink-0 flex-wrap gap-2">{document.fileUrl && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={document.fileUrl} target="_blank" rel="noreferrer">View</a></Button>}<Button size="sm" variant="outline" onClick={() => setEditingNotes(current => !current)} className="rounded-full"><PencilLine className="mr-1 h-3.5 w-3.5" />Notes</Button><Button size="sm" variant="outline" onClick={() => onToggleNotRequired(document)} className="rounded-full">{document.uploadStatus === "not_required" ? "Restore" : "N/A"}</Button><Button size="sm" onClick={() => onUpload(document.id)} className="rounded-full bg-[#1f3f7d] text-white"><UploadCloud className="mr-1 h-3.5 w-3.5" />Upload</Button></div></div>{editingNotes && <div className="ml-9 mt-3 rounded-xl bg-[#f5f8fe] p-3"><Label htmlFor={`document-notes-${document.id}`} className="text-xs font-semibold text-[#617895]">Internal checklist notes</Label><Textarea id={`document-notes-${document.id}`} value={notes} onChange={event => setNotes(event.target.value)} className="mt-2 min-h-20 bg-white text-sm" placeholder="Clarify the requirement, owner, evidence or follow-up." /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setNotes(document.notes ?? ""); setEditingNotes(false); }}>Cancel</Button><Button size="sm" className="rounded-full bg-[#1f3f7d] text-white" onClick={() => { onSaveNotes(document.id, notes); setEditingNotes(false); }}>Save note</Button></div></div>}</div>;
}

export default function ApplicationWorkspace() {
  const [, params] = useRoute("/applications/:id");
  const id = Number(params?.id);
  const { data, isLoading } = trpc.applications.byId.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<number | null>(null);
  const refresh = () => { utils.applications.byId.invalidate({ id }); utils.applications.list.invalidate(); utils.dashboard.overview.invalidate(); };
  const update = trpc.applications.update.useMutation({ onSuccess: () => { toast.success("Application updated."); refresh(); }, onError: error => toast.error(error.message) });
  const addDocument = trpc.applications.addDocument.useMutation({ onSuccess: () => { setAdding(false); setNewDocumentTitle(""); refresh(); }, onError: error => toast.error(error.message) });
  const updateDocument = trpc.applications.updateDocument.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const upload = trpc.applications.uploadDocument.useMutation({ onSuccess: () => { toast.success("Document uploaded securely."); setUploadFor(null); refresh(); }, onError: error => { setUploadFor(null); toast.error(error.message); } });
  const chooseFile = (documentId: number) => { setUploadFor(documentId); fileInput.current?.click(); };
  const receiveFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const documentId = uploadFor;
    event.target.value = "";
    if (!file || !documentId) return;
    if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) { toast.error("Upload a PDF, DOCX, PNG or JPEG document."); setUploadFor(null); return; }
    if (file.size > 12 * 1024 * 1024) { toast.error("Files must be 12 MB or smaller."); setUploadFor(null); return; }
    const reader = new FileReader();
    reader.onload = () => { const value = typeof reader.result === "string" ? reader.result.split(",")[1] : ""; if (value) upload.mutate({ id: documentId, fileName: file.name, mimeType: file.type as (typeof allowedTypes)[number], base64Data: value }); };
    reader.onerror = () => { setUploadFor(null); toast.error("The selected file could not be read."); };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <DashboardLayout><div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#48786a]" /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="mx-auto max-w-xl py-20 text-center"><h1 className="font-display text-3xl">Application unavailable</h1><Button asChild className="mt-5 rounded-full"><Link href="/applications">Back to applications</Link></Button></div></DashboardLayout>;
  const application = data.application;
  const currentNotes = notes ?? application.notes ?? "";
  const documents = data.documents as ChecklistDocument[];
  const completed = documents.filter(item => item.uploadStatus === "uploaded" || item.uploadStatus === "not_required").length;

  return <DashboardLayout><div className="mx-auto max-w-6xl"><input ref={fileInput} type="file" className="hidden" accept=".pdf,.docx,image/png,image/jpeg" onChange={receiveFile} /><Link href="/applications" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c849f]"><ChevronLeft className="h-4 w-4" />All applications</Link><div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718db7]">Application workspace</p><h1 className="mt-2 max-w-3xl font-display text-4xl tracking-[-0.04em] text-[#244a8f]">{application.title}</h1><p className="mt-2 text-sm leading-6 text-[#72859f]">For <Link href={`/funding/${data.opportunity.slug}`} className="font-semibold text-[#3e68a5] hover:underline">{data.opportunity.title}</Link></p></div><div className="flex gap-3"><Button asChild variant="outline" className="rounded-full"><a href={data.opportunity.sourceUrl} target="_blank" rel="noreferrer"><Link2 className="mr-2 h-4 w-4" />Official source</a></Button><Button onClick={() => update.mutate({ id, notes: currentNotes })} disabled={update.isPending} className="rounded-full bg-[#1f3f7d] text-white"><Save className="mr-2 h-4 w-4" />Save notes</Button></div></div><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-6"><section className="rounded-2xl border border-[#dfe8f5] bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d92ad]">Stage</p><h2 className="mt-1 font-display text-2xl text-[#294f96]">Track progress deliberately</h2></div><Select value={application.status} onValueChange={value => update.mutate({ id, status: value as (typeof statusValues)[number] })}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent>{statusValues.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div className="mt-6 rounded-xl bg-[#f5f8fe] p-4"><Label htmlFor="application-notes" className="text-sm font-semibold text-[#4a70a6]">Working notes</Label><Textarea id="application-notes" className="mt-2 min-h-32 bg-white" value={currentNotes} onChange={event => setNotes(event.target.value)} placeholder="Capture decisions, next steps, owners and submission notes." /></div></section><section className="rounded-2xl border border-[#dfe8f5] bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d92ad]">Document checklist</p><h2 className="mt-1 font-display text-2xl text-[#294f96]">{completed} of {documents.length} items accounted for</h2></div><Button onClick={() => setAdding(!adding)} variant="outline" className="rounded-full"><Plus className="mr-2 h-4 w-4" />Add item</Button></div>{adding && <form onSubmit={event => { event.preventDefault(); if (newDocumentTitle.trim()) addDocument.mutate({ applicationId: id, title: newDocumentTitle.trim(), isRequired: true }); }} className="mt-5 flex gap-2 rounded-xl bg-[#f5f8fe] p-3"><Input value={newDocumentTitle} onChange={event => setNewDocumentTitle(event.target.value)} placeholder="Document name" /><Button type="submit" disabled={addDocument.isPending} className="bg-[#1f3f7d] text-white">Add</Button></form>}<div className="mt-5 divide-y divide-[#e7eef8]">{documents.map(document => <DocumentRow key={document.id} document={document} onUpload={chooseFile} onToggleNotRequired={item => updateDocument.mutate({ id: item.id, uploadStatus: item.uploadStatus === "not_required" ? "pending" : "not_required" })} onSaveNotes={(documentId, nextNotes) => updateDocument.mutate({ id: documentId, notes: nextNotes })} />)}</div></section></div><aside className="h-fit rounded-2xl border border-[#dfe8f5] bg-[#f6f8fe] p-5 lg:sticky lg:top-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d92ad]">Key dates</p><div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8da8]">Opportunity deadline</p><p className="mt-2 font-display text-2xl text-[#2b559b]">{application.targetDeadlineAt ? formatDate(application.targetDeadlineAt) : "To be confirmed"}</p></div><p className="mt-5 text-xs leading-5 text-[#7a8da8]">Application records are private to your authenticated workspace. Always submit through the official funding authority.</p></aside></div></div></DashboardLayout>;
}
