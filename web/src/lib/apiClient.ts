// src/lib/apiClient.ts

// Automatically pick up your API base from .env.local
// Example: VITE_API_BASE=https://58ig0r1tab.execute-api.us-east-1.amazonaws.com
let BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";

export function setApiBase(url: string) {
  BASE = url.replace(/\/$/, "");
}

/**
 * GET request helper
 * Usage: const data = await get<YourType>("/v1/incidents");
 */
export async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text);
  try {
    return JSON.parse(text) as T;
  } catch {
    // fallback to plain text if response is not JSON
    return text as unknown as T;
  }
}

/**
 * POST request helper (strict JSON expected)
 * Usage: const res = await post("/v1/incident", { region: "Dubai" });
 */
export async function post<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * POST request helper (handles JSON or text/plain)
 * Use this for Bedrock model responses like /v1/actionPlan
 */
export async function postSmart<T = any>(
  path: string,
  body?: any,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      throw new Error(err.error ?? text);
    } catch {
      throw new Error(text);
    }
  }

  // Handle both JSON and plain text responses
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}