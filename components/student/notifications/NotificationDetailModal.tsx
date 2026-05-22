import React from "react";
import { Pin, Clock, Pencil } from "lucide-react";
import { Notification } from "@/hooks/sinhvien/useStudentNotifications";
import { parseNotificationContent } from "@/components/admin/NotificationForms";
import { formatDate } from "@/lib/utils/date.utils";
import { LOAI_LABEL } from "./notificationConstants";

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: Notification | null;
  onClose: () => void;
}

export function NotificationDetailModal({
  isOpen,
  notification,
  onClose,
}: NotificationDetailModalProps) {
  if (!isOpen || !notification) return null;

  const parsed = parseNotificationContent(notification.noidung);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp border border-white/20 p-6 md:p-8">
        {/* Category / Pin */}
        <div className="flex items-center gap-2 mb-4">
          <span className="badge badge-peach text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-light-peach)] text-[var(--color-primary)]">
            {LOAI_LABEL[notification.loai] ?? notification.loai}
          </span>
          {notification.ghim && (
            <span className="flex items-center gap-1 text-xs text-orange-500 font-bold px-3 py-1 rounded-full bg-orange-50">
              <Pin size={11} /> Đã ghim
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 leading-snug">{notification.tieude}</h2>

        {/* Dates */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-fg-subtle)] border-b border-gray-100 pb-4 mb-6">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Ngày tạo: {formatDate(notification.ngaytao)}
          </span>
          {notification.dacapnhat && (
            <span className="flex items-center gap-1 text-orange-500 font-medium">
              <Pencil size={12} />
              Cập nhật: {formatDate(notification.ngaycapnhat)}
            </span>
          )}
        </div>

        {/* Content (Full text, allow wrap) */}
        <div className="flex-1 overflow-y-auto max-h-[40vh] text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pr-2 scrollbar-thin">
          {parsed.imageUrl && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-full">
              <img src={parsed.imageUrl} alt="Đính kèm" className="w-full h-auto object-contain max-h-[300px]" />
            </div>
          )}
          {parsed.text}
        </div>

        {/* Footer Action */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
