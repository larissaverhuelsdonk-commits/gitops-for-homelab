import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

const patchSchema = z.object({
  currencyCode: z.string().min(3).max(3).toUpperCase().optional(),
  timeZone: z.string().min(1).max(100).optional(),
  domainName: z.string().max(255).optional(),
});

export const appSettingsRouter = Router();

async function ensureSettings(uid: string) {
  await prisma.appSettings.upsert({
    where: { userId: uid },
    create: {
      userId: uid,
      currencyCode: "THB",
      timeZone: "UTC",
      domainName: "",
    },
    update: {},
  });
}

appSettingsRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    await ensureSettings(uid);
    const row = await prisma.appSettings.findUniqueOrThrow({
      where: { userId: uid },
    });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

appSettingsRouter.patch("/", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const uid = userId(req);
    await ensureSettings(uid);
    const row = await prisma.appSettings.update({
      where: { userId: uid },
      data: {
        currencyCode: parsed.data.currencyCode,
        timeZone: parsed.data.timeZone,
        domainName: parsed.data.domainName,
      },
    });
    res.json(row);
  } catch (e) {
    next(e);
  }
});
