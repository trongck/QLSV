import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalSV:   number;
  totalGV:   number;
  totalLop:  number;
  totalKhoa: number;
  recentSV: { masv: string; hoten: string; tenlop: string; trangthai: string }[];
  recentGV: { magv: string; hoten: string; tenkhoa: string; hocvi: string | null }[];
  todaySchedules?: {
    malichhoc: number;
    tietbatdau: number;
    tietketthuc: number;
    phonghoc: string | null;
    loaiphong: string | null;
    ghichu: string | null;
    monhoc: string;
    giangvien: string;
    lop: string;
  }[];
  auditLogs?: any[];
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Xác thực — chỉ Admin mới được gọi endpoint này
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    if (payload.vaitro !== VaiTro.Admin) {
      return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const detailType = searchParams.get("detailType") ?? ""; // "sv" | "gv"
    const detailId = searchParams.get("detailId") ?? "";

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

    // A. XỬ LÝ XEM CHI TIẾT (Detail View) + Ghi Log
    if (detailType && detailId) {
      if (detailType === "sv") {
        const { data: sv, error: svError } = await supabase
          .from("sinhvien")
          .select(`
            masv,
            hoten,
            ngaysinh,
            gioitinh,
            emailtruong,
            trangthai,
            malop,
            lop(tenlop, makhoa, khoa(tenkhoa)),
            chitietsinhvien(
              sodienthoai,
              emailcanhan,
              quequan,
              diachi,
              tenphuhuynh,
              sodienthoaiphuhuynh,
              cccd,
              ngaycapcccd,
              noicapcccd,
              dantoc,
              tongiao
            )
          `)
          .eq("masv", detailId)
          .single();

        if (svError) {
          return NextResponse.json({ error: svError.message }, { status: 404 });
        }

        // Ghi nhật ký hệ thống: xem sinh viên
        await logAuditAction({
          supabase,
          mataikhoan: payload.mataikhoan,
          hanhdong: `Xem chi tiết sinh viên: ${sv.hoten} (${detailId})`,
          tentable: "sinhvien",
          makhoachinh: detailId,
          request,
        });

        return NextResponse.json({ success: true, data: sv });
      } else if (detailType === "gv") {
        const { data: gv, error: gvError } = await supabase
          .from("giangvien")
          .select(`
            magv,
            hoten,
            ngaysinh,
            gioitinh,
            hocvi,
            chuyennganh,
            emailtruong,
            makhoa,
            khoa(tenkhoa),
            chitietgiangvien(
              sodienthoai,
              emailcanhan,
              diachi,
              ngayvaotruong,
              hesoluong
            )
          `)
          .eq("magv", detailId)
          .single();

        if (gvError) {
          return NextResponse.json({ error: gvError.message }, { status: 404 });
        }

        // Ghi nhật ký hệ thống: xem giảng viên
        await logAuditAction({
          supabase,
          mataikhoan: payload.mataikhoan,
          hanhdong: `Xem chi tiết giảng viên: ${gv.hoten} (${detailId})`,
          tentable: "giangvien",
          makhoachinh: detailId,
          request,
        });

        return NextResponse.json({ success: true, data: gv });
      } else {
        return NextResponse.json({ error: "Loại chi tiết không hợp lệ." }, { status: 400 });
      }
    }

    // B. XỬ LÝ TÌM KIẾM TOÀN CẦU (Global Search) + Ghi Log
    if (search) {
      const [
        { data: sinhvien },
        { data: giangvien },
        { data: lop },
        { data: monhoc }
      ] = await Promise.all([
        supabase
          .from("sinhvien")
          .select("masv, hoten, trangthai, lop(tenlop)")
          .or(`hoten.ilike.%${search}%,masv.ilike.%${search}%`)
          .limit(10),
        supabase
          .from("giangvien")
          .select("magv, hoten, hocvi, khoa(tenkhoa)")
          .or(`hoten.ilike.%${search}%,magv.ilike.%${search}%`)
          .limit(10),
        supabase
          .from("lop")
          .select("malop, tenlop, siso, khoa(tenkhoa)")
          .or(`tenlop.ilike.%${search}%,malop.ilike.%${search}%`)
          .limit(10),
        supabase
          .from("monhoc")
          .select("mamon, tenmon, sitinchi, khoa(tenkhoa)")
          .or(`tenmon.ilike.%${search}%,mamon.ilike.%${search}%`)
          .limit(10)
      ]);

      // Ghi nhật ký hệ thống: Tìm kiếm toàn cầu
      await logAuditAction({
        supabase,
        mataikhoan: payload.mataikhoan,
        hanhdong: `Tìm kiếm hệ thống: "${search}"`,
        request,
      });

      return NextResponse.json({
        success: true,
        results: {
          sinhvien: sinhvien ?? [],
          giangvien: giangvien ?? [],
          lop: lop ?? [],
          monhoc: monhoc ?? []
        }
      });
    }

    // C. MẶC ĐỊNH: Trả về Stats tổng hợp + Lịch học hôm nay + Nhật ký hệ thống
    const jsDay = new Date().getDay();
    const thuTrongTuan = jsDay === 0 ? 8 : jsDay + 1; // 2 -> 8 (Chủ nhật là 8)

    const [
      { count: totalSV },
      { count: totalGV },
      { count: totalLop },
      { count: totalKhoa },
      { data: svList },
      { data: gvList },
      { data: todaySchedules },
      { data: auditLogs }
    ] = await Promise.all([
      supabase.from("sinhvien").select("masv",  { count: "exact", head: true }),
      supabase.from("giangvien").select("magv", { count: "exact", head: true }),
      supabase.from("lop").select("malop",      { count: "exact", head: true }),
      supabase.from("khoa").select("makhoa",    { count: "exact", head: true }),
      supabase
        .from("sinhvien")
        .select("masv, hoten, trangthai, lop(tenlop)")
        .order("masv", { ascending: false })
        .limit(8),
      supabase
        .from("giangvien")
        .select("magv, hoten, hocvi, khoa(tenkhoa)")
        .order("magv", { ascending: false })
        .limit(8),
      supabase
        .from("lichhoc")
        .select(`
          malichhoc,
          thutrongtuan,
          tietbatdau,
          tietketthuc,
          phonghoc,
          loaiphong,
          ghichu,
          phancong(
            maphancong,
            magv,
            mamon,
            malop,
            giangvien:magv(hoten),
            monhoc:mamon(tenmon),
            lop:malop(tenlop)
          )
        `)
        .eq("thutrongtuan", thuTrongTuan)
        .order("tietbatdau", { ascending: true }),
      supabase
        .from("nhatkyhethong")
        .select(`
          manhatky,
          mataikhoan,
          hanhdong,
          tentable,
          makhoachinh,
          diachiip,
          ngaytao,
          taikhoan:mataikhoan(email, vaitro)
        `)
        .order("ngaytao", { ascending: false })
        .limit(20)
    ]);

    const stats: AdminStats = {
      totalSV:   totalSV   ?? 0,
      totalGV:   totalGV   ?? 0,
      totalLop:  totalLop  ?? 0,
      totalKhoa: totalKhoa ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentSV: (svList ?? []).map((sv: any) => ({
        masv:      sv.masv,
        hoten:     sv.hoten,
        tenlop:    sv.lop?.tenlop ?? "—",
        trangthai: sv.trangthai,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentGV: (gvList ?? []).map((gv: any) => ({
        magv:    gv.magv,
        hoten:   gv.hoten,
        tenkhoa: gv.khoa?.tenkhoa ?? "—",
        hocvi:   gv.hocvi ?? null,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todaySchedules: (todaySchedules ?? []).map((lh: any) => ({
        malichhoc: lh.malichhoc,
        tietbatdau: lh.tietbatdau,
        tietketthuc: lh.tietketthuc,
        phonghoc: lh.phonghoc,
        loaiphong: lh.loaiphong,
        ghichu: lh.ghichu,
        monhoc: lh.phancong?.monhoc?.tenmon ?? "—",
        giangvien: lh.phancong?.giangvien?.hoten ?? "—",
        lop: lh.phancong?.lop?.tenlop ?? "—"
      })),
      auditLogs: auditLogs ?? []
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}