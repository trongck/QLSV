import React from "react";

export function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 border flex items-center gap-3 shadow-sm ${
        color || "border-gray-100"
      }`}
    >
      <div className="opacity-70">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
      <div className="mx-auto mb-3 w-fit text-gray-300">{icon}</div>
      <p className="text-gray-500 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
