"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import {
  creditApi,
  moneyPe,
  type ActiveLoanRow,
  type CashSummary,
  type DueInstallmentRow,
} from "@/modules/finance/creditApi";

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ReporteCarteraPage() {
  const reduceMotion = useReducedMotion();
  const [loans, setLoans] = useState<ActiveLoanRow[]>([]);
  const [cash, setCash] = useState<CashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, c] = await Promise.all([creditApi.listLoans("VIGENTE"), creditApi.cash()]);
      setLoans(l);
      setCash(c);
    } catch {
      setLoans([]);
      setCash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const alDia = loans.filter((l) => !l.enMora).length;
    const mora = loans.filter((l) => l.enMora).length;
    const colocado = loans.reduce((s, l) => s + Number(l.saldo), 0);
    return { alDia, mora, colocado, vigentes: loans.length };
  }, [loans]);

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
            Reporte de cartera
            <IconTipButton tip="Caja disponible (S/ 2,000,000 base), desembolsos y cobros reales." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Saldo en caja, salidas por préstamos y entradas por pagos.</p>
        </div>
      </header>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}

      <div className={styles.summary}>
        <p>
          <span>Saldo en caja</span>
          <strong>{moneyPe(cash?.saldoDisponible)}</strong>
        </p>
        <p>
          <span>Desembolsado</span>
          <strong>{moneyPe(cash?.totalDesembolsado)}</strong>
        </p>
        <p>
          <span>Cobrado</span>
          <strong>{moneyPe(cash?.totalCobrado)}</strong>
        </p>
        <p>
          <span>Vigentes</span>
          <strong>{stats.vigentes}</strong>
        </p>
        <p>
          <span>Al día</span>
          <strong>{stats.alDia}</strong>
        </p>
        <p>
          <span>En mora</span>
          <strong>{stats.mora}</strong>
        </p>
        <p>
          <span>Saldo colocado</span>
          <strong>{moneyPe(stats.colocado)}</strong>
        </p>
      </div>

      <h3 className={styles.subtitle}>Movimientos de caja</h3>
      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Detalle</th>
              <th className={styles.num}>Monto</th>
              <th className={styles.num}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {(cash?.movimientos ?? []).slice(0, 40).map((m) => (
              <tr key={m.id}>
                <td>
                  <span
                    className={`${styles.badge} ${
                      m.tipo === "DESEMBOLSO" ? styles.badgeBad : m.tipo === "COBRO" ? styles.badgeOk : styles.badgeInfo
                    }`}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {m.detalle}
                  {m.refCodigo ? ` · ${m.refCodigo}` : ""}
                </td>
                <td className={styles.num}>{m.monto.startsWith("-") || m.monto.startsWith("+") ? m.monto.replace("+", "+S/ ").replace("-", "-S/ ") : moneyPe(m.monto)}</td>
                <td className={styles.num}>{moneyPe(m.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subtitle}>Préstamos vigentes</h3>
      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Préstamo</th>
              <th>Estado</th>
              <th>Progreso</th>
              <th className={styles.num}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.codigo} · {p.clienteNombre}
                </td>
                <td>
                  <span className={`${styles.badge} ${p.enMora ? styles.badgeBad : styles.badgeOk}`}>
                    {p.enMora ? "En mora" : "Al día"}
                  </span>
                </td>
                <td>{p.progresoPct}%</td>
                <td className={styles.num}>{moneyPe(p.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

export function ReporteCobranzaPage() {
  const reduceMotion = useReducedMotion();
  const [due, setDue] = useState<DueInstallmentRow[]>([]);
  const [cash, setCash] = useState<CashSummary | null>(null);

  useEffect(() => {
    void Promise.all([creditApi.dueInstallments(), creditApi.cash()])
      .then(([d, c]) => {
        setDue(d);
        setCash(c);
      })
      .catch(() => undefined);
  }, []);

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
            Reporte de cobranzas
            <IconTipButton tip="Cobrado en caja y cuotas aún pendientes." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Entradas por pagos y pendientes por cobrar.</p>
        </div>
      </header>

      <div className={styles.summary}>
        <p>
          <span>Cobrado</span>
          <strong>{moneyPe(cash?.totalCobrado)}</strong>
        </p>
        <p>
          <span>Programado pendiente</span>
          <strong>{moneyPe(due.reduce((s, r) => s + Number(r.monto), 0))}</strong>
        </p>
        <p>
          <span>Cuotas por cobrar</span>
          <strong>{due.length}</strong>
        </p>
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cuota pendiente</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th className={styles.num}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {due.map((r) => (
              <tr key={r.installmentId}>
                <td>
                  {r.codigo} · cuota {r.numero}
                </td>
                <td>{r.clienteNombre}</td>
                <td>
                  <span className={`${styles.badge} ${r.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn}`}>
                    {r.estado === "VENCIDA" ? "Vencida" : "Esta semana"}
                  </span>
                </td>
                <td className={styles.num}>{moneyPe(r.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
