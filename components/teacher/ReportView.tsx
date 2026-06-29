"use client";

import { useState, useEffect } from "react";

import { useTeacherReports, ReportData } from "@/hooks/giangvien/useTeacherReports";
import { useTeacherGrades } from "@/hooks/giangvien/useTeacherGrades";

interface ClassInfo {
  maphancong: number;
  malophoc: string;
  malop: string;
  monhoc?: {
    tenmon: string;
    sotinchi: number;
  };
  hocky?: {
    tenhocky: string;
    namhoc: number;
    ky: number;
  };
  lop?: {
    tenlop: string;
  };
}

export function ReportView() {
  const {
    reports,
    stats,
    setStats,
    selectedPC,
    setSelectedPC,
    loading: reportsLoading,
    saving,
    fetchLiveStats,
    createReport,
    updateReport,
  } = useTeacherReports();

  // Classes come from the grades hook
  const { classes: rawClasses, loading: classesLoading } = useTeacherGrades();
  // Normalise to the local ClassInfo shape used by this view
  const classes: ClassInfo[] = rawClasses.map((c) => ({
    maphancong: c.maphancong,
    malophoc: c.malophoc,
    malop: c.malop,
    monhoc: c.monhoc,
    lop: c.lop,
    hocky: c.hocky ? {
      tenhocky: c.hocky.tenhocky,
      namhoc: Number(c.hocky.namhoc),
      ky: c.hocky.ky
    } : undefined
  }));

  const loading = reportsLoading || classesLoading;

  // Filters for Semester and Academic Year
  const [selectedYear, setSelectedYear] = useState<string>("Tất cả");
  const [selectedSemester, setSelectedSemester] = useState<string>("Tất cả");

  // History & Modal states
  const [selectedReportId, setSelectedReportId] = useState<number | "live">("live");
  const [comments, setComments] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  // Inline edit state for saved report title
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Dynamic filter values extraction
  const yearOptions = Array.from(
    new Set(
      classes
        .map((c) => (c as any).hocky?.namhoc)
        .filter((nh): nh is number => nh !== undefined && nh !== null)
        .map((nh) => `${nh}-${nh + 1}`)
    )
  ).sort() as string[];

  const semesterOptions = Array.from(
    new Set(
      classes
        .map((c) => (c as any).hocky?.tenhocky)
        .filter(Boolean)
    )
  ).sort() as string[];

  // Filtered classes list
  const filteredClasses = classes.filter((c) => {
    const classYear = (c as any).hocky?.namhoc ? `${(c as any).hocky.namhoc}-${(c as any).hocky.namhoc + 1}` : "";
    const matchYear = selectedYear === "Tất cả" || classYear === selectedYear;
    const matchSem = selectedSemester === "Tất cả" || (c as any).hocky?.tenhocky === selectedSemester;
    return matchYear && matchSem;
  });

  // Synchronize selected class with filtered list
  useEffect(() => {
    if (filteredClasses.length > 0) {
      const exists = filteredClasses.some((c) => c.maphancong === selectedPC);
      if (!exists) {
        setSelectedPC(filteredClasses[0].maphancong);
      }
    } else {
      setSelectedPC("");
    }
  }, [selectedYear, selectedSemester, classes, selectedPC, setSelectedPC]);

  // Handle switching between live report and saved historical reports
  const handleSelectReport = (report: ReportData | "live") => {
    if (report === "live") {
      setSelectedReportId("live");
      setComments("");
      // Reset stats to live stats
      if (selectedPC) {
        fetchLiveStats(Number(selectedPC));
      }
    } else {
      setSelectedReportId(report.matailieu);
      setComments(report.mota || "");
      try {
        const parsedStats = JSON.parse(report.duongdan);
        setStats(parsedStats);
      } catch (e) {
        console.error("Lỗi parse dữ liệu thống kê từ báo cáo cũ:", e);
      }
    }
  };

  const handleOpenCreateModal = () => {
    const selectedClass = classes.find(c => c.maphancong === selectedPC);
    const className = selectedClass?.monhoc?.tenmon || "Lớp học phần";
    const today = new Date().toLocaleDateString("vi-VN");
    setNewReportTitle(`Báo cáo học phần ${className} (${today})`);
    setShowCreateModal(true);
  };

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPC || !newReportTitle.trim()) return;

    try {
      const newRep = await createReport({
        maphancong: Number(selectedPC),
        tieude: newReportTitle,
        mota: comments,
        stats: stats
      });
      setShowCreateModal(false);
      if (newRep) handleSelectReport(newRep);
    } catch {
      // error is handled in hook (alert)
    }
  };

  const handleSaveComment = async () => {
    if (selectedReportId === "live") {
      alert("Nhận xét này đang viết nháp trên dữ liệu hiện tại. Hãy nhấn 'Tạo báo cáo mới' để lưu giữ báo cáo này kèm nhận xét của bạn vào CSDL.");
      return;
    }

    try {
      await updateReport(Number(selectedReportId), { mota: comments });
      alert("Cập nhật nhận xét thành công!");
    } catch {
      // error handled in hook
    }
  };

  const handleDownloadCSV = () => {
    const selectedClass = classes.find(c => c.maphancong === selectedPC);
    const className = selectedClass?.monhoc?.tenmon || "Lớp học";
    const classCode = selectedClass?.lop?.tenlop || "Lớp";
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `BÁO CÁO THỐNG KÊ KẾT QUẢ HỌC TẬP\n`;
    csvContent += `Học phần:;${className}\n`;
    csvContent += `Lớp học:;${classCode}\n`;
    csvContent += `Ngày xuất:;${new Date().toLocaleDateString("vi-VN")}\n\n`;
    csvContent += `Chỉ số;Giá trị\n`;
    csvContent += `Tỷ lệ điểm danh trung bình;${stats.avgAttendance}%\n`;
    csvContent += `Tỷ lệ đạt học phần (>=4.0);${stats.passRate}%\n`;
    csvContent += `Điểm tích lũy trung bình;${stats.avgGpa}\n\n`;
    csvContent += `Phân bổ điểm số\n`;
    csvContent += `Điểm A;${stats.gradeDist.A}%\n`;
    csvContent += `Điểm B;${stats.gradeDist.B}%\n`;
    csvContent += `Điểm C;${stats.gradeDist.C}%\n`;
    csvContent += `Điểm D/F;${stats.gradeDist.DF}%\n\n`;
    csvContent += `Nhận xét giảng viên:;"${comments.replace(/"/g, '""')}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCaoThongKe_${classCode.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && classes.length === 0) {
    return <div className="p-5 text-[#8B6F5F]">Đang tải dữ liệu báo cáo...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-[#6B4F43] m-0">Phân tích &amp; Thống kê kết quả học tập</h2>
        <div className="bg-white rounded-xl p-10 text-center text-[#8B6F5F] border border-[#F0E1D9] shadow-sm">
          Bạn chưa được phân công giảng dạy lớp học phần nào có hiệu lực.
        </div>
      </div>
    );
  }

  const selectedClass = classes.find(c => c.maphancong === selectedPC);

  // Calculate donut conic gradient percentages
  const dist = stats.gradeDist || { A: 45, B: 30, C: 10, DF: 15 };
  const pA = dist.A;
  const pB = pA + dist.B;
  const pC = pB + dist.C;
  const backgroundGradient = `conic-gradient(#6FCF97 0% ${pA}%, #F2C94C ${pA}% ${pB}%, #EB5757 ${pB}% ${pC}%, #2D9CDB ${pC}% 100%)`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Phân tích &amp; Thống kê kết quả học tập</h2>
          <p className="text-[13px] text-[#8B6F5F] m-0 mt-1">Nhận thông tin trực quan về kết quả và tình hình tham gia của sinh viên</p>
        </div>
        <div className="flex gap-2.5 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto btn-teacher px-5 py-2.5 font-semibold cursor-pointer border-none text-white rounded-xl text-[13px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Tạo báo cáo mới
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <section className="bg-white rounded-xl p-5 border border-[#F0E1D9] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Năm học */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#8B6F5F] uppercase">Năm học</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="p-2.5 rounded-lg border border-[#F0E1D9] text-[#6B4F43] outline-none text-[13px] bg-white cursor-pointer focus:border-[#F2A8A8] transition-colors"
            >
              <option value="Tất cả">Tất cả năm học</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Học kỳ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#8B6F5F] uppercase">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="p-2.5 rounded-lg border border-[#F0E1D9] text-[#6B4F43] outline-none text-[13px] bg-white cursor-pointer focus:border-[#F2A8A8] transition-colors"
            >
              <option value="Tất cả">Tất cả học kỳ</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Chọn lớp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#8B6F5F] uppercase">Chọn lớp giảng dạy</label>
            <select
              value={selectedPC}
              onChange={(e) => setSelectedPC(Number(e.target.value))}
              disabled={filteredClasses.length === 0}
              className={`p-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[13px] bg-white focus:border-[#F2A8A8] transition-colors ${filteredClasses.length === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#6B4F43] cursor-pointer'}`}
            >
              {filteredClasses.length === 0 ? (
                <option value="">— Không có lớp phù hợp —</option>
              ) : (
                filteredClasses.map((cls) => (
                  <option key={cls.maphancong} value={cls.maphancong}>
                    {cls.monhoc?.tenmon} - {cls.lop?.tenlop}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Số tín chỉ (static) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#8B6F5F] uppercase">Số tín chỉ</label>
            <div className="p-2.5 rounded-lg border border-[#FDF8F5] bg-[#FDF8F5] text-[#6B4F43] text-[13px] font-semibold">
              {selectedClass?.monhoc?.sotinchi || "—"} tín chỉ
            </div>
          </div>
        </div>
      </section>

      {/* Empty filter message */}
      {filteredClasses.length === 0 && (
        <div className="p-5 rounded-xl border border-[#F0E1D9] bg-[#FDF8F5] text-[#8B6F5F] text-center text-sm">
          Không tìm thấy lớp học phần nào phù hợp với bộ lọc đã chọn.
        </div>
      )}

      {/* Warning showing we are looking at an old report */}
      {selectedReportId !== "live" && (
        <div className="p-3 px-5 rounded-lg bg-[#FFF5E6] border border-[#FFD699] text-[#B36B00] text-[13px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>
             Bạn đang xem báo cáo lưu lịch sử: <strong>{reports.find(r => r.matailieu === selectedReportId)?.tieude}</strong>
          </span>
          <button 
            onClick={() => handleSelectReport("live")}
            className="border-none bg-transparent text-[#6B4F43] underline font-bold cursor-pointer hover:text-[#2D1B14] transition-colors"
          >
            Quay lại báo cáo hiện tại
          </button>
        </div>
      )}

      {/* KPI statistics cards */}
      {filteredClasses.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Tỷ lệ điểm danh trung bình", value: `${stats.avgAttendance}%`, sub: "Dựa trên số buổi điểm danh" },
          { title: "Tỷ lệ đạt học phần (>=4.0)", value: `${stats.passRate}%`, sub: "Dựa trên điểm tổng kết hiện tại" },
          { title: "Điểm tích lũy trung bình", value: stats.avgGpa.toString(), sub: "Thang điểm 10 học phần" }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-[#F0E1D9] shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[#8B6F5F] text-[13px] font-semibold">{card.title}</div>
            <div className="text-[28px] font-extrabold text-[#2D1B14] my-2">{card.value}</div>
            <div className="text-xs text-[#8B6F5F] font-semibold">{card.sub}</div>
          </div>
        ))}
      </div>
      )}

      {filteredClasses.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pie chart (Donut) */}
        <section className="bg-white rounded-xl p-5 border border-[#F0E1D9] flex flex-col gap-4 shadow-sm">
          <h3 className="text-[15px] text-[#6B4F43] font-bold m-0">Phân bổ điểm số</h3>
          <div className="flex justify-center items-center flex-1 py-2.5">
            <div className="relative w-[130px] h-[130px] rounded-full" style={{ background: backgroundGradient }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center text-[11px] font-bold text-[#6B4F43]">GPA</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#6B4F43]">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#6FCF97]"></div> Điểm A ({dist.A}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#F2C94C]"></div> Điểm B ({dist.B}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#EB5757]"></div> Điểm C ({dist.C}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#2D9CDB]"></div> Điểm D/F ({dist.DF}%)</div>
          </div>
        </section>

        {/* Notes block */}
        <section className="bg-white rounded-xl p-5 border border-[#F0E1D9] flex flex-col shadow-sm">
          <h3 className="text-[15px] text-[#6B4F43] font-bold m-0 mb-2.5">
            {selectedReportId === "live" ? "Nhận xét nháp" : "Nhận xét lưu trữ"}
          </h3>
          <textarea 
            placeholder="Ghi chú nhận xét chung về lớp học phần..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="flex-1 p-3 rounded-lg border border-[#F0E1D9] bg-[#FDF8F5] text-[13px] resize-none outline-none text-[#6B4F43] focus:border-[#F2A8A8] transition-colors"
          />
          <button 
            onClick={handleSaveComment}
            disabled={saving}
            className={`mt-2.5 w-full bg-[#6B4F43] text-white border-none p-2.5 rounded-lg cursor-pointer text-[13px] font-bold transition-colors ${saving ? 'opacity-70' : 'hover:bg-[#523C32]'}`}
          >
            {selectedReportId === "live" ? "Ghi nhận xét nháp" : (saving ? "Đang lưu..." : "Lưu nhận xét")}
          </button>
        </section>

      </div>
      )}

      {/* Saved Reports Panel — luôn hiển thị khi đã chọn lớp */}
      {filteredClasses.length > 0 && (
        <section className="bg-white rounded-xl p-5 border border-[#F0E1D9] shadow-sm">
          <h3 className="text-[15px] text-[#6B4F43] font-bold m-0 mb-3.5">
            Báo cáo đã lưu {reports.length > 0 ? `(${reports.length})` : ""}
          </h3>

          {reports.length === 0 ? (
            <div className="text-center p-8 text-[#8B6F5F] text-[13px] bg-[#FDF8F5] rounded-xl border border-dashed border-[#F0E1D9]">
              Chưa có báo cáo nào được lưu cho lớp học phần này.<br/>
              <span className="text-[12px] text-[#BFADA7]">Nhấn "Tạo báo cáo mới" ở góc trên phải để lưu thống kê hiện tại vào cơ sở dữ liệu.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Live entry */}
              <div
                onClick={() => handleSelectReport("live")}
                className={`px-3.5 py-2.5 rounded-lg border-2 cursor-pointer text-[13px] ${selectedReportId === "live" ? 'border-[#F2A8A8] bg-[#FFF5F5] font-bold text-[#6B4F43]' : 'border-[#F0E1D9] bg-white font-normal text-[#6B4F43] hover:bg-gray-50'}`}
              >
                ✓ Xem dữ liệu hiện tại (Live)
              </div>

              {/* Saved report entries */}
              {reports.map((rep) => (
                <div
                  key={rep.matailieu}
                  className={`rounded-lg border-2 overflow-hidden transition-all duration-150 ${selectedReportId === rep.matailieu ? 'border-[#F2A8A8] bg-[#FFF5F5]' : 'border-[#F0E1D9] bg-white'}`}
                >
                  {editingReportId === rep.matailieu ? (
                    /* Inline edit mode */
                    <div className="p-3 flex flex-col gap-2">
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 px-2.5 rounded-md border border-[#F2A8A8] text-[13px] text-[#6B4F43] outline-none w-full box-border"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingReportId(null);
                          }}
                          className="py-1 px-3 rounded-md border border-[#F0E1D9] bg-white text-[#6B4F43] text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          disabled={saving}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!editingTitle.trim()) return;
                            try {
                              const ok = await updateReport(rep.matailieu, { tieude: editingTitle });
                              if (ok) {
                                setEditingReportId(null);
                              }
                            } catch {
                              // error already handled/alerted by hook
                            }
                          }}
                          className="py-1 px-3 rounded-md border-none btn-teacher text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div
                      className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelectReport(rep)}
                    >
                      <div>
                        <div className="font-bold text-[#6B4F43] text-[13px]">{rep.tieude}</div>
                        <div className="text-[11px] text-[#8B6F5F] mt-1">
                          Lưu lúc: {new Date(rep.ngaytao).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingReportId(rep.matailieu);
                          setEditingTitle(rep.tieude);
                        }}
                        title="Chỉnh sửa tên báo cáo"
                        className="py-1 px-2.5 rounded-md border border-[#F0E1D9] bg-white text-[#8B6F5F] text-[11px] cursor-pointer flex-shrink-0 ml-2 hover:bg-gray-50 transition-colors"
                      >
                        Sửa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <div className="flex justify-end mt-2.5">
        <button 
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 bg-[#178A57] text-white border-none px-6 py-3 rounded-xl font-semibold cursor-pointer text-sm shadow-sm hover:bg-[#065F46] transition-colors"
        >
          Tải xuống báo cáo học phần (.csv)
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000] p-4">
          <form onSubmit={handleCreateReportSubmit} className="bg-white p-6 rounded-2xl w-full max-w-[400px] border border-[#EAD9CB] flex flex-col gap-4 shadow-lg">
            <h3 className="text-lg font-bold text-[#6B4F43] m-0">Tạo báo cáo mới</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#8B6F5F]">Tên báo cáo *</label>
              <input 
                type="text" 
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                placeholder="Ví dụ: Báo cáo học phần Lập trình Web"
                required
                className="p-2.5 rounded-lg border border-[#F0E1D9] text-[#6B4F43] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2.5 mt-2.5">
              <button type="button" onClick={() => setShowCreateModal(false)} className="py-2 px-4 rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F43] font-semibold cursor-pointer hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={saving} className="py-2 px-4 rounded-lg btn-teacher text-white border-none font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-70">
                {saving ? "Đang tạo..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
