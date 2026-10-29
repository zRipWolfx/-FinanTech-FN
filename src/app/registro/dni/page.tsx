import Link from "next/link";

import { AuthShell, DniRegisterForm } from "@/modules/auth";

export default function RegistroDniPage() {
  return (
    <AuthShell
      kicker="Registro operativo"
      title="Regístrate con DNI"
      copy="Crea tu acceso operativo con documento de identidad y contraseña."
      footer={
        <>
          ¿Ya tienes acceso? <Link href="/">Inicia sesión</Link>
          {" · "}
          <Link href="/">Volver</Link>
        </>
      }
    >
      <DniRegisterForm />
    </AuthShell>
  );
}
