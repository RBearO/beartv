"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, PeerInfo, MatchPreferences } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

async function wakeSocketServer(baseUrl: string, attempts = 6): Promise<boolean> {
  const healthUrl = `${baseUrl.replace(/\/$/, "")}/health`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(healthUrl, { cache: "no-store", mode: "cors" });
      if (res.ok) return true;
    } catch {
      // cold start / sleeping free tier
    }
    await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** i, 8000)));
  }
  return false;
}

interface UseSocketOptions {
  userId: string;
  name?: string;
  image?: string;
  country?: string;
  gender?: string;
  interests?: string[];
}

export function useSocket(options: UseSocketOptions | null) {
  const socketRef = useRef<Socket | null>(null);
  const sessionActiveRef = useRef(false);
  const sessionIdRef = useRef(0);
  const skipInProgressRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [peer, setPeer] = useState<PeerInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [matchEnded, setMatchEnded] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(0);

  const bumpSession = useCallback(() => {
    sessionIdRef.current += 1;
    setSessionId(sessionIdRef.current);
    return sessionIdRef.current;
  }, []);

  const clearPartnerState = useCallback(() => {
    setPeer(null);
    setMessages([]);
    setIsPartnerTyping(false);
    setMatchEnded(null);
  }, []);

  const beginSession = useCallback(() => {
    sessionActiveRef.current = true;
    skipInProgressRef.current = false;
    setIsSessionActive(true);
    return bumpSession();
  }, [bumpSession]);

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    skipInProgressRef.current = false;
    setIsSessionActive(false);
    bumpSession();
    clearPartnerState();
  }, [bumpSession, clearPartnerState]);

  useEffect(() => {
    if (!options) return;
    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      setIsWakingServer(true);
      await wakeSocketServer(SOCKET_URL);
      if (cancelled) return;
      setIsWakingServer(false);

      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setIsWakingServer(false);
        socket?.emit("authenticate", options);
      });

      socket.on("disconnect", () => setIsConnected(false));
      socket.on("reconnect_attempt", () => setIsWakingServer(true));
      socket.on("reconnect", () => {
        setIsWakingServer(false);
        socket?.emit("authenticate", options);
      });

      socket.on("online:count", setOnlineCount);

      socket.on("queue:status", (status) => {
        if (!sessionActiveRef.current) return;
        setQueuePosition(status.position);
      });

      socket.on("match:found", (peerInfo: PeerInfo) => {
        if (!sessionActiveRef.current) return;
        skipInProgressRef.current = false;
        setPeer(peerInfo);
        setMatchEnded(null);
        setMessages([]);
        setIsPartnerTyping(false);
      });

      socket.on("match:ended", (reason: string) => {
        if (!sessionActiveRef.current) return;
        skipInProgressRef.current = false;
        clearPartnerState();
        setMatchEnded(reason);
      });

      socket.on("chat:message", (msg: ChatMessage) => {
        if (!sessionActiveRef.current) return;
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("chat:typing", ({ isTyping }) => {
        if (!sessionActiveRef.current) return;
        setIsPartnerTyping(isTyping);
      });

      socket.on("error", (msg: string) => console.error("[Socket]", msg));
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [options?.userId, options, clearPartnerState]);

  const joinQueue = useCallback((prefs?: MatchPreferences) => {
    if (!sessionActiveRef.current) return;
    socketRef.current?.emit("queue:join", prefs);
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit("queue:leave");
  }, []);

  const skipMatch = useCallback(() => {
    if (!sessionActiveRef.current || skipInProgressRef.current) return;
    skipInProgressRef.current = true;
    clearPartnerState();
    socketRef.current?.emit("match:skip");
  }, [clearPartnerState]);

  const stopMatch = useCallback(() => {
    sessionActiveRef.current = false;
    skipInProgressRef.current = false;
    setIsSessionActive(false);
    bumpSession();
    clearPartnerState();
    socketRef.current?.emit("match:stop");
  }, [bumpSession, clearPartnerState]);

  const sendMessage = useCallback((content: string) => {
    if (!sessionActiveRef.current) return;
    socketRef.current?.emit("chat:message", content);
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!sessionActiveRef.current) return;
    socketRef.current?.emit("chat:typing", isTyping);
  }, []);

  const sendSignal = useCallback(
    (signal: {
      type: "offer" | "answer" | "ice-candidate";
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
      targetId: string;
    }) => {
      if (!sessionActiveRef.current) return;
      socketRef.current?.emit("webrtc:signal", signal);
    },
    []
  );

  const onSignal = useCallback(
    (handler: (signal: {
      type: "offer" | "answer" | "ice-candidate";
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
      fromId: string;
    }) => void) => {
      const wrapped = (signal: {
        type: "offer" | "answer" | "ice-candidate";
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
        fromId: string;
      }) => {
        if (!sessionActiveRef.current) return;
        handler(signal);
      };
      socketRef.current?.on("webrtc:signal", wrapped);
      return () => {
        socketRef.current?.off("webrtc:signal", wrapped);
      };
    },
    []
  );

  const reportUser = useCallback(
    (reportedId: string, reason: string, description?: string) => {
      if (!sessionActiveRef.current) return;
      socketRef.current?.emit("user:report", { reportedId, reason, description });
    },
    []
  );

  return {
    isConnected,
    isWakingServer,
    onlineCount,
    queuePosition,
    peer,
    messages,
    isPartnerTyping,
    matchEnded,
    isSessionActive,
    sessionId,
    beginSession,
    endSession,
    joinQueue,
    leaveQueue,
    skipMatch,
    stopMatch,
    clearPartnerState,
    sendMessage,
    sendTyping,
    sendSignal,
    onSignal,
    reportUser,
    socket: socketRef.current,
  };
}
