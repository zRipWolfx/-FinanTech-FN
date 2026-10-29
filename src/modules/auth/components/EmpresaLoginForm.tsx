"use client";

import { FormEvent, useState } from "react";
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
import { IconHelp, IconTipButton } from "@/modules/shared/ui/IconTipButton";
import { PasswordField } from "@/modules/shared/ui/PasswordField";
import { TwoFactorStep } from "./TwoFactorStep";
import styles from "./AuthForm.module.css";

export function EmpresaLoginForm() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => getRememberPreference());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<AuthResponse | null>(null);

  const finishLogin = (session: AuthResponse) => {
    setRememberPreference(remember);
    if (remember && session.trustedDeviceToken) {
      saveTrustedDeviceToken(correo, session.trustedDeviceToken);
    } else if (!remember) {
      clearTrustedDeviceToken(correo);
    }
    saveSession(toSessionUser(session), remember);
    router.push("/dashboard");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.loginEmpresa({
        correo,
        password,
        trustedDeviceToken: remember ? getTrustedDeviceToken(correo) : null,
      });
      if (response.status === "OK") {
        finishLogin(response);
        return;
      }
      if (response.status === "NEED_2FA" || response.status === "SETUP_2FA") {
        setChallenge(response);
        return;
      }
      setError("Respuesta de autenticación no reconocida");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  if (challenge) {
    return (
      <TwoFactorStep
        challenge={challenge}
        rememberDevice={remember}
        onSuccess={finishLogin}
        onBack={() => setChallenge(null)}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Correo electrónico</span>
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
          />
        </span>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Contraseña</span>
        <PasswordField
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
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
