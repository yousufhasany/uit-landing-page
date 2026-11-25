/**
 * Thin fetch client. Auth lives in HttpOnly cookies; a 401 triggers one refresh attempt before failing.
 * On Vercel the browser calls the public `/api` rewrite. Leave `VITE_API_URL` empty so requests stay on this origin.
 * A service binding is not used here: bindings exist only inside server functions, not in the built site.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

/** Server errors are `{ error: { message, fields } }`; rate limiters send `{ error: "…" }`. */
function toApiError(status: number, data: Record<string, unknown>, fallback: string) {
  const err = data.error as { message?: string; fields?: Record<string, string> } | string | undefined;
  if (typeof err === 'string') return new ApiError(status, err);
  return new ApiError(status, err?.message ?? fallback, err?.fields ?? {});
}

export function qs(query?: Query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : '';
}

let refreshing: Promise<boolean> | null = null;
async function refresh() {
  refreshing ??= fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refreshing = null), 0));
  return refreshing;
}

interface Options {
  method?: string;
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  retry?: boolean;
}

export async function api<T>(path: string, { method = 'GET', body, query, signal, retry = true }: Options = {}): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`${BASE}/api${path}${qs(query)}`, {
    method,
    credentials: 'include',
    signal,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refresh()) return api<T>(path, { method, body, query, signal, retry: false });
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw toApiError(res.status, data, `Request failed (${res.status})`);
  return data as T;
}

/** Upload with progress events (fetch has no upload progress). */
export async function uploadWithProgress<T>(path: string, form: FormData, onProgress: (pct: number) => void): Promise<T> {
  try {
    return await xhrUpload<T>(path, form, onProgress);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && (await refresh())) return xhrUpload<T>(path, form, onProgress);
    throw e;
  }
}

function xhrUpload<T>(path: string, form: FormData, onProgress: (pct: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/api${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* empty */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else if (xhr.status === 400 && Array.isArray(data.errors)) resolve(data as T);
      else reject(toApiError(xhr.status, data, 'Upload failed'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));
    xhr.send(form);
  });
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
