"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSettings } from "@/contexts/SettingsContext";
import {
  usePresence,
  type MatchmakingStatus,
} from "@/contexts/PresenceContext";
import VideoPanel from "@/components/chat/VideoPanel";
import ChatControls from "@/components/chat/ChatControls";
import TextChat from "@/components/chat/TextChat";
import ReportModal from "@/components/chat/ReportModal";
import TermsModal from "@/components/chat/TermsModal";
import TurnstileWidget from "@/components/chat/TurnstileWidget";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { MessageSquare, Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatStep = "terms" | "captcha" | "idle" | "chatting";

export default function ChatInterface() {
  const { data: session } = useSession();
  const { settings, updateSettings, openSettings } = useSettings();
  const { setPresence, resetPresence } = usePresence();
  const [step, setStep] = useState<ChatStep>("terms");
  const [showChat, setShowChat] = useState(settings.chatPosition !== "hidden");
  const [showReport, setShowReport] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const stoppingRef = useRef(false);
  const prevMessageCount = useRef(0);

  const {
    stream,
    streamRevision,
    error: mediaError,
    deviceError,
    clearDeviceError,
    isVideoEnabled,
    isAudioEnabled,
    isLoading: mediaLoading,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    requestPermissions,
    switchCamera,
    switchMicrophone,
    toggleVideo,
    toggleAudio,
    stopStream,
    setOnTrackReplaced,
  } = useMediaDevices(settings.selectedCameraId, settings.selectedMicrophoneId);

  const socketOptions = useMemo(
    () =>
      session?.user?.id
        ? {
            userId: session.user.id,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
          }
        : null,
    [session]
  );

  const {
    isConnected,
    isWakingServer,
    onlineCount,
    peer,
    messages,
    isPartnerTyping,
    isSessionActive,
    sessionId,
    beginSession,
    endSession,
    joinQueue,
    skipMatch,
    stopMatch,
    sendMessage,
    sendTyping,
    sendSignal,
    onSignal,
    reportUser,
  } = useSocket(socketOptions);

  // Sync showChat when chatPosition setting changes
  useEffect(() => {
    if (settings.chatPosition === "hidden") {
      setShowChat(false);
    } else {
      setShowChat(true);
    }
  }, [settings.chatPosition]);

  // Unread badge while chat panel is closed
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const incoming = messages.slice(prevMessageCount.current);
      const fromPartner = incoming.some((m) => m.senderId !== session?.user?.id);
      if (fromPartner && !showChat) {
        setUnreadCount((n) => n + incoming.filter((m) => m.senderId !== session?.user?.id).length);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, showChat, session?.user?.id]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const matchmakingStatus: MatchmakingStatus = useMemo(() => {
    if (isWakingServer) return "waking";
    if (stoppingRef.current || isBusy) {
      if (!isSessionActive) return "idle";
      return "stopping";
    }
    if (!isSessionActive || step !== "chatting") return "idle";
    if (isSearching && !peer) return "searching";
    if (peer && isConnected) return "connected";
    if (peer || isConnected) return "connecting";
    return "idle";
  }, [isWakingServer, isBusy, isSessionActive, step, isSearching, peer, isConnected]);

  useEffect(() => {
    setPresence({
      onlineCount,
      status: matchmakingStatus,
      showOnlineCount: settings.showOnlineCount,
      showStatus: settings.showConnectionQuality,
    });
  }, [
    onlineCount,
    matchmakingStatus,
    settings.showOnlineCount,
    settings.showConnectionQuality,
    setPresence,
  ]);

  useEffect(() => {
    return () => resetPresence();
  }, [resetPresence]);

  const isInitiator =
    peer?.isInitiator ??
    Boolean(
      session?.user?.id &&
        peer?.userId &&
        session.user.id.localeCompare(peer.userId) < 0
    );

  const {
    remoteStream,
    connectionState: webrtcState,
    cleanup: cleanupWebRTC,
    replaceTrack,
  } = useWebRTC({
    onSignal: sendSignal,
    onSignalReceived: onSignal,
    localStream: stream,
    peerId: peer?.userId || null,
    isInitiator,
    enabled: isSessionActive,
    sessionId,
  });

  const mapConnectionState = (): "connected" | "connecting" | "disconnected" | "searching" | "error" => {
    if (!isSessionActive) return "disconnected";
    if (isSearching && !peer) return "searching";
    if (peer) {
      if (webrtcState === "connected") return "connected";
      if (
        webrtcState === "failed" ||
        webrtcState === "disconnected" ||
        webrtcState === "closed"
      ) {
        return "error";
      }
      return "connecting";
    }
    if (isConnected) return "connecting";
    return "disconnected";
  };


  useEffect(() => {
    setOnTrackReplaced(async (kind, track) => {
      await replaceTrack(kind, track);
    });
    return () => setOnTrackReplaced(null);
  }, [replaceTrack, setOnTrackReplaced]);

  useEffect(() => {
    if (selectedCameraId && selectedCameraId !== settings.selectedCameraId) {
      updateSettings({ selectedCameraId });
    }
  }, [selectedCameraId, settings.selectedCameraId, updateSettings]);

  useEffect(() => {
    if (selectedMicrophoneId && selectedMicrophoneId !== settings.selectedMicrophoneId) {
      updateSettings({ selectedMicrophoneId });
    }
  }, [selectedMicrophoneId, settings.selectedMicrophoneId, updateSettings]);

  const stopChatSession = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    setIsBusy(true);
    stopMatch();
    cleanupWebRTC();
    stopStream();
    endSession();
    setIsSearching(false);
    setShowReport(false);
    setUnreadCount(0);
    setStep("idle");
    setTimeout(() => {
      stoppingRef.current = false;
      setIsBusy(false);
    }, 300);
  }, [stopMatch, cleanupWebRTC, stopStream, endSession]);

  const disconnectCurrentPartner = useCallback(() => {
    cleanupWebRTC();
    if (isSessionActive) {
      skipMatch();
      setIsSearching(true);
    }
  }, [cleanupWebRTC, skipMatch, isSessionActive]);

  const handleStart = useCallback(async () => {
    if (isBusy || isSessionActive) return;
    setIsBusy(true);
    beginSession();
    setStep("chatting");
    const media = await requestPermissions(
      settings.selectedCameraId || undefined,
      settings.selectedMicrophoneId || undefined
    );
    if (!media) {
      endSession();
      setStep("idle");
      setIsSearching(false);
      setIsBusy(false);
      return;
    }
    setIsSearching(true);
    joinQueue();
    setIsBusy(false);
  }, [
    isBusy,
    isSessionActive,
    beginSession,
    requestPermissions,
    settings.selectedCameraId,
    settings.selectedMicrophoneId,
    joinQueue,
    endSession,
  ]);

  const handleNext = useCallback(() => {
    if (!isSessionActive || isBusy || stoppingRef.current) return;
    setIsBusy(true);
    disconnectCurrentPartner();
    setTimeout(() => setIsBusy(false), 300);
  }, [isSessionActive, isBusy, disconnectCurrentPartner]);

  const handleSelectCamera = useCallback(
    async (deviceId: string) => {
      await switchCamera(deviceId);
      updateSettings({ selectedCameraId: deviceId });
    },
    [switchCamera, updateSettings]
  );

  const handleSelectMicrophone = useCallback(
    async (deviceId: string) => {
      await switchMicrophone(deviceId);
      updateSettings({ selectedMicrophoneId: deviceId });
    },
    [switchMicrophone, updateSettings]
  );

  const handleReport = useCallback(
    async (reason: string, description: string) => {
      if (!peer || !isSessionActive) return;
      reportUser(peer.userId, reason, description);
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedId: peer.userId, reason, description }),
      });
      disconnectCurrentPartner();
    },
    [peer, isSessionActive, reportUser, disconnectCurrentPartner]
  );

  const layout = settings.videoLayout;
  const hideLocalPreview = layout === "local-hidden" && !!peer && isSessionActive;
  const isPip = layout === "picture-in-picture";
  const isPartnerFocused = layout === "partner-focused";
  const isSideBySide =
    layout === "side-by-side" ||
    (layout === "local-hidden" && !peer) ||
    (!isPip && !isPartnerFocused && layout !== "local-hidden");

  // Chat panel: visible whenever chatting session is active (not only when peer exists)
  const chatPanelOpen =
    step === "chatting" && isSessionActive && showChat;
  const chatDisabled = !peer;

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading session..." />
      </div>
    );
  }

  const partnerLabel = peer
    ? `${peer.name || "Stranger"}${
        settings.showPartnerCountry && peer.country ? ` · ${peer.country}` : ""
      }`
    : "Stranger";

  const showBottomChat =
    chatPanelOpen &&
    (settings.chatPosition === "bottom" || settings.chatPosition === "hidden");
  const controlsAboveChat = settings.controlPosition === "above-chat";

  const chatPanel = chatPanelOpen ? (
    <div
      className={cn(
        "z-20",
        settings.chatPosition === "right" &&
          "lg:w-80 lg:shrink-0 h-64 lg:h-auto lg:min-h-[420px]",
        settings.chatPosition === "left" &&
          "lg:w-80 lg:shrink-0 h-64 lg:h-auto lg:min-h-[420px] lg:order-first",
        showBottomChat && "w-full h-72",
        showBottomChat && !controlsAboveChat && "mt-4 mb-2",
        showBottomChat && controlsAboveChat && "mt-0"
      )}
    >
      <TextChat
        messages={messages}
        currentUserId={session.user.id}
        onSend={sendMessage}
        onTyping={sendTyping}
        isPartnerTyping={isPartnerTyping}
        partnerName={peer?.name}
        showTimestamps={settings.showChatTimestamps}
        disabled={chatDisabled}
        className="h-full"
      />
    </div>
  ) : null;

  const controlsBar =
    step === "chatting" && isSessionActive ? (
      <div
        className={cn(
          "w-full",
          showBottomChat && controlsAboveChat && "mt-5 mb-5",
          showBottomChat && !controlsAboveChat && "mt-6 mb-4",
          !showBottomChat && "mt-6 mb-4"
        )}
      >
        <ChatControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isBusy={isBusy}
          cameras={cameras}
          microphones={microphones}
          selectedCameraId={selectedCameraId}
          selectedMicrophoneId={selectedMicrophoneId}
          onSelectCamera={handleSelectCamera}
          onSelectMicrophone={handleSelectMicrophone}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onSkip={handleNext}
          onStop={stopChatSession}
          onReport={() => setShowReport(true)}
          onToggleChat={() => setShowChat((v) => !v)}
          onOpenSettings={() => openSettings("appearance")}
          showChat={showChat}
          controlPosition={settings.controlPosition}
        />
        {settings.showShortcutHints && (
          <p className="text-center text-xs text-[var(--text-muted)] mt-3">
            Tip: Next skips partners · Stop ends the session
          </p>
        )}
      </div>
    ) : null;

  return (
    <div className="max-w-6xl mx-auto app-page py-6">
      {settings.chatPosition === "hidden" && step === "chatting" && isSessionActive && (
        <div className="flex justify-end mb-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowChat((v) => !v)}
            aria-label={showChat ? "Hide chat" : "Open chat"}
          >
            <MessageSquare size={16} />
            Chat
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white px-1">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-4 mb-4",
          (settings.chatPosition === "right" || settings.chatPosition === "left") &&
            chatPanelOpen &&
            "lg:flex-row lg:items-stretch"
        )}
      >
        {settings.chatPosition === "left" && chatPanel}

        <div className="relative flex-1 min-w-0">
          {/* Side-by-side */}
          {isSideBySide && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--control-gap)]">
              <VideoPanel
                stream={stream}
                streamRevision={streamRevision}
                label="You"
                name={session.user.name ?? undefined}
                image={session.user.image ?? undefined}
                isLocal
                showLabel={settings.showLocalVideoLabel}
              />
              <VideoPanel
                stream={remoteStream}
                label={partnerLabel}
                name={peer?.name}
                image={peer?.image}
                connectionStatus={mapConnectionState()}
                isSearching={isSessionActive && isSearching && !peer}
                showSearchingAnimation={settings.showSearchingAnimations}
              />
            </div>
          )}

          {/* Picture-in-picture / partner-focused / local-hidden while connected */}
          {!isSideBySide && (
            <div className="relative">
              <VideoPanel
                stream={remoteStream}
                label={partnerLabel}
                name={peer?.name}
                image={peer?.image}
                connectionStatus={mapConnectionState()}
                isSearching={isSessionActive && isSearching && !peer}
                showSearchingAnimation={settings.showSearchingAnimations}
                sizeClassName={isPartnerFocused ? "max-w-4xl mx-auto w-full" : "w-full"}
              />

              {!hideLocalPreview && (
                <div
                  className={cn(
                    "local-video-shell z-10 shadow-2xl border border-white/15 rounded-token overflow-hidden",
                    isPip && "absolute bottom-4 right-4",
                    isPartnerFocused && "mx-auto mt-4"
                  )}
                >
                  <VideoPanel
                    stream={stream}
                    streamRevision={streamRevision}
                    label="You"
                    name={session.user.name ?? undefined}
                    image={session.user.image ?? undefined}
                    isLocal
                    showLabel={settings.showLocalVideoLabel}
                  />
                </div>
              )}

              {hideLocalPreview && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white/80">
                  <Camera size={14} className={isVideoEnabled ? "text-green-400" : "text-red-400"} />
                  {isVideoEnabled ? "Camera sharing" : "Camera off"}
                </div>
              )}
            </div>
          )}
        </div>

        {settings.chatPosition === "right" && chatPanel}
      </div>

      {/* Controls above bottom chat when requested */}
      {showBottomChat && controlsAboveChat && controlsBar}

      {showBottomChat && chatPanel}

      {/* Controls below chat / below video for other layouts */}
      {(!showBottomChat || !controlsAboveChat) && controlsBar}

      {deviceError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start justify-between gap-3">
          <p className="text-sm text-red-400">{deviceError}</p>
          <button
            type="button"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={clearDeviceError}
          >
            Dismiss
          </button>
        </div>
      )}

      {step === "idle" && (
        <div className="flex flex-col items-center gap-4 mb-4">
          {isWakingServer && (
            <p className="text-sm text-[var(--text-secondary)]" role="status">
              Waking server… This can take up to a minute on the free tier.
            </p>
          )}
          {mediaError && (
            <div className="w-full max-w-md p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{mediaError}</p>
            </div>
          )}
          <Button
            variant="gold"
            size="xl"
            onClick={handleStart}
            isLoading={mediaLoading || isBusy || isWakingServer}
            disabled={isWakingServer && !isConnected}
            className="min-w-[220px]"
          >
            <Video size={22} />
            {isWakingServer ? "Waking server…" : "Start Chatting"}
          </Button>
        </div>
      )}

      <TermsModal isOpen={step === "terms"} onAccept={() => setStep("captcha")} />

      <Modal isOpen={step === "captcha"} onClose={() => {}} title="Verify you're human">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Complete the verification below to start chatting.
        </p>
        <TurnstileWidget onVerify={() => setStep("idle")} />
      </Modal>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
      />
    </div>
  );
}
