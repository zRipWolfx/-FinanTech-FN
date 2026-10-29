"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import { easeOut } from "@/modules/shared/lib/motion";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, moneyPe, type ActiveLoanRow, type PaymentRow } from "@/modules/finance/creditApi";

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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

export function RegistrarPagoPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [loans, setLoans] = useState<ActiveLoanRow[]>([]);
  const [history, setHistory] = useState<PaymentRow[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loanId, setLoanId] = useState("");
  const [installmentId, setInstallmentId] = useState("");
  const [medio, setMedio] = useState("Yape");
  const [detalle, setDetalle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await creditApi.listLoans("VIGENTE");
      setLoans(list);
      const payments = list.flatMap((l) =>
        // historial se arma desde dossier; aquí usamos vouchers via last pay feed empty until pay
        [] as PaymentRow[],
      );
      void payments;
      // Cargar historial por cada cliente vigente (dossier)
      const dossiers = await Promise.all(list.map((l) => creditApi.dossier(l.dni).catch(() => null)));
      const pagos = dossiers.flatMap((d) => d?.historialPagos ?? []);
      pagos.sort((a, b) => String(b.creadoEn).localeCompare(String(a.creadoEn)));
      setHistory(pagos);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = loans.find((l) => String(l.id) === loanId) ?? null;
  const pending = useMemo(
    () => selected?.cronograma.filter((c) => c.estado !== "PAGADA") ?? [],
    [selected],
  );

  useEffect(() => {
    if (pending[0]) setInstallmentId(String(pending[0].id));
  }, [pending]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (r) =>
        r.codigoVoucher.toLowerCase().includes(q) ||
        r.medio.toLowerCase().includes(q) ||
        r.cuotasCubiertas.includes(q) ||
        r.detalleMedio.toLowerCase().includes(q),
    );
  }, [history, query]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    try {
      const paid = await creditApi.staffPay(selected.id, {
        modo: "CUOTA",
        installmentId: Number(installmentId),
        medio,
        detalleMedio: detalle || undefined,
      });
      setHistory((prev) => [paid, ...prev]);
      toast.success("Pago registrado");
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
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
            Registrar pago
            <IconTipButton tip="Aplica una cuota al préstamo vigente del cliente. Queda en historial y caja." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Historial de pagos aplicados a créditos vigentes.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setLoanId(loans[0] ? String(loans[0].id) : "");
              setDetalle("");
              setMedio("Yape");
              setOpen(true);
            }}
          >
            <IconPlus />
            Nuevo pago
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar voucher, medio o cuota…" />
        </label>
      </div>

      {loading ? <p className={styles.empty}>Cargando…</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <IconPlus />
          </div>
          <h2 className={styles.emptyStateTitle}>Sin pagos aún</h2>
          <p className={styles.emptyStateText}>Cuando registres un pago aparecerá aquí el historial con voucher.</p>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Voucher</th>
              <th>Medio</th>
              <th>Cuotas</th>
              <th className={styles.num}>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.codigoVoucher}</td>
                <td>
                  {r.medio}
                  {r.detalleMedio ? <div className={styles.mutedText}>{r.detalleMedio}</div> : null}
                </td>
                <td>{r.cuotasCubiertas}</td>
                <td className={styles.num}>{moneyPe(r.monto)}</td>
                <td className={styles.mutedText}>{r.creadoEn.slice(0, 19).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.form
              className={styles.modal}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void onCreate(e)}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Registrar pago</h2>
                  <p>Selecciona el préstamo y la cuota pendiente.</p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setOpen(false)}>
                  <IconClose />
                </IconTipButton>
              </div>
              <div className={styles.formGrid}>
                <ComboSelect
                  label="Préstamo / cliente"
                  value={loanId}
                  options={loans.map((l) => ({
                    value: String(l.id),
                    label: `${l.codigo} · ${l.clienteNombre} · DNI ${l.dni}`,
                  }))}
                  onChange={setLoanId}
                />
                <ComboSelect
                  label="Cuota"
                  value={installmentId}
                  options={pending.map((p) => ({
                    value: String(p.id),
                    label: `#${p.numero} · ${p.fechaVence} · ${moneyPe(p.monto)} · ${p.estado}`,
                  }))}
                  onChange={setInstallmentId}
                />
                <ComboSelect
                  label="Medio"
                  value={medio}
                  options={[
                    { value: "Yape", label: "Yape" },
                    { value: "Plin", label: "Plin" },
                    { value: "Transferencia", label: "Transferencia" },
                    { value: "Efectivo", label: "Efectivo" },
                    { value: "Tarjeta", label: "Tarjeta" },
                  ]}
                  onChange={setMedio}
                />
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Detalle (opcional)</span>
                  <input value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="N° operación" />
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving || !pending.length}>
                  {saving ? "Registrando…" : "Aplicar pago"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
