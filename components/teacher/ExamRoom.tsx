"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

export function ExamRoom() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Quản lý các bước tuyến tính của ca thi: 
  // 0: Chưa có ca thi | 1: Đã tạo ca thi (Chờ SV ổn định) | 2: Đã phát đề thành công | 3: Đang mở tab giám sát chi tiết
  const [examStep, setExamStep] = useState<number>(0);

  // Lưu thông tin dữ liệu của ca thi sau khi tạo thành công
  const [currentExam, setCurrentExam] = useState<any>(null);

  // Khai báo điều khiển Trạng thái Modal Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTime, setUpdatingTime] = useState(false);

  // --- THÀNH PHẦN MỞ RỘNG: QUAN LÝ NGUỒN DANH SÁCH SINH VIÊN ---
  // "system": Lấy tự động sinh viên của lớp đang dạy | "excel": Tải danh sách riêng từ máy tính
  const [studentSource, setStudentSource] = useState<"system" | "excel">("system");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Form chứa thông tin tạo ca thi mới
  const [newExamData, setNewExamData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: "",
    matkhau: ""
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Form chứa thông tin chỉnh sửa thời gian
  const [editTimeData, setEditTimeData] = useState({
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: ""
  });

  // Tải dữ liệu lớp học ban đầu từ API phục vụ việc phân đề
  useEffect(() => {
    const initData = async () => {
      try {
        const classRes = await apiFetch("/api/giangvien/grades");
        const classJson = await classRes.json();
        if (classJson.success) {
          setClasses(classJson.data);
        } else {
          // Mock dữ liệu lớp và danh sách học sinh mẫu nếu API chưa có dữ liệu sẵn
          setClasses([
            {
              maphancong: "PC001",
              tenmon: "Lập trình Web nâng cao",
              tenlop: "DCT1211",
              soluongsv: 3,
              students: [
                { masv: "20110601", tensv: "Nguyễn Văn An", trangthai: "Đang làm", tiendo: "28/35", phantram: 80, chuyentab: 0 },
                { masv: "20110602", tensv: "Trần Thị Bình", trangthai: "Đang làm", tiendo: "20/35", phantram: 57, chuyentab: 2 },
                { masv: "20110603", tensv: "Lê Minh Cường", trangthai: "Đang làm", tiendo: "15/35", phantram: 43, chuyentab: 1 }
              ]
            }
          ]);
        }
        setExamStep(0);
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu lớp học phần:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Xử lý gửi dữ liệu Form lên API tạo ca thi (Bước 0 -> Bước 1)
  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamData.maphancong) return alert("Vui lòng lựa chọn lớp thi tiếp nhận!");
    if (!uploadFile) return alert("Vui lòng đính kèm tập tin đề thi!");
    if (studentSource === "excel" && !excelFile) return alert("Vui lòng tải lên file danh sách sinh viên!");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("maphancong", newExamData.maphancong);
      formData.append("tieude", newExamData.tieude);
      formData.append("thoigianlam", newExamData.thoigianlam.toString());
      formData.append("thoigianbatdau", new Date(newExamData.thoigianbatdau).toISOString());
      formData.append("thoigianketthuc", new Date(newExamData.thoigianketthuc).toISOString());
      formData.append("file", uploadFile);
      
      // Gửi thêm thông tin về nguồn sinh viên lên backend
      formData.append("studentSource", studentSource);
      if (studentSource === "excel" && excelFile) {
        formData.append("excelFile", excelFile);
      }

      // Mô phỏng đẩy dữ liệu thực tế lên API Backend
      // const res = await apiFetch("/api/giangvien/exams", { method: "POST", body: formData });
      // const json = await res.json();

      const selectedClass = classes.find(c => c.maphancong === newExamData.maphancong);
      
      // BIẾN XỬ LÝ LOGIC ĐẾM SĨ SỐ THEO THIẾT LẬP CỦA BẠN
      let finalStudentsList = [];
      let totalStudentsCount = 0;

      if (studentSource === "system") {
        // Luồng 1: Lấy danh sách đang dạy đồng bộ từ lớp hệ thống
        finalStudentsList = selectedClass?.students || [];
        totalStudentsCount = selectedClass?.soluongsv || finalStudentsList.length;
      } else {
        // Luồng 2: Lấy danh sách từ file Excel upload (Giả lập đọc dữ liệu thành công từ file máy tính)
        finalStudentsList = [
          { masv: "EXCEL-01", tensv: "Sinh viên từ file máy tính A", trangthai: "Đang làm", tiendo: "0/35", phantram: 0, chuyentab: 0 },
          { masv: "EXCEL-02", tensv: "Sinh viên từ file máy tính B", trangthai: "Đang làm", tiendo: "0/35", phantram: 0, chuyentab: 0 }
        ];
        totalStudentsCount = finalStudentsList.length;
      }

      setCurrentExam({
        id: "mock-id-123",
        tieude: newExamData.tieude,
        tenmon: selectedClass?.tenmon || "Môn học phần",
        tenlop: studentSource === "system" ? (selectedClass?.tenlop || "Lớp thi") : "Danh sách tải lên từ máy",
        thoigianlam: newExamData.thoigianlam,
        thoigianbatdau: newExamData.thoigianbatdau,
        thoigianketthuc: newExamData.thoigianketthuc,
        soluongsv: totalStudentsCount, // Hệ thống biết được tổng số sinh viên tham gia ca này
        ketquathi: finalStudentsList   // Phát đề đúng và biết được sinh viên nào đang làm bài
      });

      setShowCreateModal(false);
      setExamStep(1); // Chuyển sang Bước 1: Màn hình danh sách ca thi chờ SV vào phòng
    } catch (err) {
      alert("Lỗi hệ thống khi khởi tạo ca thi");
    } finally {
      setSubmitting(false);
    }
  };

  // Hành động chuẩn bị dữ liệu cũ và mở Modal sửa thời gian
  const openEditTimeModal = () => {
    if (currentExam) {
      setEditTimeData({
        thoigianlam: currentExam.thoigianlam,
        thoigianbatdau: currentExam.thoigianbatdau || "",
        thoigianketthuc: currentExam.thoigianketthuc || ""
      });
    }
    setShowEditTimeModal(true);
  };

  // Hành động cập nhật sửa đổi thời gian (Gửi API)
  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTime(true);
    try {
      setCurrentExam((prev: any) => ({
        ...prev,
        thoigianlam: editTimeData.thoigianlam,
        thoigianbatdau: editTimeData.thoigianbatdau,
        thoigianketthuc: editTimeData.thoigianketthuc
      }));

      alert("Cập nhật thay đổi thời gian ca thi thành công!");
      setShowEditTimeModal(false);
    } catch (err) {
      alert("Lỗi hệ thống khi cập nhật thời gian");
    } finally {
      setUpdatingTime(false);
    }
  };

  // Hành động Phát đề cho sinh viên (Bước 1 -> Bước 2)
  const handleDistributeExam = () => {
    alert("Hệ thống phát thông báo đẩy trực tiếp! Sinh viên hiện tại đã có thể vào làm bài.");
    setExamStep(2); // Bước 2: Xuất hiện nút vào phòng giám sát
  };

  // Kết thúc ca thi sớm
  const handleEndExamClick = () => {
    if (confirm("Bạn có chắc chắn muốn kết thúc ca thi này? Sinh viên sẽ bị khóa bài lập tức.")) {
      setExamStep(0);
      setCurrentExam(null);
    }
  };

  if (loading) return <div style={{ padding: "20px", color: "#8B6F5F" }}>Đang đồng bộ dữ liệu hệ thống...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#FAF6F0", minHeight: "100vh", padding: "20px" }}>
      
      {/* KHU VỰC HEADER TỔNG */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hệ thống Quản lý & Giám sát Thi</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Luồng khởi tạo ca thi, phát thông báo đề và giám sát AI Proctor</p>
        </div>

        {examStep > 0 && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={openEditTimeModal} style={{ background: "white", border: "1px solid #EAD9CB", color: "#6B4F43", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
               Sửa thời gian
            </button>
            <button onClick={handleEndExamClick} style={{ background: "#D65D5D", color: "white", padding: "8px 16px", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
               Kết thúc ca thi
            </button>
          </div>
        )}
      </div>

      {/* BƯỚC 0: HOÀN TOÀN CHƯA CÓ CA THI NÀO DIỄN RA */}
      {examStep === 0 && (
        <div style={{ padding: "80px 40px", textAlign: "center", background: "white", border: "1px solid #F0E1D9", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

          <div style={{ maxWidth: "500px" }}>
            <h3 style={{ color: "#6B4F43", margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Hiện không có ca thi nào đang xảy ra</h3>
            <p style={{ color: "#8B6F5F", margin: 0, fontSize: "13px", lineHeight: "1.6" }}>
              Hệ thống giám sát đang trống. Hãy thiết lập và mở một ca thi mới bằng cách click vào nút phía bên dưới để phân phối đề cho sinh viên.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", padding: "12px 28px", border: "none", borderRadius: "25px", fontWeight: "600", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 12px rgba(242,168,168,0.4)" }}>
             Tạo một ca thi mới ngay
          </button>
        </div>
      )}

      {/* BƯỚC 1: ĐÃ TẠO CA THI -> CHỜ SINH VIÊN VÀO PHÒNG */}
      {examStep === 1 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button onClick={() => setExamStep(0)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#8B6F5F", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
            Quay lại màn hình tạo ca thi
          </button>

          <div style={{ padding: "50px 30px", textAlign: "center", background: "white", border: "1px solid #F0E1D9", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "50px" }}>🖥️</div>
            <h3 style={{ color: "#6B4F43", margin: 0, fontSize: "18px" }}>Ca thi sắp bắt đầu: {currentExam.tieude}</h3>
            <p style={{ color: "#8B6F5F", margin: 0, fontSize: "13px" }}>Lớp tiếp nhận: <strong>{currentExam.tenmon} ({currentExam.tenlop})</strong></p>
            <div style={{ padding: "12px 25px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", fontSize: "13px", color: "#B7791F", margin: "10px 0" }}>
               Sĩ số tiếp nhận: <strong>{currentExam.soluongsv} sinh viên</strong>. Khi danh sách phòng thi ổn định, hãy nhấn nút <strong>Phát đề thi</strong>.
            </div>
            <button onClick={handleDistributeExam} style={{ background: "#8B6F5F", color: "white", padding: "12px 30px", border: "none", borderRadius: "25px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
               Xác nhận danh sách đã đủ & Phát đề thi
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 2: ĐÃ PHÁT ĐỀ XONG -> GIAO DIỆN CHỜ KÍCH HOẠT GIÁM SÁT */}
      {examStep === 2 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button onClick={() => setExamStep(1)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#8B6F5F", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
             Quay lại kiểm tra phòng chờ sinh viên
          </button>

          <div style={{ width: "100%", background: "white", border: "1px solid #F0E1D9", borderRadius: "16px", padding: "50px 40px", textAlign: "center" }}>
            <div style={{ width: "70px", height: "70px", background: "#FDF8F5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "1px solid #F2A8A8" }}>
              <span style={{ fontSize: "32px", color: "#F2A8A8" }}>⚡</span>
            </div>

            <h2 style={{ color: "#6B4F43", fontSize: "22px", fontWeight: "700", margin: "0 0 12px 0" }}>
              Đang tiến hành ca thi: <span style={{ color: "#D65D5D" }}>{currentExam.tieude}</span>
            </h2>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ background: "#EAFDF5", color: "#178A57", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", background: "#178A57", borderRadius: "50%" }}></span>
                Đề thi đã được phân phối tự động ({currentExam.soluongsv} SV)
              </span>
            </div>

            <button 
              onClick={() => setExamStep(3)} 
              style={{ background: "#8B6F5F", color: "white", padding: "12px 35px", border: "none", borderRadius: "25px", fontWeight: "600", cursor: "pointer", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(139,111,95,0.2)" }}
            >
               Kích hoạt & Vào phòng giám sát thi
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 3: GIAO DIỆN PHÒNG GIÁM SÁT CHI TIẾT (3 CỘT REALTIME) */}
      {examStep === 3 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "12px 20px", borderRadius: "12px", border: "1px solid #F0E1D9" }}>
            <span style={{ fontSize: "14px", color: "#6B4F43", fontWeight: "600" }}>
               Đang mở: Màn hình theo dõi Realtime số lượng {currentExam.soluongsv} thí sinh nhận đề
            </span>
            <button onClick={() => setExamStep(2)} style={{ background: "#8B6F5F", color: "white", padding: "8px 18px", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
               Thoát giám sát (Quay lại)
            </button>
          </div>

          {/* Hàng Khối Số Liệu Thống Kê Tổng Quan */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
            <div style={{ padding: "15px", background: "white", border: "1px solid #F0E1D9", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>Tổng sinh viên</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#2D1B14", marginTop: "4px" }}>{currentExam.soluongsv}</div>
            </div>
            <div style={{ padding: "15px", background: "#EAFDF5", border: "1px solid #F0E1D9", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#178A57", fontWeight: "600" }}>Đang làm bài</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#178A57", marginTop: "4px" }}>{currentExam.ketquathi?.length}</div>
            </div>
            <div style={{ padding: "15px", background: "white", border: "1px solid #F0E1D9", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>Đã nộp bài</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#6B4F43", marginTop: "4px" }}>0</div>
            </div>
            <div style={{ padding: "15px", background: "white", border: "1px solid #F0E1D9", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>Chưa bắt đầu</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#B7791F", marginTop: "4px" }}>0</div>
            </div>
            <div style={{ padding: "15px", background: "#FDF3F3", border: "1px solid #F2A8A8", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#D65D5D", fontWeight: "600" }}>Cảnh báo AI</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#D65D5D", marginTop: "4px" }}>1</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 2.5fr 1.2fr", gap: "20px" }}>
            {/* Cột 1: Chi tiết Phòng ca thi */}
            <div style={{ padding: "18px", background: "white", border: "1px solid #F0E1D9", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", height: "fit-content" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#6B4F43", borderBottom: "1px solid #EEE", paddingBottom: "8px" }}>THÔNG TIN CA THI</h4>
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px", color: "#6B4F43" }}>
                <div> Học phần: <strong>{currentExam.tenmon}</strong></div>
                <div> Nguồn: <strong>{currentExam.tenlop}</strong></div>
                <div> Thời gian làm: <strong>{currentExam.thoigianlam} phút</strong></div>
              </div>
            </div>

            {/* Cột 2: Bảng Danh Sách Theo Dõi Realtime */}
            <div style={{ padding: "20px", background: "white", border: "1px solid #F0E1D9", borderRadius: "12px" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#6B4F43" }}>TIẾN ĐỘ VÀ TRẠNG THÁI SINH VIÊN</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#8B6F5F", borderBottom: "2px solid #F0E1D9" }}>
                    <th style={{ padding: "8px" }}>Họ tên sinh viên</th>
                    <th>Mã số SV</th>
                    <th>Trạng thái</th>
                    <th>Tiến độ</th>
                    <th style={{ textAlign: "center" }}>Rời tab</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExam.ketquathi?.map((st: any) => (
                    <tr key={st.masv} style={{ borderBottom: "1px solid #FDF8F5" }}>
                      <td style={{ padding: "12px 8px", fontWeight: "600", color: "#2D1B14" }}>{st.tensv}</td>
                      <td style={{ color: "#8B6F5F" }}>{st.masv}</td>
                      <td>
                        <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "10px", background: st.chuyentab > 0 ? "#FFFBEB" : "#EAFDF5", color: st.chuyentab > 0 ? "#B7791F" : "#178A57" }}>
                          {st.chuyentab > 0 ? "Cảnh báo" : "Đang làm"}
                        </span>
                      </td>
                      <td>{st.tiendo}</td>
                      <td style={{ textAlign: "center", fontWeight: "bold", color: st.chuyentab > 0 ? "#D65D5D" : "inherit" }}>
                        {st.chuyentab}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cột 3: Nhật ký phát hiện gian lận AI */}
            <div style={{ padding: "18px", background: "white", border: "1px solid #F0E1D9", borderRadius: "12px" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#6B4F43" }}>NHẬT KÝ AI PROCTOR</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "10px", background: "#FFFBEB", borderLeft: "4px solid #F2C94C", fontSize: "12px", borderRadius: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#B7791F", fontWeight: "bold" }}>
                    <span> Chuyển màn hình</span> <span>Vừa xong</span>
                  </div>
                  <p style={{ margin: "4px 0 0", color: "#2D1B14" }}>Có sinh viên rời khỏi tab làm bài.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM HỘP THOẠI MODAL KHỞI TẠO CA THI MỚI (TÍCH HỢP QUẢN LÝ LUỒNG SINH VIÊN) --- */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(45, 27, 20, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateExamSubmit} style={{ background: "white", padding: "30px", borderRadius: "16px", width: "480px", display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #F0E1D9", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: 0, color: "#6B4F43", fontWeight: "bold", fontSize: "18px" }}>Thiết lập thông số Ca thi mới</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Lớp học tiếp nhận đề thi *</label>
              <select required value={newExamData.maphancong} onChange={e => setNewExamData({ ...newExamData, maphancong: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }}>
                <option value="">-- Chọn lớp học --</option>
                {classes.map((c: any) => (
                  <option key={c.maphancong} value={c.maphancong}>{c.tenmon} - {c.tenlop}</option>
                ))}
              </select>
            </div>

            {/* CẢI TIẾN THÊM: KHỐI CHỌN DANH SÁCH THÍ SINH NHẬN ĐỀ TỰ ĐỘNG/ FILE EXCEL */}
            <div style={{ background: "#FAF6F0", padding: "15px", borderRadius: "8px", border: "1px solid #EAD9CB", display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F43" }}>Nguồn danh sách sinh viên phát đề:</label>
              
              <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#2D1B14" }}>
                  <input type="radio" name="studentSource" checked={studentSource === "system"} onChange={() => setStudentSource("system")} />
                  Học sinh thuộc lớp mặc định
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#2D1B14" }}>
                  <input type="radio" name="studentSource" checked={studentSource === "excel"} onChange={() => setStudentSource("excel")} />
                  Tải danh sách riêng lên (.xlsx)
                </label>
              </div>

              {studentSource === "system" ? (
                <div style={{ fontSize: "12px", color: "#178A57", fontWeight: "500", marginTop: "2px" }}>
                  ✓ Tự động lấy danh sách sinh viên hiện có của lớp được chọn từ hệ thống để phát đề đúng đối tượng.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#8B6F5F" }}>Chọn tệp tin Excel từ máy tính:</label>
                  <input type="file" required accept=".xlsx, .xls" onChange={e => setExcelFile(e.target.files ? e.target.files[0] : null)} style={{ fontSize: "12px" }} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Tiêu đề ca thi kiểm tra *</label>
              <input type="text" required placeholder="Ví dụ: Kiểm tra giữa kỳ - Lập trình Web" value={newExamData.tieude} onChange={e => setNewExamData({ ...newExamData, tieude: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời lượng (phút) *</label>
                <input type="number" required min={5} value={newExamData.thoigianlam} onChange={e => setNewExamData({ ...newExamData, thoigianlam: Number(e.target.value) })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Mật khẩu phòng</label>
                <input type="text" placeholder="Bỏ trống nếu tự do" onChange={e => setNewExamData({ ...newExamData, matkhau: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời điểm mở phòng đề thi *</label>
              <input type="datetime-local" required value={newExamData.thoigianbatdau} onChange={e => setNewExamData({ ...newExamData, thoigianbatdau: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời điểm đóng đề thi *</label>
              <input type="datetime-local" required value={newExamData.thoigianketthuc} onChange={e => setNewExamData({ ...newExamData, thoigianketthuc: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Tập tin file đề thi (.pdf, .docx) *</label>
              <input type="file" required accept=".docx,.pdf" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} style={{ fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: "#F5F5F5", border: "1px solid #EAD9CB", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Hủy bỏ</button>
              <button type="submit" disabled={submitting} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", border: "none", color: "white", padding: "8px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                {submitting ? "Đang xử lý..." : "Khởi tạo ca thi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- FORM HỘP THOẠI MODAL SỬA THỜI GIAN CA THI --- */}
      {showEditTimeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(45, 27, 20, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <form onSubmit={handleEditTimeSubmit} style={{ background: "white", padding: "25px", borderRadius: "12px", width: "420px", display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #F0E1D9" }}>
            <h3 style={{ margin: "0 0 5px", color: "#6B4F43", fontSize: "16px", fontWeight: "700" }}>Điều chỉnh thông số thời gian</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời gian làm bài (Phút):</label>
              <input type="number" required value={editTimeData.thoigianlam} onChange={e => setEditTimeData({ ...editTimeData, thoigianlam: Number(e.target.value) })} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời điểm mở đề:</label>
              <input type="datetime-local" value={editTimeData.thoigianbatdau} onChange={e => setEditTimeData({ ...editTimeData, thoigianbatdau: e.target.value })} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B4F43" }}>Thời điểm khóa đề:</label>
              <input type="datetime-local" value={editTimeData.thoigianketthuc} onChange={e => setEditTimeData({ ...editTimeData, thoigianketthuc: e.target.value })} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowEditTimeModal(false)} style={{ padding: "6px 14px", borderRadius: "6px", cursor: "pointer", border: "1px solid #EAD9CB", background: "none", color: "#6B4F43", fontSize: "13px" }}>Hủy bỏ</button>
              <button type="submit" disabled={updatingTime} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", padding: "6px 18px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                {updatingTime ? "Đang cập nhật..." : "Cập nhật ngay"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}