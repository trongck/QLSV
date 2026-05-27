import React from "react";
import { useRouter } from "next/navigation";
import { parseNotificationContent } from "@/components/admin/NotificationForms";

export interface NotificationBellProps {
  unreadBellCount: number;
  bellNotifications: any[];
  onMarkAllRead: () => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  notificationRoute?: string; // Default: /student/notifications
}

export function NotificationBell({
  unreadBellCount,
  bellNotifications,
  onMarkAllRead,
  isOpen,
  onToggle,
  notificationRoute = "/student/notifications",
}: NotificationBellProps) {
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-100 flex items-center justify-center relative cursor-pointer transition-colors shadow-sm animate-none"
        style={{ border: "1px solid #ead9cb" }}
      >
        <svg
          className="w-[22px] h-[22px] text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadBellCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[48px] right-0 w-[290px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-scaleUp">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">Thông báo của bạn</span>
            {unreadBellCount > 0 && (
              <span
                onClick={onMarkAllRead}
                className="text-[10px] text-emerald-600 font-semibold cursor-pointer hover:underline"
              >
                Đánh dấu đã đọc
              </span>
            )}
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {bellNotifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                Không có thông báo nào
              </div>
            ) : (
              bellNotifications.map((notif: any) => {
                const parsed = parseNotificationContent(notif.noidung || "");
                return (
                  <div
                    key={notif.mathongbao}
                    onClick={() => {
                      router.push(`${notificationRoute}?id=${notif.mathongbao}`);
                      onToggle();
                    }}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col gap-1 ${
                      !notif.dadoc ? "bg-orange-50/40" : ""
                    }`}
                  >
                    <p
                      className={`text-xs text-gray-700 m-0 ${
                        !notif.dadoc ? "font-semibold text-[#C25450]" : ""
                      }`}
                    >
                      {notif.tieude}
                    </p>
                    <p className="text-[10px] text-gray-500 m-0 line-clamp-1">
                      {parsed.text}
                    </p>
                    <span className="text-[9px] text-gray-400">
                      {new Date(notif.ngaytao).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
            <span
              onClick={() => {
                router.push(notificationRoute);
                onToggle();
              }}
              className="text-xs text-[#C25450] font-semibold cursor-pointer hover:underline"
            >
              Xem tất cả thông báo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
