"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { parseExcelFile } from "@/services/service/admin/sinhvien.services/import.service";
import { useAuth } from "@/hooks/auth/useAuth";

// Định nghĩa Interface cơ bản giúp TypeScript hiểu rõ dữ liệu cấu trúc lớp học
interface Student {
  masv: string;
  tensv: string;
  trangthai: string;
  tiendo: string;
  phantram: number;
  chuyentab: number;
}

interface ClassAssignment {
  maphancong: string;
  tenmon: any;
  tenlop: any;
  soluongsv: number;
  students: Student[];
}

export function ExamRoom() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [excelStudents, setExcelStudents] = useState<Student[]>([]);
  const [selectedStudentList, setSelectedStudentList] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [examStep, setExamStep] = useState<number>(0);
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [currentExamId, setCurrentExamId] = useState<number | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [completedExams, setCompletedExams] = useState<any[]>([]);
  const [viewingCompletedExam, setViewingCompletedExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTime, setUpdatingTime] = useState(false);
  const [endingExam, setEndingExam] = useState(false);

  const [studentSource, setStudentSource] = useState<"system" | "excel">(
    "system",
  );
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Form chứa thông tin tạo ca thi mới
  const [newExamData, setNewExamData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: "",
    matkhau: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Form chứa thông tin chỉnh sửa thời gian
  const [editTimeData, setEditTimeData] = useState({
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: "",
  });

  const formatLocalDateTimeWithOffset = (dateTimeLocal: string) => {
    if (!dateTimeLocal) return "";
    const date = new Date(dateTimeLocal);
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const pad = (num: number) => String(Math.abs(num)).padStart(2, "0");
    const hours = pad(Math.floor(Math.abs(offset) / 60));
    const minutes = pad(Math.abs(offset) % 60);
    return `${dateTimeLocal}:00${sign}${hours}:${minutes}`;
  };

  // Tải dữ liệu lớp học ban đầu từ API phục vụ việc phân đề
  useEffect(() => {
    const initData = async () => {
      try {
        const classRes = await apiFetch("/api/giangvien/grades");
        if (!classRes.ok) {
          throw new Error(`Lỗi tải danh sách lớp (${classRes.status})`);
        }

        const classJson = await classRes.json();
        if (!classJson.success || !Array.isArray(classJson.data)) {
          throw new Error("Dữ liệu lớp không hợp lệ");
        }

        setClasses(classJson.data);

        // Tải danh sách đề thi và phiên giám sát
        const examRes = await apiFetch("/api/giangvien/exams");
        if (examRes.ok) {
          const examJson = await examRes.json();
          if (examJson.success && Array.isArray(examJson.data)) {
            const parseVNTime = (dateStr: string) => {
              if (!dateStr) return new Date();
              if (dateStr.includes("+") || dateStr.endsWith("Z")) {
                return new Date(dateStr);
              }
              const formatted = dateStr.replace(" ", "T");
              return new Date(`${formatted}+07:00`);
            };

            const now = new Date();
            const allExams = examJson.data;

            // Khôi phục ca thi đang diễn ra nếu có: thoigianbatdau <= now < thoigianketthuc
            const activeExam = allExams.find((exam: any) => {
              const start = parseVNTime(exam.thoigianbatdau);
              const end = parseVNTime(exam.thoigianketthuc);
              return start <= now && now < end;
            });

            if (activeExam) {
              setCurrentExam({
                id: activeExam.madethi,
                tieude: activeExam.tieude,
                tenmon: activeExam.tenmon,
                tenlop: activeExam.tenlop,
                thoigianlam: activeExam.thoigianlam,
                thoigianbatdau: activeExam.thoigianbatdau,
                thoigianketthuc: activeExam.thoigianketthuc,
                soluongsv: activeExam.ketquathi?.length ?? 0,
                ketquathi: activeExam.ketquathi || [],
              });
              setCurrentExamId(activeExam.madethi);
              setExamStep(3); // Vào thẳng màn hình giám sát Realtime
            }

            // Lọc ra các ca thi đã kết thúc: thoigianketthuc <= now
            const completed = allExams.filter((exam: any) => {
              const end = parseVNTime(exam.thoigianketthuc);
              return end <= now;
            });
            setCompletedExams(completed);
          }
        }
      } catch (err: any) {
        console.error("Lỗi đồng bộ dữ liệu lớp học phần:", err);
        alert(
          "Không lấy được danh sách lớp. Vui lòng kiểm tra đăng nhập hoặc thử lại.",
        );
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (studentSource === "system" && newExamData.maphancong) {
      fetchClassStudents(newExamData.maphancong);
    } else if (studentSource === "excel") {
      setSelectedStudentList(excelStudents);
    } else {
      setSelectedStudentList([]);
    }
  }, [studentSource, newExamData.maphancong, excelStudents]);

  useEffect(() => {
    // Chỉ tự động kiểm tra khi đang ở màn hình theo dõi thi (examStep > 0)
    if (examStep === 0 || !currentExam || !currentExam.thoigianketthuc) return;

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(currentExam.thoigianketthuc);

      if (now.getTime() >= end.getTime()) {
        clearInterval(interval);
        handleAutoEndExam();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [examStep, currentExam]);

  useEffect(() => {
    // Polling cập nhật trạng thái làm bài của sinh viên liên tục khi đang ở màn hình giám sát (bước 3)
    if (examStep !== 3 || !currentExamId) return;

    const fetchMonitorData = async () => {
      try {
        const res = await apiFetch(`/api/giangvien/exams/${currentExamId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // Cập nhật currentExam với dữ liệu mới (bao gồm ketquathi mới nhất để đếm tiến độ)
            setCurrentExam((prev: any) => ({ ...prev, ...json.data, ketquathi: json.data.ketquathi || [] }));
          }
        }
      } catch (err) {
        console.error("Lỗi cập nhật tiến độ:", err);
      }
    };

    // Gọi luôn 1 lần khi mới vào phòng
    fetchMonitorData();

    // Thiết lập chu kỳ 5 giây cập nhật 1 lần
    const interval = setInterval(fetchMonitorData, 5000);
    return () => clearInterval(interval);
  }, [examStep, currentExamId]);

  const handleAutoEndExam = async () => {
    // Hàm được bao trong try-catch, chạy ngầm tự kết thúc ca thi mà không cần xác nhận
    if (!currentExamId || endingExam) return;
    setEndingExam(true);
    try {
      const res = await apiFetch(`/api/giangvien/exams/${currentExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_EXAM" }),
      });
      
      if (res.ok) {
        if (currentExam) {
          setCompletedExams((prev) => [...prev, { ...currentExam, madethi: currentExamId }]);
        }
        setExamStep(0);
        setCurrentExam(null);
        setCurrentExamId(null);
        setActiveTab("completed");
        alert("Hết giờ! Hệ thống đã tự động kết thúc ca thi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEndingExam(false);
    }
  };

  const fetchClassStudents = async (maphancong: string) => {
    setStudentsLoading(true);
    try {
      const res = await apiFetch(
        `/api/giangvien/grades?maphancong=${maphancong}`,
      );
      if (!res.ok)
        throw new Error(`Lỗi tải danh sách sinh viên (${res.status})`);

      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error("Dữ liệu sinh viên không hợp lệ");
      }

      const students = json.data
        .map((item: any) => ({
          masv: item.masv || item.sinhvien?.masv || "",
          tensv:
            item.hoten ||
            `${item.sinhvien?.hodem || ""} ${item.sinhvien?.ten || ""}`.trim() ||
            "Không rõ",
          trangthai: "Chờ nhận đề",
          tiendo: "0/0",
          phantram: 0,
          chuyentab: 0,
        }))
        .filter((s: Student) => s.masv);

      setClassStudents(students);
      setSelectedStudentList(students);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách sinh viên của lớp này. Vui lòng thử lại.");
      setClassStudents([]);
      setSelectedStudentList([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleExcelFileChange = async (file: File | null) => {
    setExcelFile(file);
    if (!file) {
      setExcelStudents([]);
      setSelectedStudentList([]);
      return;
    }

    try {
      const parsed = await parseExcelFile(file);
      const students = parsed.rows
        .filter((row) => row.masv)
        .map((row) => ({
          masv: row.masv,
          tensv:
            row.hoten || (row as any).fullname || (row as any).ho || "Không rõ",
          trangthai: "Chờ nhận đề",
          tiendo: "0/0",
          phantram: 0,
          chuyentab: 0,
        }));

      if (students.length === 0) {
        throw new Error("File danh sách sinh viên không chứa mã SV hợp lệ.");
      }

      setExcelStudents(students);
      if (studentSource === "excel") setSelectedStudentList(students);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message ||
          "Không thể đọc file Excel danh sách sinh viên. Vui lòng kiểm tra định dạng.",
      );
      setExcelStudents([]);
      setSelectedStudentList([]);
      setExcelFile(null);
    }
  };

  // Hàm tiện ích phân tách và bóc dữ liệu tên hiển thị an toàn
  const getDisplayNames = (c: any) => {
    let môn = "Môn học phần";
    let lớp = "Lớp học";

    const monObj = c.monhoc || c.tenmon;
    if (monObj) {
      if (typeof monObj === "object") {
        môn = monObj.tenmon || Object.values(monObj)[0] || "Môn học phần";
      } else {
        môn = monObj;
      }
    }

    const lopObj = c.lop || c.tenlop;
    if (lopObj) {
      if (typeof lopObj === "object") {
        lớp = lopObj.tenlop || Object.values(lopObj)[0] || "Lớp học";
      } else {
        lớp = lopObj;
      }
    }

    // Nếu bóc tách ra vẫn bị rỗng hoặc trùng chữ mặc định, hiển thị kèm mã phân công cứu cánh
    const text =
      môn !== "Môn học phần" && lớp !== "Lớp học"
        ? `${môn} - ${lớp}`
        : `Lớp học phần (Mã phân công: ${c.maphancong})`;

    return { môn, lớp, text };
  };

  // Xử lý gửi dữ liệu Form lên API tạo ca thi (Bước 0 -> Bước 1)
  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamData.maphancong)
      return alert("Vui lòng lựa chọn lớp thi tiếp nhận!");
    if (!uploadFile) return alert("Vui lòng đính kèm tập tin đề thi!");
    if (studentSource === "excel" && selectedStudentList.length === 0)
      return alert("Vui lòng tải lên file danh sách sinh viên hợp lệ!");
    if (studentSource === "system" && selectedStudentList.length === 0)
      return alert(
        "Hệ thống chưa tải được danh sách sinh viên lớp này. Vui lòng kiểm tra lại.",
      );

    const startDate = new Date(newExamData.thoigianbatdau);
    const endDate = new Date(newExamData.thoigianketthuc);
    const now = new Date();

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return alert("Thời điểm mở phòng hoặc đóng đề thi không hợp lệ.");
    }

    if (startDate.getTime() < now.getTime()) {
      return alert(
        "Thời điểm mở phòng đề thi phải là hiện tại hoặc tương lai. Vui lòng chọn lại.",
      );
    }

    if (endDate.getTime() <= now.getTime()) {
      return alert(
        "Thời điểm đóng đề thi phải là thời điểm tương lai. Vui lòng chọn lại.",
      );
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return alert(
        "Thời điểm đóng đề thi phải lớn hơn thời điểm mở phòng đề thi.",
      );
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("maphancong", newExamData.maphancong);
      formData.append("tieude", newExamData.tieude);
      formData.append("mota", newExamData.mota);
      formData.append("thoigianlam", newExamData.thoigianlam.toString());
      formData.append(
        "thoigianbatdau",
        formatLocalDateTimeWithOffset(newExamData.thoigianbatdau),
      );
      formData.append(
        "thoigianketthuc",
        formatLocalDateTimeWithOffset(newExamData.thoigianketthuc),
      );
      formData.append("file", uploadFile);
      formData.append("studentSource", studentSource);

      if (studentSource === "excel" && excelFile) {
        formData.append("excelFile", excelFile);
      }

      const res = await apiFetch("/api/giangvien/exams", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson?.error || `Lỗi tạo ca thi (${res.status})`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Lỗi tạo ca thi");
      }

      const selectedClass = classes.find(
        (c) => String(c.maphancong) === String(newExamData.maphancong),
      );
      const names = selectedClass
        ? getDisplayNames(selectedClass)
        : { môn: "Môn học phần", lớp: "Lớp thi" };
      const returnedStudents = Array.isArray(json.data?.students)
        ? json.data.students
        : selectedStudentList;

      setCurrentExam({
        id: json.data?.madethi ?? null,
        tieude: newExamData.tieude,
        tenmon: names.môn,
        tenlop: selectedClass ? names.lớp : "Danh sách tải lên từ máy",
        thoigianlam: newExamData.thoigianlam,
        thoigianbatdau: newExamData.thoigianbatdau,
        thoigianketthuc: newExamData.thoigianketthuc,
        soluongsv: returnedStudents.length,
        ketquathi: returnedStudents,
      });

      setCurrentExamId(json.data?.madethi ?? null);
      setUploadFile(null);
      setExcelFile(null);
      setClassStudents([]);
      setExcelStudents([]);
      setShowCreateModal(false);
      setExamStep(1);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi hệ thống khi khởi tạo ca thi");
    } finally {
      setSubmitting(false);
    }
  };

  const parseExamStatusLabel = (status: string) => {
    switch (status) {
      case "DangLam":
        return "Đang làm";
      case "DaNop":
        return "Đã nộp";
      case "ViPham":
        return "Vi phạm";
      case "HetGio":
        return "Hết giờ";
      case "ChuaBatDau":
        return "Chưa bắt đầu";
      default:
        return "Chưa làm";
    }
  };

  const fetchExamMonitorData = useCallback(async () => {
    if (!currentExamId) return;
    setMonitorLoading(true);
    try {
      const res = await apiFetch(`/api/giangvien/exams/${currentExamId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Không thể tải dữ liệu giám sát.");
      }
      setCurrentExam((prev: any) => ({
        ...prev,
        ...json.data,
        ketquathi: json.data.ketquathi || [],
        soluongsv: json.data.ketquathi?.length ?? prev?.soluongsv,
      }));
    } catch (err: any) {
      console.error("Failed to load exam monitor data:", err);
    } finally {
      setMonitorLoading(false);
    }
  }, [currentExamId]);

  useEffect(() => {
    if (examStep !== 3 || !currentExamId) return;
    fetchExamMonitorData();
    const interval = setInterval(fetchExamMonitorData, 10000);
    return () => clearInterval(interval);
  }, [examStep, currentExamId, fetchExamMonitorData]);

  // Hành động chuẩn bị dữ liệu cũ và mở Modal sửa thời gian
  const openEditTimeModal = () => {
    if (currentExam) {
      const formatDateTimeLocal = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        );
        return localDate.toISOString().slice(0, 16);
      };

      setEditTimeData({
        thoigianlam: currentExam.thoigianlam,
        thoigianbatdau: formatDateTimeLocal(currentExam.thoigianbatdau),
        thoigianketthuc: formatDateTimeLocal(currentExam.thoigianketthuc),
      });
    }
    setShowEditTimeModal(true);
  };

  // Hành động cập nhật sửa đổi thời gian
  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExamId) {
      alert("Không xác định được ca thi để cập nhật.");
      return;
    }

    setUpdatingTime(true);
    try {
      const body = {
        action: "UPDATE_TIME",
        madethi: currentExamId,
        thoigianlam: editTimeData.thoigianlam,
        thoigianbatdau: formatLocalDateTimeWithOffset(
          editTimeData.thoigianbatdau,
        ),
        thoigianketthuc: formatLocalDateTimeWithOffset(
          editTimeData.thoigianketthuc,
        ),
      };

      const res = await apiFetch(`/api/giangvien/exams/${currentExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(
          errorJson?.error || `Lỗi cập nhật ca thi (${res.status})`,
        );
      }

      setCurrentExam((prev: any) => ({
        ...prev,
        thoigianlam: editTimeData.thoigianlam,
        thoigianbatdau: editTimeData.thoigianbatdau,
        thoigianketthuc: editTimeData.thoigianketthuc,
      }));

      alert("Cập nhật thời gian ca thi thành công!");
      setShowEditTimeModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi hệ thống khi cập nhật thời gian");
    } finally {
      setUpdatingTime(false);
    }
  };

  const handleDistributeExam = () => {
    if (!currentExam || !currentExam.soluongsv || currentExam.soluongsv === 0) {
      return alert(
        "Danh sách sinh viên chưa đủ. Vui lòng tải danh sách trước khi phát đề thi.",
      );
    }
    alert("Hệ thống phát thông báo đề thi đến sinh viên thành công.");
    setExamStep(2);
  };

  const handleEndExamClick = async () => {
    if (!currentExamId) {
      alert("Không xác định được ca thi để kết thúc.");
      return;
    }

    if (
      !confirm(
        "Bạn có chắc chắn muốn kết thúc ca thi này? Sinh viên sẽ bị khóa bài lập tức.",
      )
    ) {
      return;
    }

    setEndingExam(true);
    try {
      const res = await apiFetch(
        `/api/giangvien/exams/${currentExamId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "END_EXAM" }),
        }
      );

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(
          errorJson?.error || `Lỗi kết thúc ca thi (${res.status})`,
        );
      }

      alert("Ca thi đã được kết thúc thành công.");
      
      // Lưu ca thi đã kết thúc vào danh sách
      if (currentExam) {
        setCompletedExams((prev) => [...prev, { ...currentExam, madethi: currentExamId }]);
      }

      setExamStep(0);
      setCurrentExam(null);
      setCurrentExamId(null);
      setActiveTab("completed");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi hệ thống khi kết thúc ca thi");
    } finally {
      setEndingExam(false);
    }
  };

  const monitorStudents = currentExam?.ketquathi ?? [];
  const totalStudents = monitorStudents.length || currentExam?.soluongsv || 0;
  const workingCount = monitorStudents.filter((st: any) =>
    st.trangthai === "DangLam" || (st.starts && Number(st.starts) > 0),
  ).length;
  const submittedCount = monitorStudents.filter((st: any) =>
    ["DaNop", "ViPham", "HetGio"].includes(st.trangthai),
  ).length;
  const warningCount = monitorStudents.filter(
    (st: any) => st.trangthai === "ViPham",
  ).length;
  const notStartedCount = monitorStudents.filter(
    (st: any) => st.trangthai === "ChuaLam" && !(st.starts && Number(st.starts) > 0),
  ).length;

  if (loading)
    return (
      <div style={{ padding: "20px", color: "#8B6F5F" }}>
        Đang đồng bộ dữ liệu hệ thống...
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: "#FAF6F0",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* KHU VỰC HEADER TỔNG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#6B4F43",
              margin: 0,
            }}
          >
            Hệ thống Quản lý & Giám sát Thi
          </h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>
            Luồng khởi tạo ca thi, phát thông báo đề và giám sát AI Proctor
          </p>
        </div>

        {examStep > 0 && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={openEditTimeModal}
              style={{
                background: "white",
                border: "1px solid #EAD9CB",
                color: "#6B4F43",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ⚙️ Sửa thời gian
            </button>
            <button
              onClick={handleEndExamClick}
              disabled={endingExam}
              style={{
                background: "#D65D5D",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: endingExam ? "not-allowed" : "pointer",
                opacity: endingExam ? 0.65 : 1,
              }}
            >
              {endingExam ? "Đang kết thúc..." : "🛑 Kết thúc ca thi"}
            </button>
          </div>
        )}
      </div>

      {/* BƯỚC 0: HOÀN TOÀN CHƯA CÓ CA THI NÀO DIỄN RA */}
      {examStep === 0 && !viewingCompletedExam && (
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "2px solid #E5D4C1" }}>
            <button
              onClick={() => setActiveTab("ongoing")}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "ongoing" ? "#6B4F43" : "#8B6F5F",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                paddingBottom: "12px",
                borderBottom: activeTab === "ongoing" ? "2px solid #D65D5D" : "none",
              }}
            >
              📊 Đang tổ chức
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "completed" ? "#6B4F43" : "#8B6F5F",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                paddingBottom: "12px",
                borderBottom: activeTab === "completed" ? "2px solid #D65D5D" : "none",
              }}
            >
              ✅ Đã tổ chức ({completedExams.length})
            </button>
          </div>

          {/* Nội dung tab Đang tổ chức */}
          {activeTab === "ongoing" && (
            <div
              style={{
                padding: "80px 40px",
                textAlign: "center",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div style={{ fontSize: "55px" }}>🖥️</div>
              <div style={{ maxWidth: "500px" }}>
                <h3
                  style={{
                    color: "#6B4F43",
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    fontWeight: "700",
                  }}
                >
                  Hiện không có ca thi nào đang xảy ra
                </h3>
                <p
                  style={{
                    color: "#8B6F5F",
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  Hệ thống giám sát đang trống. Hãy thiết lập và mở một ca thi mới
                  bằng cách click vào nút phía bên dưới để phân phối đề cho sinh
                  viên.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                  color: "white",
                  padding: "12px 28px",
                  border: "none",
                  borderRadius: "25px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(242,168,168,0.4)",
                }}
              >
                + Tạo một ca thi mới ngay
              </button>
            </div>
          )}

          {/* Nội dung tab Đã tổ chức */}
          {activeTab === "completed" && (
            <div>
              {completedExams.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {completedExams.map((exam: any) => (
                    <div
                      key={exam.madethi}
                      onClick={() => setViewingCompletedExam(exam)}
                      style={{
                        padding: "16px",
                        background: "white",
                        border: "1px solid #F0E1D9",
                        borderRadius: "12px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", color: "#6B4F43", fontWeight: "600" }}>
                          {exam.tieude}
                        </h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "#8B6F5F" }}>
                          🏫 {exam.tenlop} • ⏱️ {exam.thoigianlam} phút
                        </p>
                      </div>
                      <button
                        style={{
                          background: "#6B4F43",
                          color: "white",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "80px 40px",
                    textAlign: "center",
                    background: "white",
                    border: "1px solid #F0E1D9",
                    borderRadius: "16px",
                    color: "#8B6F5F",
                    fontSize: "14px",
                  }}
                >
                  🗄️ Chưa có ca thi nào đã tổ chức.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Xem chi tiết ca thi đã tổ chức */}
      {viewingCompletedExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button
            onClick={() => setViewingCompletedExam(null)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              color: "#8B6F5F",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            ← Quay lại danh sách
          </button>

          <div style={{ padding: "20px", background: "white", border: "1px solid #F0E1D9", borderRadius: "12px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#6B4F43", fontSize: "16px", fontWeight: "700" }}>
              {viewingCompletedExam.tieude}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "12px", background: "#FAF6F0", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#8B6F5F", marginBottom: "4px" }}>Tổng sinh viên</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43" }}>
                  {viewingCompletedExam.ketquathi?.length ?? viewingCompletedExam.soluongsv ?? 0}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#EAFDF5", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#178A57", marginBottom: "4px", fontWeight: "600" }}>
                  Đã nộp
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#178A57" }}>
                  {viewingCompletedExam.ketquathi?.filter((st: any) =>
                    ["DaNop", "ViPham", "HetGio"].includes(st.trangthai),
                  ).length ?? 0}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#FFFBEB", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#B7791F", marginBottom: "4px", fontWeight: "600" }}>
                  Vi phạm
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#B7791F" }}>
                  {viewingCompletedExam.ketquathi?.filter((st: any) => st.trangthai === "ViPham").length ?? 0}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#F3F4F6", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#8B6F5F", marginBottom: "4px" }}>Không tham gia</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43" }}>
                  {viewingCompletedExam.ketquathi?.filter((st: any) => st.trangthai === "ChuaLam").length ?? 0}
                </div>
              </div>
            </div>

            <h4 style={{ margin: "16px 0 12px 0", color: "#6B4F43", fontSize: "13px", fontWeight: "700" }}>
              Danh sách kết quả sinh viên
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F0E1D9", textAlign: "left", color: "#8B6F5F" }}>
                  <th style={{ padding: "8px" }}>Sinh viên</th>
                  <th>Trạng thái</th>
                  <th>Tiến độ</th>
                  <th style={{ textAlign: "center" }}>Rời tab</th>
                </tr>
              </thead>
              <tbody>
                {viewingCompletedExam.ketquathi?.map((st: any) => (
                  <tr key={st.masv} style={{ borderBottom: "1px solid #FDF8F5" }}>
                    <td style={{ padding: "8px", fontWeight: "600", color: "#2D1B14" }}>
                      {st.tensv} ({st.masv})
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          background: st.trangthai === "ViPham" ? "#FFFBEB" : st.trangthai === "DaNop" ? "#EAFDF5" : "#F3F4F6",
                          color: st.trangthai === "ViPham" ? "#B7791F" : st.trangthai === "DaNop" ? "#178A57" : "#8B6F5F",
                        }}
                      >
                        {st.trangthai === "DaNop" ? "Đã nộp" : st.trangthai === "ViPham" ? "Vi phạm" : "Không tham gia"}
                      </span>
                    </td>
                    <td>{st.tiendo ?? "0%"}</td>
                    <td style={{ textAlign: "center", fontWeight: "bold", color: st.chuyentab > 0 ? "#D65D5D" : "#8B6F5F" }}>
                      {st.chuyentab} {st.chuyentab > 0 && "⚠️"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* BƯỚC 1: ĐÃ TẠO CA THI -> CHỜ SINH VIÊN VÀO PHÒNG */}
      {examStep === 1 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button
            onClick={() => setExamStep(0)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              color: "#8B6F5F",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            ← Quay lại màn hình tạo ca thi
          </button>

          <div
            style={{
              padding: "50px 30px",
              textAlign: "center",
              background: "white",
              border: "1px solid #F0E1D9",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div style={{ fontSize: "50px" }}>🖥️</div>
            <h3 style={{ color: "#6B4F43", margin: 0, fontSize: "18px" }}>
              Ca thi sắp bắt đầu: {currentExam.tieude}
            </h3>
            <p style={{ color: "#8B6F5F", margin: 0, fontSize: "13px" }}>
              Lớp tiếp nhận:{" "}
              <strong>
                {currentExam.tenmon} ({currentExam.tenlop})
              </strong>
            </p>
            <div
              style={{
                padding: "12px 25px",
                background: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#B7791F",
                margin: "10px 0",
              }}
            >
              🔔 Sĩ số tiếp nhận:{" "}
              <strong>{currentExam.soluongsv} sinh viên</strong>. Khi danh sách
              phòng thi ổn định, hãy nhấn nút <strong>Phát đề thi</strong>.
            </div>
            <button
              onClick={handleDistributeExam}
              style={{
                background: "#8B6F5F",
                color: "white",
                padding: "12px 30px",
                border: "none",
                borderRadius: "25px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🚀 Xác nhận danh sách đã đủ & Phát đề thi
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 2: ĐÃ PHÁT ĐỀ XONG -> GIAO DIỆN CHỜ KÍCH HOẠT GIÁM SÁT */}
      {examStep === 2 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button
            onClick={() => setExamStep(1)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              color: "#8B6F5F",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            ← Quay lại kiểm tra phòng chờ sinh viên
          </button>

          <div
            style={{
              width: "100%",
              background: "white",
              border: "1px solid #F0E1D9",
              borderRadius: "16px",
              padding: "50px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                background: "#FDF8F5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                border: "1px solid #F2A8A8",
              }}
            >
              <span style={{ fontSize: "32px", color: "#F2A8A8" }}>⚡</span>
            </div>

            <h2
              style={{
                color: "#6B4F43",
                fontSize: "22px",
                fontWeight: "700",
                margin: "0 0 12px 0",
              }}
            >
              Đang tiến hành ca thi:{" "}
              <span style={{ color: "#D65D5D" }}>{currentExam.tieude}</span>
            </h2>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  background: "#EAFDF5",
                  color: "#178A57",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#178A57",
                    borderRadius: "50%",
                  }}
                ></span>
                Đề thi đã được phân phối tự động ({currentExam.soluongsv} SV)
              </span>
            </div>

            <button
              onClick={() => setExamStep(3)}
              style={{
                background: "#8B6F5F",
                color: "white",
                padding: "12px 35px",
                border: "none",
                borderRadius: "25px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 4px 15px rgba(139,111,95,0.2)",
              }}
            >
              🔍 Kích hoạt & Vào phòng giám sát thi
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 3: GIAO DIỆN PHÒNG GIÁM SÁT CHI TIẾT */}
      {examStep === 3 && currentExam && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid #F0E1D9",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "#6B4F43", fontWeight: "600" }}
            >
              📌 Đang mở: Màn hình theo dõi Realtime số lượng {totalStudents}{" "}
              thí sinh nhận đề
            </span>
            <button
              onClick={() => setExamStep(2)}
              style={{
                background: "#8B6F5F",
                color: "white",
                padding: "8px 18px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              🚪 Thoát giám sát (Quay lại)
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "15px",
            }}
          >
            <div
              style={{
                padding: "15px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>
                Tổng sinh viên
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#2D1B14",
                  marginTop: "4px",
                }}
              >
                {totalStudents}
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                background: "#EAFDF5",
                border: "1px solid #F0E1D9",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#178A57",
                  fontWeight: "600",
                }}
              >
                Đang làm bài
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#178A57",
                  marginTop: "4px",
                }}
              >
                {monitorLoading ? "..." : workingCount}
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>
                Đã nộp bài
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#6B4F43",
                  marginTop: "4px",
                }}
              >
                {monitorLoading ? "..." : submittedCount}
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#8B6F5F" }}>
                Chưa bắt đầu
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#B7791F",
                  marginTop: "4px",
                }}
              >
                {monitorLoading ? "..." : notStartedCount}
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                background: "#FDF3F3",
                border: "1px solid #F2A8A8",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#D65D5D",
                  fontWeight: "600",
                }}
              >
                Cảnh báo AI
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#D65D5D",
                  marginTop: "4px",
                }}
              >
                {monitorLoading ? "..." : warningCount}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 2.5fr 1.2fr",
              gap: "20px",
            }}
          >
            <div
              style={{
                padding: "18px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                height: "fit-content",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#6B4F43",
                  borderBottom: "1px solid #EEE",
                  paddingBottom: "8px",
                }}
              >
                THÔNG TIN CA THI
              </h4>
              <div
                style={{
                  fontSize: "13px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  color: "#6B4F43",
                }}
              >
                <div>
                  📝 Ca thi: <strong>{currentExam.tieude || "Không rõ"}</strong>
                </div>
                <div>
                  ✏️ Môn học: <strong>{currentExam.tenmon || "Không rõ"}</strong>
                </div>
                <div>
                  👨‍🏫 Giảng viên coi thi: <strong>{user?.hoten || "Không rõ"}</strong>
                </div>
                <div>
                  ⏱️ Bắt đầu:{" "}
                  <strong>{currentExam.thoigianbatdau ? new Date(currentExam.thoigianbatdau).toLocaleString("vi-VN") : "Không rõ"}</strong>
                </div>
                <div>
                  🏁 Kết thúc:{" "}
                  <strong>{currentExam.thoigianketthuc ? new Date(currentExam.thoigianketthuc).toLocaleString("vi-VN") : "Không rõ"}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "20px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "12px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "14px",
                  color: "#6B4F43",
                }}
              >
                TIẾN ĐỘ VÀ TRẠNG THÁI SINH VIÊN
              </h4>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      color: "#8B6F5F",
                      borderBottom: "2px solid #F0E1D9",
                    }}
                  >
                    <th style={{ padding: "8px" }}>Họ tên sinh viên</th>
                    <th>Mã số SV</th>
                    <th>Trạng thái</th>
                    <th>Tiến độ</th>
                    <th>Lần vào</th>
                    <th style={{ textAlign: "center" }}>Rời tab</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExam.ketquathi?.map((st: any) => (
                    <tr
                      key={st.masv}
                      style={{ borderBottom: "1px solid #FDF8F5" }}
                    >
                      <td
                        style={{
                          padding: "12px 8px",
                          fontWeight: "600",
                          color: "#2D1B14",
                        }}
                      >
                        {st.tensv}
                      </td>
                      <td style={{ color: "#8B6F5F" }}>{st.masv}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            background:
                              st.trangthai === "ViPham" ? "#FFFBEB" : "#EAFDF5",
                            color:
                              st.trangthai === "ViPham" ? "#B7791F" : "#178A57",
                          }}
                        >
                          {parseExamStatusLabel(st.trangthai)}
                        </span>
                      </td>
                      <td>{st.tiendo}</td>
                      <td>{st.starts ?? 0}</td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          color: st.chuyentab > 0 ? "#D65D5D" : "inherit",
                        }}
                      >
                        {st.chuyentab} {st.chuyentab > 0 && "⚠️"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: "18px",
                background: "white",
                border: "1px solid #F0E1D9",
                borderRadius: "12px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "14px",
                  color: "#6B4F43",
                }}
              >
                NHẬT KÝ AI PROCTOR
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    background: "#FFFBEB",
                    borderLeft: "4px solid #F2C94C",
                    fontSize: "12px",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#B7791F",
                      fontWeight: "bold",
                    }}
                  >
                    <span>🚨 Chuyển màn hình</span> <span>Vừa xong</span>
                  </div>
                  <p style={{ margin: "4px 0 0", color: "#2D1B14" }}>
                    Có sinh viên rời khỏi tab làm bài.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHỞI TẠO CA THI MỚI */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(45, 27, 20, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleCreateExamSubmit}
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              width: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              border: "1px solid #F0E1D9",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#6B4F43",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              Thiết lập thông số Ca thi mới
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Lớp học tiếp nhận đề thi *
              </label>
              <select
                required
                value={newExamData.maphancong}
                onChange={(e) =>
                  setNewExamData({ ...newExamData, maphancong: e.target.value })
                }
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((c) => {
                  const names = getDisplayNames(c); // SỬA LỖI TẠI ĐÂY: Giải nén chuỗi an toàn trước khi render
                  return (
                    <option key={c.maphancong} value={c.maphancong}>
                      {names.text}
                    </option>
                  );
                })}
              </select>
            </div>

            <div
              style={{
                background: "#FAF6F0",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #EAD9CB",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#6B4F43",
                }}
              >
                Nguồn danh sách sinh viên phát đề:
              </label>

              <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: "#2D1B14",
                  }}
                >
                  <input
                    type="radio"
                    name="studentSource"
                    checked={studentSource === "system"}
                    onChange={() => setStudentSource("system")}
                  />
                  Học sinh thuộc lớp mặc định
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: "#2D1B14",
                  }}
                >
                  <input
                    type="radio"
                    name="studentSource"
                    checked={studentSource === "excel"}
                    onChange={() => setStudentSource("excel")}
                  />
                  Tải danh sách riêng lên (.xlsx)
                </label>
              </div>

              {studentSource === "system" ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginTop: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#178A57",
                      fontWeight: "500",
                    }}
                  >
                    ✓ Tự động lấy danh sách sinh viên hiện có của lớp được chọn
                    từ hệ thống để phát đề đúng đối tượng.
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B4F43" }}>
                    {studentsLoading
                      ? "Đang tải danh sách sinh viên..."
                      : `Số sinh viên tải được: ${classStudents.length}`}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#8B6F5F",
                    }}
                  >
                    Chọn tệp tin Excel từ máy tính:
                  </label>
                  <input
                    type="file"
                    required={studentSource === "excel"}
                    accept=".xlsx, .xls"
                    onChange={(e) =>
                      handleExcelFileChange(
                        e.target.files ? e.target.files[0] : null,
                      )
                    }
                    style={{ fontSize: "12px" }}
                  />
                  {excelStudents.length > 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6B4F43",
                        marginTop: "8px",
                      }}
                    >
                      Danh sách Excel đã tải:{" "}
                      <strong>{excelStudents.length}</strong> sinh viên.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Tiêu đề ca thi kiểm tra *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Kiểm tra giữa kỳ - Lập trình Web"
                value={newExamData.tieude}
                onChange={(e) =>
                  setNewExamData({ ...newExamData, tieude: e.target.value })
                }
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B4F43",
                  }}
                >
                  Thời lượng (phút) *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  value={newExamData.thoigianlam}
                  onChange={(e) =>
                    setNewExamData({
                      ...newExamData,
                      thoigianlam: Number(e.target.value),
                    })
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B4F43",
                  }}
                >
                  Mật khẩu phòng
                </label>
                <input
                  type="text"
                  placeholder="Bỏ trống nếu tự do"
                  value={newExamData.matkhau}
                  onChange={(e) =>
                    setNewExamData({ ...newExamData, matkhau: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Thời điểm mở phòng đề thi *
              </label>
              <input
                type="datetime-local"
                required
                value={newExamData.thoigianbatdau}
                onChange={(e) =>
                  setNewExamData({
                    ...newExamData,
                    thoigianbatdau: e.target.value,
                  })
                }
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Thời điểm đóng đề thi *
              </label>
              <input
                type="datetime-local"
                required
                value={newExamData.thoigianketthuc}
                onChange={(e) =>
                  setNewExamData({
                    ...newExamData,
                    thoigianketthuc: e.target.value,
                  })
                }
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Tập tin file đề thi (.pdf, .docx, .doc, .xlsx, .xls, .csv, .txt)
                *
              </label>
              <input
                type="file"
                required
                accept=".docx,.doc,.pdf,.xlsx,.xls,.csv,.txt"
                onChange={(e) =>
                  setUploadFile(e.target.files ? e.target.files[0] : null)
                }
                style={{ fontSize: "13px" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "#F5F5F5",
                  border: "1px solid #EAD9CB",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background:
                    "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {submitting ? "Đang xử lý..." : "Khởi tạo ca thi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SỬA THỜI GIAN CA THI */}
      {showEditTimeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(45, 27, 20, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <form
            onSubmit={handleEditTimeSubmit}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "420px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              border: "1px solid #F0E1D9",
            }}
          >
            <h3
              style={{
                margin: "0 0 5px",
                color: "#6B4F43",
                fontSize: "16px",
                fontWeight: "700",
              }}
            >
              Điều chỉnh thông số thời gian
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Thời gian làm bài (Phút):
              </label>
              <input
                type="number"
                required
                value={editTimeData.thoigianlam}
                onChange={(e) =>
                  setEditTimeData({
                    ...editTimeData,
                    thoigianlam: Number(e.target.value),
                  })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Thời điểm mở đề:
              </label>
              <input
                type="datetime-local"
                value={editTimeData.thoigianbatdau}
                onChange={(e) =>
                  setEditTimeData({
                    ...editTimeData,
                    thoigianbatdau: e.target.value,
                  })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B4F43",
                }}
              >
                Thời điểm khóa đề:
              </label>
              <input
                type="datetime-local"
                value={editTimeData.thoigianketthuc}
                onChange={(e) =>
                  setEditTimeData({
                    ...editTimeData,
                    thoigianketthuc: e.target.value,
                  })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #EAD9CB",
                  fontSize: "13px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowEditTimeModal(false)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "1px solid #EAD9CB",
                  background: "none",
                  color: "#6B4F43",
                  fontSize: "13px",
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={updatingTime}
                style={{
                  background:
                    "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                  color: "white",
                  padding: "6px 18px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {updatingTime ? "Đang cập nhật..." : "Cập nhật ngay"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
