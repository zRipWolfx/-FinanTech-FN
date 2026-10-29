"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { IconTipButton } from "@/modules/shared/ui/IconTipButton";
import {
  creditApi,
  type CreditParam,
  type CreditParamPayload,
} from "@/modules/finance/creditApi";
import styles from "./Finance.module.css";

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

const KIND_OPTS = [
  { value: "TASA_INTERES", label: "Tasa interés" },
  { value: "MORA", label: "Mora" },
  { value: "PLAZO", label: "Plazo" },
];

const PERIOD_OPTS = [
  { value: "DIARIA", label: "Diaria" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "ANUAL", label: "Anual" },
  { value: "FIJO", label: "Fijo" },
];

const emptyForm = (): CreditParamPayload => ({
  codigo: "",
  nombre: "",
  descripcion: "",
  kind: "TASA_INTERES",
  periodo: "MENSUAL",
  valor: "",
  plazosPermitidos: "6,8,12,18,24",
  vigente: true,
});

function periodLabel(p: string) {
  return PERIOD_OPTS.find((o) => o.value === p)?.label ?? p;
}

function kindLabel(k: string) {
  return KIND_OPTS.find((o) => o.value === k)?.label ?? k;
}

function valorDisplay(row: CreditParam) {
  if (row.kind === "PLAZO") return String(row.valor);
  return `${row.valor}%`;
}

