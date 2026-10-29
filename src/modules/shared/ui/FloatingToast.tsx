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
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import styles from "./FloatingToast.module.css";

type ToastTone = "info" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  push: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const lastPush = useRef<{ key: string; at: number }>({ key: "", at: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const text = message.trim();
    if (!text) return;

    const key = `${tone}::${text}`;
    const now = Date.now();
    if (lastPush.current.key === key && now - lastPush.current.at < 1500) {
      return;
    }
    lastPush.current = { key, at: now };

    const id = ++toastSeq;
    setItems((prev) => {
      const withoutDup = prev.filter((item) => !(item.message === text && item.tone === tone));
      return [...withoutDup.slice(-3), { id, message: text, tone }];
    });
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted
        ? createPortal(
            <div className={styles.host} aria-live="polite" aria-relevant="additions" aria-atomic="true">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className={styles.toast}
                    data-tone={item.tone}
                    role="status"
                    initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.26, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {item.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    } satisfies ToastApi;
  }
  return ctx;
}
