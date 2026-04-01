import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>{children}</div>;
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </Card>
  );
}
