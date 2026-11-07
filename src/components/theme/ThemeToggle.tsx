"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, Theme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  variant?: "compact" | "segmented";
  size?: "sm" | "md";
}

export function ThemeToggle({ className = "", variant = "compact", size = "md" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSmall = size === "sm";

  if (!mounted) {
    return (
      <div
        className={`${
          isSmall ? "w-6 h-6" : "w-8 h-8"
        } rounded-full bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse ${className}`}
      />
    );
  }

  if (variant === "segmented") {
    const options: { value: Theme; label: string; icon: typeof Sun }[] = [
      { value: "light", label: "Light", icon: Sun },
      { value: "dark", label: "Dark", icon: Moon },
      { value: "system", label: "Auto", icon: Laptop },
    ];

    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-full bg-slate-100/90 dark:bg-navy-900/90 backdrop-blur-sm border border-slate-200/90 dark:border-gold-500/30 ${
          isSmall ? "text-[10px]" : "text-xs"
        } font-mono shadow-sm ${className}`}
        role="group"
        aria-label="Theme selector"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center justify-center ${
                isSmall ? "gap-1 p-1 sm:px-2 sm:py-0.5" : "gap-1.5 px-2.5 py-1"
              } rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-gold-400 text-slate-900 dark:text-navy-950 font-bold shadow-sm"
                  : "text-slate-500 dark:text-navy-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={`Switch to ${opt.label} theme`}
              aria-label={`${opt.label} theme`}
            >
              <Icon className={isSmall ? "w-3 h-3 sm:w-3.5 sm:h-3.5" : "w-3.5 h-3.5"} />
              <span className={isSmall ? "hidden sm:inline" : ""}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant: Cycles through Light -> Dark -> System
  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    const iconClass = isSmall ? "w-3.5 h-3.5" : "w-4 h-4";
    if (theme === "system") {
      return <Laptop className={`${iconClass} text-slate-600 dark:text-gold-300`} />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className={`${iconClass} text-gold-400`} />;
    }
    return <Sun className={`${iconClass} text-amber-500`} />;
  };

  const getLabel = () => {
    if (theme === "system") return "Auto";
    if (theme === "dark") return "Dark";
    return "Light";
  };

  return (
    <button
      onClick={cycleTheme}
      className={`inline-flex items-center justify-center ${
        isSmall ? "p-1.5 sm:px-2 sm:py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1 text-xs"
      } rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-800 border border-slate-200 dark:border-gold-500/30 font-mono text-slate-700 dark:text-navy-200 transition-colors shadow-sm ${className}`}
      title={`Theme: ${getLabel()} (click to cycle Light / Dark / Auto)`}
      aria-label={`Toggle theme. Current: ${getLabel()}`}
    >
      {getIcon()}
      <span className={isSmall ? "hidden sm:inline font-semibold capitalize" : "font-semibold capitalize"}>{getLabel()}</span>
    </button>
  );
}

export default ThemeToggle;
