import { authHeader } from "@/modules/auth/services/session";
import type {
  AuthResponse,
  ChangePasswordPayload,
  DniLoginPayload,
  DniRegisterPayload,
  EmpresaLoginPayload,
  EmpresaRegisterPayload,
  FirstPasswordChangePayload,
  ProfileResponse,
  TotpCodePayload,
  TwoFactorSetupResponse,
  UpdateProfilePayload,
  VerificationSendResponse,
} from "@/modules/auth/types";

async function requestJson<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
  } = {},
): Promise<T> {
  const method = options.method ?? "POST";
  const response = await fetch(path, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...authHeader(options.token),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

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

export const authApi = {
  registerEmpresa: (payload: EmpresaRegisterPayload) =>
    requestJson<AuthResponse>("/api/auth/empresa/register", { body: payload }),
  loginEmpresa: (payload: EmpresaLoginPayload) =>
    requestJson<AuthResponse>("/api/auth/empresa/login", { body: payload }),
  registerDni: (payload: DniRegisterPayload) =>
    requestJson<AuthResponse>("/api/auth/dni/register", { body: payload }),
  loginDni: (payload: DniLoginPayload) =>
    requestJson<AuthResponse>("/api/auth/dni/login", { body: payload }),
  confirmTwoFactorSetup: (payload: TotpCodePayload) =>
    requestJson<AuthResponse>("/api/auth/2fa/setup", { body: payload }),
  verifyTwoFactor: (payload: TotpCodePayload) =>
    requestJson<AuthResponse>("/api/auth/2fa/verify", { body: payload }),
  sendLoginEmailCode: (token: string) =>
    requestJson<VerificationSendResponse>("/api/auth/2fa/email-code", { body: { token } }),
  changeEmpresaPassword: (payload: ChangePasswordPayload) =>
    requestJson<AuthResponse>("/api/auth/empresa/change-password", { body: payload }),
  completeFirstPasswordChange: (payload: FirstPasswordChangePayload) =>
    requestJson<AuthResponse>("/api/auth/empresa/first-password", { body: payload }),
  openInvite: (token: string) =>
    requestJson<AuthResponse>(`/api/auth/invite/${encodeURIComponent(token)}`, { method: "GET" }),
  completeInvitePassword: (payload: { token: string; newPassword: string }) =>
    requestJson<AuthResponse>("/api/auth/invite/password", { body: payload }),
  me: () => requestJson<AuthResponse>("/api/auth/me", { method: "GET" }),
  getProfile: () => requestJson<ProfileResponse>("/api/auth/profile", { method: "GET" }),
  updateProfile: (payload: UpdateProfilePayload) =>
    requestJson<ProfileResponse>("/api/auth/profile", { method: "PUT", body: payload }),
  uploadProfilePhoto: async (file: File): Promise<ProfileResponse> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/auth/profile/photo", {
      method: "POST",
      headers: {
        ...authHeader(),
      },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof data.message === "string"
          ? data.message
          : typeof data.detail === "string"
            ? data.detail
            : "No se pudo subir la foto",
      );
    }
    return data as ProfileResponse;
  },
  fetchProfilePhotoBlob: async (): Promise<Blob | null> => {
    const response = await fetch(`/api/auth/profile/photo?t=${Date.now()}`, {
      method: "GET",
      headers: {
        ...authHeader(),
      },
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error("No se pudo cargar la foto");
    }
    return response.blob();
  },
  sendEmailCode: () =>
    requestJson<VerificationSendResponse>("/api/auth/profile/email/send-code", { body: {} }),
  confirmEmailLink: (token: string) =>
    requestJson<{ message: string }>(`/api/auth/email/verify-link/${encodeURIComponent(token)}`, {
      method: "GET",
      body: undefined,
    }),
  disableTwoFactor: (code: string) =>
    requestJson<ProfileResponse>("/api/auth/profile/2fa/disable", { body: { code } }),
  startEnableTwoFactor: () =>
    requestJson<TwoFactorSetupResponse>("/api/auth/profile/2fa/enable/start", { body: {} }),
  confirmEnableTwoFactor: (code: string) =>
    requestJson<ProfileResponse>("/api/auth/profile/2fa/enable/confirm", { body: { code } }),
  logout: async () => {
    try {
      await requestJson<void>("/api/auth/logout", { body: {} });
    } catch {
      // Si el token ya expiró, igual limpiamos localmente.
    }
  },
};
