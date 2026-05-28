import type { Request } from "express";
import { HttpError } from "../middleware/httpError.js";

/** `requireAuth` must run before handlers that call this. */
export function userId(req: Request): string {
  const id = req.userId;
  if (!id) throw new HttpError(401, "Not authenticated");
  return id;
}
