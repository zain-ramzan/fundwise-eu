import { and, asc, count, desc, eq, gte, inArray, isNull, like, lte, notInArray, or, sql } from "drizzle-orm";
import {
  applicationDocuments,
  applications,
  eligibilityAssessments,
  notifications,
  opportunities,
  organisationProfiles,
  savedOpportunities,
  type Opportunity,
} from "../../drizzle/schema";
import { getDb } from "../db";

export const APPLICATION_STATUSES = ["Draft", "In Progress", "Submitted", "Awarded", "Rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type OpportunityFilters = {
  q?: string;
  programme?: string;
  sector?: string;
  country?: string;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
  budgetMin?: number;
  budgetMax?: number;
  status?: "upcoming" | "open" | "closing_soon" | "closed" | "unknown";
  page: number;
  pageSize: number;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The database is currently unavailable.");
  return db;
}

function publicOpportunityConditions(filters?: Partial<OpportunityFilters>) {
  const conditions = [eq(opportunities.isPublished, true), isNull(opportunities.archivedAt)];
  if (filters?.q) {
    const query = `%${filters.q.trim()}%`;
    conditions.push(or(like(opportunities.title, query), like(opportunities.summary, query), like(opportunities.programme, query))!);
  }
  if (filters?.programme) conditions.push(eq(opportunities.programme, filters.programme));
  if (filters?.sector) conditions.push(sql`JSON_CONTAINS(${opportunities.sectors}, JSON_ARRAY(${filters.sector}))`);
  if (filters?.country) conditions.push(sql`JSON_CONTAINS(${opportunities.countries}, JSON_ARRAY(${filters.country}))`);
  if (filters?.status) conditions.push(eq(opportunities.statusComputed, filters.status));
  if (filters?.deadlineBefore) conditions.push(lte(opportunities.deadlineAt, filters.deadlineBefore));
  if (filters?.deadlineAfter) conditions.push(gte(opportunities.deadlineAt, filters.deadlineAfter));
  if (filters?.budgetMin !== undefined) {
    conditions.push(or(gte(opportunities.maxGrantEur, filters.budgetMin.toFixed(2)), gte(opportunities.totalBudgetEur, filters.budgetMin.toFixed(2)))!);
  }
  if (filters?.budgetMax !== undefined) {
    conditions.push(or(lte(opportunities.minGrantEur, filters.budgetMax.toFixed(2)), lte(opportunities.totalBudgetEur, filters.budgetMax.toFixed(2)))!);
  }
  return conditions;
}

export async function listOpportunities(filters: OpportunityFilters) {
  const db = await requireDb();
  const conditions = publicOpportunityConditions(filters);
  const where = and(...conditions);
  const offset = (filters.page - 1) * filters.pageSize;
  const [items, totalRows] = await Promise.all([
    db.select().from(opportunities).where(where).orderBy(asc(opportunities.deadlineAt), desc(opportunities.createdAt)).limit(filters.pageSize).offset(offset),
    db.select({ total: count() }).from(opportunities).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.total ?? 0) };
}

export async function getOpportunityBySlug(slug: string) {
  const db = await requireDb();
  const rows = await db.select().from(opportunities).where(and(eq(opportunities.slug, slug), ...publicOpportunityConditions())).limit(1);
  return rows[0] ?? null;
}

export async function getOpportunityById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(opportunities).where(and(eq(opportunities.id, id), ...publicOpportunityConditions())).limit(1);
  return rows[0] ?? null;
}

export async function listFilterOptions() {
  const db = await requireDb();
  const rows = await db
    .select({ programme: opportunities.programme, countries: opportunities.countries, sectors: opportunities.sectors })
    .from(opportunities)
    .where(and(...publicOpportunityConditions()));
  const programmes = Array.from(new Set(rows.map(row => row.programme).filter((item): item is string => Boolean(item)))).sort();
  const countries = Array.from(new Set(rows.flatMap(row => row.countries ?? []))).sort();
  const sectors = Array.from(new Set(rows.flatMap(row => row.sectors ?? []))).sort();
  return { programmes, countries, sectors };
}

