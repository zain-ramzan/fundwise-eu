import type { Request, Response } from "express";
import { generateDeadlineNotifications } from "./db/funding";
import { sdk } from "./_core/sdk";

/**
 * Runs only for a platform-authenticated scheduled task. The generation logic is
 * idempotent, so retrying this endpoint does not duplicate same-day reminders.
 */
export async function deadlineReminderHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({ error: "cron-only" });
      return;
    }
    const result = await generateDeadlineNotifications();
    res.json({ ok: true, taskUid: user.taskUid, ...result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown scheduled reminder error";
    console.error("[Scheduled reminders]", error);
    res.status(500).json({
      error: detail,
      context: { path: "/api/scheduled/deadline-reminders" },
      timestamp: new Date().toISOString(),
    });
  }
}
