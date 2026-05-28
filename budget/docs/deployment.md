# Deployment and local development

## Compose files and git

- **[`docker-compose.yml`](../docker-compose.yml)** is **tracked** in git so installs and contributors share the same stacks.
- **`docker-compose.override.yml`** is **gitignored**. If you need machine-only ports or env, add that file next to `docker-compose.yml`; Compose loads it automatically when present ([Docker Compose merge](https://docs.docker.com/compose/how-tos/multiple-compose-files/)).

## Authentication

- **Sign up and sign in** in the UI at **`/account`** (`POST /api/auth/signup`, `POST /api/auth/login`). Users and **bcrypt** password hashes live in PostgreSQL. There is **no** env-based admin user and **no** API password-change flow yet.
- **`npm run db:seed`** runs an empty seed (no default users).
- **Sessions:** `budget_session` cookie; logout clears the server row and cookie.
- **Storage:** Prisma model **`User`** (`username`, **`passwordHash`** — never plaintext). Signup runs **`bcrypt.hash(..., 12)`**; login uses **`bcrypt.compare`**.

**Quick API check** (stack running, replace host/port if needed):

```bash
curl -sS -c /tmp/budget-cookies.txt -X POST http://localhost:8081/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo_user","password":"password12"}'
curl -sS -b /tmp/budget-cookies.txt http://localhost:8081/api/auth/me
```

Then **`SELECT username, length("passwordHash") FROM "User";`** in Postgres — `passwordHash` should be a long bcrypt string, not the plain password.

## Environment

The **`api`** service does **not** require a root `.env` file. **`DATABASE_URL`** for Docker is set in [`docker-compose.yml`](../docker-compose.yml).

- **`DATABASE_URL` (Docker Compose):** On the **`api`** service: `postgresql://postgres:postgres@db:5432/expenses`. Always use **`db:5432`** here — that is the **container** port. The host maps Postgres to **`5961`** (`5961:5432`); do **not** put `5961` or `5433` in `DATABASE_URL` for the API container.
- **`DATABASE_URL` (API on your machine):** If you run **`npm run dev`** in **`backend/`** with Postgres from Compose on the host, use **`postgresql://postgres:postgres@localhost:5961/expenses`** in **`backend/.env`**.
- **Frontend build:** `VITE_API_URL` — **Recommended: leave unset** so the browser calls `/api/...` on the same host as the SPA (nginx proxies to Node). If you set it, use **origin only** (`https://budget.example.com`) or origin + `/api` — the client strips a duplicate `/api` if both base and path include it.

## Docker Compose (production / public release)

Default **[`docker-compose.yml`](../docker-compose.yml)**:

- **`web`:** Built SPA + nginx. Host **`8081` → container `80`**. **`/api`** proxied to **`api`** ([`frontend/nginx.conf`](../frontend/nginx.conf)).
- **`api`:** Compiled Node (`runner`). Entrypoint runs **`npx prisma migrate deploy`**, then **`node dist/index.js`**.
- **`db`:** Postgres 16, volume **`pgdata`**. Host port **`5961` → container `5432`**.


From repo root:

```bash
docker compose up --build
```

Open **http://localhost:8081/account**, **Sign up** for the first user, then use the app.

**Hardening:** Comment out **`5961:5432`** on **`db`** if you do not need host access to Postgres. Point reverse proxies at **`8081`**. Do not publish the API port unless intentional; nginx uses **`api:4000`** on the internal network.

## Local development (hot reload)

1. **`docker compose up db`** (or full stack) so Postgres listens on **`localhost:5961`**.
2. **`cd backend`**: create a **`backend/.env`** with `DATABASE_URL="postgresql://postgres:postgres@localhost:5961/expenses"`, then `npm install`, `npx prisma migrate dev`, `npm run dev`.
3. **`cd frontend`**: `npm install && npm run dev` — Vite proxies `/api` to the backend.

## Production: 502 / 404 on `/api/auth/*`

| Symptom | Likely cause |
|--------|----------------|
| **502** on `GET /api/auth/me` | Nginx cannot reach the API (`proxy_pass`, network, API down). |
| **404** on `POST /api/auth/login` or **signup** | Request not proxied to Express (static `try_files` / `index.html`). |
| **401** on login | Wrong username/password, or user never created (use **Sign up** first). |
| **P1001** in API logs | Wrong `DATABASE_URL` (e.g. `db:5961` or `db:5433` instead of **`db:5432`**). |

**Checklist**

1. `curl -sS http://127.0.0.1:4000/health` from inside the API container or host where API listens → `{ "ok": true }`.
2. Through nginx: `curl` signup or login with JSON body; expect `Set-Cookie`, not HTML 404.

## `scripts/` and `tests/` (not in git)

Root [`.gitignore`](../.gitignore) excludes **`scripts/`** and **`tests/`**. Nothing under those paths is tracked.

