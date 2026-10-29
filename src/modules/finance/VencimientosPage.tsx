"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, moneyPe, type DueInstallmentRow } from "@/modules/finance/creditApi";

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M4 12 20 4l-6 16-2.5-6.5L4 12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function VencimientosPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DueInstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await creditApi.dueInstallments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.clienteNombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.dni.includes(q) ||
        r.estado.toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function remind(row: DueInstallmentRow) {
    if (busyId) return;
    setBusyId(row.installmentId);
    try {
      const res = await creditApi.sendReminder({
        loanId: row.loanId,
        installmentId: row.installmentId,
        mensaje: `Hola ${row.clienteNombre}, no olvides que hoy/pronto tienes la cuota ${row.numero} de ${row.codigo} por ${moneyPe(row.monto)} pendiente con FinanTech S.A.`,
      });
      toast.success(res.correoEnviado ? "Recordatorio enviado por correo" : "Aviso registrado al cliente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo notificar");
    } finally {
      setBusyId(null);
    }
  }

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
            Vencimientos
            <IconTipButton tip="Cuotas por vencer o ya vencidas. Usa el icono de enviar para recordar al cliente." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Cuotas que vencen pronto o ya están atrasadas.</p>
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
            placeholder="Buscar cliente, préstamo o estado…"
            aria-label="Buscar vencimientos"
          />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconSend />
          </div>
          <h2 className={styles.emptyStateTitle}>Sin vencimientos</h2>
          <p className={styles.emptyStateText}>No hay cuotas por cobrar en los próximos días.</p>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vencimiento</th>
              <th>Detalle</th>
              <th>Estado</th>
              <th className={styles.num}>Monto</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.installmentId}>
                <td>
                  <strong>
                    {r.fechaVence} · {r.clienteNombre}
                  </strong>
                </td>
                <td style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {r.codigo} · cuota {r.numero} · DNI {r.dni}
                </td>
                <td>
                  <span className={`${styles.badge} ${r.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn}`}>
                    {r.estado === "VENCIDA" ? "En mora" : "Por cobrar"}
                  </span>
                </td>
                <td className={styles.num}>{moneyPe(r.monto)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconTipButton
                      tip="Enviar recordatorio"
                      aria-label="Enviar recordatorio"
                      disabled={busyId === r.installmentId}
                      onClick={() => void remind(r)}
                    >
                      <IconSend />
                    </IconTipButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
