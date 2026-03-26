const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export { API_BASE };

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
  });

  if (res.status === 401) {
    // Try refreshing the access token
    const refresh = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refresh.ok) {
      // Retry the original request with the new token
      return fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: 'include',
      });
    }

    // Refresh failed — redirect to login
    window.location.href = '/auth/login';
  }

  return res;
}
