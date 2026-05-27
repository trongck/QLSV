"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import {
  Loader2, BookOpen, Award, CheckCircle, XCircle,
  GraduationCap, Mail, Users, TrendingUp, Star,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentGrades } from "@/hooks/sinhvien/useStudentGrades";
import { InfoCard } from "@/components/student/InfoCard";
import { GpaCard } from "@/components/student/GpaCard";
import { xepLoaiStyle, diem10Color, loaiLabel, fmt } from "@/lib/utils/grades.utils";


export default function StudentGradesPage() {
  const { user } = useAuth();
  const {
    mahocky,
    setMahocky,
    grades,
    gpaView,
    hocKyList,
    loading,
  } = useStudentGrades();
  const [tab, setTab] = useState<"chitiet" | "tongket">("chitiet");

  if (!user) return null;

  const xl10 = xepLoaiStyle(gpaView?.xep_loai_hoc_luc ?? null);
  const xl4  = xepLoaiStyle(gpaView?.xep_loai_hoc_luc_he4 ?? null);

  return (
    <DashboardShell pageTitle="Kết quả học tập">
      <style>{`
        .grades-gpa-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .grades-xl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .grades-info-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 1024px) {
          .grades-gpa-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .grades-gpa-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .grades-xl-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .grades-gpa-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="flex flex-col gap-5 py-2">

        {/* ── Thông tin sinh viên ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#fff8f5] to-white rounded-[20px] border border-[#ead9cb] p-[20px_24px] flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#c25450] to-[#a8443f] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(194,84,80,0.3)]">
              <GraduationCap size={26} color="#fff" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-[#2d1b14] leading-tight">
                {loading ? "…" : (gpaView?.hoten ?? user.hoten ?? "—")}
              </div>
              <div className="text-[12px] text-[#8b6f5f] mt-0.5">
                Mã SV: <strong className="text-[#c25450] font-bold">{gpaView?.masv ?? user.maSinhVien ?? "—"}</strong>
              </div>
            </div>
          </div>
          <div className="grades-info-row">
            <InfoCard icon={<Mail size={16} />} label="Email trường" value={loading ? "…" : (gpaView?.emailtruong ?? "—")} />
            <InfoCard icon={<Users size={16} />} label="Lớp" value={loading ? "…" : (gpaView?.tenlop ?? gpaView?.malop ?? "—")} />
          </div>
        </div>

        {/* ── Bộ lọc học kỳ ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl p-[12px_20px] border border-[#ead9cb]">
          <span className="text-[13px] font-semibold text-[#8b6f5f]">Học kỳ:</span>
          <select
            id="select-hocky"
            value={mahocky}
            onChange={(e) => setMahocky(e.target.value)}
            className="p-[7px_14px] rounded-lg border border-[#ead9cb] text-[13px] font-semibold text-[#2d1b14] bg-[#fff8f5] cursor-pointer outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="all">Tất cả học kỳ</option>
            {hocKyList.map((hk) => (
              <option key={hk.mahocky} value={hk.mahocky}>
                {hk.tenhocky}{hk.danghieuluc ? " ★ (hiện tại)" : ""}
              </option>
            ))}
          </select>
          {gpaView && (
            <span className="ml-auto text-[12px] text-[#8b6f5f]">
              {grades.length} môn · {gpaView.tenlop}
            </span>
          )}
        </div>

        {/* ── 4 GPA Cards ─────────────────────────────────────────────────── */}
        <div className="grades-gpa-grid">
          <GpaCard
            label="GPA kỳ hiện tại"
            value={loading ? "…" : fmt(gpaView?.gpa10_hocky_hientai)}
            sub={`Thang 4: ${loading ? "…" : fmt(gpaView?.gpa4_hocky_hientai)}`}
            accent
          />
          <GpaCard
            label="GPA tích lũy"
            value={loading ? "…" : fmt(gpaView?.gpa10_tich_luy)}
            sub={`Thang 4: ${loading ? "…" : fmt(gpaView?.gpa4_tich_luy)}`}
            badge={gpaView?.xep_loai_hoc_luc ? { text: gpaView.xep_loai_hoc_luc, style: xl10 } : undefined}
          />
          <GpaCard
            label="Tín chỉ tích lũy đạt"
            value={loading ? "…" : String(gpaView?.sotinchi_tich_luy_dat ?? 0)}
            
          />
          <GpaCard
            label="TC kỳ hiện tại"
            value={loading ? "…" : String(gpaView?.sotinchi_hocky_hientai ?? 0)}
            sub={`Đạt: ${gpaView?.sotinchi_dat_hocky_hientai ?? 0} TC`}
          />
        </div>

        {/* ── Xếp loại 2 thang ────────────────────────────────────────────── */}
        <div className="grades-xl-grid">
          {[
            { label: "Xếp loại học lực (thang 10)", value: gpaView?.xep_loai_hoc_luc, style: xl10, icon: <TrendingUp size={20} /> },
            { label: "Xếp loại học lực (thang 4)", value: gpaView?.xep_loai_hoc_luc_he4, style: xl4, icon: <Star size={20} /> },
          ].map((item, i) => (
            <div key={i} 
              className="rounded-2xl p-[18px_24px] flex items-center gap-4 border"
              style={{
                background: item.style.bg,
                borderColor: item.style.border,
              }}
            >
              <div style={{ color: item.style.dot }} className="shrink-0">{item.icon}</div>
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: item.style.text }}>{item.label}</div>
                <div className="text-[24px] font-extrabold" style={{ color: item.style.text }}>{item.value ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bảng điểm ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-[#ead9cb] overflow-hidden min-w-0 shadow-sm">
          {/* Header + Tab */}
          <div className="flex items-center justify-between p-[16px_24px_12px] border-b border-[#ead9cb] flex-wrap gap-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#2d1b14] m-0">Bảng điểm chi tiết</h2>
              <p className="text-[12px] text-[#8b6f5f] m-0 mt-0.5">
                {mahocky === "all" ? "Tất cả học kỳ" : hocKyList.find((h) => String(h.mahocky) === mahocky)?.tenhocky}
                {" · "}{grades.length} môn
              </p>
            </div>
            <div className="flex gap-1 bg-[#f5ede8] p-1 rounded-xl">
              {(["chitiet", "tongket"] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTab(t)} 
                  className={`px-[18px] py-1.5 rounded-lg border-none text-[12px] font-bold cursor-pointer transition-all duration-150 ${
                    tab === t 
                      ? "bg-white text-[#2d1b14] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" 
                      : "bg-transparent text-[#8b6f5f] hover:text-[#2d1b14]"
                  }`}
                >
                  {t === "chitiet" ? "Chi tiết điểm" : "Tổng kết GPA"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 p-[60px_20px] text-[#8b6f5f]">
              <Loader2 size={24} className="animate-spin text-[#c25450]" />
              <span className="text-[13px] font-semibold">Đang tải dữ liệu điểm…</span>
            </div>
          ) : tab === "chitiet" ? (
            grades.length === 0 ? (
              <div className="p-[48px_24px] text-center">
                <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-[#8b6f5f] text-sm font-semibold">Không có dữ liệu điểm.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="w-full border-collapse text-[13px] min-w-[900px]">
                  <thead>
                    <tr className="bg-[#fff8f5]">
                      {["STT", "Mã MH", "Tên môn học", "TC", "GV", "Điểm thành phần", "TK (H10)", "Chữ", "Kết quả"].map((h, i) => (
                        <th 
                          key={i} 
                          className={`p-[12px_14px] ${i < 3 ? "text-left" : "text-center"} text-[10px] font-extrabold text-[#8b6f5f] uppercase tracking-wider border-b border-[#ead9cb] whitespace-nowrap`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row, i) => (
                      <tr key={i} className={`border-b border-[#f5ede8] ${i % 2 === 0 ? "bg-white" : "bg-[#fffaf8]"} hover:bg-page-bg/30 transition-colors`}>
                        <td className="p-[11px_14px] text-gray-400 font-semibold">{row.stt}</td>
                        <td className="p-[11px_14px] font-bold text-[#c25450] text-[12px] whitespace-nowrap">{row.mamon}</td>
                        <td className="p-[11px_14px] font-bold text-[#2d1b14] max-w-[220px] truncate" title={row.tenmon}>{row.tenmon}</td>
                        <td className="p-[11px_14px] text-center font-bold">{row.sotinchi}</td>
                        <td className="p-[11px_14px] text-center text-[12px] text-gray-500 max-w-[140px] truncate" title={row.giangvien}>{row.giangvien}</td>
                        <td className="p-[11px_14px]">
                          {row.diemThanhPhan.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {row.diemThanhPhan.map((d, idx) => (
                                <span key={idx} className="p-[2px_8px] rounded-full text-[11px] font-semibold bg-[#f5ede8] border border-[#ead9cb] text-[#2d1b14] whitespace-nowrap">
                                  {loaiLabel(d.loai)} ({Math.round(d.heso * 100)}%): <strong className="text-[#c25450] font-bold">{d.giatri}</strong>
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-gray-300 text-[12px] italic">—</span>}
                        </td>
                        <td className="p-[11px_14px] text-center">
                          <span className="text-[15px] font-black" style={{ color: diem10Color(row.diem10) }}>
                            {row.diem10 !== null ? row.diem10.toFixed(2) : "—"}
                          </span>
                        </td>
                        <td className="p-[11px_14px] text-center">
                          <span className={`p-[3px_10px] rounded-full text-[12px] font-extrabold ${
                            row.diemchu ? "bg-[#f5ede8] text-[#c25450]" : "bg-gray-100 text-gray-400"
                          }`}>{row.diemchu ?? "—"}</span>
                        </td>
                        <td className="p-[11px_14px] text-center">
                          {!row.coDiem ? (
                            <span className="text-[11px] text-gray-400">Chưa có</span>
                          ) : row.dat ? (
                            <span className="inline-flex items-center justify-center gap-1">
                              <CheckCircle size={14} className="text-[#059669]" />
                              <span className="text-[11px] font-bold text-[#059669]">Đạt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1">
                              <XCircle size={14} className="text-[#dc2626]" />
                              <span className="text-[11px] font-bold text-[#dc2626]">Không đạt</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── Tab Tổng kết GPA ─────────────────────────────────────────── */
            <div className="p-6 overflow-x-auto">
              <table className="w-full border-collapse text-[13px] min-w-[500px]">
                <thead>
                  <tr className="bg-[#fff8f5]">
                    {["Chỉ số", "Kỳ hiện tại", "Tích lũy toàn khóa"].map((h, i) => (
                      <th 
                        key={i} 
                        className={`p-[12px_16px] ${i === 0 ? "text-left" : "text-center"} text-[11px] font-extrabold text-[#8b6f5f] uppercase tracking-wider border-b border-[#ead9cb]`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "GPA thang 10",        ky: fmt(gpaView?.gpa10_hocky_hientai), tl: fmt(gpaView?.gpa10_tich_luy) },
                    { label: "GPA thang 4",   ky: fmt(gpaView?.gpa4_hocky_hientai),  tl: fmt(gpaView?.gpa4_tich_luy) },
                    { label: "Tín chỉ đăng ký",     ky: String(gpaView?.sotinchi_hocky_hientai ?? 0), tl: String(gpaView?.tong_sotinchi_da_hoc ?? 0) },
                    { label: "Tín chỉ đạt",         ky: String(gpaView?.sotinchi_dat_hocky_hientai ?? 0), tl: String(gpaView?.sotinchi_tich_luy_dat ?? 0) },
                    { label: "Xếp loại (thang 10)", ky: gpaView?.xep_loai_hoc_luc ?? "—", tl: gpaView?.xep_loai_hoc_luc ?? "—" },
                    { label: "Xếp loại (thang 4)",  ky: gpaView?.xep_loai_hoc_luc_he4 ?? "—", tl: gpaView?.xep_loai_hoc_luc_he4 ?? "—" },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-[#f5ede8] ${i % 2 === 0 ? "bg-white" : "bg-[#fffaf8]"} hover:bg-page-bg/30 transition-colors`}>
                      <td className="p-[13px_16px] font-semibold text-gray-500">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-[#c25450] shrink-0" />
                          {row.label}
                        </div>
                      </td>
                      <td className="p-[13px_16px] text-center font-extrabold text-[#2d1b14]">{row.ky}</td>
                      <td className="p-[13px_16px] text-center font-extrabold text-[#c25450]">{row.tl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
