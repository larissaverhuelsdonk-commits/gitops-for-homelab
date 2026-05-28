import { randomBytes } from "crypto";
import type { CookieOptions, Request, Response } from "express";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_DAYS } from "../lib/authConstants.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/httpError.js";

const loginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
});

export const authRouter = Router();

function cookieOpts(req: Request): CookieOptions {
  // Use Express's req.secure which respects "trust proxy"
  // If accessing directly over HTTP on a LAN, this allows the cookie to be set.
  return {
    httpOnly: true,
    secure: req.secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

async function createSession(
  userId: string,
  req: Request,
  res: Response,
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  res.cookie(SESSION_COOKIE, token, cookieOpts(req));
}

authRouter.get("/me", async (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      res.json({ user: null });
      return;
    }
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session
          .delete({ where: { id: session.id } })
          .catch(() => {});
      }
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "1" },
    });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: "1", signupsEnabled: true },
      });
    }

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    if (!settings.signupsEnabled && !isFirstUser) {
      throw new HttpError(403, "Signups are currently disabled.");
    }

    const username = parsed.data.username.toLowerCase();
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) {
      throw new HttpError(409, "Username already taken");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: isFirstUser ? "ADMIN" : "USER",
        appSettings: {
          create: { currencyCode: "THB", timeZone: "UTC", domainName: "" },
        },
      },
    });
    await createSession(user.id, req, res);
    res
      .status(201)
      .json({
        user: { id: user.id, username: user.username, role: user.role },
      });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const username = parsed.data.username.toLowerCase();
    const user = await prisma.user.findUnique({ where: { username } });
    if (
      !user ||
      !(await bcrypt.compare(parsed.data.password, user.passwordHash))
    ) {
      throw new HttpError(401, "Invalid username or password");
    }
    await createSession(user.id, req, res);
    res.json({
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
