const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// A simple error type so pages can read a message and status.
export class ApiError extends Error {
    status: number;
    body: any;
    constructor(message: string, status: number, body: any) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

// Read the saved token from the browser (null on the server or if absent).
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("seapedia_token");
}

type ApiOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    token?: string | null; // override the stored token if needed
    auth?: boolean; // attach the Bearer token (default true)
};

export async function api<T = any>(
    path: string,
    options: ApiOptions = {},
): Promise<T> {
    const { method = "GET", body, auth = true } = options;
    const token = options.token ?? (auth ? getToken() : null);

    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Try to parse JSON; some responses (like 204) have no body.
    let data: any = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!res.ok) {
        const message =
            (data && (data.message || data.error)) || `Request failed (${res.status})`;
        throw new ApiError(
            Array.isArray(message) ? message.join(", ") : String(message),
            res.status,
            data,
        );
    }

    return data as T;
}