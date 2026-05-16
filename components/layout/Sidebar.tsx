"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react";

const menus = [
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lịch học",
    href: "/dashboard/schedule",
    icon: CalendarDays,
  },
  {
    title: "Kết quả",
    href: "/dashboard/results",
    icon: ClipboardList,
  },
  {
    title: "Bài tập",
    href: "/dashboard/tasks",
    icon: FileText,
  },
  {
    title: "Thông báo & tài liệu",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Tin nhắn",
    href: "/dashboard/messages",
    icon: MessageCircle,
  },
  {
    title: "Cài đặt",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]" />

          <div>
            <h1 className="font-bold text-lg leading-5">
              Hệ thống quản lý sinh viên
            </h1>
          </div>
        </div>

        <nav className="space-y-2">
          {menus.map((menu) => {
            const active = pathname === menu.href;

            const Icon = menu.icon;

            return (
              <Link
                key={menu.title}
                href={menu.href}
                className={`sidebar-item ${active ? "active" : ""}`}
              >
                <Icon size={20} />

                <span>{menu.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="card p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
          A
        </div>

        <div>
          <h4 className="font-semibold">Đỗ Thị An</h4>

          <p className="text-sm text-[var(--color-fg-subtle)]">Sinh viên</p>
        </div>
      </div>
    </aside>
  );
}
