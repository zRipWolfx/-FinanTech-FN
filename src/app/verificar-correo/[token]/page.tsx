"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { PATHS } from "@/modules/navigation";

function VerifyEmailContent() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verificando correo…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enlace inválido");
      return;
    }
    let cancelled = false;
    void authApi
      .confirmEmailLink(token)
      .then((res) => {
        if (cancelled) return;
        setStatus("ok");
        setMessage(res.message || "Correo verificado correctamente");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "No se pudo verificar el correo");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.25rem",
        background: "#f4f8fc",
        color: "#0a2540",
      }}
    >
      <div
        style={{
          width: "min(100%, 26rem)",
          padding: "1.35rem 1.4rem",
          borderRadius: "1rem",
          background: "#fff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b" }}>
          FINANTECH S.A.
        </p>
        <h1 style={{ margin: "0.55rem 0 0", fontSize: "1.25rem" }}>Verificación de correo</h1>
        <p style={{ margin: "0.75rem 0 0", color: status === "error" ? "#b91c1c" : "#334155", lineHeight: 1.45 }}>
          {message}
        </p>
        {status !== "loading" ? (
          <p style={{ margin: "1.1rem 0 0" }}>
            <Link href={PATHS.profile.seguridad} style={{ color: "#2563eb", fontWeight: 700 }}>
              Ir a seguridad
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
