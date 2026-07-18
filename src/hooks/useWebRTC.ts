"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { fetchIceServers } from "@/lib/utils";

interface UseWebRTCOptions {
  onSignal: (signal: {
    type: "offer" | "answer" | "ice-candidate";
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
    targetId: string;
  }) => void;
  onSignalReceived: (
    handler: (signal: {
      type: "offer" | "answer" | "ice-candidate";
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
      fromId: string;
    }) => void
  ) => () => void;
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
  const sessionIdRef = useRef(sessionId);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

  sessionIdRef.current = sessionId;

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
    if (!enabled || !peerId || !localStream) {
      cleanup();
      return;
    }

    const activeSession = sessionId;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pc: RTCPeerConnection | null = null;
    const pendingCandidates: RTCIceCandidateInit[] = [];
    let remoteDescriptionSet = false;

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

    (async () => {
      const iceServers = await fetchIceServers();
      if (cancelled || sessionIdRef.current !== activeSession) return;

      pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      localStream.getTracks().forEach((track) => {
        pc!.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        if (sessionIdRef.current !== activeSession) return;
        const [stream] = event.streams;
        if (stream) {
          setRemoteStream(stream);
        } else if (event.track) {
          setRemoteStream(new MediaStream([event.track]));
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

      const handleSignal = async (signal: {
        type: "offer" | "answer" | "ice-candidate";
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
        fromId: string;
      }) => {
        if (!pc || sessionIdRef.current !== activeSession || signal.fromId !== peerId) {
          return;
        }

        try {
          if (signal.type === "offer") {
            if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
              // Ignore unexpected offers once negotiation advanced
            }
            // If we also created an offer (glare), the non-initiator path should win;
            // server assigns a single initiator, so accept remote offer when we are not initiator.
            if (pc.signalingState === "have-local-offer" && !isInitiator) {
              await pc.setLocalDescription({ type: "rollback" });
            }
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
            );
            remoteDescriptionSet = true;
            await flushCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            onSignal({ type: "answer", payload: answer, targetId: peerId });
          } else if (signal.type === "answer") {
            if (pc.signalingState !== "have-local-offer") return;
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
            );
            remoteDescriptionSet = true;
            await flushCandidates(pc);
          } else if (signal.type === "ice-candidate") {
            const candidate = signal.payload as RTCIceCandidateInit;
            if (!remoteDescriptionSet || !pc.remoteDescription) {
              pendingCandidates.push(candidate);
              return;
            }
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error("[WebRTC] Signal error:", err);
        }
      };

      unsubscribe = onSignalReceived(handleSignal);

      if (isInitiator) {
        try {
          if (sessionIdRef.current !== activeSession) return;
          const offer = await pc.createOffer();
          if (sessionIdRef.current !== activeSession) return;
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
    // Intentionally omit localStream from deps so device switches use replaceTrack
    // instead of recreating the peer connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, isInitiator, enabled, sessionId]);

  const replaceTrack = useCallback(async (kind: "audio" | "video", track: MediaStreamTrack) => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === kind);
    if (sender) {
      await sender.replaceTrack(track);
      return;
    }
    pc.addTrack(track);
  }, []);

  return { remoteStream, connectionState, cleanup, replaceTrack };
}
