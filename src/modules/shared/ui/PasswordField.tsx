"use client";

import { useState, type InputHTMLAttributes } from "react";

import { IconEye, IconEyeOff, IconTipButton } from "@/modules/shared/ui/IconTipButton";
import styles from "./FormFields.module.css";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapClassName?: string;
  inputClassName?: string;
};

export function PasswordField({
  wrapClassName,
  inputClassName,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`${styles.passwordWrap} ${wrapClassName ?? ""}`.trim()}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${styles.underline} ${inputClassName ?? ""} ${className ?? ""}`.trim()}
      />
      <IconTipButton
        tip={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </IconTipButton>
    </span>
  );
}
