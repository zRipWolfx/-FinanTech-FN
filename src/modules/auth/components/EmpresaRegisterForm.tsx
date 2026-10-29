"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { saveSession, toSessionUser } from "@/modules/auth/services/session";
import type { AuthResponse } from "@/modules/auth/types";
import { PasswordField } from "@/modules/shared/ui/PasswordField";
import { ChangePasswordStep } from "./ChangePasswordStep";
import { TwoFactorStep } from "./TwoFactorStep";
import styles from "./AuthForm.module.css";

export function EmpresaRegisterForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<AuthResponse | null>(null);

  const finishLogin = (session: AuthResponse) => {
    saveSession(toSessionUser(session), true);
    router.push("/dashboard");
  };

  const applyChallenge = (response: AuthResponse) => {
    if (response.status === "OK") {
      finishLogin(response);
      return;
    }
    if (
      response.status === "CHANGE_PASSWORD" ||
      response.status === "SETUP_2FA" ||
      response.status === "NEED_2FA"
    ) {
      setChallenge(response);
      return;
    }
    setError("Respuesta de registro no reconocida");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.registerEmpresa({ nombre, correo, password });
      applyChallenge(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  if (challenge?.status === "CHANGE_PASSWORD") {
    return (
      <ChangePasswordStep
        challenge={challenge}
        onContinue={applyChallenge}
        onBack={() => setChallenge(null)}
      />
    );
  }

  if (challenge?.status === "SETUP_2FA" || challenge?.status === "NEED_2FA") {
    return (
      <TwoFactorStep
        challenge={challenge}
        onSuccess={finishLogin}
        onBack={() => setChallenge(null)}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Nombre completo</span>
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
        </span>
      </label>
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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
