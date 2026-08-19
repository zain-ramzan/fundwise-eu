import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  APPLICATION_STATUSES,
  type AdminOpportunityInput,
  archiveAdminOpportunity,
  attachFileToDocument,
  createAdminOpportunity,
  createApplication,
  createApplicationDocument,
  getApplicationForUser,
  getDashboard,
  getOpportunityBySlug,
  getOrganisationProfile,
  getSavedOpportunityIds,
  listAdminOpportunities,
  listApplicationsForUser,
  listFilterOptions,
  listNotifications,
  listOpportunities,
  listSavedOpportunities,
  markNotificationRead,
  runEligibilityAssessment,
  toggleSavedOpportunity,
  updateAdminOpportunity,
  updateApplication,
  updateApplicationDocument,
  upsertOrganisationProfile,
} from "./db/funding";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const opportunityStatuses = ["upcoming", "open", "closing_soon", "closed", "unknown"] as const;
const opportunityTypes = ["grant", "call_for_proposals", "cascade_funding", "prize", "loan", "guarantee", "equity", "procurement", "other"] as const;
const dateValue = z.coerce.date().nullable().optional();

const opportunityInput = z.object({
  externalId: z.string().max(255).nullable().optional(),
  sourceName: z.string().min(2).max(255),
  sourceUrl: z.string().url(),
  applicationUrl: z.string().url().nullable().optional(),
  title: z.string().min(3).max(500),
  slug: z.string().min(3).max(560).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().max(5000).nullable().optional(),
  description: z.string().max(30000).nullable().optional(),
  eligibilityText: z.string().max(15000).nullable().optional(),
  programme: z.string().max(160).nullable().optional(),
  fund: z.string().max(160).nullable().optional(),
  opportunityType: z.enum(opportunityTypes).default("grant"),
  statusComputed: z.enum(opportunityStatuses).default("unknown"),
  countries: z.array(z.string().min(2).max(100)).min(1).max(40),
  sectors: z.array(z.string().min(2).max(100)).min(1).max(40),
  applicantTypes: z.array(z.string().min(2).max(100)).min(1).max(40),
  documents: z.array(z.object({ title: z.string().min(2).max(500), url: z.string().url() })).max(30).nullable().optional(),
  deadlineAt: dateValue,
  deadlineText: z.string().max(255).nullable().optional(),
  publishedAt: dateValue,
  totalBudgetEur: z.number().nonnegative().nullable().optional(),
  minGrantEur: z.number().nonnegative().nullable().optional(),
  maxGrantEur: z.number().nonnegative().nullable().optional(),
  fundingRateMin: z.number().min(0).max(100).nullable().optional(),
  fundingRateMax: z.number().min(0).max(100).nullable().optional(),
  sourceConfidence: z.number().min(0).max(1).default(1),
  extractionConfidence: z.number().min(0).max(1).default(1),
  isPublished: z.boolean().default(true),
});

function normaliseOpportunityInput(input: z.infer<typeof opportunityInput>) {
  return {
    ...input,
    totalBudgetEur: input.totalBudgetEur?.toFixed(2) ?? null,
    minGrantEur: input.minGrantEur?.toFixed(2) ?? null,
    maxGrantEur: input.maxGrantEur?.toFixed(2) ?? null,
    fundingRateMin: input.fundingRateMin?.toFixed(2) ?? null,
    fundingRateMax: input.fundingRateMax?.toFixed(2) ?? null,
    sourceConfidence: input.sourceConfidence.toFixed(3),
    extractionConfidence: input.extractionConfidence.toFixed(3),
  };
}

