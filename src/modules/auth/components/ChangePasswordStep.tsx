"use client";

import { FormEvent, useState } from "react";

import { authApi } from "@/modules/auth/services/authApi";
import type { AuthResponse } from "@/modules/auth/types";
import { PasswordField } from "@/modules/shared/ui/PasswordField";
import formStyles from "./AuthForm.module.css";
import styles from "./ChangePasswordStep.module.css";

type ChangePasswordStepProps = {
  challenge: AuthResponse;
  onContinue: (next: AuthResponse) => void;
  onBack: () => void;
};

export function ChangePasswordStep({
  challenge,
  onContinue,
  onBack,
}: ChangePasswordStepProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const next = await authApi.completeFirstPasswordChange({
        token: challenge.token,
        currentPassword,
        newPassword,
      });
      onContinue(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>Cambia tu contraseña</h3>
      <p className={styles.copy}>Define una contraseña nueva antes de vincular tu autenticador.</p>

      <form className={formStyles.form} onSubmit={onSubmit}>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Contraseña actual</span>
          <PasswordField
            autoComplete="current-password"
            required
            minLength={6}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>Nueva contraseña</span>
          <PasswordField
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>Confirmar nueva contraseña</span>
          <PasswordField
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {error ? <p className={formStyles.error}>{error}</p> : null}

        <button className={formStyles.submit} type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Continuar al autenticador"}
        </button>
      </form>

      <button className={styles.back} type="button" onClick={onBack}>
        Volver al login
      </button>
    </div>
  );
}
