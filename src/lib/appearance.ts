import { z } from "zod";

export const ACCENT_PRESETS = {
  "bear-gold": "#F4C542",
  "bear-brown": "#8B5E3C",
  blue: "#3B82F6",
  purple: "#A855F7",
  green: "#22C55E",
  red: "#EF4444",
  orange: "#F97316",
  pink: "#EC4899",
} as const;

export const appearanceSchema = z.object({
  version: z.literal(1),
  theme: z.enum(["dark", "light", "system"]),
  accentPreset: z.enum([
    "bear-gold",
    "bear-brown",
    "blue",
    "purple",
    "green",
    "red",
    "orange",
    "pink",
    "custom",
  ]),
  customAccent: z.string().regex(/^#([0-9A-Fa-f]{6})$/),
  backgroundStyle: z.enum(["solid", "gradient", "glow", "minimal", "glass"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  borderRadius: z.enum(["square", "subtle", "rounded", "extra-rounded"]),
  fontSize: z.enum(["small", "default", "large", "extra-large"]),
  fontStyle: z.enum(["default", "modern", "friendly", "clean", "system"]),
  animationLevel: z.enum(["system", "full", "reduced", "none"]),
  videoLayout: z.enum([
    "picture-in-picture",
    "side-by-side",
    "partner-focused",
    "local-hidden",
  ]),
  chatPosition: z.enum(["right", "left", "bottom", "hidden"]),
  controlPosition: z.enum([
    "bottom-centre",
    "bottom-left",
    "bottom-right",
    "above-chat",
    "floating",
  ]),
  localVideoSize: z.enum(["small", "medium", "large"]),
  showOnlineCount: z.boolean(),
  showConnectionQuality: z.boolean(),
  showChatTimestamps: z.boolean(),
  showTooltips: z.boolean(),
  showShortcutHints: z.boolean(),
  showLocalVideoLabel: z.boolean(),
  showPartnerCountry: z.boolean(),
  showSearchingAnimations: z.boolean(),
  selectedCameraId: z.string(),
  selectedMicrophoneId: z.string(),
});

export type AppearanceSettings = z.infer<typeof appearanceSchema>;

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  version: 1,
  theme: "dark",
  accentPreset: "bear-gold",
  customAccent: "#F4C542",
  backgroundStyle: "solid",
  density: "comfortable",
  borderRadius: "rounded",
  fontSize: "default",
  fontStyle: "default",
  animationLevel: "system",
  videoLayout: "side-by-side",
  chatPosition: "bottom",
  controlPosition: "bottom-centre",
  localVideoSize: "medium",
  showOnlineCount: true,
  showConnectionQuality: true,
  showChatTimestamps: false,
  showTooltips: true,
  showShortcutHints: false,
  showLocalVideoLabel: true,
  showPartnerCountry: true,
  showSearchingAnimations: true,
  selectedCameraId: "",
  selectedMicrophoneId: "",
};

export const SETTINGS_STORAGE_KEY = "beartv-settings-v1";
export const SETTINGS_UPDATED_AT_KEY = "beartv-settings-updated-at";

export function parseAppearance(raw: unknown): AppearanceSettings {
  const base = { ...DEFAULT_APPEARANCE };
  if (!raw || typeof raw !== "object") return base;

  const incoming = raw as Record<string, unknown>;
  const next: AppearanceSettings = { ...base, version: 1 };

  // Validate each key independently so one bad value cannot wipe all settings
  (Object.keys(base) as Array<keyof AppearanceSettings>).forEach((key) => {
    if (key === "version") return;
    if (!(key in incoming)) return;
    const candidate = { ...next, [key]: incoming[key], version: 1 as const };
    const result = appearanceSchema.safeParse(candidate);
    if (result.success) {
      (next as Record<string, unknown>)[key] = result.data[key];
    }
  });

  return next;
}

export function getAccentColor(settings: AppearanceSettings): string {
  if (settings.accentPreset === "custom") return settings.customAccent;
  return ACCENT_PRESETS[settings.accentPreset] ?? ACCENT_PRESETS["bear-gold"];
}

export function resolveTheme(theme: AppearanceSettings["theme"]): "dark" | "light" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

const RADIUS_MAP = {
  square: "0px",
  subtle: "8px",
  rounded: "16px",
  "extra-rounded": "24px",
} as const;

const FONT_SCALE_MAP = {
  small: "0.9",
  default: "1",
  large: "1.1",
  "extra-large": "1.2",
} as const;

export const FONT_FAMILY_MAP = {
  default: "var(--font-default), ui-sans-serif, system-ui, sans-serif",
  modern: "var(--font-modern), ui-sans-serif, system-ui, sans-serif",
  friendly: "var(--font-friendly), ui-sans-serif, system-ui, sans-serif",
  clean: "Arial, Helvetica, ui-sans-serif, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const FONT_PREVIEW_VAR: Record<keyof typeof FONT_FAMILY_MAP, string> = {
  default: "var(--font-default), ui-sans-serif, system-ui, sans-serif",
  modern: "var(--font-modern), ui-sans-serif, system-ui, sans-serif",
  friendly: "var(--font-friendly), ui-sans-serif, system-ui, sans-serif",
  clean: "Arial, Helvetica, ui-sans-serif, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** Resolve stored animation preference to an effective mode */
export function resolveAnimationLevel(
  level: AppearanceSettings["animationLevel"]
): "full" | "reduced" | "none" {
  if (level === "none") return "none";
  if (level === "reduced") return "reduced";
  if (level === "full") return "full";
  // system — only follow OS when the user has not made an explicit choice
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "reduced";
  }
  return "full";
}

const LOCAL_VIDEO_MAP = {
  small: { width: "160px", height: "160px" },
  medium: { width: "220px", height: "220px" },
  large: { width: "300px", height: "300px" },
} as const;

export function applyAppearanceTokens(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const resolved = resolveTheme(settings.theme);
  const accent = getAccentColor(settings);
  const animation = resolveAnimationLevel(settings.animationLevel);

  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.dataset.density = settings.density;
  root.dataset.backgroundStyle = settings.backgroundStyle;
  root.dataset.radius = settings.borderRadius;
  root.dataset.fontStyle = settings.fontStyle;
  root.dataset.animations = animation;
  root.dataset.animation = animation; // backwards compat
  root.dataset.animationPreference = settings.animationLevel;
  root.dataset.videoLayout = settings.videoLayout;
  root.dataset.chatPosition = settings.chatPosition;
  root.dataset.controlPosition = settings.controlPosition;
  root.dataset.localVideoSize = settings.localVideoSize;
  root.style.colorScheme = resolved;

  root.style.setProperty("--accent", accent);
  root.style.setProperty(
    "--accent-foreground",
    resolved === "dark" ? "#17120a" : "#17120a"
  );
  root.style.setProperty("--accent-text", "#17120a");
  root.style.setProperty("--radius", RADIUS_MAP[settings.borderRadius]);
  root.style.setProperty("--font-scale", FONT_SCALE_MAP[settings.fontSize]);
  root.style.setProperty("--app-font", FONT_FAMILY_MAP[settings.fontStyle]);
  root.style.setProperty("--font-family", FONT_FAMILY_MAP[settings.fontStyle]);
  root.style.setProperty("--danger", "#dc2626");
  root.style.setProperty("--danger-text", "#ffffff");
  root.style.setProperty("--local-video-width", LOCAL_VIDEO_MAP[settings.localVideoSize].width);
  root.style.setProperty("--local-video-height", LOCAL_VIDEO_MAP[settings.localVideoSize].height);

  if (animation === "none") {
    root.style.setProperty("--animation-duration-fast", "0ms");
    root.style.setProperty("--animation-duration-normal", "0ms");
    root.style.setProperty("--animation-distance", "0px");
  } else if (animation === "reduced") {
    root.style.setProperty("--animation-duration-fast", "80ms");
    root.style.setProperty("--animation-duration-normal", "120ms");
    root.style.setProperty("--animation-distance", "2px");
  } else {
    root.style.setProperty("--animation-duration-fast", "150ms");
    root.style.setProperty("--animation-duration-normal", "250ms");
    root.style.setProperty("--animation-distance", "8px");
  }

  // Video panels stay dark in every theme
  root.style.setProperty("--video-panel-background", "#1b1b1b");
  root.style.setProperty("--video-panel-text", "#f7f7f7");
  root.style.setProperty("--video-panel-muted-text", "#b8b8b8");
  root.style.setProperty("--video-panel-border", resolved === "dark" ? "#3c3c3c" : "#444444");

  if (resolved === "dark") {
    root.style.setProperty("--page-background", "#111111");
    root.style.setProperty("--page-bg", "#111111");
    root.style.setProperty("--surface-background", "#181818");
    root.style.setProperty("--surface-bg", "#181818");
    root.style.setProperty("--card-bg", "#222222");
    root.style.setProperty("--text-primary", "#f7f7f7");
    root.style.setProperty("--text-secondary", "#b8b8b8");
    root.style.setProperty("--text-muted", "#8f8f8f");
    root.style.setProperty("--border-default", "#353535");
    root.style.setProperty("--border-color", "#353535");
    root.style.setProperty("--background", "#111111");
    root.style.setProperty("--surface", "#181818");
    root.style.setProperty("--card", "#222222");
    root.style.setProperty("--foreground", "#f7f7f7");
    root.style.setProperty("--muted", "#b8b8b8");
  } else {
    root.style.setProperty("--page-background", "#f7f5ef");
    root.style.setProperty("--page-bg", "#f7f5ef");
    root.style.setProperty("--surface-background", "#ffffff");
    root.style.setProperty("--surface-bg", "#ffffff");
    root.style.setProperty("--card-bg", "#ffffff");
    root.style.setProperty("--text-primary", "#171717");
    root.style.setProperty("--text-secondary", "#454545");
    root.style.setProperty("--text-muted", "#666666");
    root.style.setProperty("--border-default", "#c9c9c9");
    root.style.setProperty("--border-color", "#c9c9c9");
    root.style.setProperty("--background", "#f7f5ef");
    root.style.setProperty("--surface", "#ffffff");
    root.style.setProperty("--card", "#ffffff");
    root.style.setProperty("--foreground", "#171717");
    root.style.setProperty("--muted", "#454545");
  }
}

export function getMotionDuration(ms: number): number {
  if (typeof document === "undefined") return ms;
  const mode = document.documentElement.dataset.animations;
  if (mode === "none") return 0;
  if (mode === "reduced") return Math.min(ms, 120);
  return ms;
}
