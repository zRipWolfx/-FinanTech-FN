"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { FinanceModule, ModuleRow } from "@/modules/navigation/catalog";
import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "./Finance.module.css";

type ModuleViewProps = {
  module: FinanceModule;
};

function toneClass(tone: ModuleRow["tone"]) {
  switch (tone) {
    case "ok":
      return styles.badgeOk;
    case "warn":
      return styles.badgeWarn;
    case "bad":
      return styles.badgeBad;
    default:
      return styles.badgeInfo;
  }
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

export function ModuleView({ module }: ModuleViewProps) {
  const [rows, setRows] = useState<ModuleRow[]>(module.rows);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("6");
  const [medio, setMedio] = useState("Efectivo");
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<ModuleRow[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRows(module.rows);
    setCreating(false);
    setError("");
    setFound(null);
    setLookup("");
    setQuery("");
  }, [module]);

  function addRow(row: ModuleRow) {
    setRows((current) => [row, ...current]);
    setError("");
  }

  function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (nombre.trim().length < 3) {
      setError("Escribe el nombre del cliente.");
      return;
    }
    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }
    const amount = Number(monto);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    addRow({
      title: nombre.trim(),
      detail: `DNI ${dni} · ${cuotas} cuotas`,
      status: "En evaluación",
      tone: "warn",
      amount: `S/ ${amount.toLocaleString("es-PE")}`,
    });
    setNombre("");
    setDni("");
    setMonto("");
    setCreating(false);
  }

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }
    const amount = Number(monto);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Ingresa el monto del pago.");
      return;
    }
    addRow({
      title: `DNI ${dni}`,
      detail: `Pago de cuota · ${medio.toLowerCase()}`,
      status: "Aplicado",
      tone: "ok",
      amount: `S/ ${amount.toLocaleString("es-PE")}`,
    });
    setDni("");
    setMonto("");
  }

  function searchClient(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{8}$/.test(lookup)) {
      setError("Ingresa un DNI de 8 dígitos.");
      setFound(null);
      return;
    }
    const matches = module.rows.filter((row) => row.detail.includes(lookup));
    setFound(matches);
    setError(matches.length ? "" : "No hay un crédito con ese DNI.");
  }

  const base = module.kind === "lookup" ? found : rows;
  const visible = useMemo(() => {
    const list = base ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.detail.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.amount.toLowerCase().includes(q),
    );
  }, [base, query]);

  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>
            {module.title}
            <IconTipButton tip={module.description} aria-label="Información del módulo">
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.description}>{module.description}</p>
        </div>
        {module.kind === "create" ? (
          <IconTipButton
            tip={creating ? "Cerrar" : "Nueva solicitud"}
            aria-label={creating ? "Cerrar" : "Nueva solicitud"}
            tone="primary"
            onClick={() => setCreating((value) => !value)}
          >
            {creating ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}
          </IconTipButton>
        ) : null}
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {module.kind === "create" && creating ? (
        <form className={styles.formCard} onSubmit={submitRequest}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nombre del cliente</span>
              <input value={nombre} onChange={(event) => setNombre(event.target.value)} autoComplete="name" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>DNI</span>
              <input
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(event) => setDni(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Monto solicitado</span>
              <input
                inputMode="decimal"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                placeholder="1500"
              />
            </label>
            <ComboSelect
              label="Cuotas"
              value={cuotas}
              options={[
                { value: "6", label: "6" },
                { value: "8", label: "8" },
                { value: "12", label: "12" },
                { value: "18", label: "18" },
                { value: "24", label: "24" },
              ]}
              onChange={setCuotas}
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              Guardar solicitud
            </button>
          </div>
        </form>
      ) : null}

      {module.kind === "pay" ? (
        <form className={styles.formCard} onSubmit={submitPayment}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>DNI del cliente</span>
              <input
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(event) => setDni(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Monto del pago</span>
              <input
                inputMode="decimal"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                placeholder="220"
              />
            </label>
            <ComboSelect
              label="Medio"
              value={medio}
              options={[
                { value: "Efectivo", label: "Efectivo" },
                { value: "Transferencia", label: "Transferencia" },
                { value: "Yape", label: "Yape" },
                { value: "Plin", label: "Plin" },
              ]}
              onChange={setMedio}
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              Registrar pago
            </button>
          </div>
        </form>
      ) : null}

      {module.kind === "lookup" ? (
        <form className={styles.formCard} onSubmit={searchClient}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>DNI</span>
              <input
                inputMode="numeric"
                maxLength={8}
                value={lookup}
                onChange={(event) => setLookup(event.target.value.replace(/\D/g, ""))}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              Buscar cliente
            </button>
          </div>
        </form>
      ) : null}

      {module.kind !== "lookup" || found !== null ? (
        <>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en la tabla…"
                aria-label="Buscar"
              />
            </label>
          </div>

          <div className={styles.mobileList}>
            {visible.length === 0 ? (
              <p className={styles.empty}>No hay registros.</p>
            ) : (
              visible.map((row) => (
                <article key={`${row.title}-${row.detail}-${row.amount}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.nameText}>
                      <strong className={styles.cardTitle}>{row.title}</strong>
                      <p className={styles.cardMeta}>{row.detail}</p>
                    </div>
                    <strong className={styles.amount}>{row.amount}</strong>
                  </div>
                  <span className={`${styles.badge} ${toneClass(row.tone)}`}>{row.status}</span>
                </article>
              ))
            )}
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Registro</th>
                  <th style={{ width: "34%" }}>Detalle</th>
                  <th style={{ width: "18%" }}>Estado</th>
                  <th style={{ width: "20%" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <p className={styles.empty}>No hay registros.</p>
                    </td>
                  </tr>
                ) : (
                  visible.map((row) => (
                    <tr key={`${row.title}-${row.detail}-${row.amount}`}>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.nameMark}>{row.title.charAt(0).toUpperCase()}</span>
                          <div className={styles.nameText}>
                            <strong>{row.title}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.cardMeta}>{row.detail}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${toneClass(row.tone)}`}>{row.status}</span>
                      </td>
                      <td className={styles.amount}>{row.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
