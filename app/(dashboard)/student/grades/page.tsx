"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, RefreshCw, TrendingUp, BookOpen, Award, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/services/service/auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiemThanhPhan {
  loai: string;
  giatri: number;
  heso: number;
}

interface GradeRow {
  stt: number;
  mamon: string;
  malophoc: string;
  tenmon: string;
  sotinchi: number;
  giangvien: string;
  diem10: number | null;
  diem4: number | null;
  diemchu: string | null;
  ketqua: string | null;
  dat: boolean;
  coDiem: boolean;
  diemThanhPhan: DiemThanhPhan[];
}

interface GradeSummary {
  gpa: number | null;
  totalTinchi: number;
  totalTinchiDat: number;
  soMon: number;
  soMonDat: number;
  soMonKhongDat: number;
  gpaThongKe: number | null;
  tinchiThongKe: number | null;
  tilechuyencan: number | null;
}

interface HocKyItem {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  danghieuluc: boolean;
}

interface ApiResponse {
  hocKyList: HocKyItem[];
  mahocky: number;
  hocKy: HocKyItem | null;
  grades: GradeRow[];
  summary: GradeSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOAI_DIEM_LABEL: Record<string, string> = {
  ChuyenCan: "Chuyên cần",
  GiuaKy: "Giữa kỳ",
  CuoiKy: "Cuối kỳ",
  Thuchanh: "Thực hành",
  Tieuluan: "Tiểu luận",
  Khac: "Khác",
};

function gradeColor(diem: number | null): string {
  if (diem === null) return "text-gray-400";
  if (diem >= 8.5) return "text-emerald-600 font-bold";
  if (diem >= 7.0) return "text-blue-600 font-semibold";
  if (diem >= 5.5) return "text-amber-600 font-semibold";
  return "text-red-600 font-bold";
}

function gpaColor(gpa: number | null): string {
  if (gpa === null) return "text-gray-400";
  if (gpa >= 3.6) return "text-emerald-600";
  if (gpa >= 3.0) return "text-blue-600";
  if (gpa >= 2.0) return "text-amber-600";
  return "text-red-600";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentGradesPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mahocky, setMahocky] = useState<number | null>(null);
  const [semesterOpen, setSemesterOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (selectedMahocky?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedMahocky) params.set("mahocky", String(selectedMahocky));
      const res = await apiFetch(`/api/student/grades?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Lỗi tải dữ liệu.");
      }
      const json: ApiResponse = await res.json();
      setData(json);
      setMahocky(json.mahocky);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p className="text-gray-500 text-sm">Đang tải kết quả học tập...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <RefreshCw size={15} /> Thử lại
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const grades = data?.grades ?? [];
  const hk = data?.hocKy;
  const displayGpa = summary?.gpaThongKe ?? summary?.gpa;
  const displayTinchi = summary?.tinchiThongKe ?? summary?.totalTinchiDat;

  return (
    <div className="flex flex-col gap-6 w-full p-6 bg-gray-50/50 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kết quả học tập</h1>
          <p className="text-gray-500 text-sm mt-1">Bảng điểm chi tiết theo từng học kỳ</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown học kỳ */}
          <div className="relative">
            <button
              onClick={() => setSemesterOpen(!semesterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 shadow-sm transition"
            >
              <span>
                {hk ? `HK${hk.ky} – ${hk.namhoc}–${hk.namhoc + 1}` : "Chọn học kỳ"}
              </span>
              <ChevronDown size={15} className={`transition-transform ${semesterOpen ? "rotate-180" : ""}`} />
            </button>

            {semesterOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] overflow-hidden">
                {(data?.hocKyList ?? []).map((h) => (
                  <button
                    key={h.mahocky}
                    onClick={() => { setMahocky(h.mahocky); fetchData(h.mahocky); setSemesterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition ${h.mahocky === mahocky ? "font-semibold text-indigo-600 bg-indigo-50" : "text-gray-700"
                      }`}
                  >
                    <span>HK{h.ky} – {h.namhoc}–{h.namhoc + 1}</span>
                    {h.danghieuluc && (
                      <span className="text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">
                        Hiện tại
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => fetchData(mahocky ?? undefined)}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 shadow-sm transition"
            title="Làm mới"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* GPA */}
        <div
          className="col-span-2 md:col-span-1 p-5 rounded-2xl text-white flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={20} className="text-white/80" />
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">GPA</span>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {displayGpa !== null && displayGpa !== undefined ? displayGpa.toFixed(2) : "---"}
            </p>
            <p className="text-white/70 text-xs mt-1">Điểm trung bình tích lũy</p>
          </div>
        </div>

        {/* Tín chỉ đạt */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <Award size={18} className="text-emerald-500" />
            <span className="text-xs font-semibold text-gray-400">TC</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{displayTinchi ?? "---"}</p>
            <p className="text-xs text-gray-500 mt-1">Tín chỉ đạt</p>
          </div>
        </div>

        {/* Số môn */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <BookOpen size={18} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-400">Môn</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{summary?.soMon ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              Đạt: <span className="text-emerald-600 font-semibold">{summary?.soMonDat ?? 0}</span>
              {" / "}
              Chưa: <span className="text-red-500 font-semibold">{summary?.soMonKhongDat ?? 0}</span>
            </p>
          </div>
        </div>

        {/* Chuyên cần */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 size={18} className="text-amber-500" />
            <span className="text-xs font-semibold text-gray-400">%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {summary?.tilechuyencan !== null && summary?.tilechuyencan !== undefined
                ? `${summary.tilechuyencan}%`
                : "---"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Chuyên cần</p>
          </div>
        </div>
      </div>

      {/* ── BẢNG ĐIỂM ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">
            {hk ? `Học kỳ ${hk.ky} – Năm học ${hk.namhoc}–${hk.namhoc + 1}` : "Bảng điểm"}
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({grades.length} môn)
            </span>
          </h2>
        </div>

        {grades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">📊</div>
            <p className="text-gray-500 font-medium">Chưa có dữ liệu điểm</p>
            <p className="text-gray-400 text-sm">Điểm sẽ được cập nhật sau khi giảng viên nhập</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-10">STT</th>
                  <th className="py-3 px-3 text-left">Mã MH</th>
                  <th className="py-3 px-3 text-center">Nhóm</th>
                  <th className="py-3 px-4 text-left">Tên môn học</th>
                  <th className="py-3 px-4 text-center">TC</th>
                  <th className="py-3 px-4 text-center">Điểm (10)</th>
                  <th className="py-3 px-4 text-center">Điểm (4)</th>
                  <th className="py-3 px-4 text-center">Điểm chữ</th>
                  <th className="py-3 px-4 text-center">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((row) => (
                  <React.Fragment key={row.stt}>
                    <tr
                      key={row.stt}
                      className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === row.stt ? null : row.stt)}
                    >
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">{row.stt}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-indigo-600 text-xs">{row.mamon}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-500 text-sm">{row.malophoc}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{row.tenmon}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{row.giangvien}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">{row.sotinchi}</td>
                      <td className={`py-3.5 px-4 text-center text-base ${row.coDiem ? gradeColor(row.diem10) : "text-gray-300"}`}>
                        {row.diem10 !== null ? row.diem10.toFixed(1) : <span className="text-gray-200 text-sm">—</span>}
                      </td>
                      <td className={`py-3.5 px-4 text-center ${row.coDiem ? gradeColor(row.diem10) : "text-gray-300"}`}>
                        {row.diem4 !== null ? row.diem4.toFixed(1) : <span className="text-gray-200 text-sm">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.diemchu ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${row.dat ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                            {row.diemchu}
                          </span>
                        ) : (
                          <span className="text-gray-200 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {!row.coDiem ? (
                          <span className="text-red-400 text-lg font-bold" title="Chưa có điểm">×</span>
                        ) : row.ketqua === "ChoCham" ? (
                          <span className="text-xs text-gray-400 italic">Chưa chấm</span>
                        ) : row.dat ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">✓ Đạt</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">✗ Chưa đạt</span>
                        )}
                      </td>
                    </tr>

                    {/* Điểm thành phần (expandable) */}
                    {expandedRow === row.stt && row.diemThanhPhan.length > 0 && (
                      <tr key={`detail-${row.stt}`} className="bg-indigo-50/40 border-t border-indigo-100">
                        <td colSpan={9} className="px-6 py-3">
                          <div className="flex flex-wrap gap-3">
                            <span className="text-xs font-semibold text-indigo-600 mr-2">Điểm thành phần:</span>
                            {row.diemThanhPhan.map((d, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                                <span className="text-gray-500">{LOAI_DIEM_LABEL[d.loai] ?? d.loai}</span>
                                <span className="text-gray-300">·</span>
                                <span className={`font-bold ${d.giatri >= 5 ? "text-emerald-600" : "text-red-500"}`}>
                                  {d.giatri.toFixed(1)}
                                </span>
                                <span className="text-gray-400 text-[10px]">(hệ số {d.heso})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {expandedRow === row.stt && row.diemThanhPhan.length === 0 && (
                      <tr key={`detail-empty-${row.stt}`} className="bg-gray-50/60 border-t border-gray-100">
                        <td colSpan={9} className="px-6 py-2.5 text-xs text-gray-400 italic">
                          Chưa có điểm thành phần
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>


            </table>
          </div>
        )}
      </div>
    </div>
  );
}
