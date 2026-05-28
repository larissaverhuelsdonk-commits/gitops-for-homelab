# Budget — API

Express 4 + TypeScript + Prisma + PostgreSQL. Entry: `src/index.ts`, app factory `src/app.ts`.

## Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev    # or migrate deploy in CI/prod
npm run dev               # tsx watch src/index.ts
npm run build && npm start # compile to dist/, run node dist/index.js
```

## Environment

- **`DATABASE_URL`** — required (PostgreSQL). With Docker Compose from the repo, Postgres is on host **5961**; use **`postgresql://postgres:postgres@localhost:5961/expenses`** in **`backend/.env`** for local `npm run dev`.

**Auth:** Users are created via **`POST /api/auth/signup`** (or the `/account` UI). Passwords are bcrypt-hashed in the database. No admin env vars.

**Overview:** **[`../README.md`](../README.md)** and **[`../docs/deployment.md`](../docs/deployment.md)**.

## Documentation

Schema and REST: **[`../docs/entities.md`](../docs/entities.md)**, **[`../docs/api.md`](../docs/api.md)**.
