"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { BrandMark } from "@/modules/shared/ui/BrandMark";
import { fadeUp, panelTransition } from "@/modules/shared/lib/motion";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  kicker: string;
  title: string;
  copy: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthShell({
  kicker,
  title,
  copy,
  footer,
  children,
}: AuthShellProps) {
  const reduce = useReducedMotion();

  return (
    <main className={styles.shell}>
      <motion.section
        className={styles.frame}
        initial={reduce ? false : fadeUp.initial}
        animate={fadeUp.animate}
        transition={panelTransition}
        data-theme="light"
      >
        <div className={styles.header}>
          <BrandMark compact showText={false} variant="light" />
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.copy}>{copy}</p>
        </div>
        {children}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </motion.section>
    </main>
  );
}
