import { Router } from "express";
import { z } from "zod";
import {
  isValidISODate,
  isValidMonth,
  monthFromISODate,
  monthUtcRange,
  parseISODateUtc,
} from "../lib/dates.js";
import { prisma } from "../lib/prisma.js";
import { dec } from "../lib/serialize.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

const createSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  categoryId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string(),
  note: z.string().max(2000).optional().nullable(),
  recurringExpenseId: z.string().optional().nullable(),
  recurringSubcategoryId: z.string().optional().nullable(),
});

const patchSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  categoryId: z.string().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.string().optional(),
  note: z.string().max(2000).optional().nullable(),
});

export const expensesRouter = Router();

function mapExpense(
  e: NonNullable<Awaited<ReturnType<typeof prisma.expense.findFirst>>> & {
    category: { id: string; name: string; isIncome: boolean };
  },
) {
  return {
    id: e.id,
    name: e.name,
    categoryId: e.categoryId,
    amount: dec(e.amount),
    date: e.date.toISOString().slice(0, 10),
    note: e.note,
    recurringExpenseId: e.recurringExpenseId,
    recurringSubcategoryId: e.recurringSubcategoryId,
    createdAt: e.createdAt,
    category: e.category,
  };
}

async function assertRecurringMonthUnique(
  uid: string,
  recurringExpenseId: string,
  expenseDate: Date,
): Promise<void> {
  const month = monthFromISODate(expenseDate.toISOString().slice(0, 10));
  const { start, endExclusive } = monthUtcRange(month);
  const existing = await prisma.expense.findFirst({
    where: {
      recurringExpenseId,
      date: { gte: start, lt: endExclusive },
      category: { userId: uid },
    },
  });
  if (existing) {
    throw new HttpError(
      409,
      "This recurring expense is already logged for that month",
    );
  }
}

async function assertCategoryOwned(
  uid: string,
  categoryId: string,
): Promise<void> {
  const c = await prisma.category.findFirst({
    where: { id: categoryId, userId: uid },
  });
  if (!c) throw new HttpError(400, "Category not found");
}

expensesRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const month = req.query.month as string;
    if (!month || !isValidMonth(month)) {
      throw new HttpError(400, "Query month=YYYY-MM is required");
    }
    const { start, endExclusive } = monthUtcRange(month);
    const rows = await prisma.expense.findMany({
      where: {
        date: { gte: start, lt: endExclusive },
        category: { userId: uid },
      },
      include: {
        category: { select: { id: true, name: true, isIncome: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    res.json(rows.map((r) => mapExpense(r)));
  } catch (e) {
    next(e);
  }
});

expensesRouter.get("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const row = await prisma.expense.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
      include: {
        category: { select: { id: true, name: true, isIncome: true } },
      },
    });
    if (!row) throw new HttpError(404, "Expense not found");
    res.json(mapExpense(row));
  } catch (e) {
    next(e);
  }
});

expensesRouter.post("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    if (!isValidISODate(parsed.data.date)) {
      throw new HttpError(400, "Invalid date; use YYYY-MM-DD");
    }
    const d = parseISODateUtc(parsed.data.date);
    const categoryId = parsed.data.categoryId;
    const recurringExpenseId = parsed.data.recurringExpenseId ?? undefined;
    const recurringSubcategoryIdBody =
      parsed.data.recurringSubcategoryId ?? undefined;

    await assertCategoryOwned(uid, categoryId);

    let expenseName = parsed.data.name?.trim() ?? "";
    let recurringSubcategoryId: string | undefined;

    if (recurringExpenseId) {
      const rec = await prisma.recurringExpense.findFirst({
        where: { id: recurringExpenseId, category: { userId: uid } },
        include: {
          subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        },
      });
      if (!rec) throw new HttpError(400, "Recurring expense not found");
      if (rec.categoryId !== categoryId) {
        throw new HttpError(
          400,
          "categoryId must match recurring template category",
        );
      }
      if (!rec.isCommon) {
        await assertRecurringMonthUnique(uid, recurringExpenseId, d);
      }
      if (rec.subcategories.length > 0) {
        if (!recurringSubcategoryIdBody) {
          throw new HttpError(
            400,
            "This recurring template requires a subcategory",
          );
        }
        const sub = rec.subcategories.find(
          (s) => s.id === recurringSubcategoryIdBody,
        );
        if (!sub) {
          throw new HttpError(400, "Invalid recurring subcategory");
        }
        expenseName = sub.name;
        recurringSubcategoryId = sub.id;
      } else {
        if (recurringSubcategoryIdBody) {
          throw new HttpError(
            400,
            "This recurring template has no subcategories",
          );
        }
        if (!expenseName) expenseName = rec.name;
      }
    } else if (recurringSubcategoryIdBody) {
      throw new HttpError(
        400,
        "recurringSubcategoryId requires recurringExpenseId",
      );
    }

    const row = await prisma.expense.create({
      data: {
        name: expenseName,
        categoryId,
        amount: parsed.data.amount,
        date: d,
        note: parsed.data.note ?? undefined,
        recurringExpenseId,
        recurringSubcategoryId,
      },
      include: {
        category: { select: { id: true, name: true, isIncome: true } },
      },
    });
    res.status(201).json(mapExpense(row));
  } catch (e) {
    next(e);
  }
});

expensesRouter.patch("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const current = await prisma.expense.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!current) throw new HttpError(404, "Expense not found");

    if (parsed.data.categoryId) {
      await assertCategoryOwned(uid, parsed.data.categoryId);
    }

    const nextDate = parsed.data.date
      ? isValidISODate(parsed.data.date)
        ? parseISODateUtc(parsed.data.date)
        : null
      : null;
    if (parsed.data.date && !nextDate) {
      throw new HttpError(400, "Invalid date; use YYYY-MM-DD");
    }
    const dateVal = nextDate ?? current.date;
    const recurringId = current.recurringExpenseId;

    if (recurringId && (parsed.data.date || parsed.data.categoryId)) {
      const rec = await prisma.recurringExpense.findFirst({
        where: { id: recurringId, category: { userId: uid } },
      });
      if (rec) {
        const cat = parsed.data.categoryId ?? current.categoryId;
        if (cat !== rec.categoryId) {
          throw new HttpError(
            400,
            "categoryId must match recurring template category",
          );
        }
        if (!rec.isCommon) {
          const m = monthFromISODate(dateVal.toISOString().slice(0, 10));
          const { start, endExclusive } = monthUtcRange(m);
          const clash = await prisma.expense.findFirst({
            where: {
              recurringExpenseId: recurringId,
              date: { gte: start, lt: endExclusive },
              category: { userId: uid },
              NOT: { id: current.id },
            },
          });
          if (clash) {
            throw new HttpError(
              409,
              "Another expense already logs this recurring for that month",
            );
          }
        }
      }
    }

    const row = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name === null ? "" : parsed.data.name,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        date: nextDate ?? undefined,
        note: parsed.data.note === null ? null : parsed.data.note,
      },
      include: {
        category: { select: { id: true, name: true, isIncome: true } },
      },
    });
    res.json(mapExpense(row));
  } catch (e) {
    next(e);
  }
});

expensesRouter.delete("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const found = await prisma.expense.findFirst({
      where: { id: req.params.id, category: { userId: uid } },
    });
    if (!found) throw new HttpError(404, "Expense not found");
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
