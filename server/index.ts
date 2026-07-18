import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { getRedis, QUEUE_KEY, ONLINE_KEY, SOCKET_USER_PREFIX } from "./redis";
import { findBestMatch } from "./matchmaking";
import type { QueueUser, MatchPreferences, ChatMessage } from "../src/types/index";

if (process.env.NODE_ENV === "production") {
  const hasRedis = Boolean(process.env.REDIS_URL?.trim());
  const allowMemory =
    process.env.ALLOW_INMEMORY_REDIS === "true" ||
    process.env.ALLOW_INMEMORY_REDIS === "1";
  if (!hasRedis && !allowMemory) {
    throw new Error(
      "[BearTV Socket] REDIS_URL is required in production (or set ALLOW_INMEMORY_REDIS=true for single-instance free tier)."
    );
  }
}

const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || "3001", 10);

function getAllowedOrigins(): string[] {
  const fromList = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const authUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (authUrl) fromList.push(authUrl);
  if (fromList.length === 0) fromList.push("http://localhost:3000");
  return [...new Set(fromList)];
}

const ALLOWED_ORIGINS = getAllowedOrigins();

interface SocketData {
  userId: string;
  name?: string;
  image?: string;
  country?: string;
  gender?: string;
  interests: string[];
  partnerId?: string;
  partnerSocketId?: string;
  sessionStopped?: boolean;
}

const eventHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitSocket(socketId: string, max = 40, windowMs = 10_000): boolean {
  const now = Date.now();
  const entry = eventHits.get(socketId);
  if (!entry || now > entry.resetAt) {
    eventHits.set(socketId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "beartv-socket", ts: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

const activeMatches = new Map<string, string>();
const socketData = new Map<string, SocketData>();

async function getOnlineCount(): Promise<number> {
  const redis = getRedis();
  return redis.scard(ONLINE_KEY);
}

async function broadcastOnlineCount() {
  const count = await getOnlineCount();
  io.emit("online:count", count);
}

async function removeUserFromQueue(userId: string) {
  const redis = getRedis();
  const queue = await redis.lrange(QUEUE_KEY, 0, -1);
  for (const item of queue) {
    try {
      const user: QueueUser = JSON.parse(item);
      if (user.userId === userId || user.socketId === userId) {
        await redis.lrem(QUEUE_KEY, 1, item);
      }
    } catch {
      await redis.lrem(QUEUE_KEY, 1, item);
    }
  }
}

async function addToQueue(socket: Socket, data: SocketData, prefs?: MatchPreferences) {
  // Prevent duplicate queue entries for the same user
  await removeUserFromQueue(data.userId);
  await removeFromQueue(socket.id);

  const redis = getRedis();
  const queueUser: QueueUser = {
    socketId: socket.id,
    userId: data.userId,
    name: data.name,
    image: data.image,
    country: data.country,
    gender: data.gender,
    interests: data.interests,
    joinedAt: Date.now(),
  };

  await redis.rpush(QUEUE_KEY, JSON.stringify(queueUser));

  const queueLength = await redis.llen(QUEUE_KEY);
  socket.emit("queue:status", { position: queueLength, online: await getOnlineCount() });

  await tryMatch(socket, data, prefs);
}

async function removeFromQueue(socketId: string) {
  const redis = getRedis();
  const queue = await redis.lrange(QUEUE_KEY, 0, -1);

  for (const item of queue) {
    try {
      const user: QueueUser = JSON.parse(item);
      if (user.socketId === socketId) {
        await redis.lrem(QUEUE_KEY, 1, item);
      }
    } catch {
      await redis.lrem(QUEUE_KEY, 1, item);
    }
  }
}

async function tryMatch(socket: Socket, data: SocketData, prefs?: MatchPreferences) {
  const redis = getRedis();
  const queue = await redis.lrange(QUEUE_KEY, 0, -1);
  const candidates: QueueUser[] = [];

  for (const item of queue) {
    try {
      const user: QueueUser = JSON.parse(item);
      if (user.socketId !== socket.id && user.userId !== data.userId) {
        candidates.push(user);
      }
    } catch {
      // skip corrupt entries
    }
  }

  const match = findBestMatch(
    {
      socketId: socket.id,
      userId: data.userId,
      name: data.name,
      image: data.image,
      country: data.country,
      gender: data.gender,
      interests: data.interests,
      joinedAt: Date.now(),
    },
    candidates,
    prefs
  );

  if (!match) return;

  await removeFromQueue(socket.id);
  await removeFromQueue(match.socketId);

  activeMatches.set(socket.id, match.socketId);
  activeMatches.set(match.socketId, socket.id);

  const partnerData = socketData.get(match.socketId);
  if (partnerData) {
    partnerData.partnerId = data.userId;
    partnerData.partnerSocketId = socket.id;
  }
  data.partnerId = match.userId;
  data.partnerSocketId = match.socketId;

  // Exactly one peer must create the offer (stable by userId)
  const finderIsInitiator = data.userId < match.userId;

  socket.emit("match:found", {
    userId: match.userId,
    name: match.name,
    image: match.image,
    country: match.country,
    isInitiator: finderIsInitiator,
  });

  const partnerSocket = io.sockets.sockets.get(match.socketId);
  partnerSocket?.emit("match:found", {
    userId: data.userId,
    name: data.name,
    image: data.image,
    country: data.country,
    isInitiator: !finderIsInitiator,
  });
}

function endMatch(socketId: string, reason: string = "disconnected") {
  const partnerSocketId = activeMatches.get(socketId);
  if (partnerSocketId) {
    activeMatches.delete(socketId);
    activeMatches.delete(partnerSocketId);

    const partnerSocket = io.sockets.sockets.get(partnerSocketId);
    partnerSocket?.emit("match:ended", reason);

    const partnerData = socketData.get(partnerSocketId);
    if (partnerData) {
      partnerData.partnerId = undefined;
      partnerData.partnerSocketId = undefined;
    }
  }

  const data = socketData.get(socketId);
  if (data) {
    data.partnerId = undefined;
    data.partnerSocketId = undefined;
  }
}

io.on("connection", (socket: Socket) => {
  socket.on("authenticate", async (authData: {
    userId: string;
    name?: string;
    image?: string;
    country?: string;
    gender?: string;
    interests?: string[];
  }) => {
    if (!rateLimitSocket(socket.id) || !authData?.userId || typeof authData.userId !== "string") {
      socket.emit("error", "Invalid authentication");
      return;
    }

    const redis = getRedis();
    socketData.set(socket.id, {
      userId: authData.userId,
      name: typeof authData.name === "string" ? authData.name.slice(0, 80) : undefined,
      image: typeof authData.image === "string" ? authData.image.slice(0, 500) : undefined,
      country: typeof authData.country === "string" ? authData.country.slice(0, 80) : undefined,
      gender: typeof authData.gender === "string" ? authData.gender.slice(0, 40) : undefined,
      interests: Array.isArray(authData.interests)
        ? authData.interests.filter((i) => typeof i === "string").slice(0, 10)
        : [],
    });

    await redis.sadd(ONLINE_KEY, authData.userId);
    await redis.set(`${SOCKET_USER_PREFIX}${authData.userId}`, socket.id);
    await broadcastOnlineCount();
  });

  socket.on("queue:join", async (prefs?: MatchPreferences) => {
    if (!rateLimitSocket(socket.id)) return;
    const data = socketData.get(socket.id);
    if (!data) {
      socket.emit("error", "Not authenticated");
      return;
    }
    data.sessionStopped = false;
    await addToQueue(socket, data, prefs);
  });

  socket.on("queue:leave", async () => {
    if (!rateLimitSocket(socket.id)) return;
    await removeFromQueue(socket.id);
  });

  socket.on("match:skip", async () => {
    if (!rateLimitSocket(socket.id)) return;
    endMatch(socket.id, "skipped");
    socket.emit("match:ended", "skipped");

    const data = socketData.get(socket.id);
    if (data && !data.sessionStopped) {
      await addToQueue(socket, data);
    }
  });

  socket.on("match:stop", async () => {
    if (!rateLimitSocket(socket.id)) return;
    const data = socketData.get(socket.id);
    if (data) {
      data.sessionStopped = true;
    }
    endMatch(socket.id, "stopped");
    await removeFromQueue(socket.id);
    socket.emit("match:ended", "stopped");
  });

  socket.on("webrtc:signal", (signal: {
    type: "offer" | "answer" | "ice-candidate";
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
    targetId: string;
  }) => {
    if (!rateLimitSocket(socket.id, 120, 10_000)) return;
    const data = socketData.get(socket.id);
    if (!data?.partnerSocketId) return;
    if (!signal || !["offer", "answer", "ice-candidate"].includes(signal.type)) return;

    const partnerSocket = io.sockets.sockets.get(data.partnerSocketId);
    partnerSocket?.emit("webrtc:signal", {
      ...signal,
      fromId: data.userId,
    });
  });

  socket.on("chat:message", (content: string) => {
    if (!rateLimitSocket(socket.id, 30, 10_000)) return;
    const data = socketData.get(socket.id);
    if (!data?.partnerSocketId || typeof content !== "string") return;

    const trimmed = content.trim().slice(0, 2000);
    if (!trimmed) return;

    const message: ChatMessage = {
      id: uuidv4(),
      senderId: data.userId,
      content: trimmed,
      timestamp: new Date(),
    };

    const partnerSocket = io.sockets.sockets.get(data.partnerSocketId);
    partnerSocket?.emit("chat:message", message);
    socket.emit("chat:message", message);
  });

  socket.on("chat:typing", (isTyping: boolean) => {
    if (!rateLimitSocket(socket.id, 60, 10_000)) return;
    const data = socketData.get(socket.id);
    if (!data?.partnerSocketId) return;

    const partnerSocket = io.sockets.sockets.get(data.partnerSocketId);
    partnerSocket?.emit("chat:typing", { userId: data.userId, isTyping: Boolean(isTyping) });
  });

  socket.on("user:report", () => {
    if (!rateLimitSocket(socket.id, 10, 60_000)) return;
    endMatch(socket.id, "reported");
    socket.emit("match:ended", "reported");
  });

  socket.on("disconnect", async () => {
    endMatch(socket.id);

    const data = socketData.get(socket.id);
    if (data) {
      const redis = getRedis();
      await redis.srem(ONLINE_KEY, data.userId);
      await redis.del(`${SOCKET_USER_PREFIX}${data.userId}`);
    }

    await removeFromQueue(socket.id);
    socketData.delete(socket.id);
    eventHits.delete(socket.id);
    await broadcastOnlineCount();
  });
});

function shutdown(signal: string) {
  console.log(`[BearTV Socket] ${signal} received, shutting down…`);
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[BearTV Socket] listening on 0.0.0.0:${PORT}`);
  console.log(`[BearTV Socket] allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});

export { io };
