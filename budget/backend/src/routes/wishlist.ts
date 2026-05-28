import { Router } from "express";
import { z } from "zod";
import { isValidISODate, parseISODateUtc, todayISODate } from "../lib/dates.js";
import { prisma } from "../lib/prisma.js";
import { dec } from "../lib/serialize.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().max(2000).optional().nullable(),
});

const patchSchema = createSchema.partial();

const purchaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
  note: z.string().max(2000).optional().nullable(),
});

export const wishlistRouter = Router();

function mapItem(
  w: NonNullable<Awaited<ReturnType<typeof prisma.wishlistItem.findFirst>>> & {
    category: { id: string; name: string };
  },
) {
  return {
    id: w.id,
    name: w.name,
    categoryId: w.categoryId,
    amount: dec(w.amount),
    note: w.note,
    createdAt: w.createdAt,
    category: w.category,
  };
}

wishlistRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const rows = await prisma.wishlistItem.findMany({
      where: { category: { userId: uid } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows.map((r) => mapItem(r)));
  } catch (e) {
    next(e);
  }
});

wishlistRouter.post("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    await prisma.category.findFirstOrThrow({
      where: { id: parsed.data.categoryId, userId: uid },
    });
    const row = await prisma.wishlistItem.create({
      data: {
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        note: parsed.data.note ?? undefined,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json(mapItem(row));
  } catch (e) {
    next(e);
  }
});

wishlistRouter.patch("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const existing = await prisma.wishlistItem.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!existing) throw new HttpError(404, "Wishlist item not found");
    if (parsed.data.categoryId) {
      await prisma.category.findFirstOrThrow({
        where: { id: parsed.data.categoryId, userId: uid },
      });
    }
    const row = await prisma.wishlistItem.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        note: parsed.data.note === null ? null : parsed.data.note,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(mapItem(row));
  } catch (e) {
    next(e);
  }
});

wishlistRouter.delete("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const existing = await prisma.wishlistItem.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!existing) throw new HttpError(404, "Wishlist item not found");
    await prisma.wishlistItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

wishlistRouter.post("/:id/purchase", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const item = await prisma.wishlistItem.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!item) throw new HttpError(404, "Wishlist item not found");

    const settings = await prisma.appSettings.findUnique({
      where: { userId: uid },
    });
    const timeZone = settings?.timeZone || "UTC";
    const dateStr = parsed.data.date ?? todayISODate(timeZone);
    if (!isValidISODate(dateStr)) {
      throw new HttpError(400, "Invalid date; use YYYY-MM-DD");
    }
    const d = parseISODateUtc(dateStr);
    const note =
      parsed.data.note !== undefined && parsed.data.note !== null
        ? parsed.data.note
        : item.note;

    const expense = await prisma.$transaction(async (tx) => {
      const e = await tx.expense.create({
        data: {
          name: parsed.data.name ?? item.name,
          categoryId: item.categoryId,
          amount: parsed.data.amount,
          date: d,
          note: note ?? undefined,
        },
        include: { category: { select: { id: true, name: true } } },
      });
      await tx.wishlistItem.delete({ where: { id: item.id } });
      return e;
    });

    res.status(201).json({
      expense: {
        id: expense.id,
        name: expense.name,
        categoryId: expense.categoryId,
        amount: dec(expense.amount),
        date: expense.date.toISOString().slice(0, 10),
        note: expense.note,
        recurringExpenseId: expense.recurringExpenseId,
        recurringSubcategoryId: expense.recurringSubcategoryId,
        createdAt: expense.createdAt,
        category: expense.category,
      },
    });
  } catch (e) {
    next(e);
  }
});
