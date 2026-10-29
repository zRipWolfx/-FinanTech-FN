import { apiFetch } from "@/modules/shared/lib/apiFetch";

export type CreditParam = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  kind: "TASA_INTERES" | "MORA" | "PLAZO";
  periodo: "DIARIA" | "MENSUAL" | "ANUAL" | "FIJO";
  valor: string;
  plazosPermitidos: string;
  plazos: number[];
  vigente: boolean;
};

export type CreditParamPayload = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  kind: string;
  periodo: string;
  valor: string;
  plazosPermitidos: string;
  vigente?: boolean;
};

export type CalcResult = {
  monto: string;
  cuotas: number;
  periodoTasa: string;
  valorTasa: string;
  tasaMensualEquivalente: string;
  cuotaMensual: string;
  interesTotal: string;
  totalPagar: string;
  moraDiariaPct: string;
  plazosPermitidos: number[];
};

export type LoanRequestRow = {
  id: number;
  clienteNombre: string;
  nombres: string | null;
  apellidos: string | null;
  dni: string;
  direccion: string | null;
  trabajo: string | null;
  ingresosMensuales: string | null;
  monto: string;
  cuotas: number;
  frecuenciaPago: "MENSUAL" | "SEMANAL";
  estado: "EN_EVALUACION" | "OBSERVADA" | "APROBADA" | "RECHAZADA";
  periodoTasa: string | null;
  valorTasa: string | null;
  tasaMensualUsada: string | null;
  cuotaMensual: string | null;
  interesTotal: string | null;
  totalPagar: string | null;
  creadoEn: string | null;
};

export type LoanRequestPayload = {
  clienteNombre?: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  direccion?: string;
  trabajo?: string;
  ingresosMensuales?: string;
  monto: string;
  cuotas: number;
  frecuenciaPago?: "MENSUAL" | "SEMANAL";
  tasaParamId?: number;
};

export type InstallmentRow = {
  id: number;
  numero: number;
  fechaVence: string;
  monto: string;
  capital: string;
  interes: string;
  estado: "PENDIENTE" | "PAGADA" | "VENCIDA";
  pagadoEn: string | null;
};

export type ActiveLoanRow = {
  id: number;
  codigo: string;
  dni: string;
  clienteNombre: string;
  monto: string;
  cuotas: number;
  frecuencia: "MENSUAL" | "SEMANAL";
  tasaPeriodoPct: string;
  cuotaMonto: string;
  interesTotal: string;
  totalPagar: string;
  saldo: string;
  fechaInicio: string;
  estado: string;
  cuotasPagadas: number;
  cuotasPendientes: number;
  progresoPct: number;
  diaPago: string;
  proximoVence: string | null;
  enMora: boolean;
  cronograma: InstallmentRow[];
};

export type DueInstallmentRow = {
  installmentId: number;
  loanId: number;
  codigo: string;
  dni: string;
  clienteNombre: string;
  numero: number;
  fechaVence: string;
  monto: string;
  estado: string;
  diasAtraso: number;
};

export type CashSummary = {
  saldoDisponible: string;
  totalDesembolsado: string;
  totalCobrado: string;
  movimientos: {
    id: number;
    tipo: string;
    monto: string;
    saldo: string;
    detalle: string;
    refCodigo: string | null;
    dni: string | null;
    creadoEn: string;
  }[];
};

export type ClientDossier = {
  dni: string;
  nombres: string;
  telefono: string | null;
  activo: boolean;
  bloqueadoHasta: string | null;
  motivoBloqueo: string | null;
  prestamosTotales: number;
  prestamosVigentes: number;
  pagosTardios: number;
  prestamoVigente: ActiveLoanRow | null;
  historialPrestamos: ActiveLoanRow[];
  historialPagos: PaymentRow[];
  solicitudes: LoanRequestRow[];
};

export type PaymentRow = {
  id: number;
  loanId: number;
  codigoVoucher: string;
  monto: string;
  medio: string;
  detalleMedio: string;
  cuotasCubiertas: string;
  voucherHtml: string;
  creadoEn: string;
};

export type ContractRow = {
  id: number;
  loanId: number;
  codigo: string;
  firmaSimulada: string;
  contenidoHtml: string;
  creadoEn: string;
};

export type NotificationRow = {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
};

export type ClientPortal = {
  dni: string;
  solicitudActiva: LoanRequestRow | null;
  prestamoVigente: ActiveLoanRow | null;
  prestamosAnteriores: ActiveLoanRow[];
  pagos: PaymentRow[];
  contrato: ContractRow | null;
  puedeSolicitar: boolean;
};

