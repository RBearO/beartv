"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  applyAppearanceTokens,
  DEFAULT_APPEARANCE,
  parseAppearance,
  SETTINGS_STORAGE_KEY,
  SETTINGS_UPDATED_AT_KEY,
  type AppearanceSettings,
} from "@/lib/appearance";

export type SettingsTab =
  | "appearance"
  | "audio-video"
  | "chat"
  | "accessibility"
  | "language"
  | "privacy"
  | "account";

interface SettingsContextValue {
  settings: AppearanceSettings;
  updateSettings: (partial: Partial<AppearanceSettings>) => void;
  resetAppearance: () => void;
  resetAllSettings: () => void;
  isSettingsOpen: boolean;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadLocal(): { settings: AppearanceSettings; updatedAt: number } {
  if (typeof window === "undefined") {
    return { settings: DEFAULT_APPEARANCE, updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const updatedAt = Number(localStorage.getItem(SETTINGS_UPDATED_AT_KEY) || "0");
    return { settings: parseAppearance(raw ? JSON.parse(raw) : {}), updatedAt };
  } catch {
    return { settings: DEFAULT_APPEARANCE, updatedAt: 0 };
  }
}

function saveLocal(settings: AppearanceSettings, updatedAt = Date.now()) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  localStorage.setItem(SETTINGS_UPDATED_AT_KEY, String(updatedAt));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const hydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const updatedAtRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const local = loadLocal();
    setSettings(local.settings);
    updatedAtRef.current = local.updatedAt;
    applyAppearanceTokens(local.settings);
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    applyAppearanceTokens(settings);
  }, [settings]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearanceTokens(settingsRef.current);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.theme]);

  useEffect(() => {
    if (settings.animationLevel !== "system") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => applyAppearanceTokens(settingsRef.current);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.animationLevel]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const serverAppearance = parseAppearance(data?.appearance ?? {});
        const serverUpdatedAt = data?.appearanceUpdatedAt
          ? new Date(data.appearanceUpdatedAt).getTime()
          : 0;

        if (serverUpdatedAt >= updatedAtRef.current) {
          setSettings(serverAppearance);
          updatedAtRef.current = serverUpdatedAt;
          saveLocal(serverAppearance, serverUpdatedAt);
        } else if (updatedAtRef.current > 0) {
          await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appearance: settingsRef.current,
              appearanceUpdatedAt: new Date(updatedAtRef.current).toISOString(),
            }),
          });
        }
      } catch {
        // Keep local settings
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const persist = useCallback(
    (next: AppearanceSettings) => {
      const now = Date.now();
      updatedAtRef.current = now;
      saveLocal(next, now);

      if (status !== "authenticated") return;

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appearance: next,
            appearanceUpdatedAt: new Date(now).toISOString(),
            darkMode: next.theme !== "light",
          }),
        }).catch(() => {});
      }, 400);
    },
    [status]
  );

  const updateSettings = useCallback(
    (partial: Partial<AppearanceSettings>) => {
      setSettings((prev) => {
        const next = parseAppearance({ ...prev, ...partial, version: 1 });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetAppearance = useCallback(() => {
    setSettings((prev) => {
      const next = parseAppearance({
        ...DEFAULT_APPEARANCE,
        selectedCameraId: prev.selectedCameraId,
        selectedMicrophoneId: prev.selectedMicrophoneId,
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const resetAllSettings = useCallback(() => {
    const next = { ...DEFAULT_APPEARANCE };
    setSettings(next);
    persist(next);
  }, [persist]);

  const openSettings = useCallback((tab: SettingsTab = "appearance") => {
    setActiveTab(tab);
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetAppearance,
      resetAllSettings,
      isSettingsOpen,
      openSettings,
      closeSettings,
      activeTab,
      setActiveTab,
    }),
    [
      settings,
      updateSettings,
      resetAppearance,
      resetAllSettings,
      isSettingsOpen,
      openSettings,
      closeSettings,
      activeTab,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
