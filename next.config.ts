import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:8080";

const legacyModuleRedirects = [
  ["solicitudes", "prestamos"],
  ["vigentes", "prestamos"],
  ["cronogramas", "prestamos"],
  ["registrar-pago", "pagos"],
  ["cuotas", "pagos"],
  ["mora", "pagos"],
  ["cartera-clientes", "clientes"],
  ["consulta-dni", "clientes"],
  ["vencimientos", "cobranza"],
  ["gestiones", "cobranza"],
  ["reporte-cartera", "reportes"],
  ["reporte-cobranza", "reportes"],
  ["usuarios", "admin"],
  ["parametros", "admin"],
  ["prestamo-activo", "prestamos"],
  ["cronograma-cliente", "prestamos"],
  ["cuotas-cliente", "pagos"],
  ["historial-pagos", "pagos"],
  ["contrato", "docs"],
  ["comprobantes", "docs"],
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/dashboard/perfil",
        destination: "/perfil",
        permanent: false,
      },
      ...legacyModuleRedirects.map(([moduleId, groupId]) => ({
        source: `/dashboard/${moduleId}`,
        destination: `/${groupId}/${moduleId}`,
        permanent: false,
      })),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  // Solo globals.css pasa por Tailwind. Si se aplica a *.module.css,
  // Turbopack elimina las clases del módulo y el layout se rompe.
  turbopack: {
    rules: {
      "**/globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
