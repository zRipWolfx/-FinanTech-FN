"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./ComboSelect.module.css";

export type ComboOption = {
  value: string;
  label: string;
};

type ComboSelectProps = {
  label?: string;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  tone?: "default" | "success" | "muted";
  size?: "md" | "sm";
  className?: string;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

export function ComboSelect({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  tone = "default",
  size = "md",
  className,
}: ComboSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);

  const selected = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuH = Math.min(12 * 16, options.length * 40 + 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuH + 12 && rect.top > spaceBelow;
    const width = Math.max(rect.width, size === "sm" ? 7.5 * 16 : 8.5 * 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    setPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onReposition = () => place();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length, size]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(listId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, listId]);

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ""}`.trim()}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-tone={tone}
        data-size={size}
        data-open={open ? "true" : "false"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.value}>{selected?.label ?? value}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m6 9 6 6 6-6"
          />
        </svg>
      </button>

      {mounted && open && pos
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              className={styles.menu}
              data-open-up={pos.openUp ? "true" : "false"}
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                transform: pos.openUp ? "translateY(-100%)" : undefined,
              }}
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <li key={opt.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={styles.option}
                      data-active={active ? "true" : "false"}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
