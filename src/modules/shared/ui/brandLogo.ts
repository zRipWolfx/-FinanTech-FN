export type LogoVariant = "light" | "dark";

/** Light: logo para fondos claros. Dark: logo para fondos oscuros. */
export function brandLogoSrc(variant: LogoVariant) {
  return variant === "dark" ? "/Logo_F_Dark.png" : "/Logo_F_Ligth.png";
}
