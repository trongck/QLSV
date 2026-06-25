"use client";

import { useState, useEffect } from "react";
import { useTeacherGrades, StudentGradeRow } from "@/hooks/giangvien/useTeacherGrades";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import * as XLSX from "xlsx";

export function GradeSheet() {
  const {
    classes,
    students,
    selectedPC,
    setSelectedPC,
    loading,
    gradesLoading,
    saveGrade,
    fetchGrades,
  } = useTeacherGrades();

  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempGrades, setTempGrades] = useState<Record<string, { ChuyenCan: string; GiuaKy: string; CuoiKy: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState<string>("all");

  // Sync tempGrades inputs when students state updates from the hook
  useEffect(() => {
    if (students && students.length > 0) {
      const initialInputs: Record<string, any> = {};
      students.forEach((s: StudentGradeRow) => {
        initialInputs[s.masv] = {
          ChuyenCan: s.diemChuyenCan?.giatri?.toString() ?? "",
          GiuaKy: s.diemGiuaKy?.giatri?.toString() ?? "",
          CuoiKy: s.diemCuoiKy?.giatri?.toString() ?? "",
        };
      });
      setTempGrades(initialInputs);
    }
  }, [students]);

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

      await saveGrade(Number(selectedPC), masv, gradesPayload);
      setEditingRows((prev) => ({ ...prev, [masv]: false }));
    } catch (err: any) {
      // Error is handled inside the hook
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

    const currentClass = classes.find(c => c.maphancong === Number(selectedPC));
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
    <div className="flex flex-col gap-5 p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Nhập điểm &amp; Đánh giá kết quả</h2>
          <p className="text-[13px] text-[#8B6F5F] m-0 mt-1">Cập nhật điểm chuyên cần, giữa kỳ và cuối kỳ trực tiếp của sinh viên</p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              if (selectedPC) {
                fetchGrades(Number(selectedPC));
              }
            }}
            className={`flex-1 md:flex-none ${styles.primaryBtn} px-5 py-2.5 rounded-xl text-sm bg-gradient-to-r from-[#F2A8A8] to-[#FFB4B4] flex items-center justify-center gap-2 border-none cursor-pointer text-white font-semibold shadow-sm hover:opacity-90 transition-opacity`}
          >
            Lưu bảng điểm
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none border border-[#EAD9CB] bg-white px-5 py-2.5 rounded-xl text-sm cursor-pointer text-[#6B4F43] font-semibold hover:bg-gray-50 transition-colors"
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={selectedHocKy}
          onChange={(e) => {
            const newHk = e.target.value;
            setSelectedHocKy(newHk);
            const filtered = newHk === "all" ? classes : classes.filter(c => c.hocky?.mahocky?.toString() === newHk);
            if (filtered.length > 0) {
              setSelectedPC(filtered[0].maphancong);
            } else {
              setSelectedPC("");
            }
          }}
          className="p-2 rounded-lg border border-[#EAD9CB] outline-none text-[#6B4F43] bg-white text-sm focus:border-[#F2A8A8] transition-colors w-full sm:w-auto"
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
          className="p-2 rounded-lg border border-[#EAD9CB] outline-none text-[#6B4F43] bg-white text-sm focus:border-[#F2A8A8] transition-colors w-full sm:w-auto"
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
          className="p-2 rounded-lg border border-[#EAD9CB] outline-none text-[#6B4F43] w-full sm:w-[250px] text-sm focus:border-[#F2A8A8] transition-colors"
        />
      </div>

      {/* Bảng nhập điểm */}
      <section className="bg-white rounded-xl border border-[#F0E1D9] overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#FDF8F5]">
                <th className="p-3 text-left text-[13px] text-[#8B6F5F]">STT</th>
                <th className="p-3 text-left text-[13px] text-[#8B6F5F]">Mã SV</th>
                <th className="p-3 text-left text-[13px] text-[#8B6F5F]">Họ và tên</th>
                <th className="p-3 text-center text-[13px] text-[#8B6F5F] w-[120px]">Chuyên cần (10%)</th>
                <th className="p-3 text-center text-[13px] text-[#8B6F5F] w-[120px]">Giữa kỳ (30%)</th>
                <th className="p-3 text-center text-[13px] text-[#8B6F5F] w-[120px]">Cuối kỳ (60%)</th>
                <th className="p-3 text-center text-[13px] text-[#8B6F5F]">Tổng kết</th>
                <th className="p-3 text-center text-[13px] text-[#8B6F5F]">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#8B6F5F] font-bold">
                    Đang tải dữ liệu bảng điểm...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#8B6F5F]">
                    Không tìm thấy sinh viên nào trong lớp này.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((row) => {
                  const isEditing = editingRows[row.masv] === true;
                  const isSaving = savingRow === row.masv;
                  const inputs = tempGrades[row.masv] || { ChuyenCan: "", BaiTap: "", GiuaKy: "", CuoiKy: "" };

                  return (
                    <tr key={row.masv} className="border-b border-[#F0E1D9] hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm">{row.stt}</td>
                      <td className="p-3 text-sm text-gray-500">{row.masv}</td>
                      <td className="p-3 text-sm font-semibold text-[#6B4F43]">{row.hoten}</td>
                      
                      {/* Chuyên cần */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.ChuyenCan}
                            onChange={(e) => handleGradeChange(row.masv, "ChuyenCan", e.target.value)}
                            className="w-[60px] text-center border border-[#EAD9CB] rounded-md p-1.5 outline-none focus:border-[#F2A8A8]"
                          />
                        ) : (
                          row.diemChuyenCan?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Giữa kỳ */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.GiuaKy}
                            onChange={(e) => handleGradeChange(row.masv, "GiuaKy", e.target.value)}
                            className="w-[60px] text-center border border-[#EAD9CB] rounded-md p-1.5 outline-none focus:border-[#F2A8A8]"
                          />
                        ) : (
                          row.diemGiuaKy?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Cuối kỳ */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputs.CuoiKy}
                            onChange={(e) => handleGradeChange(row.masv, "CuoiKy", e.target.value)}
                            className="w-[60px] text-center border border-[#EAD9CB] rounded-md p-1.5 outline-none focus:border-[#F2A8A8]"
                          />
                        ) : (
                          row.diemCuoiKy?.giatri?.toFixed(1) || "—"
                        )}
                      </td>

                      {/* Tổng kết */}
                      <td className="p-3 text-center font-bold text-[#6B4F43]">
                        {isEditing ? (
                          <span className="text-[#8B6F5F]">{calculateTempFinal(row.masv)}</span>
                        ) : (
                          (row.tongKet && typeof row.tongKet.diemtongket === "number") ? (
                            <span className={row.tongKet.diemtongket >= 4.0 ? "text-green-700" : "text-red-700"}>
                              {row.tongKet.diemtongket.toFixed(2)} ({row.tongKet.diemchu})
                            </span>
                          ) : (
                            "—"
                          )
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => handleSaveRow(row.masv)}
                              disabled={isSaving}
                              className="bg-[#065F46] hover:bg-[#047857] border-none text-white px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold disabled:opacity-70 transition-colors"
                            >
                              {isSaving ? "Lưu..." : "Lưu"}
                            </button>
                            <button
                              onClick={() => handleCancelClick(row.masv)}
                              disabled={isSaving}
                              className="bg-[#EAD9CB] hover:bg-[#D5C2B3] border-none text-[#6B4F43] px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold disabled:opacity-70 transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(row.masv)}
                            className="bg-transparent border border-[#F2A8A8] hover:bg-red-50 text-[#C25450] px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold transition-colors"
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
          <div className="flex justify-between p-4 border-t border-[#F0E1D9]">
            <span className="text-[13px] text-[#8B6F5F]">
              Hiển thị {filteredStudents.length} của {students.length} sinh viên học lớp này
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
