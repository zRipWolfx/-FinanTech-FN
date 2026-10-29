"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";

import { readSession } from "@/modules/auth/services/session";
import { brandLogoSrc } from "@/modules/shared/ui/brandLogo";
import { UnifiedLoginForm, type AuthPhase } from "./UnifiedLoginForm";
import styles from "./LoginScreen.module.css";

type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "mta.theme";

function ShieldIcon() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-2.9 7.9-7 9-4.1-1.1-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M9.5 12.2l1.7 1.7 3.5-3.8" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8.2l2.8 6.2M16 8.2l-2.8 6.2M8.3 7h7.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3.8h7l3 3V20c0 .7-.6 1.2-1.2 1.2H7.2C6.5 21.2 6 20.7 6 20V5c0-.7.5-1.2 1-1.2z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M14 3.8V8h3.2M9 12h6M9 15.5h6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M14.5 8.5h2.1V5.8c-.4-.1-1.5-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.7H6.8v3.1h2.3V22h3.2v-5.8h2.7l.4-3.1h-3.1V10.6c0-.9.3-1.6 1.5-1.6z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 7.6A3 3 0 1 1 12 9a3 3 0 0 1 0 6z"
      />
      <path
        fill="currentColor"
        d="M17.5 6.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z"
      />
      <path
        fill="currentColor"
        d="M12 3.2c-2.4 0-2.7 0-3.7.1-2.3.1-3.5 1.3-3.6 3.6-.1 1 0 1.3 0 3.7s0 2.7.1 3.7c.1 2.3 1.3 3.5 3.6 3.6 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c2.3-.1 3.5-1.3 3.6-3.6.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-2.3-1.3-3.5-3.6-3.6-1-.1-1.3-.1-3.7-.1zm0 1.6c2.4 0 2.6 0 3.6.1 1.8.1 2.6.9 2.7 2.7.1 1 0 1.2 0 3.6s0 2.6-.1 3.6c-.1 1.8-.9 2.6-2.7 2.7-1 .1-1.2.1-3.6.1s-2.6 0-3.6-.1c-1.8-.1-2.6-.9-2.7-2.7-.1-1 0-1.2 0-3.6s0-2.6.1-3.6c.1-1.8.9-2.6 2.7-2.7 1-.1 1.2-.1 3.6-.1z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M6.4 9.3H3.6V20h2.8V9.3zM5 4a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 5 4zM20.4 13.5c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-2.9 1.6V9.3h-2.8c0 .8 0 10.7 0 10.7h2.8v-6c0-.3 0-.7.1-1 .3-.7.9-1.5 2-1.5 1.4 0 2 1.1 2 2.6V20h2.8v-6.5z"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 19.5h8M12 16.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.5 13.2A7.4 7.4 0 0 1 10.8 4.5 7.5 7.5 0 1 0 19.5 13.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

export function LoginScreen() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [ready, setReady] = useState(false);
  const [authPhase, setAuthPhase] = useState<AuthPhase>("credentials");

  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    if (readSession()) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    if (reduce || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const targets = rootRef.current?.querySelectorAll(
        "[data-anim='card'], [data-anim='brand'], [data-anim='form']",
      );
      if (!targets?.length) return;

      gsap.from(targets, {
        opacity: 0,
        y: 14,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.06,
        clearProps: "all",
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduce]);

  if (!ready) {
    return null;
  }

  return (
    <main ref={rootRef} className={styles.page} data-theme={resolved}>
      <div className={styles.themeSwitch} role="group" aria-label="Tema">
        <button
          type="button"
          className={`${styles.themeBtn} ${theme === "system" ? styles.themeBtnActive : ""}`}
          onClick={() => setTheme("system")}
          aria-label="Sistema"
          title="Sistema"
        >
          <SystemIcon />
        </button>
        <button
          type="button"
          className={`${styles.themeBtn} ${theme === "light" ? styles.themeBtnActive : ""}`}
          onClick={() => setTheme("light")}
          aria-label="Claro"
          title="Claro"
        >
          <SunIcon />
        </button>
        <button
          type="button"
          className={`${styles.themeBtn} ${theme === "dark" ? styles.themeBtnActive : ""}`}
          onClick={() => setTheme("dark")}
          aria-label="Oscuro"
          title="Oscuro"
        >
          <MoonIcon />
        </button>
      </div>

      <section className={styles.card} data-anim="card">
        <aside className={styles.brandPanel} data-anim="brand">
          <div className={styles.brandTop}>
            <Image
              className={styles.brandLogo}
              src={brandLogoSrc(resolved === "dark" ? "dark" : "light")}
              alt="FinanTech"
              width={56}
              height={56}
              priority
            />
            <p className={styles.brandName}>FINANTECH S.A.</p>
          </div>

          <div className={styles.brandCopy}>
            <h1 className={styles.brandTitle}>Préstamos y control de pagos</h1>
            <p className={styles.brandText}>
              FinanTech S.A. administra créditos, cuotas y cobranzas de
              clientes en un único panel.
            </p>
            <ul className={styles.features}>
              <li className={styles.feature}>
                <ShieldIcon />
                <span>Acceso con verificación en dos pasos</span>
              </li>
              <li className={styles.feature}>
                <NetworkIcon />
                <span>Préstamos, cuotas y pagos de clientes</span>
              </li>
              <li className={styles.feature}>
                <DocIcon />
                <span>Control de mora y cobranza</span>
              </li>
            </ul>
          </div>

          <p className={styles.copyright}>© 2026 FinanTech S.A.</p>
        </aside>

        <div
          className={`${styles.formPanel} ${authPhase !== "credentials" ? styles.formPanelCompact : ""}`}
          data-anim="form"
        >
          {authPhase === "credentials" ? (
            <>
              <div className={styles.formBrand}>
                <Image
                  className={styles.formLogo}
                  src={brandLogoSrc(resolved === "dark" ? "dark" : "light")}
                  alt="FinanTech"
                  width={64}
                  height={64}
                  priority
                />
              </div>
              <h2 className={styles.formTitle}>Iniciar sesión</h2>
              <p className={styles.formHint}>Usa tu correo corporativo o tu DNI</p>
            </>
          ) : null}
          <UnifiedLoginForm onPhaseChange={setAuthPhase} />

          {authPhase === "credentials" ? (
            <div className={styles.social}>
              <p className={styles.socialLabel}>SÍGUENOS</p>
              <div className={styles.socialLinks}>
                <a
                  className={styles.socialLink}
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
                <a
                  className={styles.socialLink}
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  className={styles.socialLink}
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
