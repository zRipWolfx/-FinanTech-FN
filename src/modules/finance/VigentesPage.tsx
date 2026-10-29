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

function ProgressBar({ pct }: { pct: number }) {
  const value = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div style={{ display: "grid", gap: "0.25rem", minWidth: 0 }}>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "var(--progress-track, #e8eef5)",
          overflow: "hidden",
          border: "1px solid var(--line, #d7e3ef)",
          minWidth: "4.5rem",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: value >= 100 ? "var(--ok, #16a34a)" : "var(--accent, #2563eb)",
            borderRadius: 999,
          }}
        />
      </div>
      <span className={styles.mutedText}>
        {value}% · cuota avance
      </span>
    </div>
  );
}

function estadoLabel(loan: ActiveLoanRow) {
  if (loan.estado === "LIQUIDADO") return "Liquidado";
  if (loan.enMora || loan.estado === "EN_MORA") return "En mora";
  return "Al día";
}

export function VigentesPage() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ActiveLoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ActiveLoanRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await creditApi.listLoans("VIGENTE"));
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
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.dni.includes(q) ||
        estadoLabel(p).toLowerCase().includes(q),
    );
  }, [query, rows]);

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
            Préstamos vigentes
            <IconTipButton tip="Créditos desembolsados. Usa Ver para revisar cuotas, puntualidad y saldo pendiente." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Créditos desembolsados que siguen en cobranza.</p>
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
            placeholder="Buscar préstamo, cliente o DNI…"
            aria-label="Buscar préstamos"
          />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando vigentes…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconEye />
          </div>
          <h2 className={styles.emptyStateTitle}>Sin préstamos vigentes</h2>
          <p className={styles.emptyStateText}>Cuando apruebes una solicitud, el desembolso aparecerá aquí con su progreso.</p>
        </div>
      ) : null}

      <div className={styles.mobileList}>
        {filtered.map((p) => (
          <article key={p.id} className={styles.card}>
            <div className={styles.person}>
              <span className={styles.avatar}>P</span>
              <div className={styles.personText}>
                <strong>
                  {p.codigo} · {p.clienteNombre}
                </strong>
                <span>
                  Saldo {moneyPe(p.saldo)} · cuota {p.cuotasPagadas} de {p.cuotas}
                </span>
              </div>
            </div>
            <ProgressBar pct={p.progresoPct} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <span className={`${styles.badge} ${p.enMora ? styles.badgeBad : styles.badgeOk}`}>{estadoLabel(p)}</span>
              <strong>{moneyPe(p.monto)}</strong>
            </div>
            <div className={styles.rowActions}>
              <IconTipButton tip="Ver cuotas" aria-label="Ver cuotas" onClick={() => setSelected(p)}>
                <IconEye />
              </IconTipButton>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Préstamo</th>
              <th style={{ width: "22%" }}>Detalle</th>
              <th style={{ width: "16%" }}>Progreso</th>
              <th style={{ width: "12%" }}>Estado</th>
              <th className={styles.num} style={{ width: "12%" }}>
                Monto
              </th>
              <th style={{ width: "10%", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className={styles.person}>
                    <span className={styles.avatar}>P</span>
                    <div className={styles.personText}>
                      <strong>
                        {p.codigo} · {p.clienteNombre}
                      </strong>
                      <span>DNI {p.dni}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.mutedText}>
                    Saldo {moneyPe(p.saldo)} · cuota {p.cuotasPagadas} de {p.cuotas} · faltan {p.cuotasPendientes}
                  </span>
                </td>
                <td>
                  <ProgressBar pct={p.progresoPct} />
                </td>
                <td>
                  <span className={`${styles.badge} ${p.enMora ? styles.badgeBad : styles.badgeOk}`}>{estadoLabel(p)}</span>
                </td>
                <td className={styles.num}>{moneyPe(p.monto)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconTipButton tip="Ver cuotas" aria-label="Ver cuotas" onClick={() => setSelected(p)}>
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
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className={styles.modal}
              style={{ width: "min(40rem, 100%)", maxHeight: "min(92vh, 46rem)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>
                    {selected.codigo} · {selected.clienteNombre}
                  </h2>
                  <p>
                    DNI {selected.dni} · día de pago: {selected.diaPago}
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
                  <span>Cuotas pagadas</span>
                  <strong>
                    {selected.cuotasPagadas} / {selected.cuotas}
                  </strong>
                </p>
                <p>
                  <span>Cuotas que faltan</span>
                  <strong>{selected.cuotasPendientes}</strong>
                </p>
                <p>
                  <span>Cuota</span>
                  <strong>{moneyPe(selected.cuotaMonto)}</strong>
                </p>
                <p>
                  <span>Próximo vencimiento</span>
                  <strong>{selected.proximoVence ?? "—"}</strong>
                </p>
                <p>
                  <span>Estado del crédito</span>
                  <strong>{estadoLabel(selected)}</strong>
                </p>
                <p>
                  <span>Progreso</span>
                  <strong>{selected.progresoPct}%</strong>
                </p>
              </div>

              <div className={styles.tableShell} style={{ maxHeight: "16rem", overflowY: "auto", overflowX: "hidden" }}>
                <table className={styles.table} style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vence</th>
                      <th>Estado</th>
                      <th className={styles.num}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.cronograma.map((c) => (
                      <tr key={c.id}>
                        <td>{c.numero}</td>
                        <td>{c.fechaVence}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              c.estado === "PAGADA"
                                ? styles.badgeOk
                                : c.estado === "VENCIDA"
                                  ? styles.badgeBad
                                  : styles.badgeWarn
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
