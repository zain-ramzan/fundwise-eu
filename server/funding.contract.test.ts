import { describe, expect, it } from "vitest";
import { APPLICATION_STATUSES } from "./db/funding";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: 17,
      openId: `contract-${role}`,
      name: "Contract User",
      email: "contract@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("funding platform contracts", () => {
  it("keeps the exact application status lifecycle required by the product", () => {
    expect(APPLICATION_STATUSES).toEqual(["Draft", "In Progress", "Submitted", "Awarded", "Rejected"]);
  });

  it("requires Manus OAuth authentication before returning private workspace data", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.applications.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows only administrators to reach opportunity management procedures", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.admin.opportunities.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
