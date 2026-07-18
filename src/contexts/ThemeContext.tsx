"use client";

import { useSettings } from "./SettingsContext";

/** Compatibility layer for components that still import useTheme */
export function useTheme() {
  const { settings, updateSettings } = useSettings();
  const resolved =
    settings.theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : settings.theme;

  return {
    theme: resolved as "dark" | "light",
    toggleTheme: () =>
      updateSettings({
        theme: resolved === "dark" ? "light" : "dark",
      }),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
