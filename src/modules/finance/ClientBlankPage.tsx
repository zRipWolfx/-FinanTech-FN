"use client";

import styles from "./Finance.module.css";

type ClientBlankPageProps = {
  title: string;
};

export function ClientBlankPage({ title }: ClientBlankPageProps) {
  return (
    <section className={styles.wrap}>
      <div className={styles.blank}>
        <h1>{title}</h1>
        <p>Vista del cliente en construcción. Aquí verás tu préstamo, cuotas y pagos cuando la habilitemos.</p>
      </div>
    </section>
  );
}
