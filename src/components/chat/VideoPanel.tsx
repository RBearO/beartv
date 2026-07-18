"use client";

import { useEffect, useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import ConnectionIndicator from "@/components/ui/ConnectionIndicator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

interface VideoPanelProps {
  stream: MediaStream | null;
  streamRevision?: number;
  label: string;
  name?: string;
  image?: string;
  isLocal?: boolean;
  showLabel?: boolean;
  sizeClassName?: string;
  connectionStatus?: "connected" | "connecting" | "disconnected" | "searching" | "error";
  isSearching?: boolean;
  showSearchingAnimation?: boolean;
}

export default function VideoPanel({
  stream,
  streamRevision = 0,
  label,
  name,
  image,
  isLocal = false,
  showLabel = true,
  sizeClassName,
  connectionStatus = "disconnected",
  isSearching = false,
  showSearchingAnimation = true,
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = !!stream?.getVideoTracks().some((t) => t.readyState === "live" && t.enabled);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && hasVideo) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      void video.play().catch(() => {});
    } else if (!hasVideo) {
      if (stream && video.srcObject !== stream) {
        video.srcObject = stream;
      }
    } else {
      video.srcObject = null;
    }
  }, [stream, hasVideo, streamRevision]);

  return (
    <div
      className={cn(
        "video-panel relative aspect-square overflow-hidden rounded-token",
        isLocal ? "local-video-panel" : "remote-video-panel",
        sizeClassName
      )}
    >
      {stream && stream.getVideoTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "w-full h-full object-cover",
            isLocal && "scale-x-[-1]",
            !hasVideo && "opacity-50"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--video-panel-background)]">
          {isSearching ? (
            showSearchingAnimation ? (
              <LoadingSpinner size="lg" text="Finding someone..." matchmaking />
            ) : (
              <div className="flex flex-col items-center gap-3" role="status">
                <div
                  className="matchmaking-spinner matchmaking-loader--static"
                  aria-hidden="true"
                />
                <p className="text-sm matchmaking-status-text">Finding someone...</p>
              </div>
            )
          ) : (
            <>
              <Avatar
                name={name}
                src={image}
                size="xl"
                className="!bg-[#2a2a2a] !text-[var(--video-panel-text)] !border-[var(--accent)]"
              />
              <p className="text-sm video-panel-muted">
                {stream && !hasVideo ? "Camera off" : label}
              </p>
            </>
          )}
        </div>
      )}

      {showLabel && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="video-panel-label px-2 py-1 rounded-lg text-xs">
            {label}
          </span>
          {!isLocal && connectionStatus && (
            <ConnectionIndicator status={connectionStatus} />
          )}
        </div>
      )}
    </div>
  );
}
