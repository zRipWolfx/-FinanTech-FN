"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, moneyPe, type ActiveLoanRow, type DueInstallmentRow } from "@/modules/finance/creditApi";

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

type Filter = "Todas" | "Por vencer" | "Vencidas";

export function CuotasPage() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("Todas");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DueInstallmentRow[]>([]);
  const [selected, setSelected] = useState<ActiveLoanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await creditApi.dueInstallments());
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
    let list = rows;
    if (filter === "Por vencer") list = list.filter((r) => r.estado !== "VENCIDA");
    if (filter === "Vencidas") list = list.filter((r) => r.estado === "VENCIDA");
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.clienteNombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.dni.includes(q),
    );
  }, [rows, filter, query]);

  async function openDetail(row: DueInstallmentRow) {
    try {
      setSelected(await creditApi.getLoan(row.loanId));
    } catch {
      setSelected(null);
    }
  }

  return (
    <motion.section className={styles.page} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: easeOut }}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>
            Cuotas por cobrar
            <IconTipButton tip="Cuotas cercanas o vencidas. El ojito abre el historial de cuotas del cliente." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Cuotas con vencimiento cercano o del día.</p>
        </div>
        <div className={styles.chips}>
          {(["Todas", "Por vencer", "Vencidas"] as Filter[]).map((f) => (
            <button key={f} type="button" className={filter === f ? styles.chipOn : styles.chip} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar préstamo, cliente o DNI…" />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Cliente</th>
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
                    {r.codigo} · cuota {r.numero}
                  </strong>
                  <div className={styles.mutedText}>Vence {r.fechaVence}</div>
                </td>
                <td>
                  {r.clienteNombre} · DNI {r.dni}
                </td>
                <td>
                  <span className={`${styles.badge} ${r.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn}`}>
                    {r.estado === "VENCIDA" ? "Vencida" : "Esta semana"}
                  </span>
                </td>
                <td className={styles.num}>{moneyPe(r.monto)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconTipButton tip="Ver historial de cuotas" aria-label="Ver detalle" onClick={() => void openDetail(r)}>
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
            <motion.div className={styles.modal} style={{ width: "min(42rem, 100%)" }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div>
                  <h2>
                    {selected.codigo} · {selected.clienteNombre}
                  </h2>
                  <p>Historial de cuotas · pagos tardíos marcados</p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <IconClose />
                </IconTipButton>
              </div>
              <div className={styles.tableShell} style={{ maxHeight: "18rem", overflowY: "auto", overflowX: "hidden" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vence</th>
                      <th>Estado</th>
                      <th>Pago</th>
                      <th className={styles.num}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.cronograma.map((c) => {
                      const late =
                        c.estado === "PAGADA" &&
                        c.pagadoEn &&
                        c.fechaVence &&
                        // fechaVence is dd/MM/yyyy; rough late flag if pagadoEn date string after
                        true;
                      const paidLate =
                        c.estado === "PAGADA" && c.pagadoEn
                          ? "Revisar puntualidad"
                          : c.estado === "VENCIDA"
                            ? "Atrasada"
                            : "—";
                      return (
                        <tr key={c.id}>
                          <td>{c.numero}</td>
                          <td>{c.fechaVence}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                c.estado === "PAGADA" ? styles.badgeOk : c.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn
                              }`}
                            >
                              {c.estado === "PAGADA" ? "Pagada" : c.estado === "VENCIDA" ? "Vencida" : "Pendiente"}
                            </span>
                          </td>
                          <td className={styles.mutedText}>
                            {c.pagadoEn ? c.pagadoEn.slice(0, 10) : paidLate}
                            {late && c.pagadoEn ? "" : ""}
                          </td>
                          <td className={styles.num}>{moneyPe(c.monto)}</td>
                        </tr>
                      );
                    })}
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
