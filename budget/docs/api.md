# HTTP API

Base path: `/api`. JSON bodies and responses unless noted.

**Health (no auth):** `GET /health` → `{ ok: true }` (root server path, not under `/api`).

**Authentication:** Session cookie `budget_session` (httpOnly, `SameSite=Lax`; `Secure` when the request is HTTPS / `req.secure`). All routes except public `/api/auth/*` handlers require a valid session. The SPA sends `credentials: "include"` on `fetch`.

**CORS:** API uses `credentials: true` and reflected `Origin` so cookies work when frontend and API are on different origins during dev.

## Errors

- `400` — validation error; body `{ "error": string }` or `{ "errors": Record<string, string[]> }`
- `401` — not authenticated (missing/invalid session)
- `404` — resource not found
- `409` — conflict (e.g. username taken on signup, duplicate recurring payment for same month)

## Auth

Users are stored in PostgreSQL with **bcrypt** password hashes. There is **no** `POST /api/auth/change-password` in the API yet. The first user to sign up automatically gets the `ADMIN` role, subsequent users get `USER`.

- `GET /api/auth/me` — `{ user: { id, username, role } | null }` (no cookie → `user: null`)
- `POST /api/auth/signup` body `{ username, password }` — username 3–64 chars `[a-zA-Z0-9_-]+`, password 8–128 chars; `201` + `Set-Cookie` + `{ user: { id, username, role } }`; `409` if username already taken; `403` if signups are disabled (unless it's the first user).
- `POST /api/auth/login` body `{ username, password }` — `200` + `Set-Cookie` + `{ user: { id, username, role } }`; `401` if invalid
- `POST /api/auth/logout` — clears server session + cookie; `204`

## System settings

Global configuration, editable only by `ADMIN` users.

- `GET /api/system-settings` (public) → `{ signupsEnabled: boolean }`
- `PUT /api/system-settings` (protected, requires `ADMIN` role) body `{ signupsEnabled: boolean }` → updated setting object

## App settings

- `GET /api/app-settings` → `{ userId, currencyCode, timeZone, domainName }`
- `PATCH /api/app-settings` body `{ currencyCode?, timeZone?, domainName? }` → updated row (`timeZone`: IANA name, e.g. `Asia/Bangkok`)

## Categories

- `GET /api/categories` → array of `{ id, name, color, sortOrder, isIncome, createdAt, budget: { monthlyAmount } | null }`
- `POST /api/categories` body `{ name, color?, sortOrder? }` → category (budget null until set)
- `PATCH /api/categories/:id` body partial `{ name?, color?, sortOrder? }`
- `DELETE /api/categories/:id` — fails if referenced (409/400) or cascade per implementation (plan: prevent delete if expenses exist)

## Category budget

- `PUT /api/categories/:id/budget` body `{ monthlyAmount: number }` — upsert budget for category

## Expenses

- `GET /api/expenses?month=YYYY-MM` — expenses in that month, ordered by `date` desc, then `createdAt` desc. Each item includes `category: { id, name, isIncome }`, `recurringSubcategoryId` (nullable).
- `GET /api/expenses/:id` — single expense with category
- `POST /api/expenses` body:
  - `categoryId`, `amount`, `date` (ISO date string `YYYY-MM-DD`), `name?`, `note?`
  - `recurringExpenseId?` — if set, `date` must fall in one month; **at most one** expense per `(recurringExpenseId, calendar month)` unless template `isCommon`; `categoryId` must match template’s category
  - `recurringSubcategoryId?` — if the template has **subcategories**, **required** and must belong to that template; server sets **name** from the subcategory. If the template has **no** subcategories, omit this; use `name` (or server defaults to template name). If set without `recurringExpenseId`, `400`.
- `PATCH /api/expenses/:id` body partial `{ categoryId?, amount?, date?, name?, note? }` — if changing `recurringExpenseId` month conflict, reject 409
- `DELETE /api/expenses/:id`

## Recurring expense templates

- `GET /api/recurring-expenses` — all templates with `category` and `subcategories: [{ id, name, sortOrder }]`
- `POST /api/recurring-expenses` body `{ name, categoryId, defaultAmount?, isCommon?, sortOrder?, subcategories?: [{ name, sortOrder? }] }`
- `PATCH /api/recurring-expenses/:id` partial `{ name?, categoryId?, defaultAmount?, isCommon?, sortOrder?, subcategories?: [{ name, sortOrder? }] }` — if `subcategories` is present, it **replaces** all subcategories for that template (omit field to leave unchanged)
- `DELETE /api/recurring-expenses/:id`

### Status for dashboard

- `GET /api/recurring-expenses/status?month=YYYY-MM` → array of `{ id, name, categoryId, defaultAmount, sortOrder, category, subcategories, completed: boolean }`

## Wishlist

- `GET /api/wishlist` — items with `category`
- `POST /api/wishlist` body `{ name, categoryId, amount, note? }`
- `PATCH /api/wishlist/:id` partial `{ name?, categoryId?, amount?, note? }`
- `DELETE /api/wishlist/:id`
- `POST /api/wishlist/:id/purchase` body `{ amount: number, date?: string (YYYY-MM-DD), note?: string }` — creates expense (defaults: today, note from item if not provided), deletes wishlist item → `{ expense }`

## Dashboard aggregate

- `GET /api/dashboard?month=YYYY-MM` →

```json
{
  "month": "YYYY-MM",
  "currencyCode": "THB",
  "categories": [
    {
      "categoryId": "",
      "name": "",
      "color": null,
      "isIncome": false,
      "budget": 0,
      "actual": 0,
      "variancePercent": null
    }
  ],
  "dailySpend": [{ "date": "YYYY-MM-DD", "total": 0 }],
  "totals": { "budget": 0, "actual": 0, "income": 0 }
}
```

- `variancePercent`: `null` if budget is 0; else `((actual - budget) / budget) * 100`.
- `totals.actual`: sum of non-income category spend for the month.
- `totals.budget`: sum of non-income category budgets.
- `totals.income`: sum of category totals where `category.isIncome = true`.
- `dailySpend`: excludes income-category entries and only plots non-income spend.

## Month validation

Query/body months and dates: `month` must match `^\d{4}-\d{2}$`; expense `date` is `YYYY-MM-DD`.
