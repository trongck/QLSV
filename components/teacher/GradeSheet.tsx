"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import * as XLSX from "xlsx";

interface StudentGradeRow {
  stt: number;
  masv: string;
  hoten: string;
  malop: string;
  diemChuyenCan: { giatri: number; heso: number } | null;
  diemGiuaKy: { giatri: number; heso: number } | null;
  diemCuoiKy: { giatri: number; heso: number } | null;
  tongKet: { diemtongket: number; diemchu: string; ketqua: string } | null;
  nopbaiFiles?: { tieude: string; filenop: string }[];
}

export function GradeSheet() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempGrades, setTempGrades] = useState<Record<string, { ChuyenCan: string; GiuaKy: string; CuoiKy: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState<string>("all");

  // Tải danh sách lớp học
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiFetch("/api/giangvien/grades");
        const json = await res.json();
        if (json.success && json.data) {
          setClasses(json.data);
          if (json.data.length > 0) {
            setSelectedPC(json.data[0].maphancong);
          }
        }
      } catch (err) {
        console.error("Lỗi tải danh sách lớp:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Tải bảng điểm khi chọn lớp khác
  useEffect(() => {
    if (!selectedPC) return;
    async function loadGradeSheet() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/giangvien/grades?maphancong=${selectedPC}`);
        const json = await res.json();
        if (json.success && json.data) {
          setStudents(json.data);
          
          // Khởi tạo các giá trị input tạm thời
          const initialInputs: Record<string, any> = {};
          json.data.forEach((s: StudentGradeRow) => {
            initialInputs[s.masv] = {
              ChuyenCan: s.diemChuyenCan?.giatri?.toString() ?? "",
              GiuaKy: s.diemGiuaKy?.giatri?.toString() ?? "",
              CuoiKy: s.diemCuoiKy?.giatri?.toString() ?? "",
            };
          });
          setTempGrades(initialInputs);
        }
      } catch (err) {
        console.error("Lỗi tải bảng điểm lớp:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGradeSheet();
  }, [selectedPC]);

  const handleGradeChange = (masv: string, type: "ChuyenCan" | "GiuaKy" | "CuoiKy", val: string) => {
    if (val !== "" && !/^[0-9]*\.?[0-9]*$/.test(val)) return;
    const num = parseFloat(val);
    if (!isNaN(num) && num > 10) return;

    setTempGrades((prev) => ({
      ...prev,
      [masv]: {
        ...prev[masv],
        [type]: val,
      },
    }));
  };

  const handleEditClick = (masv: string) => {
    setEditingRows((prev) => ({
      ...prev,
      [masv]: true,
    }));
  };

  const handleCancelClick = (masv: string) => {
    // Reset inputs to database state
    const original = students.find((s) => s.masv === masv);
    if (original) {
      setTempGrades((prev) => ({
        ...prev,
        [masv]: {
          ChuyenCan: original.diemChuyenCan?.giatri?.toString() ?? "",
          GiuaKy: original.diemGiuaKy?.giatri?.toString() ?? "",
          CuoiKy: original.diemCuoiKy?.giatri?.toString() ?? "",
        },
      }));
    }
    setEditingRows((prev) => ({
      ...prev,
      [masv]: false,
    }));
  };

  const handleSaveRow = async (masv: string) => {
    if (!selectedPC) return;
    setSavingRow(masv);

    try {
      const row = tempGrades[masv];
      const gradesPayload = [
        { loaidiem: "ChuyenCan", giatri: parseFloat(row.ChuyenCan), heso: 0.1 },
        { loaidiem: "GiuaKy", giatri: parseFloat(row.GiuaKy), heso: 0.3 },
        { loaidiem: "CuoiKy", giatri: parseFloat(row.CuoiKy), heso: 0.6 },
      ].filter((g) => !isNaN(g.giatri));

      const res = await apiFetch("/api/giangvien/grades", {
        method: "POST",
        body: JSON.stringify({
          maphancong: selectedPC,
          masv,
          grades: gradesPayload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Tải lại toàn bộ bảng điểm lớp để cập nhật kết quả tính tổng kết chính xác
        const resReload = await apiFetch(`/api/giangvien/grades?maphancong=${selectedPC}`);
        const jsonReload = await resReload.json();
        if (jsonReload.success && jsonReload.data) {
          setStudents(jsonReload.data);
        }
        setEditingRows((prev) => ({ ...prev, [masv]: false }));
      } else {
        alert(json.error || "Không thể lưu điểm");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message);
    } finally {
      setSavingRow(null);
    }
  };

  // Tính điểm tổng kết tạm thời (Real-time feedback cho giảng viên)
  const calculateTempFinal = (masv: string) => {
    const row = tempGrades[masv];
    if (!row) return "—";
    const cc = parseFloat(row.ChuyenCan) || 0;
    const gk = parseFloat(row.GiuaKy) || 0;
    const ck = parseFloat(row.CuoiKy) || 0;

    const total = cc * 0.1 + gk * 0.3 + ck * 0.6;
    return total.toFixed(2);
  };

  const handleExportExcel = () => {
    if (!students || students.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    const currentClass = classes.find(c => c.maphancong === selectedPC);
    const className = currentClass ? `${currentClass.lop?.tenlop ?? ""} - ${currentClass.monhoc?.tenmon ?? ""}` : "Bảng điểm";

    const exportData = students.map(s => {
      const inputs = tempGrades[s.masv] || { ChuyenCan: "", GiuaKy: "", CuoiKy: "" };
      const cc = inputs.ChuyenCan || (s.diemChuyenCan?.giatri?.toString() ?? "");
      const gk = inputs.GiuaKy || (s.diemGiuaKy?.giatri?.toString() ?? "");
      const ck = inputs.CuoiKy || (s.diemCuoiKy?.giatri?.toString() ?? "");
      
      const tk = (s.tongKet && typeof s.tongKet.diemtongket === "number") ? `${s.tongKet.diemtongket.toFixed(2)} (${s.tongKet.diemchu})` : "—";

      return {
        "STT": s.stt,
        "Mã SV": s.masv,
        "Họ và tên": s.hoten,
        "Lớp": s.malop,
        "Chuyên cần (10%)": cc,
        "Giữa kỳ (30%)": gk,
        "Cuối kỳ (60%)": ck,
        "Tổng kết": tk
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng Điểm");
    
    // Auto-size columns
    const maxWidths = [5, 12, 30, 10, 15, 15, 15, 15, 15];
    worksheet["!cols"] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `BangDiem_${className.replace(/\s+/g, "_")}.xlsx`);
  };

  // Lọc danh sách sinh viên theo thanh tìm kiếm
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.masv.toLowerCase().includes(q) || s.hoten.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Nhập điểm &amp; Đánh giá kết quả</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Cập nhật điểm chuyên cần, giữa kỳ và cuối kỳ trực tiếp của sinh viên</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              if (selectedPC) {
                // Tải lại bảng điểm
                setSelectedPC(selectedPC);
              }
            }}
            className={styles.primaryBtn}
            style={{ padding: "10px 20px", borderRadius: "10px", fontSize: "14px", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", color: "white", fontWeight: "600" }}
          >
            Lưu bảng điểm
          </button>
          <button 
            onClick={handleExportExcel}
            style={{ border: "1px solid #EAD9CB", background: "white", padding: "10px 20px", borderRadius: "10px", fontSize: "14px", cursor: "pointer", color: "#6B4F43", fontWeight: "600" }}
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selectedHocKy}
          onChange={(e) => {
            const newHk = e.target.value;
            setSelectedHocKy(newHk);
            const filtered = newHk === "all" ? classes : classes.filter(c => c.hocky?.mahocky?.toString() === newHk);
            if (filtered.length > 0) {
              setSelectedPC(filtered[0].maphancong);
            } else {
              setSelectedPC(null);
              setStudents([]);
            }
          }}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", outline: "none", color: "#6B4F43", background: "white" }}
        >
          <option value="all">Tất cả học kỳ</option>
          {Array.from(new Map(classes.map(c => [c.hocky?.mahocky, c.hocky])).values())
            .filter(Boolean)
            .map((hk: any) => (
              <option key={hk.mahocky} value={hk.mahocky.toString()}>
                {hk.tenhocky} - Năm học {hk.namhoc}
              </option>
            ))
          }
        </select>

        <select
          value={selectedPC ?? ""}
          onChange={(e) => setSelectedPC(Number(e.target.value))}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", outline: "none", color: "#6B4F43", background: "white" }}
        >
          {(selectedHocKy === "all" ? classes : classes.filter(c => c.hocky?.mahocky?.toString() === selectedHocKy)).map((cls) => (
            <option key={cls.maphancong} value={cls.maphancong}>
              Lớp: {cls.lop?.tenlop ?? cls.malop} - Môn: {cls.monhoc?.tenmon} ({cls.malophoc || "Chưa chia nhóm"})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Tìm kiếm mã SV hoặc họ tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #EAD9CB",
            outline: "none",
            color: "#6B4F43",
            width: "250px",
          }}
        />
      </div>

      {/* Bảng nhập điểm */}
      <section className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FDF8F5" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>STT</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>Mã SV</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>Họ và tên</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "120px" }}>Chuyên cần (10%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "120px" }}>Giữa kỳ (30%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "120px" }}>Cuối kỳ (60%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F" }}>Tổng kết</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F" }}>Bài nộp</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F" }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#8B6F5F", fontWeight: "bold" }}>
                    Đang tải dữ liệu bảng điểm...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
                    Không tìm thấy sinh viên nào trong lớp này.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((row) => {
                  const isEditing = editingRows[row.masv] === true;
                  const isSaving = savingRow === row.masv;
                  const inputs = tempGrades[row.masv] || { ChuyenCan: "", BaiTap: "", GiuaKy: "", CuoiKy: "" };

                  return (
                    <tr key={row.masv} style={{ borderBottom: "1px solid #F0E1D9" }}>
                      <td style={{ padding: "12px" }}>{row.stt}</td>
                      <td style={{ padding: "12px" }}>{row.masv}</td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#6B4F43" }}>{row.hoten}</td>
                      
                      {/* Chuyên cần */}
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.ChuyenCan}
                            onChange={(e) => handleGradeChange(row.masv, "ChuyenCan", e.target.value)}
                            className={styles.gradeInput}
                            style={{ width: "60px", textAlign: "center", border: "1px solid #EAD9CB", borderRadius: "6px", padding: "6px" }}
                          />
                        ) : (
                          row.diemChuyenCan?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Giữa kỳ */}
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.GiuaKy}
                            onChange={(e) => handleGradeChange(row.masv, "GiuaKy", e.target.value)}
                            className={styles.gradeInput}
                            style={{ width: "60px", textAlign: "center", border: "1px solid #EAD9CB", borderRadius: "6px", padding: "6px" }}
                          />
                        ) : (
                          row.diemGiuaKy?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Cuối kỳ */}
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.CuoiKy}
                            onChange={(e) => handleGradeChange(row.masv, "CuoiKy", e.target.value)}
                            className={styles.gradeInput}
                            style={{ width: "60px", textAlign: "center", border: "1px solid #EAD9CB", borderRadius: "6px", padding: "6px" }}
                          />
                        ) : (
                          row.diemCuoiKy?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Tổng kết */}
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "700", color: "#6B4F43" }}>
                        {isEditing ? (
                          <span style={{ color: "#8B6F5F" }}>{calculateTempFinal(row.masv)}</span>
                        ) : (
                          (row.tongKet && typeof row.tongKet.diemtongket === "number") ? (
                            <span style={{ color: row.tongKet.diemtongket >= 4.0 ? "#065F46" : "#991B1B" }}>
                              {row.tongKet.diemtongket.toFixed(2)} ({row.tongKet.diemchu})
                            </span>
                          ) : (
                            "—"
                          )
                        )}
                      </td>

                      {/* Bài nộp */}
                      <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                        {row.nopbaiFiles && row.nopbaiFiles.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                            {row.nopbaiFiles.map((f, idx) => (
                              <a 
                                key={idx} 
                                href={f.filenop} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title={f.tieude}
                                style={{ color: "#178A57", textDecoration: "none", background: "#EAFDF5", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}
                              >
                                📎 {f.tieude.substring(0, 10)}{f.tieude.length > 10 ? '...' : ''}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#8B6F5F" }}>—</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => handleSaveRow(row.masv)}
                              disabled={isSaving}
                              style={{
                                background: "#065F46",
                                border: "none",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {isSaving ? "Lưu..." : "Lưu"}
                            </button>
                            <button
                              onClick={() => handleCancelClick(row.masv)}
                              disabled={isSaving}
                              style={{
                                background: "#EAD9CB",
                                border: "none",
                                color: "#6B4F43",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(row.masv)}
                            style={{
                              background: "none",
                              border: "1px solid #F2A8A8",
                              color: "#C25450",
                              padding: "6px 14px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thông tin thống kê dòng hiển thị */}
        {!loading && filteredStudents.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 20px", borderTop: "1px solid #F0E1D9" }}>
            <span style={{ fontSize: "13px", color: "#8B6F5F" }}>
              Hiển thị {filteredStudents.length} của {students.length} sinh viên học lớp này
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
