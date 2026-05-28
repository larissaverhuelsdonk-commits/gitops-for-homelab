import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { dec } from "../lib/serialize.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  color: z.string().max(32).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const patchSchema = createSchema.partial();

const budgetSchema = z.object({
  monthlyAmount: z.coerce.number().nonnegative(),
});

export const categoriesRouter = Router();

type CatRow = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  isIncome: boolean;
  createdAt: Date;
  budget: { monthlyAmount: { toString(): string } } | null;
};

function mapCategory(c: CatRow) {
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    sortOrder: c.sortOrder,
    isIncome: c.isIncome,
    createdAt: c.createdAt,
    budget: c.budget ? { monthlyAmount: dec(c.budget.monthlyAmount) } : null,
  };
}

categoriesRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    let rows = await prisma.category.findMany({
      where: { userId: uid },
      include: { budget: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const hasIncome = rows.some((r) => r.isIncome);
    if (!hasIncome) {
      const incomeCategory = await prisma.category.create({
        data: {
          name: "Income",
          isIncome: true,
          userId: uid,
        },
        include: { budget: true },
      });
      rows.push(incomeCategory);
    }

    res.json(rows.map((r) => mapCategory(r)));
  } catch (e) {
    next(e);
  }
});

categoriesRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const uid = userId(req);
    const c = await prisma.category.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color ?? undefined,
        sortOrder: parsed.data.sortOrder ?? 0,
        userId: uid,
      },
      include: { budget: true },
    });
    res.status(201).json(mapCategory(c));
  } catch (e) {
    next(e);
  }
});

categoriesRouter.put("/:id/budget", async (req, res, next) => {
  try {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const uid = userId(req);
    await prisma.category.findFirstOrThrow({
      where: { id: req.params.id, userId: uid },
    });
    const b = await prisma.categoryBudget.upsert({
      where: { categoryId: req.params.id },
      create: {
        categoryId: req.params.id,
        monthlyAmount: parsed.data.monthlyAmount,
      },
      update: { monthlyAmount: parsed.data.monthlyAmount },
    });
    res.json({ categoryId: b.categoryId, monthlyAmount: dec(b.monthlyAmount) });
  } catch (e) {
    next(e);
  }
});

categoriesRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", {
        errors: parsed.error.flatten(),
      });
    }
    const uid = userId(req);
    const found = await prisma.category.findFirst({
      where: { id: req.params.id, userId: uid },
    });
    if (!found) throw new HttpError(404, "Category not found");
    const c = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        color: parsed.data.color === null ? null : parsed.data.color,
      },
      include: { budget: true },
    });
    res.json(mapCategory(c));
  } catch (e) {
    next(e);
  }
});

categoriesRouter.delete("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    const cat = await prisma.category.findFirst({
      where: { id: req.params.id, userId: uid },
    });
    if (!cat) throw new HttpError(404, "Category not found");
    const count = await prisma.expense.count({
      where: { categoryId: req.params.id },
    });
    if (count > 0) {
      throw new HttpError(
        409,
        "Category has expenses; reassign or delete expenses first",
      );
    }
    const rec = await prisma.recurringExpense.count({
      where: { categoryId: req.params.id },
    });
    if (rec > 0) {
      throw new HttpError(409, "Category is used by recurring expenses");
    }
    const wl = await prisma.wishlistItem.count({
      where: { categoryId: req.params.id },
    });
    if (wl > 0) {
      throw new HttpError(409, "Category is used by wishlist items");
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
