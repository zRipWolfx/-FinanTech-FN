"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";

import { BrandMark } from "@/modules/shared/ui/BrandMark";
import styles from "./AccessGate.module.css";

export function AccessGate() {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (reduce || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { duration: 0.55, ease: "power2.out" },
      });

      timeline
        .from("[data-anim='brand']", { opacity: 0, y: 18 })
        .from("[data-anim='intro']", { opacity: 0, y: 18 }, "-=0.28")
        .from(
          "[data-anim='card']",
          { opacity: 0, y: 22, stagger: 0.08 },
          "-=0.2",
        );
    }, rootRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <main ref={rootRef} className={styles.page}>
      <section className={styles.hero}>
        <div data-anim="brand">
          <BrandMark />
        </div>

        <div className={styles.intro} data-anim="intro">
          <p className={styles.kicker}>Acceso seguro</p>
          <h1 className={styles.title}>
            Dos puertas.
            <br />
            Un solo panel FinanTech.
          </h1>
          <p className={styles.copy}>
            Elige el tipo de ingreso. Personal de FinanTech S.A. con correo, o
            clientes con DNI.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.card} data-anim="card">
            <span className={styles.badge}>Empresa</span>
            <h2 className={styles.cardTitle}>Correo y contraseña</h2>
            <p className={styles.cardCopy}>
              Para usuarios internos que se registran con su correo
              corporativo.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/">
                Iniciar sesión
              </Link>
              <Link className={styles.secondary} href="/registro/empresa">
                Registrarse
              </Link>
            </div>
          </article>

          <article className={styles.card} data-anim="card">
            <span className={styles.badge}>Operativo</span>
            <h2 className={styles.cardTitle}>DNI y contraseña</h2>
            <p className={styles.cardCopy}>
              Acceso con documento de identidad para consultar el préstamo
              y registrar pagos.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/">
                Iniciar sesión
              </Link>
              <Link className={styles.secondary} href="/registro/dni">
                Registrarse
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
