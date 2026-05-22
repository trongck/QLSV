import React from "react";

export interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#fff8f5",
        borderRadius: 14,
        padding: "12px 18px",
        border: "1px solid #ead9cb",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ color: "#c25450", flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#8b6f5f",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#2d1b14",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
