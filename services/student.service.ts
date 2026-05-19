import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

export const sinhVienService = {

  // ─── Thông tin cá nhân ───────────────────────────────────────────────────────

  async getMyProfile(mataikhoan: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("sinhvien")
      .select(`
        masv,
        mataikhoan,
        malop,
        hodem,
        ten,
        ngaysinh,
        gioitinh,
        anhdaidien,
        emailtruong,
        trangthai,
        quequan,
        diachi,
        sodienthoai,
        emailcanhan,
        tenphuhuynh,
        sodienthoaiphuhuynh,
        cccd,
        ngaycapcccd,
        noicapcccd,
        dantoc,
        tongiao
      `)
      .eq("mataikhoan", mataikhoan)
      .single();

    if (error) throw error;

    // Combine hodem and ten
    const hoten = `${data.hodem || ""} ${data.ten || ""}`.trim() || "Sinh viên";

    return {
      ...data,
      hoten,
      chitietsinhvien: {
        quequan: data.quequan,
        diachi: data.diachi,
        sodienthoai: data.sodienthoai,
        emailcanhan: data.emailcanhan,
        tenphuhuynh: data.tenphuhuynh,
        sodienthoaiphuhuynh: data.sodienthoaiphuhuynh,
        cccd: data.cccd,
        ngaycapcccd: data.ngaycapcccd,
        noicapcccd: data.noicapcccd,
        dantoc: data.dantoc,
        tongiao: data.tongiao
      },
      lop: {
        tenlop: data.malop || "—",
        nganh: "Công nghệ thông tin",
        khoahoc: "K68"
      }
    };
  },

  // ─── Tổng quan Dashboard ────────────────────────────────────────────────────

  async getDashboardStats(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Truy vấn song song để tối ưu hiệu suất
    const [
      { data: svMonHoc },
      { data: diemRows },
      { data: diemDanh }
    ] = await Promise.all([
      supabase
        .from("sinhvienmonhoc")
        .select("maphancong")
        .eq("masv", masv)
        .eq("trangthai", "Danghoc"),
      supabase
        .from("diem")
        .select("loaidiem, giatri, maphancong")
        .eq("masv", masv)
        .order("ngaytao", { ascending: false })
        .limit(6),
      supabase
        .from("diemdanh")
        .select("trangthai")
        .eq("masv", masv)
        .eq("trangthai", "Vangmat")
    ]);

    // Tính GPA từ điểm cuối kỳ
    let diemTBHK: number | null = null;
    if (diemRows && diemRows.length > 0) {
      const cuoiky = diemRows.filter(d => d.loaidiem === "CuoiKy");
      if (cuoiky.length > 0) {
        diemTBHK = parseFloat(
          (cuoiky.reduce((s, d) => s + d.giatri, 0) / cuoiky.length).toFixed(2)
        );
      }
    }

    // Lọc bài tập chưa nộp thuộc các môn SV đang học
    const myAssignments = (svMonHoc ?? []).map(m => m.maphancong);
    let soBaiTapConHan = 0;
    if (myAssignments.length > 0) {
      // 1. Lấy tất cả bài tập thuộc các môn học này
      const { data: allBT } = await supabase
        .from("baitap")
        .select("mabaitap")
        .in("maphancong", myAssignments);

      if (allBT && allBT.length > 0) {
        const maBTs = allBT.map(b => b.mabaitap);
        
        // 2. Lấy danh sách các bài tập mà sinh viên đã nộp
        const { data: submittedBT } = await supabase
          .from("nopbai")
          .select("mabaitap")
          .eq("masv", masv)
          .in("mabaitap", maBTs);

        const submittedIDs = new Set((submittedBT ?? []).map(s => s.mabaitap));

        // 3. Đếm số bài tập chưa nộp
        soBaiTapConHan = allBT.filter(b => !submittedIDs.has(b.mabaitap)).length;
      }
    }

    return {
      monHocCount: svMonHoc?.length ?? 0,
      diemTBHK,
      soBuoiVang: diemDanh?.length ?? 0,
      soBaiTapConHan,
      diemGanDay: diemRows ?? []
    };
  },

  // ─── Lịch học hôm nay ───────────────────────────────────────────────────────

  async getTodaySchedule(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Thứ trong tuần: JS getDay() → 0=CN, 1=T2... DB dùng 2=T2, 3=T3... 8=CN
    const jsDay = new Date().getDay();
    const dbDay = jsDay === 0 ? 8 : jsDay + 1;

    const { data, error } = await supabase
      .from("lichhocsinhvien")
      .select("tenmon, phonghoc, tietbatdau, tietketthuc")
      .eq("masv", masv)
      .eq("thutrongtuan", dbDay)
      .order("tietbatdau", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  // ─── Lịch học đầy đủ cả tuần ───────────────────────────────────────────────

  async getFullSchedule(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Lấy tất cả phân công mà SV đang học
    const { data: svMonHoc } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .eq("masv", masv)
      .eq("trangthai", "Danghoc");

    if (!svMonHoc || svMonHoc.length === 0) return [];

    const maPCs = svMonHoc.map(m => m.maphancong);

    // Lấy lịch học kèm thông tin phân công → môn học
    const { data, error } = await supabase
      .from("lichhoc")
      .select(`
        malichhoc,
        maphancong,
        thutrongtuan,
        tietbatdau,
        tietketthuc,
        phonghoc,
        loaiphong,
        ghichu,
        phancong (
          mamon,
          malop,
          malophoc,
          monhoc ( tenmon, sotinchi )
        )
      `)
      .in("maphancong", maPCs)
      .order("thutrongtuan", { ascending: true })
      .order("tietbatdau", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  // ─── Bảng điểm chi tiết ────────────────────────────────────────────────────

  async getGrades(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("diem")
      .select(`
        madiem,
        loaidiem,
        giatri,
        heso,
        ghichu,
        ngaytao,
        maphancong,
        phancong (
          mamon,
          malophoc,
          monhoc ( tenmon, sotinchi )
        )
      `)
      .eq("masv", masv)
      .order("ngaytao", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // ─── Điểm tổng kết theo môn ────────────────────────────────────────────────

  async getGradeSummary(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("diemtongket")
      .select(`
        maphancong,
        diemtongket,
        diemchu,
        ketqua,
        ngaycapnhat,
        phancong (
          mamon,
          malophoc,
          monhoc ( tenmon, sotinchi )
        )
      `)
      .eq("masv", masv)
      .order("ngaycapnhat", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // ─── Danh sách bài tập ─────────────────────────────────────────────────────

  async getAssignments(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Lấy các phân công SV đang học
    const { data: svMonHoc } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .eq("masv", masv)
      .eq("trangthai", "Danghoc");

    if (!svMonHoc || svMonHoc.length === 0) return [];

    const maPCs = svMonHoc.map(m => m.maphancong);

    const { data, error } = await supabase
      .from("baitap")
      .select(`
        mabaitap,
        maphancong,
        tieude,
        mota,
        filedinh,
        hannop,
        diemtoida,
        loai,
        ngaytao,
        phancong (
          mamon,
          malophoc,
          monhoc ( tenmon )
        )
      `)
      .in("maphancong", maPCs)
      .order("hannop", { ascending: true });

    if (error) throw error;

    // Lấy bài nộp của SV cho các bài tập này
    const maBTs = (data ?? []).map(b => b.mabaitap);
    let nopBaiMap: Record<number, any> = {};

    if (maBTs.length > 0) {
      const { data: nopBaiRows } = await supabase
        .from("nopbai")
        .select("mabaitap, manopbai, thoigiannop, trenop, diem, nhanxet")
        .eq("masv", masv)
        .in("mabaitap", maBTs);

      if (nopBaiRows) {
        for (const nb of nopBaiRows) {
          nopBaiMap[nb.mabaitap] = nb;
        }
      }
    }

    // Gộp thông tin nộp bài vào từng bài tập
    return (data ?? []).map(bt => ({
      ...bt,
      nopbai: nopBaiMap[bt.mabaitap] ?? null
    }));
  },

  // ─── Nộp bài tập ───────────────────────────────────────────────────────────

  async submitAssignment(masv: string, mabaitap: number, noidungnop: string | null, filenop: string | null) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Kiểm tra bài tập tồn tại và chưa hết hạn
    const { data: baitap, error: btErr } = await supabase
      .from("baitap")
      .select("mabaitap, hannop")
      .eq("mabaitap", mabaitap)
      .single();

    if (btErr || !baitap) throw new Error("Bài tập không tồn tại.");

    const now = new Date();
    const hannop = new Date(baitap.hannop);
    const trenop = now > hannop;

    // Kiểm tra đã nộp chưa
    const { data: existing } = await supabase
      .from("nopbai")
      .select("manopbai")
      .eq("mabaitap", mabaitap)
      .eq("masv", masv)
      .maybeSingle();

    if (existing) {
      // Cập nhật bài nộp
      const { error: updateErr } = await supabase
        .from("nopbai")
        .update({
          noidungnop,
          filenop,
          thoigiannop: now.toISOString(),
          trenop
        })
        .eq("manopbai", existing.manopbai);

      if (updateErr) throw updateErr;
      return { updated: true, trenop };
    } else {
      // Thêm mới
      const { error: insertErr } = await supabase
        .from("nopbai")
        .insert({
          mabaitap,
          masv,
          noidungnop,
          filenop,
          thoigiannop: now.toISOString(),
          trenop
        });

      if (insertErr) throw insertErr;
      return { updated: false, trenop };
    }
  },

  // ─── Bài đã nộp ────────────────────────────────────────────────────────────

  async getMySubmissions(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("nopbai")
      .select(`
        manopbai,
        mabaitap,
        noidungnop,
        filenop,
        thoigiannop,
        trenop,
        diem,
        nhanxet,
        thoigiancham,
        baitap ( tieude, hannop, diemtoida )
      `)
      .eq("masv", masv)
      .order("thoigiannop", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // ─── Cuộc trò chuyện ───────────────────────────────────────────────────────

  async getConversations(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Lấy các cuộc trò chuyện mà SV tham gia
    const { data: memberships } = await supabase
      .from("thanhvientrochuyen")
      .select("macuoctrochuyen, thoigianxemcuoi")
      .eq("masv", masv);

    if (!memberships || memberships.length === 0) return [];

    const conversationIds = memberships.map(m => m.macuoctrochuyen);
    const xemCuoiMap: Record<number, string | null> = {};
    for (const m of memberships) {
      xemCuoiMap[m.macuoctrochuyen] = m.thoigianxemcuoi;
    }

    const { data: conversations, error } = await supabase
      .from("cuoctrochuyen")
      .select("macuoctrochuyen, tieude, loai, ngaytao, maphancong")
      .in("macuoctrochuyen", conversationIds)
      .order("ngaytao", { ascending: false });

    if (error) throw error;

    // Lấy tin nhắn cuối cùng của mỗi cuộc trò chuyện
    const result = [];
    for (const conv of (conversations ?? [])) {
      const { data: lastMsg } = await supabase
        .from("tinnhan")
        .select("noidung, ngaytao, masvgui, magvgui")
        .eq("macuoctrochuyen", conv.macuoctrochuyen)
        .order("ngaytao", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Đếm tin chưa đọc
      let chuaDoc = 0;
      const xemCuoi = xemCuoiMap[conv.macuoctrochuyen];
      if (xemCuoi) {
        const { count } = await supabase
          .from("tinnhan")
          .select("matinnhan", { count: "exact", head: true })
          .eq("macuoctrochuyen", conv.macuoctrochuyen)
          .gt("ngaytao", xemCuoi);
        chuaDoc = count ?? 0;
      }

      result.push({
        ...conv,
        tinNhanCuoi: lastMsg,
        chuaDoc
      });
    }

    return result;
  },

  // ─── Tin nhắn trong cuộc trò chuyện ─────────────────────────────────────────

  async getMessages(masv: string, macuoctrochuyen: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Xác minh SV thuộc cuộc trò chuyện này
    const { data: member } = await supabase
      .from("thanhvientrochuyen")
      .select("masv")
      .eq("macuoctrochuyen", macuoctrochuyen)
      .eq("masv", masv)
      .maybeSingle();

    if (!member) throw new Error("Bạn không thuộc cuộc trò chuyện này.");

    // Cập nhật thời gian xem cuối
    await supabase
      .from("thanhvientrochuyen")
      .update({ thoigianxemcuoi: new Date().toISOString() })
      .eq("macuoctrochuyen", macuoctrochuyen)
      .eq("masv", masv);

    const { data, error } = await supabase
      .from("tinnhan")
      .select(`
        matinnhan,
        noidung,
        filedinh,
        dachinh,
        ngaytao,
        masvgui,
        magvgui
      `)
      .eq("macuoctrochuyen", macuoctrochuyen)
      .order("ngaytao", { ascending: true })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  },

  // ─── Gửi tin nhắn ──────────────────────────────────────────────────────────

  async sendMessage(masv: string, macuoctrochuyen: number, noidung: string, filedinh?: string | null) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Xác minh SV thuộc cuộc trò chuyện này
    const { data: member } = await supabase
      .from("thanhvientrochuyen")
      .select("masv")
      .eq("macuoctrochuyen", macuoctrochuyen)
      .eq("masv", masv)
      .maybeSingle();

    if (!member) throw new Error("Bạn không thuộc cuộc trò chuyện này.");

    const { data, error } = await supabase
      .from("tinnhan")
      .insert({
        macuoctrochuyen,
        masvgui: masv,
        noidung,
        filedinh: filedinh ?? null,
        dachinh: false
      })
      .select()
      .single();

    if (error) throw error;

    // Cập nhật thời gian xem cuối cho người gửi
    await supabase
      .from("thanhvientrochuyen")
      .update({ thoigianxemcuoi: new Date().toISOString() })
      .eq("macuoctrochuyen", macuoctrochuyen)
      .eq("masv", masv);

    return data;
  },

  // ─── Thông báo ──────────────────────────────────────────────────────────────

  async getNotifications(masv: string, malop: string | null) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Lấy các phân công của SV
    const { data: svMonHoc } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .eq("masv", masv)
      .eq("trangthai", "Danghoc");

    const myAssignments = (svMonHoc ?? []).map(m => m.maphancong);

    // Xây dựng điều kiện lọc
    let conditions = [
      "doituong.eq.Tatca",
      `and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop || "NONE"}))`
    ];

    if (myAssignments.length > 0) {
      conditions.push(`and(doituong.neq.GiangVien,maphancong.in.(${myAssignments.join(",")}))`);
    }

    const { data: thongBao, error } = await supabase
      .from("thongbao")
      .select(`
        mathongbao,
        tieude,
        noidung,
        loai,
        doituong,
        ghim,
        ngaytao,
        ngayhethan
      `)
      .or(conditions.join(","))
      .order("ghim", { ascending: false })
      .order("ngaytao", { ascending: false })
      .limit(30);

    if (error) throw error;

    // Lấy trạng thái đã đọc
    const mathongbaoIds = (thongBao ?? []).map(t => t.mathongbao);
    let readMap: Record<number, boolean> = {};

    if (mathongbaoIds.length > 0) {
      const { data: readRows } = await supabase
        .from("thongbaodadocsv")
        .select("mathongbao, dadoc")
        .eq("masv", masv)
        .in("mathongbao", mathongbaoIds);

      if (readRows) {
        for (const r of readRows) {
          readMap[r.mathongbao] = r.dadoc;
        }
      }
    }

    return (thongBao ?? []).map(tb => ({
      ...tb,
      dadoc: readMap[tb.mathongbao] ?? false
    }));
  },

  // ─── Đánh dấu đã đọc thông báo ────────────────────────────────────────────

  async markNotificationRead(masv: string, mathongbao: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check-then-insert/update
    const { data: existing } = await supabase
      .from("thongbaodadocsv")
      .select("mathongbao")
      .eq("masv", masv)
      .eq("mathongbao", mathongbao)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("thongbaodadocsv")
        .update({ dadoc: true, thoigiandoc: new Date().toISOString() })
        .eq("masv", masv)
        .eq("mathongbao", mathongbao);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("thongbaodadocsv")
        .insert({
          mathongbao,
          masv,
          dadoc: true,
          thoigiandoc: new Date().toISOString()
        });
      if (error) throw error;
    }

    return true;
  },

  // ─── Lịch sử điểm danh ─────────────────────────────────────────────────────

  async getAttendanceHistory(masv: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("diemdanh")
      .select(`
        madiemdanh,
        trangthai,
        ghichu,
        thoigiandiemdanh,
        phuongthuc,
        ngaytao,
        buoihoc (
          mabuoihoc,
          ngayhoc,
          noidung,
          lichhoc (
            phonghoc,
            phancong (
              mamon,
              malophoc,
              monhoc ( tenmon )
            )
          )
        )
      `)
      .eq("masv", masv)
      .order("ngaytao", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  }
};
