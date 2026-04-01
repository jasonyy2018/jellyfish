type RealtimeChannel = "node" | "metric" | "log" | "task" | "review" | "skill";

export function emitRealtime(
  channel: RealtimeChannel,
  payload: Record<string, unknown>,
  rooms?: { userId?: string; nodeId?: string },
) {
  const io = globalThis.__jf_io;
  if (!io) return;
  const data = { ...payload, ts: new Date().toISOString() };
  io.emit(channel, data);
  if (rooms?.userId) io.to(`user:${rooms.userId}`).emit(channel, data);
  if (rooms?.nodeId) io.to(`node:${rooms.nodeId}`).emit(channel, data);
}
