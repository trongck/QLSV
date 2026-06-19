"use client";

import { useState, useEffect } from "react";

import { useTeacherReports, ReportData } from "@/hooks/giangvien/useTeacherReports";
import { useTeacherClasses } from "@/hooks/giangvien/useTeacherClasses";

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
    loading,
    saving,
    fetchLiveStats,
    createReport,
    updateReport,
  } = useTeacherReports();

  // Classes come from the classes hook (same grades endpoint)
  const { dsLop: rawClasses } = useTeacherClasses();
  // Normalise to the local ClassInfo shape used by this view
  const classes: ClassInfo[] = rawClasses.map((c) => ({
    maphancong: c.maphancong,
    malophoc: c.malophoc,
    malop: c.malop,
    monhoc: { tenmon: c.tenmon, sotinchi: c.sotinchi },
    lop: { tenlop: c.tenlop },
  }));

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
    return <div style={{ padding: "20px", color: "#8B6F5F" }}>Đang tải dữ liệu báo cáo...</div>;
  }

  if (classes.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Phân tích &amp; Thống kê kết quả học tập</h2>
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "#8B6F5F", border: "1px solid #F0E1D9" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @media (max-width: 900px) {
          .report-filter-grid { grid-template-columns: 1fr 1fr !important; }
          .report-kpi-grid { grid-template-columns: 1fr !important; }
          .report-charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .report-filter-grid { grid-template-columns: 1fr !important; }
          .report-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .report-header-btns { width: 100% !important; }
          .report-header-btns button { flex: 1 !important; }
        }
      `}</style>
      <div className="report-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Phân tích &amp; Thống kê kết quả học tập</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Nhận thông tin trực quan về kết quả và tình hình tham gia của sinh viên</p>
        </div>
        <div className="report-header-btns" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleOpenCreateModal}
            style={{
              background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
              padding: "10px 20px",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              color: "white",
              borderRadius: "8px",
              fontSize: "13px"
            }}
          >
            Tạo báo cáo mới
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
        <div className="report-filter-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
          {/* Năm học */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Năm học</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", color: "#6B4F43", outline: "none", fontSize: "13px", background: "white", cursor: "pointer" }}
            >
              <option value="Tất cả">Tất cả năm học</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Học kỳ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", color: "#6B4F43", outline: "none", fontSize: "13px", background: "white", cursor: "pointer" }}
            >
              <option value="Tất cả">Tất cả học kỳ</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Chọn lớp */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 1" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Chọn lớp giảng dạy</label>
            <select
              value={selectedPC}
              onChange={(e) => setSelectedPC(Number(e.target.value))}
              disabled={filteredClasses.length === 0}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", color: filteredClasses.length === 0 ? "#bbb" : "#6B4F43", outline: "none", fontSize: "13px", background: "white", cursor: filteredClasses.length === 0 ? "not-allowed" : "pointer" }}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Số tín chỉ</label>
            <div style={{ padding: "10px", borderRadius: "8px", border: "1px solid #FDF8F5", background: "#FDF8F5", color: "#6B4F43", fontSize: "13px", fontWeight: "600" }}>
              {selectedClass?.monhoc?.sotinchi || "—"} tín chỉ
            </div>
          </div>
        </div>
      </section>

      {/* Empty filter message */}
      {filteredClasses.length === 0 && (
        <div style={{ padding: "20px", borderRadius: "10px", border: "1px solid #F0E1D9", background: "#FDF8F5", color: "#8B6F5F", textAlign: "center", fontSize: "14px" }}>
          Không tìm thấy lớp học phần nào phù hợp với bộ lọc đã chọn.
        </div>
      )}

      {/* Warning showing we are looking at an old report */}
      {selectedReportId !== "live" && (
        <div style={{ padding: "12px 20px", borderRadius: "8px", background: "#FFF5E6", border: "1px solid #FFD699", color: "#B36B00", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
             Bạn đang xem báo cáo lưu lịch sử: <strong>{reports.find(r => r.matailieu === selectedReportId)?.tieude}</strong>
          </span>
          <button 
            onClick={() => handleSelectReport("live")}
            style={{ border: "none", background: "none", color: "#6B4F43", textDecoration: "underline", fontWeight: "bold", cursor: "pointer" }}
          >
            Quay lại báo cáo hiện tại
          </button>
        </div>
      )}

      {/* KPI statistics cards */}
      {filteredClasses.length > 0 && (
      <div className="report-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {[
          { title: "Tỷ lệ điểm danh trung bình", value: `${stats.avgAttendance}%`, sub: "Dựa trên số buổi điểm danh" },
          { title: "Tỷ lệ đạt học phần (>=4.0)", value: `${stats.passRate}%`, sub: "Dựa trên điểm tổng kết hiện tại" },
          { title: "Điểm tích lũy trung bình", value: stats.avgGpa.toString(), sub: "Thang điểm 10 học phần" }
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <div style={{ color: "#8B6F5F", fontSize: "13px" }}>{card.title}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2D1B14", margin: "8px 0" }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: "#8B6F5F", fontWeight: "600" }}>{card.sub}</div>
          </div>
        ))}
      </div>
      )}

      {filteredClasses.length > 0 && (
      <div className="report-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        {/* Pie chart (Donut) */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Phân bổ điểm số</h3>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "10px 0" }}>
            <div style={{ position: "relative", width: "130px", height: "130px", borderRadius: "50%", background: backgroundGradient }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "70px", height: "70px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", color: "#6B4F43" }}>GPA</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#6FCF97" }}></div> Điểm A ({dist.A}%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#F2C94C" }}></div> Điểm B ({dist.B}%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#EB5757" }}></div> Điểm C ({dist.C}%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#2D9CDB" }}></div> Điểm D/F ({dist.DF}%)</div>
          </div>
        </section>

        {/* Notes block */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: "0 0 10px 0" }}>
            {selectedReportId === "live" ? "Nhận xét nháp" : "Nhận xét lưu trữ"}
          </h3>
          <textarea 
            placeholder="Ghi chú nhận xét chung về lớp học phần..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #F0E1D9", background: "#FDF8F5", fontSize: "13px", resize: "none", outline: "none", color: "#6B4F43" }}
          />
          <button 
            onClick={handleSaveComment}
            disabled={saving}
            style={{ 
              marginTop: "10px", 
              width: "100%", 
              background: "#6B4F43", 
              color: "white", 
              border: "none", 
              padding: "10px", 
              borderRadius: "6px", 
              cursor: "pointer", 
              fontSize: "13px", 
              fontWeight: "bold" 
            }}
          >
            {selectedReportId === "live" ? "Ghi nhận xét nháp" : (saving ? "Đang lưu..." : "Lưu nhận xét")}
          </button>
        </section>

      </div>
      )}

      {/* Saved Reports Panel — luôn hiển thị khi đã chọn lớp */}
      {filteredClasses.length > 0 && (
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: "0 0 14px 0" }}>
            Báo cáo đã lưu {reports.length > 0 ? `(${reports.length})` : ""}
          </h3>

          {reports.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#8B6F5F",
              fontSize: "13px",
              background: "#FDF8F5",
              borderRadius: "10px",
              border: "1px dashed #F0E1D9"
            }}>
              Chưa có báo cáo nào được lưu cho lớp học phần này.<br/>
              <span style={{ fontSize: "12px", color: "#BFADA7" }}>Nhấn "Tạo báo cáo mới" ở góc trên phải để lưu thống kê hiện tại vào cơ sở dữ liệu.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Live entry */}
              <div
                onClick={() => handleSelectReport("live")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: `2px solid ${selectedReportId === "live" ? "#F2A8A8" : "#F0E1D9"}`,
                  background: selectedReportId === "live" ? "#FFF5F5" : "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: selectedReportId === "live" ? "700" : "400",
                  color: "#6B4F43"
                }}
              >
                ✓ Xem dữ liệu hiện tại (Live)
              </div>

              {/* Saved report entries */}
              {reports.map((rep) => (
                <div
                  key={rep.matailieu}
                  style={{
                    borderRadius: "8px",
                    border: `2px solid ${selectedReportId === rep.matailieu ? "#F2A8A8" : "#F0E1D9"}`,
                    background: selectedReportId === rep.matailieu ? "#FFF5F5" : "white",
                    overflow: "hidden",
                    transition: "all 0.15s"
                  }}
                >
                  {editingReportId === rep.matailieu ? (
                    /* Inline edit mode */
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #F2A8A8",
                          fontSize: "13px",
                          color: "#6B4F43",
                          outline: "none",
                          width: "100%",
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingReportId(null);
                          }}
                          style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #F0E1D9", background: "white", color: "#6B4F43", fontSize: "12px", cursor: "pointer" }}
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
                          style={{ padding: "5px 12px", borderRadius: "6px", border: "none", background: "#F2A8A8", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div
                      style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                      onClick={() => handleSelectReport(rep)}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", color: "#6B4F43", fontSize: "13px" }}>{rep.tieude}</div>
                        <div style={{ fontSize: "11px", color: "#8B6F5F", marginTop: "3px" }}>
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
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid #F0E1D9",
                          background: "white",
                          color: "#8B6F5F",
                          fontSize: "11px",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: "8px"
                        }}
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
        <button 
          onClick={handleDownloadCSV}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "#178A57", 
            color: "white", 
            border: "none", 
            padding: "12px 25px", 
            borderRadius: "10px", 
            fontWeight: "600", 
            cursor: "pointer", 
            fontSize: "14px" 
          }}
        >
          Tải xuống báo cáo học phần (.csv)
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateReportSubmit} className="card" style={{ background: "white", padding: "30px", borderRadius: "16px", width: "400px", maxWidth: "90%", border: "1px solid #EAD9CB", display: "flex", flexDirection: "column", gap: "15px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#6B4F43", margin: 0 }}>Tạo báo cáo mới</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#8B6F5F" }}>Tên báo cáo *</label>
              <input 
                type="text" 
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                placeholder="Ví dụ: Báo cáo học phần Lập trình Web"
                required
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", color: "#6B4F43", outline: "none", fontSize: "13px" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}>Hủy</button>
              <button type="submit" disabled={saving} style={{ padding: "8px 16px", borderRadius: "6px", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                {saving ? "Đang tạo..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
