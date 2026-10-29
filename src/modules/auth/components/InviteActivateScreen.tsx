"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { saveSession, toSessionUser } from "@/modules/auth/services/session";
import type { AuthResponse } from "@/modules/auth/types";
import { TwoFactorStep } from "@/modules/auth/components/TwoFactorStep";
import { AuthShell } from "@/modules/auth/components/AuthShell";
import { PATHS } from "@/modules/navigation";
import { PasswordField } from "@/modules/shared/ui/PasswordField";
import formStyles from "./AuthForm.module.css";
import styles from "./ChangePasswordStep.module.css";

export function InviteActivateScreen() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [challenge, setChallenge] = useState<AuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function open() {
      setLoading(true);
      setError(null);
      try {
        const next = await authApi.openInvite(token);
        if (!cancelled) setChallenge(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invitación no válida");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void open();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    try {
      const next = await authApi.completeInvitePassword({
        token: challenge.token,
        newPassword,
      });
      if (next.status === "OK") {
        saveSession(toSessionUser(next), true);
        router.replace(PATHS.dashboard);
        return;
      }
      setChallenge(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  function onTwoFactorContinue(next: AuthResponse) {
    if (next.status === "OK") {
      saveSession(toSessionUser(next), true);
      router.replace(PATHS.dashboard);
      return;
    }
    setChallenge(next);
  }

  const needsPassword = !loading && challenge?.status === "CHANGE_PASSWORD";
  const needs2fa = !loading && challenge?.status === "SETUP_2FA";

  return (
    <AuthShell
      kicker="FinanTech S.A."
      title="Activa tu acceso"
      copy={
        needs2fa
          ? "Vincula tu autenticador para terminar el alta."
          : "Define tu contraseña. No necesitas la clave temporal del administrador."
      }
    >
      <div className={styles.wrap}>
        {loading ? <p className={styles.copy}>Validando invitación…</p> : null}
        {error ? <p className={formStyles.error}>{error}</p> : null}

        {needsPassword ? (
          <form className={formStyles.form} onSubmit={onSubmitPassword}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Nueva contraseña</span>
              <PasswordField
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Confirmar contraseña</span>
              <PasswordField
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button className={formStyles.submit} type="submit" disabled={saving}>
              {saving ? "Guardando…" : challenge?.kind === "empresa" ? "Continuar a autenticador" : "Entrar"}
            </button>
          </form>
        ) : null}

        {needs2fa ? (
          <TwoFactorStep
            challenge={challenge}
            onSuccess={onTwoFactorContinue}
            onBack={() => router.push(PATHS.home)}
          />
        ) : null}
      </div>
    </AuthShell>
  );
}
