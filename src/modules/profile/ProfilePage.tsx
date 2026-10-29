"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import QRCode from "qrcode";

import { authApi } from "@/modules/auth/services/authApi";
import type { ProfileResponse } from "@/modules/auth/types";
import { PATHS, type ProfileViewId } from "@/modules/navigation";
import { easeOut } from "@/modules/shared/lib/motion";
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconHelp,
  IconLogout,
  IconPencil,
  IconShield,
  IconShieldOff,
  IconTipButton,
  IconVerify,
} from "@/modules/shared/ui/IconTipButton";
import { useToast } from "@/modules/shared/ui/FloatingToast";
import { useAppSession } from "@/modules/shell";
import styles from "./ProfilePage.module.css";

type ProfilePageProps = {
  view: ProfileViewId;
};

type EditableField =
  | "nombre"
  | "apodo"
  | "telefono"
  | "correo"
  | "role"
  | "direccion"
  | "trabajo"
  | "ingresosMensuales";
type ModalKind = "email" | "totp" | null;

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfilePage({ view }: ProfilePageProps) {
  const { session, logout, loggingOut, photoSrc, refreshPhoto, syncDisplayName } = useAppSession();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const skipBlurSave = useRef(false);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [nombreDraft, setNombreDraft] = useState("");
  const [apodoDraft, setApodoDraft] = useState(session.displayName);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [correoDraft, setCorreoDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState("OPERACIONES");
  const [direccionDraft, setDireccionDraft] = useState("");
  const [trabajoDraft, setTrabajoDraft] = useState("");
  const [ingresosDraft, setIngresosDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalKind>(null);
  const [emailLink, setEmailLink] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailMailed, setEmailMailed] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [totpMode, setTotpMode] = useState<"idle" | "unlink" | "link" | "replace">("idle");
  const [busyAction, setBusyAction] = useState(false);

  const staff = (profile?.kind ?? session.kind) === "empresa";
  const displayName = profile?.displayName ?? session.displayName;
  const initials = initialsFrom(displayName) || "FT";
  const sessionExpired = Boolean(error && /sesión inválida/i.test(error));
  const localPhoto = photoSrc;
  const canEdit = Boolean(profile) && !sessionExpired && view === "ficha";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await authApi.getProfile();
        if (cancelled) return;
        applyProfile(data);
        await refreshPhoto();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el perfil");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshPhoto]);

  function applyProfile(data: ProfileResponse) {
    setProfile(data);
    setNombreDraft(data.nombre);
    setApodoDraft(data.apodo);
    setPhoneDraft(data.telefono ?? "");
    setCorreoDraft(data.correo ?? "");
    setRoleDraft(data.roleCode);
    setDireccionDraft(data.direccion ?? "");
    setTrabajoDraft(data.trabajo ?? "");
    setIngresosDraft(data.ingresosMensuales ?? "");
    syncDisplayName(data.displayName);
  }

  function beginEdit(field: EditableField) {
    if (!profile || !canEdit) return;
    if (field === "role" && !profile.canEditRole) return;
    setNombreDraft(profile.nombre);
    setApodoDraft(profile.apodo);
    setPhoneDraft(profile.telefono ?? "");
    setCorreoDraft(profile.correo ?? "");
    setRoleDraft(profile.roleCode);
    setDireccionDraft(profile.direccion ?? "");
    setTrabajoDraft(profile.trabajo ?? "");
    setIngresosDraft(profile.ingresosMensuales ?? "");
    setEditingField(field);
    setError(null);
  }

  async function commitField(field: EditableField) {
    if (!profile || saving) return;
    setEditingField(null);

    const nextNombre = field === "nombre" ? nombreDraft.trim() : profile.nombre;
    const nextApodo = field === "apodo" ? apodoDraft.trim() : profile.apodo;
    const nextPhone = field === "telefono" ? phoneDraft.trim() : (profile.telefono ?? "");
    const nextCorreo = field === "correo" ? correoDraft.trim() : (profile.correo ?? "");
    const nextRole = field === "role" ? roleDraft : profile.roleCode;
    const nextDireccion = field === "direccion" ? direccionDraft.trim() : (profile.direccion ?? "");
    const nextTrabajo = field === "trabajo" ? trabajoDraft.trim() : (profile.trabajo ?? "");
    const nextIngresos =
      field === "ingresosMensuales" ? ingresosDraft.trim().replace(",", ".") : (profile.ingresosMensuales ?? "");

    if (!nextNombre || !nextApodo) {
      toast.error("Nombre y apodo son obligatorios");
      applyProfile(profile);
      return;
    }
    if (!staff && field === "correo" && !nextCorreo.includes("@")) {
      toast.error("Ingresa un correo válido");
      applyProfile(profile);
      return;
    }

    const unchanged =
      nextNombre === profile.nombre &&
      nextApodo === profile.apodo &&
      nextPhone === (profile.telefono ?? "") &&
      nextCorreo === (profile.correo ?? "") &&
      nextRole === profile.roleCode &&
      nextDireccion === (profile.direccion ?? "") &&
      nextTrabajo === (profile.trabajo ?? "") &&
      nextIngresos === (profile.ingresosMensuales ?? "");

    if (unchanged) return;

    setSaving(true);
    setError(null);
    try {
      const data = await authApi.updateProfile({
        nombre: nextNombre,
        apodo: nextApodo,
        telefono: nextPhone || null,
        correo: staff ? undefined : nextCorreo || null,
        role: profile.canEditRole ? nextRole : null,
        direccion: staff ? undefined : nextDireccion || null,
        trabajo: staff ? undefined : nextTrabajo || null,
        ingresosMensuales: staff ? undefined : nextIngresos || null,
      });
      applyProfile(data);
      toast.success(
        !staff && field === "correo" && !data.emailVerified
          ? "Correo guardado. Verifícalo en Seguridad."
          : "Guardado",
      );
    } catch (err) {
      applyProfile(profile);
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function onFieldBlur(field: EditableField) {
    if (skipBlurSave.current) {
      skipBlurSave.current = false;
      return;
    }
    void commitField(field);
  }

  function cancelEdit() {
    skipBlurSave.current = true;
    if (profile) applyProfile(profile);
    setEditingField(null);
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const data = await authApi.uploadProfilePhoto(file);
      applyProfile(data);
      await refreshPhoto();
      toast.success("Foto guardada en tu perfil");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  function closeModal() {
    setModal(null);
    setTotpCode("");
    setSetupQr(null);
    setSetupSecret(null);
    setTotpMode("idle");
    setEmailLink(null);
    setEmailMessage(null);
    setEmailMailed(false);
  }

  async function openEmailVerifyModal() {
    setBusyAction(true);
    setError(null);
    setEmailLink(null);
    setEmailMessage(null);
    setEmailMailed(false);
    setModal("email");
    try {
      const res = await authApi.sendEmailCode();
      setEmailMessage(res.message);
      setEmailMailed(Boolean(res.mailed));
      setEmailLink(res.verifyUrl ?? (res.verifyPath ? `https://finan.mtasoftware.cloud${res.verifyPath}` : null));
      toast.success(res.mailed ? "Correo enviado" : "Enlace listo");
    } catch (err) {
      setModal(null);
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el enlace");
    } finally {
      setBusyAction(false);
    }
  }

  function openTotpModal() {
    setError(null);
    setTotpCode("");
    setSetupQr(null);
    setSetupSecret(null);
    setTotpMode("idle");
    setModal("totp");
  }

  async function startLinkAuthenticator() {
    setBusyAction(true);
    setError(null);
    try {
      const setup = await authApi.startEnableTwoFactor();
      setSetupSecret(setup.secret);
      const qr = await QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 180 });
      setSetupQr(qr);
      setTotpMode("link");
      setTotpCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el autenticador");
    } finally {
      setBusyAction(false);
    }
  }

  async function confirmLinkAuthenticator() {
    setBusyAction(true);
    setError(null);
    try {
      const data = await authApi.confirmEnableTwoFactor(totpCode.trim());
      applyProfile(data);
      setTotpCode("");
      setSetupQr(null);
      setSetupSecret(null);
      setTotpMode("idle");
      toast.success("Autenticador vinculado");
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo vincular el autenticador");
    } finally {
      setBusyAction(false);
    }
  }

  async function unlinkAuthenticator() {
    setBusyAction(true);
    setError(null);
    try {
      const data = await authApi.disableTwoFactor(totpCode.trim());
      applyProfile(data);
      setTotpCode("");
      setSetupQr(null);
      setSetupSecret(null);
      setTotpMode("idle");
      toast.success("Autenticador desvinculado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desvincular");
    } finally {
      setBusyAction(false);
    }
  }

  async function replaceAuthenticator() {
    setBusyAction(true);
    setError(null);
    try {
      await authApi.disableTwoFactor(totpCode.trim());
      const setup = await authApi.startEnableTwoFactor();
      setSetupSecret(setup.secret);
      const qr = await QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 180 });
      setSetupQr(qr);
      setTotpMode("link");
      setTotpCode("");
      const refreshed = await authApi.getProfile();
      applyProfile(refreshed);
      toast.info("Escanea el nuevo autenticador");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reemplazar el autenticador");
    } finally {
      setBusyAction(false);
    }
  }

  function renderEditableValue(
    field: EditableField,
    value: string,
    emptyLabel: string,
    input: "text" | "tel" | "email" | "select",
  ) {
    const isEditing = editingField === field;
    const editable = field === "role" ? Boolean(profile?.canEditRole) : canEdit;

    if (isEditing) {
      if (input === "select") {
        return (
          <div className={styles.inlineEdit}>
            <select
              className={styles.inlineInput}
              value={roleDraft}
              autoFocus
              disabled={saving}
              onChange={(e) => setRoleDraft(e.target.value)}
              onBlur={() => onFieldBlur(field)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelEdit();
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLSelectElement).blur();
                }
              }}
            >
              <option value="OPERACIONES">Operaciones</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
            <span className={styles.inlineAction}>
              <IconTipButton
                tip="Cancelar"
                aria-label="Cancelar"
                onMouseDown={(e) => {
                  e.preventDefault();
                  cancelEdit();
                }}
              >
                <IconClose />
              </IconTipButton>
            </span>
          </div>
        );
      }

      return (
        <div className={styles.inlineEdit}>
          <input
            className={styles.inlineInput}
            type={input === "tel" ? "tel" : input === "email" ? "email" : "text"}
            value={
              field === "nombre"
                ? nombreDraft
                : field === "apodo"
                  ? apodoDraft
                  : field === "telefono"
                    ? phoneDraft
                    : field === "correo"
                      ? correoDraft
                      : field === "direccion"
                        ? direccionDraft
                        : field === "trabajo"
                          ? trabajoDraft
                          : field === "ingresosMensuales"
                            ? ingresosDraft
                            : phoneDraft
            }
            autoFocus
            disabled={saving}
            maxLength={field === "telefono" ? 30 : field === "direccion" ? 220 : field === "correo" ? 160 : 120}
            inputMode={input === "tel" ? "tel" : input === "email" ? "email" : field === "ingresosMensuales" ? "decimal" : undefined}
            onChange={(e) => {
              if (field === "nombre") setNombreDraft(e.target.value);
              if (field === "apodo") setApodoDraft(e.target.value);
              if (field === "telefono") setPhoneDraft(e.target.value);
              if (field === "correo") setCorreoDraft(e.target.value);
              if (field === "direccion") setDireccionDraft(e.target.value);
              if (field === "trabajo") setTrabajoDraft(e.target.value);
              if (field === "ingresosMensuales") setIngresosDraft(e.target.value);
            }}
            onBlur={() => onFieldBlur(field)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEdit();
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <span className={styles.inlineAction}>
            <IconTipButton
              tip="Cancelar"
              aria-label="Cancelar"
              onMouseDown={(e) => {
                e.preventDefault();
                cancelEdit();
              }}
            >
              <IconClose />
            </IconTipButton>
          </span>
        </div>
      );
    }

    return (
      <div className={styles.valueWithAction}>
        <span className={styles.valueText}>{value || emptyLabel}</span>
        {editable ? (
          <span className={styles.inlineAction}>
            <IconTipButton
              tip="Editar"
              aria-label={`Editar ${field}`}
              disabled={!canEdit || saving}
              onClick={() => beginEdit(field)}
            >
              <IconPencil />
            </IconTipButton>
          </span>
        ) : null}
      </div>
    );
  }

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: easeOut },
      };

  return (
    <motion.section className={styles.wrap} {...motionProps}>
      <motion.header
        className={styles.head}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        <div className={styles.avatarBlock}>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploading || loading}
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto"
          >
            {localPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={localPhoto} alt="" className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarFallback}>{initials}</span>
            )}
            <span className={styles.online} aria-hidden />
            <span className={styles.avatarOverlay}>{uploading ? "…" : "Foto"}</span>
          </button>
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={handlePhotoChange}
          />
        </div>

        <div className={styles.headMain}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{displayName}</h1>
            <span className={styles.pillBlue}>{profile?.role ?? (staff ? "Operaciones" : "Cliente")}</span>
            <span className={styles.pillGreen}>Activo</span>
          </div>
          <p className={styles.role}>
            {staff
              ? "Personal de FinanTech S.A. · Préstamos y cobranza"
              : "Cliente FinanTech S.A. · Consulta de crédito y pagos"}
          </p>
          {profile?.identifier ? (
            <div className={styles.meta}>
              <span className={styles.metaItem}>{profile.identifier}</span>
              {profile.telefono ? <span className={styles.metaItem}>{profile.telefono}</span> : null}
            </div>
          ) : null}
        </div>

        <IconTipButton
          tip={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          aria-label="Cerrar sesión"
          tone="danger"
          disabled={loggingOut}
          onClick={logout}
        >
          <IconLogout />
        </IconTipButton>
      </motion.header>

      <nav className={styles.tabs} aria-label="Secciones del perfil">
        <Link href={PATHS.profile.ficha} className={view === "ficha" ? styles.tabActive : styles.tab}>
          {staff ? "Ficha laboral" : "Datos personales"}
        </Link>
        <Link href={PATHS.profile.seguridad} className={view === "seguridad" ? styles.tabActive : styles.tab}>
          Seguridad y acceso
        </Link>
      </nav>

      {error ? (
        <div className={styles.error} role="alert">
          <span>{sessionExpired ? "Tu sesión expiró. Vuelve a iniciar sesión." : error}</span>
          {sessionExpired ? (
            <IconTipButton tip="Iniciar sesión" aria-label="Iniciar sesión" tone="danger" onClick={logout}>
              <IconLogout />
            </IconTipButton>
          ) : null}
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        {view === "ficha" ? (
          <motion.div
            key="ficha"
            className={styles.panel}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >
            <div className={styles.card}>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.cardTitle}>{staff ? "Datos de acceso" : "Datos personales"}</h2>
                <IconTipButton tip="Toca el lápiz para editar. Al hacer clic afuera se guarda." aria-label="Ayuda">
                  <IconHelp />
                </IconTipButton>
              </div>
              {loading ? (
                <p className={styles.hint}>Cargando perfil…</p>
              ) : (
                <dl className={styles.list}>
                  <div className={styles.row}>
                    <dt>Empresa</dt>
                    <dd>{profile?.empresa ?? "FinanTech S.A."}</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>Tipo de acceso</dt>
                    <dd>{profile?.accessType ?? (staff ? "Correo de empresa" : "DNI de cliente")}</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>{staff ? "Correo" : "DNI"}</dt>
                    <dd>{profile?.identifier ?? "No disponible"}</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>{staff ? "Nombre" : "Nombre completo"}</dt>
                    <dd>{renderEditableValue("nombre", profile?.nombre ?? "", "—", "text")}</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>Apodo</dt>
                    <dd>{renderEditableValue("apodo", profile?.apodo ?? displayName, "—", "text")}</dd>
                  </div>
                  {!staff ? (
                    <div className={styles.row}>
                      <dt>Correo (obligatorio)</dt>
                      <dd>{renderEditableValue("correo", profile?.correo ?? "", "Sin registrar", "email")}</dd>
                    </div>
                  ) : null}
                  <div className={styles.row}>
                    <dt>Teléfono</dt>
                    <dd>{renderEditableValue("telefono", profile?.telefono ?? "", "Sin registrar", "tel")}</dd>
                  </div>
                  {!staff ? (
                    <>
                      <div className={styles.row}>
                        <dt>Dirección</dt>
                        <dd>{renderEditableValue("direccion", profile?.direccion ?? "", "Sin registrar", "text")}</dd>
                      </div>
                      <div className={styles.row}>
                        <dt>Trabajo</dt>
                        <dd>{renderEditableValue("trabajo", profile?.trabajo ?? "", "Sin registrar", "text")}</dd>
                      </div>
                      <div className={styles.row}>
                        <dt>Ganancias mensuales</dt>
                        <dd>
                          {renderEditableValue(
                            "ingresosMensuales",
                            profile?.ingresosMensuales ? `S/ ${profile.ingresosMensuales}` : "",
                            "Sin registrar",
                            "text",
                          )}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div className={styles.row}>
                    <dt>Rol</dt>
                    <dd>
                      {profile?.canEditRole
                        ? renderEditableValue("role", profile.role, staff ? "Operaciones" : "Cliente", "select")
                        : (
                            <div className={styles.valueWithAction}>
                              <span className={styles.valueText}>{profile?.role ?? (staff ? "Operaciones" : "Cliente")}</span>
                            </div>
                          )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="seguridad"
            className={styles.panel}
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >
            <div className={styles.card}>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.sectionEyebrow}>Parámetros de seguridad de la cuenta</h2>
                <IconTipButton tip="Acciones con icono. Pasa el mouse para ver qué hace cada una." aria-label="Ayuda">
                  <IconHelp />
                </IconTipButton>
              </div>
              <ul className={styles.secList}>
                <li className={styles.secItem}>
                  <div>
                    <p className={styles.secTitle}>Rol asignado</p>
                    <p className={styles.hint}>Solo Superadmin puede modificar el rol desde la ficha.</p>
                  </div>
                  <span className={styles.badge}>{profile?.role ?? (staff ? "Operaciones" : "Cliente")}</span>
                </li>

                <li className={styles.secItem}>
                  <div>
                    <p className={styles.secTitle}>Verificación de correo</p>
                    <p className={styles.hint}>
                      {staff
                        ? "Te enviamos un enlace al correo de empresa para confirmarlo."
                        : "Obligatorio: sin correo verificado no puedes solicitar préstamos ni pagar cuotas."}
                    </p>
                  </div>
                  <div className={styles.secActions}>
                    <span className={profile?.emailVerified ? styles.ok : styles.muted}>
                      {profile?.emailVerified ? "Verificado" : "Pendiente"}
                    </span>
                    {!profile?.emailVerified ? (
                      <IconTipButton
                        tip={
                          !staff && !profile?.correo
                            ? "Primero registra tu correo en Datos personales"
                            : "Verificar correo"
                        }
                        aria-label="Verificar correo"
                        tone="primary"
                        disabled={busyAction || (!staff && !profile?.correo)}
                        onClick={() => void openEmailVerifyModal()}
                      >
                        <IconVerify />
                      </IconTipButton>
                    ) : null}
                  </div>
                </li>

                {staff ? (
                  <li className={styles.secItem}>
                    <div>
                      <p className={styles.secTitle}>Verificación en dos pasos</p>
                      <p className={styles.hint}>Autenticador (app) para personal FinanTech S.A.</p>
                    </div>
                    <div className={styles.secActions}>
                      <span className={profile?.twoFactorEnabled ? styles.ok : styles.muted}>
                        {profile?.twoFactorEnabled ? "Activa" : "Inactiva"}
                      </span>
                      <IconTipButton
                        tip="Gestionar autenticador"
                        aria-label="Gestionar autenticador"
                        tone="primary"
                        disabled={busyAction}
                        onClick={openTotpModal}
                      >
                        <IconShield />
                      </IconTipButton>
                    </div>
                  </li>
                ) : null}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "email" ? (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="email-verify-title"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2 id="email-verify-title">Verificar correo</h2>
                  <p className={styles.hint}>Sin códigos: solo el enlace del mensaje.</p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={closeModal}>
                  <IconClose />
                </IconTipButton>
              </div>
              <p className={styles.modalBody}>
                {emailMessage ?? "Se envió un enlace para verificar tu correo."}
              </p>
              <p className={styles.hint}>
                {emailMailed
                  ? "Revisa tu bandeja. El enlace usa finan.mtasoftware.cloud y vence en unos minutos."
                  : "Si el correo no llega, copia el enlace (finan.mtasoftware.cloud)."}
              </p>
              {emailLink && !emailMailed ? (
                <div className={styles.linkBox}>
                  <code className={styles.longCode}>{emailLink}</code>
                  <IconTipButton
                    tip="Copiar enlace"
                    aria-label="Copiar enlace"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(emailLink);
                        toast.success("Enlace copiado");
                      } catch {
                        toast.error("No se pudo copiar el enlace");
                      }
                    }}
                  >
                    <IconCopy />
                  </IconTipButton>
                </div>
              ) : null}
              <div className={styles.modalActions}>
                <IconTipButton tip="Listo" aria-label="Listo" tone="primary" onClick={closeModal}>
                  <IconCheck />
                </IconTipButton>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {modal === "totp" ? (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="totp-modal-title"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2 id="totp-modal-title">Autenticador</h2>
                  <p className={styles.hint}>
                    {profile?.twoFactorEnabled
                      ? "Desvincula el actual o vincula uno nuevo."
                      : "Vincula una app de autenticación (Google Authenticator, etc.)."}
                  </p>
                </div>
                <IconTipButton tip="Cerrar" aria-label="Cerrar" onClick={closeModal}>
                  <IconClose />
                </IconTipButton>
              </div>

              {totpMode === "link" && setupQr ? (
                <div className={styles.totpSetup}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={setupQr} alt="QR autenticador" className={styles.qr} />
                  {setupSecret ? <p className={styles.hint}>Clave: {setupSecret}</p> : null}
                  <label className={styles.field}>
                    <span>Código del autenticador</span>
                    <input
                      className={styles.codeInput}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6 dígitos"
                      inputMode="numeric"
                      maxLength={6}
                      aria-label="Código del autenticador"
                    />
                  </label>
                  <div className={styles.modalActions}>
                    <IconTipButton tip="Cancelar" aria-label="Cancelar" onClick={closeModal}>
                      <IconClose />
                    </IconTipButton>
                    <IconTipButton
                      tip="Confirmar vínculo"
                      aria-label="Confirmar vínculo"
                      tone="primary"
                      disabled={busyAction || totpCode.length < 6}
                      onClick={() => void confirmLinkAuthenticator()}
                    >
                      <IconCheck />
                    </IconTipButton>
                  </div>
                </div>
              ) : profile?.twoFactorEnabled ? (
                <div className={styles.totpManage}>
                  {(totpMode === "unlink" || totpMode === "replace") && (
                    <label className={styles.field}>
                      <span>Código del autenticador actual</span>
                      <input
                        className={styles.codeInput}
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 dígitos"
                        inputMode="numeric"
                        maxLength={6}
                        aria-label="Código del autenticador actual"
                      />
                    </label>
                  )}
                  <div className={styles.modalActions}>
                    {totpMode === "idle" ? (
                      <>
                        <IconTipButton
                          tip="Desvincular autenticador"
                          aria-label="Desvincular autenticador"
                          tone="danger"
                          disabled={busyAction}
                          onClick={() => {
                            setTotpMode("unlink");
                            setTotpCode("");
                          }}
                        >
                          <IconShieldOff />
                        </IconTipButton>
                        <IconTipButton
                          tip="Vincular uno nuevo"
                          aria-label="Vincular uno nuevo"
                          tone="primary"
                          disabled={busyAction}
                          onClick={() => {
                            setTotpMode("replace");
                            setTotpCode("");
                          }}
                        >
                          <IconShield />
                        </IconTipButton>
                      </>
                    ) : totpMode === "unlink" ? (
                      <IconTipButton
                        tip="Confirmar desvínculo"
                        aria-label="Confirmar desvínculo"
                        tone="danger"
                        disabled={busyAction || totpCode.length < 6}
                        onClick={() => void unlinkAuthenticator()}
                      >
                        <IconShieldOff />
                      </IconTipButton>
                    ) : (
                      <IconTipButton
                        tip="Continuar con nuevo"
                        aria-label="Continuar con nuevo"
                        tone="primary"
                        disabled={busyAction || totpCode.length < 6}
                        onClick={() => void replaceAuthenticator()}
                      >
                        <IconShield />
                      </IconTipButton>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.modalActions}>
                  <IconTipButton
                    tip="Vincular autenticador"
                    aria-label="Vincular autenticador"
                    tone="primary"
                    disabled={busyAction}
                    onClick={() => void startLinkAuthenticator()}
                  >
                    <IconShield />
                  </IconTipButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
