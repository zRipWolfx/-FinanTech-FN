"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import { easeOut } from "@/modules/shared/lib/motion";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import {
  creditApi,
  downloadHtmlAsPdfProxy,
  moneyPe,
  printHtmlAsPdf,
  statusLabel,
  statusTone,
  type CalcResult,
  type ClientPortal,
  type InstallmentRow,
  type PaymentRow,
} from "@/modules/finance/creditApi";

function badge(tone: ReturnType<typeof statusTone>) {
  if (tone === "ok") return styles.badgeOk;
  if (tone === "warn") return styles.badgeWarn;
  if (tone === "bad") return styles.badgeBad;
  if (tone === "info") return styles.badgeInfo;
  return styles.badgeMuted;
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

function usePortal() {
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPortal(await creditApi.portal());
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
  return { portal, loading, error, load, setPortal };
}

function PageShell({
  title,
  tip,
  subtitle,
  actions,
  children,
}: {
  title: string;
  tip: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={styles.page}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easeOut }}
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>
            {title}
            <IconTipButton tip={tip} aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {actions ? <div className={styles.headerActions}>{actions}</div> : null}
      </header>
      {children}
    </motion.section>
  );
}

function IconEmptyLoan() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18M8 14h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <IconEmptyLoan />
      </div>
      <h2 className={styles.emptyStateTitle}>{title}</h2>
      <p className={styles.emptyStateText}>{text}</p>
      {actionLabel && onAction ? (
        <button type="button" className={styles.btnPrimary} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ClientPrestamoPage() {
  const toast = useToast();
  const { portal, loading, error, load } = usePortal();
  const [showForm, setShowForm] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [direccion, setDireccion] = useState("");
  const [trabajo, setTrabajo] = useState("");
  const [ingresos, setIngresos] = useState("");
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("12");
  const [frecuencia, setFrecuencia] = useState<"MENSUAL" | "SEMANAL">("MENSUAL");
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [plazos, setPlazos] = useState<number[]>([6, 8, 12, 18, 24]);

  useEffect(() => {
    creditApi.plazos().then(setPlazos).catch(() => undefined);
  }, []);

  useEffect(() => {
    const m = monto.replace(",", ".");
    const n = Number(cuotas);
    if (!m || Number(m) <= 0 || !Number.isFinite(n)) {
      setCalc(null);
      return;
    }
    const t = window.setTimeout(() => {
      creditApi
        .calculate(m, n, frecuencia)
        .then(setCalc)
        .catch(() => setCalc(null));
    }, 280);
    return () => window.clearTimeout(t);
  }, [monto, cuotas, frecuencia]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await creditApi.createRequest({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        direccion: direccion.trim(),
        trabajo: trabajo.trim(),
        ingresosMensuales: ingresos.replace(",", "."),
        monto: monto.replace(",", "."),
        cuotas: Number(cuotas),
        frecuenciaPago: frecuencia,
      });
      toast.success("Solicitud enviada");
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Tu préstamo" tip="Estado de tu crédito" subtitle="Cargando…">
        <p className={styles.empty}>Cargando datos…</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Tu préstamo" tip="Estado de tu crédito" subtitle="Error">
        <p className={styles.error}>{error}</p>
      </PageShell>
    );
  }

  const loan = portal?.prestamoVigente ?? null;
  const solicitud = portal?.solicitudActiva ?? null;

  if (loan) {
    return (
      <PageShell title="Tu préstamo" tip="Crédito vigente" subtitle={`${loan.codigo} · ${loan.estado}`}>
        <div className={styles.summary}>
          <p>
            <span>Monto</span>
            <strong>{moneyPe(loan.monto)}</strong>
          </p>
          <p>
            <span>Saldo</span>
            <strong>{moneyPe(loan.saldo)}</strong>
          </p>
          <p>
            <span>Cuota</span>
            <strong>{moneyPe(loan.cuotaMonto)}</strong>
          </p>
          <p>
            <span>Plazo</span>
            <strong>
              {loan.cuotas} · {loan.frecuencia === "SEMANAL" ? "semanal" : "mensual"}
            </strong>
          </p>
          <p>
            <span>Interés total</span>
            <strong>{moneyPe(loan.interesTotal)}</strong>
          </p>
          <p>
            <span>Total a pagar</span>
            <strong>{moneyPe(loan.totalPagar)}</strong>
          </p>
        </div>
      </PageShell>
    );
  }

  if (solicitud && solicitud.estado !== "RECHAZADA") {
    return (
      <PageShell title="Tu solicitud" tip="Seguimiento de evaluación" subtitle="Estado de tu pedido de crédito">
        <div className={styles.summary}>
          <p>
            <span>Estado</span>
            <strong>
              <span className={`${styles.badge} ${badge(statusTone(solicitud.estado))}`}>
                {statusLabel(solicitud.estado)}
              </span>
            </strong>
          </p>
          <p>
            <span>Cliente</span>
            <strong>{solicitud.clienteNombre}</strong>
          </p>
          <p>
            <span>DNI</span>
            <strong>{solicitud.dni}</strong>
          </p>
          <p>
            <span>Monto</span>
            <strong>{moneyPe(solicitud.monto)}</strong>
          </p>
          <p>
            <span>Cuota estimada</span>
            <strong>{moneyPe(solicitud.cuotaMensual)}</strong>
          </p>
          <p>
            <span>Total a pagar</span>
            <strong>{moneyPe(solicitud.totalPagar)}</strong>
          </p>
          <p>
            <span>Interés</span>
            <strong>{moneyPe(solicitud.interesTotal)}</strong>
          </p>
          <p>
            <span>Frecuencia</span>
            <strong>{solicitud.frecuenciaPago === "SEMANAL" ? "Semanal" : "Mensual"}</strong>
          </p>
        </div>
        <p className={styles.empty}>
          {solicitud.estado === "APROBADA"
            ? "Aprobada. En breve verás tu cronograma y contrato."
            : "FinanTech está evaluando tu solicitud."}
        </p>
      </PageShell>
    );
  }

  if (!portal?.puedeSolicitar) {
    return (
      <PageShell title="Tu préstamo" tip="Solicitud" subtitle="Sin crédito activo">
        <EmptyState
          title="No puedes solicitar por ahora"
          text="Puede que tengas un bloqueo temporal o una solicitud en evaluación. Revisa notificaciones o tu perfil."
        />
      </PageShell>
    );
  }

  const plazoOptions =
    frecuencia === "SEMANAL"
      ? [4, 8, 12, 16, 24, 36, 52].map((n) => ({ value: String(n), label: `${n} semanas` }))
      : plazos.map((n) => ({ value: String(n), label: `${n} meses` }));

  if (!showForm) {
    return (
      <PageShell title="Tu préstamo" tip="Solicita cuando lo necesites" subtitle="Estado de tu crédito">
        <EmptyState
          title="No cuentas con un préstamo"
          text={
            solicitud?.estado === "RECHAZADA"
              ? "Tu última solicitud fue rechazada. Puedes enviar una nueva cuando quieras."
              : "Cuando solicites un crédito, aquí verás el estado, el monto y el seguimiento hasta el desembolso."
          }
          actionLabel="Solicitar préstamo"
          onAction={() => setShowForm(true)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Solicitar préstamo"
      tip="Completa tus datos. Solo un préstamo vigente por cliente."
      subtitle="Evaluación antes del desembolso"
    >
      <form className={styles.formCard} onSubmit={onSubmit}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombres</span>
            <input value={nombres} onChange={(e) => setNombres(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Apellidos</span>
            <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>DNI</span>
            <input value={portal.dni} readOnly />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Dirección</span>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Trabajo</span>
            <input value={trabajo} onChange={(e) => setTrabajo(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ganancias mensuales</span>
            <input inputMode="decimal" value={ingresos} onChange={(e) => setIngresos(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Monto a prestar</span>
            <input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </label>
          <ComboSelect
            label="Frecuencia de pago"
            value={frecuencia}
            options={[
              { value: "MENSUAL", label: "Mensual" },
              { value: "SEMANAL", label: "Semanal" },
            ]}
            onChange={(v) => {
              setFrecuencia(v as "MENSUAL" | "SEMANAL");
              setCuotas(v === "SEMANAL" ? "12" : "12");
            }}
          />
          <ComboSelect label="Plazo" value={cuotas} options={plazoOptions} onChange={setCuotas} />
        </div>
        {calc ? (
          <div className={styles.summary}>
            <p>
              <span>Cuota</span>
              <strong>{moneyPe(calc.cuotaMensual)}</strong>
            </p>
            <p>
              <span>Interés total</span>
              <strong>{moneyPe(calc.interesTotal)}</strong>
            </p>
            <p>
              <span>Total a pagar</span>
              <strong>{moneyPe(calc.totalPagar)}</strong>
            </p>
            <p>
              <span>Tasa equiv.</span>
              <strong>{calc.tasaMensualEquivalente}% / periodo</strong>
            </p>
          </div>
        ) : null}
        <div className={styles.formActions}>
          <button type="button" className={styles.btnSecondary} onClick={() => setShowForm(false)}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving || !calc}>
            {saving ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export function ClientCronogramaPage() {
  const { portal, loading, error } = usePortal();
  const loan = portal?.prestamoVigente;
  if (loading) return <PageShell title="Tu cronograma" tip="Cuotas" subtitle="Cargando…"><p className={styles.empty}>Cargando…</p></PageShell>;
  if (error) return <PageShell title="Tu cronograma" tip="Cuotas" subtitle="Error"><p className={styles.error}>{error}</p></PageShell>;
  if (!loan) {
    return (
      <PageShell title="Tu cronograma" tip="Se habilita al aprobar" subtitle="Sin préstamo vigente">
        <EmptyState
          title="Sin cronograma aún"
          text="Cuando aprueben tu solicitud verás aquí las fechas, el capital y el interés de cada cuota."
        />
      </PageShell>
    );
  }
  return (
    <PageShell title="Tu cronograma" tip="Amortización" subtitle={`${loan.codigo} · ${loan.cuotas} cuotas`}>
      <ScheduleTable rows={loan.cronograma} />
    </PageShell>
  );
}

function ScheduleTable({ rows }: { rows: InstallmentRow[] }) {
  return (
    <div className={styles.tableShell}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Vence</th>
            <th>Capital</th>
            <th>Interés</th>
            <th>Cuota</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.numero}</td>
              <td>{r.fechaVence}</td>
              <td className={styles.num}>{moneyPe(r.capital)}</td>
              <td className={styles.num}>{moneyPe(r.interes)}</td>
              <td className={styles.num}>{moneyPe(r.monto)}</td>
              <td>
                <span
                  className={`${styles.badge} ${
                    r.estado === "PAGADA" ? styles.badgeOk : r.estado === "VENCIDA" ? styles.badgeBad : styles.badgeWarn
                  }`}
                >
                  {r.estado === "PAGADA" ? "Pagada" : r.estado === "VENCIDA" ? "Vencida" : "Pendiente"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M12 4v10M8 10l4 4 4-4M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path
        d="M7 8V4h10v4M7 16H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7v-6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PdfPreviewModal({
  title,
  html,
  filename,
  onClose,
}: {
  title: string;
  html: string;
  filename: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className={styles.modal}
        style={{ width: "min(48rem, 100%)", maxHeight: "min(92vh, 52rem)" }}
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div>
            <h2>{title}</h2>
            <p>Vista previa del documento FinanTech S.A.</p>
          </div>
          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
            <IconTipButton tip="Descargar" aria-label="Descargar" onClick={() => downloadHtmlAsPdfProxy(html, filename)}>
              <IconDownload />
            </IconTipButton>
            <IconTipButton tip="Imprimir / PDF" aria-label="Imprimir" onClick={() => printHtmlAsPdf(html)}>
              <IconPrint />
            </IconTipButton>
            <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={onClose}>
              <IconClose />
            </IconTipButton>
          </div>
        </div>
        <iframe
          title={title}
          srcDoc={html}
          style={{
            width: "100%",
            height: "min(62vh, 32rem)",
            border: 0,
            borderRadius: 0,
            background: "#fff",
            minWidth: 0,
            display: "block",
          }}
        />
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className={styles.btnPrimary} onClick={() => downloadHtmlAsPdfProxy(html, filename)}>
            Descargar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ClientCuotasPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const { portal, loading, error, load } = usePortal();
  const loan = portal?.prestamoVigente;
  const [payOpen, setPayOpen] = useState(false);
  const [modo, setModo] = useState<"CUOTA" | "TODO">("CUOTA");
  const [medio, setMedio] = useState("Yape");
  const [detalle, setDetalle] = useState("");
  const [card, setCard] = useState({ nro: "", vence: "", cvv: "", titular: "" });
  const [saving, setSaving] = useState(false);

  const nextCuota = useMemo(
    () => loan?.cronograma.find((c) => c.estado !== "PAGADA") ?? null,
    [loan],
  );
  const pendingCount = useMemo(
    () => loan?.cronograma.filter((c) => c.estado !== "PAGADA").length ?? 0,
    [loan],
  );

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!loan || saving || !nextCuota) return;
    setSaving(true);
    try {
      let detalleMedio = detalle;
      if (medio === "Tarjeta") {
        detalleMedio = `Tarjeta ****${card.nro.slice(-4)} · ${card.titular} · vence ${card.vence}`;
      } else if (medio === "Transferencia") {
        detalleMedio = detalle || "Transferencia a cuenta FinanTech BCP 191-45678901-0-12";
      } else if (medio === "Yape" || medio === "Plin") {
        detalleMedio = detalle || `Billetera ${medio} · QR simulado`;
      }
      await creditApi.pay({
        modo,
        installmentId: modo === "CUOTA" ? nextCuota.id : undefined,
        medio,
        detalleMedio,
      });
      toast.success("Pago registrado");
      setPayOpen(false);
      setDetalle("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo pagar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageShell title="Tus cuotas" tip="Pago" subtitle="Cargando…"><p className={styles.empty}>Cargando…</p></PageShell>;
  if (error) return <PageShell title="Tus cuotas" tip="Pago" subtitle="Error"><p className={styles.error}>{error}</p></PageShell>;
  if (!loan) {
    return (
      <PageShell title="Tus cuotas" tip="Pago" subtitle="Sin préstamo vigente">
        <EmptyState
          title="No cuentas con un préstamo"
          text="Cuando tengas un préstamo aprobado podrás pagar tus cuotas aquí."
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Tus cuotas" tip="Paga la siguiente cuota pendiente" subtitle={`${loan.codigo} · saldo ${moneyPe(loan.saldo)}`}>
      <div className={styles.summary}>
        <p>
          <span>Siguiente cuota</span>
          <strong>{nextCuota ? `#${nextCuota.numero}` : "—"}</strong>
        </p>
        <p>
          <span>Vence</span>
          <strong>{nextCuota?.fechaVence ?? "—"}</strong>
        </p>
        <p>
          <span>Monto</span>
          <strong>{nextCuota ? moneyPe(nextCuota.monto) : "—"}</strong>
        </p>
        <p>
          <span>Pendientes</span>
          <strong>{pendingCount}</strong>
        </p>
      </div>

      <div className={styles.formActions}>
        {nextCuota ? (
          <button type="button" className={styles.btnPrimary} onClick={() => setPayOpen(true)}>
            Pagar cuota
          </button>
        ) : (
          <p className={styles.empty}>Todas las cuotas están pagadas.</p>
        )}
      </div>

      <ScheduleTable rows={loan.cronograma} />

      <AnimatePresence>
        {payOpen && nextCuota ? (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPayOpen(false)}
          >
            <motion.form
              className={styles.modal}
              style={{ width: "min(28rem, 100%)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void onPay(e)}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Pagar cuota</h2>
                  <p>
                    Siguiente: #{nextCuota.numero} · {nextCuota.fechaVence} · {moneyPe(nextCuota.monto)}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setPayOpen(false)}>
                  <IconClose />
                </IconTipButton>
              </div>

              <div className={styles.summary}>
                <p>
                  <span>Cuota</span>
                  <strong>#{nextCuota.numero}</strong>
                </p>
                <p>
                  <span>Vence</span>
                  <strong>{nextCuota.fechaVence}</strong>
                </p>
                <p>
                  <span>Monto</span>
                  <strong>{moneyPe(nextCuota.monto)}</strong>
                </p>
              </div>

              <div className={styles.formGrid}>
                <ComboSelect
                  label="Qué pagar"
                  value={modo}
                  options={[
                    { value: "CUOTA", label: `Solo cuota #${nextCuota.numero}` },
                    { value: "TODO", label: "Todo el saldo pendiente" },
                  ]}
                  onChange={(v) => setModo(v as "CUOTA" | "TODO")}
                />
                <ComboSelect
                  label="Medio"
                  value={medio}
                  options={[
                    { value: "Yape", label: "Yape" },
                    { value: "Plin", label: "Plin" },
                    { value: "Transferencia", label: "Transferencia" },
                    { value: "Tarjeta", label: "Tarjeta" },
                    { value: "Efectivo", label: "Efectivo" },
                  ]}
                  onChange={setMedio}
                />
              </div>

              {(medio === "Yape" || medio === "Plin") && (
                <div className={styles.card} style={{ textAlign: "center" }}>
                  <p className={styles.subtitle}>Escanea el QR simulado ({medio})</p>
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      margin: "0.5rem auto",
                      background:
                        "repeating-linear-gradient(45deg,var(--foreground,#0a2540) 0 6px,#fff 6px 12px), repeating-linear-gradient(-45deg,var(--accent,#2563eb) 0 4px,#fff 4px 10px)",
                      borderRadius: 12,
                      border: "1px solid var(--line,#d7e3ef)",
                    }}
                  />
                  <p className={styles.subtitle}>Número simulado: 999 888 777</p>
                </div>
              )}
              {medio === "Transferencia" && (
                <div className={styles.summary}>
                  <p>
                    <span>BCP</span>
                    <strong>191-45678901-0-12</strong>
                  </p>
                  <p>
                    <span>Titular</span>
                    <strong>FinanTech S.A.</strong>
                  </p>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>N° operación</span>
                    <input value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="OP-123456" required />
                  </label>
                </div>
              )}
              {medio === "Tarjeta" && (
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Número de tarjeta</span>
                    <input
                      value={card.nro}
                      onChange={(e) => setCard({ ...card, nro: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                      required
                      minLength={12}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Titular</span>
                    <input value={card.titular} onChange={(e) => setCard({ ...card, titular: e.target.value })} required />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Vence (MM/AA)</span>
                    <input value={card.vence} onChange={(e) => setCard({ ...card, vence: e.target.value })} required />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>CVV</span>
                    <input
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      required
                    />
                  </label>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPayOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? "Registrando…" : "Confirmar pago"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageShell>
  );
}

export function ClientHistorialPage() {
  const { portal, loading, error } = usePortal();
  if (loading) return <PageShell title="Historial de pagos" tip="Pagos" subtitle="Cargando…"><p className={styles.empty}>Cargando…</p></PageShell>;
  if (error) return <PageShell title="Historial de pagos" tip="Pagos" subtitle="Error"><p className={styles.error}>{error}</p></PageShell>;
  const pagos = portal?.pagos ?? [];
  const total = pagos.reduce((s, p) => s + Number(p.monto), 0);
  return (
    <PageShell title="Historial de pagos" tip="Pagos aplicados" subtitle={`Total pagado ${moneyPe(total)}`}>
      {portal?.prestamosAnteriores?.length ? (
        <div className={styles.summary}>
          {portal.prestamosAnteriores.map((p) => (
            <p key={p.id}>
              <span>{p.codigo}</span>
              <strong>
                {p.estado} · {moneyPe(p.monto)}
              </strong>
            </p>
          ))}
        </div>
      ) : null}
      <PaymentsTable rows={pagos} />
    </PageShell>
  );
}

function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  if (!rows.length) {
    return (
      <EmptyState title="Sin pagos registrados" text="Cuando pagues una cuota, el historial y los vouchers aparecerán aquí." />
    );
  }
  return (
    <div className={styles.tableShell}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Voucher</th>
            <th>Medio</th>
            <th>Cuotas</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.codigoVoucher}</td>
              <td>
                {r.medio}
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{r.detalleMedio}</div>
              </td>
              <td>{r.cuotasCubiertas}</td>
              <td className={styles.num}>{moneyPe(r.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientContratoPage() {
  const { portal, loading, error } = usePortal();
  const [preview, setPreview] = useState(false);
  const contrato = portal?.contrato;
  const loan = portal?.prestamoVigente;
  if (loading) return <PageShell title="Contrato" tip="PDF" subtitle="Cargando…"><p className={styles.empty}>Cargando…</p></PageShell>;
  if (error) return <PageShell title="Contrato" tip="PDF" subtitle="Error"><p className={styles.error}>{error}</p></PageShell>;
  if (!contrato) {
    return (
      <PageShell title="Contrato" tip="Se genera al aprobar" subtitle="Sin contrato">
        <EmptyState
          title="Sin contrato disponible"
          text="El contrato con firma digital simulada se genera automáticamente cuando aprueban tu préstamo."
        />
      </PageShell>
    );
  }
  return (
    <PageShell
      title="Contrato"
      tip="Tabla del préstamo · ojito PDF · descarga"
      subtitle={`${contrato.codigo} · ${contrato.firmaSimulada}`}
      actions={
        <>
          <IconTipButton tip="Ver PDF" aria-label="Ver PDF" onClick={() => setPreview(true)}>
            <IconEye />
          </IconTipButton>
          <IconTipButton
            tip="Descargar"
            aria-label="Descargar"
            onClick={() => downloadHtmlAsPdfProxy(contrato.contenidoHtml, contrato.codigo)}
          >
            <IconDownload />
          </IconTipButton>
        </>
      }
    >
      <div className={styles.tableShell}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Código contrato</th>
              <td>{contrato.codigo}</td>
            </tr>
            <tr>
              <th scope="row">Préstamo</th>
              <td>{loan?.codigo ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Cliente</th>
              <td>{loan ? `${loan.clienteNombre} · DNI ${loan.dni}` : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Monto</th>
              <td className={styles.num}>{loan ? moneyPe(loan.monto) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Cuotas</th>
              <td>{loan ? `${loan.cuotas} (${loan.frecuencia.toLowerCase()})` : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Cuota</th>
              <td className={styles.num}>{loan ? moneyPe(loan.cuotaMonto) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Interés total</th>
              <td className={styles.num}>{loan ? moneyPe(loan.interesTotal) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Total a pagar</th>
              <td className={styles.num}>{loan ? moneyPe(loan.totalPagar) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Saldo</th>
              <td className={styles.num}>{loan ? moneyPe(loan.saldo) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Firma</th>
              <td>{contrato.firmaSimulada}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {loan?.cronograma?.length ? (
        <>
          <h2 className={styles.subtitle} style={{ margin: "0.35rem 0 0", fontWeight: 700, color: "var(--foreground,#0a2540)" }}>
            Cronograma de amortización
          </h2>
          <ScheduleTable rows={loan.cronograma} />
        </>
      ) : null}

      <AnimatePresence>
        {preview ? (
          <PdfPreviewModal
            title={`Contrato ${contrato.codigo}`}
            html={contrato.contenidoHtml}
            filename={contrato.codigo}
            onClose={() => setPreview(false)}
          />
        ) : null}
      </AnimatePresence>
    </PageShell>
  );
}

export function ClientComprobantesPage() {
  const { portal, loading, error } = usePortal();
  const [preview, setPreview] = useState<{ html: string; code: string } | null>(null);
  if (loading) return <PageShell title="Comprobantes" tip="Vouchers" subtitle="Cargando…"><p className={styles.empty}>Cargando…</p></PageShell>;
  if (error) return <PageShell title="Comprobantes" tip="Vouchers" subtitle="Error"><p className={styles.error}>{error}</p></PageShell>;
  const vouchers = portal?.pagos ?? [];
  return (
    <PageShell title="Comprobantes" tip="Vouchers de pago" subtitle={`${vouchers.length} comprobantes`}>
      {!vouchers.length ? (
        <EmptyState
          title="Sin comprobantes"
          text="Los vouchers aparecen automáticamente cuando registras un pago de cuota."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Medio</th>
                <th>Cuotas</th>
                <th className={styles.num}>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.codigoVoucher}</strong>
                  </td>
                  <td>{v.medio}</td>
                  <td>{v.cuotasCubiertas}</td>
                  <td className={styles.num}>{moneyPe(v.monto)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <IconTipButton
                        tip="Ver PDF"
                        aria-label={`Ver ${v.codigoVoucher}`}
                        onClick={() => setPreview({ html: v.voucherHtml, code: v.codigoVoucher })}
                      >
                        <IconEye />
                      </IconTipButton>
                      <IconTipButton
                        tip="Descargar"
                        aria-label={`Descargar ${v.codigoVoucher}`}
                        onClick={() => downloadHtmlAsPdfProxy(v.voucherHtml, v.codigoVoucher)}
                      >
                        <IconDownload />
                      </IconTipButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AnimatePresence>
        {preview ? (
          <PdfPreviewModal
            title={preview.code}
            html={preview.html}
            filename={preview.code}
            onClose={() => setPreview(null)}
          />
        ) : null}
      </AnimatePresence>
    </PageShell>
  );
}