export const creditApi = {
  listParams: () => apiFetch<CreditParam[]>("/api/credit/params"),
  createParam: (payload: CreditParamPayload) =>
    apiFetch<CreditParam>("/api/credit/params", { method: "POST", body: payload }),
  updateParam: (id: number, payload: CreditParamPayload) =>
    apiFetch<CreditParam>(`/api/credit/params/${id}`, { method: "PUT", body: payload }),
  setVigente: (id: number, vigente: boolean) =>
    apiFetch<CreditParam>(`/api/credit/params/${id}/vigente`, {
      method: "PATCH",
      body: { vigente },
    }),
  plazos: () => apiFetch<number[]>("/api/credit/plazos"),
  calculate: (
    monto: string,
    cuotas: number,
    frecuenciaPago: "MENSUAL" | "SEMANAL" = "MENSUAL",
    tasaParamId?: number,
  ) =>
    apiFetch<CalcResult>("/api/credit/calculate", {
      method: "POST",
      body: { monto, cuotas, frecuenciaPago, tasaParamId },
    }),
  listRequests: () => apiFetch<LoanRequestRow[]>("/api/credit/requests"),
  createRequest: (payload: LoanRequestPayload) =>
    apiFetch<LoanRequestRow>("/api/credit/requests", { method: "POST", body: payload }),
  patchStatus: (id: number, estado: string) =>
    apiFetch<LoanRequestRow>(`/api/credit/requests/${id}/estado`, {
      method: "PATCH",
      body: { estado },
    }),
  portal: () => apiFetch<ClientPortal>("/api/credit/me/portal"),
  myLoan: () => apiFetch<ActiveLoanRow>("/api/credit/me/loan"),
  mySchedule: () => apiFetch<InstallmentRow[]>("/api/credit/me/schedule"),
  pay: (payload: { modo: string; installmentId?: number; medio: string; detalleMedio?: string }) =>
    apiFetch<PaymentRow>("/api/credit/me/pay", { method: "POST", body: payload }),
  myPayments: () => apiFetch<PaymentRow[]>("/api/credit/me/payments"),
  myContract: () => apiFetch<ContractRow>("/api/credit/me/contract"),
  myVouchers: () => apiFetch<PaymentRow[]>("/api/credit/me/vouchers"),
  notifications: () => apiFetch<NotificationRow[]>("/api/credit/me/notifications"),
  unreadNotifications: () => apiFetch<{ count: number }>("/api/credit/me/notifications/unread"),
  markNotificationsRead: () =>
    apiFetch<{ status: string }>("/api/credit/me/notifications/read", { method: "POST" }),
  listLoans: (estado?: string) =>
    apiFetch<ActiveLoanRow[]>(`/api/credit/loans${estado ? `?estado=${encodeURIComponent(estado)}` : ""}`),
  getLoan: (id: number) => apiFetch<ActiveLoanRow>(`/api/credit/loans/${id}`),
  shiftSchedule: (id: number, fechaInicio: string) =>
    apiFetch<ActiveLoanRow>(`/api/credit/loans/${id}/schedule`, {
      method: "PATCH",
      body: { fechaInicio },
    }),
  staffPay: (id: number, payload: { modo: string; installmentId?: number; medio: string; detalleMedio?: string }) =>
    apiFetch<PaymentRow>(`/api/credit/loans/${id}/pay`, { method: "POST", body: payload }),
  dueInstallments: () => apiFetch<DueInstallmentRow[]>("/api/credit/installments/due"),
  sendReminder: (payload: { loanId: number; installmentId?: number; email?: string; mensaje?: string }) =>
    apiFetch<{ status: string; notificado: boolean; correoEnviado: boolean }>("/api/credit/reminders", {
      method: "POST",
      body: payload,
    }),
  cash: () => apiFetch<CashSummary>("/api/credit/cash"),
  dossier: (dni: string) => apiFetch<ClientDossier>(`/api/credit/clients/${dni}/dossier`),
  blockClient: (payload: { dni: string; hasta: string; motivo?: string }) =>
    apiFetch<{ status: string }>("/api/credit/clients/block", { method: "POST", body: payload }),
  unblockClient: (dni: string) =>
    apiFetch<{ status: string }>(`/api/credit/clients/${dni}/block`, { method: "DELETE" }),
  staffNotifications: () => apiFetch<NotificationRow[]>("/api/credit/notifications"),
};

export function moneyPe(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "S/ 0.00";
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function statusLabel(estado: LoanRequestRow["estado"]) {
  switch (estado) {
    case "EN_EVALUACION":
      return "Pendiente";
    case "OBSERVADA":
      return "Observada";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    default:
      return estado;
  }
}

export function statusTone(estado: LoanRequestRow["estado"]): "ok" | "warn" | "bad" | "info" | "muted" {
  switch (estado) {
    case "APROBADA":
      return "ok";
    case "EN_EVALUACION":
      return "warn";
    case "OBSERVADA":
      return "info";
    case "RECHAZADA":
      return "bad";
    default:
      return "muted";
  }
}

export function downloadHtmlAsPdfProxy(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") || filename.endsWith(".pdf")
    ? filename.replace(/\.pdf$/i, ".html")
    : `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHtmlAsPdf(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 400);
}
