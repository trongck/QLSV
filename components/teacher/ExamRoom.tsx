"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  useTeacherExams,
  type ExamRoomItem,
  type MonitoringData,
  type StudentMonitorItem,
} from "@/hooks/giangvien/useTeacherExams";
import { useTeacherGrades } from "@/hooks/giangvien/useTeacherGrades";
import { apiFetch } from "@/services/service/auth/auth.service";

// ─── Helper ────────────────────────────────────────────────────────────────────

function getStatusBadge(trangthai: StudentMonitorItem["trangthai"]) {
  const map: Record<string, { label: string; style: string }> = {
    ChuaVao:  { label: "Chưa vào",  style: "bg-gray-100 text-gray-500" },
    DangLam:  { label: "Đang làm",  style: "bg-green-100 text-green-700" },
    DaNop:    { label: "Đã nộp",    style: "bg-blue-100 text-blue-700" },
    HetGio:   { label: "Hết giờ",   style: "bg-orange-100 text-orange-700" },
    ViPham:   { label: "Vi phạm",   style: "bg-red-100 text-red-700" },
  };
  return map[trangthai] ?? { label: trangthai, style: "bg-gray-100 text-gray-600" };
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function getExamStatus(exam: ExamRoomItem) {
  const now = new Date();
  const start = new Date(exam.thoigianbatdau);
  const end = new Date(exam.thoigianketthuc);
  if (now < start) return { text: "Sắp tới", color: "#3B82F6", bg: "#EFF6FF" };
  if (now >= start && now < end) return { text: "Đang diễn ra", color: "#16A34A", bg: "#F0FDF4" };
  return { text: "Đã kết thúc", color: "#6B7280", bg: "#F9FAFB" };
}

// ─── Monitoring Panel ─────────────────────────────────────────────────────────

function MonitoringPanel({
  madethi,
  onClose,
  onForceEnd,
}: {
  madethi: number;
  onClose: () => void;
  onForceEnd: () => void;
}) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const { getMonitoringData } = useTeacherExams();

  const fetchData = useCallback(async () => {
    const result = await getMonitoringData(madethi);
    if (result) setData(result);
    setLoading(false);
  }, [madethi]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!data?.exam.thoigianketthuc) return;
    const update = () => {
      const diff = new Date(data.exam.thoigianketthuc).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Đã hết giờ"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [data?.exam.thoigianketthuc]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#2D1B14]/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-[900px] p-6 flex flex-col gap-5 my-4 border border-[#F0E1D9] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-[#6B4F43]">
              Giám sát ca thi
            </h2>
            {data && (
              <p className="m-0 mt-1 text-[13px] text-[#8B6F5F]">
                {data.exam.tieude} — {data.exam.tenmon} ({data.exam.tenlop})
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {timeLeft && (
              <div className="bg-[#FFF8F0] text-[#F2994A] border border-[#FFEAD2] px-3.5 py-1.5 rounded-lg text-[13px] font-bold flex items-center">
                Còn lại: {timeLeft}
              </div>
            )}
            {data && new Date(data.exam.thoigianketthuc) > new Date() && (
              <button
                onClick={onForceEnd}
                className="bg-[#EB5757] hover:bg-red-700 text-white border-none px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Kết thúc ngay
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-[#6B4F43] border border-[#EAD9CB] px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>Đang tải dữ liệu...</div>
        ) : data ? (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Tổng SV", value: data.stats.tongSV, color: "#374151", bg: "#F9FAFB" },
                { label: "Chưa vào", value: data.stats.chuaVao, color: "#6B7280", bg: "#F3F4F6" },
                { label: "Đang làm", value: data.stats.dangLam, color: "#16A34A", bg: "#F0FDF4" },
                { label: "Đã nộp", value: data.stats.daNop, color: "#2563EB", bg: "#EFF6FF" },
                { label: "Hết giờ", value: data.stats.hetGio, color: "#D97706", bg: "#FFFBEB" },
                { label: "Vi phạm", value: data.stats.viPham, color: "#DC2626", bg: "#FEF2F2" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
                  <div className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Students table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left text-gray-500">
                    <th className="py-2 px-3">Họ tên</th>
                    <th className="py-2 px-3">Mã SV</th>
                    <th className="py-2 px-3">Trạng thái</th>
                    <th className="py-2 px-3 min-w-[160px]">Tiến trình</th>
                    <th className="py-2 px-3 text-center">T.Gian nộp</th>
                    <th className="py-2 px-3 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((sv) => {
                    const badge = getStatusBadge(sv.trangthai);
                    return (
                      <tr key={sv.masv} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{sv.hoten}</td>
                        <td className="py-2.5 px-3 text-gray-500">{sv.masv}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 whitespace-nowrap">
                              {sv.trangthai === 'DangLam' ? 'Đang làm...' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 text-[12px]">
                          {sv.thoigiannopbai ? formatDateTime(sv.thoigiannopbai) : "–"}
                        </td>
                        <td className={`py-2.5 px-3 text-center font-bold ${sv.diemtong != null ? "text-green-600" : "text-gray-400"}`}>
                          {sv.diemtong != null ? sv.diemtong : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-10">Không có dữ liệu</div>
        )}
      </div>
    </div>
  );
}

// ─── ExamRoom main ────────────────────────────────────────────────────────────

export function ExamRoom() {
  const {
    loading: examsLoading,
    exams,
    fetchExams,
    createExam,
    endExam,
    forceEndExam,
  } = useTeacherExams();
  const { classes: teacherClasses, loading: classesLoading } = useTeacherGrades();

  const loading = examsLoading || classesLoading;

  const classes = teacherClasses.map((c) => ({
    maphancong: String(c.maphancong),
    tenmon: c.monhoc?.tenmon ?? "",
    tenlop: c.lop?.tenlop ?? "",
    soluongsv: 0,
    hocky: c.hocky
  }));

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"upcoming" | "ended">("upcoming");
  const [monitoringExamId, setMonitoringExamId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTime, setUpdatingTime] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [studentSource, setStudentSource] = useState<"system" | "excel">("system");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [editingExam, setEditingExam] = useState<ExamRoomItem | null>(null);
  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [forceEndReason, setForceEndReason] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form state
  const [newExamData, setNewExamData] = useState({
    maphancong: "", tieude: "", mota: "",
    thoigianlam: 60, thoigianbatdau: "", thoigianketthuc: "", matkhau: ""
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [editTimeData, setEditTimeData] = useState({
    thoigianlam: 60, thoigianbatdau: "", thoigianketthuc: ""
  });

  // ── Phân loại ca thi ─────────────────────────────────────────────────────────
  const now = new Date();
  const upcomingExams = exams.filter((e) => new Date(e.thoigianketthuc) > now);
  const endedExams = exams.filter((e) => new Date(e.thoigianketthuc) <= now);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamData.maphancong) return showToast("Vui lòng chọn lớp học!");
    if (!uploadFile) return showToast("Vui lòng đính kèm tập tin đề thi!");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("maphancong", newExamData.maphancong);
      formData.append("tieude", newExamData.tieude);
      formData.append("mota", newExamData.mota || "");
      formData.append("thoigianlam", newExamData.thoigianlam.toString());
      formData.append("thoigianbatdau", newExamData.thoigianbatdau);
      formData.append("thoigianketthuc", newExamData.thoigianketthuc);
      formData.append("matkhau", newExamData.matkhau || "");
      formData.append("file", uploadFile);
      formData.append("studentSource", studentSource);
      if (studentSource === "excel" && excelFile) formData.append("excelFile", excelFile);

      await createExam(formData);
      setShowCreateModal(false);
      showToast("Tạo ca thi thành công! Thông báo đã được gửi tới sinh viên.");
      setNewExamData({ maphancong: "", tieude: "", mota: "", thoigianlam: 60, thoigianbatdau: "", thoigianketthuc: "", matkhau: "" });
      setUploadFile(null);
    } catch {
      // error shown by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndExam = async (exam: ExamRoomItem) => {
    if (confirm(`Bạn có chắc chắn muốn kết thúc ca thi "${exam.tieude}"?`)) {
      try {
        await endExam(exam.madethi);
        showToast("Ca thi đã kết thúc.");
      } catch { /* handled by hook */ }
    }
  };

  const handleForceEnd = async () => {
    if (!monitoringExamId) return;
    if (!forceEndReason.trim()) {
      showToast("Vui lòng nhập lý do kết thúc ca thi!");
      return;
    }
    
    try {
      const res = await apiFetch(`/api/giangvien/exams/${monitoringExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FORCE_END", lydo: forceEndReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
        setMonitoringExamId(null);
        setShowForceEndModal(false);
        setForceEndReason("");
        showToast("Đã kết thúc ca thi ngay lập tức.");
      } else {
        showToast(json.error || "Không thể kết thúc ca thi");
      }
    } catch {
      showToast("Lỗi khi yêu cầu kết thúc ca thi");
    }
  };

  const openEditTimeModal = (exam: ExamRoomItem) => {
    setEditingExam(exam);
    setEditTimeData({
      thoigianlam: exam.thoigianlam,
      thoigianbatdau: exam.thoigianbatdau ? exam.thoigianbatdau.slice(0, 16) : "",
      thoigianketthuc: exam.thoigianketthuc ? exam.thoigianketthuc.slice(0, 16) : "",
    });
    setShowEditTimeModal(true);
  };

  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    setUpdatingTime(true);
    try {
      const res = await apiFetch(`/api/giangvien/exams/${editingExam.madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TIME",
          thoigianlam: editTimeData.thoigianlam,
          thoigianbatdau: editTimeData.thoigianbatdau,
          thoigianketthuc: editTimeData.thoigianketthuc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
        showToast("Cập nhật thời gian thành công!");
        setShowEditTimeModal(false);
      }
    } catch { /* handled */ } finally {
      setUpdatingTime(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderExamCard = (exam: ExamRoomItem, isUpcoming: boolean) => {
    const status = getExamStatus(exam);
    const isActive = status.text === "Đang diễn ra";
    return (
      <div
        className="bg-white rounded-xl p-4 md:p-5 border border-[#F0E1D9] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Top row */}
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="m-0 text-[15px] font-bold text-[#6B4F43] leading-tight">{exam.tieude}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: status.bg, color: status.color }}>
                {status.text}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block animate-pulse" />
                  <span className="text-green-600 font-semibold">Live</span>
                </span>
              )}
            </div>
            <p className="m-0 mt-1 text-[12px] text-[#8B6F5F]">
              {exam.tenmon} • {exam.tenlop} • {exam.thoigianlam} phút
            </p>
          </div>
          <div className="text-[12px] text-gray-400 text-left md:text-right shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <div>{formatDateTime(exam.thoigianbatdau)}</div>
            <div>→ {formatDateTime(exam.thoigianketthuc)}</div>
          </div>
        </div>

        {/* Actions */}
        {isUpcoming && (
          <div className="flex gap-2 flex-wrap mt-2">
            {isActive && (
              <button
                onClick={() => setMonitoringExamId(exam.madethi)}
                className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-[#EAD9CB] text-[#6B4F43] rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
              >
                Xem thống kê
              </button>
            )}
            <button
              onClick={() => openEditTimeModal(exam)}
              className="px-3.5 py-1.5 bg-gray-50 text-[#6B4F43] border border-[#EAD9CB] rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
            >
              Sửa thời gian
            </button>
            <button
              onClick={() => handleEndExam(exam)}
              className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
            >
              Kết thúc sớm
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── UI ────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="p-6 text-gray-500 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex flex-col gap-5 relative">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-5 py-3 rounded-xl z-[9999] shadow-lg text-sm max-w-[360px] animate-fadeInUp">
          {toastMessage}
        </div>
      )}

      {/* Monitoring Panel */}
      {monitoringExamId && (
        <MonitoringPanel
          madethi={monitoringExamId}
          onClose={() => setMonitoringExamId(null)}
          onForceEnd={() => setShowForceEndModal(true)}
        />
      )}

      {/* Force End Reason Modal */}
      {showForceEndModal && (
        <div className="fixed inset-0 z-[300] bg-[#2D1B14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-[400px] p-6 border border-[#F0E1D9] shadow-xl flex flex-col gap-4">
            <h3 className="m-0 text-lg font-bold text-red-600 flex items-center gap-2">
              Yêu cầu kết thúc ca thi
            </h3>
            <p className="m-0 text-[13.5px] text-[#8B6F5F]">
              Bạn đang yêu cầu đóng ca thi này ngay lập tức. Tất cả bài thi đang làm sẽ bị ép buộc nộp. Vui lòng nhập lý do.
            </p>
            <textarea
              value={forceEndReason}
              onChange={(e) => setForceEndReason(e.target.value)}
              placeholder="Nhập lý do kết thúc (VD: Phát hiện gian lận hàng loạt...)"
              className="w-full p-3 border border-red-200 rounded-lg outline-none focus:border-red-500 min-h-[100px] text-[13px] text-[#6B4F43]"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setShowForceEndModal(false);
                  setForceEndReason("");
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#EAD9CB] text-[#6B4F43] font-semibold rounded-lg text-[13px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleForceEnd}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[13px] border-none cursor-pointer"
              >
                Xác nhận kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3 md:gap-0">
        <div>
          <h2 className="m-0 text-xl font-bold text-[#6B4F43]">Quản lý &amp; Giám sát Thi</h2>
          <p className="m-0 mt-1 text-[13px] text-[#8B6F5F]">Tạo ca thi, phát đề, giám sát sinh viên realtime</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto btn-teacher text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer shadow-md hover:opacity-90 transition-opacity border-none"
        >
          Tạo ca thi mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#F0E1D9] mb-5 overflow-x-auto gap-0 scrollbar-hide">
        {([
          { key: "upcoming", label: `Sắp tới & Đang diễn ra (${upcomingExams.length})` },
          { key: "ended", label: `Đã kết thúc (${endedExams.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 bg-transparent border-none cursor-pointer text-[13px] font-bold whitespace-nowrap mb-[-2px] transition-colors ${
              activeTab === tab.key ? "text-[#cc5c5c] border-b-2 border-[#F2A8A8]" : "text-[#8B6F5F] border-b-2 border-transparent hover:text-[#6B4F43]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-3">
        {activeTab === "upcoming" && (
          upcomingExams.length === 0 ? (
            <div className="bg-white rounded-xl py-12 px-6 text-center border border-dashed border-[#F0E1D9]">
              <p className="text-[#8B6F5F] m-0 text-sm">Không có ca thi sắp tới. Hãy tạo ca thi mới!</p>
            </div>
          ) : upcomingExams.map((exam) => (
            <React.Fragment key={exam.madethi}>
              {renderExamCard(exam, true)}
            </React.Fragment>
          ))
        )}

        {activeTab === "ended" && (
          endedExams.length === 0 ? (
            <div className="bg-white rounded-xl py-12 px-6 text-center border border-dashed border-[#F0E1D9]">
              <p className="text-[#8B6F5F] m-0 text-sm">Chưa có ca thi nào đã kết thúc.</p>
            </div>
          ) : endedExams.map((exam) => (
            <div
              key={exam.madethi}
              className="bg-white rounded-xl p-4 md:p-5 border border-[#F0E1D9] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="m-0 text-sm font-bold text-[#6B4F43]">{exam.tieude}</h3>
                <p className="m-0 mt-1 text-[12px] text-[#8B6F5F]">
                  {exam.tenmon} • {exam.tenlop} • {formatDateTime(exam.thoigianketthuc)}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setMonitoringExamId(exam.madethi)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-[#EAD9CB] text-[#6B4F43] rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
                >
                  Xem thống kê
                </button>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold">Đã kết thúc</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] bg-[#2D1B14]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateExamSubmit}
            className="bg-white p-6 md:p-7 rounded-xl w-full max-w-[480px] flex flex-col gap-4 my-4 border border-[#F0E1D9] shadow-xl"
          >
            <h3 className="m-0 text-lg font-bold text-[#6B4F43]">Thiết lập Ca thi mới</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#8B6F5F]">Lớp học phần *</label>
              <select required value={newExamData.maphancong} onChange={(e) => setNewExamData({ ...newExamData, maphancong: e.target.value })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] bg-white text-[#6B4F43] cursor-pointer">
                <option value="">-- Chọn lớp --</option>
                {classes.filter(c => c.hocky?.danghieuluc).map((c) => (
                  <option key={c.maphancong} value={c.maphancong}>{c.tenmon} - {c.tenlop}</option>
                ))}
              </select>
            </div>

            <div className="bg-[#FFF8F5] p-3.5 rounded-lg border border-[#F0E1D9]">
              <label className="text-[12px] font-bold text-[#6B4F43] block mb-2">Nguồn danh sách sinh viên:</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 text-[13px] text-[#6B4F43]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="studentSource" checked={studentSource === "system"} onChange={() => setStudentSource("system")} className="accent-[#F2A8A8]" />
                  Học sinh thuộc lớp mặc định
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="studentSource" checked={studentSource === "excel"} onChange={() => setStudentSource("excel")} className="accent-[#F2A8A8]" />
                  Tải danh sách riêng (.xlsx)
                </label>
              </div>
              {studentSource === "excel" && (
                <div className="mt-2">
                  <input type="file" required accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)} className="text-[12px] file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#8B6F5F]">Tiêu đề ca thi *</label>
              <input required type="text" placeholder="Ví dụ: Kiểm tra giữa kỳ - Lập trình Web" value={newExamData.tieude} onChange={(e) => setNewExamData({ ...newExamData, tieude: e.target.value })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#8B6F5F]">Thời lượng (phút) *</label>
                <input required type="number" min={5} value={newExamData.thoigianlam} onChange={(e) => setNewExamData({ ...newExamData, thoigianlam: Number(e.target.value) })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#8B6F5F]">Mật khẩu phòng</label>
                <input type="text" placeholder="Bỏ trống nếu không cần" value={newExamData.matkhau} onChange={(e) => setNewExamData({ ...newExamData, matkhau: e.target.value })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#8B6F5F]">Giờ bắt đầu *</label>
                <input required type="datetime-local" value={newExamData.thoigianbatdau} onChange={(e) => setNewExamData({ ...newExamData, thoigianbatdau: e.target.value })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#8B6F5F]">Giờ kết thúc *</label>
                <input required type="datetime-local" value={newExamData.thoigianketthuc} onChange={(e) => setNewExamData({ ...newExamData, thoigianketthuc: e.target.value })} className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#8B6F5F]">File đề thi (Word, PDF, Ảnh) *</label>
              <input required type="file" accept=".docx,.pdf,.txt,image/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="text-[13px] file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
            </div>

            <div className="flex gap-2.5 justify-end mt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F43] text-[13px] cursor-pointer hover:bg-[#FFF2EC] transition-colors">Hủy</button>
              <button type="submit" disabled={submitting} className={`px-5 py-2 rounded-lg border-none btn-teacher text-white font-bold text-[13px] cursor-pointer transition-opacity ${submitting ? 'opacity-70' : 'hover:opacity-90'}`}>
                {submitting ? "Đang tạo..." : "Khởi tạo ca thi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Time Modal ──────────────────────────────────────────────────── */}
      {showEditTimeModal && (
        <div className="fixed inset-0 z-[2000] bg-[#2D1B14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditTimeSubmit}
            className="bg-white p-6 rounded-xl w-full max-w-[420px] flex flex-col gap-4 border border-[#F0E1D9] shadow-xl"
          >
            <h3 className="m-0 text-base font-bold text-[#6B4F43]">Điều chỉnh thời gian thi</h3>

            {[
              { label: "Thời gian làm (phút)", key: "thoigianlam", type: "number" },
              { label: "Giờ bắt đầu", key: "thoigianbatdau", type: "datetime-local" },
              { label: "Giờ kết thúc", key: "thoigianketthuc", type: "datetime-local" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#8B6F5F]">{f.label}</label>
                <input
                  required
                  type={f.type}
                  value={(editTimeData as any)[f.key]}
                  onChange={(e) => setEditTimeData({ ...editTimeData, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                  className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] outline-none focus:border-[#F2A8A8] text-[#6B4F43]"
                />
              </div>
            ))}

            <div className="flex gap-2.5 justify-end mt-2">
              <button type="button" onClick={() => setShowEditTimeModal(false)} className="px-4 py-2 rounded-lg border border-[#EAD9CB] bg-white text-[13px] cursor-pointer hover:bg-[#FFF2EC] transition-colors text-[#6B4F43]">Hủy</button>
              <button type="submit" disabled={updatingTime} className={`px-5 py-2 rounded-lg border-none btn-teacher text-white font-bold text-[13px] cursor-pointer transition-colors ${updatingTime ? 'opacity-70' : 'hover:opacity-90'}`}>
                {updatingTime ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}