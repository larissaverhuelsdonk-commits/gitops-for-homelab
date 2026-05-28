const rawBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * Build request URL. Paths in this app are always `/api/...`.
 * If `VITE_API_URL` is set to `https://host/api`, avoid `.../api/api/...`.
 */
function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (!rawBase) return path;
  if (rawBase.endsWith("/api") && path.startsWith("/api")) {
    return `${rawBase.slice(0, -4)}${path}`;
  }
  return `${rawBase}${path}`;
}

const cred: RequestInit = { credentials: "include" };

type ApiErrorBody = {
  error?: string;
  errors?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
};

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiErrorBody;
    const base = j.error ?? res.statusText;
    const fe = j.errors?.fieldErrors;
    if (fe) {
      const first = Object.values(fe).flat()[0];
      if (first) return `${base}: ${first}`;
    }
    const form = j.errors?.formErrors?.filter(Boolean);
    if (form?.length) return `${base}: ${form[0]}`;
    return base;
  } catch {
    return res.statusText;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(apiUrl(path), cred);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...cred,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export async function apiPostNoContent(path: string, body?: unknown): Promise<void> {
  const r = await fetch(apiUrl(path), {
    ...cred,
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await parseError(r));
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...cred,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...cred,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const r = await fetch(apiUrl(path), { ...cred, method: "DELETE" });
  if (!r.ok) throw new Error(await parseError(r));
}
