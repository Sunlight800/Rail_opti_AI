import { UserProfileData } from '../types/dashboard';

const TOKEN_KEY = 'railopt_auth_token';
const USER_KEY = 'railopt_auth_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): UserProfileData | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as UserProfileData;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfileData): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Returns the configured API base URL (from VITE_API_BASE_URL) or empty string for relative proxying.
 */
export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

/**
 * Perform an authenticated HTTP request injecting Bearer token and user role.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const user = getStoredUser();

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (user?.role) {
    headers.set('X-User-Role', user.role);
  }

  // Ensure content-type default for mutation requests
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${normalizedPath}`;

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}
