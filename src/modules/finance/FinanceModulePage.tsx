"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { CarteraClientesPage } from "@/modules/finance/CarteraClientesPage";
import {
  ClientComprobantesPage,
  ClientContratoPage,
  ClientCronogramaPage,
  ClientCuotasPage,
  ClientHistorialPage,
  ClientPrestamoPage,
} from "@/modules/finance/ClientFinancePages";
import { ConsultaDniPage } from "@/modules/finance/ConsultaDniPage";
import { CronogramasPage } from "@/modules/finance/CronogramasPage";
import { CuotasPage } from "@/modules/finance/CuotasPage";
import { GestionesPage } from "@/modules/finance/GestionesPage";
import { ModuleView } from "@/modules/finance/ModuleView";
import { MoraPage } from "@/modules/finance/MoraPage";
import { ParametrosPage } from "@/modules/finance/ParametrosPage";
import { RegistrarPagoPage } from "@/modules/finance/RegistrarPagoPage";
import { ReporteCarteraPage, ReporteCobranzaPage } from "@/modules/finance/ReportesPages";
import { SolicitudesPage } from "@/modules/finance/SolicitudesPage";
import { VencimientosPage } from "@/modules/finance/VencimientosPage";
import { VigentesPage } from "@/modules/finance/VigentesPage";
import {
  STAFF_MODULES,
  clientModules,
  findModule,
  findNavItem,
  groupsForKind,
  PATHS,
} from "@/modules/navigation";
import { useAppSession } from "@/modules/shell";
import { UsersPage } from "@/modules/users";

export function FinanceModulePage() {
  const router = useRouter();
  const params = useParams<{ group: string; module: string }>();
  const { session } = useAppSession();
  const groups = groupsForKind(session.kind);
  const modules = session.kind === "empresa" ? STAFF_MODULES : clientModules(session.displayName);
  const groupId = params.group;
  const moduleId = params.module;
  const nav = findNavItem(groups, moduleId);
  const financeModule = findModule(modules, moduleId);
  const valid = Boolean(nav && nav.group.id === groupId && financeModule);

  useEffect(() => {
    if (!valid) router.replace(PATHS.dashboard);
  }, [router, valid]);

  if (!valid || !financeModule) return null;

  if (session.kind === "dni") {
    if (moduleId === "prestamo-activo") return <ClientPrestamoPage />;
    if (moduleId === "cronograma-cliente") return <ClientCronogramaPage />;
    if (moduleId === "cuotas-cliente") return <ClientCuotasPage />;
    if (moduleId === "historial-pagos") return <ClientHistorialPage />;
    if (moduleId === "contrato") return <ClientContratoPage />;
    if (moduleId === "comprobantes") return <ClientComprobantesPage />;
  }

  if (moduleId === "usuarios") return <UsersPage />;
  if (moduleId === "parametros") return <ParametrosPage />;
  if (moduleId === "solicitudes") return <SolicitudesPage />;
  if (moduleId === "vigentes") return <VigentesPage />;
  if (moduleId === "cronogramas") return <CronogramasPage />;
  if (moduleId === "registrar-pago") return <RegistrarPagoPage />;
  if (moduleId === "cuotas") return <CuotasPage />;
  if (moduleId === "mora") return <MoraPage />;
  if (moduleId === "cartera-clientes") return <CarteraClientesPage />;
  if (moduleId === "consulta-dni") return <ConsultaDniPage />;
  if (moduleId === "vencimientos") return <VencimientosPage />;
  if (moduleId === "gestiones") return <GestionesPage />;
  if (moduleId === "reporte-cartera") return <ReporteCarteraPage />;
  if (moduleId === "reporte-cobranza") return <ReporteCobranzaPage />;

  return <ModuleView module={financeModule} />;
}
