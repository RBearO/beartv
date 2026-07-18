"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaDeviceOption } from "@/hooks/useMediaDevices";

interface DeviceDropdownProps {
  label: string;
  devices: MediaDeviceOption[];
  selectedId: string;
  onSelect: (deviceId: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}

export default function DeviceDropdown({
  label,
  devices,
  selectedId,
  onSelect,
  disabled,
  emptyLabel = "No devices found",
}: DeviceDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 w-9 items-center justify-center rounded-xl border border-white/10 bg-bear-light text-white/80",
          "hover:bg-bear-light/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        )}
      >
        <ChevronDown size={16} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute bottom-full mb-2 left-0 z-50 min-w-[220px] max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-bear-gray/95 backdrop-blur-xl p-1 shadow-2xl"
        >
          {devices.length === 0 ? (
            <li className="px-3 py-2 text-sm text-white/40">{emptyLabel}</li>
          ) : (
            devices.map((device) => {
              const selected = device.deviceId === selectedId;
              return (
                <li key={device.deviceId || device.label}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      selected
                        ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-white"
                        : "text-white/80 hover:bg-white/5"
                    )}
                    onClick={() => {
                      onSelect(device.deviceId);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1 truncate">{device.label}</span>
                    {selected && <Check size={14} className="text-[var(--accent)] shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
