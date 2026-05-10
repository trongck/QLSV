"use client";

import { Bell, Download, FileText, Search } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Thông báo đăng ký học phần học kỳ 2",
    description:
      "Sinh viên thực hiện đăng ký học phần từ ngày 05/05 đến 10/05.",
    date: "04/05/2026",
    type: "Thông báo",
  },
  {
    id: 2,
    title: "Tài liệu hướng dẫn sử dụng hệ thống LMS",
    description: "Tải tài liệu hướng dẫn học trực tuyến dành cho sinh viên.",
    date: "03/05/2026",
    type: "Tài liệu",
  },
  {
    id: 3,
    title: "Thông báo nghỉ lễ 30/4 - 1/5",
    description: "Nhà trường thông báo lịch nghỉ lễ và thời gian học lại.",
    date: "01/05/2026",
    type: "Thông báo",
  },
];

export default function StudentNotificationsPage() {
  return (
    <div className="animate-fadeInUp">
      <div className="card p-8 rounded-[24px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-3">Thông báo & tài liệu</h1>

            <p className="text-[var(--color-fg-subtle)]">
              Cập nhật thông báo mới nhất từ nhà trường.
            </p>
          </div>

          {/* Search */}
          <div className="w-[320px] h-[48px] bg-white border border-[var(--color-border)] rounded-xl px-4 flex items-center gap-3">
            <Search size={18} />

            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button className="px-5 h-[42px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium">
            Tất cả
          </button>

          <button className="px-5 h-[42px] rounded-xl bg-[var(--color-light-peach)] text-sm font-medium">
            Thông báo
          </button>

          <button className="px-5 h-[42px] rounded-xl bg-[var(--color-light-peach)] text-sm font-medium">
            Tài liệu
          </button>
        </div>

        {/* List */}
        <div className="space-y-5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="card p-6 rounded-2xl hover:translate-y-[-2px] transition-all"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-light-peach)] flex items-center justify-center shrink-0">
                    {item.type === "Thông báo" ? (
                      <Bell size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>

                      <span className="badge badge-peach">{item.type}</span>
                    </div>

                    <p className="text-[var(--color-fg-subtle)] leading-7">
                      {item.description}
                    </p>

                    <span className="block mt-3 text-sm text-[var(--color-fg-subtle)]">
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button className="btn-secondary shrink-0">
                  <Download size={16} />
                  Tải xuống
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
