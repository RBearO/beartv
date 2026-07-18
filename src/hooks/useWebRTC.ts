"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { fetchIceServers } from "@/lib/utils";

type SignalType = "offer" | "answer" | "ice-candidate";

interface IncomingSignal {
  type: SignalType;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  fromId: string;
}

interface UseWebRTCOptions {
  onSignal: (signal: {
    type: SignalType;
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
    targetId: string;
  }) => void;
  onSignalReceived: (handler: (signal: IncomingSignal) => void) => () => void;
  localStream: MediaStream | null;
  peerId: string | null;
  isInitiator: boolean;
  enabled: boolean;
  sessionId: number;
}

export function useWebRTC({
  onSignal,
  onSignalReceived,
  localStream,
  peerId,
  isInitiator,
  enabled,
  sessionId,
}: UseWebRTCOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef(localStream);
  const sessionIdRef = useRef(sessionId);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

  sessionIdRef.current = sessionId;
  localStreamRef.current = localStream;

  // Restart PC when media first becomes available (device switches use replaceTrack).
  const hasLocalMedia = Boolean(localStream);

  const cleanup = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setConnectionState("new");
  }, []);

  useEffect(() => {
    if (!enabled || !peerId) {
      cleanup();
      return;
    }

    const activeSession = sessionId;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pc: RTCPeerConnection | null = null;
    const pendingCandidates: RTCIceCandidateInit[] = [];
    const earlySignals: IncomingSignal[] = [];
    let remoteDescriptionSet = false;
    let pcReady = false;

    const flushCandidates = async (connection: RTCPeerConnection) => {
      while (pendingCandidates.length > 0) {
        const candidate = pendingCandidates.shift();
        if (!candidate) continue;
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[WebRTC] Delayed ICE error:", err);
        }
      }
    };

    const attachLocalMedia = (connection: RTCPeerConnection) => {
      const stream = localStreamRef.current;
      if (stream && stream.getTracks().length > 0) {
        stream.getTracks().forEach((track) => {
          connection.addTrack(track, stream);
        });
        return;
      }
      // Allow receiving even if this peer has no camera/mic yet.
      connection.addTransceiver("audio", { direction: "recvonly" });
      connection.addTransceiver("video", { direction: "recvonly" });
    };

    const processSignal = async (
      connection: RTCPeerConnection,
      signal: IncomingSignal
    ) => {
      if (sessionIdRef.current !== activeSession || signal.fromId !== peerId) {
        return;
      }

      try {
        if (signal.type === "offer") {
          if (connection.signalingState === "have-local-offer" && !isInitiator) {
            await connection.setLocalDescription({ type: "rollback" });
          }
          await connection.setRemoteDescription(
            new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
          );
          remoteDescriptionSet = true;
          await flushCandidates(connection);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          onSignal({ type: "answer", payload: answer, targetId: peerId });
        } else if (signal.type === "answer") {
          if (connection.signalingState !== "have-local-offer") return;
          await connection.setRemoteDescription(
            new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
          );
          remoteDescriptionSet = true;
          await flushCandidates(connection);
        } else if (signal.type === "ice-candidate") {
          const candidate = signal.payload as RTCIceCandidateInit;
          if (!remoteDescriptionSet || !connection.remoteDescription) {
            pendingCandidates.push(candidate);
            return;
          }
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("[WebRTC] Signal error:", err);
      }
    };

    const handleSignal = async (signal: IncomingSignal) => {
      if (!pc || !pcReady) {
        earlySignals.push(signal);
        return;
      }
      await processSignal(pc, signal);
    };

    (async () => {
      const iceServers = await fetchIceServers();
      if (cancelled || sessionIdRef.current !== activeSession) return;

      pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      attachLocalMedia(pc);

      pc.ontrack = (event) => {
        if (sessionIdRef.current !== activeSession) return;
        const [stream] = event.streams;
        if (stream) {
          setRemoteStream(stream);
        } else if (event.track) {
          setRemoteStream((prev) => {
            const next = prev
              ? new MediaStream(prev.getTracks())
              : new MediaStream();
            if (!next.getTracks().some((t) => t.id === event.track.id)) {
              next.addTrack(event.track);
            }
            return next;
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (sessionIdRef.current !== activeSession) return;
        if (event.candidate && peerId) {
          onSignal({
            type: "ice-candidate",
            payload: event.candidate.toJSON(),
            targetId: peerId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (sessionIdRef.current !== activeSession || !pc) return;
        setConnectionState(pc.connectionState);
      };

      unsubscribe = onSignalReceived(handleSignal);
      pcReady = true;

      while (earlySignals.length > 0) {
        const signal = earlySignals.shift();
        if (signal) await processSignal(pc, signal);
      }

      if (cancelled || sessionIdRef.current !== activeSession) return;

      if (isInitiator && pc.signalingState === "stable") {
        try {
          const offer = await pc.createOffer();
          if (cancelled || sessionIdRef.current !== activeSession) return;
          await pc.setLocalDescription(offer);
          onSignal({ type: "offer", payload: offer, targetId: peerId });
        } catch (err) {
          console.error("[WebRTC] Offer error:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (pcRef.current === pc || pc) {
        const active = pcRef.current ?? pc;
        if (active) {
          active.ontrack = null;
          active.onicecandidate = null;
          active.onconnectionstatechange = null;
          active.close();
        }
        pcRef.current = null;
      }
      setRemoteStream(null);
      setConnectionState("new");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, isInitiator, enabled, sessionId, hasLocalMedia]);

  const replaceTrack = useCallback(
    async (kind: "audio" | "video", track: MediaStreamTrack) => {
      const pc = pcRef.current;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender) {
        await sender.replaceTrack(track);
        return;
      }
      const stream = localStreamRef.current;
      if (stream) {
        pc.addTrack(track, stream);
      } else {
        pc.addTrack(track);
      }
    },
    []
  );

  return { remoteStream, connectionState, cleanup, replaceTrack };
}
