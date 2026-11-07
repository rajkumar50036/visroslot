import React from "react";

interface SlotoraLogoProps {
  variant?: "dark" | "light";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SlotoraLogo({ variant = "dark", className = "", size = "md" }: SlotoraLogoProps) {
  const isLight = variant === "light";
  const textColor = isLight ? "text-white" : "text-ink";
  const ringBorder = isLight ? "border-white/30" : "border-ink/25";

  const sizeStyles = {
    sm: {
      text: "text-lg tracking-widest",
      icon: "w-5 h-5",
      dot: "w-1.5 h-1.5",
    },
    md: {
      text: "text-xl sm:text-2xl tracking-widest",
      icon: "w-6 h-6",
      dot: "w-2 h-2",
    },
    lg: {
      text: "text-3xl sm:text-4xl tracking-widest",
      icon: "w-8 h-8",
      dot: "w-2.5 h-2.5",
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Time-inspired geometric aperture symbol with coral accent */}
      <div 
        className={`relative ${sizeStyles.icon} rounded-full border ${ringBorder} flex items-center justify-center transition-transform group-hover:rotate-90 duration-500`}
      >
        {/* Subtle crosshair lines */}
        <div className="absolute inset-x-1 h-[1px] bg-current opacity-30" />
        <div className="absolute inset-y-1 w-[1px] bg-current opacity-30" />
        
        {/* Coral Time Core Dot */}
        <div className={`${sizeStyles.dot} rounded-full bg-coral shadow-sm shadow-coral/50 animate-pulse`} />
      </div>

      {/* Uppercase Geometric Wordmark */}
      <span className={`font-display font-extrabold uppercase ${sizeStyles.text} ${textColor}`}>
        SLOTORA
      </span>
    </div>
  );
}

export default SlotoraLogo;
