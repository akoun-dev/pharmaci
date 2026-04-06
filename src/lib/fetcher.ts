/**
 * API fetcher utility that includes credentials for cookies.
 * Use this for all authenticated API requests.
 */
export async function fetcher(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

/**
 * Convenience wrapper that parses JSON response.
 */
export async function fetcherJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetcher(input, init);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || 'Erreur réseau');
  }
  return res.json() as Promise<T>;
}
