"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import {
  MATCHMAKING_STATUS_LABEL,
  usePresence,
} from "@/contexts/PresenceContext";
import {
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  Users,
  CircleStop,
  Search,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function StatusIcon({ status }: { status: string }) {
  const className = "shrink-0 text-current";
  switch (status) {
    case "searching":
      return <Search size={12} className={className} aria-hidden="true" />;
    case "connecting":
      return <Loader2 size={12} className={className} aria-hidden="true" />;
    case "connected":
      return <Wifi size={12} className={className} aria-hidden="true" />;
    case "stopping":
      return <CircleStop size={12} className={className} aria-hidden="true" />;
    case "error":
      return <AlertCircle size={12} className={className} aria-hidden="true" />;
    default:
      return <WifiOff size={12} className={className} aria-hidden="true" />;
  }
}

function PresenceBadges({ compact = false }: { compact?: boolean }) {
  const { onlineCount, status, showOnlineCount, showStatus } = usePresence();
  const { settings } = useSettings();

  const showOnline = showOnlineCount && settings.showOnlineCount;
  const showMatchStatus = showStatus && settings.showConnectionQuality;

  if (!showOnline && !showMatchStatus) return null;

  return (
    <div className="header-presence-section" aria-label="Presence">
      {showOnline && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 whitespace-nowrap",
            "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] border-[var(--accent)] text-[var(--text-primary)]"
          )}
          aria-label={`${onlineCount} users online`}
        >
          <Users size={12} className="text-[var(--accent)] shrink-0" aria-hidden="true" />
          {compact ? (
            <span className="tabular-nums">{onlineCount}</span>
          ) : (
            <span className="tabular-nums">{onlineCount} online</span>
          )}
        </span>
      )}
      {showMatchStatus && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 whitespace-nowrap",
            "bg-[var(--surface-background)] border-[var(--border-default)] text-[var(--text-primary)]"
          )}
          role="status"
          aria-label={`Matchmaking status: ${MATCHMAKING_STATUS_LABEL[status]}`}
        >
          <StatusIcon status={status} />
          <span>{MATCHMAKING_STATUS_LABEL[status]}</span>
        </span>
      )}
    </div>
  );
}

const navLinkClass =
  "navigation-label text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors";

export default function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { openSettings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--border-default)] backdrop-blur-xl bg-[color-mix(in_srgb,var(--page-background)_88%,transparent)]">
      <div className="max-w-7xl mx-auto app-page">
        <div className="main-header-inner app-header">
          <div className="header-left">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-bear-brown flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                🐻
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">
                Bear<span className="text-[var(--accent)]">TV</span>
              </span>
            </Link>

            <a
              href="https://discord.gg/3p9RtK7sDH"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the BearTV Discord server"
              className={cn(
                "inline-flex items-center gap-2 h-9 px-2.5 sm:px-3 rounded-xl border transition-all shrink-0",
                "border-[var(--border-default)] bg-[var(--surface-background)]",
                "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                "hover:bg-[#5865F2]/15 hover:border-[#5865F2]/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                "active:scale-[0.98]"
              )}
            >
              <DiscordIcon size={18} />
              <span className="hidden sm:inline text-sm font-medium">Join Discord</span>
            </a>

            <div className="hidden md:block shrink-0">
              <PresenceBadges />
            </div>
          </div>

          <nav className="header-navigation hidden md:flex" aria-label="Primary">
            <Link href="/#features" className={cn(navLinkClass, "shrink-0")}>
              Features
            </Link>
            <Link href="/#faq" className={cn(navLinkClass, "shrink-0")}>
              FAQ
            </Link>
            {session ? (
              <>
                <Link href="/chat" className={cn(navLinkClass, "shrink-0")}>
                  Chat
                </Link>
                <Link href="/profile" className={cn(navLinkClass, "shrink-0")}>
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => openSettings("appearance")}
                  className={cn(navLinkClass, "shrink-0")}
                >
                  Settings
                </button>
                {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    className="text-sm text-[var(--accent)] hover:opacity-80 transition-colors shrink-0"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => openSettings("appearance")}
                className={cn(navLinkClass, "shrink-0")}
              >
                Settings
              </button>
            )}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              onClick={() => openSettings("appearance")}
              className="p-2 rounded-lg hover:bg-[var(--surface-background)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Open settings"
            >
              <Settings size={18} className="text-current" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--surface-background)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-current" />
              ) : (
                <Moon size={18} className="text-current" />
              )}
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <Avatar src={session.user.image} name={session.user.name} size="sm" />
                <button
                  onClick={() => signOut()}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button size="sm">Sign In</Button>
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-background)] text-[var(--text-secondary)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile-only presence row */}
        <div className="md:hidden pb-2 flex items-center gap-2">
          <PresenceBadges compact />
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border-default)] space-y-3">
            <a
              href="https://discord.gg/3p9RtK7sDH"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the BearTV Discord server"
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setMobileOpen(false)}
            >
              <DiscordIcon size={16} />
              Join Discord
            </a>
            <Link
              href="/#features"
              className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#faq"
              className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setMobileOpen(false)}
            >
              FAQ
            </Link>
            <button
              type="button"
              className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => {
                openSettings("appearance");
                setMobileOpen(false);
              }}
            >
              Settings
            </button>
            {session ? (
              <>
                <Link
                  href="/chat"
                  className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  href="/profile"
                  className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    className="block text-sm text-[var(--accent)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
