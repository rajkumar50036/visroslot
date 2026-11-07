"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "full" | "compact" | "emblem" | "icon";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LogoTheme = "light" | "dark" | "auto";

export interface PlatformLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  href?: string | null;
  className?: string;
  showTagline?: boolean;
  priority?: boolean;
  alt?: string;
}

// Centralized asset paths
export const PLATFORM_LOGO_ASSETS = {
  full: "/assets/visroslot-logo.png",
  fullAlias: "/assets/visroslot-logo-full.png",
  compact: "/assets/visroslot-logo-compact.png",
  emblem: "/assets/visroslot-emblem.png",
  favicon: "/favicon.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const;

export function PlatformLogo({
  variant = "compact",
  size = "md",
  theme = "auto",
  href = "/",
  className = "",
  showTagline = true,
  priority = false,
  alt = "VISROSLOT — Every Slot. Simplified.",
}: PlatformLogoProps) {
  // Sizing configurations for different contexts
  const sizeMap = {
    full: {
      xs: { width: 90, height: 90, container: "w-[90px] h-[90px]" },
      sm: { width: 130, height: 130, container: "w-[130px] h-[130px]" },
      md: { width: 180, height: 180, container: "w-[180px] h-[180px]" },
      lg: { width: 240, height: 240, container: "w-[240px] h-[240px]" },
      xl: { width: 320, height: 320, container: "w-[320px] h-[320px]" },
    },
    compact: {
      xs: {
        iconSize: 24,
        titleClass: "text-sm font-extrabold tracking-wide",
        taglineClass: "text-[8px] tracking-wider",
        gap: "gap-1.5",
        height: 28,
      },
      sm: {
        iconSize: 32,
        titleClass: "text-base font-extrabold tracking-wide",
        taglineClass: "text-[9px] tracking-widest",
        gap: "gap-2",
        height: 36,
      },
      md: {
        iconSize: 40,
        titleClass: "text-lg font-black tracking-wide",
        taglineClass: "text-[10px] tracking-widest font-semibold",
        gap: "gap-2.5",
        height: 44,
      },
      lg: {
        iconSize: 50,
        titleClass: "text-xl font-black tracking-wide",
        taglineClass: "text-xs tracking-widest font-bold",
        gap: "gap-3",
        height: 54,
      },
      xl: {
        iconSize: 64,
        titleClass: "text-2xl font-black tracking-wide",
        taglineClass: "text-sm tracking-widest font-bold",
        gap: "gap-3.5",
        height: 68,
      },
    },
    emblem: {
      xs: { size: 24 },
      sm: { size: 32 },
      md: { size: 42 },
      lg: { size: 56 },
      xl: { size: 72 },
    },
  };

  // -----------------------------------------------------------
  // VERSION A: Full Circular Logo (The complete official emblem)
  // Used on: Login, Register, Forgot Password, Reset Password, Loading, Splash, Hero
  // -----------------------------------------------------------
  if (variant === "full") {
    const config = sizeMap.full[size];

    const fullContent = (
      <div
        className={`relative inline-flex items-center justify-center select-none group transition-transform duration-300 hover:scale-[1.02] ${config.container} ${className}`}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl ring-2 ring-gold-400/40 bg-navy-950/80 p-1">
          <Image
            src={PLATFORM_LOGO_ASSETS.full}
            alt={alt}
            width={config.width}
            height={config.height}
            className="w-full h-full object-contain drop-shadow-md rounded-full"
            priority={priority}
          />
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block focus:outline-none focus:ring-2 focus:ring-gold-400 rounded-full" title={alt}>
          {fullContent}
        </Link>
      );
    }
    return fullContent;
  }

  // -----------------------------------------------------------
  // EMBLEM ONLY (Pure icon crop without wordmark)
  // -----------------------------------------------------------
  if (variant === "emblem" || variant === "icon") {
    const iconDim = sizeMap.emblem[size].size;
    const emblemContent = (
      <div
        className={`relative inline-flex items-center justify-center select-none rounded-full overflow-hidden ring-1 ring-gold-400/40 shadow-sm bg-navy-950 shrink-0 ${className}`}
        style={{ width: iconDim, height: iconDim }}
      >
        <Image
          src={PLATFORM_LOGO_ASSETS.full}
          alt={alt}
          width={iconDim}
          height={iconDim}
          className="w-full h-full object-cover rounded-full"
          priority={priority}
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block shrink-0" title={alt}>
          {emblemContent}
        </Link>
      );
    }
    return emblemContent;
  }

  // -----------------------------------------------------------
  // VERSION B: Compact Logo (Emblem + Readable Wordmark)
  // Used on: Dashboard Header, Sidebar, Customer Dashboard, Mobile Nav, AI interfaces
  // -----------------------------------------------------------
  const compactConfig = sizeMap.compact[size];

  // Dynamic textColor based on theme prop
  const titleColor =
    theme === "light"
      ? "text-slate-900"
      : theme === "dark"
      ? "text-white"
      : "text-slate-900 dark:text-white";

  const taglineColor =
    theme === "light"
      ? "text-slate-500"
      : theme === "dark"
      ? "text-gold-300/90"
      : "text-slate-500 dark:text-gold-300/90";

  const compactContent = (
    <div
      className={`inline-flex items-center ${compactConfig.gap} select-none group shrink-0 ${className}`}
      style={{ minHeight: compactConfig.height }}
    >
      {/* Official Circular Logo Artwork */}
      <div
        className="relative rounded-full overflow-hidden shadow-md ring-1.5 ring-gold-400/40 bg-navy-950 shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: compactConfig.iconSize, height: compactConfig.iconSize }}
      >
        <Image
          src={PLATFORM_LOGO_ASSETS.full}
          alt="VISROSLOT Emblem"
          width={compactConfig.iconSize}
          height={compactConfig.iconSize}
          className="w-full h-full object-cover rounded-full"
          priority={priority}
        />
      </div>

      {/* Brand Wordmark & Tagline: Highly readable on both light & dark */}
      <div className="flex flex-col leading-none justify-center">
        <div className="flex items-center">
          <span className={`font-display uppercase ${compactConfig.titleClass} ${titleColor} transition-colors tracking-wider`}>
            VISRO<span className="text-orange-500 font-black">SLOT</span>
          </span>
        </div>
        {showTagline && (
          <span
            className={`hidden sm:block font-mono uppercase ${compactConfig.taglineClass} ${taglineColor} mt-0.5 transition-colors`}
          >
            EVERY SLOT. SIMPLIFIED.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95 focus:outline-none" title={alt}>
        {compactContent}
      </Link>
    );
  }

  return compactContent;
}

export default PlatformLogo;
