'use client';

const PUBLIC_BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';

interface ClientFetchOptions {
  cache?: RequestCache;
  timeout?: number;
}

export class BFFError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `BFF error: ${status} ${statusText}`);
    this.name = 'BFFError';
  }
}

export async function clientFetch<T>(
  path: string,
  options: ClientFetchOptions = {}
): Promise<T> {
  const { cache = 'no-store', timeout = 10000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${PUBLIC_BFF_URL}${path}`, {
      cache,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Attempt to extract error message from response
      let errorMessage = `BFF error: ${res.status} ${res.statusText}`;
      try {
        const errorBody = await res.json();
        if (errorBody.error || errorBody.message) {
          errorMessage = errorBody.error || errorBody.message;
        }
      } catch {
        // Failed to parse error body, use default message
      }

      throw new BFFError(res.status, res.statusText, errorMessage);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof BFFError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout: BFF took too long to respond');
    }

    // Network error or CORS issue
    throw new Error('Network error: Unable to reach BFF');
  }
}
