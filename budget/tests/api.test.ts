import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../backend/src/app.js";

const prisma = new PrismaClient();
const app = createApp();

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.recurringSubcategory.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.categoryBudget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.user.deleteMany();
}

describe("API integration", () => {
  let agent: request.Agent;

  beforeEach(async () => {
    await resetDb();
    agent = request.agent(app);
    await agent
      .post("/api/auth/signup")
      .send({ username: "testuser", password: "password123" })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates category, budget, expense and returns dashboard aggregates", async () => {
    const cat = await agent.post("/api/categories").send({ name: "Food" }).expect(201);
    const id = cat.body.id as string;

    await agent.put(`/api/categories/${id}/budget`).send({ monthlyAmount: 1000 }).expect(200);

    await agent
      .post("/api/expenses")
      .send({
        name: "lunch",
        categoryId: id,
        amount: 250,
        date: "2026-03-15",
        note: "lunch",
      })
      .expect(201);

    const dash = await agent.get("/api/dashboard?month=2026-03").expect(200);
    expect(dash.body.totals.actual).toBe(250);
    expect(dash.body.totals.budget).toBe(1000);
    const row = dash.body.categories.find(
      (c: { categoryId: string }) => c.categoryId === id
    );
    expect(row.actual).toBe(250);
    expect(row.budget).toBe(1000);
  });

  it("rejects duplicate recurring payment in same month", async () => {
    const cat = await agent.post("/api/categories").send({ name: "Bills" }).expect(201);
    const cid = cat.body.id as string;

    const rec = await agent
      .post("/api/recurring-expenses")
      .send({ name: "Rent", categoryId: cid, defaultAmount: 500 })
      .expect(201);
    const rid = rec.body.id as string;

    await agent
      .post("/api/expenses")
      .send({
        name: "Rent",
        categoryId: cid,
        amount: 500,
        date: "2026-03-01",
        recurringExpenseId: rid,
      })
      .expect(201);

    const dup = await agent
      .post("/api/expenses")
      .send({
        name: "Rent",
        categoryId: cid,
        amount: 510,
        date: "2026-03-20",
        recurringExpenseId: rid,
      })
      .expect(409);
    expect(dup.body.error).toBeTruthy();
  });

  it("wishlist purchase creates expense and removes item", async () => {
    const cat = await agent.post("/api/categories").send({ name: "Fun" }).expect(201);
    const cid = cat.body.id as string;

    const wl = await agent
      .post("/api/wishlist")
      .send({ name: "Game", categoryId: cid, amount: 60 })
      .expect(201);
    const wid = wl.body.id as string;

    const pur = await agent
      .post(`/api/wishlist/${wid}/purchase`)
      .send({ amount: 55, date: "2026-03-10" })
      .expect(201);
    expect(pur.body.expense.amount).toBe("55");

    const list = await agent.get("/api/wishlist").expect(200);
    expect(list.body).toHaveLength(0);

    const ex = await agent.get("/api/expenses?month=2026-03").expect(200);
    expect(ex.body).toHaveLength(1);
    expect(ex.body[0].amount).toBe("55");
  });

  it("returns 401 for protected routes without session", async () => {
    await resetDb();
    await request(app).get("/api/categories").expect(401);
  });

  it("rejects duplicate signup username", async () => {
    await resetDb();
    const a = request.agent(app);
    await a.post("/api/auth/signup").send({ username: "dup", password: "password12" }).expect(201);
    const dup = await request(app)
      .post("/api/auth/signup")
      .send({ username: "dup", password: "password12" })
      .expect(409);
    expect(dup.body.error).toBeTruthy();
  });

  it("requires recurring subcategory when template defines subcategories", async () => {
    const cat = await agent.post("/api/categories").send({ name: "Food" }).expect(201);
    const cid = cat.body.id as string;

    const rec = await agent
      .post("/api/recurring-expenses")
      .send({
        name: "Shopping",
        categoryId: cid,
        subcategories: [{ name: "Villa" }, { name: "Tops" }],
      })
      .expect(201);
    const rid = rec.body.id as string;
    const subVilla = (rec.body.subcategories as { id: string; name: string }[]).find(
      (s) => s.name === "Villa"
    );
    expect(subVilla).toBeTruthy();

    const missing = await agent
      .post("/api/expenses")
      .send({
        name: "ignored",
        categoryId: cid,
        amount: 100,
        date: "2026-03-05",
        recurringExpenseId: rid,
      })
      .expect(400);
    expect(missing.body.error).toContain("subcategory");

    const ok = await agent
      .post("/api/expenses")
      .send({
        categoryId: cid,
        amount: 250,
        date: "2026-03-05",
        recurringExpenseId: rid,
        recurringSubcategoryId: subVilla!.id,
      })
      .expect(201);
    expect(ok.body.name).toBe("Villa");
    expect(ok.body.recurringSubcategoryId).toBe(subVilla!.id);
  });
});
