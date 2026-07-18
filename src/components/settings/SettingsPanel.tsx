"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useSettings, type SettingsTab } from "@/contexts/SettingsContext";
import {
  ACCENT_PRESETS,
  FONT_PREVIEW_VAR,
  type AppearanceSettings,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "audio-video", label: "Audio and Video" },
  { id: "chat", label: "Chat" },
  { id: "accessibility", label: "Accessibility" },
  { id: "language", label: "Language" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; fontFamily?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            style={opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition-colors",
              value === opt.value
                ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--text-primary)]"
                : "border-[var(--border-color)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--accent)] w-4 h-4"
      />
    </label>
  );
}

export default function SettingsPanel() {
  const {
    settings,
    updateSettings,
    resetAppearance,
    resetAllSettings,
    isSettingsOpen,
    closeSettings,
    activeTab,
    setActiveTab,
  } = useSettings();
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const patch = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) =>
    updateSettings({ [key]: value });

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} title="Settings" size="xl">
      <div className="flex flex-col sm:flex-row gap-4 max-h-[70vh]">
        <nav className="sm:w-44 shrink-0 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm text-left whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-background)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {activeTab === "appearance" && (
            <>
              <OptionGroup
                label="Theme mode"
                value={settings.theme}
                onChange={(v) => patch("theme", v)}
                options={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                  { value: "system", label: "System" },
                ]}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)] settings-label">Accent colour</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ACCENT_PRESETS) as Array<keyof typeof ACCENT_PRESETS>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      aria-pressed={settings.accentPreset === key}
                      onClick={() => updateSettings({ accentPreset: key })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform",
                        settings.accentPreset === key
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: ACCENT_PRESETS[key] }}
                    />
                  ))}
                  <button
                    type="button"
                    aria-pressed={settings.accentPreset === "custom"}
                    onClick={() => updateSettings({ accentPreset: "custom" })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm border",
                      settings.accentPreset === "custom"
                        ? "border-[var(--accent)] text-[var(--text-primary)]"
                        : "border-[var(--border-default)] text-[var(--text-secondary)]"
                    )}
                  >
                    Custom
                  </button>
                </div>
                {settings.accentPreset === "custom" && (
                  <input
                    type="color"
                    value={settings.customAccent}
                    onChange={(e) => updateSettings({ customAccent: e.target.value, accentPreset: "custom" })}
                    className="h-10 w-20 bg-transparent cursor-pointer"
                    aria-label="Custom accent colour"
                  />
                )}
              </div>

              <OptionGroup
                label="Background style"
                value={settings.backgroundStyle}
                onChange={(v) => patch("backgroundStyle", v)}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "gradient", label: "Gradient" },
                  { value: "glow", label: "Soft glow" },
                  { value: "minimal", label: "Minimal" },
                  { value: "glass", label: "Glass" },
                ]}
              />

              <OptionGroup
                label="Interface density"
                value={settings.density}
                onChange={(v) => patch("density", v)}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "comfortable", label: "Comfortable" },
                  { value: "spacious", label: "Spacious" },
                ]}
              />

              <OptionGroup
                label="Border radius"
                value={settings.borderRadius}
                onChange={(v) => patch("borderRadius", v)}
                options={[
                  { value: "square", label: "Square" },
                  { value: "subtle", label: "Subtle" },
                  { value: "rounded", label: "Rounded" },
                  { value: "extra-rounded", label: "Extra rounded" },
                ]}
              />

              <OptionGroup
                label="Font size"
                value={settings.fontSize}
                onChange={(v) => patch("fontSize", v)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "default", label: "Default" },
                  { value: "large", label: "Large" },
                  { value: "extra-large", label: "Extra large" },
                ]}
              />

              <OptionGroup
                label="Font style"
                value={settings.fontStyle}
                onChange={(v) => patch("fontStyle", v)}
                options={[
                  { value: "default", label: "Default", fontFamily: FONT_PREVIEW_VAR.default },
                  { value: "modern", label: "Modern", fontFamily: FONT_PREVIEW_VAR.modern },
                  { value: "friendly", label: "Friendly", fontFamily: FONT_PREVIEW_VAR.friendly },
                  { value: "clean", label: "Clean", fontFamily: FONT_PREVIEW_VAR.clean },
                  { value: "system", label: "System", fontFamily: FONT_PREVIEW_VAR.system },
                ]}
              />

              <OptionGroup
                label="Animations"
                value={settings.animationLevel}
                onChange={(v) => patch("animationLevel", v)}
                options={[
                  { value: "system", label: "Follow system" },
                  { value: "full", label: "Full motion" },
                  { value: "reduced", label: "Reduced motion" },
                  { value: "none", label: "No motion" },
                ]}
              />

              <OptionGroup
                label="Video layout"
                value={settings.videoLayout}
                onChange={(v) => patch("videoLayout", v)}
                options={[
                  { value: "side-by-side", label: "Side-by-side" },
                  { value: "picture-in-picture", label: "Picture-in-picture" },
                  { value: "partner-focused", label: "Partner focused" },
                  { value: "local-hidden", label: "Hide local while connected" },
                ]}
              />

              <OptionGroup
                label="Chat panel position"
                value={settings.chatPosition}
                onChange={(v) => patch("chatPosition", v)}
                options={[
                  { value: "bottom", label: "Bottom" },
                  { value: "right", label: "Right" },
                  { value: "left", label: "Left" },
                  { value: "hidden", label: "Hidden by default" },
                ]}
              />

              <OptionGroup
                label="Control bar position"
                value={settings.controlPosition}
                onChange={(v) => patch("controlPosition", v)}
                options={[
                  { value: "bottom-centre", label: "Bottom centre" },
                  { value: "bottom-left", label: "Bottom left" },
                  { value: "bottom-right", label: "Bottom right" },
                  { value: "above-chat", label: "Above chat" },
                  { value: "floating", label: "Floating" },
                ]}
              />

              <OptionGroup
                label="Local video size"
                value={settings.localVideoSize}
                onChange={(v) => patch("localVideoSize", v)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ]}
              />

              <div className="space-y-1 border-t border-white/10 pt-3">
                <Toggle label="Show online-user count" checked={settings.showOnlineCount} onChange={(v) => patch("showOnlineCount", v)} />
                <Toggle label="Show connection-quality indicator" checked={settings.showConnectionQuality} onChange={(v) => patch("showConnectionQuality", v)} />
                <Toggle label="Show text-chat timestamps" checked={settings.showChatTimestamps} onChange={(v) => patch("showChatTimestamps", v)} />
                <Toggle label="Show tooltips" checked={settings.showTooltips} onChange={(v) => patch("showTooltips", v)} />
                <Toggle label="Show keyboard-shortcut hints" checked={settings.showShortcutHints} onChange={(v) => patch("showShortcutHints", v)} />
                <Toggle label="Show local-video label" checked={settings.showLocalVideoLabel} onChange={(v) => patch("showLocalVideoLabel", v)} />
                <Toggle label="Show partner country" checked={settings.showPartnerCountry} onChange={(v) => patch("showPartnerCountry", v)} />
                <Toggle label="Show animations while searching" checked={settings.showSearchingAnimations} onChange={(v) => patch("showSearchingAnimations", v)} />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" onClick={resetAppearance}>
                  Reset Appearance
                </Button>
                <Button variant="danger" onClick={() => setConfirmResetAll(true)}>
                  Reset All Settings
                </Button>
              </div>
            </>
          )}

          {activeTab === "audio-video" && (
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Use the microphone and camera dropdowns in the chat control bar to switch devices during a call.</p>
              <p>
                Selected camera ID:{" "}
                <span className="text-[var(--text-primary)]">{settings.selectedCameraId || "Default"}</span>
              </p>
              <p>
                Selected microphone ID:{" "}
                <span className="text-[var(--text-primary)]">{settings.selectedMicrophoneId || "Default"}</span>
              </p>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="space-y-2">
              <Toggle
                label="Show chat timestamps"
                checked={settings.showChatTimestamps}
                onChange={(v) => patch("showChatTimestamps", v)}
              />
              <OptionGroup
                label="Chat panel position"
                value={settings.chatPosition}
                onChange={(v) => patch("chatPosition", v)}
                options={[
                  { value: "bottom", label: "Bottom" },
                  { value: "right", label: "Right" },
                  { value: "left", label: "Left" },
                  { value: "hidden", label: "Hidden" },
                ]}
              />
            </div>
          )}

          {activeTab === "accessibility" && (
            <div className="space-y-4">
              <OptionGroup
                label="Motion"
                value={settings.animationLevel}
                onChange={(v) => patch("animationLevel", v)}
                options={[
                  { value: "system", label: "Follow system" },
                  { value: "full", label: "Full motion" },
                  { value: "reduced", label: "Reduced motion" },
                  { value: "none", label: "No motion" },
                ]}
              />
              <OptionGroup
                label="Font size"
                value={settings.fontSize}
                onChange={(v) => patch("fontSize", v)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "default", label: "Default" },
                  { value: "large", label: "Large" },
                  { value: "extra-large", label: "Extra large" },
                ]}
              />
              <OptionGroup
                label="Font style"
                value={settings.fontStyle}
                onChange={(v) => patch("fontStyle", v)}
                options={[
                  { value: "default", label: "Default", fontFamily: FONT_PREVIEW_VAR.default },
                  { value: "modern", label: "Modern", fontFamily: FONT_PREVIEW_VAR.modern },
                  { value: "friendly", label: "Friendly", fontFamily: FONT_PREVIEW_VAR.friendly },
                  { value: "clean", label: "Clean", fontFamily: FONT_PREVIEW_VAR.clean },
                  { value: "system", label: "System", fontFamily: FONT_PREVIEW_VAR.system },
                ]}
              />
              <Toggle
                label="Show keyboard-shortcut hints"
                checked={settings.showShortcutHints}
                onChange={(v) => patch("showShortcutHints", v)}
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Follow system uses your operating-system reduced-motion preference.
                No motion stops decorative movement, including the matchmaking ring.
              </p>
            </div>
          )}

          {activeTab === "language" && (
            <p className="text-sm text-[var(--text-secondary)]">Language: English (more languages coming soon).</p>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>Video chats are peer-to-peer. BearTV does not record your conversations.</p>
              <Toggle
                label="Show partner country when available"
                checked={settings.showPartnerCountry}
                onChange={(v) => patch("showPartnerCountry", v)}
              />
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Manage your profile and match preferences from the Profile page.</p>
              <a href="/profile" className="text-[var(--accent)] hover:underline">
                Open Profile
              </a>
            </div>
          )}
        </div>
      </div>

      {confirmResetAll && (
        <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3">
          <p className="text-sm text-[var(--text-primary)]">
            Reset all settings to defaults? This will not delete your account, reports, or profile data.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmResetAll(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAllSettings();
                setConfirmResetAll(false);
              }}
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
