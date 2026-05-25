"use client";

import React, { useState, useEffect } from "react";
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mahocky, setMahocky] = useState<string>("all");
  const {
    grades,
    gpaView,
    hocKyList,
    loading,
  } = useStudentGrades(mahocky);
  const [tab, setTab] = useState<"chitiet" | "tongket">("chitiet");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

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
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 0" }}>

        {/* ── Thông tin sinh viên ─────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg,#fff8f5 0%,#fff 100%)",
          borderRadius: 20, border: "1px solid #ead9cb",
          padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg,#c25450,#a8443f)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 12px rgba(194,84,80,0.3)",
            }}>
              <GraduationCap size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2d1b14", lineHeight: 1.2 }}>
                {loading ? "…" : (gpaView?.hoten ?? user.hoten ?? "—")}
              </div>
              <div style={{ fontSize: 12, color: "#8b6f5f", marginTop: 2 }}>
                Mã SV: <strong style={{ color: "#c25450" }}>{gpaView?.masv ?? user.maSinhVien ?? "—"}</strong>
              </div>
            </div>
          </div>
          <div className="grades-info-row">
            <InfoCard icon={<Mail size={16} />} label="Email trường" value={loading ? "…" : (gpaView?.emailtruong ?? "—")} />
            <InfoCard icon={<Users size={16} />} label="Lớp" value={loading ? "…" : (gpaView?.tenlop ?? gpaView?.malop ?? "—")} />
          </div>
        </div>

        {/* ── Bộ lọc học kỳ ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          background: "#fff", borderRadius: 16, padding: "12px 20px", border: "1px solid #ead9cb",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#8b6f5f" }}>Học kỳ:</span>
          <select
            id="select-hocky"
            value={mahocky}
            onChange={(e) => setMahocky(e.target.value)}
            style={{
              padding: "7px 14px", borderRadius: 10, border: "1px solid #ead9cb",
              fontSize: 13, fontWeight: 600, color: "#2d1b14", background: "#fff8f5", cursor: "pointer",
            }}
          >
            <option value="all">Tất cả học kỳ</option>
            {hocKyList.map((hk) => (
              <option key={hk.mahocky} value={hk.mahocky}>
                {hk.tenhocky}{hk.danghieuluc ? " ★ (hiện tại)" : ""}
              </option>
            ))}
          </select>
          {gpaView && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#8b6f5f" }}>
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
            sub={`/ ${gpaView?.tong_sotinchi_da_hoc ?? 0} TC đã học`}
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
            <div key={i} style={{
              borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center",
              gap: 16, background: item.style.bg, border: `1px solid ${item.style.border}`,
            }}>
              <div style={{ color: item.style.dot }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: item.style.text, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: item.style.text }}>{item.value ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bảng điểm ───────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #ead9cb", overflow: "hidden", minWidth: 0 }}>
          {/* Header + Tab */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 0", borderBottom: "1px solid #ead9cb", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#2d1b14", margin: 0 }}>Bảng điểm chi tiết</h2>
              <p style={{ fontSize: 12, color: "#8b6f5f", margin: "2px 0 0" }}>
                {mahocky === "all" ? "Tất cả học kỳ" : hocKyList.find((h) => String(h.mahocky) === mahocky)?.tenhocky}
                {" · "}{grades.length} môn
              </p>
            </div>
            <div style={{ display: "flex", gap: 4, background: "#f5ede8", padding: 4, borderRadius: 12, marginBottom: 4 }}>
              {(["chitiet", "tongket"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "6px 18px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#2d1b14" : "#8b6f5f",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                  {t === "chitiet" ? "Chi tiết điểm" : "Tổng kết GPA"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 20px", color: "#8b6f5f" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#c25450" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Đang tải dữ liệu điểm…</span>
            </div>
          ) : tab === "chitiet" ? (
            grades.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <BookOpen size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "#8b6f5f", fontSize: 14, fontWeight: 600 }}>Không có dữ liệu điểm.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fff8f5" }}>
                      {["STT", "Mã MH", "Tên môn học", "TC", "GV", "Điểm thành phần", "TK (H10)", "Chữ", "Kết quả"].map((h, i) => (
                        <th key={i} style={{
                          padding: "12px 14px", textAlign: i < 3 ? "left" : "center",
                          fontSize: 10, fontWeight: 800, color: "#8b6f5f",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          borderBottom: "1px solid #ead9cb", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f5ede8", background: i % 2 === 0 ? "#fff" : "#fffaf8" }}>
                        <td style={{ padding: "11px 14px", color: "#9ca3af", fontWeight: 600 }}>{row.stt}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "#c25450", fontSize: 12, whiteSpace: "nowrap" }}>{row.mamon}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "#2d1b14", maxWidth: 220 }}>{row.tenmon}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700 }}>{row.sotinchi}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", fontSize: 12, color: "#6b7280", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.giangvien}</td>
                        <td style={{ padding: "11px 14px" }}>
                          {row.diemThanhPhan.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {row.diemThanhPhan.map((d, idx) => (
                                <span key={idx} style={{
                                  padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                  background: "#f5ede8", border: "1px solid #ead9cb", color: "#2d1b14", whiteSpace: "nowrap",
                                }}>
                                  {loaiLabel(d.loai)} ({Math.round(d.heso * 100)}%): <strong style={{ color: "#c25450" }}>{d.giatri}</strong>
                                </span>
                              ))}
                            </div>
                          ) : <span style={{ color: "#d1d5db", fontSize: 12, fontStyle: "italic" }}>—</span>}
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: diem10Color(row.diem10) }}>
                            {row.diem10 !== null ? row.diem10.toFixed(2) : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                            background: row.diemchu ? "#f5ede8" : "#f3f4f6",
                            color: row.diemchu ? "#c25450" : "#9ca3af",
                          }}>{row.diemchu ?? "—"}</span>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          {!row.coDiem ? (
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>Chưa có</span>
                          ) : row.dat ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <CheckCircle size={14} color="#059669" />
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Đạt</span>
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <XCircle size={14} color="#dc2626" />
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>Không đạt</span>
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
            <div style={{ padding: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fff8f5" }}>
                    {["Chỉ số", "Kỳ hiện tại", "Tích lũy toàn khóa"].map((h, i) => (
                      <th key={i} style={{
                        padding: "12px 16px", textAlign: i === 0 ? "left" : "center",
                        fontSize: 11, fontWeight: 800, color: "#8b6f5f",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        borderBottom: "1px solid #ead9cb",
                      }}>{h}</th>
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
                    <tr key={i} style={{ borderBottom: "1px solid #f5ede8", background: i % 2 === 0 ? "#fff" : "#fffaf8" }}>
                      <td style={{ padding: "13px 16px", fontWeight: 600, color: "#6b7280" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Award size={14} color="#c25450" />
                          {row.label}
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", fontWeight: 800, color: "#2d1b14" }}>{row.ky}</td>
                      <td style={{ padding: "13px 16px", textAlign: "center", fontWeight: 800, color: "#c25450" }}>{row.tl}</td>
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
