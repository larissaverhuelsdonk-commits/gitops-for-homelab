# Data entities

Multiple **User** rows are allowed. **`POST /api/auth/signup`** (UI: **`/account`**) inserts a row with **`passwordHash` = bcrypt** (cost 12); **`POST /api/auth/login`** loads the row and **`bcrypt.compare`**. Plain passwords are never stored. Each user has their own categories, settings, expenses, and sessions.

## User

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| username | String | Unique, stored lowercase |
| passwordHash | String | bcrypt hash only (see `backend/src/routes/auth.ts`) |
| role | String | Default "USER". First user to sign up becomes "ADMIN" |
| createdAt / updatedAt | DateTime | UTC |

## SystemSettings

Global configuration table.

| Field | Type | Description |
|-------|------|-------------|
| id | String | PK, always "1" |
| signupsEnabled | Boolean | Default true. Toggled by ADMIN |

## Session

Opaque **token** in httpOnly cookie (`budget_session`); row tracks expiry (30 days). Used to resolve `userId` on each API request. Sessions are removed on logout or expiry (or if the user row is deleted).

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| token | String | Unique random string |
| expiresAt | DateTime | UTC |

## AppSettings

One row per user (`userId` primary key).

| Field | Type | Description |
|-------|------|-------------|
| userId | String | PK, FK → User |
| currencyCode | String | ISO 4217; default **THB** |
| timeZone | String | IANA time zone; default **UTC** |
| domainName | String | Optional PWA / tunnel hint |

## Category

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | FK → User (scopes all child data) |
| name | String | Display name |
| color | String? | Optional hex for UI |
| sortOrder | Int | Display order (lower first) |
| isIncome | Boolean | Marks category as income; default `false` |
| createdAt | DateTime | UTC |

## CategoryBudget

One monthly budget cap per category (same amount every month). Actual spend for a calendar month is the sum of `Expense.amount` for that category with `date` in that month.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| categoryId | String | Unique FK → Category |
| monthlyAmount | Decimal | Budget per month (same currency as app) |

## Expense

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Short label |
| categoryId | String | FK → Category |
| amount | Decimal | Positive value; for income categories this is income amount, for non-income categories this is spend |
| date | Date | Calendar date only (no time); drives month grouping. Created using the user's `timeZone` |
| note | String? | Optional |
| recurringExpenseId | String? | If set, this expense is the logged payment for that recurring template in `date`’s month |
| recurringSubcategoryId | String? | If set, which **RecurringSubcategory** was chosen when logging (optional FK); expense **name** is copied from that subcategory at create time |
| createdAt | DateTime | UTC |

**Recurring completion:** For month `YYYY-MM`, recurring template `R` is completed if any expense exists with `recurringExpenseId = R.id` and `date` in that month.

## RecurringExpense

Template for a bill; does not store per-month state.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Label for dashboard button |
| categoryId | String | FK → Category |
| defaultAmount | Decimal? | Suggested amount when logging |
| isCommon | Boolean | If true, multiple expenses per month allowed |
| sortOrder | Int | Button order |
| createdAt | DateTime | UTC |

## RecurringSubcategory

Optional “breakdown” labels under a recurring template (e.g. store names **Villa**, **Tops** under **Shopping**). Managed in Settings with the template; when logging from the dashboard, the user picks one subcategory and the created **Expense.name** is that subcategory’s **name**.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| recurringExpenseId | String | FK → RecurringExpense (cascade delete) |
| name | String | Shown in picker; becomes expense name when selected |
| sortOrder | Int | Display order |
| createdAt | DateTime | UTC |

**Rules:** If a template has **one or more** subcategories, `POST /api/expenses` with `recurringExpenseId` **must** include `recurringSubcategoryId` matching a row for that template. Templates with **no** subcategories keep the previous behavior (`name` from client or template name). Replacing subcategories on `PATCH /api/recurring-expenses/:id` deletes old rows and recreates them; existing expenses keep their stored **name**; `recurringSubcategoryId` on old rows is set null if that subcategory row was removed (DB `ON DELETE SET NULL`).

## WishlistItem

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Item label |
| categoryId | String | FK → Category |
| amount | Decimal | Planned amount |
| note | String? | Optional |
| createdAt | DateTime | UTC |

Purchase flow: create an `Expense` with optional amount/date/note override, then **delete** the wishlist row.
