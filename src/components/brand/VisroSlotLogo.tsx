import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { PlatformLogo, PlatformLogoProps, PLATFORM_LOGO_ASSETS } from "./PlatformLogo";

export interface VisroSlotLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string | null;
  variant?: "full" | "compact" | "emblem" | "icon" | "dark" | "light" | string;
  priority?: boolean;
}

export function VisroSlotLogo({
  className = "",
  size = "md",
  showTagline = true,
  href = "/",
  variant = "compact",
  priority = false,
}: VisroSlotLogoProps) {
  // If variant is explicit "full", render the full circular logo
  if (variant === "full") {
    return (
      <PlatformLogo
        variant="full"
        size={size}
        href={href}
        className={className}
        priority={priority}
      />
    );
  }

  // If variant is "emblem" or "icon", render icon only
  if (variant === "emblem" || variant === "icon") {
    return (
      <PlatformLogo
        variant="emblem"
        size={size}
        href={href}
        className={className}
        priority={priority}
      />
    );
  }

  // Handle "dark" or "light" theme variants passed from older pages
  const theme = variant === "dark" ? "dark" : variant === "light" ? "light" : "auto";

  return (
    <PlatformLogo
      variant="compact"
      size={size}
      theme={theme}
      showTagline={showTagline}
      href={href}
      className={className}
      priority={priority}
    />
  );
}

export const VISRO_PHONE = "+91 93913 54003";
export const VISRO_PHONE_TEL = "tel:+919391354003";
export const VISRO_INSTAGRAM_URL = "https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0";

export function VisroContactPhone({
  className = "",
  showIcon = false,
}: {
  className?: string;
  showIcon?: boolean;
  variant?: "dark" | "light" | string;
}) {
  return (
    <a
      href={VISRO_PHONE_TEL}
      className={`inline-flex items-center gap-1.5 font-sans text-xs text-slate-700 hover:text-navy-900 dark:text-slate-300 dark:hover:text-gold-400 transition-colors ${className}`}
      title="Call VisroSlot Team"
    >
      {showIcon && <Phone className="w-3.5 h-3.5 opacity-80 text-gold-600 dark:text-gold-400 shrink-0" />}
      <span className="font-medium text-slate-900 dark:text-white">{VISRO_PHONE}</span>
    </a>
  );
}

export { VisroContactPhone as VisroSupportLink };
export { PlatformLogo, PLATFORM_LOGO_ASSETS };
export default VisroSlotLogo;
