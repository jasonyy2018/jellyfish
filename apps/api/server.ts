import http from "http";

import { db } from "@jellyfish/db";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifyUserToken } from "@/lib/auth";

declare global {
  // eslint-disable-next-line no-var
  var __jf_io: SocketIOServer | undefined;
}

const port = Number(process.env.PORT ?? 3002);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, port });
const handle = app.getRequestHandler();

async function bootstrap() {
  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, nextMiddleware) => {
    const token = String(socket.handshake.auth?.token ?? "");
    const apiKey = String(socket.handshake.auth?.apiKey ?? "");
    const nodeId = String(socket.handshake.auth?.nodeId ?? "");
    try {
      if (token) {
        const payload = verifyUserToken(token);
        socket.data.userId = payload.userId;
        return nextMiddleware();
      }
      if (apiKey) {
        const user = await db.user.findUnique({
          where: { apiKey },
          select: { id: true },
        });
        if (!user) return nextMiddleware(new Error("Unauthorized"));
        socket.data.userId = user.id;
        if (nodeId) socket.data.nodeId = nodeId;
        return nextMiddleware();
      }
      return nextMiddleware(new Error("Missing auth"));
    } catch {
      return nextMiddleware(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }
    if (socket.data.nodeId) {
      socket.join(`node:${socket.data.nodeId}`);
    }
    socket.emit("system", { message: "connected", ts: new Date().toISOString() });
  });

  global.__jf_io = io;

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Jellyfish API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API server", error);
  process.exit(1);
});
