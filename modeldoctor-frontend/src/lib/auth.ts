/* ────────────────────────────────────────
   Auth API client — register, login, token management
   ──────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "modeldoctor_token";

// ───── Types ─────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ───── Token helpers ─────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ───── Auth header helper ─────

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ───── API calls ─────

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Registration failed (${res.status})`);
  }

  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function loginUser(
  username: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Login failed (${res.status})`);
  }

  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error("No auth token found");

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearToken();
    throw new Error("Session expired. Please log in again.");
  }

  return res.json();
}
