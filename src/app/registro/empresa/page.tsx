import Link from "next/link";

import { AuthShell, EmpresaRegisterForm } from "@/modules/auth";

export default function RegistroEmpresaPage() {
  return (
    <AuthShell
      kicker="Registro empresa"
      title="Crea tu cuenta"
      copy="Regístrate con correo corporativo y contraseña para entrar al panel."
      footer={
        <>
          ¿Ya tienes cuenta? <Link href="/">Inicia sesión</Link>
          {" · "}
          <Link href="/">Volver</Link>
        </>
      }
    >
      <EmpresaRegisterForm />
    </AuthShell>
  );
}
