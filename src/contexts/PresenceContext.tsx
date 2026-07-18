"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MatchmakingStatus =
  | "idle"
  | "waking"
  | "searching"
  | "connecting"
  | "connected"
  | "stopping"
  | "error";

interface PresenceState {
  onlineCount: number;
  status: MatchmakingStatus;
  showOnlineCount: boolean;
  showStatus: boolean;
}

interface PresenceContextValue extends PresenceState {
  setPresence: (partial: Partial<PresenceState>) => void;
  resetPresence: () => void;
}

const DEFAULT_PRESENCE: PresenceState = {
  onlineCount: 0,
  status: "idle",
  showOnlineCount: true,
  showStatus: true,
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PresenceState>(DEFAULT_PRESENCE);

  const setPresence = useCallback((partial: Partial<PresenceState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetPresence = useCallback(() => {
    setState(DEFAULT_PRESENCE);
  }, []);

  const value = useMemo(
    () => ({ ...state, setPresence, resetPresence }),
    [state, setPresence, resetPresence]
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within PresenceProvider");
  return ctx;
}

export const MATCHMAKING_STATUS_LABEL: Record<MatchmakingStatus, string> = {
  idle: "Stopped",
  waking: "Waking server…",
  searching: "Searching…",
  connecting: "Connecting…",
  connected: "Connected",
  stopping: "Stopping…",
  error: "Connection error",
};
