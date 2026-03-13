const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const rooms = new Map();

function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, { clients: new Set(), state: null });
  }
  return rooms.get(roomName);
}

function cleanupRoom(roomName) {
  const room = rooms.get(roomName);
  if (!room) return;
  if (room.clients.size === 0) {
    rooms.delete(roomName);
  }
}

function serializeParticipant(client) {
  return {
    id: client.clientId,
    role: client.role,
    callJoined: Boolean(client.callJoined)
  };
}

function getParticipants(room) {
  return Array.from(room.clients).map((client) => serializeParticipant(client));
}

function safeJoin(root, targetPath) {
  const resolved = path.resolve(root, `.${targetPath}`);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") {
    reqPath = "/index.html";
  }

  const filePath = safeJoin(ROOT, reqPath);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Block access to private/, runtime/, and sensitive files
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (
    rel.startsWith("private/") ||
    rel.startsWith("runtime/") ||
    rel.startsWith("node_modules/") ||
    rel.endsWith(".ps1") ||
    rel.endsWith(".cmd") ||
    rel.endsWith(".bat") ||
    rel.endsWith(".log") ||
    rel.endsWith(".md") ||
    rel === "package.json" ||
    rel === "package-lock.json"
  ) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocketServer({ server, path: "/ws" });

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(room, payload, except = null) {
  for (const client of room.clients) {
    if (client !== except && client.readyState === client.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = (url.searchParams.get("room") || "pawnpilot-demo-room").replace(/[^\w-]/g, "");
  const role = (url.searchParams.get("role") || "student").replace(/[^\w-]/g, "");
  const room = getRoom(roomName);

  ws.clientId = randomUUID();
  ws.roomName = roomName;
  ws.role = role;
  ws.callJoined = false;
  room.clients.add(ws);

  send(ws, {
    type: "welcome",
    clientId: ws.clientId,
    room: roomName,
    role,
    peers: room.clients.size,
    participants: getParticipants(room)
  });

  if (room.state) {
    send(ws, {
      type: "state",
      source: "server-cache",
      state: room.state
    });
  }

  broadcast(room, {
    type: "presence",
    peers: room.clients.size,
    participants: getParticipants(room)
  });

  broadcast(room, {
    type: "peer_joined",
    peer: serializeParticipant(ws),
    peers: room.clients.size,
    participants: getParticipants(room)
  }, ws);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid JSON payload" });
      return;
    }

    if (msg.type === "state" && msg.state && typeof msg.state.fen === "string") {
      room.state = {
        fen: msg.state.fen,
        pgn: typeof msg.state.pgn === "string" ? msg.state.pgn : "",
        updatedAt: Date.now()
      };
      broadcast(room, { type: "state", source: "peer", state: room.state }, ws);
      return;
    }

    if (msg.type === "request_state") {
      if (room.state) {
        send(ws, { type: "state", source: "server-cache", state: room.state });
      }
      return;
    }

    if (msg.type === "call_state") {
      ws.callJoined = Boolean(msg.joined);
      broadcast(room, {
        type: "call_state",
        peerId: ws.clientId,
        joined: ws.callJoined,
        peers: room.clients.size,
        participants: getParticipants(room)
      });
      return;
    }

    if (msg.type === "signal" && typeof msg.target === "string" && msg.data) {
      const targetClient = Array.from(room.clients).find((client) => client.clientId === msg.target);
      if (!targetClient) {
        return;
      }

      send(targetClient, {
        type: "signal",
        sender: ws.clientId,
        role: ws.role,
        data: msg.data
      });
      return;
    }

    if (msg.type === "chat" && typeof msg.text === "string" && msg.text.trim()) {
      const text = msg.text.trim().slice(0, 500);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      broadcast(room, {
        type: "chat",
        sender: ws.clientId,
        role: ws.role,
        text,
        time
      }, ws);
    }
  });

  ws.on("close", () => {
    const currentRoom = rooms.get(ws.roomName);
    if (!currentRoom) return;
    currentRoom.clients.delete(ws);
    broadcast(currentRoom, {
      type: "peer_left",
      peerId: ws.clientId,
      peers: currentRoom.clients.size,
      participants: getParticipants(currentRoom)
    });
    broadcast(currentRoom, {
      type: "presence",
      peers: currentRoom.clients.size,
      participants: getParticipants(currentRoom)
    });
    cleanupRoom(ws.roomName);
  });
});

server.listen(PORT, () => {
  console.log(`PawnPilot site running at http://localhost:${PORT}`);
});
