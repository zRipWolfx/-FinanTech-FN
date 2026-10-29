"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import type { SessionUser } from "@/modules/auth/types";
import { creditApi, type NotificationRow } from "@/modules/finance/creditApi";
import {
  groupsForKind,
  modulePath,
  PATHS,
  resolveLocation,
  type NavGroup,
} from "@/modules/navigation";
import { brandLogoSrc } from "@/modules/shared/ui/brandLogo";
import styles from "./AppShell.module.css";

type AppShellProps = {
  session: SessionUser;
  photoSrc?: string | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  loggingOut?: boolean;
  children: ReactNode;
};

function Icon({ d }: { d: string }) {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  dash: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z",
  prestamos: "M12 3v18M7 8h7.5a2.5 2.5 0 0 1 0 5H9.5a2.5 2.5 0 0 0 0 5H17",
  pagos: "M4 7h16v10H4zM4 11h16",
  clientes: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19c.7-2.4 2.6-3.5 4.5-3.5s3.8 1.1 4.5 3.5",
  cobranza: "M8 3v3M16 3v3M5 8h14v11H5zM8 13h3",
  reportes: "M5 19V9M12 19V5M19 19v-7",
  docs: "M7 3.5h7L18 7.5V20H7zM14 3.5V8h4",
  admin: "M12 3 14.2 8l5 .5-3.8 3.2 1.2 4.8L12 14.2 7.4 16.5 8.6 11.7 4.8 8.5 9.8 8z",
  solicitudes: "M8 4h8l3 3v13H8zM11 11h6M11 15h6",
  vigentes: "M12 3v18M7 8h7.5a2.5 2.5 0 0 1 0 5H9.5a2.5 2.5 0 0 0 0 5H17",
  cronogramas: "M8 3v3M16 3v3M5 8h14v11H5zM8 13h3M13 13h3",
  "registrar-pago": "M4 7h16v10H4zM4 11h16",
  cuotas: "M8 7h12M8 12h12M8 17h8M5 7h.01M5 12h.01M5 17h.01",
  mora: "M12 8v5M12 16h.01M12 3 2.5 20h19z",
  "cartera-clientes": "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c.7-2.4 2.6-3.5 4.5-3.5s3.8 1.1 4.5 3.5",
  "consulta-dni": "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  vencimientos: "M8 3v3M16 3v3M5 8h14v11H5zM9 14l2 2 4-4",
  gestiones: "M6.5 9.5a5.5 5.5 0 0 1 11 0V14l1.5 2.5h-14L6.5 14z",
  "reporte-cartera": "M5 19V9M12 19V5M19 19v-7",
  "reporte-cobranza": "M4 16l5-5 4 3 7-8",
  usuarios: "M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM6 19c.8-2.4 2.8-3.5 6-3.5s5.2 1.1 6 3.5",
  parametros: "M5 8h14M5 16h14M9 5v6M15 13v6",
  "prestamo-activo": "M12 3v18M7 8h7.5a2.5 2.5 0 0 1 0 5H9.5a2.5 2.5 0 0 0 0 5H17",
  "cronograma-cliente": "M8 3v3M16 3v3M5 8h14v11H5z",
  "cuotas-cliente": "M8 7h12M8 12h12M8 17h8",
  "historial-pagos": "M4 12a8 8 0 1 0 2.2-5.5M4 4v5h5",
  contrato: "M7 3.5h7L18 7.5V20H7zM14 3.5V8h4",
  comprobantes: "M7 4h10v16l-2-1.2-3 1.2-3-1.2L7 20z",
};

