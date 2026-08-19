import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user record maintained by the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organisationProfiles = mysqlTable(
  "organisationProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    organisationName: varchar("organisationName", { length: 255 }),
    organisationType: varchar("organisationType", { length: 100 }),
    country: varchar("country", { length: 100 }),
    sector: varchar("sector", { length: 100 }),
    employeeCount: int("employeeCount"),
    projectBudgetEur: decimal("projectBudgetEur", { precision: 14, scale: 2 }),
    consortiumPreference: mysqlEnum("consortiumPreference", ["yes", "no", "open"]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("organisation_profiles_user_id").on(table.userId)],
);

export const opportunities = mysqlTable(
  "opportunities",
  {
    id: int("id").autoincrement().primaryKey(),
    externalId: varchar("externalId", { length: 255 }),
    sourceName: varchar("sourceName", { length: 255 }).notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    applicationUrl: text("applicationUrl"),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 560 }).notNull(),
    summary: text("summary"),
    description: text("description"),
    eligibilityText: text("eligibilityText"),
    programme: varchar("programme", { length: 160 }),
    fund: varchar("fund", { length: 160 }),
    opportunityType: mysqlEnum("opportunityType", [
      "grant",
      "call_for_proposals",
      "cascade_funding",
      "prize",
      "loan",
      "guarantee",
      "equity",
      "procurement",
      "other",
    ]).default("grant").notNull(),
    statusComputed: mysqlEnum("statusComputed", ["upcoming", "open", "closing_soon", "closed", "unknown"])
      .default("unknown")
      .notNull(),
    countries: json("countries").$type<string[]>().notNull(),
    sectors: json("sectors").$type<string[]>().notNull(),
    applicantTypes: json("applicantTypes").$type<string[]>().notNull(),
    documents: json("documents").$type<Array<{ title: string; url: string }>>(),
    deadlineAt: timestamp("deadlineAt"),
    deadlineText: varchar("deadlineText", { length: 255 }),
    publishedAt: timestamp("publishedAt"),
    totalBudgetEur: decimal("totalBudgetEur", { precision: 16, scale: 2 }),
    minGrantEur: decimal("minGrantEur", { precision: 16, scale: 2 }),
    maxGrantEur: decimal("maxGrantEur", { precision: 16, scale: 2 }),
    fundingRateMin: decimal("fundingRateMin", { precision: 5, scale: 2 }),
    fundingRateMax: decimal("fundingRateMax", { precision: 5, scale: 2 }),
    sourceConfidence: decimal("sourceConfidence", { precision: 4, scale: 3 }).default("1.000").notNull(),
    extractionConfidence: decimal("extractionConfidence", { precision: 4, scale: 3 }).default("1.000").notNull(),
    lastCheckedAt: timestamp("lastCheckedAt").defaultNow().notNull(),
    isPublished: boolean("isPublished").default(true).notNull(),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("opportunities_slug_unique").on(table.slug),
    uniqueIndex("opportunities_source_external_unique").on(table.sourceName, table.externalId),
    index("opportunities_status_deadline_idx").on(table.statusComputed, table.deadlineAt),
    index("opportunities_programme_idx").on(table.programme),
    index("opportunities_published_idx").on(table.isPublished, table.archivedAt),
  ],
);

export const savedOpportunities = mysqlTable(
  "savedOpportunities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: int("opportunityId").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("saved_opportunities_user_opportunity_unique").on(table.userId, table.opportunityId),
    index("saved_opportunities_user_idx").on(table.userId),
  ],
);

export const applications = mysqlTable(
  "applications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: int("opportunityId").notNull().references(() => opportunities.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["Draft", "In Progress", "Submitted", "Awarded", "Rejected"])
      .default("Draft")
      .notNull(),
    ownerName: varchar("ownerName", { length: 255 }),
    notes: text("notes"),
    targetDeadlineAt: timestamp("targetDeadlineAt"),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("applications_user_status_idx").on(table.userId, table.status),
    index("applications_deadline_idx").on(table.targetDeadlineAt),
  ],
);

export const applicationDocuments = mysqlTable(
  "applicationDocuments",
  {
    id: int("id").autoincrement().primaryKey(),
    applicationId: int("applicationId").notNull().references(() => applications.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    isRequired: boolean("isRequired").default(true).notNull(),
    uploadStatus: mysqlEnum("uploadStatus", ["pending", "uploaded", "not_required"])
      .default("pending")
      .notNull(),
    notes: text("notes"),
    fileName: varchar("fileName", { length: 500 }),
    mimeType: varchar("mimeType", { length: 160 }),
    fileSizeBytes: int("fileSizeBytes"),
    fileKey: varchar("fileKey", { length: 700 }),
    fileUrl: text("fileUrl"),
    uploadedAt: timestamp("uploadedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("application_documents_application_idx").on(table.applicationId)],
);

export const eligibilityAssessments = mysqlTable(
  "eligibilityAssessments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: int("opportunityId").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    score: int("score").notNull(),
    answers: json("answers").$type<Record<string, string | number | boolean>>().notNull(),
    rationale: json("rationale").$type<string[]>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("eligibility_assessments_user_opportunity_idx").on(table.userId, table.opportunityId)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: int("opportunityId").references(() => opportunities.id, { onDelete: "cascade" }),
    applicationId: int("applicationId").references(() => applications.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["saved_deadline", "application_deadline", "application_status"])
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    dueAt: timestamp("dueAt"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("notifications_user_read_idx").on(table.userId, table.readAt, table.createdAt),
    index("notifications_due_idx").on(table.dueAt),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;