export function ParametrosPage() {
  const toast = useToast();
  const [rows, setRows] = useState<CreditParam[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditParam | null>(null);
  const [form, setForm] = useState<CreditParamPayload>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await creditApi.listParams());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los parámetros");
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
      (r) =>
        r.codigo.toLowerCase().includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        r.kind.toLowerCase().includes(q) ||
        r.periodo.toLowerCase().includes(q),
    );
  }, [rows, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(row: CreditParam) {
    setEditing(row);
    setForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      kind: row.kind,
      periodo: row.periodo,
      valor: row.valor,
      plazosPermitidos: row.plazosPermitidos || "6,8,12,18,24",
      vigente: row.vigente,
    });
    setModalOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: CreditParamPayload = {
        ...form,
        periodo: form.kind === "PLAZO" ? "FIJO" : form.periodo,
      };
      if (editing) {
        await creditApi.updateParam(editing.id, payload);
        toast.success("Parámetro actualizado");
      } else {
        await creditApi.createParam(payload);
        toast.success("Parámetro creado");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVigente(row: CreditParam) {
    try {
      await creditApi.setVigente(row.id, !row.vigente);
      toast.success(row.vigente ? "Parámetro desactivado" : "Parámetro vigente");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  }

  const rowActions = (row: CreditParam) => (
    <div className={styles.actions}>
      <IconTipButton tip="Editar" aria-label="Editar" onClick={() => openEdit(row)}>
        <IconEdit />
      </IconTipButton>
      <IconTipButton
        tip={row.vigente ? "Desactivar" : "Activar"}
        aria-label={row.vigente ? "Desactivar" : "Activar"}
        onClick={() => void toggleVigente(row)}
      >
        <span style={{ fontSize: "0.7rem", fontWeight: 800 }}>{row.vigente ? "ON" : "OFF"}</span>
      </IconTipButton>
    </div>
  );

  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>
            Parámetros de crédito
            <IconTipButton
              tip="Define tasas (diaria, mensual o anual), mora y plazos permitidos. La solicitud usa la tasa vigente para calcular la cuota."
              aria-label="Información de parámetros"
            >
              <IconHelp />
            </IconTipButton>
          </h1>
          <p className={styles.description}>Condiciones base para armar un préstamo y calcular interés por cuota.</p>
        </div>
        <IconTipButton tip="Nuevo parámetro" aria-label="Nuevo parámetro" tone="primary" onClick={openCreate}>
          <IconPlus />
        </IconTipButton>
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
            placeholder="Buscar por código, nombre o periodo…"
            aria-label="Buscar parámetros"
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.mobileList} aria-busy={loading}>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No hay parámetros.</p>
        ) : (
          filtered.map((row) => (
            <article key={row.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.nameCell}>
                  <span className={styles.nameMark}>{row.nombre.charAt(0).toUpperCase()}</span>
                  <div className={styles.nameText}>
                    <strong>{row.nombre}</strong>
                    <span>{row.descripcion || kindLabel(row.kind)}</span>
                  </div>
                </div>
                <span className={`${styles.badge} ${row.vigente ? styles.badgeOk : styles.badgeMuted}`}>
                  {row.vigente ? "Vigente" : "Inactivo"}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.code}>{row.codigo}</span>
                <strong className={styles.amount}>{valorDisplay(row)}</strong>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardMeta}>
                  {periodLabel(row.periodo)} · plazos {row.plazos.join(", ") || "—"}
                </span>
                {rowActions(row)}
              </div>
            </article>
          ))
        )}
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Código</th>
              <th style={{ width: "26%" }}>Nombre</th>
              <th style={{ width: "12%" }}>Tipo</th>
              <th style={{ width: "12%" }}>Periodo</th>
              <th style={{ width: "10%" }}>Valor</th>
              <th style={{ width: "14%" }}>Plazos</th>
              <th style={{ width: "10%" }} className={styles.actionsHead}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <p className={styles.empty}>Cargando…</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <p className={styles.empty}>No hay parámetros.</p>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={styles.code}>{row.codigo}</span>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.nameMark}>{row.nombre.charAt(0).toUpperCase()}</span>
                      <div className={styles.nameText}>
                        <strong>{row.nombre}</strong>
                        <span>{row.descripcion || "—"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeInfo}`}>{kindLabel(row.kind)}</span>
                  </td>
                  <td>{periodLabel(row.periodo)}</td>
                  <td>
                    <span className={styles.linkNum}>{valorDisplay(row)}</span>
                  </td>
                  <td>
                    <span className={styles.cardMeta}>{row.plazos.join(", ") || "—"}</span>
                  </td>
                  <td>{rowActions(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setModalOpen(false)}>
          <form
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void onSubmit(e)}
          >
            <div className={styles.modalHead}>
              <h2>{editing ? "Editar parámetro" : "Nuevo parámetro"}</h2>
              <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </IconTipButton>
            </div>

            <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Código</span>
                <input
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  placeholder="TASA_MENSUAL"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tasa de interés"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Descripción</span>
                <input
                  value={form.descripcion ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Se aplica al cronograma"
                />
              </label>
              <ComboSelect
                label="Tipo"
                value={form.kind}
                options={KIND_OPTS}
                onChange={(next) =>
                  setForm((f) => ({
                    ...f,
                    kind: next,
                    periodo: next === "PLAZO" ? "FIJO" : next === "MORA" ? "DIARIA" : f.periodo,
                  }))
                }
              />
              <ComboSelect
                label="Periodo"
                value={form.kind === "PLAZO" ? "FIJO" : form.periodo}
                options={PERIOD_OPTS}
                onChange={(next) => setForm((f) => ({ ...f, periodo: next }))}
              />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Valor {form.kind === "PLAZO" ? "(máx. cuotas)" : "(%)"}
                </span>
                <input
                  inputMode="decimal"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value.replace(/[^\d.]/g, "") }))}
                  placeholder={form.kind === "PLAZO" ? "24" : "4.5"}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Plazos permitidos
                  <IconTipButton tip="Lista de cuotas separadas por coma. Ej: 6,8,12,18,24" aria-label="Ayuda plazos">
                    <IconHelp />
                  </IconTipButton>
                </span>
                <input
                  value={form.plazosPermitidos}
                  onChange={(e) => setForm((f) => ({ ...f, plazosPermitidos: e.target.value }))}
                  placeholder="6,8,12,18,24"
                  required
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
