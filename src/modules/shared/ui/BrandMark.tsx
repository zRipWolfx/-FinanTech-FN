import Image from "next/image";

import { brandLogoSrc, type LogoVariant } from "./brandLogo";
import styles from "./BrandMark.module.css";

type BrandMarkProps = {
  compact?: boolean;
  showText?: boolean;
  /** light = fondos claros, dark = fondos oscuros */
  variant?: LogoVariant;
};

export function BrandMark({
  compact = false,
  showText = true,
  variant = "light",
}: BrandMarkProps) {
  const size = compact ? 44 : 56;

  return (
    <div className={`${styles.brand} ${compact ? styles.compact : ""}`}>
      <Image
        className={styles.logo}
        src={brandLogoSrc(variant)}
        alt="FinanTech"
        width={size}
        height={size}
        priority
      />
      {showText ? (
        <div className={styles.text}>
          <p className={styles.title}>FinanTech S.A.</p>
          {!compact ? (
            <p className={styles.subtitle}>Préstamos y pagos</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
