"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/modules/auth/services/authApi";
import { clearSession, patchSession, readSession } from "@/modules/auth/services/session";
import type { SessionUser } from "@/modules/auth/types";
import { PATHS } from "@/modules/navigation";
import { AppShell } from "@/modules/shell/AppShell";

type ThemeMode = "light" | "dark";

type AppSessionContextValue = {
  session: SessionUser;
  setSession: (session: SessionUser) => void;
  photoSrc: string | null;
  refreshPhoto: () => Promise<void>;
  syncDisplayName: (displayName: string) => void;
  theme: ThemeMode;
  loggingOut: boolean;
  logout: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("mta.theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useAppSession() {
  const value = useContext(AppSessionContext);
  if (!value) {
    throw new Error("useAppSession debe usarse dentro de AppFrame");
  }
  return value;
}

export function AppFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [loggingOut, setLoggingOut] = useState(false);
  const [ready, setReady] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);

  const refreshPhoto = useCallback(async () => {
    try {
      const blob = await authApi.fetchProfilePhotoBlob();
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      if (!blob) {
        photoUrlRef.current = null;
        setPhotoSrc(null);
        return;
      }
      const url = URL.createObjectURL(blob);
      photoUrlRef.current = url;
      setPhotoSrc(url);
    } catch {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = null;
      setPhotoSrc(null);
    }
  }, []);

  const syncDisplayName = useCallback((displayName: string) => {
    const patched = patchSession({ displayName });
    if (patched) setSession(patched);
  }, []);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace(PATHS.home);
      return;
    }
    setSession(current);
    const initialTheme = readTheme();
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    setReady(true);
    void refreshPhoto();
  }, [router, refreshPhoto]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  const logout = useCallback(() => {
    setLoggingOut(true);
    void authApi.logout().finally(() => {
      clearSession();
      router.push(PATHS.home);
    });
  }, [router]);

  const value = useMemo(
    () =>
      session
        ? {
            session,
            setSession,
            photoSrc,
            refreshPhoto,
            syncDisplayName,
            theme,
            loggingOut,
            logout,
          }
        : null,
    [session, photoSrc, refreshPhoto, syncDisplayName, theme, loggingOut, logout],
  );

  if (!ready || !session || !value) return null;

  return (
    <AppSessionContext.Provider value={value}>
      <AppShell
        session={session}
        photoSrc={photoSrc}
        theme={theme}
        loggingOut={loggingOut}
        onLogout={logout}
        onToggleTheme={() =>
          setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            window.localStorage.setItem("mta.theme", next);
            document.documentElement.setAttribute("data-theme", next);
            return next;
          })
        }
      >
        {children}
      </AppShell>
    </AppSessionContext.Provider>
  );
}
