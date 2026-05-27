"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentDashboard } from "@/hooks/sinhvien/useStudentDashboard";
import { StatCard } from "@/components/student/StatCardDashboard";

export default function StudentDashboard() {
  const { user } = useAuth();
  const {
    data,
    fetching,
    bellNotifications,
    unreadBellCount,
    markAllRead,
  } = useStudentDashboard();

  if (!user) return null;

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <DashboardShell pageTitle="Tổng quan">
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-fg m-0 mb-1">
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className="text-[13px] text-fg-subtle m-0 capitalize">{today}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3.5 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-2.5">
          <StatCard
            label="Môn đang học"
            value={fetching ? "…" : (data?.monHocCount ?? 0)}
            sub="học kỳ này"
          />
          <StatCard
            label="GPA kỳ hiện tại"
            value={fetching ? "…" : (data?.gpa10_hocky_hientai ?? 0).toFixed(2)}
            sub={`Thang 4: ${fetching ? "…" : (data?.gpa4_hocky_hientai ?? 0).toFixed(2)}`}
            accent
          />
          <StatCard
            label="GPA tích lũy"
            value={fetching ? "…" : (data?.gpa10_tich_luy ?? 0).toFixed(2)}
            sub={data?.xep_loai_hoc_luc ?? `H4: ${(data?.gpa4_tich_luy ?? 0).toFixed(2)}`}
          />
          <StatCard
            label="Buổi vắng"
            value={fetching ? "…" : (data?.soBuoiVang ?? 0)}
            sub="lần vắng mặt"
          />
          <StatCard
            label="Bài tập còn hạn"
            value={fetching ? "…" : (data?.soBaiTapConHan ?? 0)}
            sub="cần nộp"
          />
        </div>

        {/* Two-col grid */}
        <div className="grid grid-cols-2 gap-3.5 max-lg:grid-cols-1">
          {/* Lịch hôm nay */}
          <section className="card" aria-labelledby="schedule-today">
            <div className="p-[16px_20px_12px] border-b border-border">
              <h2 id="schedule-today" className="text-sm font-bold text-fg m-0">
                Lịch học hôm nay
              </h2>
            </div>
            {fetching ? (
              <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Đang tải…</p>
            ) : !data?.lichHocHomNay.length ? (
              <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Hôm nay không có tiết học 🎉</p>
            ) : (
              <ul className="list-none p-[12px_16px] m-0 flex flex-col gap-2.5" role="list">
                {data.lichHocHomNay.map((item: any, i: number) => (
                  <li key={i} className="flex items-center gap-3 p-[10px_12px] rounded-xl bg-[#fff8f5] border border-border">
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0 min-w-[64px]">
                      <span>T{item.tietbatdau}</span>
                      <span className="text-border">—</span>
                      <span>T{item.tietketthuc}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-semibold text-fg truncate">{item.tenmon}</span>
                      <span className="text-[11px] text-fg-subtle">
                        {item.phonghoc ?? "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Điểm gần đây */}
          <section className="card" aria-labelledby="recent-grades">
            <div className="p-[16px_20px_12px] border-b border-border">
              <h2 id="recent-grades" className="text-sm font-bold text-fg m-0">
                Điểm gần đây
              </h2>
            </div>
            {fetching ? (
              <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Đang tải…</p>
            ) : !data?.diemGanDay.length ? (
              <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Chưa có điểm nào được công bố.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table" aria-label="Bảng điểm gần đây">
                  <thead>
                    <tr className="bg-[#fff8f5]">
                      <th className="p-[10px_14px] uppercase text-[10px] tracking-wider text-fg-subtle">Môn học</th>
                      <th className="p-[10px_14px] text-center uppercase text-[10px] tracking-wider text-fg-subtle">Chuyên cần</th>
                      <th className="p-[10px_14px] text-center uppercase text-[10px] tracking-wider text-fg-subtle">Giữa kỳ</th>
                      <th className="p-[10px_14px] text-center uppercase text-[10px] tracking-wider text-fg-subtle">Cuối kỳ</th>
                      <th className="p-[10px_14px] text-center uppercase text-[10px] tracking-wider text-fg-subtle">Tổng kết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.diemGanDay.map((d: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fffaf8]"}>
                        <td className="p-[12px_14px] font-bold text-fg">{d.tenmon}</td>
                        <td className={`p-[12px_14px] text-center font-semibold ${d.chuyencan === "—" ? "text-gray-400" : "text-fg"}`}>
                          {d.chuyencan}
                        </td>
                        <td className={`p-[12px_14px] text-center font-semibold ${d.giuaky === "—" ? "text-gray-400" : "text-fg"}`}>
                          {d.giuaky}
                        </td>
                        <td className={`p-[12px_14px] text-center font-semibold ${d.cuoiky === "—" ? "text-gray-400" : "text-fg"}`}>
                          {d.cuoiky}
                        </td>
                        <td className="p-[12px_14px] text-center">
                          {d.tongket !== "—" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <strong className={`text-sm ${Number(d.tongket) >= 4.0 ? "text-[#065f46]" : "text-[#991b1b]"}`}>
                                {d.tongket}
                              </strong>
                              {d.diemchu && (
                                <span className="text-[10px] font-extrabold bg-[#f5ede8] text-primary p-[2px_6px] rounded-full border border-border">
                                  {d.diemchu}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 italic">Chưa có</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Thông báo */}
        <section className="card" aria-labelledby="notifications">
          <div className="p-[16px_20px_12px] border-b border-border">
            <h2 id="notifications" className="text-sm font-bold text-fg m-0">
              Thông báo gần đây
            </h2>
          </div>
          {fetching ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Đang tải…</p>
          ) : !data?.thongBaoGanDay.length ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Không có thông báo mới.</p>
          ) : (
            <ul className="list-none p-[12px_16px] m-0 flex flex-col" role="list">
              {data.thongBaoGanDay.map((tb: any, i: number) => (
                <li key={i} className="flex items-start gap-3 p-[12px_4px] border-b border-border last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-fg">{tb.tieude}</span>
                    <span className="text-[11px] text-fg-subtle">
                      {tb.ngaytao} · {tb.loai}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

