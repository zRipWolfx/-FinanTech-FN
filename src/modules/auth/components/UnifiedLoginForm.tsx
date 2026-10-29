"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { saveSession, toSessionUser } from "@/modules/auth/services/session";
import {
  clearTrustedDeviceToken,
  getRememberPreference,
  getTrustedDeviceToken,
  saveTrustedDeviceToken,
  setRememberPreference,
} from "@/modules/auth/services/trustedDevice";
import type { AuthResponse } from "@/modules/auth/types";
import { IconEye, IconEyeOff, IconHelp, IconTipButton } from "@/modules/shared/ui/IconTipButton";
import { ChangePasswordStep } from "./ChangePasswordStep";
import { TwoFactorStep } from "./TwoFactorStep";
import styles from "./AuthForm.module.css";

export type AuthPhase = "credentials" | "password" | "twofactor";

function isDni(value: string) {
  return /^\d{8}$/.test(value.trim());
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.fieldIcon}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 7.5L12 13l7.5-5.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.fieldIcon}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.5 10h5M13.5 13.5h4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.fieldIcon}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

type UnifiedLoginFormProps = {
  onPhaseChange?: (phase: AuthPhase) => void;
};

export function UnifiedLoginForm({ onPhaseChange }: UnifiedLoginFormProps = {}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => getRememberPreference());
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<AuthResponse | null>(null);
  const [pendingCorreo, setPendingCorreo] = useState<string | null>(null);

  const identifierKind = useMemo(() => {
    const value = identifier.trim();
    if (!value) return "empty";
    if (isDni(value)) return "dni";
    if (isEmail(value)) return "email";
    if (/^\d+$/.test(value)) return "dni-partial";
    return "email-partial";
  }, [identifier]);

  const finishLogin = (session: AuthResponse, correo?: string | null) => {
    setRememberPreference(remember);
    const email = (correo ?? pendingCorreo ?? identifier).trim();
    if (isEmail(email)) {
      if (remember && session.trustedDeviceToken) {
        saveTrustedDeviceToken(email, session.trustedDeviceToken);
      } else if (!remember) {
        clearTrustedDeviceToken(email);
      }
    }
    saveSession(toSessionUser(session), remember);
    router.push("/dashboard");
  };

  const applyChallenge = (response: AuthResponse, correo?: string | null) => {
    if (response.status === "OK") {
      finishLogin(response, correo);
      return;
    }
    if (response.status === "CHANGE_PASSWORD") {
      setChallenge(response);
      onPhaseChange?.("password");
      return;
    }
    if (response.status === "NEED_2FA" || response.status === "SETUP_2FA") {
      setChallenge(response);
      onPhaseChange?.("twofactor");
      return;
    }
    setError("Respuesta de autenticación no reconocida");
  };

  const resetToCredentials = () => {
    setChallenge(null);
    setPassword("");
    setError(null);
    setPendingCorreo(null);
    onPhaseChange?.("credentials");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = identifier.trim();
    if (!isDni(value) && !isEmail(value)) {
      setError("Ingresa un correo válido o un DNI de 8 dígitos");
      return;
    }

    setLoading(true);
    try {
      if (isDni(value)) {
        setPendingCorreo(null);
        const response = await authApi.loginDni({ dni: value, password });
        applyChallenge(response);
      } else {
        setPendingCorreo(value);
        const trustedDeviceToken = remember ? getTrustedDeviceToken(value) : null;
        const response = await authApi.loginEmpresa({
          correo: value,
          password,
          trustedDeviceToken,
        });
        applyChallenge(response, value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  if (challenge?.status === "CHANGE_PASSWORD") {
    return (
      <ChangePasswordStep
        challenge={challenge}
        onContinue={(next) => applyChallenge(next, pendingCorreo)}
        onBack={resetToCredentials}
      />
    );
  }

  if (challenge?.status === "NEED_2FA" || challenge?.status === "SETUP_2FA") {
    return (
      <TwoFactorStep
        challenge={challenge}
        rememberDevice={remember}
        onSuccess={(session) => finishLogin(session, pendingCorreo)}
        onBack={resetToCredentials}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Correo o DNI</span>
        <span className={styles.inputWrap}>
          {identifierKind === "dni" || identifierKind === "dni-partial" ? (
            <IdIcon />
          ) : (
            <MailIcon />
          )}
          <input
            className={styles.input}
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="nombre@empresa.com o 12345678"
          />
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Contraseña</span>
        <span className={styles.inputWrap}>
          <LockIcon />
          <input
            className={styles.input}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
          <IconTipButton
            tip={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </IconTipButton>
        </span>
      </label>

      <label className={styles.remember}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        <span>Recordar este dispositivo</span>
        <IconTipButton
          tip="Si lo marcas, en este navegador no se pedirá el autenticador durante 7 días. En otro dispositivo sí se pedirá."
          aria-label="Más información"
        >
          <IconHelp />
        </IconTipButton>
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Validando…" : "Ingresar"}
      </button>
    </form>
  );
}
