export type CuotaEstado = "pagada" | "al_dia" | "por_vencer" | "vencida";

export type CuotaDemo = {
  n: number;
  vence: string;
  diaPago: string;
  monto: number;
  capital: number;
  interes: number;
  estado: CuotaEstado;
  pagadoEn: string | null;
  diasAtraso: number;
};

export type PrestamoDemo = {
  id: string;
  cliente: string;
  dni: string;
  monto: number;
  saldo: number;
  cuotasTotal: number;
  cuotaActual: number;
  estado: "Al día" | "En mora";
  cuotaMensual: number;
  proximoVence: string;
  cuotas: CuotaDemo[];
};

function cuota(
  n: number,
  vence: string,
  diaPago: string,
  monto: number,
  capital: number,
  interes: number,
  estado: CuotaEstado,
  pagadoEn: string | null,
  diasAtraso = 0,
): CuotaDemo {
  return { n, vence, diaPago, monto, capital, interes, estado, pagadoEn, diasAtraso };
}

export const PRESTAMOS_DEMO: PrestamoDemo[] = [
  {
    id: "PT-1042",
    cliente: "Ana Quispe",
    dni: "45678912",
    monto: 3500,
    saldo: 2640,
    cuotasTotal: 12,
    cuotaActual: 4,
    estado: "Al día",
    cuotaMensual: 340,
    proximoVence: "05 nov 2026",
    cuotas: [
      cuota(1, "05 ago 2026", "Cada 5 del mes", 340, 220, 120, "pagada", "04 ago 2026"),
      cuota(2, "05 set 2026", "Cada 5 del mes", 340, 225, 115, "pagada", "05 set 2026"),
      cuota(3, "05 oct 2026", "Cada 5 del mes", 340, 230, 110, "pagada", "03 oct 2026"),
      cuota(4, "05 nov 2026", "Cada 5 del mes", 340, 235, 105, "pagada", "05 nov 2026"),
      cuota(5, "05 dic 2026", "Cada 5 del mes", 340, 240, 100, "por_vencer", null),
      cuota(6, "05 ene 2027", "Cada 5 del mes", 340, 245, 95, "al_dia", null),
      cuota(7, "05 feb 2027", "Cada 5 del mes", 340, 250, 90, "al_dia", null),
      cuota(8, "05 mar 2027", "Cada 5 del mes", 340, 255, 85, "al_dia", null),
      cuota(9, "05 abr 2027", "Cada 5 del mes", 340, 260, 80, "al_dia", null),
      cuota(10, "05 may 2027", "Cada 5 del mes", 340, 265, 75, "al_dia", null),
      cuota(11, "05 jun 2027", "Cada 5 del mes", 340, 270, 70, "al_dia", null),
      cuota(12, "05 jul 2027", "Cada 5 del mes", 340, 275, 65, "al_dia", null),
    ],
  },
  {
    id: "PT-1108",
    cliente: "Luis Demo",
    dni: "87654321",
    monto: 1200,
    saldo: 820,
    cuotasTotal: 6,
    cuotaActual: 2,
    estado: "Al día",
    cuotaMensual: 220,
    proximoVence: "12 nov 2026",
    cuotas: [
      cuota(1, "12 set 2026", "Cada 12 del mes", 220, 180, 40, "pagada", "12 set 2026"),
      cuota(2, "12 oct 2026", "Cada 12 del mes", 220, 185, 35, "pagada", "11 oct 2026"),
      cuota(3, "12 nov 2026", "Cada 12 del mes", 220, 190, 30, "por_vencer", null),
      cuota(4, "12 dic 2026", "Cada 12 del mes", 220, 195, 25, "al_dia", null),
      cuota(5, "12 ene 2027", "Cada 12 del mes", 220, 200, 20, "al_dia", null),
      cuota(6, "12 feb 2027", "Cada 12 del mes", 220, 205, 15, "al_dia", null),
    ],
  },
  {
    id: "PT-0981",
    cliente: "Rosa Mendoza",
    dni: "33445566",
    monto: 2800,
    saldo: 1960,
    cuotasTotal: 10,
    cuotaActual: 7,
    estado: "En mora",
    cuotaMensual: 310,
    proximoVence: "18 oct 2026 (vencida)",
    cuotas: [
      cuota(1, "18 abr 2026", "Cada 18 del mes", 310, 230, 80, "pagada", "18 abr 2026"),
      cuota(2, "18 may 2026", "Cada 18 del mes", 310, 235, 75, "pagada", "20 may 2026", 2),
      cuota(3, "18 jun 2026", "Cada 18 del mes", 310, 240, 70, "pagada", "18 jun 2026"),
      cuota(4, "18 jul 2026", "Cada 18 del mes", 310, 245, 65, "pagada", "17 jul 2026"),
      cuota(5, "18 ago 2026", "Cada 18 del mes", 310, 250, 60, "pagada", "18 ago 2026"),
      cuota(6, "18 set 2026", "Cada 18 del mes", 310, 255, 55, "pagada", "25 set 2026", 7),
      cuota(7, "18 oct 2026", "Cada 18 del mes", 310, 260, 50, "vencida", null, 11),
      cuota(8, "18 nov 2026", "Cada 18 del mes", 310, 265, 45, "vencida", null, 0),
      cuota(9, "18 dic 2026", "Cada 18 del mes", 310, 270, 40, "al_dia", null),
      cuota(10, "18 ene 2027", "Cada 18 del mes", 310, 275, 35, "al_dia", null),
    ],
  },
];

export function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function cuotaLabel(estado: CuotaEstado) {
  switch (estado) {
    case "pagada":
      return "Pagada";
    case "por_vencer":
      return "Por vencer";
    case "vencida":
      return "Vencida";
    default:
      return "Pendiente";
  }
}

export function cuotasPagadas(p: PrestamoDemo) {
  return p.cuotas.filter((c) => c.estado === "pagada").length;
}

export function cuotasFaltan(p: PrestamoDemo) {
  return p.cuotasTotal - cuotasPagadas(p);
}

export function findPrestamo(id: string) {
  return PRESTAMOS_DEMO.find((p) => p.id === id) ?? null;
}
