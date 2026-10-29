"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import { easeOut } from "@/modules/shared/lib/motion";
import {
  creditApi,
  moneyPe,
  statusLabel,
  statusTone,
  type CalcResult,
  type CreditParam,
  type LoanRequestRow,
} from "@/modules/finance/creditApi";
import styles from "@/modules/shared/ui/ds/ds.module.css";

type StatusFilter = "all" | LoanRequestRow["estado"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "EN_EVALUACION", label: "Pendiente" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "RECHAZADA", label: "Rechazada" },
];

function badgeClass(tone: ReturnType<typeof statusTone>) {
  switch (tone) {
    case "ok":
      return styles.badgeOk;
    case "warn":
      return styles.badgeWarn;
    case "bad":
      return styles.badgeBad;
    case "info":
      return styles.badgeInfo;
    default:
      return styles.badgeMuted;
  }
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
      <path
        d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function SolicitudesPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<LoanRequestRow[]>([]);
  const [plazos, setPlazos] = useState<number[]>([6, 8, 12, 18, 24]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<LoanRequestRow | null>(null);
  const [confirm, setConfirm] = useState<{ row: LoanRequestRow; estado: LoanRequestRow["estado"] } | null>(null);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [direccion, setDireccion] = useState("");
  const [trabajo, setTrabajo] = useState("");
  const [ingresos, setIngresos] = useState("");
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("12");
  const [frecuencia, setFrecuencia] = useState<"MENSUAL" | "SEMANAL">("MENSUAL");
  const [tasas, setTasas] = useState<CreditParam[]>([]);
  const [tasaId, setTasaId] = useState("");
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const statusBusy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, terms, params] = await Promise.all([
        creditApi.listRequests(),
        creditApi.plazos(),
        creditApi.listParams(),
      ]);
      setRows(list);
      const rateParams = params.filter((p) => p.kind === "TASA_INTERES" && p.vigente);
      setTasas(rateParams);
      setTasaId((prev) => prev || (rateParams[0] ? String(rateParams[0].id) : ""));
      if (terms.length) {
        setPlazos(terms);
        setCuotas((c) => (terms.map(String).includes(c) ? c : String(terms[0])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!createOpen) return;
    const amount = Number(monto.replace(",", "."));
    const n = Number(cuotas);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(n)) {
      setCalc(null);
      return;
    }
    const handle = window.setTimeout(() => {
      setCalcLoading(true);
      void creditApi
        .calculate(String(amount), n, frecuencia, tasaId ? Number(tasaId) : undefined)
        .then(setCalc)
        .catch(() => setCalc(null))
        .finally(() => setCalcLoading(false));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [createOpen, monto, cuotas, frecuencia, tasaId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.estado !== statusFilter) return false;
      if (!q) return true;
      return (
        r.clienteNombre.toLowerCase().includes(q) ||
        r.dni.includes(q) ||
        statusLabel(r.estado).toLowerCase().includes(q) ||
        r.monto.includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  function openCreate() {
    setNombres("");
    setApellidos("");
    setDni("");
    setDireccion("");
    setTrabajo("");
    setIngresos("");
    setMonto("");
    setFrecuencia("MENSUAL");
    setCalc(null);
    if (tasas[0]) setTasaId(String(tasas[0].id));
    setCreateOpen(true);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const created = await creditApi.createRequest({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        dni,
        direccion: direccion.trim(),
        trabajo: trabajo.trim(),
        ingresosMensuales: ingresos.replace(",", "."),
        monto: monto.replace(",", "."),
        cuotas: Number(cuotas),
        frecuenciaPago: frecuencia,
        tasaParamId: tasaId ? Number(tasaId) : undefined,
      });
      setRows((prev) => [created, ...prev]);
      toast.success("Solicitud creada");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function applyStatus(row: LoanRequestRow, estado: LoanRequestRow["estado"]) {
    if (statusBusy.current) return;
    statusBusy.current = true;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, estado } : r)));
    setConfirm(null);
    setDetail(null);
    try {
      const updated = await creditApi.patchStatus(row.id, estado);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Estado: ${statusLabel(estado)}`);
    } catch (err) {
      await load();
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      statusBusy.current = false;
    }
  }

  const plazoOptions =
    frecuencia === "SEMANAL"
      ? [4, 8, 12, 16, 24, 36, 52].map((n) => ({ value: String(n), label: `${n} semanas` }))
      : plazos.map((n) => ({ value: String(n), label: `${n} meses` }));
  const tasaOptions = tasas.map((t) => ({
    value: String(t.id),
    label: `${t.nombre} · ${t.valor}% ${t.periodo.toLowerCase()}`,
  }));

  const rowActions = (row: LoanRequestRow) => (
    <div className={styles.rowActions}>
      <IconTipButton tip="Ver detalle" aria-label="Ver detalle" onClick={() => setDetail(row)}>
        <IconEye />
      </IconTipButton>
    </div>
  );

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
            Solicitudes de préstamo
            <IconTipButton
              tip="Alta y evaluación de créditos. La cuota se calcula con la tasa vigente (diaria, mensual o anual)."
              aria-label="Ayuda"
            >
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Evaluación de créditos nuevos antes del desembolso.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnPrimary} onClick={openCreate}>
            <IconPlus />
            Nueva solicitud
          </button>
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
            placeholder="Buscar por nombre, DNI o estado…"
            aria-label="Buscar solicitudes"
          />
        </label>
        <div className={styles.chips} role="group" aria-label="Estado">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={statusFilter === f.value ? styles.chipOn : styles.chip}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.mobileList} aria-busy={loading}>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay solicitudes con ese criterio.</p>
            <button type="button" className={styles.btnPrimary} onClick={openCreate}>
              Nueva solicitud
            </button>
          </div>
        ) : (
          filtered.map((row) => (
            <article key={row.id} className={styles.card}>
              <div className={styles.person}>
                <span className={styles.avatar}>{row.clienteNombre.charAt(0).toUpperCase()}</span>
                <div className={styles.personText}>
                  <strong>{row.clienteNombre}</strong>
                  <span>
                    DNI {row.dni} · {row.cuotas} cuotas
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" }}>
                <span className={`${styles.badge} ${badgeClass(statusTone(row.estado))}`}>{statusLabel(row.estado)}</span>
                <strong>{moneyPe(row.monto)}</strong>
              </div>
              <p className={styles.mutedText} style={{ margin: 0 }}>
                Cuota {moneyPe(row.cuotaMensual)} · Interés {moneyPe(row.interesTotal)}
              </p>
              {rowActions(row)}
            </article>
          ))
        )}
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Cliente</th>
              <th style={{ width: "10%" }}>DNI</th>
              <th className={styles.num} style={{ width: "12%" }}>
                Monto
              </th>
              <th style={{ width: "8%" }}>Plazo</th>
              <th className={styles.num} style={{ width: "12%" }}>
                Cuota
              </th>
              <th style={{ width: "14%" }}>Estado</th>
              <th style={{ width: "12%" }}>Tasa</th>
              <th style={{ width: "10%", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <p className={styles.empty}>Cargando…</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.empty}>
                    <p>No hay solicitudes. Crea la primera para empezar la evaluación.</p>
                    <button type="button" className={styles.btnPrimary} onClick={openCreate}>
                      Nueva solicitud
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.person}>
                      <span className={styles.avatar}>{row.clienteNombre.charAt(0).toUpperCase()}</span>
                      <div className={styles.personText}>
                        <strong>{row.clienteNombre}</strong>
                        <span>Total {moneyPe(row.totalPagar)}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.dni}</td>
                  <td className={styles.num}>{moneyPe(row.monto)}</td>
                  <td>{row.cuotas}</td>
                  <td className={styles.num}>{moneyPe(row.cuotaMensual)}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeClass(statusTone(row.estado))}`}>
                      {statusLabel(row.estado)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.mutedText}>
                      {row.valorTasa ?? "—"}% {(row.periodoTasa ?? "").toLowerCase()}
                    </span>
                  </td>
                  <td>{rowActions(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {createOpen ? (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreateOpen(false)}
          >
            <motion.form
              className={styles.modal}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void onCreate(e)}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Nueva solicitud</h2>
                  <p>Completa los datos y revisa la simulación antes de guardar.</p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setCreateOpen(false)}>
                  <IconClose />
                </IconTipButton>
              </div>

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
                  <input
                    inputMode="numeric"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                  />
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
                  <input
                    inputMode="decimal"
                    value={ingresos}
                    onChange={(e) => setIngresos(e.target.value.replace(/[^\d.,]/g, ""))}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Monto a prestar (S/)</span>
                  <input
                    inputMode="decimal"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder="1500"
                    required
                  />
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
                    setCuotas("12");
                  }}
                />
                <ComboSelect label="Plazo" value={cuotas} options={plazoOptions} onChange={setCuotas} />
                {tasaOptions.length ? (
                  <ComboSelect label="Tasa de interés" value={tasaId} options={tasaOptions} onChange={setTasaId} />
                ) : null}
              </div>

              <div className={styles.summary} aria-live="polite">
                {calcLoading ? (
                  <p>Calculando…</p>
                ) : calc ? (
                  <>
                    <p>
                      <span>Tasa ({calc.periodoTasa.toLowerCase()})</span>
                      <strong>{calc.valorTasa}%</strong>
                    </p>
                    <p>
                      <span>Equiv. mensual</span>
                      <strong>{calc.tasaMensualEquivalente}%</strong>
                    </p>
                    <p>
                      <span>Cuota mensual</span>
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
                  </>
                ) : (
                  <p>Ingresa monto y plazo para ver el cálculo.</p>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving || !calc}>
                  {saving ? "Guardando…" : "Guardar solicitud"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {detail ? (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              className={styles.modal}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Solicitud #{detail.id}</h2>
                  <p>
                    {detail.clienteNombre} · DNI {detail.dni}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setDetail(null)}>
                  <IconClose />
                </IconTipButton>
              </div>
              <span className={`${styles.badge} ${badgeClass(statusTone(detail.estado))}`}>
                {statusLabel(detail.estado)}
              </span>
              <div className={styles.summary}>
                <p>
                  <span>Monto</span>
                  <strong>{moneyPe(detail.monto)}</strong>
                </p>
                <p>
                  <span>Cuotas</span>
                  <strong>
                    {detail.cuotas} · {detail.frecuenciaPago === "SEMANAL" ? "semanal" : "mensual"}
                  </strong>
                </p>
                <p>
                  <span>Cuota</span>
                  <strong>{moneyPe(detail.cuotaMensual)}</strong>
                </p>
                <p>
                  <span>Interés total</span>
                  <strong>{moneyPe(detail.interesTotal)}</strong>
                </p>
                <p>
                  <span>Total a pagar</span>
                  <strong>{moneyPe(detail.totalPagar)}</strong>
                </p>
                <p>
                  <span>Dirección</span>
                  <strong>{detail.direccion || "—"}</strong>
                </p>
                <p>
                  <span>Trabajo</span>
                  <strong>{detail.trabajo || "—"}</strong>
                </p>
                <p>
                  <span>Ingresos</span>
                  <strong>{moneyPe(detail.ingresosMensuales)}</strong>
                </p>
              </div>
              <div className={styles.modalActions}>
                {detail.estado === "EN_EVALUACION" || detail.estado === "OBSERVADA" ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => setConfirm({ row: detail, estado: "APROBADA" })}
                  >
                    Aprobar
                  </button>
                ) : null}
                {detail.estado === "EN_EVALUACION" || detail.estado === "OBSERVADA" ? (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => setConfirm({ row: detail, estado: "RECHAZADA" })}
                  >
                    Rechazar
                  </button>
                ) : null}
                <button type="button" className={styles.btnSecondary} onClick={() => setDetail(null)}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirm ? (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirm(null)}
          >
            <motion.div
              className={styles.modal}
              style={{ width: "min(24rem, 100%)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2>Confirmar {statusLabel(confirm.estado).toLowerCase()}</h2>
                  <p>
                    {confirm.row.clienteNombre} · {moneyPe(confirm.row.monto)}
                  </p>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={confirm.estado === "RECHAZADA" ? styles.btnDanger : styles.btnPrimary}
                  onClick={() => void applyStatus(confirm.row, confirm.estado)}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
