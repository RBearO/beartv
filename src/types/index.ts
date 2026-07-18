export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "searching"
  | "matched"
  | "connected"
  | "disconnected"
  | "error";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

export interface MatchPreferences {
  country?: string;
  gender?: string;
  interests?: string[];
}

export interface QueueUser {
  socketId: string;
  userId: string;
  name?: string;
  image?: string;
  country?: string;
  gender?: string;
  interests: string[];
  joinedAt: number;
}

export interface PeerInfo {
  userId: string;
  name?: string;
  image?: string;
  country?: string;
  /** True when this client should create the WebRTC offer */
  isInitiator?: boolean;
}

export interface WebRTCSignal {
  type: "offer" | "answer" | "ice-candidate";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  targetId: string;
}

export interface ClientToServerEvents {
  "queue:join": (prefs?: MatchPreferences) => void;
  "queue:leave": () => void;
  "match:skip": () => void;
  "match:stop": () => void;
  "webrtc:signal": (signal: WebRTCSignal) => void;
  "chat:message": (content: string) => void;
  "chat:typing": (isTyping: boolean) => void;
  "user:report": (data: { reportedId: string; reason: string; description?: string }) => void;
}

export interface ServerToClientEvents {
  "queue:status": (status: { position: number; online: number }) => void;
  "match:found": (peer: PeerInfo) => void;
  "match:ended": (reason: string) => void;
  "webrtc:signal": (signal: WebRTCSignal & { fromId: string }) => void;
  "chat:message": (message: ChatMessage) => void;
  "chat:typing": (data: { userId: string; isTyping: boolean }) => void;
  "online:count": (count: number) => void;
  error: (message: string) => void;
}

export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  pendingReports: number;
  activeBans: number;
  matchesToday: number;
}

export interface ReportWithUsers {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  reporter: { id: string; name: string | null; email: string };
  reported: { id: string; name: string | null; email: string };
}
