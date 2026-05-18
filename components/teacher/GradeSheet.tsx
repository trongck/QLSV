"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function GradeSheet() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Nhập điểm &amp; Đánh giá kết quả</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Cập nhật điểm chuyên cần, bài tập, giữa kỳ và cuối kỳ trực tiếp</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", display: "flex", alignItems: "center", gap: "8px" }}>
            🔒 Lưu bảng điểm
          </button>
          <button style={{ border: "1px solid #EAD9CB", background: "white", padding: "10px 20px", borderRadius: "10px", fontSize: "14px", cursor: "pointer", color: "#6B4F43", fontWeight: "600" }}>
            📄 Xuất Excel
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "15px" }}>
        <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", outline: "none", color: "#6B4F43" }}>
          <option>Học kỳ: HK2 - 2025-2026</option>
        </select>
        <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", outline: "none", color: "#6B4F43" }}>
          <option>Lớp: Lập trình Web - K22</option>
        </select>
      </div>

      {/* Grading Table */}
      <section className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FDF8F5" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>STT</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>Mã SV</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#8B6F5F" }}>Họ và tên</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "110px" }}>Chuyên cần (10%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "110px" }}>Bài tập (20%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "110px" }}>Giữa kỳ (30%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F", width: "110px" }}>Cuối kỳ (40%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F" }}>Tổng kết</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#8B6F5F" }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {[
                { stt: 1, mssv: "22010001", name: "Nguyễn Văn A", d1: "9.0", d2: "8.5", d3: "7.5", d4: "8.0", total: "8.13" },
                { stt: 2, mssv: "22010002", name: "Trần Thị B", d1: "8.5", d2: "9.0", d3: "8.0", d4: "8.5", total: "8.45" },
                { stt: 3, mssv: "22010003", name: "Lê Văn C", d1: "9.5", d2: "7.5", d3: "6.5", d4: "7.0", total: "7.45" },
              ].map((row) => (
                <tr key={row.mssv} style={{ borderBottom: "1px solid #F0E1D9" }}>
                  <td style={{ padding: "12px" }}>{row.stt}</td>
                  <td style={{ padding: "12px" }}>{row.mssv}</td>
                  <td style={{ padding: "12px", fontWeight: "600", color: "#6B4F43" }}>{row.name}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="text" defaultValue={row.d1} className={styles.gradeInput} style={{ width: "50px", textAlign: "center", border: "1px solid #F0E1D9", borderRadius: "4px", padding: "4px" }} />
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="text" defaultValue={row.d2} className={styles.gradeInput} style={{ width: "50px", textAlign: "center", border: "1px solid #F0E1D9", borderRadius: "4px", padding: "4px" }} />
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="text" defaultValue={row.d3} className={styles.gradeInput} style={{ width: "50px", textAlign: "center", border: "1px solid #F0E1D9", borderRadius: "4px", padding: "4px" }} />
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="text" defaultValue={row.d4} className={styles.gradeInput} style={{ width: "50px", textAlign: "center", border: "1px solid #F0E1D9", borderRadius: "4px", padding: "4px" }} />
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontWeight: "700", color: "#6B4F43" }}>{row.total}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button style={{ 
                      background: "none", border: "1px solid #F2A8A8", color: "#F2A8A8", 
                      padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"
                    }}>
                      ✎ Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", padding: "15px 20px", borderTop: "1px solid #F0E1D9" }}>
          <span style={{ fontSize: "13px", color: "#8B6F5F" }}>Hiển thị 1-3 của 42 sinh viên</span>
          <div style={{ display: "flex", gap: "5px" }}>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: "#8B6F5F" }}>{"<"}</button>
            <button className={styles.activeMenu} style={{ width: "25px", height: "25px", borderRadius: "4px", border: "none", background: "#F2A8A8", color: "white", fontWeight: "bold" }}>1</button>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: "#8B6F5F" }}>2</button>
            <button style={{ border: "none", background: "none", cursor: "pointer", color: "#8B6F5F" }}>{">"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
