"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import { authApi } from "@/modules/auth/services/authApi";
import type { AuthResponse } from "@/modules/auth/types";
import formStyles from "./AuthForm.module.css";
import styles from "./TwoFactorStep.module.css";

type TwoFactorStepProps = {
  challenge: AuthResponse;
  rememberDevice?: boolean;
  onSuccess: (session: AuthResponse) => void;
  onBack: () => void;
};

export function TwoFactorStep({
  challenge,
  rememberDevice = false,
  onSuccess,
  onBack,
}: TwoFactorStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<"authenticator" | "email">(
    challenge.emailLoginAvailable ? "authenticator" : "authenticator",
  );

  const secret = challenge.secret?.trim() || null;
  const otpauthUrl = challenge.otpauthUrl?.trim() || null;
  const isSetup = challenge.status === "SETUP_2FA" || Boolean(secret || otpauthUrl);
  const emailAvailable = Boolean(challenge.emailLoginAvailable) && !isSetup;

  useEffect(() => {
    let cancelled = false;

    async function buildQr() {
      if (!otpauthUrl) {
        setQrSrc(null);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(otpauthUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 160,
          color: { dark: "#0a2540", light: "#ffffff" },
        });
        if (!cancelled) setQrSrc(dataUrl);
      } catch {
        if (!cancelled) setQrSrc(null);
      }
    }

    void buildQr();
    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  const formattedSecret = useMemo(() => {
    if (!secret) return null;
    return secret.replace(/(.{4})/g, "$1 ").trim();
  }, [secret]);

  async function sendEmailCode() {
    setSendingEmail(true);
    setError(null);
    setHint(null);
    try {
      const res = await authApi.sendLoginEmailCode(challenge.token);
      setMode("email");
      setHint(res.mailed ? res.message : `${res.message}${res.code ? ` Código: ${res.code}` : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código al correo");
    } finally {
      setSendingEmail(false);
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        token: challenge.token,
        code: code.replace(/\s/g, ""),
        rememberDevice,
      };
      const session = isSetup
        ? await authApi.confirmTwoFactorSetup(payload)
        : await authApi.verifyTwoFactor(payload);

      if (session.status !== "OK") {
        throw new Error("No se pudo completar la verificación 2FA");
      }
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>
        {isSetup ? "Vincula tu autenticador" : "Código de verificación"}
      </h3>
      <p className={styles.copy}>
        {isSetup
          ? "Escanea el código QR o ingresa la clave manual en Google Authenticator, Authy u otra app TOTP."
          : mode === "email"
            ? "Ingresa el código de 6 dígitos enviado a tu correo verificado."
            : "Ingresa el código de 6 dígitos de tu autenticador."}
      </p>

      {isSetup ? (
        <div className={styles.setupBlock}>
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.qr} src={qrSrc} alt="Código QR del autenticador" />
          ) : (
            <div className={styles.qrPlaceholder}>Generando QR…</div>
          )}

          {formattedSecret ? (
            <div className={styles.secretBox}>
              <p className={styles.secretLabel}>Clave para escanear / ingresar</p>
              <p className={styles.secretValue}>{formattedSecret}</p>
            </div>
          ) : (
            <p className={styles.copy}>No se recibió la clave 2FA. Vuelve a iniciar sesión.</p>
          )}
        </div>
      ) : null}

      {emailAvailable ? (
        <div className={styles.modeRow}>
          <button
            type="button"
            className={mode === "authenticator" ? styles.modeOn : styles.mode}
            onClick={() => {
              setMode("authenticator");
              setHint(null);
            }}
          >
            Autenticador
          </button>
          <button
            type="button"
            className={mode === "email" ? styles.modeOn : styles.mode}
            disabled={sendingEmail}
            onClick={() => void sendEmailCode()}
          >
            {sendingEmail ? "Enviando…" : "Código al correo"}
          </button>
        </div>
      ) : null}

      {hint ? <p className={styles.hint}>{hint}</p> : null}

      <form className={`${formStyles.form} ${styles.codeForm}`} onSubmit={onSubmit}>
        <label className={`${formStyles.field} ${styles.codeField}`}>
          <span className={`${formStyles.label} ${styles.codeLabel}`}>
            {mode === "email" ? "Código del correo" : "Código 2FA"}
          </span>
          <span className={`${formStyles.inputWrap} ${styles.codeInputWrap}`}>
            <input
              className={`${formStyles.input} ${styles.codeInput}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
          </span>
        </label>

        {error ? <p className={`${formStyles.error} ${styles.codeError}`}>{error}</p> : null}

        <button className={formStyles.submit} type="submit" disabled={loading}>
          {loading ? "Verificando…" : isSetup ? "Activar 2FA y entrar" : "Verificar y entrar"}
        </button>
      </form>

      <button className={styles.back} type="button" onClick={onBack}>
        Volver al login
      </button>
    </div>
  );
}
