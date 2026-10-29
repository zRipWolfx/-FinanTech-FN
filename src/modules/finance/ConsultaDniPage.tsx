"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { easeOut } from "@/modules/shared/lib/motion";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "@/modules/shared/ui/ds/ds.module.css";
import { creditApi, moneyPe, statusLabel, type ClientDossier } from "@/modules/finance/creditApi";

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
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

export function ConsultaDniPage() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [dni, setDni] = useState("45678912");
  const [error, setError] = useState("");
  const [dossier, setDossier] = useState<ClientDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockUntil, setBlockUntil] = useState("");
  const [blockMotivo, setBlockMotivo] = useState("");

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      setDossier(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setDossier(await creditApi.dossier(dni));
    } catch (err) {
      setDossier(null);
      setError(err instanceof Error ? err.message : "No se encontró el cliente");
    } finally {
      setLoading(false);
    }
  }

  async function onBlock() {
    if (!dossier || !blockUntil) {
      toast.error("Indica hasta qué fecha bloquear");
      return;
    }
    try {
      await creditApi.blockClient({ dni: dossier.dni, hasta: blockUntil, motivo: blockMotivo });
      toast.success("Cliente bloqueado para nuevos préstamos");
      setDossier(await creditApi.dossier(dossier.dni));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo bloquear");
    }
  }

  async function onUnblock() {
    if (!dossier) return;
    try {
      await creditApi.unblockClient(dossier.dni);
      toast.success("Bloqueo retirado");
      setDossier(await creditApi.dossier(dossier.dni));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desbloquear");
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
            Consulta por DNI
            <IconTipButton tip="Historial completo de préstamos, pagos tardíos y bloqueos del cliente." aria-label="Ayuda">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.subtitle}>Busca el crédito de un cliente con su documento.</p>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.formCard} onSubmit={onSearch}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>DNI</span>
            <input
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="45678912"
              aria-label="DNI del cliente"
            />
          </label>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? "Buscando…" : "Buscar cliente"}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {dossier ? (
          <motion.div
            className={styles.formCard}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.modalHead} style={{ marginBottom: "0.75rem" }}>
              <div>
                <h2>{dossier.nombres}</h2>
                <p>
                  DNI {dossier.dni}
                  {dossier.telefono ? ` · Tel ${dossier.telefono}` : ""}
                </p>
              </div>
              <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setDossier(null)}>
                <IconClose />
              </IconTipButton>
            </div>

            <div className={styles.summary}>
              <p>
                <span>Préstamos totales</span>
                <strong>{dossier.prestamosTotales}</strong>
              </p>
              <p>
                <span>Vigentes</span>
                <strong>{dossier.prestamosVigentes}</strong>
              </p>
              <p>
                <span>Pagos tardíos / vencidos</span>
                <strong>{dossier.pagosTardios}</strong>
              </p>
              <p>
                <span>Bloqueo</span>
                <strong>{dossier.bloqueadoHasta ? `Hasta ${dossier.bloqueadoHasta}` : "No"}</strong>
              </p>
            </div>

            {dossier.prestamoVigente ? (
              <div className={styles.summary}>
                <p>
                  <span>Vigente</span>
                  <strong>{dossier.prestamoVigente.codigo}</strong>
                </p>
                <p>
                  <span>Saldo</span>
                  <strong>{moneyPe(dossier.prestamoVigente.saldo)}</strong>
                </p>
                <p>
                  <span>Progreso</span>
                  <strong>{dossier.prestamoVigente.progresoPct}%</strong>
                </p>
                <p>
                  <span>Próximo vence</span>
                  <strong>{dossier.prestamoVigente.proximoVence ?? "—"}</strong>
                </p>
              </div>
            ) : null}

            <h3 className={styles.subtitle}>Historial de préstamos</h3>
            <div className={styles.tableShell}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Estado</th>
                    <th className={styles.num}>Monto</th>
                    <th className={styles.num}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.historialPrestamos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.codigo}</td>
                      <td>{p.estado}</td>
                      <td className={styles.num}>{moneyPe(p.monto)}</td>
                      <td className={styles.num}>{moneyPe(p.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className={styles.subtitle}>Solicitudes</h3>
            <div className={styles.tableShell}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th className={styles.num}>Monto</th>
                    <th>Cuotas</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.solicitudes.map((s) => (
                    <tr key={s.id}>
                      <td>{statusLabel(s.estado)}</td>
                      <td className={styles.num}>{moneyPe(s.monto)}</td>
                      <td>{s.cuotas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.formCard} style={{ marginTop: "0.75rem" }}>
              <p className={styles.subtitle}>Prohibir nuevos préstamos por un tiempo</p>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Hasta</span>
                  <input type="date" value={blockUntil} onChange={(e) => setBlockUntil(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Motivo</span>
                  <input value={blockMotivo} onChange={(e) => setBlockMotivo(e.target.value)} placeholder="Mora reiterada" />
                </label>
              </div>
              <div className={styles.formActions}>
                {dossier.bloqueadoHasta ? (
                  <button type="button" className={styles.btnSecondary} onClick={() => void onUnblock()}>
                    Quitar bloqueo
                  </button>
                ) : null}
                <button type="button" className={styles.btnPrimary} onClick={() => void onBlock()}>
                  Aplicar bloqueo
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
