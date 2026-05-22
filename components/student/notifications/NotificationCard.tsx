import React from "react";
import { FileText, Bell, Pin, Clock, Pencil, CheckCheck } from "lucide-react";
import { Notification } from "@/hooks/sinhvien/useStudentNotifications";
import { parseNotificationContent } from "@/components/admin/NotificationForms";
import { formatDate } from "@/lib/utils/date.utils";
import { LOAI_LABEL } from "./notificationConstants";

interface NotificationCardProps {
  item: Notification;
  onClick: () => void;
}

export function NotificationCard({ item, onClick }: NotificationCardProps) {
  const parsed = parseNotificationContent(item.noidung);

  return (
    <div
      onClick={onClick}
      className={`card p-6 rounded-2xl transition-all cursor-pointer hover:translate-y-[-2px] ${
        !item.dadoc
          ? "border-l-4 border-[var(--color-primary)]"
          : "opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              item.loai === "Khancap"
                ? "bg-red-100 text-red-600"
                : "bg-[var(--color-light-peach)]"
            }`}
          >
            {item.loai === "Tailieu" ? <FileText size={20} /> : <Bell size={20} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {item.ghim && <Pin size={13} className="text-orange-500 shrink-0" />}
              <h3
                className={`text-base font-semibold truncate ${
                  !item.dadoc ? "text-[var(--color-primary)]" : ""
                }`}
              >
                {item.tieude}
              </h3>
              <span className="badge badge-peach text-xs shrink-0">
                {LOAI_LABEL[item.loai] ?? item.loai}
              </span>
              {!item.dadoc && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
            </div>

            {/* Body */}
            <p className="text-[var(--color-fg-subtle)] leading-6 text-sm line-clamp-2">
              {parsed.text}
            </p>

            {parsed.imageUrl && (
              <div className="w-full max-w-[200px] h-24 overflow-hidden rounded-xl border border-gray-100 my-2 shrink-0">
                <img src={parsed.imageUrl} alt={item.tieude} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--color-fg-subtle)]">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Ngày tạo: {formatDate(item.ngaytao)}
              </span>
              {item.dacapnhat && (
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <Pencil size={12} />
                  Cập nhật: {formatDate(item.ngaycapnhat)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Đã đọc badge */}
        {item.dadoc && (
          <span className="shrink-0 text-xs text-green-600 flex items-center gap-1 font-medium">
            <CheckCheck size={14} />
            Đã đọc
          </span>
        )}
      </div>
    </div>
  );
}
