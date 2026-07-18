"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

function parseMediaError(err: unknown): string {
  if (!(err instanceof DOMException)) {
    return "Failed to access media devices. Please try again.";
  }

  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Access denied. Allow camera/microphone in your browser and Windows privacy settings.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone found. Plug in a device and try again.";
    case "NotReadableError":
    case "TrackStartError":
      return "Device is busy. Close Zoom, Teams, OBS, or the Camera app, then try again.";
    case "OverconstrainedError":
      return "Selected device is unavailable. Pick another from the list.";
    case "AbortError":
      return "Device access was interrupted. Try again.";
    default:
      return err.message || "Could not switch media device.";
  }
}

async function listDevices(kind: MediaDeviceKind, fallbackPrefix: string): Promise<MediaDeviceOption[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const filtered = devices.filter((d) => d.kind === kind);
  if (filtered.length === 0) return [];
  return filtered.map((device, index) => ({
    deviceId: device.deviceId,
    label: device.label || `${fallbackPrefix} ${index + 1}`,
  }));
}

export function useMediaDevices(initialCameraId = "", initialMicId = "") {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamRevision, setStreamRevision] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState(initialCameraId);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(initialMicId);
  const videoEnabledRef = useRef(true);
  const audioEnabledRef = useRef(true);
  const onTrackReplacedRef = useRef<
    ((kind: "audio" | "video", track: MediaStreamTrack) => Promise<void> | void) | null
  >(null);

  const setStreamSafe = useCallback((next: MediaStream | null) => {
    streamRef.current = next;
    setStream(next);
  }, []);

  const stopStream = useCallback((current?: MediaStream | null) => {
    const target = current ?? streamRef.current;
    target?.getTracks().forEach((track) => track.stop());
    if (!current) setStreamSafe(null);
  }, [setStreamSafe]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return { cameras: [], microphones: [] };
    const [cams, mics] = await Promise.all([
      listDevices("videoinput", "Camera"),
      listDevices("audioinput", "Microphone"),
    ]);
    setCameras(cams);
    setMicrophones(mics);
    setSelectedCameraId((prev) => {
      if (prev && cams.some((c) => c.deviceId === prev)) return prev;
      return cams[0]?.deviceId ?? "";
    });
    setSelectedMicrophoneId((prev) => {
      if (prev && mics.some((m) => m.deviceId === prev)) return prev;
      return mics[0]?.deviceId ?? "";
    });
    return { cameras: cams, microphones: mics };
  }, []);

  const requestPermissions = useCallback(
    async (preferredCameraId?: string, preferredMicId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Your browser doesn't support camera access. Use Chrome or Edge.");
        return null;
      }

      setIsLoading(true);
      setError(null);
      stopStream();

      try {
        await refreshDevices();
        const cameraId = preferredCameraId || selectedCameraId || undefined;
        const micId = preferredMicId || selectedMicrophoneId || undefined;

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: { ideal: cameraId } } : true,
          audio: micId
            ? {
                deviceId: { ideal: micId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        const videoTrack = mediaStream.getVideoTracks()[0] ?? null;
        const audioTrack = mediaStream.getAudioTracks()[0] ?? null;

        if (videoTrack?.getSettings().deviceId) {
          setSelectedCameraId(videoTrack.getSettings().deviceId || "");
        }
        if (audioTrack?.getSettings().deviceId) {
          setSelectedMicrophoneId(audioTrack.getSettings().deviceId || "");
        }

        videoEnabledRef.current = true;
        audioEnabledRef.current = !!audioTrack;
        setHasVideo(!!videoTrack);
        setIsVideoEnabled(!!videoTrack);
        setIsAudioEnabled(!!audioTrack);
        setStreamSafe(mediaStream);
        await refreshDevices();
        return mediaStream;
      } catch (err) {
        setError(parseMediaError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDevices, selectedCameraId, selectedMicrophoneId, setStreamSafe, stopStream]
  );

  const replaceLocalTrack = useCallback(
    async (kind: "audio" | "video", newTrack: MediaStreamTrack) => {
      const current = streamRef.current;
      if (!current) {
        const next = new MediaStream([newTrack]);
        setStreamSafe(next);
        return;
      }

      const oldTracks =
        kind === "video" ? current.getVideoTracks() : current.getAudioTracks();

      await onTrackReplacedRef.current?.(kind, newTrack);

      oldTracks.forEach((track) => {
        current.removeTrack(track);
        track.stop();
      });
      current.addTrack(newTrack);
      // Keep the same MediaStream identity so WebRTC peer connection is not recreated.
      setStreamRevision((n) => n + 1);
    },
    [setStreamSafe]
  );

  const switchCamera = useCallback(
    async (deviceId: string) => {
      if (!deviceId) return null;
      setDeviceError(null);
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });
        const track = media.getVideoTracks()[0];
        if (!track) throw new Error("No video track");
        track.enabled = videoEnabledRef.current;
        await replaceLocalTrack("video", track);
        setSelectedCameraId(deviceId);
        setHasVideo(true);
        setIsVideoEnabled(track.enabled);
        return track;
      } catch (err) {
        setDeviceError(parseMediaError(err));
        return null;
      }
    },
    [replaceLocalTrack]
  );

  const switchMicrophone = useCallback(
    async (deviceId: string) => {
      if (!deviceId) return null;
      setDeviceError(null);
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        const track = media.getAudioTracks()[0];
        if (!track) throw new Error("No audio track");
        track.enabled = audioEnabledRef.current;
        await replaceLocalTrack("audio", track);
        setSelectedMicrophoneId(deviceId);
        setIsAudioEnabled(track.enabled);
        return track;
      } catch (err) {
        setDeviceError(parseMediaError(err));
        return null;
      }
    },
    [replaceLocalTrack]
  );

  const toggleVideo = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    videoEnabledRef.current = videoTrack.enabled;
    setIsVideoEnabled(videoTrack.enabled);
  }, []);

  const toggleAudio = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    audioEnabledRef.current = audioTrack.enabled;
    setIsAudioEnabled(audioTrack.enabled);
  }, []);

  const setOnTrackReplaced = useCallback(
    (handler: ((kind: "audio" | "video", track: MediaStreamTrack) => Promise<void> | void) | null) => {
      onTrackReplacedRef.current = handler;
    },
    []
  );

  useEffect(() => {
    refreshDevices().catch(() => {});
    const handler = () => {
      refreshDevices().catch(() => {});
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", handler);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handler);
    };
  }, [refreshDevices]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    stream,
    streamRevision,
    error,
    deviceError,
    clearDeviceError: () => setDeviceError(null),
    isVideoEnabled,
    isAudioEnabled,
    isLoading,
    hasVideo,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    setSelectedCameraId,
    setSelectedMicrophoneId,
    refreshDevices,
    requestPermissions,
    switchCamera,
    switchMicrophone,
    toggleVideo,
    toggleAudio,
    stopStream,
    setOnTrackReplaced,
  };
}
