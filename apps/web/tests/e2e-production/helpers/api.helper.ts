/**
 * Lightweight fetch() wrapper for test setup / teardown.
 * Calls the real production API — NO mocking.
 * Includes retry logic for transient 502/503 errors.
 */

const API_BASE = process.env.PROD_API_URL || 'http://89.108.66.37/api/v1';

interface ApiResult {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
  meta?: { page: number; limit: number; total: number };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  retries = 3
): Promise<ApiResult> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Retry on 502/503 (transient server errors)
      if ((res.status === 502 || res.status === 503) && attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await res.json()) as ApiResult;
      }

      return {
        success: res.ok,
        data: await res.text(),
      };
    } catch (err) {
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error(`apiFetch failed after ${retries + 1} attempts`);
}

export function apiGet(path: string, token?: string): Promise<ApiResult> {
  return apiFetch('GET', path, undefined, token);
}

export function apiPost(
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResult> {
  return apiFetch('POST', path, body, token);
}

export function apiPatch(
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResult> {
  return apiFetch('PATCH', path, body, token);
}

export function apiDelete(path: string, token?: string): Promise<ApiResult> {
  return apiFetch('DELETE', path, undefined, token);
}
