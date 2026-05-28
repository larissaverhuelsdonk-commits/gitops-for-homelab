# UI routes and API usage

## Branding and installable web app

- **Product name:** Budget — lightweight spend tracker (ease of use).
- **Static assets:** `frontend/public/img/icon.png` — favicon and `apple-touch-icon`. **PWA manifest** uses `icon-192.png` and `icon-512.png` (exact pixel sizes); regenerate those files after changing `icon.png` (image editor or a local script). Mismatched manifest `sizes` vs real image dimensions break Chromium installability (`beforeinstallprompt` may never fire).
- **Metadata:** `frontend/index.html` sets title, description, theme color, and Apple / mobile web-app meta tags for “Add to Home Screen”.
- **Manifest:** `frontend/public/manifest.webmanifest` — stable `id`, `standalone` display, `start_url` `/`, icons as above.
- **Minimal service worker:** `frontend/public/sw.js` — `install`/`activate` + `fetch` that always uses the network (**no caching**). Registered from `main.tsx` via `registerServiceWorker()` in `frontend/src/lib/pwa.ts` (early `DOMContentLoaded` registration, `updateViaCache: "none"`). **Secure context required:** `https://`, `http://localhost`, or `http://127.0.0.1`. Plain `http://` on a LAN IP often cannot register a service worker, so install prompts will not appear.
- **Offline UX:** `AppLayout` listens for `online`/`offline` and shows a non-blocking banner (`isOffline()` in `pwa.ts`) explaining that a connection is required; API data is not available offline.
- **PWA install UX:** `PwaInstallBanner` — Chromium: listens for `beforeinstallprompt` and shows **Install**; if that event does not fire (~4.5s), shows menu-based instructions. **Firefox** does not support `beforeinstallprompt`; banner explains **menu → Install**. iOS Safari: “Add to Home Screen” tip. All hidden in standalone / installed mode; `appinstalled` clears the deferred prompt state.

Shared **month** state (URL query `?month=YYYY-MM` or React context synced with URL) for Dashboard and Expenses. The sticky header **`MonthStrip`** (`frontend/src/components/MonthStrip.tsx`) shows **‹** / **›** and a label like **March - 2026** via `formatMonthDisplay()` in `frontend/src/lib/month.ts` (UTC). When the selected month is not the current calendar month (`currentMonthUTC()`), a **This month** control appears under the label to reset `?month` to the present month.

| Route | Page | API calls |
|-------|------|-----------|
| `/` | Dashboard | `GET /api/dashboard?month`, `GET /api/recurring-expenses/status?month`, `GET /api/expenses?month`, `GET /api/categories`, `POST /api/expenses` (quick-add + recurring log), `GET /api/app-settings` (currency display) |
| `/expenses` | Expenses | `GET /api/expenses?month`, `PATCH/DELETE /api/expenses/:id`, month selector; **Del** opens **`DeleteExpenseConfirmModal`** (name, amount, category; Cancel / Delete; backdrop or Esc closes) |
| `/wishlist` | Wishlist | `GET /api/wishlist`, `POST /api/wishlist`, `PATCH/DELETE /api/wishlist/:id`, `POST /api/wishlist/:id/purchase`, `GET /api/categories`, `GET /api/app-settings` |
| `/settings` | Settings | `GET/PATCH /api/app-settings`, `GET/POST/PATCH/DELETE /api/categories`, `PUT /api/categories/:id/budget`, `GET/POST/PATCH/DELETE /api/recurring-expenses` |
| `/account` | Sign up / sign in (no nav link) | `GET /api/auth/me` on app load; `POST /api/auth/signup` or `POST /api/auth/login`. Logged-in visits redirect to `/`. **Log out** under **Settings → Account**. |

**Settings composition:** `frontend/src/pages/SettingsPage.tsx` loads data and handlers; **Account** (username, log out) in `frontend/src/settings/SettingsAccountSection.tsx`; **Categories** in `frontend/src/settings/SettingsCategoriesSection.tsx`; **Recurring** in `frontend/src/settings/SettingsRecurringSection.tsx` (optional **subcategories** textarea when adding a template; per-template **Subs** editor in `frontend/src/settings/RecurringTemplateRow.tsx` → `PATCH /api/recurring-expenses/:id` with `subcategories`). Currency options come from `frontend/src/settings/currencies.ts`.

- **Settings ordering rules:** In Settings, category lists are deterministic: the income category is pinned to the top, and all remaining categories are sorted A-Z. Recurring templates are shown with all income templates first (A-Z), followed by expense templates (A-Z).

**Dashboard recurring:** `frontend/src/dashboard/RecurringSection.tsx` — if a template has subcategories, the log modal shows a **Subcategory** `<select>` before amount; `POST /api/expenses` sends `recurringSubcategoryId` so the expense **name** is the chosen subcategory (e.g. **Villa**).

**Dashboard category pie (`DashboardExpenseList`):** The **This month** card shows a left-aligned list and a solid pie on the right. The list displays color swatch, name, and amount (plain number formatting, no currency symbol). The pie has no connector lines, no slice labels, and no on-chart percentages. Tap a **category row** or **pie slice** to drill into **labels** (aggregated **expense `name`** for that category in the selected month). In drill mode, a dedicated **← Back** control appears above the left-side subcategory label (not in the subheading line) to avoid layout shift in the header area. Each drill row still shows amount and percent share for the selected category.

