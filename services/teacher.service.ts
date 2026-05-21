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
        hodem,
        ten,
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

    if (data) {
      (data as any).hoten = `${data.hodem || ""} ${data.ten || ""}`.trim();
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

    // 1. Lấy danh sách phân công đang hiệu lực
    const { data: phancongList } = await supabase
      .from("phancong")
      .select(`
        maphancong,
        monhoc ( tenmon ),
        lop ( tenlop )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true);

    const maphancongIds = (phancongList ?? []).map((p: any) => p.maphancong);
    const totalClasses = maphancongIds.length;

    let classSummaries: any[] = [];
    let totalStudents = 0;

    if (totalClasses > 0) {
      // 2. Sĩ số thực tế từng lớp (Danghoc)
      const { data: svCounts } = await supabase
        .from("sinhvienmonhoc")
        .select("maphancong")
        .in("maphancong", maphancongIds)
        .eq("trangthai", "Danghoc");

      const sisoMap: Record<number, number> = {};
      (svCounts ?? []).forEach((row: any) => {
        sisoMap[row.maphancong] = (sisoMap[row.maphancong] ?? 0) + 1;
      });

      // Tính tổng sĩ số
      totalStudents = (svCounts ?? []).length;

      // 3. Lấy diemtb từ vthongke_phancong
      const { data: tkList } = await supabase
        .from("vthongke_phancong")
        .select("maphancong, diemtb")
        .in("maphancong", maphancongIds);

      const diemtbMap: Record<number, number | null> = {};
      (tkList ?? []).forEach((row: any) => {
        diemtbMap[row.maphancong] = row.diemtb;
      });

      // 4. Tính tỉ lệ chuyên cần cho từng lớp
      const { data: lichhocList } = await supabase
        .from("lichhoc")
        .select("malichhoc, maphancong")
        .in("maphancong", maphancongIds);

      const malichhocIds = (lichhocList ?? []).map((l: any) => l.malichhoc);
      const buoiToLichMap: Record<number, number> = {};
      const tileChuyenCanMap: Record<number, number | null> = {};

      if (malichhocIds.length > 0) {
        const { data: buoihocList } = await supabase
          .from("buoihoc")
          .select("mabuoihoc, malichhoc")
          .in("malichhoc", malichhocIds);

        const mabuoihocIds = (buoihocList ?? []).map((b: any) => {
          buoiToLichMap[b.mabuoihoc] = b.malichhoc;
          return b.mabuoihoc;
        });

        if (mabuoihocIds.length > 0) {
          const { data: diemdanhList } = await supabase
            .from("diemdanh")
            .select("mabuoihoc, trangthai")
            .in("mabuoihoc", mabuoihocIds);

          const statsByPc: Record<number, { total: number; present: number }> = {};
          maphancongIds.forEach((id: number) => {
            statsByPc[id] = { total: 0, present: 0 };
          });

          (diemdanhList ?? []).forEach((dd: any) => {
            const malichhoc = buoiToLichMap[dd.mabuoihoc];
            const maphancong = (lichhocList ?? []).find((l: any) => l.malichhoc === malichhoc)?.maphancong;
            if (maphancong) {
              statsByPc[maphancong].total += 1;
              if (["Comat", "Dimuon"].includes(dd.trangthai)) {
                statsByPc[maphancong].present += 1;
              }
            }
          });

          maphancongIds.forEach((id: number) => {
            const stats = statsByPc[id];
            tileChuyenCanMap[id] = stats.total > 0 ? (stats.present / stats.total) : null;
          });
        }
      }

      classSummaries = (phancongList ?? []).map((pc: any) => ({
        maphancong: pc.maphancong,
        tenmon: pc.monhoc?.tenmon ?? "—",
        tenlop: pc.lop?.tenlop ?? "—",
        siso: sisoMap[pc.maphancong] ?? 0,
        diemtb: diemtbMap[pc.maphancong] ?? null,
        tilechuyencan: tileChuyenCanMap[pc.maphancong] ?? null
      }));
    }

    // 5. Bài tập còn hạn
    let pendingTasks = 0;
    if (maphancongIds.length > 0) {
      const { count } = await supabase
        .from("baitap")
        .select("mabaitap", { count: "exact", head: true })
        .in("maphancong", maphancongIds)
        .gt("hannop", new Date().toISOString());
      pendingTasks = count ?? 0;
    }

    // 6. Thông báo đã gửi
    const { data: gvData } = await supabase
      .from("giangvien")
      .select("mataikhoan")
      .eq("magv", magv)
      .single();
    const mataikhoan = gvData?.mataikhoan;

    let thongBaoList: any[] = [];
    if (mataikhoan) {
      const { data } = await supabase
        .from("thongbao")
        .select("tieude, ngaytao")
        .eq("mataikhoantao", mataikhoan)
        .order("ngaytao", { ascending: false })
        .limit(5);
      thongBaoList = data ?? [];
    }


    return {
      totalClasses,
      totalStudents,
      pendingTasks,
      classSummaries,
      thongBao: thongBaoList ?? []
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
        .select("maphancong, thutrongtuan, tietbatdau, tietketthuc, phonghoc:maphong")
        .in("maphancong", maphancongIds);
      for (const l of lichList ?? []) {
        if (!lichMap[l.maphancong]) lichMap[l.maphancong] = [];
        lichMap[l.maphancong].push(l);
      }
    }

    const dsLop = (phancongList ?? []).map((p: any) => ({
      maphancong: p.maphancong,
      malophoc: p.malophoc ?? p.malop,
      malop: p.malop,
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
          malichhoc, thutrongtuan, tietbatdau, tietketthuc, phonghoc:maphong,
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
          sinhvien ( hodem, ten )
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
        sinhvien ( hodem, ten )
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

      const sv = s.sinhvien;
      const hoten = sv ? `${sv.hodem || ""} ${sv.ten || ""}`.trim() : "—";

      return {
        mssv: s.masv,
        name: hoten || "—",
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
      // Fetch approved leaves for this session
      const { data: approvedLeaves } = await supabase
        .from("donxinnghi")
        .select("masv")
        .eq("mabuoihoc", buoihoc.mabuoihoc)
        .eq("trangthai", "DaDuyet");

      const leaveSet = new Set(approvedLeaves?.map((d: any) => d.masv?.trim()) || []);
      const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");

      const inserts = svMonHoc.map((s: any) => {
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

    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
    const isPresent = trangthai === "Comat" || trangthai === "Dimuon";

    if (existing) {
      // 2. Thực hiện cập nhật
      const { error: updateError } = await supabase
        .from("diemdanh")
        .update({
          trangthai,
          ghichu: ghichu === "-" ? null : ghichu,
          thoigiandiemdanh: isPresent ? vnNow : null,
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

    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
    const thoigiandiemdanh = vnNow;
    const trangthai = "Comat";

    if (existing) {
      const { error: updateError } = await supabase
        .from("diemdanh")
        .update({
          trangthai,
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  NHẬP ĐIỂM
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy danh sách lớp phân công kèm thông tin môn học, học kỳ để chọn trong GradeSheet
   */
  async getGradeClasses(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("phancong")
      .select(`
        maphancong,
        malophoc,
        malop,
        danghieuluc,
        monhoc:mamon ( tenmon, sotinchi ),
        hocky:mahocky ( mahocky, tenhocky, namhoc, ky ),
        lop:malop ( tenlop )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true)
      .order("maphancong", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Lấy bảng điểm chi tiết của 1 lớp phân công
   * Trả về danh sách SV kèm các cột điểm thành phần + tổng kết
   */
  async getGradeSheet(maphancong: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Lấy danh sách SV đang học lớp này
    const { data: svList, error: svErr } = await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien:masv ( hodem, ten, malop )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc")
      .order("masv", { ascending: true });

    if (svErr) throw svErr;
    if (!svList || svList.length === 0) return [];

    const masvList = svList.map(s => s.masv);

    // 2. Lấy tất cả điểm thành phần của các SV này trong phân công này
    const { data: diemRows } = await supabase
      .from("diem")
      .select("masv, loaidiem, giatri, heso, madiem, ghichu")
      .eq("maphancong", maphancong)
      .in("masv", masvList);

    // 3. Lấy điểm tổng kết
    const { data: tongKetRows } = await supabase
      .from("diemtongket")
      .select("masv, diemtongket, diemchu, ketqua")
      .eq("maphancong", maphancong)
      .in("masv", masvList);

    // 4. Lấy file nộp bài (nopbai) của sinh viên trong lớp này
    const { data: baitapList } = await supabase
      .from("baitap")
      .select("mabaitap, tieude")
      .eq("maphancong", maphancong);

    const mabaitapIds = (baitapList ?? []).map(b => b.mabaitap);
    
    let nopbaiRows: any[] = [];
    if (mabaitapIds.length > 0) {
      const { data } = await supabase
        .from("nopbai")
        .select("masv, mabaitap, filenop")
        .in("mabaitap", mabaitapIds)
        .in("masv", masvList)
        .not("filenop", "is", null);
      nopbaiRows = data ?? [];
    }

    // 5. Gom dữ liệu theo từng SV
    const diemMap: Record<string, Record<string, any>> = {};
    for (const d of (diemRows ?? [])) {
      if (!diemMap[d.masv]) diemMap[d.masv] = {};
      diemMap[d.masv][d.loaidiem] = { giatri: d.giatri, heso: d.heso, madiem: d.madiem, ghichu: d.ghichu };
    }

    const tongKetMap: Record<string, any> = {};
    for (const tk of (tongKetRows ?? [])) {
      tongKetMap[tk.masv] = tk;
    }

    return svList.map((sv, idx) => {
      const student = sv.sinhvien as any;
      const hoten = student ? `${student.hodem || ""} ${student.ten || ""}`.trim() : "—";
      
      const studentFiles = nopbaiRows
        .filter(n => n.masv === sv.masv)
        .map(n => {
          const bt = (baitapList ?? []).find(b => b.mabaitap === n.mabaitap);
          return {
            tieude: bt?.tieude || `Bài tập ${n.mabaitap}`,
            filenop: n.filenop
          };
        });

      return {
        stt: idx + 1,
        masv: sv.masv,
        hoten: hoten || "—",
        malop: student?.malop ?? "—",
        diemChuyenCan: diemMap[sv.masv]?.["ChuyenCan"] ?? null,
        diemGiuaKy: diemMap[sv.masv]?.["GiuaKy"] ?? null,
        diemCuoiKy: diemMap[sv.masv]?.["CuoiKy"] ?? null,
        tongKet: tongKetMap[sv.masv] ?? null,
        nopbaiFiles: studentFiles
      };
    });
  },

  /**
   * Lưu / cập nhật 1 cột điểm cho 1 SV (check-then-insert/update)
   */
  async saveGrade(magv: string, maphancong: number, masv: string, loaidiem: string, giatri: number, heso: number, ghichu?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate giá trị điểm
    if (giatri < 0 || giatri > 10) {
      throw new Error("Điểm phải nằm trong khoảng 0 đến 10.");
    }

    const masvTrimmed = masv.trim();

    // Kiểm tra đã có điểm loại này chưa
    const { data: existing } = await supabase
      .from("diem")
      .select("madiem")
      .eq("maphancong", maphancong)
      .eq("masv", masvTrimmed)
      .eq("loaidiem", loaidiem)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("diem")
        .update({
          giatri,
          heso,
          ghichu: ghichu ?? null,
          magvnhap: magv,
          ngaycapnhat: new Date().toISOString()
        })
        .eq("madiem", existing.madiem);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("diem")
        .insert({
          masv: masvTrimmed,
          maphancong,
          loaidiem,
          giatri,
          heso,
          ghichu: ghichu ?? null,
          magvnhap: magv
        });
      if (error) throw error;
    }

    return true;
  },

  /**
   * Cập nhật toàn diện đề thi (Thông tin cơ bản và câu hỏi nếu có file mới)
   */
  async updateExamFull(
    magv: string,
    madethi: number,
    examData: {
      maphancong: number;
      tieude: string;
      mota: string;
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
      matkhau: string;
    },
    newQuestions?: Array<{
      noidung: string;
      diem: number;
      dapan: Array<{ noidung: string; ladapandung: boolean }>;
    }>
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate quyền (phải là đề thi của GV này)
    const { data: dethiCheck } = await supabase
      .from("dethi")
      .select("madethi, phancong!inner(magv)")
      .eq("madethi", madethi)
      .single();

    if (!dethiCheck || (dethiCheck.phancong as any).magv !== magv) {
      throw new Error("Không tìm thấy đề thi hoặc bạn không có quyền");
    }

    // Validate lớp học phần mới
    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", examData.maphancong)
      .eq("magv", magv)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Phân công mới không hợp lệ");
    }

    // 1. Cập nhật thông tin đề thi
    const { error: examError } = await supabase
      .from("dethi")
      .update({
        maphancong: examData.maphancong,
        tieude: examData.tieude,
        mota: examData.mota,
        thoigianlam: examData.thoigianlam,
        thoigianbatdau: examData.thoigianbatdau,
        thoigianketthuc: examData.thoigianketthuc,
        matkhau: examData.matkhau
      })
      .eq("madethi", madethi);

    if (examError) throw examError;

    // 2. Cập nhật câu hỏi nếu có newQuestions
    if (newQuestions && newQuestions.length > 0) {
      // Xóa câu hỏi cũ (cascade sẽ xóa đáp án cũ)
      const { error: delError } = await supabase
        .from("cauhoi")
        .delete()
        .eq("madethi", madethi);

      if (delError) throw delError;

      // Chèn câu hỏi mới
      for (let i = 0; i < newQuestions.length; i++) {
        const q = newQuestions[i];
        const { data: newQ, error: qError } = await supabase
          .from("cauhoi")
          .insert({
            madethi,
            noidung: q.noidung,
            loaicauhoi: "TracNghiem",
            diem: q.diem || 0.2,
            thutu: i + 1
          })
          .select("macauhoi")
          .single();

        if (qError) throw qError;

        const dapanInserts = q.dapan.map((d, dIdx) => ({
          macauhoi: newQ.macauhoi,
          noidung: d.noidung,
          ladapandung: d.ladapandung,
          thutu: dIdx + 1
        }));

        const { error: dError } = await supabase
          .from("dapan")
          .insert(dapanInserts);

        if (dError) throw dError;
      }
    }

    return true;
  },

  /**
   * Lưu hàng loạt điểm cho 1 SV (4 cột điểm cùng lúc) + tự tính tổng kết
   */
  async saveGradeRow(magv: string, maphancong: number, masv: string, grades: { loaidiem: string; giatri: number; heso: number }[]) {
    // Lưu từng cột điểm
    for (const g of grades) {
      if (g.giatri !== null && g.giatri !== undefined && !isNaN(g.giatri)) {
        await this.saveGrade(magv, maphancong, masv, g.loaidiem, g.giatri, g.heso);
      }
    }

    // Tính và lưu điểm tổng kết
    await this.calculateAndSaveFinalGrade(maphancong, masv);
    return true;
  },

  /**
   * Tính và lưu điểm tổng kết cho 1 SV dựa trên các điểm thành phần
   * Công thức: ChuyenCan*10% + GiuaKy*30% + CuoiKy*60%
   */
  async calculateAndSaveFinalGrade(maphancong: number, masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const masvTrimmed = masv.trim();

    // Lấy tất cả điểm thành phần
    const { data: diemRows } = await supabase
      .from("diem")
      .select("loaidiem, giatri, heso")
      .eq("maphancong", maphancong)
      .eq("masv", masvTrimmed);

    if (!diemRows || diemRows.length === 0) return;

    // Hệ số mặc định: ChuyenCan=0.1, GiuaKy=0.3, CuoiKy=0.6
    const hesoMap: Record<string, number> = {
      "ChuyenCan": 0.1,
      "GiuaKy": 0.3,
      "CuoiKy": 0.6
    };

    let tongDiem = 0;
    let tongHeSo = 0;

    for (const d of diemRows) {
      const hs = hesoMap[d.loaidiem] ?? d.heso ?? 0;
      tongDiem += d.giatri * hs;
      tongHeSo += hs;
    }

    if (tongHeSo === 0) return;

    const diemTK = parseFloat((tongDiem / tongHeSo * (tongHeSo < 1 ? tongHeSo : 1) + (tongHeSo < 1 ? 0 : 0)).toFixed(2));
    // Tính đúng: điểm tổng kết = tổng(điểm * hệ số)
    const diemFinal = parseFloat(tongDiem.toFixed(2));

    // Quy đổi điểm chữ
    let diemChu = "F";
    if (diemFinal >= 9.0) diemChu = "A+";
    else if (diemFinal >= 8.5) diemChu = "A";
    else if (diemFinal >= 8.0) diemChu = "B+";
    else if (diemFinal >= 7.0) diemChu = "B";
    else if (diemFinal >= 6.5) diemChu = "C+";
    else if (diemFinal >= 5.5) diemChu = "C";
    else if (diemFinal >= 5.0) diemChu = "D+";
    else if (diemFinal >= 4.0) diemChu = "D";
    else diemChu = "F";

    const ketqua = diemFinal >= 4.0 ? "Dat" : "KhongDat";

    // Check-then-insert/update bảng diemtongket
    const { data: existing } = await supabase
      .from("diemtongket")
      .select("masv")
      .eq("maphancong", maphancong)
      .eq("masv", masvTrimmed)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("diemtongket")
        .update({
          diemtongket: diemFinal,
          diemchu: diemChu,
          ketqua,
          ngaycapnhat: new Date().toISOString()
        })
        .eq("maphancong", maphancong)
        .eq("masv", masvTrimmed);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("diemtongket")
        .insert({
          masv: masvTrimmed,
          maphancong,
          diemtongket: diemFinal,
          diemchu: diemChu,
          ketqua
        });
      if (error) throw error;
    }
  },

  /**
   * Lấy danh sách học sinh theo lớp phân công từ Supabase
   */
  async getRosterStudents(maphancong: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien:masv (
          mataikhoan,
          hodem,
          ten,
          malop,
          emailtruong,
          sodienthoai,
          emailcanhan,
          tenphuhuynh,
          sodienthoaiphuhuynh,
          diachi,
          quequan
        )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");

    if (error) throw error;

    return (data ?? []).map((item: any) => {
      const sv = item.sinhvien;
      const hoten = sv ? `${sv.hodem || ""} ${sv.ten || ""}`.trim() : "—";
      return {
        mssv: item.masv,
        accountId: sv?.mataikhoan ?? null,
        name: hoten || "—",
        class: sv?.malop ?? "—",
        phone: sv?.sodienthoai ?? "—",
        email: sv?.emailcanhan ?? sv?.emailtruong ?? "—",
        parent: sv ? `${sv.tenphuhuynh ?? "Chưa rõ"} - ${sv.sodienthoaiphuhuynh ?? "Chưa rõ"}` : "—",
        parentName: sv?.tenphuhuynh ?? "",
        parentPhone: sv?.sodienthoaiphuhuynh ?? "",
        address: sv?.diachi ?? sv?.quequan ?? "—",
        rawAddress: sv?.diachi ?? ""
      };
    });
  },

  /**
   * Cập nhật thông tin hồ sơ chi tiết sinh viên trực tiếp trên bảng sinhvien
   */
  async updateRosterStudent(
    masv: string,
    updateData: {
      name: string;
      email: string;
      phone: string;
      parentName: string;
      parentPhone: string;
      address: string;
    }
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Tách họ tên thành hodem và ten
    const nameParts = updateData.name.trim().split(/\s+/);
    let hodem = "";
    let ten = "";
    if (nameParts.length > 1) {
      ten = nameParts[nameParts.length - 1];
      hodem = nameParts.slice(0, -1).join(" ");
    } else {
      ten = nameParts[0] || "";
    }

    // Cập nhật họ tên và các trường liên hệ trực tiếp trong bảng sinhvien
    const { error } = await supabase
      .from("sinhvien")
      .update({
        hodem,
        ten,
        emailcanhan: updateData.email,
        sodienthoai: updateData.phone,
        tenphuhuynh: updateData.parentName,
        sodienthoaiphuhuynh: updateData.parentPhone,
        diachi: updateData.address
      })
      .eq("masv", masv);

    if (error) throw error;
    return true;
  },

  /**
   * Lấy danh sách bài tập (tasks) của giảng viên (không làm chức năng Thêm mới)
   */
  async getTasks(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Lấy danh sách phân công
    const { data: phancongList } = await supabase
      .from("phancong")
      .select("maphancong, monhoc(tenmon), lop(tenlop)")
      .eq("magv", magv);

    const maphancongIds = (phancongList ?? []).map((pc: any) => pc.maphancong);

    if (maphancongIds.length === 0) return [];

    // 2. Tính sĩ số (tổng sinh viên) mỗi lớp
    const { data: svCounts } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .in("maphancong", maphancongIds)
      .eq("trangthai", "Danghoc");
      
    const sisoMap: Record<number, number> = {};
    (svCounts ?? []).forEach((row: any) => {
      sisoMap[row.maphancong] = (sisoMap[row.maphancong] ?? 0) + 1;
    });

    // 3. Lấy danh sách bài tập
    const { data: baitapList } = await supabase
      .from("baitap")
      .select("*")
      .in("maphancong", maphancongIds)
      .order("ngaytao", { ascending: false });

    const mabaitapIds = (baitapList ?? []).map((bt: any) => bt.mabaitap);

    // 4. Lấy số sinh viên đã nộp bài (tiến độ)
    const submittedMap: Record<number, number> = {};
    if (mabaitapIds.length > 0) {
      const { data: nopbaiList } = await supabase
        .from("nopbai")
        .select("mabaitap")
        .in("mabaitap", mabaitapIds);
        
      (nopbaiList ?? []).forEach((row: any) => {
        submittedMap[row.mabaitap] = (submittedMap[row.mabaitap] ?? 0) + 1;
      });
    }

    return (baitapList ?? []).map((bt: any) => {
      const pc = phancongList?.find((p: any) => p.maphancong === bt.maphancong) as any;
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
        isoDate: bt.hannop,
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
  async updateTask(mabaitap: number, updates: any) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const updatePayload: any = {
      tieude: updates.tieude || updates.title,
      mota: updates.mota || updates.description,
      hannop: updates.hannop || updates.isoDate,
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    };

    if (updates.filedinh !== undefined) {
      updatePayload.filedinh = updates.filedinh;
    }

    const { error } = await supabase
      .from("baitap")
      .update(updatePayload)
      .eq("mabaitap", mabaitap);

    if (error) throw error;
    return true;
  },

  /**
   * Lấy danh sách bài nộp của một bài tập
   */
  async getTaskSubmissions(mabaitap: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("nopbai")
      .select(`
        manopbai,
        noidungnop,
        filenop,
        thoigiannop,
        masv,
        sinhvien:masv ( hodem, ten, malop )
      `)
      .eq("mabaitap", mabaitap)
      .order("thoigiannop", { ascending: false });

    if (error) throw error;
    
    return (data ?? []).map((row: any) => ({
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate if maphancong belongs to magv
    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", taskData.maphancong)
      .eq("magv", magv)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");
    }

    const { data, error } = await supabase
      .from("baitap")
      .insert({
        maphancong: taskData.maphancong,
        tieude: taskData.tieude,
        mota: taskData.mota,
        hannop: taskData.hannop,
        filedinh: taskData.filedinh,
        // set default values for others
        loai: "Baitap", // Fallback type
        diemtoida: 10,
        ngaytao: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", ""),
        ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
      })
      .select("mabaitap")
      .single();

    if (error) throw error;

    // Create a notification for the students
    const { data: gvData } = await supabase
      .from("giangvien")
      .select("mataikhoan")
      .eq("magv", magv)
      .single();

    if (gvData?.mataikhoan) {
      await supabase.from("thongbao").insert({
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

  /**
   * Lấy danh sách các bài thi trực tuyến (đề thi) của giảng viên
   */
  async getExams(magv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Lấy danh sách phân công
    const { data: phancongList } = await supabase
      .from("phancong")
      .select("maphancong, monhoc(tenmon), lop(tenlop)")
      .eq("magv", magv);

    const maphancongIds = (phancongList ?? []).map((pc: any) => pc.maphancong);

    if (maphancongIds.length === 0) return [];

    // 2. Lấy các đề thi thuộc các lớp này
    const { data: exams, error } = await supabase
      .from("dethi")
      .select("*, cauhoi(*, dapan(*)), ketquathi(*)")
      .in("maphancong", maphancongIds)
      .order("thoigianbatdau", { ascending: false });

    if (error) throw error;

    // Map lại thông tin lớp cho mỗi exam
    return (exams ?? []).map((exam: any) => {
      const pc = phancongList?.find(p => p.maphancong === exam.maphancong) as any;
      return {
        ...exam,
        tenlop: pc?.lop?.tenlop || "Không rõ",
        tenmon: pc?.monhoc?.tenmon || "Không rõ"
      };
    });
  },

  /**
   * Kết thúc ca thi trực tuyến (cập nhật thoigianketthuc = now)
   */
  async endExam(magv: string, madethi: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate quyền
    const { data: phancongList } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv);
    
    const maphancongIds = (phancongList ?? []).map((pc: any) => pc.maphancong);

    const { data: examCheck } = await supabase
      .from("dethi")
      .select("madethi")
      .eq("madethi", madethi)
      .in("maphancong", maphancongIds)
      .maybeSingle();

    if (!examCheck) {
      throw new Error("Không tìm thấy bài thi hoặc không có quyền");
    }

    const { error } = await supabase
      .from("dethi")
      .update({ thoigianketthuc: new Date().toISOString() })
      .eq("madethi", madethi);

    if (error) throw error;
    return true;
  },

  /**
   * Tạo đề thi mới và thêm các câu hỏi/đáp án đi kèm
   */
  async createExamWithQuestions(
    magv: string,
    examData: {
      maphancong: number;
      tieude: string;
      mota: string;
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
      matkhau: string;
    },
    questions: Array<{
      noidung: string;
      diem: number;
      dapan: Array<{ noidung: string; ladapandung: boolean }>;
    }>
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate quyền
    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", examData.maphancong)
      .eq("magv", magv)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");
    }

    // 1. Tạo đề thi
    const { data: newExam, error: examError } = await supabase
      .from("dethi")
      .insert({
        maphancong: examData.maphancong,
        tieude: examData.tieude,
        mota: examData.mota,
        thoigianlam: examData.thoigianlam,
        thoigianbatdau: examData.thoigianbatdau,
        thoigianketthuc: examData.thoigianketthuc,
        matkhau: examData.matkhau,
        xaotroncauhoi: false,
        xaotrondapan: false,
        solan: 1,
        hienthidapan: true,
        ngaytao: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", ""),
        ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
      })
      .select("madethi")
      .single();

    if (examError) throw examError;
    const madethi = newExam.madethi;

    // 2. Chèn các câu hỏi và đáp án
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: newQ, error: qError } = await supabase
        .from("cauhoi")
        .insert({
          madethi,
          noidung: q.noidung,
          loaicauhoi: "TracNghiem",
          diem: q.diem || 0.2,
          thutu: i + 1
        })
        .select("macauhoi")
        .single();

      if (qError) throw qError;

      // Chèn các đáp án của câu hỏi
      const dapanInserts = q.dapan.map((d, dIdx) => ({
        macauhoi: newQ.macauhoi,
        noidung: d.noidung,
        ladapandung: d.ladapandung,
        thutu: dIdx + 1
      }));

      const { error: dError } = await supabase
        .from("dapan")
        .insert(dapanInserts);

      if (dError) throw dError;
    }

    return { madethi };
  },

  /**
   * Cập nhật thời gian thi
   */
  async updateExamTime(
    magv: string,
    madethi: number,
    timeData: {
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
    }
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate quyền
    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv);
    const maphancongIds = (pcCheck ?? []).map((p: any) => p.maphancong);

    const { data: examCheck } = await supabase
      .from("dethi")
      .select("madethi")
      .eq("madethi", madethi)
      .in("maphancong", maphancongIds)
      .maybeSingle();

    if (!examCheck) {
      throw new Error("Không tìm thấy đề thi hoặc bạn không có quyền chỉnh sửa");
    }

    const { error } = await supabase
      .from("dethi")
      .update({
        thoigianlam: timeData.thoigianlam,
        thoigianbatdau: timeData.thoigianbatdau,
        thoigianketthuc: timeData.thoigianketthuc,
        ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
      })
      .eq("madethi", madethi);

    if (error) throw error;
    return true;
  },

  /**
   * Tính toán thống kê học phần
   */
  async getClassStats(magv: string, maphancong: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Validate quyền
    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv)
      .eq("maphancong", maphancong)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    // 1. Sĩ số lớp
    const { data: svList } = await supabase
      .from("sinhvienmonhoc")
      .select("masv")
      .eq("maphancong", maphancong);
    const totalStudents = svList?.length || 0;

    // 2. Điểm tổng kết & Phân bổ điểm
    const { data: tkRows } = await supabase
      .from("diemtongket")
      .select("diemtongket, diemchu")
      .eq("maphancong", maphancong);

    let totalGpa = 0;
    let passCount = 0;
    const gradeDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    if (tkRows && tkRows.length > 0) {
      tkRows.forEach((r: any) => {
        const val = r.diemtongket || 0;
        totalGpa += val;
        if (val >= 4.0) passCount++;

        const chu = (r.diemchu || "").toUpperCase();
        if (chu.startsWith("A")) gradeDist.A++;
        else if (chu.startsWith("B")) gradeDist.B++;
        else if (chu.startsWith("C")) gradeDist.C++;
        else if (chu.startsWith("D")) gradeDist.D++;
        else gradeDist.F++;
      });
    }

    const avgGpa = totalStudents > 0 ? Number((totalGpa / totalStudents).toFixed(2)) : 0;
    const passRate = totalStudents > 0 ? Number(((passCount / totalStudents) * 100).toFixed(1)) : 0;

    // 3. Tỉ lệ điểm danh
    const { data: lichList } = await supabase
      .from("lichhoc")
      .select("malichhoc")
      .eq("maphancong", maphancong);
    const lichIds = (lichList ?? []).map((l: any) => l.malichhoc);

    let avgAttendance = 0;

    if (lichIds.length > 0) {
      const { data: buoiList } = await supabase
        .from("buoihoc")
        .select("mabuoihoc")
        .in("malichhoc", lichIds);
      const buoiIds = (buoiList ?? []).map((b: any) => b.mabuoihoc);

      if (buoiIds.length > 0) {
        const { data: ddRows } = await supabase
          .from("diemdanh")
          .select("trangthai")
          .in("mabuoihoc", buoiIds);

        if (ddRows && ddRows.length > 0) {
          const present = ddRows.filter((d: any) => d.trangthai === "Comat" || d.trangthai === "Dimuon").length;
          avgAttendance = Number(((present / ddRows.length) * 100).toFixed(1));
        }
      }
    }

    return {
      avgAttendance,
      passRate,
      avgGpa,
      gradeDist: {
        A: totalStudents > 0 ? Math.round((gradeDist.A / totalStudents) * 100) : 0,
        B: totalStudents > 0 ? Math.round((gradeDist.B / totalStudents) * 100) : 0,
        C: totalStudents > 0 ? Math.round((gradeDist.C / totalStudents) * 100) : 0,
        DF: totalStudents > 0 ? Math.round((gradeDist.D + gradeDist.F) / totalStudents * 100) : 0
      }
    };
  },

  /**
   * Lấy danh sách báo cáo cũ
   */
  async getReports(magv: string, maphancong: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv)
      .eq("maphancong", maphancong)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    const { data: list } = await supabase
      .from("tailieu")
      .select("matailieu, tieude, mota, duongdan, ngaytao")
      .eq("maphancong", maphancong)
      .eq("loai", "File")
      .order("ngaytao", { ascending: false });

    return list ?? [];
  },

  /**
   * Tạo báo cáo mới
   */
  async createReport(
    magv: string,
    maphancong: number,
    tieude: string,
    mota: string,
    statsJson: string
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv)
      .eq("maphancong", maphancong)
      .maybeSingle();

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    const { data, error } = await supabase
      .from("tailieu")
      .insert({
        maphancong,
        tieude,
        mota,
        loai: "File",
        duongdan: statsJson,
        chopheptai: false,
        dungluong: 0,
        luotxem: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật báo cáo (tiêu đề và/hoặc nhận xét)
   */
  async updateReport(
    magv: string,
    matailieu: number,
    updates: { tieude?: string; mota?: string }
  ) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: pcCheck } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv);
    const maphancongIds = (pcCheck ?? []).map((p: any) => p.maphancong);

    const { data: tlCheck } = await supabase
      .from("tailieu")
      .select("matailieu")
      .eq("matailieu", matailieu)
      .in("maphancong", maphancongIds)
      .maybeSingle();

    if (!tlCheck) {
      throw new Error("Không tìm thấy báo cáo hoặc bạn không có quyền chỉnh sửa");
    }

    const updatePayload: Record<string, any> = {
      ngaycapnhat: new Date().toISOString()
    };
    if (updates.tieude !== undefined) updatePayload.tieude = updates.tieude;
    if (updates.mota !== undefined) updatePayload.mota = updates.mota;

    const { error } = await supabase
      .from("tailieu")
      .update(updatePayload)
      .eq("matailieu", matailieu);

    if (error) throw error;
    return true;
  }
};