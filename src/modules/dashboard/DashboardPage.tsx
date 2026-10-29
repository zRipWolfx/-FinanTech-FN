"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { authApi } from "@/modules/auth/services/authApi";
import { creditApi, type LoanRequestRow } from "@/modules/finance/creditApi";
import { PRESTAMOS_DEMO, money, type PrestamoDemo } from "@/modules/finance/loanDemoData";
import { easeOut } from "@/modules/shared/lib/motion";
import { modulePath } from "@/modules/navigation";
import { useAppSession } from "@/modules/shell";
import styles from "./DashboardPage.module.css";

const BLUE = "#2563eb";
const GREEN = "#16a34a";
const RED = "#ef4444";
const GRID = "#e8eef5";
const MUTED = "#94a3b8";

function findClientLoan(dni: string | null, displayName: string): PrestamoDemo | null {
  if (dni && /^\d{8}$/.test(dni)) {
    const byDni = PRESTAMOS_DEMO.find((p) => p.dni === dni);
    if (byDni) return byDni;
  }
  const q = displayName.trim().toLowerCase();
  if (q) {
    const byName = PRESTAMOS_DEMO.find(
      (p) => p.cliente.toLowerCase().includes(q) || q.includes(p.cliente.toLowerCase().split(" ")[0] ?? ""),
    );
    if (byName) return byName;
  }
  return PRESTAMOS_DEMO[1] ?? PRESTAMOS_DEMO[0] ?? null;
}

