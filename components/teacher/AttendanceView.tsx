"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTeacherAttendance } from "@/hooks/giangvien/useTeacherAttendance";

// Lazy-load thư viện nhận diện khuôn mặt AI (~2MB) chỉ khi giảng viên nhấn nút mở camera
const FaceAttendanceModal = dynamic(
  () => import("./FaceAttendanceModal").then((mod) => mod.FaceAttendanceModal),
  { ssr: false }
);

type SubTab = "list" | "qrcode" | "leave_requests";

export function AttendanceView() {
  const [subTab, setSubTab] = useState<SubTab>("list");
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    loading,
    classes,
    allSessions,
    leaveRequests,
    roster,
    selectedPC,
    setSelectedPC,
    selectedBH,
    setSelectedBH,
    selectedDate,
    setSelectedDate,
    fetchOverview,
    createSession,
    refreshQR: handleRefreshQR,
    updateStatus: handleStatusChange,
    updateNote: handleNoteChange,
    approveLeave: handleApproveLeave,
    rejectLeave: handleRejectLeave,
    endSession,
  } = useTeacherAttendance();

  // Kiểm tra ngày chọn có lịch dạy không
  const activeClass = classes.find(c => c.maphancong === selectedPC);
  const isScheduledDay = (() => {
    if (!activeClass || !activeClass.lichDay || activeClass.lichDay.length === 0) return true; // fallback
    const jsDay = new Date(selectedDate).getDay();
    const dbDay = jsDay === 0 ? 8 : jsDay + 1;
    return activeClass.lichDay.includes(dbDay);
  })();

  // Kiểm tra ngày chọn có vượt quá ngày kết thúc của lớp học phần không
  const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isClassEnded = activeClass?.ngayketthuc ? selectedDate > activeClass.ngayketthuc : false;
  const isClassEndedOverall = activeClass?.ngayketthuc ? todayStr > activeClass.ngayketthuc : false;

  // Filter sessions matching selected class (maphancong)
  const classSessions = allSessions.filter((s) => {
    return s.maphancong === selectedPC;
  });

  const filteredRoster = roster.filter(r => 
    r.mssv.includes(searchQuery) || r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSession = () => {
    createSession();
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-[#8B6F5F]">
        Đang tải dữ liệu điểm danh...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Quản lý Điểm danh lớp học</h2>
          <p className="text-[13px] text-[#8B6F5F] mt-1 mb-0">Ghi nhận trạng thái tham gia lớp học phần và duyệt phép vắng học</p>
        </div>
        <div className="flex gap-2.5 w-full md:w-auto">
          <button 
            onClick={() => fetchOverview(false)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F43] cursor-pointer text-[13px] font-semibold hover:bg-gray-50 transition-colors"
          >
             Làm mới
          </button>
          {!selectedBH && selectedPC && !isClassEnded && (
            <button 
              onClick={handleCreateSession}
              disabled={!isScheduledDay}
              className={`flex-1 md:flex-none px-5 py-2.5 border-none rounded-lg text-white text-[13.5px] font-semibold transition-opacity whitespace-nowrap ${
                isScheduledDay 
                  ? "btn-teacher cursor-pointer hover:opacity-90" 
                  : "bg-gray-300 cursor-not-allowed opacity-60"
              }`}
            >
             Tạo ca điểm danh ngày này
            </button>
          )}
          {selectedBH && (
            (() => {
              const currentSession = allSessions.find(s => s.mabuoihoc === selectedBH);
              if (currentSession && currentSession.trangthai !== "Hoanthanh") {
                return (
                  <button 
                    onClick={() => endSession()}
                    className="flex-1 md:flex-none bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 border-none rounded-lg text-white text-[13.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                   Kết thúc ca điểm danh
                  </button>
                );
              }
              return null;
            })()
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex flex-col gap-2">
        <div className="card p-4 flex flex-col md:flex-row gap-4 items-center border border-[#F0E1D9]">
          <select 
            value={selectedPC || ""} 
            onChange={(e) => setSelectedPC(Number(e.target.value))}
            className="w-full md:w-[260px] p-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[#6B4F43] text-[13px] focus:border-[#F2A8A8] transition-colors bg-white"
          >
            {classes.map((c) => (
              <option key={c.maphancong} value={c.maphancong}>
                {c.malophoc} - {c.tenmon} ({c.tenlop})
              </option>
            ))}
          </select>
          
          <input 
            type="date" 
            value={selectedDate}
            max={todayStr}
            min={activeClass?.ngaybatdau || undefined}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-auto p-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[#6B4F43] focus:border-[#F2A8A8] transition-colors"
          />
          
          <div className="flex-1 w-full relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors" 
            />
          </div>
        </div>
        {isClassEnded && (
          <p className="text-red-500 text-xs m-0 px-2 font-semibold">
             Lớp học phần này đã kết thúc lịch dạy. Không thể tạo ca điểm danh mới.
          </p>
        )}
        {isClassEndedOverall && !isClassEnded && (
          <p className="text-amber-600 text-xs m-0 px-2 font-semibold">
             Lớp học phần đã kết thúc lịch giảng dạy (Chỉ cho phép điểm danh bù cho các ngày trong quá khứ).
          </p>
        )}
        {!isClassEnded && !isScheduledDay && (
          <p className="text-red-500 text-xs m-0 px-2 font-semibold">
             Lớp học phần này không có lịch dạy vào thứ được chọn. Bạn không thể tạo ca điểm danh cho ngày này.
          </p>
        )}
      </div>

      {/* ATTENDANCE SHEET TABLE & TABS CARD */}
      <section className="card p-0 overflow-hidden border border-[#F0E1D9]">
        
        {/* Navigation Tabs Header */}
        <div className="px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F0E1D9] bg-[#FDF8F5]">
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button 
              onClick={() => setSubTab("list")}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
                subTab === "list" ? "bg-[#C0392B] text-white border-none" : "bg-white text-[#6B4F43] border border-[#EAD9CB]"
              }`}
            >
              Danh sách điểm danh
            </button>
            <button 
              onClick={() => setSubTab("qrcode")}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
                subTab === "qrcode" ? "bg-[#C0392B] text-white border-none" : "bg-white text-[#6B4F43] border border-[#EAD9CB]"
              }`}
            >
              QR Code
            </button>
            <button 
              onClick={() => setSubTab("leave_requests")}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer flex items-center gap-2 transition-all ${
                subTab === "leave_requests" ? "bg-[#C0392B] text-white border-none" : "bg-white text-[#6B4F43] border border-[#EAD9CB]"
              }`}
            >
              Đơn xin nghỉ học
              {leaveRequests.filter(r => r.status === "Chờ duyệt").length > 0 && (
                <span className="bg-[#EB5757] text-white text-[10px] px-1.5 py-px rounded-full font-bold">
                  {leaveRequests.filter(r => r.status === "Chờ duyệt").length}
                </span>
              )}
            </button>
          </div>
          {subTab === "list" && selectedBH && (
            <button
              onClick={() => setIsFaceModalOpen(true)}
              className="w-full md:w-auto px-4 py-2 rounded-lg border-none btn-teacher text-[#2D1B14] text-[13px] font-bold cursor-pointer shadow-[0_4px_12px_rgba(242,168,168,0.3)] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Điểm danh khuôn mặt
            </button>
          )}
        </div>

        {/* ================= VIEW 1: ACTIVE STUDENT CHECKLIST ================= */}
        {subTab === "list" && (
          <div className="p-2.5 md:p-5">
            {!selectedBH ? (
              <div className="p-10 text-center text-[#8B6F5F]">
                <p className="m-0 text-sm font-semibold">
                  {isScheduledDay 
                    ? "Ngày này chưa có ca học nào được kích hoạt." 
                    : "Lớp học phần này không có lịch dạy học vào ngày này."}
                </p>
                {isScheduledDay && (
                  <button 
                    onClick={handleCreateSession}
                    className="mt-4 px-5 py-2.5 bg-[#C0392B] text-white border-none rounded-lg font-semibold cursor-pointer hover:bg-[#eb9d9d] transition-colors"
                  >
                    Kích hoạt ca điểm danh mới
                  </button>
                )}
              </div>
            ) : filteredRoster.length === 0 ? (
              <p className="text-center p-8 text-[#8B6F5F]">Không tìm thấy sinh viên nào</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F0E1D9]">
                      <th className="p-3 text-[13px] text-[#8B6F5F]">Mã SV</th>
                      <th className="p-3 text-[13px] text-[#8B6F5F]">Họ và tên</th>
                      <th className="p-3 text-[13px] text-[#8B6F5F]">Trạng thái điểm danh</th>
                      <th className="p-3 text-[13px] text-[#8B6F5F]">Thời gian</th>
                      <th className="p-3 text-[13px] text-[#8B6F5F]">Ghi chú nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.map((row) => (
                      <tr key={row.mssv} className="border-b border-[#F9F9F9] hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-[13px]">{row.mssv}</td>
                        <td className="p-3 text-sm font-semibold text-[#6B4F43]">{row.name}</td>
                        <td className="p-3">
                          <select
                            value={row.status}
                            onChange={(e) => handleStatusChange(row.mssv, e.target.value)}
                            className={`px-3 py-1.5 rounded-md border-[1.5px] font-bold text-xs outline-none cursor-pointer ${
                              row.type === "red" ? "border-[#FCD4D4] bg-[#FFF5F5] text-[#EB5757]" : 
                              row.type === "orange" ? "border-[#FFEAD2] bg-[#FFFBF7] text-[#F2994A]" : 
                              "border-[#D1F7E9] bg-[#F4FDF9] text-[#178A57]"
                            }`}
                          >
                            <option value="Có mặt">Có mặt</option>
                            <option value="Vắng">Vắng</option>
                            <option value="Đi muộn">Đi muộn</option>
                            <option value="Vắng có phép">Vắng có phép</option>
                          </select>
                        </td>
                        <td className="p-3 text-[13px]">{row.time}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.note === "-" ? "" : row.note}
                            placeholder="Nhập ghi chú..."
                            onChange={(e) => handleNoteChange(row.mssv, e.target.value || "-")}
                            className="w-[180px] md:w-[200px] px-2.5 py-1.5 rounded-md border border-[#EAD9CB] text-[12.5px] outline-none focus:border-[#F2A8A8] transition-colors bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: DYNAMIC QR CODE SIMULATOR ================= */}
        {subTab === "qrcode" && (
          <div className="py-10 px-5 flex flex-col items-center justify-center gap-4">
            {!selectedBH ? (
              <div className="p-5 text-center text-[#8B6F5F]">
                <p className="m-0 text-sm font-semibold">Vui lòng kích hoạt ca điểm danh cho ngày này trước khi sử dụng mã QR.</p>
              </div>
            ) : (() => {
              const currentSession = allSessions.find(s => s.mabuoihoc === selectedBH);
              const qrSecret = currentSession?.qr_secret;
              
              if (!qrSecret) {
                return (
                  <div className="p-5 text-center text-[#8B6F5F] flex flex-col gap-3 items-center">
                    <p className="m-0 text-sm font-semibold">Buổi học này chưa được tạo mã QR điểm danh.</p>
                    <button 
                      onClick={handleRefreshQR}
                      className="btn-teacher px-5 py-2 border-none rounded-lg text-white text-[13.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Tạo Mã QR điểm danh
                    </button>
                  </div>
                );
              }

              const qrData = `qlsv-attendance:${selectedBH}:${qrSecret}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=6B4F43&bgcolor=FDF8F5&data=${encodeURIComponent(qrData)}`;

              return (
                <>
                  <div className="p-5 bg-white border-[1.5px] border-[#F0E1D9] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.05)] flex justify-center items-center">
                    <img 
                      src={qrUrl} 
                      alt="Attendance QR Code" 
                      className="w-[180px] h-[180px] block" 
                    />
                  </div>
                  <div className="text-center flex flex-col gap-2 items-center">
                    <h4 className="my-1 text-[#6B4F43] font-bold">Mã QR quét điểm danh lớp học</h4>
                    <p className="m-0 text-[12.5px] text-[#8B6F5F]">
                      Mã QR điểm danh cố định được lưu trữ bảo mật trên hệ thống.
                    </p>
                    <button 
                      onClick={handleRefreshQR}
                      className="mt-2 px-4 py-2 rounded-lg border-[1.5px] border-[#EAD9CB] bg-white text-[#6B4F43] font-semibold text-[12.5px] cursor-pointer flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Tạo lại Mã QR mới
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ================= VIEW 3: LEAVE REQUESTS INBOX ================= */}
        {subTab === "leave_requests" && (
          <div className="p-5 flex flex-col gap-4">
            
            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center text-[#8B6F5F]">
                Không có đơn xin nghỉ học nào.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {leaveRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className={`card p-5 border border-[#F0E1D9] flex flex-col gap-3 transition-colors ${
                      req.status === "Chờ duyệt" ? "bg-[#FFFDFB]" : "bg-white"
                    }`}
                  >
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start border-b border-[#F0E1D9] pb-2.5">
                      <div>
                        <span className="text-[11px] font-bold text-[#8B6F5F] uppercase">MSSV: {req.mssv} • {req.class}</span>
                        <h4 className="m-0 mt-1 text-base text-[#6B4F43] font-bold">{req.name}</h4>
                      </div>
                      
                      {/* Status Tag */}
                      <span className={`text-[11.5px] px-2.5 py-1 rounded-md font-bold ${
                        req.status === "Chờ duyệt" ? "bg-[#FFF8F0] text-[#F2994A]" : 
                        req.status === "Đã duyệt" ? "bg-[#EAFDF5] text-[#178A57]" : 
                        "bg-[#FFEAEA] text-[#EB5757]"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Details Body */}
                    <div className="text-[13.5px] text-[#6B4F43] leading-relaxed">
                      <p className="my-1">📅 <b>Ngày xin nghỉ học:</b> <span className="text-[#EB5757] font-bold">{req.dateRequested}</span></p>
                      <p className="my-1">✍️ <b>Lý do xin phép:</b> {req.reason}</p>
                      
                      {req.evidence !== "Khong_co" && (
                        <p className="mt-2 mb-0 flex items-center gap-1.5">
                           <b>Minh chứng đính kèm:</b> 
                          <a 
                            href={req.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#039BE5] underline cursor-pointer font-semibold"
                          >
                            Xem minh chứng
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {req.status === "Chờ duyệt" && (
                      <div className="flex justify-end gap-2.5 border-t border-[#F5EAE1] pt-3 mt-1">
                        <button 
                          onClick={() => handleRejectLeave(req.id)}
                          className="bg-[#FFF4F4] text-[#EB5757] border border-[#FCD4D4] px-4 py-2 rounded-md text-[13px] font-bold cursor-pointer transition-colors hover:bg-[#ffeaea]"
                        >
                          ✕ Từ chối đơn
                        </button>
                        <button 
                          onClick={() => handleApproveLeave(req.id, req.mssv)}
                          className="bg-gradient-to-r from-[#6FCF97] to-[#27AE60] text-white border-none px-4 py-2 rounded-md text-[13px] font-bold cursor-pointer shadow-[0_4px_10px_rgba(111,207,151,0.3)] transition-transform hover:-translate-y-px"
                        >
                          ✓ Duyệt phép vắng
                        </button>
                      </div>
                    )}
                    
                    {/* Timestamp Footer */}
                    <div className="flex justify-between text-[11px] text-[#8B6F5F] mt-1">
                      <span>Thời gian nộp đơn: {req.dateSubmitted}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </section>

      {/* Face Attendance Modal */}
      <FaceAttendanceModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        roster={roster}
        onMarkPresent={async (mssv) => {
          await handleStatusChange(mssv, "Có mặt");
        }}
      />
    </div>
  );
}
