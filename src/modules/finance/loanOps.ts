import {
  PRESTAMOS_DEMO,
  cuotaLabel,
  money,
  type CuotaDemo,
  type PrestamoDemo,
} from "@/modules/finance/loanDemoData";

export type CuotaCobrar = {
  key: string;
  prestamo: PrestamoDemo;
  cuota: CuotaDemo;
  etiqueta: string;
  tone: "ok" | "warn" | "bad" | "info" | "muted";
};

export type GestionSeed = {
  id: number;
  cliente: string;
  dni: string;
  prestamoId: string;
  nota: string;
  estado: "En seguimiento" | "Compromiso" | "Cerrada";
  monto: number;
  fecha: string;
};

export function toneForCuota(estado: CuotaDemo["estado"]) {
  if (estado === "pagada") return "ok" as const;
  if (estado === "vencida") return "bad" as const;
  if (estado === "por_vencer") return "warn" as const;
  return "muted" as const;
}

export function etiquetaCuotaCercana(c: CuotaDemo) {
  if (c.estado === "vencida") return "Vencida";
  if (c.estado === "por_vencer") return "Esta semana";
  return cuotaLabel(c.estado);
}

export function cuotasPorCobrar(): CuotaCobrar[] {
  const out: CuotaCobrar[] = [];
  for (const p of PRESTAMOS_DEMO) {
    for (const c of p.cuotas) {
      if (c.estado === "por_vencer" || c.estado === "vencida") {
        out.push({
          key: `${p.id}-${c.n}`,
          prestamo: p,
          cuota: c,
          etiqueta: etiquetaCuotaCercana(c),
          tone: toneForCuota(c.estado),
        });
      }
    }
  }
  return out;
}

export function prestamosEnMora() {
  return PRESTAMOS_DEMO.filter((p) => p.estado === "En mora");
}

export function vencimientosProximos() {
  return cuotasPorCobrar();
}

export function carteraClientes() {
  return PRESTAMOS_DEMO.map((p) => ({
    id: p.id,
    cliente: p.cliente,
    dni: p.dni,
    estado: p.estado,
    monto: p.monto,
    saldo: p.saldo,
    prestamo: p,
  }));
}

export function findByDni(dni: string) {
  return PRESTAMOS_DEMO.filter((p) => p.dni === dni);
}

export function moraMonto(p: PrestamoDemo) {
  return p.cuotas.filter((c) => c.estado === "vencida").reduce((sum, c) => sum + c.monto, 0);
}

export function diasMora(p: PrestamoDemo) {
  return Math.max(0, ...p.cuotas.filter((c) => c.estado === "vencida").map((c) => c.diasAtraso));
}

export function reporteCartera() {
  const vigentes = PRESTAMOS_DEMO;
  const alDia = vigentes.filter((p) => p.estado === "Al día");
  const mora = vigentes.filter((p) => p.estado === "En mora");
  const colocado = vigentes.reduce((s, p) => s + p.saldo, 0);
  const saldoMora = mora.reduce((s, p) => s + p.saldo, 0);
  return {
    vigentes: vigentes.length,
    alDia: alDia.length,
    mora: mora.length,
    colocado,
    saldoMora,
    rows: [
      {
        title: "Saldo colocado",
        detail: `${vigentes.length} préstamos vigentes`,
        status: `Al día ${alDia.length}`,
        tone: "ok" as const,
        amount: money(colocado),
      },
      {
        title: "Saldo en mora",
        detail: `${mora.length} préstamo${mora.length === 1 ? "" : "s"}`,
        status: "En mora",
        tone: "bad" as const,
        amount: money(saldoMora),
      },
    ],
  };
}

export function reporteCobranza() {
  const pagadas = PRESTAMOS_DEMO.flatMap((p) =>
    p.cuotas.filter((c) => c.estado === "pagada").map((c) => ({ prestamo: p, cuota: c })),
  );
  const pendientes = cuotasPorCobrar();
  const cobrado = pagadas.reduce((s, r) => s + r.cuota.monto, 0);
  const programado = pendientes.reduce((s, r) => s + r.cuota.monto, 0);
  return {
    cobrado,
    programado,
    pagos: pagadas.length,
    rows: [
      {
        title: "Cobrado (cuotas aplicadas)",
        detail: `${pagadas.length} pagos aplicados`,
        status: "Registrado",
        tone: "ok" as const,
        amount: money(cobrado),
      },
      {
        title: "Programado pendiente",
        detail: "Cuotas por cobrar o vencidas",
        status: "Por cobrar",
        tone: "warn" as const,
        amount: money(programado),
      },
    ],
  };
}

export const GESTIONES_SEED: GestionSeed[] = [
  {
    id: 1,
    cliente: "Rosa Mendoza",
    dni: "33445566",
    prestamoId: "PT-0981",
    nota: "Llamada · comprometió pago el viernes",
    estado: "En seguimiento",
    monto: 310,
    fecha: "27 oct 2026",
  },
];
