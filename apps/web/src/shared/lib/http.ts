const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface HttpError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
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
