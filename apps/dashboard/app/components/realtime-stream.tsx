"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

type EventItem = { channel: string; payload: Record<string, unknown> };

export function RealtimeStream() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const socketUrl = useMemo(() => process.env.NEXT_PUBLIC_JELLYFISH_API_WS_URL ?? "http://localhost:3002", []);
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_JELLYFISH_API_KEY ?? "", []);

  useEffect(() => {
    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: apiKey ? { apiKey } : {},
    });
    const channels = ["node", "metric", "log", "task", "review", "skill", "system"];

    for (const channel of channels) {
      socket.on(channel, (payload: Record<string, unknown>) => {
        setEvents((prev) => [{ channel, payload }, ...prev].slice(0, 20));
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [socketUrl, apiKey]);

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Realtime Events</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {events.map((event, idx) => (
          <div key={`${event.channel}-${idx}`} style={{ fontSize: 12, fontFamily: "monospace" }}>
            <strong>{event.channel}</strong>: {JSON.stringify(event.payload)}
          </div>
        ))}
      </div>
    </section>
  );
}
