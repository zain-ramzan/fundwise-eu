export type OpportunityRecord = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  eligibilityText: string | null;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string | null;
  programme: string | null;
  fund: string | null;
  opportunityType: string;
  statusComputed: "upcoming" | "open" | "closing_soon" | "closed" | "unknown";
  countries: string[];
  sectors: string[];
  applicantTypes: string[];
  deadlineAt: Date | null;
  deadlineText: string | null;
  totalBudgetEur: string | null;
  minGrantEur: string | null;
  maxGrantEur: string | null;
  fundingRateMin: string | null;
  fundingRateMax: string | null;
  lastCheckedAt: Date;
  sourceConfidence: string;
  documents: Array<{ title: string; url: string }> | null;
};

export const statusLabel: Record<OpportunityRecord["statusComputed"], string> = {
  upcoming: "Upcoming",
  open: "Open",
  closing_soon: "Closing soon",
  closed: "Closed",
  unknown: "Status updating",
};

export function formatDate(value?: Date | string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}m`;
  if (amount >= 1_000) return `€${Math.round(amount / 1_000)}k`;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

export function deadlineDistance(value?: Date | null) {
  if (!value) return "Deadline to be confirmed";
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `${days} days remaining`;
}
