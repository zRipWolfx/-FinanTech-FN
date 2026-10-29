"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import styles from "./IconTipButton.module.css";

type IconTipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tip: string;
  tone?: "default" | "primary" | "danger";
  children: ReactNode;
};

type TipAlign = "left" | "center" | "right";

type TipCoords = {
  top: number;
  left: number;
  align: TipAlign;
};

export function IconTipButton({
  tip,
  tone = "default",
  children,
  className,
  type = "button",
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  ...props
}: IconTipButtonProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const placeTip = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxW = Math.min(240, window.innerWidth - 16);
    let align: TipAlign = "center";
    if (centerX < maxW / 2 + 12) align = "left";
    else if (window.innerWidth - centerX < maxW / 2 + 12) align = "right";

    setCoords({
      top: Math.max(8, rect.top - 8),
      left: centerX,
      align,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    placeTip();
    const onScroll = () => placeTip();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, placeTip, tip]);

  return (
    <span
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ""}`.trim()}
      onMouseEnter={(e) => {
        setOpen(true);
        onMouseEnter?.(e as never);
      }}
      onMouseLeave={(e) => {
        setOpen(false);
        onMouseLeave?.(e as never);
      }}
    >
      <button
        type={type}
        className={styles.btn}
        data-tone={tone}
        aria-describedby={open ? tipId : undefined}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        {...props}
      >
        {children}
      </button>
      {mounted && open && coords
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              className={styles.tipFixed}
              data-align={coords.align}
              style={{
                top: coords.top,
                left: coords.left,
              }}
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.5 5.5 18.5 11.5M4 20l1.2-4.4L15.7 5.1a1.6 1.6 0 0 1 2.3 0l1 1a1.6 1.6 0 0 1 0 2.3L8.4 18.8 4 20Z"
      />
    </svg>
  );
}

export function IconSend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 11.5 20 4l-5.5 16-2.8-6.2L4 11.5Z"
      />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

export function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5 19 6.5v5.2c0 4.4-2.9 7.5-7 8.8-4.1-1.3-7-4.4-7-8.8V6.5L12 3.5Z"
      />
    </svg>
  );
}

export function IconShieldOff() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5 20 19.5M8.2 5.3 12 3.5 19 6.5v4.4M5.4 9.1v2.6c0 3.4 1.7 5.9 4.2 7.5M19 14.2c-.5 1.8-1.6 3.3-3.2 4.4"
      />
    </svg>
  );
}

export function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M9.5 12H18"
      />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11a8 8 0 1 0-2.2 5.5M20 11V5m0 6h-6"
      />
    </svg>
  );
}

export function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M8 8h10v12H8zM6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
      />
    </svg>
  );
}

export function IconLink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M10 14a4 4 0 0 0 5.7.2l2-2a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7-.2l-2 2a4 4 0 0 0 5.7 5.7l1-1"
      />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

export function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M9.8 9.4a2.3 2.3 0 0 1 4.3 1c0 1.4-2.1 1.8-2.1 3.1M12 16.5h.01"
      />
    </svg>
  );
}

export function IconVerify() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5 19 6.5v5.2c0 4.4-2.9 7.5-7 8.8-4.1-1.3-7-4.4-7-8.8V6.5L12 3.5Z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="m8.6 12.2 2.3 2.3 4.5-4.6" />
    </svg>
  );
}

export function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
      />
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.5 6.3A9.2 9.2 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.5M7 7.6C4.4 9.2 2.5 12 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7"
      />
    </svg>
  );
}
