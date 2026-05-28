# Budget — frontend

Vite + React 19 + TypeScript + Tailwind CSS v4. Entry: `src/main.tsx`, app routes in `src/App.tsx`.

## Dev

```bash
npm install
npm run dev
```

Default dev server: `http://localhost:5173` (or the port Vite prints). With **Docker Compose**, the `web` service runs on host **8081** and proxies `/api` to the backend (`API_URL`).

## Build

```bash
npm run build
```

Output: `dist/` — static assets plus `manifest.webmanifest` and `sw.js` copied from `public/`.

## Auth in the browser

**`/account`** — sign up or sign in. API calls use **`credentials: "include"`** for the **`budget_session`** cookie. See root **[`../README.md`](../README.md)** and **[`../docs/api.md`](../docs/api.md)**.

## Project docs

Product, API, and deployment documentation live in the repo root **[`../README.md`](../README.md)** and **[`../docs/`](../docs/)** — not in this folder.
