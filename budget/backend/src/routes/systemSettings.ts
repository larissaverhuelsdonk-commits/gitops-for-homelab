import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/httpError.js";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";

export const systemSettingsRouter = Router();

const updateSchema = z.object({
  signupsEnabled: z.boolean(),
});

// GET /api/system-settings (public, used by frontend to know if signup is allowed)
systemSettingsRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      let settings = await prisma.systemSettings.findUnique({
        where: { id: "1" },
      });
      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: { id: "1", signupsEnabled: true },
        });
      }

      // Also check if there are no users at all, in which case signup is always effectively enabled for the first user
      const userCount = await prisma.user.count();

      res.json({
        signupsEnabled: settings.signupsEnabled || userCount === 0,
      });
    } catch (e) {
      next(e);
    }
  },
);

// PUT /api/system-settings (protected, admin only)
systemSettingsRouter.put(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Note: requireAuth middleware is applied before this in app.ts
      // We also need to check if user is ADMIN
      const userId = req.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user?.role !== "ADMIN") {
        throw new HttpError(403, "Forbidden: Admin access required");
      }

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "Validation failed", {
          errors: parsed.error.flatten(),
        });
      }

      const settings = await prisma.systemSettings.upsert({
        where: { id: "1" },
        update: { signupsEnabled: parsed.data.signupsEnabled },
        create: { id: "1", signupsEnabled: parsed.data.signupsEnabled },
      });

      res.json({ signupsEnabled: settings.signupsEnabled });
    } catch (e) {
      next(e);
    }
  },
);
