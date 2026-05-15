"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, TrendingUp, UserCheck, UserX, Clock, RefreshCw } from "lucide-react";
import AttendanceActions, {
  type CurrentSession,
  type HocKyItem,
} from "@/components/student/AttendanceActions";
import AttendanceModal from "@/components/student/AttendanceModal";
import { apiFetch } from "@/services/auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  madiemdanh: number;
  mabuoihoc: number;
  ngayhoc: string;
  day: string;
  month: string;
  tenmon: string;
  giangvien: string;
  phonghoc: string;
  gioVao: string;
  gioRa: string;
  thoigiandiemdanh: string | null;
  trangthai: "Comat" | "Vangmat" | "Dimuon" | "Cophep";
  ghichu: string | null;
}

interface AttendanceStats {
  total: number;
  comat: number;
  vangmat: number;
  dimuon: number;
  cophep: number;
  tilechuyencan: number;
}

interface ApiResponse {
  hocKyList: HocKyItem[];
  mahocky: number;
  hocKy: HocKyItem | null;
  stats: AttendanceStats;
  currentSession: CurrentSession | null;
  history: AttendanceRecord[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceRecord["trangthai"],
  { label: string; bg: string; text: string; dot: string }
> = {
  Comat:   { label: "Có mặt",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Dimuon:  { label: "Đi muộn", bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"  },
  Cophep:  { label: "Có phép", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"   },
  Vangmat: { label: "Vắng",    bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mahocky, setMahocky] = useState<number | null>(null);
  const [filter, setFilter] = useState<"month" | "semester">("semester");
  const [modalMode, setModalMode] = useState<"qr" | "face" | null>(null);
  const [noSessionAlert, setNoSessionAlert] = useState(false);

  // ── Fetch dữ liệu từ API ──────────────────────────────────────────────────
  const fetchData = useCallback(async (selectedMahocky?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedMahocky) params.set("mahocky", String(selectedMahocky));

      const res = await apiFetch(`/api/student/attendance?${params}`);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Lọc lịch sử theo tháng hoặc học kỳ ──────────────────────────────────
  const filteredHistory = (() => {
    if (!data?.history) return [];
    if (filter === "semester") return data.history;
    const now = new Date();
    return data.history.filter((r) => {
      const d = new Date(r.ngayhoc);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSemesterChange(id: number) {
    setMahocky(id);
    fetchData(id);
  }

  function handleAttendSuccess() {
    fetchData(mahocky ?? undefined);
  }

  function handleAttend(mode: "qr" | "face") {
    setModalMode(mode); // Luôn mở modal
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full p-8 min-h-screen bg-gray-50/50">
        <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <RefreshCw size={16} /> Thử lại
        </button>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-8 w-full p-8 bg-gray-50/50 min-h-screen">

      {/* No-session alert */}
      {noSessionAlert && (
        <div
          className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl"
          style={{ animation: "slideDown 0.25s ease" }}
        >
          <span>⚠️</span> Không có buổi học nào đang mở điểm danh
        </div>
      )}

      {/* ── HEADER + ACTIONS ── */}
      <AttendanceActions
        hocKyList={data?.hocKyList ?? []}
        mahocky={mahocky ?? data?.mahocky ?? 0}
        hocKy={data?.hocKy ?? null}
        currentSession={data?.currentSession ?? null}
        filter={filter}
        onFilterChange={setFilter}
        onSemesterChange={handleSemesterChange}
        onAttend={handleAttend}
      />

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        {/* Tỉ lệ chuyên cần */}
        <div
          className="col-span-2 md:col-span-1 p-5 rounded-2xl text-white flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={20} className="text-white/80" />
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">Tỉ lệ</span>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats?.tilechuyencan ?? 0}%</p>
            <p className="text-white/70 text-xs mt-1">Chuyên cần</p>
          </div>
        </div>

        {/* Có mặt */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <UserCheck size={18} className="text-emerald-500" />
            <span className="text-xs font-semibold text-gray-400">Buổi</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats?.comat ?? 0) + (stats?.dimuon ?? 0) + (stats?.cophep ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Có mặt</p>
          </div>
        </div>

        {/* Vắng mặt */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <UserX size={18} className="text-red-400" />
            <span className="text-xs font-semibold text-gray-400">Buổi</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.vangmat ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Vắng mặt</p>
          </div>
        </div>

        {/* Có phép */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-blue-400" />
            <span className="text-xs font-semibold text-gray-400">Buổi</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.cophep ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Có phép</p>
          </div>
        </div>
      </div>

      {/* ── LỊCH SỬ ĐIỂM DANH ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">
            Lịch sử điểm danh
            {filteredHistory.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({filteredHistory.length} buổi)
              </span>
            )}
          </h2>
          <button
            onClick={() => fetchData(mahocky ?? undefined)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            <RefreshCw size={12} /> Làm mới
          </button>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-5xl">📋</div>
            <p className="text-gray-500 font-medium">Chưa có lịch sử điểm danh</p>
            <p className="text-gray-400 text-sm">
              {filter === "month" ? "Trong tháng này chưa có buổi nào." : "Trong học kỳ này chưa có buổi nào."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredHistory.map((record) => {
              const cfg = STATUS_CONFIG[record.trangthai] ?? STATUS_CONFIG.Comat;
              return (
                <div
                  key={record.madiemdanh}
                  className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Date badge */}
                    <div className="bg-gray-50 px-3 py-2.5 rounded-xl text-center border border-gray-100 flex-shrink-0 min-w-[52px]">
                      <span className="text-lg font-bold text-gray-800 block">{record.day}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{record.month}</span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{record.tenmon}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-3">
                        <span>⏰ {record.gioVao}–{record.gioRa}</span>
                        <span>📍 {record.phonghoc}</span>
                        {record.giangvien && <span>👤 {record.giangvien}</span>}
                      </p>
                      {record.ghichu && (
                        <p className="text-[11px] text-gray-400 mt-0.5 italic">{record.ghichu}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ĐIỂM DANH ── */}
      {modalMode && (
        <AttendanceModal
          mode={modalMode}
          session={data?.currentSession ?? null}
          onClose={() => setModalMode(null)}
          onSuccess={handleAttendSuccess}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
