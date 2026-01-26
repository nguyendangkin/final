/**
 * API utility for making authenticated requests using HTTP-only cookies.
 * All auth-protected endpoints should use these functions.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

/**
 * Make an authenticated API request.
 * Automatically includes credentials (HTTP-only cookies).
 */
export async function authFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
    const { params, ...fetchOptions } = options;

    let url = `${API_URL}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    return fetch(url, {
        ...fetchOptions,
        credentials: 'include', // Always include cookies
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        },
    });
}

/**
 * Make an authenticated GET request
 */
export async function authGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const res = await authFetch(endpoint, { method: 'GET', params });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * Make an authenticated POST request
 */
export async function authPost<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await authFetch(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * Make an authenticated PUT request
 */
export async function authPut<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await authFetch(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * Make an authenticated PATCH request
 */
export async function authPatch<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await authFetch(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * Make an authenticated DELETE request
 */
export async function authDelete<T>(endpoint: string): Promise<T> {
    const res = await authFetch(endpoint, { method: 'DELETE' });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * Check if user is currently authenticated
 */
export async function checkAuth(): Promise<{ authenticated: boolean; user?: any }> {
    try {
        const res = await authFetch('/auth/me');
        if (res.ok) {
            const data = await res.json();
            return { authenticated: true, user: data.user };
        }
        return { authenticated: false };
    } catch {
        return { authenticated: false };
    }
}

/**
 * Logout - clears the HTTP-only cookie on the server
 */
export async function logout(): Promise<void> {
    await authFetch('/auth/logout', { method: 'POST' });
}