export async function toggleSavedOpportunity(userId: number, opportunityId: number) {
  const db = await requireDb();
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found.");
  const existing = await db
    .select({ id: savedOpportunities.id })
    .from(savedOpportunities)
    .where(and(eq(savedOpportunities.userId, userId), eq(savedOpportunities.opportunityId, opportunityId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(savedOpportunities).where(eq(savedOpportunities.id, existing[0].id));
    return { saved: false };
  }
  await db.insert(savedOpportunities).values({ userId, opportunityId });
  return { saved: true };
}

export async function listSavedOpportunities(userId: number) {
  const db = await requireDb();
  return db
    .select({ savedAt: savedOpportunities.createdAt, opportunity: opportunities })
    .from(savedOpportunities)
    .innerJoin(opportunities, eq(savedOpportunities.opportunityId, opportunities.id))
    .where(and(eq(savedOpportunities.userId, userId), ...publicOpportunityConditions()))
    .orderBy(asc(opportunities.deadlineAt));
}

export async function getSavedOpportunityIds(userId: number, opportunityIds: number[]) {
  if (opportunityIds.length === 0) return [];
  const db = await requireDb();
  const rows = await db
    .select({ opportunityId: savedOpportunities.opportunityId })
    .from(savedOpportunities)
    .where(and(eq(savedOpportunities.userId, userId), inArray(savedOpportunities.opportunityId, opportunityIds)));
  return rows.map(row => row.opportunityId);
}

export async function createApplication(userId: number, opportunityId: number, title: string, ownerName?: string | null) {
  const db = await requireDb();
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found.");
  const result = await db.insert(applications).values({
    userId,
    opportunityId,
    title,
    ownerName: ownerName ?? null,
    targetDeadlineAt: opportunity.deadlineAt,
  });
  const applicationId = Number(result[0].insertId);
  await db.insert(applicationDocuments).values([
    { applicationId, title: "Project narrative", isRequired: true },
    { applicationId, title: "Budget and financial plan", isRequired: true },
    { applicationId, title: "Organisation information", isRequired: true },
  ]);
  return getApplicationForUser(userId, applicationId);
}

export async function listApplicationsForUser(userId: number) {
  const db = await requireDb();
  return db
    .select({ application: applications, opportunity: opportunities })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(eq(applications.userId, userId))
    .orderBy(asc(applications.targetDeadlineAt), desc(applications.updatedAt));
}

export async function getApplicationForUser(userId: number, applicationId: number) {
  const db = await requireDb();
  const rows = await db
    .select({ application: applications, opportunity: opportunities })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const documents = await db.select().from(applicationDocuments).where(eq(applicationDocuments.applicationId, applicationId)).orderBy(asc(applicationDocuments.createdAt));
  return { ...row, documents };
}

export async function updateApplication(
  userId: number,
  applicationId: number,
  input: { title?: string; status?: ApplicationStatus; ownerName?: string | null; notes?: string | null },
) {
  const db = await requireDb();
  const existing = await getApplicationForUser(userId, applicationId);
  if (!existing) throw new Error("Application not found.");
  const updateSet: Partial<typeof applications.$inferInsert> = {};
  if (input.title !== undefined) updateSet.title = input.title;
  if (input.status !== undefined) updateSet.status = input.status;
  if (input.ownerName !== undefined) updateSet.ownerName = input.ownerName;
  if (input.notes !== undefined) updateSet.notes = input.notes;
  if (input.status === "Submitted" && !existing.application.submittedAt) updateSet.submittedAt = new Date();
  if (Object.keys(updateSet).length > 0) {
    await db.update(applications).set(updateSet).where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));
  }
  if (input.status && input.status !== existing.application.status) {
    await db.insert(notifications).values({
      userId,
      applicationId,
      opportunityId: existing.opportunity.id,
      type: "application_status",
      title: `Application status: ${input.status}`,
      message: `${existing.application.title} is now marked ${input.status}.`,
    });
  }
  return getApplicationForUser(userId, applicationId);
}

export async function createApplicationDocument(userId: number, applicationId: number, title: string, isRequired: boolean, notes?: string | null) {
  const db = await requireDb();
  const application = await getApplicationForUser(userId, applicationId);
  if (!application) throw new Error("Application not found.");
  const result = await db.insert(applicationDocuments).values({ applicationId, title, isRequired, notes: notes ?? null });
  return Number(result[0].insertId);
}

