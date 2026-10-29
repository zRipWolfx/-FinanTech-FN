import { authHeader, clearSession } from "@/modules/auth/services/session";

export async function apiFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...authHeader(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
    }
    throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  }

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : typeof data.detail === "string"
          ? data.detail
          : "No se pudo completar la solicitud",
    );
  }

  return data as T;
}
