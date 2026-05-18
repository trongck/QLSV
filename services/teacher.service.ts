import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

export const giangVienService = {
  /**
   * Lấy thông tin chi tiết của giảng viên dựa trên magv
   * Dữ liệu này sẽ bao gồm thông tin từ bảng giangvien và taikhoan liên kết
   */
  async getMyProfile(mataikhoan: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Bảng giangvien đã merge toàn bộ trường chi tiết — chỉ cần 1 query
    const { data, error } = await supabase
      .from("giangvien")
      .select(`
        magv,
        mataikhoan,
        makhoa,
        hoten,
        ngaysinh,
        gioitinh,
        hocvi,
        chuyennganh,
        anhdaidien,
        emailtruong,
        thanhtuu,
        diachi,
        sodienthoai,
        emailcanhan,
        ngayvaotruong,
        hesoluong
      `)
      .eq("mataikhoan", mataikhoan)
      .single();

    if (error) {
      console.error("Lỗi khi truy vấn Supabase:", error.message);
      return null;
    }

    return data;
  },

  /**
   * Lấy thống kê tổng quan dashboard cho giảng viên:
   * - Số lớp đang dạy (phân công đang hiệu lực)
   * - Tổng sinh viên trong các lớp đó
   * - Số bài tập đã tạo và số bài đã chấm điểm
   * - Tỉ lệ điểm danh hôm nay (trung bình các buổi hôm nay)
   * - 5 thông báo mới nhất gửi cho giảng viên
   * - Lịch dạy hôm nay
   */
  async getDashboardStats(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Lấy danh sách phân công đang hiệu lực của giảng viên
    const { data: phancongList } = await supabase
      .from("phancong")
      .select("maphancong, malop, mamon, monhoc(tenmon), lop(tenlop)")
      .eq("magv", magv)
      .eq("danghieuluc", true);

    const maphancongIds = (phancongList ?? []).map((p: any) => p.maphancong);
    const soLop = maphancongIds.length;

    // 2. Đếm tổng sinh viên trong các lớp đang dạy
    let soSinhVien = 0;
    if (maphancongIds.length > 0) {
      const { count } = await supabase
        .from("sinhvienmonhoc")
        .select("masv", { count: "exact", head: true })
        .in("maphancong", maphancongIds)
        .eq("trangthai", "Danghoc");
      soSinhVien = count ?? 0;
    }

    // 3. Bài tập đã tạo và đã chấm điểm
    let soBaiTap = 0;
    let soBaiDaCham = 0;
    if (maphancongIds.length > 0) {
      const { data: baitapList } = await supabase
        .from("baitap")
        .select("mabaitap")
        .in("maphancong", maphancongIds);

      soBaiTap = baitapList?.length ?? 0;
      const mabaitapIds = (baitapList ?? []).map((b: any) => b.mabaitap);

      if (mabaitapIds.length > 0) {
        const { count } = await supabase
          .from("nopbai")
          .select("manopbai", { count: "exact", head: true })
          .in("mabaitap", mabaitapIds)
          .not("diem", "is", null);
        soBaiDaCham = count ?? 0;
      }
    }

    // 4. Tỉ lệ điểm danh hôm nay — tính từ các buổi học hôm nay
    let tiLeDiemDanh: number | null = null;
    const { data: lichhocList } = await supabase
      .from("lichhoc")
      .select("malichhoc")
      .in("maphancong", maphancongIds.length > 0 ? maphancongIds : [-1]);

    const malichhocIds = (lichhocList ?? []).map((l: any) => l.malichhoc);
    if (malichhocIds.length > 0) {
      const { data: buoiHocHomNay } = await supabase
        .from("buoihoc")
        .select("mabuoihoc")
        .in("malichhoc", malichhocIds)
        .eq("ngayhoc", todayStr);

      const mabuoihocIds = (buoiHocHomNay ?? []).map((b: any) => b.mabuoihoc);
      if (mabuoihocIds.length > 0) {
        const { count: tongDiemdanh } = await supabase
          .from("diemdanh")
          .select("madiemdanh", { count: "exact", head: true })
          .in("mabuoihoc", mabuoihocIds);
        const { count: coMat } = await supabase
          .from("diemdanh")
          .select("madiemdanh", { count: "exact", head: true })
          .in("mabuoihoc", mabuoihocIds)
          .eq("trangthai", "CoMat");
        if (tongDiemdanh && tongDiemdanh > 0) {
          tiLeDiemDanh = Math.round(((coMat ?? 0) / tongDiemdanh) * 100);
        }
      }
    }

    // 5. Thông báo mới nhất (gửi đến giảng viên này hoặc broadcast)
    const { data: thongBaoList } = await supabase
      .from("thongbao")
      .select("mathongbao, tieude, loai, ngaytao, doituong")
      .or(`doituong.eq.TatCa,doituong.eq.GiangVien`)
      .order("ngaytao", { ascending: false })
      .limit(5);

    // 6. Lịch dạy hôm nay
    const thuHomNay = new Date().getDay(); // 0=CN, 1=T2...
    const thuDB = thuHomNay === 0 ? 8 : thuHomNay + 1; // DB: 2=T2,...,8=CN
    let lichHomNay: any[] = [];
    if (maphancongIds.length > 0) {
      const { data: lichList } = await supabase
        .from("lichhoc")
        .select(`
          malichhoc, tietbatdau, tietketthuc, phonghoc,
          phancong!inner(maphancong, monhoc(tenmon), lop(tenlop))
        `)
        .in("maphancong", maphancongIds)
        .eq("thutrongtuan", thuDB)
        .order("tietbatdau");
      lichHomNay = lichList ?? [];
    }

    return {
      soLop,
      soSinhVien,
      soBaiTap,
      soBaiDaCham,
      tiLeDiemDanh,
      thongBaoMoi: thongBaoList ?? [],
      lichHomNay,
    };
  },

  /**
   * Lấy toàn bộ data cho trang Lớp học (3 tab):
   *  - Tab 1: Danh sách phân công + số SV + lịch đại diện
   *  - Tab 2: Lịch dạy theo từng thứ trong tuần (7 ngày)
   *  - Tab 3: Tài liệu của tất cả lớp đang dạy
   */
  async getClassesData(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // ── 1. Phân công đang hiệu lực ───────────────────────────────────────────
    const { data: phancongList } = await supabase
      .from("phancong")
      .select(`
        maphancong, malop, malophoc, sisomax, ngaybatdau, ngayketthuc,
        monhoc ( mamon, tenmon, sotinchi ),
        lop ( tenlop, nganh )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true)
      .order("ngaybatdau", { ascending: false });

    const maphancongIds = (phancongList ?? []).map((p: any) => p.maphancong);

    // Đếm SV đang theo học từng lớp
    let svCountMap: Record<number, number> = {};
    if (maphancongIds.length > 0) {
      const { data: svCounts } = await supabase
        .from("sinhvienmonhoc")
        .select("maphancong")
        .in("maphancong", maphancongIds)
        .eq("trangthai", "Danghoc");
      for (const row of svCounts ?? []) {
        svCountMap[row.maphancong] = (svCountMap[row.maphancong] ?? 0) + 1;
      }
    }

    // Lịch đại diện (thứ + tiết) cho mỗi phân công
    let lichMap: Record<number, { thutrongtuan: number; tietbatdau: number; tietketthuc: number; phonghoc: string | null }[]> = {};
    if (maphancongIds.length > 0) {
      const { data: lichList } = await supabase
        .from("lichhoc")
        .select("maphancong, thutrongtuan, tietbatdau, tietketthuc, phonghoc")
        .in("maphancong", maphancongIds);
      for (const l of lichList ?? []) {
        if (!lichMap[l.maphancong]) lichMap[l.maphancong] = [];
        lichMap[l.maphancong].push(l);
      }
    }

    const dsLop = (phancongList ?? []).map((p: any) => ({
      maphancong: p.maphancong,
      malophoc: p.malophoc ?? p.malop,
      tenmon: p.monhoc?.tenmon ?? "—",
      mamon: p.monhoc?.mamon ?? "—",
      sotinchi: p.monhoc?.sotinchi ?? 0,
      tenlop: p.lop?.tenlop ?? "—",
      soSinhVien: svCountMap[p.maphancong] ?? 0,
      lich: lichMap[p.maphancong] ?? [],
      ngaybatdau: p.ngaybatdau,
      ngayketthuc: p.ngayketthuc,
    }));

    // ── 2. Lịch dạy theo thứ (T2–CN) ─────────────────────────────────────────
    let lichTuan: any[] = [];
    if (maphancongIds.length > 0) {
      const { data: lichAll } = await supabase
        .from("lichhoc")
        .select(`
          malichhoc, thutrongtuan, tietbatdau, tietketthuc, phonghoc,
          phancong!inner (
            maphancong,
            monhoc ( tenmon ),
            lop ( tenlop )
          )
        `)
        .in("maphancong", maphancongIds)
        .order("thutrongtuan")
        .order("tietbatdau");
      lichTuan = lichAll ?? [];
    }

    // ── 3. Tài liệu của tất cả lớp ──────────────────────────────────────────
    let dsTaiLieu: any[] = [];
    if (maphancongIds.length > 0) {
      const { data: tailieu } = await supabase
        .from("tailieu")
        .select(`
          matailieu, tieude, loai, duongdan, dungluong,
          luotxem, chopheptai, ngaytao, ngaycapnhat,
          phancong ( monhoc ( tenmon ), lop ( tenlop ) )
        `)
        .in("maphancong", maphancongIds)
        .order("ngaytao", { ascending: false });
      dsTaiLieu = tailieu ?? [];
    }

    return { dsLop, lichTuan, dsTaiLieu };
  },

  /**
   * Lấy danh sách lịch dạy
   */
  async getMySchedule(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("lichhoc")
      .select("*")
      .eq("magv", magv);

    if (error) return [];
    return data;
  },

  /**
   * Lấy danh sách phân công học tập & buổi học & đơn xin nghỉ của giảng viên
   */
  async getAttendanceOverview(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // A. Lấy danh sách phân công đang hiệu lực
    const { data: phancongList } = await supabase
      .from("phancong")
      .select(`
        maphancong, malop, malophoc,
        monhoc ( mamon, tenmon ),
        lop ( tenlop )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true);

    const maphancongIds = (phancongList ?? []).map((p: any) => p.maphancong);

    // B. Lấy tất cả lịch học tương ứng
    let lichhocList: any[] = [];
    if (maphancongIds.length > 0) {
      const { data: lichAll } = await supabase
        .from("lichhoc")
        .select("malichhoc, maphancong")
        .in("maphancong", maphancongIds);
      lichhocList = lichAll ?? [];
    }
    const malichhocIds = lichhocList.map((l: any) => l.malichhoc);

    // C. Lấy các buổi học của lịch học này
    let buoiHocList: any[] = [];
    if (malichhocIds.length > 0) {
      const { data: bhAll } = await supabase
        .from("buoihoc")
        .select("mabuoihoc, malichhoc, ngayhoc, trangthai, qr_secret")
        .in("malichhoc", malichhocIds)
        .order("ngayhoc", { ascending: false });
      
      const lichMap = new Map(lichhocList.map((l: any) => [l.malichhoc, l.maphancong]));
      buoiHocList = (bhAll ?? []).map((bh: any) => ({
        ...bh,
        maphancong: lichMap.get(bh.malichhoc)
      }));
    }

    // D. Lấy các đơn xin nghỉ học của học sinh thuộc các buổi học này
    let dsDonXinNghi: any[] = [];
    if (buoiHocList.length > 0) {
      const mabuoihocIds = buoiHocList.map((b: any) => b.mabuoihoc);
      const { data: donList } = await supabase
        .from("donxinnghi")
        .select(`
          madon, masv, mabuoihoc, lydo, minhchung, trangthai, ngaytao, ngaycapnhat,
          sinhvien ( hoten )
        `)
        .in("mabuoihoc", mabuoihocIds)
        .order("ngaytao", { ascending: false });

      // Gắn thông tin lớp & môn cho đơn
      const buoiHocMap = new Map(buoiHocList.map((b: any) => [b.mabuoihoc, b]));
      const lichhocMap = new Map(lichhocList.map((l: any) => [l.malichhoc, l]));
      const phancongMap = new Map((phancongList ?? []).map((p: any) => [p.maphancong, p]));

      dsDonXinNghi = (donList ?? []).map((don: any) => {
        const bh = buoiHocMap.get(don.mabuoihoc);
        const lh = bh ? lichhocMap.get(bh.malichhoc) : null;
        const pc = lh ? phancongMap.get(lh.maphancong) : null;
        return {
          id: don.madon,
          mssv: don.masv,
          name: don.sinhvien?.hoten ?? "Sinh viên",
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
      dsLop: (phancongList ?? []).map((p: any) => ({
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Lấy danh sách sinh viên đang học của lớp học phần
    const { data: svMonHoc } = await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien ( hoten )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");

    if (!svMonHoc) return [];

    // 2. Lấy dữ liệu điểm danh hiện có cho buổi học này
    const { data: ddList } = await supabase
      .from("diemdanh")
      .select("masv, trangthai, ghichu, thoigiandiemdanh")
      .eq("mabuoihoc", mabuoihoc);

    // Trim khoảng trắng mã sinh viên để tránh so khớp lệch
    const ddMap = new Map((ddList ?? []).map((d: any) => [d.masv?.trim(), d]));

    // 3. Ghép nối dữ liệu
    return svMonHoc.map((s: any) => {
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

      return {
        mssv: s.masv,
        name: s.sinhvien?.hoten ?? "—",
        status,
        type,
        time: dd?.thoigiandiemdanh ? new Date(dd.thoigiandiemdanh).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--",
        note: dd?.ghichu ?? "-"
      };
    });
  },

  /**
   * Tạo ca điểm danh (buoihoc) mới cho một phân công vào ngày cụ thể
   */
  async createAttendanceSession(maphancong: number, dateStr: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Tìm lịch học tương ứng với phân công này
    const { data: lichhoc } = await supabase
      .from("lichhoc")
      .select("malichhoc")
      .eq("maphancong", maphancong)
      .limit(1)
      .single();

    if (!lichhoc) {
      throw new Error("Lớp học phần chưa được lập lịch dạy học");
    }

    // 2. Tạo bản ghi buổi học mới trên DB
    const { data: buoihoc, error: bhError } = await supabase
      .from("buoihoc")
      .insert({
        malichhoc: lichhoc.malichhoc,
        ngayhoc: dateStr,
        trangthai: "ChuaDiemdanh"
      })
      .select("mabuoihoc, malichhoc, ngayhoc, trangthai")
      .single();

    if (bhError) throw bhError;

    // 3. Tự động khởi tạo bản ghi điểm danh trạng thái "Vắng" cho tất cả sinh viên trong lớp học phần
    const { data: svMonHoc } = await supabase
      .from("sinhvienmonhoc")
      .select("masv")
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");

    if (svMonHoc && svMonHoc.length > 0) {
      const inserts = svMonHoc.map((s: any) => ({
        mabuoihoc: buoihoc.mabuoihoc,
        masv: s.masv,
        trangthai: "Vangmat",
        phuongthuc: "Manual"
      }));

      await supabase.from("diemdanh").insert(inserts);
    }

    return buoihoc;
  },

  /**
   * Cập nhật trạng thái điểm danh cho một sinh viên (Sử dụng cơ chế Check-then-Insert/Update tin cậy)
   */
  async updateStudentAttendance(mabuoihoc: number, masv: string, status: string, ghichu: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Chuẩn hóa trạng thái Frontend -> DB
    let trangthai = "Vangmat";
    if (status === "Có mặt") trangthai = "Comat";
    else if (status === "Đi muộn") trangthai = "Dimuon";
    else if (status === "Vắng có phép") trangthai = "Cophep";

    const masvTrimmed = masv.trim();

    // 1. Kiểm tra xem bản ghi điểm danh đã tồn tại chưa
    const { data: existing } = await supabase
      .from("diemdanh")
      .select("madiemdanh")
      .eq("mabuoihoc", mabuoihoc)
      .eq("masv", masvTrimmed)
      .maybeSingle();

    if (existing) {
      // 2. Thực hiện cập nhật
      const { error: updateError } = await supabase
        .from("diemdanh")
        .update({
          trangthai,
          ghichu: ghichu === "-" ? null : ghichu,
          thoigiandiemdanh: trangthai === "Comat" || trangthai === "Dimuon" ? new Date().toISOString() : null,
          phuongthuc: "Manual"
        })
        .eq("madiemdanh", existing.madiemdanh);
      if (updateError) throw updateError;
    } else {
      // 3. Thực hiện thêm mới nếu chưa tồn tại
      const { error: insertError } = await supabase
        .from("diemdanh")
        .insert({
          mabuoihoc,
          masv: masvTrimmed,
          trangthai,
          ghichu: ghichu === "-" ? null : ghichu,
          thoigiandiemdanh: trangthai === "Comat" || trangthai === "Dimuon" ? new Date().toISOString() : null,
          phuongthuc: "Manual"
        });
      if (insertError) throw insertError;
    }

    return true;
  },

  /**
   * Cập nhật trạng thái đơn xin nghỉ học và đồng bộ điểm danh (Sử dụng cơ chế Check-then-Insert/Update tin cậy)
   */
  async updateLeaveRequest(madon: number, status: string, magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Xác định trạng thái DB
    const trangthai = status === "Đã duyệt" ? "DaDuyet" : "TuChoi";

    // 1. Cập nhật đơn xin nghỉ
    const { data: don, error: donError } = await supabase
      .from("donxinnghi")
      .update({
        trangthai,
        magvduyet: magv,
        ngaycapnhat: new Date().toISOString()
      })
      .eq("madon", madon)
      .select("mabuoihoc, masv")
      .single();

    if (donError) throw donError;

    // 2. Đồng bộ sang bảng diemdanh
    const ddStatus = trangthai === "DaDuyet" ? "Cophep" : "Vangmat";
    const ddNote = trangthai === "DaDuyet" ? "Vắng có phép (Đơn xin nghỉ)" : null;
    const donMasvTrimmed = don.masv.trim();

    // Kiểm tra xem bản ghi đã tồn tại chưa
    const { data: existing } = await supabase
      .from("diemdanh")
      .select("madiemdanh")
      .eq("mabuoihoc", don.mabuoihoc)
      .eq("masv", donMasvTrimmed)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("diemdanh")
        .update({
          trangthai: ddStatus,
          ghichu: ddNote,
          phuongthuc: "Manual"
        })
        .eq("madiemdanh", existing.madiemdanh);
    } else {
      await supabase
        .from("diemdanh")
        .insert({
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Dùng trực tiếp mã buổi học mabuoihoc từ database để thiết lập chuỗi QR tĩnh cố định
    const qrSecret = `mabuoihoc_${mabuoihoc}`;

    const { data, error } = await supabase
      .from("buoihoc")
      .update({
        qr_secret: qrSecret,
        trangthai: "DangDiemdanh" // Chuyển trạng thái buổi học thành đang điểm danh
      })
      .eq("mabuoihoc", mabuoihoc)
      .select("qr_secret")
      .single();

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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra sự tồn tại và trạng thái của buổi học
    const { data: buoihoc, error: bhError } = await supabase
      .from("buoihoc")
      .select(`
        mabuoihoc,
        qr_secret,
        trangthai,
        lichhoc ( maphong )
      `)
      .eq("mabuoihoc", mabuoihoc)
      .single();

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

    const maphong = (buoihoc.lichhoc as any)?.maphong || "DEFAULT";
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

    const { data: existing } = await supabase
      .from("diemdanh")
      .select("madiemdanh")
      .eq("mabuoihoc", mabuoihoc)
      .eq("masv", masvTrimmed)
      .maybeSingle();

    const thoigiandiemdanh = new Date().toISOString();

    if (existing) {
      const { error: updateError } = await supabase
        .from("diemdanh")
        .update({
          trangthai: "Comat",
          thoigiandiemdanh,
          phuongthuc: "QR",
          ghichu: `Điểm danh QR thành công (vị trí cách phòng học ${maphong} ${Math.round(distance)}m)`
        })
        .eq("madiemdanh", existing.madiemdanh);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("diemdanh")
        .insert({
          mabuoihoc,
          masv: masvTrimmed,
          trangthai: "Comat",
          thoigiandiemdanh,
          phuongthuc: "QR",
          ghichu: `Điểm danh QR thành công (vị trí cách phòng học ${maphong} ${Math.round(distance)}m)`
        });
      if (insertError) throw insertError;
    }

    return {
      distance: Math.round(distance),
      maphong,
      thoigiandiemdanh
    };
  }
};