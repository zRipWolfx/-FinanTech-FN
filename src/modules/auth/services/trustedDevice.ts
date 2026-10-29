const TRUST_KEY = "finantech.trustedDevices";
const REMEMBER_PREF_KEY = "finantech.rememberDevice";
const TRUST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type TrustMap = Record<string, { token: string; expiresAt: number }>;

function readMap(): TrustMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRUST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TrustMap;
    const now = Date.now();
    const next: TrustMap = {};
    for (const [key, value] of Object.entries(parsed ?? {})) {
      if (value?.token && typeof value.expiresAt === "number" && value.expiresAt > now) {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeMap(map: TrustMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRUST_KEY, JSON.stringify(map));
}

function keyFor(correo: string) {
  return correo.trim().toLowerCase();
}

export function getRememberPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(REMEMBER_PREF_KEY) === "1";
}

export function setRememberPreference(remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) {
    window.localStorage.setItem(REMEMBER_PREF_KEY, "1");
  } else {
    window.localStorage.removeItem(REMEMBER_PREF_KEY);
  }
}

export function getTrustedDeviceToken(correo: string): string | null {
  const entry = readMap()[keyFor(correo)];
  return entry?.token ?? null;
}

export function saveTrustedDeviceToken(correo: string, token: string | null | undefined) {
  if (typeof window === "undefined") return;
  const map = readMap();
  const key = keyFor(correo);
  if (!token) {
    delete map[key];
    writeMap(map);
    return;
  }
  map[key] = {
    token,
    expiresAt: Date.now() + TRUST_TTL_MS,
  };
  writeMap(map);
}

export function clearTrustedDeviceToken(correo: string) {
  saveTrustedDeviceToken(correo, null);
}
