"use client";

import { useState, useEffect } from "react";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import { apiFetch } from "@/services/service/auth/auth.service";

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

interface ReportData {
  matailieu: number;
  tieude: string;
  mota: string;
  duongdan: string; // JSON stats
  ngaytao: string;
}

interface StatsData {
  avgAttendance: number;
  passRate: number;
  avgGpa: number;
  gradeDist: {
    A: number;
    B: number;
    C: number;
    DF: number;
  };
  weeklyAttendance: number[];
}

export function ReportView() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedPC, setSelectedPC] = useState<number | "">("");

  // Statistics
  const [stats, setStats] = useState<StatsData>({
    avgAttendance: 92.5,
    passRate: 96.2,
    avgGpa: 8.15,
    gradeDist: { A: 45, B: 30, C: 10, DF: 15 },
    weeklyAttendance: [80, 85, 90, 88, 92, 95, 93, 96]
  });

  // History & Modal states
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | "live">("live");
  const [comments, setComments] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Load classes initially
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiFetch("/api/giangvien/grades");
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setClasses(json.data);
          setSelectedPC(json.data[0].maphancong);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách lớp phân công:", err);
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Fetch stats and reports list when class selection changes
  useEffect(() => {
    if (!selectedPC) return;
    setLoading(true);
    setSelectedReportId("live");
    setComments("");

    async function loadStatsAndReports() {
      try {
        // Fetch Live Stats
        const statsRes = await apiFetch(`/api/giangvien/reports?maphancong=${selectedPC}&action=GET_STATS`);
        const statsJson = await statsRes.json();
        if (statsJson.success) {
          setStats(statsJson.data);
        }

        // Fetch Saved Reports
        const reportsRes = await apiFetch(`/api/giangvien/reports?maphancong=${selectedPC}&action=GET_REPORTS`);
        const reportsJson = await reportsRes.json();
        if (reportsJson.success) {
          setReports(reportsJson.data);
        }
      } catch (err) {
        console.error("Lỗi tải thông tin thống kê / báo cáo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStatsAndReports();
  }, [selectedPC]);

  // Handle switching between live report and saved historical reports
  const handleSelectReport = (report: ReportData | "live") => {
    if (report === "live") {
      setSelectedReportId("live");
      setComments("");
      // Reset stats to live stats
      apiFetch(`/api/giangvien/reports?maphancong=${selectedPC}&action=GET_STATS`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setStats(json.data);
        });
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

    setSaving(true);
    try {
      const res = await apiFetch("/api/giangvien/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maphancong: selectedPC,
          tieude: newReportTitle,
          mota: comments,
          stats: stats
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("Lưu báo cáo mới thành công!");
        setShowCreateModal(false);
        // Refresh list of reports
        const reportsRes = await apiFetch(`/api/giangvien/reports?maphancong=${selectedPC}&action=GET_REPORTS`);
        const reportsJson = await reportsRes.json();
        if (reportsJson.success) {
          setReports(reportsJson.data);
          // Auto select the new report
          const newRep = reportsJson.data.find((r: any) => r.matailieu === json.data.matailieu);
          if (newRep) handleSelectReport(newRep);
        }
      } else {
        alert("Lỗi: " + json.error);
      }
    } catch (err) {
      alert("Lỗi hệ thống khi tạo báo cáo mới");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveComment = async () => {
    if (selectedReportId === "live") {
      alert("Nhận xét này đang viết nháp trên dữ liệu hiện tại. Hãy nhấn 'Tạo báo cáo mới' để lưu giữ báo cáo này kèm nhận xét của bạn vào CSDL.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/api/giangvien/reports/${selectedReportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mota: comments })
      });
      const json = await res.json();
      if (json.success) {
        alert("Cập nhật nhận xét thành công!");
        // Update reports list comments locally
        setReports(prev => prev.map(r => r.matailieu === selectedReportId ? { ...r, mota: comments } : r));
      } else {
        alert("Lỗi: " + json.error);
      }
    } catch (err) {
      alert("Lỗi hệ thống khi lưu nhận xét");
    } finally {
      setSaving(false);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Phân tích &amp; Thống kê kết quả học tập</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Nhận thông tin trực quan về kết quả và tình hình tham gia của sinh viên</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setShowHistoryModal(true)}
            style={{ 
              padding: "10px 18px", 
              borderRadius: "8px", 
              border: "1px solid #F2A8A8", 
              background: "#FFF", 
              color: "#F2A8A8", 
              fontWeight: "600", 
              cursor: "pointer", 
              fontSize: "13px" 
            }}
          >
            📋 Xem báo cáo cũ ({reports.length})
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className={styles.primaryBtn} 
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
            💾 Tạo báo cáo mới
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "20px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Chọn lớp giảng dạy</label>
            <select 
              value={selectedPC} 
              onChange={e => setSelectedPC(Number(e.target.value))}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", color: "#6B4F43", outline: "none", fontSize: "13px" }}
            >
              {classes.map((cls) => (
                <option key={cls.maphancong} value={cls.maphancong}>
                  {cls.monhoc?.tenmon} - {cls.lop?.tenlop}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Học kỳ</label>
            <div style={{ padding: "10px", borderRadius: "8px", border: "1px solid #FDF8F5", background: "#FDF8F5", color: "#6B4F43", fontSize: "13px", fontWeight: "600" }}>
              {selectedClass?.hocky?.tenhocky || "—"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Năm học</label>
            <div style={{ padding: "10px", borderRadius: "8px", border: "1px solid #FDF8F5", background: "#FDF8F5", color: "#6B4F43", fontSize: "13px", fontWeight: "600" }}>
              {selectedClass?.hocky?.namhoc ? `${selectedClass.hocky.namhoc}-${selectedClass.hocky.namhoc + 1}` : "—"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Số tín chỉ</label>
            <div style={{ padding: "10px", borderRadius: "8px", border: "1px solid #FDF8F5", background: "#FDF8F5", color: "#6B4F43", fontSize: "13px", fontWeight: "600" }}>
              {selectedClass?.monhoc?.sotinchi || "—"} tín chỉ
            </div>
          </div>
        </div>
      </section>

      {/* Warning showing we are looking at an old report */}
      {selectedReportId !== "live" && (
        <div style={{ padding: "12px 20px", borderRadius: "8px", background: "#FFF5E6", border: "1px solid #FFD699", color: "#B36B00", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            ⚠️ Bạn đang xem báo cáo lưu lịch sử: <strong>{reports.find(r => r.matailieu === selectedReportId)?.tieude}</strong>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {[
          { title: "Tỷ lệ điểm danh trung bình", value: `${stats.avgAttendance}%`, sub: "Dựa trên số buổi điểm danh", color: "#6FCF97" },
          { title: "Tỷ lệ đạt học phần (>=4.0)", value: `${stats.passRate}%`, sub: "Dựa trên điểm tổng kết hiện tại", color: "#6FCF97" },
          { title: "Điểm tích lũy trung bình", value: stats.avgGpa.toString(), sub: "Thang điểm 10 học phần", color: "#6FCF97" }
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <div style={{ color: "#8B6F5F", fontSize: "13px" }}>{card.title}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2D1B14", margin: "8px 0" }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: "#8B6F5F", fontWeight: "600" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts & Comments */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1.2fr", gap: "20px" }}>
        
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

        {/* Bar chart (Attendance trend) */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Xu hướng điểm danh hàng tuần</h3>
          <div style={{ height: "150px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderLeft: "1px solid #F0E1D9", borderBottom: "1px solid #F0E1D9", padding: "0 10px 5px 5px" }}>
            {(stats.weeklyAttendance || []).map((val, i) => (
              <div key={i} style={{ width: "16px", height: `${val}%`, background: "#F2A8A8", borderRadius: "4px 4px 0 0", position: "relative" }}>
                <span style={{ position: "absolute", top: "-18px", left: "-6px", fontSize: "9px", color: "#6B4F43", fontWeight: "bold" }}>{val}%</span>
                <span style={{ position: "absolute", bottom: "-20px", left: "-2px", fontSize: "9px", color: "#8B6F5F", whiteSpace: "nowrap" }}>B.{i+1}</span>
              </div>
            ))}
          </div>
          <div style={{ height: "10px" }} />
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

      {/* Export action */}
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

      {/* History Modal */}
      {showHistoryModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ background: "white", padding: "30px", borderRadius: "16px", width: "500px", maxWidth: "90%", border: "1px solid #EAD9CB", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#6B4F43", margin: 0 }}>Lịch sử báo cáo đã lưu</h3>
            {reports.length === 0 ? (
              <div style={{ textAlign: "center", color: "#8B6F5F", padding: "20px 0" }}>Chưa có báo cáo nào được lưu cho lớp học phần này.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {reports.map((rep) => (
                  <div 
                    key={rep.matailieu} 
                    onClick={() => {
                      handleSelectReport(rep);
                      setShowHistoryModal(false);
                    }}
                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F0E1D9", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FDF8F5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ fontWeight: "bold", color: "#6B4F43", fontSize: "14px" }}>{rep.tieude}</div>
                    <div style={{ fontSize: "11px", color: "#8B6F5F", marginTop: "4px" }}>Ngày tạo: {new Date(rep.ngaytao).toLocaleDateString("vi-VN")} {new Date(rep.ngaytao).toLocaleTimeString("vi-VN")}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowHistoryModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

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
