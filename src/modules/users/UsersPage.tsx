"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { authApi } from "@/modules/auth/services/authApi";
import { useAppSession } from "@/modules/shell";
import { easeOut } from "@/modules/shared/lib/motion";
import { ComboSelect } from "@/modules/shared/ui/ComboSelect";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconHelp,
  IconLink,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTipButton,
} from "@/modules/shared/ui/IconTipButton";
import {
  usersApi,
  type CreateManagedUserResponse,
  type ManagedUser,
} from "@/modules/users/usersApi";
import styles from "./UsersPage.module.css";

type KindFilter = "all" | "empresa" | "dni";
type StatusFilter = "all" | "activo" | "inactivo";

const PAGE_SIZE = 8;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function absoluteInvite(path: string | null) {
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function UsersPage() {
  const { session } = useAppSession();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreateManagedUserResponse | null>(null);
  const [kind, setKind] = useState<"empresa" | "dni">("empresa");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [role, setRole] = useState("OPERACIONES");
  const [canSuper, setCanSuper] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void authApi
      .getProfile()
      .then((profile) => {
        if (!cancelled) {
          setCanSuper(profile.canEditRole || profile.roleCode === "SUPERADMIN");
        }
      })
      .catch(() => {
        if (!cancelled) setCanSuper(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await usersApi.list();
      setUsers(rows);
      const nextPhotos: Record<string, string> = {};
      await Promise.all(
        rows
          .filter((row) => row.hasPhoto && row.photoUrl)
          .map(async (row) => {
            const key = `${row.kind}-${row.id}`;
            const url = await usersApi.fetchPhotoBlob(row.photoUrl!);
            if (url) nextPhotos[key] = url;
          }),
      );
      setPhotos((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return nextPhotos;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      Object.values(photos).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (statusFilter === "activo" && !row.active) return false;
      if (statusFilter === "inactivo" && row.active) return false;
      if (!q) return true;
      return (
        row.nombre.toLowerCase().includes(q) ||
        row.apodo.toLowerCase().includes(q) ||
        row.identifier.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q) ||
        row.roleCode.toLowerCase().includes(q) ||
        (row.active ? "activo" : "inactivo").includes(q) ||
        (row.mustChangePassword ? "pendiente clave" : "").includes(q) ||
        (row.twoFactorEnabled ? "2fa" : "").includes(q)
      );
    });
  }, [users, query, kindFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [query, kindFilter, statusFilter]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error(`No se pudo copiar ${label.toLowerCase()}`);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await usersApi.create({
        kind,
        nombre: nombre.trim(),
        correo: kind === "empresa" ? correo.trim() : undefined,
        dni: kind === "dni" ? dni.trim() : undefined,
        role: kind === "empresa" ? role : undefined,
      });
      setCreated(result);
      setNombre("");
      setCorreo("");
      setDni("");
      setRole("OPERACIONES");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setCreating(false);
    }
  }

  async function renewInvite(row: ManagedUser) {
    setError(null);
    try {
      const result = await usersApi.refreshInvite(row.kind, row.id);
      setCreated(result);
      setModalOpen(true);
      await load();
      toast.success("Link de invitación renovado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo renovar el link");
    }
  }

  async function onToggleActive(row: ManagedUser, next: boolean) {
    setError(null);
    try {
      const updated = await usersApi.setActive(row.kind, row.id, next);
      setUsers((prev) => prev.map((item) => (item.kind === row.kind && item.id === row.id ? updated : item)));
      toast.success(next ? "Usuario activado" : "Usuario desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  }

  const staffCount = users.filter((u) => u.kind === "empresa").length;
  const clientCount = users.filter((u) => u.kind === "dni").length;

  const userAvatar = (row: ManagedUser) => {
    const photo = photos[`${row.kind}-${row.id}`];
    const primary = row.apodo || row.nombre;
    const showSecondary = Boolean(row.apodo && row.nombre && row.apodo !== row.nombre);
    return (
      <div className={styles.person}>
        <span className={styles.avatar}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            initials(primary) || "FT"
          )}
        </span>
        <div className={styles.personText}>
          <p className={styles.name}>{primary}</p>
          {showSecondary ? <p className={styles.muted}>{row.nombre}</p> : null}
        </div>
      </div>
    );
  };

  const accessCell = (row: ManagedUser) => (
    <div>
      <div className={styles.access}>
        <span className={styles.accessValue}>{row.identifier}</span>
        <IconTipButton
          tip={row.kind === "empresa" ? "Copiar correo" : "Copiar DNI"}
          aria-label="Copiar acceso"
          onClick={() => copyText(row.kind === "empresa" ? "Correo" : "DNI", row.identifier)}
        >
          <IconCopy />
        </IconTipButton>
      </div>
      <p className={styles.muted}>{row.kind === "empresa" ? "Correo de empresa" : "DNI de cliente"}</p>
    </div>
  );

  const totpShield = (row: ManagedUser) => {
    if (row.kind !== "empresa") {
      return (
        <IconTipButton tip="Sin autenticador" aria-label="Sin autenticador" className={styles.shieldGrey}>
          <IconShield />
        </IconTipButton>
      );
    }
    if (row.twoFactorEnabled) {
      return (
        <IconTipButton tip="Autenticador activo" aria-label="Autenticador activo" className={styles.shieldGreen}>
          <IconShield />
        </IconTipButton>
      );
    }
    return (
      <IconTipButton tip="Autenticador desvinculado" aria-label="Autenticador desvinculado" className={styles.shieldRed}>
        <IconShield />
      </IconTipButton>
    );
  };

  const statusCell = (row: ManagedUser) => (
    <div className={styles.statusStack}>
      <div className={styles.statusLine}>
        <button
          type="button"
          className={row.active ? styles.statusOn : styles.statusOff}
          aria-label={row.active ? "Desactivar usuario" : "Activar usuario"}
          title={row.active ? "Clic para desactivar" : "Clic para activar"}
          onClick={() => void onToggleActive(row, !row.active)}
        >
          {row.active ? "Activo" : "Inactivo"}
        </button>
        {totpShield(row)}
      </div>
      {row.mustChangePassword ? <span className={styles.warnPill}>Pendiente clave</span> : null}
    </div>
  );

  const inviteCell = (row: ManagedUser) => {
    const invite = absoluteInvite(row.invitePath);
    if (row.inviteActive && invite) {
      return (
        <div className={styles.access}>
          <span className={styles.linkPreview}>Link activo</span>
          <IconTipButton tip="Copiar link" aria-label="Copiar link" onClick={() => copyText("Link", invite)}>
            <IconLink />
          </IconTipButton>
        </div>
      );
    }
    return <span className={styles.muted}>Sin link</span>;
  };

  const actionsCell = (row: ManagedUser) => (
    <div className={styles.actions}>
      <IconTipButton tip="Renovar link" aria-label="Renovar link" onClick={() => renewInvite(row)}>
        <IconRefresh />
      </IconTipButton>
    </div>
  );

  return (
    <motion.section
      className={styles.wrap}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
    >
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroTitleRow}>
            <h1 className={styles.title}>
              Usuarios
              <IconTipButton
                tip="Alta de personal y clientes FinanTech S.A. con clave temporal, link de activación y control Activo/Inactivo."
                aria-label="Información de usuarios"
                className={styles.titleHelp}
              >
                <IconHelp />
              </IconTipButton>
            </h1>
            <div className={styles.pills}>
              <span className={styles.statPill}>{staffCount} personal</span>
              <span className={styles.statPill}>{clientCount} clientes</span>
            </div>
          </div>
        </div>
        <IconTipButton
          tip="Nuevo usuario"
          aria-label="Nuevo usuario"
          tone="primary"
          onClick={() => {
            setCreated(null);
            setModalOpen(true);
          }}
        >
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
            placeholder="Buscar nombre, correo, DNI, rol o estado"
            aria-label="Buscar usuarios"
          />
        </label>
        <div className={styles.filters}>
          <div className={styles.filterGroup} role="group" aria-label="Tipo">
            <span className={styles.filterLabel}>Tipo</span>
            <div className={styles.filterChips}>
              {(
                [
                  ["all", "Todos"],
                  ["empresa", "Personal"],
                  ["dni", "Clientes"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={kindFilter === value ? styles.chipOn : styles.chip}
                  onClick={() => setKindFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup} role="group" aria-label="Estado">
            <span className={styles.filterLabel}>Estado</span>
            <div className={styles.filterChips}>
              {(
                [
                  ["all", "Todos"],
                  ["activo", "Activo"],
                  ["inactivo", "Inactivo"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={statusFilter === value ? styles.chipOn : styles.chip}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.mobileList} aria-busy={loading}>
        {loading ? (
          <p className={styles.emptyCard}>Cargando usuarios…</p>
        ) : pageRows.length === 0 ? (
          <p className={styles.emptyCard}>No hay usuarios con ese criterio.</p>
        ) : (
          pageRows.map((row) => (
            <article key={`m-${row.kind}-${row.id}`} className={styles.userCard}>
              {userAvatar(row)}
              {accessCell(row)}
              <span className={styles.rolePill}>{row.role}</span>
              {statusCell(row)}
              {inviteCell(row)}
              {actionsCell(row)}
            </article>
          ))
        )}
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acceso</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Invitación</th>
              <th className={styles.actionsHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  Cargando usuarios…
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No hay usuarios con ese criterio.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className={row.active ? undefined : styles.rowInactive}>
                  <td>{userAvatar(row)}</td>
                  <td>{accessCell(row)}</td>
                  <td>
                    <span className={styles.rolePill}>{row.role}</span>
                  </td>
                  <td>{statusCell(row)}</td>
                  <td>{inviteCell(row)}</td>
                  <td>{actionsCell(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pager}>
        <p className={styles.pagerMeta}>
          {filtered.length === 0
            ? "0 resultados"
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} de ${filtered.length}`}
        </p>
        <div className={styles.pagerBtns}>
          <button type="button" className={styles.pageBtn} disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </button>
          <span className={styles.pageNum}>
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="users-modal-title"
              initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2 id="users-modal-title">{created ? "Usuario listo" : "Registrar usuario"}</h2>
                  <p className={styles.muted}>
                    {created
                      ? "Comparte la clave temporal o el link de activación."
                      : `Sesión: ${session.displayName}`}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={() => setModalOpen(false)}>
                  <IconClose />
                </IconTipButton>
              </div>

              {created ? (
                <div className={styles.createdBox}>
                  <p className={styles.createdMsg}>{created.message}</p>
                  <div className={styles.createdRow}>
                    <div>
                      <p className={styles.fieldLabel}>Usuario</p>
                      <p className={styles.createdValue}>{created.user.apodo}</p>
                    </div>
                    <div>
                      <p className={styles.fieldLabel}>Acceso</p>
                      <div className={styles.access}>
                        <p className={styles.createdValue}>{created.user.identifier}</p>
                        <IconTipButton tip="Copiar acceso" aria-label="Copiar acceso" onClick={() => copyText("Acceso", created.user.identifier)}>
                          <IconCopy />
                        </IconTipButton>
                      </div>
                    </div>
                  </div>
                  {created.temporaryPassword ? (
                    <div className={styles.secretCard}>
                      <p className={styles.fieldLabel}>Clave temporal</p>
                      <div className={styles.access}>
                        <code>{created.temporaryPassword}</code>
                        <IconTipButton tip="Copiar clave" aria-label="Copiar clave" onClick={() => copyText("Clave", created.temporaryPassword!)}>
                          <IconCopy />
                        </IconTipButton>
                      </div>
                    </div>
                  ) : null}
                  {created.invitePath ? (
                    <div className={styles.secretCard}>
                      <p className={styles.fieldLabel}>Link de activación</p>
                      <div className={styles.access}>
                        <code className={styles.longCode}>{absoluteInvite(created.invitePath)}</code>
                        <IconTipButton
                          tip="Copiar link"
                          aria-label="Copiar link"
                          onClick={() => copyText("Link", absoluteInvite(created.invitePath))}
                        >
                          <IconLink />
                        </IconTipButton>
                      </div>
                    </div>
                  ) : null}
                  <div className={styles.modalActions}>
                    <IconTipButton tip="Listo" aria-label="Listo" tone="primary" onClick={() => setModalOpen(false)}>
                      <IconCheck />
                    </IconTipButton>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={onCreate}>
                  <div className={styles.segment}>
                    <button type="button" className={kind === "empresa" ? styles.segOn : styles.seg} onClick={() => setKind("empresa")}>
                      Personal (correo)
                    </button>
                    <button type="button" className={kind === "dni" ? styles.segOn : styles.seg} onClick={() => setKind("dni")}>
                      Cliente (DNI)
                    </button>
                  </div>

                  <label className={styles.field}>
                    <span>Nombre</span>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} />
                  </label>

                  {kind === "empresa" ? (
                    <>
                      <label className={styles.field}>
                        <span>Correo de empresa</span>
                        <input
                          type="email"
                          value={correo}
                          onChange={(e) => setCorreo(e.target.value)}
                          required
                          placeholder="nombre@finantech.test"
                        />
                      </label>
                      <ComboSelect
                        label="Rol"
                        value={role}
                        options={[
                          { value: "OPERACIONES", label: "Operaciones" },
                          ...(canSuper ? [{ value: "SUPERADMIN", label: "Superadmin" }] : []),
                        ]}
                        onChange={setRole}
                      />
                    </>
                  ) : (
                    <label className={styles.field}>
                      <span>DNI</span>
                      <input
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        required
                        inputMode="numeric"
                        placeholder="8 dígitos"
                      />
                    </label>
                  )}

                  <p className={styles.hint}>
                    Se genera una clave temporal y un link. Con el link el usuario define su contraseña
                    {kind === "empresa" ? " y vincula el autenticador" : ""}.
                  </p>

                  <div className={styles.modalActions}>
                    <IconTipButton tip="Cancelar" aria-label="Cancelar" onClick={() => setModalOpen(false)}>
                      <IconClose />
                    </IconTipButton>
                    <IconTipButton tip={creating ? "Creando…" : "Crear usuario"} aria-label="Crear usuario" tone="primary" type="submit" disabled={creating}>
                      <IconCheck />
                    </IconTipButton>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
