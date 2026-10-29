"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { useToast } from "@/modules/shared/ui/FloatingToast";
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

type FlatRow = {
  loan: ActiveLoanRow;
  numero: number;
  fechaVence: string;
  monto: string;
  estado: string;
  installmentId: number;
};

export function CronogramasPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [loans, setLoans] = useState<ActiveLoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ActiveLoanRow | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLoans(await creditApi.listLoans("VIGENTE"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const flat = useMemo(() => {
    const rows: FlatRow[] = [];
    for (const loan of loans) {
      for (const c of loan.cronograma) {
        if (c.estado === "PAGADA") continue;
        rows.push({
          loan,
          numero: c.numero,
          fechaVence: c.fechaVence,
          monto: c.monto,
          estado: c.estado,
          installmentId: c.id,
        });
      }
    }
    return rows;
  }, [loans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter(
      (r) =>
        r.loan.codigo.toLowerCase().includes(q) ||
        r.loan.clienteNombre.toLowerCase().includes(q) ||
        r.fechaVence.toLowerCase().includes(q) ||
        r.estado.toLowerCase().includes(q),
    );
  }, [flat, query]);

  function openLoan(loan: ActiveLoanRow) {
    setSelected(loan);
    const parts = loan.fechaInicio.split("/");
    if (parts.length === 3) {
      setFechaInicio(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      setFechaInicio("");
    }
  }

  async function onShift(e: FormEvent) {
    e.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    try {
      const updated = await creditApi.shiftSchedule(selected.id, fechaInicio);
      setSelected(updated);
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      toast.success("Cronograma actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo editar");
    } finally {
      setSaving(false);
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
            Cronogramas
            <IconTipButton tip="Cuotas pendientes. Puedes cambiar el día de inicio y se recalcula la secuencia." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Cuotas pactadas de cada préstamo vigente.</p>
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
            placeholder="Buscar préstamo, cliente o fecha…"
            aria-label="Buscar cronogramas"
          />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconEye />
          </div>
          <h2 className={styles.emptyStateTitle}>Sin cuotas pendientes</h2>
          <p className={styles.emptyStateText}>No hay cronogramas por mostrar en este momento.</p>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Registro</th>
              <th>Detalle</th>
              <th>Día de pago</th>
              <th>Estado</th>
              <th className={styles.num}>Monto</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.loan.id}-${r.installmentId}`}>
                <td>
                  <div className={styles.person}>
                    <span className={styles.avatar}>P</span>
                    <div className={styles.personText}>
                      <strong>
                        {r.loan.codigo} · Cuota {r.numero}
                      </strong>
                      <span>{r.loan.clienteNombre}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.mutedText}>Vence {r.fechaVence} · capital + interés</td>
                <td>{r.loan.diaPago}</td>
                <td>
                  <span className={`${styles.badge} ${r.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn}`}>
                    {r.estado === "VENCIDA" ? "Vencida" : "Por vencer"}
                  </span>
                </td>
                <td className={styles.num}>{moneyPe(r.monto)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconTipButton tip="Ver / editar" aria-label="Ver cronograma" onClick={() => openLoan(r.loan)}>
                      <IconEye />
                    </IconTipButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div
              className={styles.modal}
              style={{ width: "min(42rem, 100%)", maxHeight: "min(92vh, 48rem)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Cronograma {selected.codigo}</h2>
                  <p>
                    {selected.clienteNombre} · {selected.diaPago} · cuota {moneyPe(selected.cuotaMonto)} · saldo{" "}
                    {moneyPe(selected.saldo)}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <IconClose />
                </IconTipButton>
              </div>

              <form className={styles.formCard} onSubmit={onShift} style={{ marginBottom: "0.75rem" }}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Nueva fecha de inicio (recalcula cuotas pendientes)</span>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
                </label>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary} disabled={saving}>
                    {saving ? "Guardando…" : "Aplicar nuevo día de pago"}
                  </button>
                </div>
              </form>

              <div className={styles.tableShell} style={{ maxHeight: "18rem", overflowY: "auto", overflowX: "hidden" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Capital</th>
                      <th>Interés</th>
                      <th>Estado</th>
                      <th className={styles.num}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.cronograma.map((c) => (
                      <tr key={c.id}>
                        <td>{c.numero}</td>
                        <td>{c.fechaVence}</td>
                        <td>{moneyPe(c.capital)}</td>
                        <td>{moneyPe(c.interes)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              c.estado === "PAGADA" ? styles.badgeOk : c.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn
                            }`}
                          >
                            {c.estado === "PAGADA" ? "Pagada" : c.estado === "VENCIDA" ? "Vencida" : "Pendiente"}
                          </span>
                        </td>
                        <td className={styles.num}>{moneyPe(c.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