function databaseError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  const message = error instanceof Error ? error.message : "Unable to complete this request.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  opportunities: router({
    list: publicProcedure
      .input(z.object({
        q: z.string().trim().max(120).optional(),
        programme: z.string().max(160).optional(),
        sector: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
        deadlineBefore: z.coerce.date().optional(),
        deadlineAfter: z.coerce.date().optional(),
        budgetMin: z.number().nonnegative().optional(),
        budgetMax: z.number().nonnegative().optional(),
        status: z.enum(opportunityStatuses).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(48).default(12),
      }))
      .query(async ({ input }) => {
        try {
          if (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Minimum budget cannot exceed maximum budget." });
          }
          return await listOpportunities(input);
        } catch (error) {
          return databaseError(error);
        }
      }),
    filterOptions: publicProcedure.query(async () => {
      try {
        return await listFilterOptions();
      } catch (error) {
        return databaseError(error);
      }
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(3).max(560) })).query(async ({ input, ctx }) => {
      try {
        const opportunity = await getOpportunityBySlug(input.slug);
        if (!opportunity) throw new TRPCError({ code: "NOT_FOUND", message: "Funding opportunity not found." });
        const savedIds = ctx.user ? await getSavedOpportunityIds(ctx.user.id, [opportunity.id]) : [];
        return { opportunity, isSaved: savedIds.includes(opportunity.id) };
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  saved: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await listSavedOpportunities(ctx.user.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    toggle: protectedProcedure.input(z.object({ opportunityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try {
        return await toggleSavedOpportunity(ctx.user.id, input.opportunityId);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  dashboard: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getDashboard(ctx.user.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  applications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await listApplicationsForUser(ctx.user.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    byId: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try {
        const application = await getApplicationForUser(ctx.user.id, input.id);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
        return application;
      } catch (error) {
        return databaseError(error);
      }
    }),
    create: protectedProcedure.input(z.object({ opportunityId: z.number().int().positive(), title: z.string().trim().min(2).max(255), ownerName: z.string().trim().max(255).nullable().optional() })).mutation(async ({ ctx, input }) => {
      try {
        return await createApplication(ctx.user.id, input.opportunityId, input.title, input.ownerName);
      } catch (error) {
        return databaseError(error);
      }
    }),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      title: z.string().trim().min(2).max(255).optional(),
      status: z.enum(APPLICATION_STATUSES).optional(),
      ownerName: z.string().trim().max(255).nullable().optional(),
      notes: z.string().max(12000).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updates } = input;
        return await updateApplication(ctx.user.id, id, updates);
      } catch (error) {
        return databaseError(error);
      }
    }),
    addDocument: protectedProcedure.input(z.object({ applicationId: z.number().int().positive(), title: z.string().trim().min(2).max(255), isRequired: z.boolean().default(true), notes: z.string().max(4000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      try {
        return { id: await createApplicationDocument(ctx.user.id, input.applicationId, input.title, input.isRequired, input.notes) };
      } catch (error) {
        return databaseError(error);
      }
    }),
    updateDocument: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      title: z.string().trim().min(2).max(255).optional(),
      isRequired: z.boolean().optional(),
      uploadStatus: z.enum(["pending", "uploaded", "not_required"]).optional(),
      notes: z.string().max(4000).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updates } = input;
        return await updateApplicationDocument(ctx.user.id, id, updates);
      } catch (error) {
        return databaseError(error);
      }
    }),
    uploadDocument: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      fileName: z.string().min(1).max(180),
      mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"]),
      base64Data: z.string().min(8).max(16_800_000),
    })).mutation(async ({ ctx, input }) => {
      try {
        const bytes = Buffer.from(input.base64Data, "base64");
        if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Files must be between 1 byte and 12 MB." });
        }
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const stored = await storagePut(`application-documents/${ctx.user.id}/${input.id}/${safeName}`, bytes, input.mimeType);
        return await attachFileToDocument(ctx.user.id, input.id, {
          fileName: safeName,
          mimeType: input.mimeType,
          fileSizeBytes: bytes.length,
          fileKey: stored.key,
          fileUrl: stored.url,
        });
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  eligibility: router({
    assess: protectedProcedure.input(z.object({
      opportunityId: z.number().int().positive(),
      answers: z.object({
        organisationType: z.string().trim().min(2).max(100),
        country: z.string().trim().min(2).max(100),
        sector: z.string().trim().min(2).max(100),
        projectBudgetEur: z.number().nonnegative(),
        consortiumReady: z.boolean(),
      }),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await runEligibilityAssessment(ctx.user.id, input.opportunityId, input.answers);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getOrganisationProfile(ctx.user.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    upsert: protectedProcedure.input(z.object({
      organisationName: z.string().trim().max(255).nullable().optional(),
      organisationType: z.string().trim().max(100).nullable().optional(),
      country: z.string().trim().max(100).nullable().optional(),
      sector: z.string().trim().max(100).nullable().optional(),
      employeeCount: z.number().int().min(0).max(10_000_000).nullable().optional(),
      projectBudgetEur: z.number().nonnegative().nullable().optional(),
      consortiumPreference: z.enum(["yes", "no", "open"]).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await upsertOrganisationProfile(ctx.user.id, input);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await listNotifications(ctx.user.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try {
        return await markNotificationRead(ctx.user.id, input.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
  admin: router({
    opportunities: router({
      list: adminProcedure.query(async () => {
        try {
          return await listAdminOpportunities();
        } catch (error) {
          return databaseError(error);
        }
      }),
      create: adminProcedure.input(opportunityInput).mutation(async ({ input }) => {
        try {
          return await createAdminOpportunity(normaliseOpportunityInput(input));
        } catch (error) {
          return databaseError(error);
        }
      }),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: opportunityInput.partial() })).mutation(async ({ input }) => {
        try {
          const parsed = opportunityInput.partial().parse(input.data);
          const numericNormalised = {
            ...parsed,
            ...(parsed.totalBudgetEur !== undefined ? { totalBudgetEur: parsed.totalBudgetEur?.toFixed(2) ?? null } : {}),
            ...(parsed.minGrantEur !== undefined ? { minGrantEur: parsed.minGrantEur?.toFixed(2) ?? null } : {}),
            ...(parsed.maxGrantEur !== undefined ? { maxGrantEur: parsed.maxGrantEur?.toFixed(2) ?? null } : {}),
            ...(parsed.fundingRateMin !== undefined ? { fundingRateMin: parsed.fundingRateMin?.toFixed(2) ?? null } : {}),
            ...(parsed.fundingRateMax !== undefined ? { fundingRateMax: parsed.fundingRateMax?.toFixed(2) ?? null } : {}),
            ...(parsed.sourceConfidence !== undefined ? { sourceConfidence: parsed.sourceConfidence.toFixed(3) } : {}),
            ...(parsed.extractionConfidence !== undefined ? { extractionConfidence: parsed.extractionConfidence.toFixed(3) } : {}),
          };
          return await updateAdminOpportunity(input.id, numericNormalised as Partial<AdminOpportunityInput>);
        } catch (error) {
          return databaseError(error);
        }
      }),
      archive: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        try {
          return await archiveAdminOpportunity(input.id);
        } catch (error) {
          return databaseError(error);
        }
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
