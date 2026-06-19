import { diemdanhRepo } from "@/services/repositories/giangvien/diemdanh.repo";

interface AttendancePhanCong {
  maphancong: number;
  malop: string;
  malophoc: string | null;
  monhoc: { mamon: string; tenmon: string } | null;
  lop: { tenlop: string } | null;
}

interface AttendanceBuoiHoc {
  mabuoihoc: number;
  malichhoc: number;
  ngayhoc: string;
  trangthai: string;
  qr_secret: string | null;
  maphancong?: number;
}

interface AttendanceDonXinNghi {
  madon: number;
  masv: string;
  mabuoihoc: number;
  lydo: string;
  minhchung: string | null;
  trangthai: string;
  ngaytao: string;
  ngaycapnhat: string;
  sinhvien: { hodem: string | null; ten: string | null } | null;
}

interface AttendanceListSvMonHoc {
  masv: string;
  sinhvien: { hodem: string | null; ten: string | null; face_embedding: number[] | null } | null;
}

interface AttendanceListDiemDanh {
  masv: string;
  trangthai: string;
  ghichu: string | null;
  thoigiandiemdanh: string | null;
}

export const diemDanhService = {
  /**
   * Lấy danh sách phân công học tập & buổi học & đơn xin nghỉ của giảng viên
   */
  async getAttendanceOverview(magv: string) {
    // A. Lấy danh sách phân công đang hiệu lực
    const { data: phancongList } = await diemdanhRepo.getAttendancePhanCong(magv);

    const maphancongIds = (phancongList as unknown as AttendancePhanCong[] ?? []).map(p => p.maphancong);

    // B. Lấy tất cả lịch học tương ứng
    let lichhocList: { malichhoc: number; maphancong: number }[] = [];
    if (maphancongIds.length > 0) {
      const { data: lichAll } = await diemdanhRepo.getLichHocList(maphancongIds);
      lichhocList = (lichAll as { malichhoc: number; maphancong: number }[] ?? []);
    }
    const maphantramIds = lichhocList.map(l => l.malichhoc);

    // C. Lấy các buổi học của lịch học này
    let buoiHocList: AttendanceBuoiHoc[] = [];
    if (maphantramIds.length > 0) {
      const { data: bhAll } = await diemdanhRepo.getBuoiHocList(maphantramIds);

      const lichMap = new Map(lichhocList.map(l => [l.malichhoc, l.maphancong]));
      buoiHocList = (bhAll as unknown as AttendanceBuoiHoc[] ?? []).map(bh => ({
        ...bh,
        maphancong: lichMap.get(bh.malichhoc)
      }));
    }

    // D. Lấy các đơn xin nghỉ học của học sinh thuộc các buổi học này
    let dsDonXinNghi: {
      id: number;
      mssv: string;
      name: string;
      class: string;
      dateRequested: string;
      reason: string;
      dateSubmitted: string;
      evidence: string;
      status: string;
    }[] = [];
    if (buoiHocList.length > 0) {
      const mabuoihocIds = buoiHocList.map(b => b.mabuoihoc);
      const { data: donList } = await diemdanhRepo.getDonXinNghiList(mabuoihocIds);

      // Gắn thông tin lớp & môn cho đơn
      const buoiHocMap = new Map(buoiHocList.map(b => [b.mabuoihoc, b]));
      const lichhocMap = new Map(lichhocList.map(l => [l.malichhoc, l]));
      const phancongMap = new Map((phancongList as unknown as AttendancePhanCong[] ?? []).map(p => [p.maphancong, p]));

      dsDonXinNghi = (donList as unknown as AttendanceDonXinNghi[] ?? []).map(don => {
        const bh = buoiHocMap.get(don.mabuoihoc);
        const lh = bh ? lichhocMap.get(bh.malichhoc) : null;
        const pc = lh ? phancongMap.get(lh.maphancong) : null;
        const sv = don.sinhvien;
        const hoten = sv ? `${sv.hodem || ""} ${sv.ten || ""}`.trim() : "Sinh viên";
        return {
          id: don.madon,
          mssv: don.masv,
          name: hoten || "Sinh viên",
          class: pc ? `${pc.monhoc?.tenmon} - ${pc.lop?.tenlop}` : "Lớp học phần",
          dateRequested: bh ? bh.ngayhoc : "—",
          reason: don.lydo,
          dateSubmitted: don.ngaytao ? new Date(don.ngaytao).toISOString().slice(0, 10) : "—",
          evidence: don.minhchung ?? "Khong_co",
          status: don.trangthai === "ChoDuyet" ? "Chờ duyệt" : don.trangthai === "DaDuyet" ? "Đã duyệt" : "Từ chối"
        };
      });
    }

    return {
      dsLop: (phancongList as unknown as AttendancePhanCong[] ?? []).map(p => ({
        maphancong: p.maphancong,
        malophoc: p.malophoc ?? p.malop,
        tenmon: p.monhoc?.tenmon ?? "—",
        mamon: p.monhoc?.mamon ?? "—",
        tenlop: p.lop?.tenlop ?? "—",
      })),
      buoiHocList,
      dsDonXinNghi
    };
  },

  /**
   * Lấy danh sách điểm danh chi tiết của một buổi học
   */
  async getAttendanceList(mabuoihoc: number, maphancong: number) {
    // 1. Lấy danh sách sinh viên đang học của lớp học phần
    const { data: svMonHoc } = await diemdanhRepo.getSinhVienMonHocList(maphancong);

    if (!svMonHoc) return [];

    // 2. Lấy dữ liệu điểm danh hiện có cho buổi học này
    const { data: ddList } = await diemdanhRepo.getDiemDanhList(mabuoihoc);

    // Trim khoảng trắng mã sinh viên để tránh so khớp lệch
    const ddMap = new Map((ddList as unknown as AttendanceListDiemDanh[] ?? []).map(d => [d.masv?.trim(), d]));

    // 3. Ghép nối dữ liệu
    return (svMonHoc as unknown as AttendanceListSvMonHoc[]).map(s => {
      const sMasvTrimmed = s.masv?.trim();
      const dd = ddMap.get(sMasvTrimmed);
      const ttRaw = dd?.trangthai ?? "Vangmat";

      // Chuẩn hóa trạng thái hiển thị của Frontend
      let status = "Vắng";
      let type = "red";
      if (ttRaw === "Comat") {
        status = "Có mặt";
        type = "green";
      } else if (ttRaw === "Dimuon") {
        status = "Đi muộn";
        type = "orange";
      } else if (ttRaw === "Cophep") {
        status = "Vắng có phép";
        type = "orange";
      }

      const sv = s.sinhvien;
      const hoten = sv ? `${sv.hodem || ""} ${sv.ten || ""}`.trim() : "—";

      return {
        mssv: s.masv,
        name: hoten || "—",
        status,
        type,
        time: dd?.thoigiandiemdanh ? new Date(dd.thoigiandiemdanh).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--",
        note: dd?.ghichu ?? "-",
        face_embedding: sv?.face_embedding || null
      };
    });
  },

  /**
   * Tạo ca điểm danh (buoihoc) mới cho một phân công vào ngày cụ thể
   */
  async createAttendanceSession(maphancong: number, dateStr: string) {
    // 1. Tìm lịch học tương ứng với phân công này
    const { data: lichhoc } = await diemdanhRepo.getLichHocSingle(maphancong);

    if (!lichhoc) {
      throw new Error("Lớp học phần chưa được lập lịch dạy học");
    }

    // 2. Tạo bản ghi buổi học mới trên DB
    const { data: buoihoc, error: bhError } = await diemdanhRepo.createBuoiHoc({
      malichhoc: lichhoc.malichhoc,
      ngayhoc: dateStr,
      trangthai: "ChuaDiemdanh"
    });

    if (bhError) throw bhError;

    // 3. Tự động khởi tạo bản ghi điểm danh trạng thái "Vắng" cho tất cả sinh viên trong lớp học phần
    const { data: svMonHoc } = await diemdanhRepo.getSinhVienMonHocListBasic(maphancong);

    if (svMonHoc && svMonHoc.length > 0) {
      // Fetch approved leaves for this session
      const { data: approvedLeaves } = await diemdanhRepo.getApprovedLeaves(buoihoc.mabuoihoc);

      const leaveSet = new Set((approvedLeaves as { masv: string }[] ?? []).map(d => d.masv?.trim()) || []);
      const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");

      const inserts = (svMonHoc as { masv: string }[]).map(s => {
        const masv = s.masv?.trim();
        const isLeave = leaveSet.has(masv);
        return {
          mabuoihoc: buoihoc.mabuoihoc,
          masv: masv,
          trangthai: isLeave ? "Cophep" : "Vangmat",
          phuongthuc: "Manual",
          ghichu: isLeave ? "Vắng có phép (Đơn xin nghỉ)" : null,
          ngaytao: vnNow,
        };
      });

      await diemdanhRepo.insertDiemDanhBatch(inserts);
    }

    return buoihoc;
  },

  /**
   * Cập nhật trạng thái điểm danh cho một sinh viên (Sử dụng cơ chế Check-then-Insert/Update tin cậy)
   */
  async updateStudentAttendance(mabuoihoc: number, masv: string, status: string, ghichu: string) {
    // Chuẩn hóa trạng thái Frontend -> DB
    let trangthai = "Vangmat";
    if (status === "Có mặt") trangthai = "Comat";
    else if (status === "Đi muộn") trangthai = "Dimuon";
    else if (status === "Vắng có phép") trangthai = "Cophep";

    const masvTrimmed = masv.trim();

    // 1. Kiểm tra xem bản ghi điểm danh đã tồn tại chưa
    const { data: existing } = await diemdanhRepo.getExistingDiemDanh(mabuoihoc, masvTrimmed);

    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
    const isPresent = trangthai === "Comat" || trangthai === "Dimuon";

    if (existing) {
      // 2. Thực hiện cập nhật
      const { error: updateError } = await diemdanhRepo.updateDiemDanh(existing.madiemdanh, {
        trangthai,
        ghichu: ghichu === "-" ? null : ghichu,
        thoigiandiemdanh: isPresent ? vnNow : null,
        phuongthuc: "Manual"
      });
      if (updateError) throw updateError;
    } else {
      // 3. Thực hiện thêm mới nếu chưa tồn tại
      const { error: insertError } = await diemdanhRepo.insertDiemDanh({
        mabuoihoc,
        masv: masvTrimmed,
        trangthai,
        thoigiandiemdanh: isPresent ? vnNow : null,
        phuongthuc: "Manual",
        ngaytao: vnNow
      });
      if (insertError) throw insertError;
    }

    return true;
  },

  /**
   * Cập nhật trạng thái đơn xin nghỉ học và đồng bộ điểm danh (Sử dụng cơ chế Check-then-Insert/Update tin cậy)
   */
  async updateLeaveRequest(madon: number, status: string, magv: string) {
    // Xác định trạng thái DB
    const trangthai = status === "Đã duyệt" ? "DaDuyet" : "TuChoi";

    // 1. Cập nhật đơn xin nghỉ
    const { data: don, error: donError } = await diemdanhRepo.updateDonXinNghi(madon, {
      trangthai,
      magvduyet: magv,
      ngaycapnhat: new Date().toISOString()
    });

    if (donError) throw donError;

    // 2. Đồng bộ sang bảng diemdanh
    const ddStatus = trangthai === "DaDuyet" ? "Cophep" : "Vangmat";
    const ddNote = trangthai === "DaDuyet" ? "Vắng có phép (Đơn xin nghỉ)" : null;
    const donMasvTrimmed = don.masv.trim();

    // Kiểm tra xem bản ghi đã tồn tại chưa
    const { data: existing } = await diemdanhRepo.getExistingDiemDanh(don.mabuoihoc, donMasvTrimmed);

    if (existing) {
      await diemdanhRepo.updateDiemDanh(existing.madiemdanh, {
        trangthai: ddStatus,
        ghichu: ddNote,
        phuongthuc: "Manual"
      });
    } else {
      await diemdanhRepo.insertDiemDanh({
        mabuoihoc: don.mabuoihoc,
        masv: donMasvTrimmed,
        trangthai: ddStatus,
        ghichu: ddNote,
        phuongthuc: "Manual"
      });
    }

    return true;
  },

  /**
   * Tạo mã bí mật QR mới cho buổi học dựa trực tiếp trên mabuoihoc lấy từ DB
   */
  async generateQRCode(mabuoihoc: number) {
    // Dùng trực tiếp mã buổi học mabuoihoc từ database để thiết lập chuỗi QR tĩnh cố định
    const qrSecret = `mabuoihoc_${mabuoihoc}`;

    const { data, error } = await diemdanhRepo.updateBuoiHocQRCode(mabuoihoc, qrSecret);

    if (error) throw error;
    return data.qr_secret;
  },

  /**
   * Tính khoảng cách địa lý giữa 2 tọa độ (Haversine Formula) - Trả về đơn vị: Mét
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Bán kính Trái Đất (mét)
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // mét
  },

  /**
   * Điểm danh bằng QR kèm kiểm tra vị trí GPS trong vòng 300m
   */
  async studentQRCheckin(masv: string, mabuoihoc: number, qrSecretParam: string, lat: number, lng: number) {
    // 1. Kiểm tra sự tồn tại và trạng thái của buổi học
    const { data: buoihoc, error: bhError } = await diemdanhRepo.getBuoiHocForCheckin(mabuoihoc);

    if (bhError || !buoihoc) {
      throw new Error("Không tìm thấy thông tin ca điểm danh này.");
    }

    if (buoihoc.trangthai !== "DangDiemdanh") {
      throw new Error("Phiên điểm danh này chưa được kích hoạt hoặc đã đóng lại.");
    }

    if (!buoihoc.qr_secret || buoihoc.qr_secret !== qrSecretParam) {
      throw new Error("Mã QR điểm danh không hợp lệ hoặc đã hết hạn.");
    }

    // 2. Xác định tọa độ phòng học và kiểm tra định vị trong khoảng 300m
    const ROOM_COORDINATES: Record<string, { lat: number; lng: number }> = {
      "E203": { lat: 21.007629, lng: 105.932789 },
      "E302": { lat: 21.008123, lng: 105.933123 },
      "A101": { lat: 21.006987, lng: 105.932154 },
      "B204": { lat: 21.007250, lng: 105.934001 },
      "DEFAULT": { lat: 21.007629, lng: 105.932789 } // VNUA Campus Center
    };

    const maphong = (buoihoc.lichhoc as unknown as { maphong: string | null })?.maphong || "DEFAULT";
    const roomCoord = ROOM_COORDINATES[maphong] || ROOM_COORDINATES["DEFAULT"];

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Tọa độ định vị GPS của bạn không hợp lệ.");
    }

    const distance = this.getDistance(lat, lng, roomCoord.lat, roomCoord.lng);
    if (distance > 300) {
      throw new Error(`Bạn đang ở ngoài khu vực lớp học (cách ${Math.round(distance)}m). Vui lòng di chuyển vào trong lớp học (phạm vi 300m) để điểm danh!`);
    }

    // 3. Thực hiện lưu điểm danh bằng cơ chế check-then-insert/update cực kỳ an toàn
    const masvTrimmed = masv.trim();

    const { data: existing } = await diemdanhRepo.getExistingDiemDanh(mabuoihoc, masvTrimmed);

    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
    const thoigiandiemdanh = vnNow;
    const trangthai = "Comat";

    if (existing) {
      const { error: updateError } = await diemdanhRepo.updateDiemDanh(existing.madiemdanh, {
        trangthai,
        thoigiandiemdanh,
        phuongthuc: "QR",
        ghichu: `Điểm danh QR thành công (vị trí cách phòng học ${maphong} ${Math.round(distance)}m)`
      });
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await diemdanhRepo.insertDiemDanh({
        mabuoihoc,
        masv: masvTrimmed,
        trangthai,
        thoigiandiemdanh,
        phuongthuc: "QR",
        ghichu: `Điểm danh QR thành công (vị trí cách phòng học ${maphong} ${Math.round(distance)}m)`,
        ngaytao: vnNow
      });
      if (insertError) throw insertError;
    }

    return {
      distance: Math.round(distance),
      maphong,
      thoigiandiemdanh
    };
  },
};
