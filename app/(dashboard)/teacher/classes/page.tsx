"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubTab = "classes" | "schedule";

interface LichItem {
  thutrongtuan: number; // 2=T2 ... 8=CN
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
}

interface LopItem {
  maphancong: number;
  malophoc: string;
  tenmon: string;
  mamon: string;
  sotinchi: number;
  tenlop: string;
  soSinhVien: number;
  lich: LichItem[];
  ngaybatdau: string | null;
  ngayketthuc: string | null;
}

interface LichTuanItem {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}



interface ClassesData {
  dsLop: LopItem[];
  lichTuan: LichTuanItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const THU_LABEL: Record<number, string> = {
  2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4",
  5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật",
};
const THU_SHORT: Record<number, string> = {
  2: "T2", 3: "T3", 4: "T4", 5: "T5", 6: "T6", 7: "T7", 8: "CN",
};

function tietToTime(tiet: number): string {
  const total = 7 * 60 + (tiet - 1) * 60;
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}



// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherClasses() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>("classes");
  const [pageLoading, setPageLoading] = useState(true);
  const [data, setData] = useState<ClassesData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user) {
      apiFetch("/api/giangvien/classes")
        .then((r) => r.json())
        .then((json) => { if (json.success) setData(json.data); })
        .catch((e) => console.error("Lỗi tải lớp học:", e))
        .finally(() => setPageLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || pageLoading) {
    return (
      <div className="p-6 text-center text-fg-muted font-bold">
        Đang tải...
      </div>
    );
  }

  // Nhóm lịch tuần theo thứ (2–8)
  const lichTheoThu: Record<number, LichTuanItem[]> = {};
  for (const l of data?.lichTuan ?? []) {
    if (!lichTheoThu[l.thutrongtuan]) lichTheoThu[l.thutrongtuan] = [];
    lichTheoThu[l.thutrongtuan].push(l);
  }
  const thuHomNay = (() => { const d = new Date().getDay(); return d === 0 ? 8 : d + 1; })();

  return (
    <DashboardShell pageTitle="Lớp học">
      <div className="flex flex-col gap-5">

        {/* Sub-tabs */}
        <div className="flex border-b border-[#F0E1D9] mb-5 gap-6">
          {[
            { key: "classes",  label: "Lớp học phần" },
            { key: "schedule", label: "Lịch dạy học" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as SubTab)}
              className={`bg-transparent border-none py-2.5 px-1.5 text-[15px] cursor-pointer transition-all duration-200 ${tab === item.key ? "font-bold text-fg border-b-3 border-primary" : "font-medium text-fg-subtle border-b-3 border-transparent"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: LỚP HỌC PHẦN ═══════════════════════════════════════════ */}
        {tab === "classes" && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[20px] font-bold text-fg-muted m-0">
                  Lớp học đang giảng dạy
                </h2>
                <p className="text-[13px] text-fg-subtle mt-1 mb-0">
                  Các học phần được phân công trong học kỳ hiện tại
                </p>
              </div>
            </div>

            {!data?.dsLop?.length ? (
              <p className="text-center text-fg-subtle p-10 m-0">
                Chưa có lớp học nào được phân công
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
                {data.dsLop.map((c) => {
                  // Lịch đại diện: lấy buổi đầu tiên
                  const l0 = c.lich[0];
                  const scheduleStr = l0
                    ? `${THU_LABEL[l0.thutrongtuan]} (Tiết ${l0.tietbatdau}–${l0.tietketthuc})${l0.phonghoc ? ` | Phòng ${l0.phonghoc}` : ""}`
                    : "Chưa xếp lịch";
                  return (
                    <div key={c.maphancong} className="card p-5 flex flex-col gap-3.5 border border-[#F0E1D9]">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] bg-[#FFEAEA] text-red-500 py-1 px-2 rounded font-bold">
                          {c.malophoc}
                        </span>
                        <span className="text-[12px] text-fg-subtle">
                          {c.soSinhVien} sinh viên
                        </span>
                      </div>
                      <div>
                        <h3 className="my-1 text-base text-fg font-bold">
                          {c.tenmon}
                        </h3>
                        <p className="m-0 text-[13px] text-fg-subtle">
                          {c.tenlop} &bull; {c.sotinchi} tín chỉ
                        </p>
                      </div>
                      <div className="text-[12px] text-fg-subtle border-t border-dashed border-[#F0E1D9] pt-2.5">
                        <b>Lịch:</b> {scheduleStr}
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          className="flex-1 py-2 text-[12px] rounded-lg border border-[#EAD9CB] bg-white text-fg-muted font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push("/teacher/students")}
                        >
                          Sinh viên
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: LỊCH DẠY HỌC ══════════════════════════════════════════ */}
        {tab === "schedule" && (
          <div className="flex flex-col gap-5">

            {/* Lịch theo thứ trong tuần */}
            <section className="card p-5 border border-[#F0E1D9]">
              <h3 className="text-base mb-5 text-fg-muted font-bold m-0">
                Lịch dạy theo thứ
              </h3>
              <div className="grid grid-cols-7 border-t border-[#F0E1D9]">
                {[2, 3, 4, 5, 6, 7, 8].map((thu, i) => {
                  const list = lichTheoThu[thu] ?? [];
                  const isToday = thu === thuHomNay;
                  return (
                    <div key={thu} className={`p-3.5 text-center ${i < 6 ? "border-r border-[#F0E1D9]" : ""} ${isToday ? "bg-[#FDF3F3]" : "bg-transparent"}`}>
                      <div className={`text-[13px] ${isToday ? "font-extrabold text-red-500" : "font-bold text-fg"}`}>
                        {THU_SHORT[thu]}
                      </div>
                      <div className="mt-2.5 flex flex-col gap-1.5">
                        {list.length === 0 ? (
                          <span className="text-[11px] text-gray-300">—</span>
                        ) : list.map((l) => (
                          <div key={l.malichhoc} className="text-[11px] bg-[#FFEAEA] rounded-lg p-1.5 text-red-500 font-semibold">
                            {l.phancong?.monhoc?.tenmon ?? "—"}
                            <div className="text-fg-subtle font-normal mt-0.5">
                              T{l.tietbatdau}–T{l.tietketthuc}
                              {l.phonghoc ? ` | ${l.phonghoc}` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Chi tiết lịch hôm nay */}
            <section className="card p-5 border border-[#F0E1D9]">
              <h3 className="text-base text-fg-muted mb-4 font-bold m-0">
                Lịch dạy hôm nay — {THU_LABEL[thuHomNay]}
              </h3>
              {!(lichTheoThu[thuHomNay]?.length) ? (
                <p className="text-fg-subtle text-[13px] m-0">Không có lịch dạy hôm nay</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {lichTheoThu[thuHomNay].map((l) => (
                    <div key={l.malichhoc} className="flex items-center justify-between p-3.5 rounded-xl border-l-[5px] border-l-[#F2A8A8] bg-white shadow-xs border border-[#F0E1D9]">
                      <div className="flex gap-5 items-center">
                        <span className="text-[14px] font-bold text-[#F2A8A8] w-[120px]">
                          Tiết {l.tietbatdau}–{l.tietketthuc}
                        </span>
                        <div>
                          <div className="font-bold text-[15px] text-fg">
                            {l.phancong?.monhoc?.tenmon ?? "—"}
                          </div>
                          <div className="text-[12px] text-fg-subtle mt-0.5">
                            {l.phancong?.lop?.tenlop ?? ""}{l.phonghoc ? ` | Phòng ${l.phonghoc}` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}



      </div>
    </DashboardShell>
  );
}
