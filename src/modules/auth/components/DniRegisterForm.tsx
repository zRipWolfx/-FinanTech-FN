"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { saveSession, toSessionUser } from "@/modules/auth/services/session";
import { PasswordField } from "@/modules/shared/ui/PasswordField";
import styles from "./AuthForm.module.css";

export function DniRegisterForm() {
  const router = useRouter();
  const [nombres, setNombres] = useState("");
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await authApi.registerDni({ nombres, dni, password });
      if (session.status !== "OK") {
        throw new Error("No se pudo crear la cuenta");
      }
      saveSession(toSessionUser(session), true);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Nombres y apellidos</span>
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            required
            value={nombres}
            onChange={(event) => setNombres(event.target.value)}
          />
        </span>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>DNI</span>
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            required
            value={dni}
            onChange={(event) => setDni(event.target.value.replace(/\D/g, "").slice(0, 8))}
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
