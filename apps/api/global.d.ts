import type { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __jf_io: SocketIOServer | undefined;
}

export {};
