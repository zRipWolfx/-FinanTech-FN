"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, moneyPe, type ActiveLoanRow } from "@/modules/finance/creditApi";

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function MoraPage() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ActiveLoanRow[]>([]);
  const [selected, setSelected] = useState<ActiveLoanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await creditApi.listLoans("VIGENTE");
      setRows(list.filter((l) => l.enMora));
    } catch {
      setRows([]);
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
      (r) =>
        r.clienteNombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.dni.includes(q),
    );
  }, [rows, query]);

  return (
    <motion.section className={styles.page} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: easeOut }}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>
            Préstamos en mora
            <IconTipButton tip="Créditos con cuotas vencidas. Revisa el detalle y el historial de atraso." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Créditos con cuotas vencidas que requieren cobranza.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente, DNI o préstamo…" />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconEye />
          </div>
          <h2 className={styles.emptyStateTitle}>Nadie en mora</h2>
          <p className={styles.emptyStateText}>Cuando haya cuotas vencidas aparecerán aquí.</p>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Préstamo</th>
              <th>Detalle</th>
              <th>Estado</th>
              <th className={styles.num}>Vencido</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const overdue = r.cronograma.filter((c) => c.estado === "VENCIDA");
              const overdueAmt = overdue.reduce((s, c) => s + Number(c.monto), 0);
              return (
                <tr key={r.id}>
                  <td>
                    <div className={styles.person}>
                      <span className={styles.avatar}>R</span>
                      <div className={styles.personText}>
                        <strong>
                          {r.codigo} · {r.clienteNombre}
                        </strong>
                        <span>DNI {r.dni}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.mutedText}>
                    {overdue.length} cuotas vencidas · saldo {moneyPe(r.saldo)}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeBad}`}>En mora</span>
                  </td>
                  <td className={styles.num}>{moneyPe(overdueAmt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <IconTipButton tip="Ver detalle" aria-label="Ver detalle" onClick={() => setSelected(r)}>
                        <IconEye />
                      </IconTipButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div>
                  <h2>
                    {selected.codigo} · {selected.clienteNombre}
                  </h2>
                  <p>DNI {selected.dni} · {selected.diaPago}</p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <IconClose />
                </IconTipButton>
              </div>
              <div className={styles.summary}>
                <p>
                  <span>Saldo pendiente</span>
                  <strong>{moneyPe(selected.saldo)}</strong>
                </p>
                <p>
                  <span>Cuota</span>
                  <strong>{moneyPe(selected.cuotaMonto)}</strong>
                </p>
                <p>
                  <span>Progreso</span>
                  <strong>{selected.progresoPct}%</strong>
                </p>
                <p>
                  <span>Próximo vencimiento</span>
                  <strong>{selected.proximoVence ?? "—"}</strong>
                </p>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setSelected(null)}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
