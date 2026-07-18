"use client";

import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "./SettingsContext";
import { PresenceProvider } from "./PresenceContext";
import SettingsPanel from "@/components/settings/SettingsPanel";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        <PresenceProvider>
          {children}
          <SettingsPanel />
        </PresenceProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
