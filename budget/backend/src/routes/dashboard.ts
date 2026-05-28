import { Router } from "express";
import { isValidMonth, monthUtcRange } from "../lib/dates.js";
import { prisma } from "../lib/prisma.js";
import { userId } from "../lib/userScope.js";
import { HttpError } from "../middleware/httpError.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    const month = req.query.month as string;
    if (!month || !isValidMonth(month)) {
      throw new HttpError(400, "Query month=YYYY-MM is required");
    }
    const { start, endExclusive } = monthUtcRange(month);

    await prisma.appSettings.upsert({
      where: { userId: uid },
      create: { userId: uid, currencyCode: "THB", domainName: "" },
      update: {},
    });
    const settings = await prisma.appSettings.findUniqueOrThrow({
      where: { userId: uid },
    });

    const categories = await prisma.category.findMany({
      where: { userId: uid },
      include: { budget: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const agg = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        date: { gte: start, lt: endExclusive },
        category: { userId: uid },
      },
      _sum: { amount: true },
    });
    const actualByCat = new Map(
      agg.map((a) => [a.categoryId, a._sum.amount?.toNumber() ?? 0]),
    );

    const daysInMonth: { date: string; total: number }[] = [];
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${month}-${String(d).padStart(2, "0")}`;
      daysInMonth.push({ date: ds, total: 0 });
    }

    const monthExpenses = await prisma.expense.findMany({
      where: {
        date: { gte: start, lt: endExclusive },
        category: { userId: uid, isIncome: false },
      },
      select: { date: true, amount: true },
    });
    const dailyMap = new Map<string, number>();
    for (const e of monthExpenses) {
      const key = e.date.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + e.amount.toNumber());
    }
    for (const slot of daysInMonth) {
      slot.total = dailyMap.get(slot.date) ?? 0;
    }

// -------- THIS CODE BELOW IS LOCKED AND CAN NOT BE EDITED UNLESS IT IS UNLOCKED BY THE USER -------------
    let totalBudget = 0;
    let totalActual = 0;
    let totalIncome = 0;
    const categoryRows = categories.map((c) => {
      const budget = c.budget?.monthlyAmount.toNumber() ?? 0;
      const actual = actualByCat.get(c.id) ?? 0;
      if (!c.isIncome) {
        totalBudget += budget;
        totalActual += actual;
      } else {
        totalIncome += actual;
      }
      const variancePercent =
        budget === 0 ? null : ((actual - budget) / budget) * 100;
      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        isIncome: c.isIncome,
        budget,
        actual,
        variancePercent,
      };
    });

    res.json({
      month,
      currencyCode: settings.currencyCode,
      categories: categoryRows.map((r) => ({
        ...r,
        budget: r.budget,
        actual: r.actual,
        variancePercent: r.variancePercent,
      })),
      dailySpend: daysInMonth.map((x) => ({
        date: x.date,
        total: x.total,
      })),
      totals: { budget: totalBudget, actual: totalActual, income: totalIncome },
    });
// ----------- THE CODE ABOVE IS LOCKED AND CAN NOT BE EDITED UNLESS IT IS UNLOCKED BY THE USER ------------
  } catch (e) {
    next(e);
  }
});
