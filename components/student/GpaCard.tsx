import React from "react";

export interface GpaCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  badge?: {
    text: string;
    style: {
      bg: string;
      text: string;
      border: string;
      dot: string;
    };
  };
}

export function GpaCard({
  label,
  value,
  sub,
  accent,
  badge,
}: GpaCardProps) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: accent
          ? "linear-gradient(135deg,#c25450 0%,#a8443f 100%)"
          : "#fff",
        border: accent ? "none" : "1px solid #ead9cb",
        boxShadow: accent
          ? "0 8px 24px rgba(194,84,80,0.25)"
          : "0 2px 8px rgba(76,38,24,0.06)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: accent ? "rgba(255,255,255,0.7)" : "#8b6f5f",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1,
          color: accent ? "#fff" : "#2d1b14",
        }}
      >
        {value}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {sub && (
          <span
            style={{
              fontSize: 11,
              color: accent ? "rgba(255,255,255,0.6)" : "#8b6f5f",
            }}
          >
            {sub}
          </span>
        )}
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 10px",
              borderRadius: 20,
              background: badge.style.bg,
              color: badge.style.text,
              border: `1px solid ${badge.style.border}`,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
