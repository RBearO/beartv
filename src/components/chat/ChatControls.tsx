"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  Square,
  Flag,
  MessageSquare,
  Settings,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DeviceDropdown from "@/components/chat/DeviceDropdown";
import type { MediaDeviceOption } from "@/hooks/useMediaDevices";
import { cn } from "@/lib/utils";

interface ChatControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isBusy?: boolean;
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
  selectedCameraId: string;
  selectedMicrophoneId: string;
  onSelectCamera: (deviceId: string) => void;
  onSelectMicrophone: (deviceId: string) => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onSkip: () => void;
  onStop: () => void;
  onReport: () => void;
  onToggleChat: () => void;
  onOpenSettings: () => void;
  showChat: boolean;
  controlPosition?: string;
}

export default function ChatControls({
  isVideoEnabled,
  isAudioEnabled,
  isBusy = false,
  cameras,
  microphones,
  selectedCameraId,
  selectedMicrophoneId,
  onSelectCamera,
  onSelectMicrophone,
  onToggleVideo,
  onToggleAudio,
  onSkip,
  onStop,
  onReport,
  onToggleChat,
  onOpenSettings,
  showChat,
  controlPosition = "bottom-centre",
}: ChatControlsProps) {
  const justify =
    controlPosition === "bottom-left"
      ? "justify-start"
      : controlPosition === "bottom-right"
        ? "justify-end"
        : "justify-center";

  return (
    <div
      className={cn(
        "flex items-center app-controls flex-wrap w-full",
        justify,
        controlPosition === "floating" &&
          "p-3 rounded-token border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--surface-background)_70%,transparent)] backdrop-blur-xl"
      )}
    >
      <div className="flex items-center gap-1">
        <Button
          variant={isAudioEnabled ? "secondary" : "danger"}
          size="md"
          onClick={onToggleAudio}
          disabled={isBusy}
          aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </Button>
        <DeviceDropdown
          label="Select microphone"
          devices={microphones}
          selectedId={selectedMicrophoneId}
          onSelect={onSelectMicrophone}
          disabled={isBusy}
          emptyLabel="No microphones found"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={isVideoEnabled ? "secondary" : "danger"}
          size="md"
          onClick={onToggleVideo}
          disabled={isBusy}
          aria-label={isVideoEnabled ? "Disable camera" : "Enable camera"}
          title={isVideoEnabled ? "Disable camera" : "Enable camera"}
        >
          {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </Button>
        <DeviceDropdown
          label="Select camera"
          devices={cameras}
          selectedId={selectedCameraId}
          onSelect={onSelectCamera}
          disabled={isBusy}
          emptyLabel="No cameras found"
        />
      </div>

      <Button
        variant="gold"
        size="lg"
        onClick={onSkip}
        disabled={isBusy}
        aria-label="Next partner"
      >
        <SkipForward size={20} />
        Next
      </Button>

      <Button
        variant="danger"
        size="lg"
        onClick={onStop}
        disabled={isBusy}
        aria-label="Stop chat session"
      >
        <Square size={18} fill="currentColor" />
        Stop
      </Button>

      <Button variant="secondary" size="md" onClick={onToggleChat} disabled={isBusy}>
        <MessageSquare size={18} />
        {showChat ? "Hide" : "Chat"}
      </Button>

      <Button variant="ghost" size="md" onClick={onReport} disabled={isBusy} aria-label="Report user">
        <Flag size={18} />
      </Button>

      <Button
        variant="ghost"
        size="md"
        onClick={onOpenSettings}
        aria-label="Open settings"
        title="Settings"
      >
        <Settings size={18} />
      </Button>
    </div>
  );
}
