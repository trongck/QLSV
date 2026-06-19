import { taskRepo } from "@/services/repositories/giangvien/task.repo";
import { BaiTap } from "@/types";

interface TaskPhanCong {
  maphancong: number;
  monhoc: { tenmon: string } | null;
  lop: { tenlop: string } | null;
}

interface TaskUpdates {
  tieude?: string;
  title?: string;
  mota?: string;
  description?: string;
  hannop?: string;
  isoDate?: string;
  filedinh?: string;
}

interface TaskSubmissionRow {
  manopbai: number;
  noidungnop: string | null;
  filenop: string | null;
  thoigiannop: string;
  masv: string;
  sinhvien: { hodem: string | null; ten: string | null; malop: string } | null;
}

export const taskService = {
  /**
   * Lấy danh sách bài tập (tasks) của giảng viên (không làm chức năng Thêm mới)
   */
  async getTasks(magv: string) {
    // 1. Lấy danh sách phân công
    const { data: phancongList } = await taskRepo.getTasksPhanCong(magv);

    const typedPhancongList = phancongList as unknown as TaskPhanCong[] ?? [];
    const maphancongIds = typedPhancongList.map(pc => pc.maphancong);

    if (maphancongIds.length === 0) return [];

    // 2. Tính sĩ số (tổng sinh viên) mỗi lớp
    const { data: svCounts } = await taskRepo.getSinhVienMonHocCounts(maphancongIds);
      
    const sisoMap: Record<number, number> = {};
    (svCounts as { maphancong: number }[] ?? []).forEach(row => {
      sisoMap[row.maphancong] = (sisoMap[row.maphancong] ?? 0) + 1;
    });

    // 3. Lấy danh sách bài tập
    const { data: baitapList } = await taskRepo.getBaiTapList(maphancongIds);

    const typedBaitapList = baitapList as unknown as BaiTap[] ?? [];
    const mabaitapIds = typedBaitapList.map(bt => bt.mabaitap);

    // 4. Lấy số sinh viên đã nộp bài (tiến độ)
    const submittedMap: Record<number, number> = {};
    if (mabaitapIds.length > 0) {
      const { data: nopbaiList } = await taskRepo.getNopBaiCounts(mabaitapIds);
        
      (nopbaiList as { mabaitap: number }[] ?? []).forEach(row => {
        submittedMap[row.mabaitap] = (submittedMap[row.mabaitap] ?? 0) + 1;
      });
    }

    return typedBaitapList.map(bt => {
      const pc = typedPhancongList.find(p => p.maphancong === bt.maphancong);
      const className = pc ? `${pc.monhoc?.tenmon} - ${pc.lop?.tenlop}` : "—";
      const total = sisoMap[bt.maphancong] ?? 0;
      const done = submittedMap[bt.mabaitap] ?? 0;
      
      const isClosed = new Date(bt.hannop) < new Date();
      
      return {
        id: bt.mabaitap,
        title: bt.tieude,
        description: bt.mota,
        class: className,
        date: new Date(bt.hannop).toLocaleDateString("vi-VN"),
        isoDate: bt.hannop ? new Date(bt.hannop).toISOString() : "",
        done,
        total,
        label: isClosed ? "Đã đóng" : "Đang mở",
        color: isClosed ? "#d32f2f" : "#1e8e3e",
        bg: isClosed ? "#ffebee" : "#e6f4ea",
        maxScore: bt.diemtoida,
        filedinhUrl: bt.filedinh
      };
    });
  },

  /**
   * Cập nhật bài tập (không có thêm mới theo yêu cầu)
   */
  async updateTask(mabaitap: number, updates: TaskUpdates) {
    const updatePayload: Record<string, unknown> = {
      tieude: updates.tieude || updates.title,
      mota: updates.mota || updates.description,
      hannop: updates.hannop || updates.isoDate,
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    };

    if (updates.filedinh !== undefined) {
      updatePayload.filedinh = updates.filedinh;
    }

    const { error } = await taskRepo.updateTask(mabaitap, updatePayload);

    if (error) throw error;
    return true;
  },

  /**
   * Lấy danh sách bài nộp của một bài tập
   */
  async getTaskSubmissions(mabaitap: number) {
    const { data, error } = await taskRepo.getTaskSubmissions(mabaitap);

    if (error) throw error;
    
    return (data as unknown as TaskSubmissionRow[] ?? []).map(row => ({
      ...row,
      hoten: row.sinhvien ? `${row.sinhvien.hodem || ""} ${row.sinhvien.ten || ""}`.trim() : "—",
      malop: row.sinhvien?.malop || "—"
    }));
  },

  /**
   * Tạo mới bài tập (Giao bài tập)
   */
  async createTask(
    magv: string,
    taskData: {
      maphancong: number;
      tieude: string;
      mota: string;
      hannop: string;
      filedinh?: string;
    }
  ) {
    // Validate if maphancong belongs to magv
    const { data: pcCheck } = await taskRepo.checkPhanCongBelongsToTeacher(taskData.maphancong, magv);

    if (!pcCheck) {
      throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");
    }

    const { data, error } = await taskRepo.createTask({
      maphancong: taskData.maphancong,
      tieude: taskData.tieude,
      mota: taskData.mota,
      hannop: taskData.hannop,
      filedinh: taskData.filedinh,
      loai: "Baitap", // Fallback type
      diemtoida: 10,
      ngaytao: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", ""),
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    });

    if (error) throw error;

    // Create a notification for the students
    const { data: gvData } = await taskRepo.getGiangVienMataikhoan(magv);

    if (gvData?.mataikhoan) {
      await taskRepo.createNotification({
        mataikhoantao: gvData.mataikhoan,
        tieude: `Bài tập mới: ${taskData.tieude}`,
        noidung: `Giảng viên vừa giao bài tập mới: "${taskData.tieude}". Hạn nộp: ${new Date(taskData.hannop).toLocaleString("vi-VN")}. ${taskData.mota || ""}`,
        loai: "HocTap",
        doituong: "SinhVien",
        maphancong: taskData.maphancong,
        ghim: false
      });
    }

    return data;
  },
};
