const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface HttpError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized | null = null;

/** Registra una función global que se invoca cuando cualquier request devuelve 401. */
export function setOnUnauthorized(handler: OnUnauthorized | null): void {
  onUnauthorized = handler;
}

/** True si esa petición no debe disparar el handler global (ej. /me cuando exploramos sesión). */
function isSilent401Path(path: string): boolean {
  return path === '/api/auth/me' || path === '/api/auth/refresh' || path === '/api/auth/logout';
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401 && !isSilent401Path(path) && onUnauthorized) {
      onUnauthorized();
    }
    const err: HttpError = {
      status: res.status,
      code: body?.error?.code ?? 'UNKNOWN',
      message: body?.error?.message ?? res.statusText,
      details: body?.error?.details,
    };
    throw err;
  }

  return body as T;
}
