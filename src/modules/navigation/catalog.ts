export type ModuleRow = {
  title: string;
  detail: string;
  status: string;
  tone: "ok" | "warn" | "bad" | "info";
  amount: string;
};

export type ModuleKind = "list" | "create" | "pay" | "lookup";

export type FinanceModule = {
  id: string;
  title: string;
  description: string;
  kind: ModuleKind;
  rows: ModuleRow[];
};

export type NavItem = {
  id: string;
  label: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const STAFF_GROUPS: NavGroup[] = [
  {
    id: "prestamos",
    label: "Préstamos",
    items: [
      { id: "solicitudes", label: "Solicitudes" },
      { id: "vigentes", label: "Vigentes" },
      { id: "cronogramas", label: "Cronogramas" },
    ],
  },
  {
    id: "pagos",
    label: "Pagos",
    items: [
      { id: "registrar-pago", label: "Registrar pago" },
      { id: "cuotas", label: "Cuotas" },
      { id: "mora", label: "En mora" },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    items: [
      { id: "cartera-clientes", label: "Cartera" },
      { id: "consulta-dni", label: "Consulta por DNI" },
    ],
  },
  {
    id: "cobranza",
    label: "Cobranza",
    items: [
      { id: "vencimientos", label: "Vencimientos" },
      { id: "gestiones", label: "Notificaciones" },
    ],
  },
  {
    id: "reportes",
    label: "Reportes",
    items: [
      { id: "reporte-cartera", label: "Cartera" },
      { id: "reporte-cobranza", label: "Cobranzas" },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    items: [
      { id: "usuarios", label: "Usuarios" },
      { id: "parametros", label: "Parámetros de crédito" },
    ],
  },
];

export const CLIENT_GROUPS: NavGroup[] = [
  {
    id: "prestamos",
    label: "Mi préstamo",
    items: [
      { id: "prestamo-activo", label: "Solicitar / estado" },
      { id: "cronograma-cliente", label: "Cronograma" },
    ],
  },
  {
    id: "pagos",
    label: "Mis pagos",
    items: [
      { id: "cuotas-cliente", label: "Pagar cuotas" },
      { id: "historial-pagos", label: "Historial" },
    ],
  },
  {
    id: "docs",
    label: "Documentos",
    items: [
      { id: "contrato", label: "Contrato" },
      { id: "comprobantes", label: "Comprobantes" },
    ],
  },
];

const CLIENTS: ModuleRow[] = [
  { title: "Ana Quispe", detail: "DNI 45678912 · Préstamo PT-1042", status: "Al día", tone: "ok", amount: "S/ 3,500" },
  { title: "Luis Demo", detail: "DNI 87654321 · Préstamo PT-1108", status: "Al día", tone: "ok", amount: "S/ 1,200" },
  { title: "Rosa Mendoza", detail: "DNI 33445566 · Préstamo PT-0981", status: "En mora", tone: "bad", amount: "S/ 2,800" },
];

export const STAFF_MODULES: FinanceModule[] = [
  {
    id: "solicitudes",
    title: "Solicitudes de préstamo",
    description: "Evaluación de créditos nuevos antes del desembolso.",
    kind: "create",
    rows: [
      { title: "Ana Quispe", detail: "DNI 45678912 · 12 cuotas", status: "En evaluación", tone: "warn", amount: "S/ 3,500" },
      { title: "Carlos Paredes", detail: "DNI 70112233 · 8 cuotas", status: "Observada", tone: "info", amount: "S/ 5,000" },
    ],
  },
  {
    id: "vigentes",
    title: "Préstamos vigentes",
    description: "Créditos desembolsados que siguen en cobranza.",
    kind: "list",
    rows: [
      { title: "PT-1042 · Ana Quispe", detail: "Saldo S/ 2,640 · cuota 4 de 12", status: "Al día", tone: "ok", amount: "S/ 3,500" },
      { title: "PT-1108 · Luis Demo", detail: "Saldo S/ 820 · cuota 2 de 6", status: "Al día", tone: "ok", amount: "S/ 1,200" },
      { title: "PT-0981 · Rosa Mendoza", detail: "Saldo S/ 1,960 · 2 cuotas vencidas", status: "En mora", tone: "bad", amount: "S/ 2,800" },
    ],
  },
  {
    id: "cronogramas",
    title: "Cronogramas",
    description: "Cuotas pactadas de cada préstamo vigente.",
    kind: "list",
    rows: [
      { title: "PT-1042 · Cuota 5", detail: "Vence 05 nov · capital + interés", status: "Por vencer", tone: "warn", amount: "S/ 340" },
      { title: "PT-1108 · Cuota 3", detail: "Vence 12 nov · capital + interés", status: "Por vencer", tone: "warn", amount: "S/ 220" },
      { title: "PT-0981 · Cuota 7", detail: "Venció 18 oct", status: "Vencida", tone: "bad", amount: "S/ 310" },
    ],
  },
  {
    id: "registrar-pago",
    title: "Registrar pago",
    description: "Anota el abono de una cuota por DNI del cliente.",
    kind: "pay",
    rows: [
      { title: "Ana Quispe", detail: "DNI 45678912 · PT-1042 · cuota 4 · efectivo", status: "Aplicado", tone: "ok", amount: "S/ 340" },
    ],
  },
  {
    id: "cuotas",
    title: "Cuotas por cobrar",
    description: "Cuotas con vencimiento cercano o del día.",
    kind: "list",
    rows: [
      { title: "PT-1042 · cuota 5", detail: "Ana Quispe · vence 05 nov", status: "Esta semana", tone: "warn", amount: "S/ 340" },
      { title: "PT-1108 · cuota 3", detail: "Luis Demo · vence 12 nov", status: "Programada", tone: "info", amount: "S/ 220" },
      { title: "PT-0981 · cuota 7", detail: "Rosa Mendoza · venció 18 oct", status: "Vencida", tone: "bad", amount: "S/ 310" },
    ],
  },
  {
    id: "mora",
    title: "Préstamos en mora",
    description: "Créditos con cuotas vencidas que requieren cobranza.",
    kind: "list",
    rows: [
      { title: "PT-0981 · Rosa Mendoza", detail: "DNI 33445566 · 2 cuotas vencidas · 11 días", status: "En mora", tone: "bad", amount: "S/ 620" },
    ],
  },
  {
    id: "cartera-clientes",
    title: "Cartera de clientes",
    description: "Personas con crédito activo o en evaluación.",
    kind: "list",
    rows: CLIENTS,
  },
  {
    id: "consulta-dni",
    title: "Consulta por DNI",
    description: "Busca el crédito de un cliente con su documento.",
    kind: "lookup",
    rows: CLIENTS,
  },
  {
    id: "vencimientos",
    title: "Vencimientos",
    description: "Cuotas que vencen en los próximos 7 días.",
    kind: "list",
    rows: [
      { title: "05 nov · Ana Quispe", detail: "PT-1042 · cuota 5", status: "Por cobrar", tone: "warn", amount: "S/ 340" },
      { title: "06 nov · Rosa Mendoza", detail: "PT-0981 · cuota atrasada", status: "En mora", tone: "bad", amount: "S/ 310" },
    ],
  },
  {
    id: "gestiones",
    title: "Notificaciones",
    description: "Seguimiento de llamadas y compromisos de pago.",
    kind: "list",
    rows: [
      { title: "Rosa Mendoza", detail: "Llamada 27 oct · comprometió pago el viernes", status: "En seguimiento", tone: "warn", amount: "S/ 310" },
    ],
  },
  {
    id: "reporte-cartera",
    title: "Reporte de cartera",
    description: "Saldo colocado y estado de los préstamos vigentes.",
    kind: "list",
    rows: [
      { title: "Saldo colocado", detail: "3 préstamos vigentes", status: "Al día 2", tone: "ok", amount: "S/ 5,420" },
      { title: "Saldo en mora", detail: "1 préstamo", status: "En mora", tone: "bad", amount: "S/ 1,960" },
    ],
  },
  {
    id: "reporte-cobranza",
    title: "Reporte de cobranzas",
    description: "Pagos aplicados en el periodo frente a lo programado.",
    kind: "list",
    rows: [
      { title: "Cobrado en octubre", detail: "7 pagos aplicados", status: "Registrado", tone: "ok", amount: "S/ 2,150" },
      { title: "Programado pendiente", detail: "Cuotas de la semana", status: "Por cobrar", tone: "warn", amount: "S/ 870" },
    ],
  },
  {
    id: "usuarios",
    title: "Usuarios de gestión",
    description: "Personal que administra préstamos y pagos. El acceso de clientes es por DNI.",
    kind: "list",
    rows: [
      { title: "FinanTech S.A.", detail: "Correo de empresa · puede registrar pagos", status: "Activo", tone: "ok", amount: "Gestión" },
    ],
  },
  {
    id: "parametros",
    title: "Parámetros de crédito",
    description: "Condiciones base para armar un préstamo.",
    kind: "list",
    rows: [],
  },
];



export function clientModules(_name: string): FinanceModule[] {
  return [
    {
      id: "prestamo-activo",
      title: "Solicitar / estado",
      description: "Solicita un préstamo o revisa el estado de tu evaluación.",
      kind: "create",
      rows: [],
    },
    {
      id: "cronograma-cliente",
      title: "Tu cronograma",
      description: "Fechas, capital e interés de cada cuota.",
      kind: "list",
      rows: [],
    },
    {
      id: "cuotas-cliente",
      title: "Pagar cuotas",
      description: "Simula el pago de una cuota o del saldo completo.",
      kind: "pay",
      rows: [],
    },
    {
      id: "historial-pagos",
      title: "Historial de pagos",
      description: "Pagos aplicados y préstamos anteriores.",
      kind: "list",
      rows: [],
    },
    {
      id: "contrato",
      title: "Contrato",
      description: "Contrato con firma simulada y tabla de intereses.",
      kind: "list",
      rows: [],
    },
    {
      id: "comprobantes",
      title: "Comprobantes",
      description: "Vouchers generados al pagar cuotas.",
      kind: "list",
      rows: [],
    },
  ];
}

export function findModule(modules: FinanceModule[], id: string | null) {
  if (!id) return null;
  return modules.find((module) => module.id === id) ?? null;
}
