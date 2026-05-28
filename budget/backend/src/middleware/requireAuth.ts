import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE } from "../lib/authConstants.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./httpError.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      next(new HttpError(401, "Not authenticated"));
      return;
    }
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      next(new HttpError(401, "Not authenticated"));
      return;
    }
    req.userId = session.user.id;
    next();
  })().catch(next);
}
