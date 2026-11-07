"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default theme is strictly "light" (White)
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference or default to "light"
    const saved = (localStorage.getItem("visroslot_theme") as Theme) || "light";
    setThemeState(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
        body.classList.add("dark");
        body.classList.remove("light");
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        body.classList.remove("dark");
        body.classList.add("light");
        setResolvedTheme("light");
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("visroslot_theme", newTheme);
    } catch (e) {
      // Ignore quota errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
