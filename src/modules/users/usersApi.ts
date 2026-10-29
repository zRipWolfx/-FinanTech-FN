import { authHeader } from "@/modules/auth/services/session";
import { apiFetch } from "@/modules/shared/lib/apiFetch";

export type ManagedUser = {
  id: number;
  kind: "empresa" | "dni";
  nombre: string;
  apodo: string;
  identifier: string;
  role: string;
  roleCode: string;
  active: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  hasPhoto: boolean;
  photoUrl: string | null;
  inviteActive: boolean;
  invitePath: string | null;
  inviteExpiresAt: string | null;
};

export type CreateManagedUserPayload = {
  kind: "empresa" | "dni";
  nombre: string;
  correo?: string;
  dni?: string;
  role?: string;
};

export type CreateManagedUserResponse = {
  user: ManagedUser;
  temporaryPassword: string | null;
  invitePath: string | null;
  message: string;
};

export const usersApi = {
  list: () => apiFetch<ManagedUser[]>("/api/admin/users"),
  create: (payload: CreateManagedUserPayload) =>
    apiFetch<CreateManagedUserResponse>("/api/admin/users", { method: "POST", body: payload }),
  refreshInvite: (kind: string, id: number) =>
    apiFetch<CreateManagedUserResponse>(`/api/admin/users/${kind}/${id}/invite`, {
      method: "POST",
      body: {},
    }),
  setActive: (kind: string, id: number, active: boolean) =>
    apiFetch<ManagedUser>(`/api/admin/users/${kind}/${id}/active`, {
      method: "PATCH",
      body: { active },
    }),
  fetchPhotoBlob: async (photoUrl: string): Promise<string | null> => {
    const response = await fetch(`${photoUrl}?t=${Date.now()}`, {
      headers: { ...authHeader() },
      cache: "no-store",
    });
    if (response.status === 401) {
      const { clearSession } = await import("@/modules/auth/services/session");
      clearSession();
      if (typeof window !== "undefined") window.location.assign("/");
      return null;
    }
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
