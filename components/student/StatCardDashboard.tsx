import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: StatCardProps) {
  return (
    <div
      className={`card p-[18px_20px] flex flex-col gap-1.5 ${
        accent ? "border-transparent text-white" : ""
      }`}
      style={
        accent
          ? {
              background: "linear-gradient(135deg, #C25450 0%, #A8443F 100%)",
            }
          : {}
      }
    >
      <span
        className={`text-[12px] font-semibold uppercase tracking-wider ${
          accent ? "text-white/80" : "text-fg-subtle"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-3xl font-bold leading-none ${
          accent ? "text-white" : "text-fg"
        }`}
      >
        {value}
      </span>
      {sub && (
        <span
          className={`text-[12px] ${
            accent ? "text-white/80" : "text-fg-subtle"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
