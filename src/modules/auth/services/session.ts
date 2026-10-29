import type { AuthResponse, SessionUser } from "@/modules/auth/types";

const KEY = "mta.auth";
const SESSION_ONLY_KEY = "mta.auth.sessionOnly";

export function toSessionUser(response: AuthResponse): SessionUser {
  return {
    token: response.token,
    kind: response.kind,
    displayName: response.displayName,
  };
}

export function saveSession(session: SessionUser, rememberDevice: boolean) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  if (rememberDevice) {
    window.localStorage.setItem(KEY, payload);
    window.sessionStorage.removeItem(KEY);
    window.sessionStorage.removeItem(SESSION_ONLY_KEY);
  } else {
    window.sessionStorage.setItem(KEY, payload);
    window.sessionStorage.setItem(SESSION_ONLY_KEY, "1");
    window.localStorage.removeItem(KEY);
  }
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const sessionOnly = window.sessionStorage.getItem(SESSION_ONLY_KEY) === "1";
  const raw = sessionOnly
    ? window.sessionStorage.getItem(KEY)
    : window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.token || !parsed?.kind || !parsed?.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
  window.sessionStorage.removeItem(SESSION_ONLY_KEY);
}

export function patchSession(partial: Partial<SessionUser>): SessionUser | null {
  const current = readSession();
  if (!current) return null;
  const next = { ...current, ...partial };
  const rememberDevice = window.sessionStorage.getItem(SESSION_ONLY_KEY) !== "1";
  saveSession(next, rememberDevice);
  return next;
}

export function authHeader(token?: string | null): HeadersInit {
  const value = token ?? readSession()?.token;
  return value ? { Authorization: `Bearer ${value}` } : {};
}
