# Documentation index

Source of truth for behavior beyond inline code. Update these when you change APIs, schema, routes, deployment, or auth.

## Authentication model

**Sign up / sign in** in the app (`/account`); users and bcrypt hashes are stored in PostgreSQL. Session cookie **`budget_session`**. See **[`api.md`](api.md)** (auth routes) and **[`deployment.md`](deployment.md)** (Docker, `DATABASE_URL`, Postgres host port **5961**).

| Document | Contents |
|----------|----------|
| [api.md](api.md) | REST routes, **auth** (`/me`, `signup`, `login`, `logout`), request/response shapes, errors |
| [entities.md](entities.md) | Prisma models: **User**, **Session**, **AppSettings**, **Category**, **CategoryBudget**, **Expense**, **RecurringExpense**, **RecurringSubcategory**, **WishlistItem** |
| [ui-pages.md](ui-pages.md) | Frontend routes, PWA/install, **dashboard category pie drill-down**, recurring subcategories, Settings composition |
| [deployment.md](deployment.md) | Docker Compose, **env vars**, migrations, reverse proxies, troubleshooting |

**Root [README.md](../README.md)** — authentication overview, features, quick start, project layout, production checklist.

**Package readmes:** [frontend/README.md](../frontend/README.md) (Vite dev/build), [backend/README.md](../backend/README.md) (Prisma, `npm` scripts, env).

**Supply chain:** [security.md](security.md) (axios advisory, this repo’s stance, `overrides`).