function ChartTooltip({
  active,
  payload,
  label,
  moneyMode,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  moneyMode?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label ? <p className={styles.tooltipLabel}>{label}</p> : null}
      {payload.map((entry) => (
        <p key={`${entry.name}-${entry.value}`} className={styles.tooltipRow}>
          <span style={{ background: entry.color ?? BLUE }} />
          {entry.name}:{" "}
          {moneyMode
            ? money(typeof entry.value === "number" ? entry.value : Number(entry.value) || 0)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

const CLIENT_SHORTCUTS = [
  { href: modulePath("prestamos", "prestamo-activo"), title: "Préstamo activo", tip: "Saldo y estado" },
  { href: modulePath("prestamos", "cronograma-cliente"), title: "Cronograma", tip: "Cuotas pactadas" },
  { href: modulePath("pagos", "cuotas-cliente"), title: "Cuotas", tip: "Pendientes y pagadas" },
  { href: modulePath("pagos", "historial-pagos"), title: "Historial", tip: "Pagos aplicados" },
  { href: modulePath("docs", "contrato"), title: "Contrato", tip: "Documento del crédito" },
  { href: modulePath("docs", "comprobantes"), title: "Comprobantes", tip: "Constancias de pago" },
];

export function DashboardPage() {
  const { session } = useAppSession();
  const reduceMotion = useReducedMotion();
  const staff = session.kind === "empresa";
  const [lineTab, setLineTab] = useState<"cobrado" | "programado">("cobrado");
  const [requests, setRequests] = useState<LoanRequestRow[]>([]);
  const [clientDni, setClientDni] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setRequests(await creditApi.listRequests());
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    if (!staff) return;
    void loadStaff();
    const onFocus = () => void loadStaff();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => void loadStaff(), 20000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [staff, loadStaff]);

  useEffect(() => {
    if (staff) return;
    let alive = true;
    authApi
      .getProfile()
      .then((p) => {
        if (alive && /^\d{8}$/.test(p.identifier)) setClientDni(p.identifier);
      })
      .catch(() => {
        if (alive) setClientDni(null);
      });
    return () => {
      alive = false;
    };
  }, [staff]);

  const loan = useMemo(
    () => (staff ? null : findClientLoan(clientDni, session.displayName)),
    [staff, clientDni, session.displayName],
  );

  const clientDonut = useMemo(() => {
    if (!loan) return [];
    const pagadas = loan.cuotas.filter((c) => c.estado === "pagada").length;
    const pendientes = loan.cuotas.filter((c) => c.estado !== "pagada").length;
    return [
      { name: "Pagadas", value: pagadas, color: GREEN },
      { name: "Pendientes", value: pendientes, color: BLUE },
    ].filter((d) => d.value > 0);
  }, [loan]);

  const clientDonutTotal = clientDonut.reduce((s, d) => s + d.value, 0) || 1;

  const staffLine = useMemo(() => {
    return PRESTAMOS_DEMO.map((p) => {
      const cobrado = p.cuotas.filter((c) => c.estado === "pagada").reduce((s, c) => s + c.monto, 0);
      const programado = p.cuotas
        .filter((c) => c.estado === "por_vencer" || c.estado === "vencida")
        .reduce((s, c) => s + c.monto, 0);
      return {
        name: p.id,
        valor: lineTab === "cobrado" ? cobrado : programado,
      };
    });
  }, [lineTab]);

  const staffDonut = useMemo(() => {
    const alDia = PRESTAMOS_DEMO.filter((p) => p.estado === "Al día").length;
    const mora = PRESTAMOS_DEMO.filter((p) => p.estado === "En mora").length;
    return [
      { name: "Al día", value: alDia, color: GREEN },
      { name: "En mora", value: mora, color: RED },
    ].filter((d) => d.value > 0);
  }, []);

  const staffDonutTotal = staffDonut.reduce((s, d) => s + d.value, 0) || 1;

  const staffBars = useMemo(() => {
    let ok = 0;
    let bad = 0;
    for (const r of requests) {
      if (r.estado === "APROBADA") ok += 1;
      if (r.estado === "RECHAZADA") bad += 1;
    }
    return [
      { name: "Aprobada", cantidad: ok, fill: GREEN },
      { name: "Rechazada", cantidad: bad, fill: RED },
    ];
  }, [requests]);

  const initials = session.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (!staff) {
    return (
      <motion.div
        className={styles.page}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
      >
        <section className={styles.profile}>
          <div className={styles.square}>
            {initials || "CL"}
            <span className={styles.online} />
          </div>
          <div className={styles.profileCopy}>
            <div className={styles.head}>
              <h1 className={styles.name}>{session.displayName}</h1>
              <span className={`${styles.pill} ${styles.pillBlue}`}>Cliente</span>
            </div>
            <p className={styles.role}>
              {loan
                ? `${loan.id} · saldo ${money(loan.saldo)} · ${loan.estado}`
                : "Resumen de tu crédito"}
            </p>
          </div>
        </section>

        <section className={styles.clientGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Tus cuotas</h2>
                <p className={styles.panelSub}>
                  {loan
                    ? `${loan.cuotas.filter((c) => c.estado === "pagada").length} pagadas · ${loan.cuotas.filter((c) => c.estado !== "pagada").length} pendientes`
                    : "Sin préstamo asociado"}
                </p>
              </div>
            </div>
            <div className={styles.donutLayout}>
              <div className={styles.chartBoxTall}>
                {clientDonut.length === 0 ? (
                  <p className={styles.empty}>Sin datos para graficar.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientDonut}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={4}
                        cornerRadius={6}
                        isAnimationActive={!reduceMotion}
                      >
                        {clientDonut.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className={styles.donutCenter}>
                  <p className={styles.donutKicker}>Pagadas</p>
                  <p className={styles.donutPct}>
                    {clientDonut[0]
                      ? `${Math.round(((clientDonut.find((d) => d.name === "Pagadas")?.value ?? 0) / clientDonutTotal) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
              <ul className={styles.legend}>
                {clientDonut.map((item) => (
                  <li key={item.name} className={styles.legendItem}>
                    <span className={styles.swatch} style={{ background: item.color }} />
                    <span className={styles.legendLabel}>{item.name}</span>
                    <span className={styles.legendMeta}>
                      {item.value} · {Math.round((item.value / clientDonutTotal) * 100)}%
                    </span>
                  </li>
                ))}
                {loan ? (
                  <li className={styles.legendHint}>
                    Próximo vencimiento: <strong>{loan.proximoVence}</strong>
                    <br />
                    Cuota: <strong>{money(loan.cuotaMensual)}</strong>
                  </li>
                ) : null}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Accesos directos</h2>
                <p className={styles.panelSub}>Ir a tus módulos</p>
              </div>
            </div>
            <div className={styles.shortcuts}>
              {CLIENT_SHORTCUTS.map((item) => (
                <Link key={item.href} href={item.href} className={styles.shortcut}>
                  <strong>{item.title}</strong>
                  <span>{item.tip}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.page}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easeOut }}
    >
      <section className={styles.profile}>
        <div className={styles.square}>
          {initials || "FT"}
          <span className={styles.online} />
        </div>
        <div className={styles.profileCopy}>
          <div className={styles.head}>
            <h1 className={styles.name}>{session.displayName}</h1>
            <span className={`${styles.pill} ${styles.pillBlue}`}>Operaciones</span>
          </div>
          <p className={styles.role}>Cobranza, cartera y solicitudes.</p>
        </div>
        <button type="button" className={styles.refresh} onClick={() => void loadStaff()}>
          Actualizar
        </button>
      </section>

      <section className={styles.charts}>
        <article className={styles.panelWide}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Cobranza de cartera</h2>
              <p className={styles.panelSub}>Gráfico lineal por préstamo</p>
            </div>
            <div className={styles.tabs}>
              <button
                type="button"
                className={lineTab === "cobrado" ? styles.tabOn : styles.tab}
                onClick={() => setLineTab("cobrado")}
              >
                Cobrado
              </button>
              <button
                type="button"
                className={lineTab === "programado" ? styles.tabOn : styles.tab}
                onClick={() => setLineTab("programado")}
              >
                Programado
              </button>
            </div>
          </div>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={staffLine} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `${Math.round(Number(v) / 100) / 10}k`}
                />
                <Tooltip content={<ChartTooltip moneyMode />} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name={lineTab === "cobrado" ? "Cobrado" : "Programado"}
                  stroke={BLUE}
                  strokeWidth={2.5}
                  fill="url(#fillLine)"
                  isAnimationActive={!reduceMotion}
                  dot={{ r: 3.5, fill: BLUE, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Cartera</h2>
              <p className={styles.panelSub}>Al día / En mora</p>
            </div>
          </div>
          <div className={styles.donutLayout}>
            <div className={styles.chartBoxTall}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={4}
                    cornerRadius={6}
                    isAnimationActive={!reduceMotion}
                  >
                    {staffDonut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter}>
                <p className={styles.donutKicker}>Al día</p>
                <p className={styles.donutPct}>
                  {`${Math.round(((staffDonut.find((d) => d.name === "Al día")?.value ?? 0) / staffDonutTotal) * 100)}%`}
                </p>
              </div>
            </div>
            <ul className={styles.legend}>
              {staffDonut.map((item) => (
                <li key={item.name} className={styles.legendItem}>
                  <span className={styles.swatch} style={{ background: item.color }} />
                  <span className={styles.legendLabel}>{item.name}</span>
                  <span className={styles.legendMeta}>
                    {item.value} · {Math.round((item.value / staffDonutTotal) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className={styles.chartsSecond}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Solicitudes</h2>
              <p className={styles.panelSub}>Solo Aprobada y Rechazada</p>
            </div>
          </div>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cantidad" name="Cantidad" radius={[8, 8, 4, 4]} isAnimationActive={!reduceMotion}>
                  {staffBars.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </motion.div>
  );
}
