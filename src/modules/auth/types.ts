export type AuthKind = "empresa" | "dni";

export type AuthStatus = "OK" | "CHANGE_PASSWORD" | "NEED_2FA" | "SETUP_2FA";

export type AuthResponse = {
  status: AuthStatus;
  token: string;
  kind: AuthKind;
  displayName: string;
  otpauthUrl?: string | null;
  secret?: string | null;
  trustedDeviceToken?: string | null;
  emailLoginAvailable?: boolean | null;
};

export type SessionUser = {
  token: string;
  kind: AuthKind;
  displayName: string;
};

export type ProfileResponse = {
  kind: AuthKind;
  displayName: string;
  nombre: string;
  apodo: string;
  empresa: string;
  accessType: string;
  identifier: string;
  correo: string | null;
  telefono: string | null;
  role: string;
  roleCode: string;
  canEditRole: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  hasPhoto: boolean;
  photoUrl: string | null;
  direccion: string | null;
  trabajo: string | null;
  ingresosMensuales: string | null;
};

export type UpdateProfilePayload = {
  nombre?: string | null;
  apodo: string;
  telefono?: string | null;
  correo?: string | null;
  role?: string | null;
  direccion?: string | null;
  trabajo?: string | null;
  ingresosMensuales?: string | null;
};

export type VerificationSendResponse = {
  channel: string;
  message: string;
  code: string | null;
  verifyPath: string | null;
  verifyUrl: string | null;
  mailed: boolean;
  expiresInSeconds: number;
};

export type TwoFactorSetupResponse = {
  otpauthUrl: string;
  secret: string;
  message: string;
};

export type EmpresaRegisterPayload = {
  nombre: string;
  correo: string;
  password: string;
};

export type EmpresaLoginPayload = {
  correo: string;
  password: string;
  trustedDeviceToken?: string | null;
};

export type DniRegisterPayload = {
  nombres: string;
  dni: string;
  password: string;
};

export type DniLoginPayload = {
  dni: string;
  password: string;
};

export type TotpCodePayload = {
  token: string;
  code: string;
  rememberDevice?: boolean;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type FirstPasswordChangePayload = {
  token: string;
  currentPassword: string;
  newPassword: string;
};