export function AppShell({
  session,
  photoSrc = null,
  theme,
  onToggleTheme,
  onLogout,
  loggingOut = false,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const groups = groupsForKind(session.kind);
  const location = resolveLocation(pathname, groups);

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(location.groupId);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initial = session.displayName.trim().charAt(0).toUpperCase() || "A";
  const role = session.kind === "empresa" ? "OPERACIONES" : "CLIENTE";
  const onProfile = location.kind === "profile";
  const isClient = session.kind === "dni";

  useEffect(() => {
    if (!isClient) return;
    let alive = true;
    const refresh = () => {
      void creditApi
        .unreadNotifications()
        .then((r) => {
          if (alive) setUnread(r.count);
        })
        .catch(() => {
          if (alive) setUnread(0);
        });
    };
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [isClient]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const onDashboard = location.kind === "dashboard";
  const normalized = query.trim().toLowerCase();

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          normalized.length === 0 ||
          item.label.toLowerCase().includes(normalized) ||
          group.label.toLowerCase().includes(normalized),
      ),
    }))
    .filter((group) => group.items.length > 0);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    setMenuOpen(false);
  }

  function goHome() {
    go(PATHS.dashboard);
  }

  function goSection() {
    if (location.groupId) {
      setExpanded(location.groupId);
      setOpen(true);
      return;
    }
    if (onProfile) {
      go(PATHS.profile.root);
      return;
    }
    goHome();
  }

  useEffect(() => {
    if (location.groupId) setExpanded(location.groupId);
  }, [location.groupId]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`} data-theme={theme}>
      {open ? (
        <button type="button" className={styles.overlay} aria-label="Cerrar menú" onClick={() => setOpen(false)} />
      ) : null}

      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${open ? styles.sidebarOpen : ""}`}>
        <button
          type="button"
          className={styles.collapse}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          onClick={() =>
            setCollapsed((value) => {
              const next = !value;
              if (next) setExpanded(null);
              return next;
            })
          }
        >
          <svg
            className={`${styles.collapseIcon} ${collapsed ? styles.collapseIconOpen : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M14 6 8 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={styles.brand}>
          <span className={styles.logoTile}>
            <Image
              className={styles.brandLogo}
              src={brandLogoSrc("light")}
              alt="FinanTech"
              width={40}
              height={40}
              priority
            />
          </span>
          <div className={styles.brandCopy}>
            <p className={styles.brandName}>FinanTech</p>
            <p className={styles.brandSub}>S.A.</p>
          </div>
        </div>

        <label className={styles.sideSearch}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            className={styles.search}
            placeholder="Buscar módulo..."
            aria-label="Buscar módulo"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <nav className={styles.nav}>
          <button
            type="button"
            className={`${styles.item} ${onDashboard ? styles.itemActive : ""}`}
            onClick={goHome}
          >
            <span className={styles.itemLabel}>
              <Icon d={ICONS.dash} />
              <span className={styles.labelText}>Dashboard</span>
            </span>
          </button>
          <div className={styles.navRule} />

          {visibleGroups.length === 0 ? <p className={styles.emptyNav}>No hay un módulo con ese nombre.</p> : null}

          {visibleGroups.map((group: NavGroup) => {
            const isOpen = normalized.length > 0 || expanded === group.id;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  className={styles.groupBtn}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setExpanded(group.id);
                      return;
                    }
                    setExpanded(isOpen && normalized.length === 0 ? null : group.id);
                  }}
                >
                  <span className={styles.groupLabel}>
                    <Icon d={ICONS[group.id] ?? ICONS.admin} />
                    <span className={styles.labelText}>{group.label}</span>
                  </span>
                  <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d={isOpen ? "M6 14l6-6 6 6" : "M6 10l6 6 6-6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                {isOpen ? (
                  <div className={styles.sub}>
                    {group.items.map((item) => {
                      const href = modulePath(group.id, item.id);
                      const selected = location.moduleId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.subBtn} ${selected ? styles.subOn : ""}`}
                          onClick={() => {
                            setExpanded(group.id);
                            go(href);
                          }}
                        >
                          <Icon d={ICONS[item.id] ?? ICONS[group.id] ?? ICONS.admin} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className={styles.foot}>
          <button
            type="button"
            className={styles.footProfile}
            onClick={() => go(PATHS.profile.root)}
            aria-label="Abrir perfil"
          >
            <div className={styles.avatar}>
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoSrc} alt="" className={styles.avatarImg} />
              ) : (
                initial
              )}
            </div>
            <div className={styles.footCopy}>
              <p className={styles.footName}>{session.displayName}</p>
              <p className={styles.footRole}>{session.kind === "empresa" ? "Operaciones" : "Cliente"}</p>
            </div>
          </button>
          <button type="button" className={styles.logout} disabled={loggingOut} onClick={onLogout} aria-label="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 7V5a1 1 0 0 1 1-1h8v16h-8a1 1 0 0 1-1-1v-2M4 12h11M12 8l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button type="button" className={styles.menuBtn} aria-label="Abrir menú" onClick={() => setOpen(true)}>
              <Icon d="M4 7h16M4 12h16M4 17h16" />
            </button>

            <nav className={styles.crumbs} aria-label="Ubicación">
              <button type="button" className={styles.crumbLink} onClick={goSection}>
                {location.section}
              </button>
              <span className={styles.crumbSep} aria-hidden>
                ›
              </span>
              <button
                type="button"
                className={styles.crumbNow}
                onClick={() => {
                  if (onProfile) {
                    go(PATHS.profile.root);
                    return;
                  }
                  if (location.moduleId && location.groupId) {
                    go(modulePath(location.groupId, location.moduleId));
                    return;
                  }
                  goHome();
                }}
              >
                {location.current}
              </button>
            </nav>
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />
            </span>
            <input className={styles.topSearch} placeholder="Buscar cliente, DNI o préstamo" aria-label="Buscar cliente, DNI o préstamo" />
            <span className={styles.kbd}>Ctrl K</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={`${styles.iconBtn} ${styles.desktopOnly}`} aria-label="Actualizar" onClick={goHome}>
              <Icon d="M20 12a8 8 0 1 1-2.2-5.5M20 4v5h-5" />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Cambiar tema" onClick={onToggleTheme}>
              {theme === "dark" ? (
                <Icon d="M12 4v2M12 18v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              ) : (
                <Icon d="M16 14.5A6.5 6.5 0 0 1 9.5 8 6.2 6.2 0 1 0 16 14.5z" />
              )}
            </button>
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.desktopOnly}`}
                aria-label="Notificaciones"
                aria-expanded={notifOpen}
                onClick={() => {
                  if (!isClient) {
                    setNotifOpen((v) => !v);
                    return;
                  }
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) {
                    void creditApi
                      .notifications()
                      .then((rows) => {
                        setNotifs(rows);
                        setUnread(rows.filter((n) => !n.leida).length);
                      })
                      .catch(() => setNotifs([]));
                    void creditApi.markNotificationsRead().then(() => setUnread(0));
                  }
                }}
              >
                <Icon d="M6.5 9.5a5.5 5.5 0 0 1 11 0V14l1.5 2.5h-14L6.5 14zM10 18.5a2 2 0 0 0 4 0" />
                {unread > 0 ? <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span> : null}
              </button>
              {notifOpen ? (
                <div className={styles.notifPanel} role="dialog" aria-label="Notificaciones">
                  <p className={styles.menuLabel}>Notificaciones</p>
                  {!isClient ? (
                    <p className={styles.notifEmpty}>Las alertas de cliente aparecen al aprobar o rechazar solicitudes.</p>
                  ) : notifs.length === 0 ? (
                    <p className={styles.notifEmpty}>Sin notificaciones.</p>
                  ) : (
                    <ul className={styles.notifList}>
                      {notifs.slice(0, 8).map((n) => (
                        <li key={n.id}>
                          <strong>{n.titulo}</strong>
                          <span>{n.mensaje}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            <div className={styles.profileWrap} ref={menuRef}>
              <button
                type="button"
                className={`${styles.profileBtn} ${menuOpen ? styles.profileBtnOn : ""} ${onProfile ? styles.profileBtnOn : ""}`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <span className={styles.profileAvatar}>
                  {photoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoSrc} alt="" className={styles.avatarImg} />
                  ) : (
                    initial
                  )}
                </span>
                <span className={styles.profileMeta}>
                  <span className={styles.profileName}>{session.displayName}</span>
                  <span className={styles.profileRole}>{role}</span>
                </span>
              </button>

              {menuOpen ? (
                <div className={styles.profileMenu} role="menu">
                  <p className={styles.menuLabel}>Mi cuenta</p>
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={() => go(PATHS.profile.root)}>
                    Perfil
                  </button>
                  <div className={styles.menuRule} />
                  <button type="button" role="menuitem" className={styles.menuLogout} disabled={loggingOut} onClick={onLogout}>
                    {loggingOut ? "Cerrando…" : "Cerrar sesión"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
