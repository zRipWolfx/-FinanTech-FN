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

type Filter = "Todos" | "Al día" | "En mora";

export function CarteraClientesPage() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("Todos");
  const [rows, setRows] = useState<ActiveLoanRow[]>([]);
  const [selected, setSelected] = useState<ActiveLoanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await creditApi.listLoans("VIGENTE"));
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
    if (filter === "Al día") return rows.filter((r) => !r.enMora);
    if (filter === "En mora") return rows.filter((r) => r.enMora);
    return rows;
  }, [rows, filter]);

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
            Cartera de clientes
            <IconTipButton tip="Clientes con crédito vigente y datos de contacto en el detalle." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Personas con crédito activo o en cobranza.</p>
        </div>
        <div className={styles.chips}>
          {(["Todos", "Al día", "En mora"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? styles.chipOn : styles.chip}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th className={styles.num}>Saldo</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className={styles.personText}>
                    <strong>{r.clienteNombre}</strong>
                    <span>DNI {r.dni}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${r.enMora ? styles.badgeBad : styles.badgeOk}`}>
                    {r.enMora ? "En mora" : "Al día"}
                  </span>
                </td>
                <td className={styles.num}>{moneyPe(r.saldo)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconTipButton tip="Ver perfil" aria-label="Ver perfil" onClick={() => setSelected(r)}>
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
            <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div>
                  <h2>{selected.clienteNombre}</h2>
                  <p>
                    DNI {selected.dni} · {selected.codigo}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <IconClose />
                </IconTipButton>
              </div>
              <div className={styles.summary}>
                <p>
                  <span>Monto prestado</span>
                  <strong>{moneyPe(selected.monto)}</strong>
                </p>
                <p>
                  <span>Saldo pendiente</span>
                  <strong>{moneyPe(selected.saldo)}</strong>
                </p>
                <p>
                  <span>Cuota mensual</span>
                  <strong>{moneyPe(selected.cuotaMonto)}</strong>
                </p>
                <p>
                  <span>Estado</span>
                  <strong>{selected.enMora ? "En mora" : "Al día"}</strong>
                </p>
                <p>
                  <span>Próximo vencimiento</span>
                  <strong>{selected.proximoVence ?? "—"}</strong>
                </p>
                <p>
                  <span>Día de pago</span>
                  <strong>{selected.diaPago}</strong>
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
