/**
 * API fetcher utility that includes credentials for cookies.
 * Use this for all authenticated API requests.
 */
export async function fetcher(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Try to get the token from the store for Authorization header fallback
  let authHeader = init?.headers as Record<string, string> | undefined;

  // Only try to access store in client-side context
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid SSR issues
      const { useAppStore } = await import('@/store/app-store');
      const token = useAppStore.getState().authToken;

      if (token && !authHeader?.['Authorization']) {
        authHeader = {
          ...authHeader,
          'Authorization': `Bearer ${token}`,
        };
      }
    } catch {
      // Ignore store access errors
    }
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
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