**Auth:** `frontend/src/context/AuthContext.tsx` loads `/api/auth/me` on startup. `RequireAuth` wraps the main shell (`AppShell` = `CurrencyProvider` + `MonthProvider` + `AppLayout`). Unauthenticated users are redirected to `/account`.

**Bottom navigation:** Four tabs — Home, Expenses, Wishlist, Settings (no separate Account tab; account actions are under **Settings**).

## Responsive notes (Expenses list)

- Expense list items use a compact row layout. They feature truncated expense names and categories, with Edit and Del actions on a single line. The date pill is included inline. Notes are truncated to a single line directly beneath the main row content.

## Responsive notes (Settings categories)

- Each category is a **single horizontal row**: fixed-width truncated name, flexible budget input, compact Save / Del actions (no wrapping).

## Responsive notes (Wishlist items)

- Wishlist items use a compact row layout similar to recurring templates. They feature truncated item names and categories, with Buy and Del actions on a single line. Notes are truncated to a single line directly beneath the main row content.

## Dashboard UX

- Recurring/Common buttons (`frontend/src/dashboard/RecurringSection.tsx`):
  - Month label is hidden.
  - "Common" items are always displayed at the top, alphabetically sorted A-Z.
  - "Uncommon" (regular recurring) items are displayed below common items, separated by a thin dividing line (only visible if both common and uncommon items exist in the view), alphabetically sorted A-Z.
  - Labels on items: "Common" labels denote general usage; however, if the item represents an income category, the label displays as "Income" instead of "Common".
  - Show only **incomplete** for selected month by default (unless marked as Common, which are always visible); toggle **Show hidden** reveals completed items for review.
- Quick-add: pick category (button), amount, optional note; date defaults to today.
- Month overview card (`frontend/src/dashboard/DashboardSummary.tsx`): two bars are shown:
  - **Actual vs Budget** (orange actual, green remaining, red overspend).
  - **Income vs Saved** (grey spent, black lost savings from overspend, blue remaining saved).
  - Values are displayed as plain numbers (no currency symbol), using grouped thousands and 2 decimals.
  - A moving separator line marks the boundary.
- Daily spend chart (`frontend/src/dashboard/DailySpendChart.tsx`):
  - On mobile, selecting/activating a bar must never render a browser focus border or stroke outline.
  - Active bars are highlighted by fill-color change only.

## Month Overview Documentation

The Month Overview component (`frontend/src/dashboard/DashboardSummary.tsx`) provides a dual-bar visualization comparing spending against the budget, and income against the amount saved.

### Expected Behaviors

#### Top Bar (Actual vs Budget)
- **Labels:** ACTUAL (top) and BUDGET (bottom).
- **Segments:**
  - **Actual Spend:** Amber (`bg-amber-400`). Represents the current recorded spend, capped visually at the budget amount.
  - **Remaining Budget:** Emerald (`bg-emerald-400`). Represents the remaining available budget. Shrinks as actual spend increases.
  - **Overspend:** Red (`bg-red-500`). Represents any spend beyond the budget.
- **Overspend Behavior:**
  - The vertical separator moves past the budget boundary.
  - The BUDGET label value text turns red.
- **Connectors:** A grey horizontal connector line extends from the top "ACTUAL" label to perfectly align with the vertical bar separator.

#### Bottom Bar (Income vs Saved)
- **Labels:** INCOME (top) and SAVED (bottom).
- **Calculation:** Saved = Income - Actual Spend.
- **Segments:**
  - **Spent Income:** Grey (`bg-slate-500`). Represents the portion of income consumed by normal spending (up to the budget limit).
  - **Lost Savings:** Black (`bg-slate-900`). Represents savings lost due to overspending (actual spend beyond the budget).
  - **Remaining Saved:** Blue (`bg-blue-600`). Represents unspent income.
- **Connectors:** A grey horizontal connector line extends from the bottom "SAVED" label to perfectly align with the vertical bar separator.

### Edge Cases Handled
- **No spend yet:** Actual/Spent segments collapse to 0. Bars show full Emerald (Budget) and full Blue (Income).
- **Spend below budget:** Standard behavior.
- **Spend exactly equal to budget:** Emerald segment collapses to 0.
- **Spend above budget:** Overspend kicks in (Red on top, Black on bottom).
- **Income entered as zero:** Bar segments scale proportionately against the overall maximum value across Actual/Budget/Income, preventing layout breaks.
- **Saved value becoming zero or negative:** Blue segment collapses to 0.

### Technical Implementation Notes
- **Scaling:** A single `scaleMax` (`Math.max(budget, actual, income, 1)`) is calculated so both bars share the exact same proportional width scaling.
- **Alignment:** The layout uses absolute positioning layers within a `relative` container to ensure the bar stretches `100%` across the card underneath the label text, creating the visual "cutout" effect using a `z-10 bg-white` text wrapper.