async function getApplicationDocumentForUser(userId: number, documentId: number) {
  const db = await requireDb();
  const rows = await db
    .select({ document: applicationDocuments, application: applications })
    .from(applicationDocuments)
    .innerJoin(applications, eq(applicationDocuments.applicationId, applications.id))
    .where(and(eq(applicationDocuments.id, documentId), eq(applications.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateApplicationDocument(
  userId: number,
  documentId: number,
  input: { title?: string; isRequired?: boolean; uploadStatus?: "pending" | "uploaded" | "not_required"; notes?: string | null },
) {
  const db = await requireDb();
  const document = await getApplicationDocumentForUser(userId, documentId);
  if (!document) throw new Error("Document checklist item not found.");
  const updateSet: Partial<typeof applicationDocuments.$inferInsert> = {};
  if (input.title !== undefined) updateSet.title = input.title;
  if (input.isRequired !== undefined) updateSet.isRequired = input.isRequired;
  if (input.uploadStatus !== undefined) updateSet.uploadStatus = input.uploadStatus;
  if (input.notes !== undefined) updateSet.notes = input.notes;
  if (Object.keys(updateSet).length > 0) await db.update(applicationDocuments).set(updateSet).where(eq(applicationDocuments.id, documentId));
  return getApplicationForUser(userId, document.application.id);
}

export async function attachFileToDocument(
  userId: number,
  documentId: number,
  file: { fileName: string; mimeType: string; fileSizeBytes: number; fileKey: string; fileUrl: string },
) {
  const db = await requireDb();
  const document = await getApplicationDocumentForUser(userId, documentId);
  if (!document) throw new Error("Document checklist item not found.");
  await db
    .update(applicationDocuments)
    .set({ ...file, uploadStatus: "uploaded", uploadedAt: new Date() })
    .where(eq(applicationDocuments.id, documentId));
  return getApplicationForUser(userId, document.application.id);
}

export async function runEligibilityAssessment(
  userId: number,
  opportunityId: number,
  answers: Record<string, string | number | boolean>,
) {
  const db = await requireDb();
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found.");
  let score = 20;
  const rationale: string[] = [];
  const normalise = (value: string) => value.trim().toLocaleLowerCase();
  const country = typeof answers.country === "string" ? normalise(answers.country) : "";
  const organisationType = typeof answers.organisationType === "string" ? normalise(answers.organisationType) : "";
  const sector = typeof answers.sector === "string" ? normalise(answers.sector) : "";
  const budget = typeof answers.projectBudgetEur === "number" ? answers.projectBudgetEur : 0;

  const isEuWide = opportunity.countries.some(item => normalise(item) === "eu-wide");
  if (country && (isEuWide || opportunity.countries.some(item => normalise(item) === country))) {
    score += 25;
    rationale.push("Your selected geography appears compatible with the opportunity record.");
  } else if (country) {
    rationale.push("Confirm territorial eligibility in the official call documentation.");
  }
  if (organisationType && opportunity.applicantTypes.some(item => normalise(item) === organisationType)) {
    score += 25;
    rationale.push("Your organisation type matches a listed applicant category.");
  } else if (organisationType) {
    rationale.push("Applicant type requires confirmation against the official eligibility rules.");
  }
  if (sector && opportunity.sectors.some(item => normalise(item) === sector)) {
    score += 15;
    rationale.push("Your selected sector aligns with the opportunity themes.");
  } else if (sector) {
    rationale.push("Sector relevance is indicative and should be checked against the full call scope.");
  }
  const maxGrant = opportunity.maxGrantEur ? Number(opportunity.maxGrantEur) : 0;
  if (budget > 0 && maxGrant > 0 && budget <= maxGrant) {
    score += 15;
    rationale.push("The stated project budget is within the recorded award range.");
  } else if (budget > 0 && maxGrant === 0) {
    rationale.push("No comparable award ceiling is currently recorded for this opportunity.");
  }
  rationale.push("This is an indicative self-assessment, not an eligibility determination. The official documentation prevails.");
  score = Math.max(0, Math.min(100, score));
  await db.insert(eligibilityAssessments).values({ userId, opportunityId, score, answers, rationale });
  return { score, rationale, opportunity };
}

export async function getDashboard(userId: number) {
  const db = await requireDb();
  const [saved, appRows, savedDeadlines, latestNotifications] = await Promise.all([
    db.select({ total: count() }).from(savedOpportunities).where(eq(savedOpportunities.userId, userId)),
    listApplicationsForUser(userId),
    db
      .select({ opportunity: opportunities })
      .from(savedOpportunities)
      .innerJoin(opportunities, eq(savedOpportunities.opportunityId, opportunities.id))
      .where(and(eq(savedOpportunities.userId, userId), gte(opportunities.deadlineAt, new Date()), ...publicOpportunityConditions()))
      .orderBy(asc(opportunities.deadlineAt))
      .limit(4),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(5),
  ]);
  const statusCounts = APPLICATION_STATUSES.reduce<Record<ApplicationStatus, number>>((accumulator, status) => {
    accumulator[status] = appRows.filter(row => row.application.status === status).length;
    return accumulator;
  }, {} as Record<ApplicationStatus, number>);
  return {
    savedCount: Number(saved[0]?.total ?? 0),
    activeApplications: appRows.filter(row => !["Awarded", "Rejected"].includes(row.application.status)).length,
    statusCounts,
    upcomingDeadlines: savedDeadlines,
    notifications: latestNotifications,
  };
}

export async function getOrganisationProfile(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(organisationProfiles).where(eq(organisationProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertOrganisationProfile(
  userId: number,
  input: { organisationName?: string | null; organisationType?: string | null; country?: string | null; sector?: string | null; employeeCount?: number | null; projectBudgetEur?: number | null; consortiumPreference?: "yes" | "no" | "open" | null },
) {
  const db = await requireDb();
  await db
    .insert(organisationProfiles)
    .values({ ...input, userId, projectBudgetEur: input.projectBudgetEur?.toFixed(2) ?? null })
    .onDuplicateKeyUpdate({ set: { ...input, projectBudgetEur: input.projectBudgetEur?.toFixed(2) ?? null } });
  return getOrganisationProfile(userId);
}

export async function listNotifications(userId: number) {
  const db = await requireDb();
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await requireDb();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return { success: true };
}

async function notificationAlreadyCreated(userId: number, opportunityId: number | null, applicationId: number | null, type: "saved_deadline" | "application_deadline") {
  const db = await requireDb();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const conditions = [eq(notifications.userId, userId), eq(notifications.type, type), gte(notifications.createdAt, since)];
  if (opportunityId !== null) conditions.push(eq(notifications.opportunityId, opportunityId));
  if (applicationId !== null) conditions.push(eq(notifications.applicationId, applicationId));
  const matches = await db.select({ id: notifications.id }).from(notifications).where(and(...conditions)).limit(1);
  return Boolean(matches[0]);
}

/** Idempotent daily reminder generator intended for the platform-managed scheduled endpoint. */
export async function generateDeadlineNotifications() {
  const db = await requireDb();
  const now = new Date();
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const saved = await db
    .select({ userId: savedOpportunities.userId, opportunity: opportunities })
    .from(savedOpportunities)
    .innerJoin(opportunities, eq(savedOpportunities.opportunityId, opportunities.id))
    .where(and(gte(opportunities.deadlineAt, now), lte(opportunities.deadlineAt, fourteenDays), ...publicOpportunityConditions()));
  const activeApplications = await db
    .select({ application: applications, opportunity: opportunities })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(and(gte(applications.targetDeadlineAt, now), lte(applications.targetDeadlineAt, fourteenDays), notInArray(applications.status, ["Awarded", "Rejected"])));
  let created = 0;
  for (const row of saved) {
    if (!await notificationAlreadyCreated(row.userId, row.opportunity.id, null, "saved_deadline")) {
      await db.insert(notifications).values({
        userId: row.userId,
        opportunityId: row.opportunity.id,
        type: "saved_deadline",
        title: "Saved opportunity deadline approaching",
        message: `${row.opportunity.title} has a deadline within the next 14 days.`,
        dueAt: row.opportunity.deadlineAt,
      });
      created += 1;
    }
  }
  for (const row of activeApplications) {
    if (!await notificationAlreadyCreated(row.application.userId, row.opportunity.id, row.application.id, "application_deadline")) {
      await db.insert(notifications).values({
        userId: row.application.userId,
        opportunityId: row.opportunity.id,
        applicationId: row.application.id,
        type: "application_deadline",
        title: "Application deadline approaching",
        message: `${row.application.title} has a deadline within the next 14 days.`,
        dueAt: row.application.targetDeadlineAt,
      });
      created += 1;
    }
  }
  return { created, evaluatedAt: now };
}

export type AdminOpportunityInput = Omit<typeof opportunities.$inferInsert, "id" | "createdAt" | "updatedAt" | "lastCheckedAt" | "archivedAt">;

export async function listAdminOpportunities() {
  const db = await requireDb();
  return db.select().from(opportunities).orderBy(desc(opportunities.updatedAt)).limit(100);
}

export async function createAdminOpportunity(input: AdminOpportunityInput) {
  const db = await requireDb();
  const result = await db.insert(opportunities).values({ ...input, lastCheckedAt: new Date() });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return rows[0] as Opportunity;
}

export async function updateAdminOpportunity(id: number, input: Partial<AdminOpportunityInput>) {
  const db = await requireDb();
  await db.update(opportunities).set({ ...input, lastCheckedAt: new Date() }).where(eq(opportunities.id, id));
  const rows = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function archiveAdminOpportunity(id: number) {
  const db = await requireDb();
  await db.update(opportunities).set({ archivedAt: new Date(), isPublished: false }).where(eq(opportunities.id, id));
  return { success: true };
}

export async function upsertOfficialOpportunity(input: AdminOpportunityInput) {
  const db = await requireDb();
  await db
    .insert(opportunities)
    .values({ ...input, lastCheckedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { ...input, lastCheckedAt: new Date(), archivedAt: null } });
}
