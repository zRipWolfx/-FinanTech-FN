"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, type NotificationRow } from "@/modules/finance/creditApi";

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function GestionesPage() {
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await creditApi.staffNotifications());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.titulo.toLowerCase().includes(q) || r.mensaje.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <motion.section
      className={styles.page}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>
            Notificaciones
            <IconTipButton tip="Avisos de aprobaciones, pagos, recordatorios y cambios de cronograma." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Historial de avisos de préstamos y pagos a clientes.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar notificación, cliente o DNI…"
            aria-label="Buscar notificaciones"
          />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconHelp />
          </div>
          <h2 className={styles.emptyStateTitle}>Sin notificaciones</h2>
          <p className={styles.emptyStateText}>Cuando haya pagos, recordatorios o cambios de crédito, aparecerán aquí.</p>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aviso</th>
              <th>Detalle</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.titulo}</strong>
                </td>
                <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{r.mensaje}</td>
                <td>
                  <span className={`${styles.badge} ${r.leida ? styles.badgeMuted : styles.badgeInfo}`}>
                    {r.leida ? "Leída" : "Nueva"}
                  </span>
                </td>
                <td style={{ fontSize: "0.78rem", color: "#64748b" }}>{r.creadoEn.slice(0, 19).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
