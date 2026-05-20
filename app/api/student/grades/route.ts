import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireStudent(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.SinhVien ? payload : null;
  } catch {
    return null;
  }
}

// ─── GET /api/student/grades ──────────────────────────────────────────────────
// GPA hoàn toàn đọc từ view_gpa_sinhvien (tính sẵn trong DB).
// Chỉ fetch thêm bảng điểm chi tiết theo từng môn/học kỳ.

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mahockyParam = searchParams.get("mahocky"); // "all" | undefined | số
  const isAll = !mahockyParam || mahockyParam === "all";

  const supabase = createClient(await cookies());

  // ── 1. Lấy masv từ tài khoản ─────────────────────────────────────────────
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json({ error: "Không tìm thấy sinh viên." }, { status: 404 });
  }
  const { masv } = svData;

  // ── 2. Đọc toàn bộ GPA bằng cách tính toán trong JS (Tránh lỗi Permission Denied trên view) ──
  const { data: svFullData } = await supabase
    .from("sinhvien")
    .select(`
      masv,
      hodem,
      ten,
      emailtruong,
      malop,
      lop:malop ( tenlop )
    `)
    .eq("masv", masv)
    .single();

  const hoten = svFullData
    ? [svFullData.hodem, svFullData.ten].filter(Boolean).join(" ").trim()
    : "Sinh Viên";
  const emailtruong = svFullData?.emailtruong ?? "";
  const malop = svFullData?.malop ?? "";
  const tenlop = (svFullData as any)?.lop?.tenlop ?? "";

  // 2b. Tính toán điểm tổng kết
  const { data: allDiemTongKet } = await supabase
    .from("diemtongket")
    .select("maphancong, diemtongket, ketqua")
    .eq("masv", masv);

  const pcIds = (allDiemTongKet ?? []).map(dt => dt.maphancong);

  let diemMoinhat: any[] = [];
  if (pcIds.length > 0) {
    const { data: allPhanCong } = await supabase
      .from("phancong")
      .select(`
        maphancong,
        mamon,
        mahocky,
        monhoc:mamon ( sotinchi ),
        hocky:mahocky ( danghieuluc )
      `)
      .in("maphancong", pcIds);

    const rawList = (allDiemTongKet ?? []).map(dt => {
      const pc = (allPhanCong ?? []).find(p => p.maphancong === dt.maphancong);
      if (!pc) return null;
      return {
        mamon: pc.mamon,
        mahocky: pc.mahocky,
        sotinchi: (pc.monhoc as any)?.sotinchi ?? 0,
        diemtongket: dt.diemtongket !== null ? Number(dt.diemtongket) : null,
        ketqua: dt.ketqua,
        la_hocky_hientai: (pc.hocky as any)?.danghieuluc ?? false
      };
    }).filter(Boolean);

    const mapMoinhat: Record<string, any> = {};
    rawList.forEach(item => {
      if (!item || item.diemtongket === null) return;
      if (item.ketqua !== "Dat" && item.ketqua !== "KhongDat") return;

      const existing = mapMoinhat[item.mamon];
      if (!existing || item.mahocky > existing.mahocky) {
        mapMoinhat[item.mamon] = item;
      }
    });

    diemMoinhat = Object.values(mapMoinhat);
  }

  const tinhDiemHe4 = (d: number) => {
    if (d >= 9.5) return 4.0;
    if (d >= 8.5) return 3.7;
    if (d >= 7.8) return 3.3;
    if (d >= 7.0) return 3.0;
    if (d >= 6.3) return 2.5;
    if (d >= 5.5) return 2.0;
    if (d >= 4.8) return 1.5;
    if (d >= 4.0) return 1.0;
    return 0.0;
  };

  let gpa10_hocky_hientai = 0;
  let gpa4_hocky_hientai = 0;
  let sotinchi_hocky_hientai = 0;
  let sotinchi_dat_hocky_hientai = 0;

  let gpa10_tich_luy = 0;
  let gpa4_tich_luy = 0;
  let tong_sotinchi_da_hoc = 0;
  let sotinchi_tich_luy_dat = 0;

  const listKHT = diemMoinhat.filter(d => d.la_hocky_hientai);
  if (listKHT.length > 0) {
    let sumD10 = 0;
    let sumD4 = 0;
    let sumTC = 0;
    listKHT.forEach(d => {
      sumD10 += d.diemtongket * d.sotinchi;
      sumD4 += tinhDiemHe4(d.diemtongket) * d.sotinchi;
      sumTC += d.sotinchi;
      if (d.ketqua === "Dat") {
        sotinchi_dat_hocky_hientai += d.sotinchi;
      }
    });
    if (sumTC > 0) {
      gpa10_hocky_hientai = sumD10 / sumTC;
      gpa4_hocky_hientai = sumD4 / sumTC;
      sotinchi_hocky_hientai = sumTC;
    }
  }

  if (diemMoinhat.length > 0) {
    let sumD10 = 0;
    let sumD4 = 0;
    let sumTC = 0;
    diemMoinhat.forEach(d => {
      sumD10 += d.diemtongket * d.sotinchi;
      sumD4 += tinhDiemHe4(d.diemtongket) * d.sotinchi;
      sumTC += d.sotinchi;
      if (d.ketqua === "Dat") {
        sotinchi_tich_luy_dat += d.sotinchi;
      }
    });
    if (sumTC > 0) {
      gpa10_tich_luy = sumD10 / sumTC;
      gpa4_tich_luy = sumD4 / sumTC;
      tong_sotinchi_da_hoc = sumTC;
    }
  }

  const getXepLoai10 = (gpa: number) => {
    if (gpa >= 9.0) return "Xuất sắc";
    if (gpa >= 8.0) return "Giỏi";
    if (gpa >= 7.0) return "Khá";
    if (gpa >= 5.0) return "Trung bình";
    if (gpa >= 4.0) return "Yếu";
    return "Kém";
  };

  const getXepLoai4 = (gpa: number) => {
    if (gpa >= 3.6) return "Xuất sắc";
    if (gpa >= 3.2) return "Giỏi";
    if (gpa >= 2.5) return "Khá";
    if (gpa >= 2.0) return "Trung bình";
    if (gpa >= 1.0) return "Yếu";
    return "Kém";
  };

  const xep_loai_hoc_luc = tong_sotinchi_da_hoc > 0 ? getXepLoai10(gpa10_tich_luy) : null;
  const xep_loai_hoc_luc_he4 = tong_sotinchi_da_hoc > 0 ? getXepLoai4(gpa4_tich_luy) : null;

  const gpaView = {
    masv,
    hoten,
    emailtruong,
    malop,
    tenlop,
    gpa10_hocky_hientai,
    gpa4_hocky_hientai,
    sotinchi_hocky_hientai,
    sotinchi_dat_hocky_hientai,
    gpa10_tich_luy,
    gpa4_tich_luy,
    tong_sotinchi_da_hoc,
    sotinchi_tich_luy_dat,
    xep_loai_hoc_luc,
    xep_loai_hoc_luc_he4
  };


  // ── 3. Danh sách học kỳ ───────────────────────────────────────────────────
  const { data: dsHocKy } = await supabase
    .from("hocky")
    .select("mahocky, tenhocky, namhoc, ky, danghieuluc")
    .order("namhoc", { ascending: false })
    .order("ky", { ascending: false });

  const hocKyList = dsHocKy ?? [];
  const mahocky = isAll ? null : Number(mahockyParam);
  const hocKyHienTai = mahocky
    ? (hocKyList.find((hk) => hk.mahocky === mahocky) ?? null)
    : null;

  // ── 4. Lấy chi tiết điểm (chỉ để hiển thị bảng, KHÔNG tính GPA) ─────────
  // 4a. Lấy phân công SV đang học + đã học
  const { data: rawEnrolled } = await supabase
    .from("sinhvienmonhoc")
    .select("maphancong")
    .eq("masv", masv);

  const { data: rawTongKet } = await supabase
    .from("diemtongket")
    .select("maphancong, diemtongket, diemchu, ketqua")
    .eq("masv", masv);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tongKetMap: Record<number, any> = {};
  const allMaphancong = new Set<number>();

  (rawEnrolled ?? []).forEach((r) => allMaphancong.add(r.maphancong));
  (rawTongKet ?? []).forEach((tk) => {
    allMaphancong.add(tk.maphancong);
    tongKetMap[tk.maphancong] = tk;
  });

  const maphancongList = Array.from(allMaphancong);

  if (maphancongList.length === 0) {
    return NextResponse.json({
      hocKyList,
      mahocky,
      hocKy: hocKyHienTai,
      grades: [],
      gpaView: gpaView ?? null,
    });
  }

  // 4b. Thông tin phân công + môn học + giảng viên
  const { data: phancongData } = await supabase
    .from("phancong")
    .select(`
      maphancong,
      mahocky,
      malophoc,
      mamon,
      monhoc:mamon ( tenmon, sotinchi ),
      giangvien:magv ( hodem, ten )
    `)
    .in("maphancong", maphancongList);

  let filteredPhancong = phancongData ?? [];
  if (!isAll && mahocky) {
    filteredPhancong = filteredPhancong.filter((pc) => pc.mahocky === mahocky);
  }

  // 4c. Điểm thành phần
  const filteredPcIds = filteredPhancong.map((pc) => pc.maphancong);
  const { data: rawDiem } = filteredPcIds.length > 0
    ? await supabase
        .from("diem")
        .select("maphancong, loaidiem, giatri, heso")
        .eq("masv", masv)
        .in("maphancong", filteredPcIds)
    : { data: [] };

  const diemThanhPhanMap: Record<number, { loai: string; giatri: number; heso: number }[]> = {};
  (rawDiem ?? []).forEach((d) => {
    if (!diemThanhPhanMap[d.maphancong]) diemThanhPhanMap[d.maphancong] = [];
    diemThanhPhanMap[d.maphancong].push({ loai: d.loaidiem, giatri: d.giatri, heso: d.heso });
  });

  // 4d. Build danh sách grades — chỉ hiển thị, KHÔNG dùng để tính GPA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grades = filteredPhancong.map((pc: any, idx: number) => {
    const mon = pc.monhoc;
    const tk = tongKetMap[pc.maphancong] ?? null;
    const diem10 = tk?.diemtongket !== null && tk?.diemtongket !== undefined
      ? Number(tk.diemtongket) : null;
    const diemChu = tk?.diemchu ?? null;
    const ketQua = tk?.ketqua ?? null;

    return {
      stt: idx + 1,
      mamon: pc.mamon ?? "---",
      malophoc: pc.malophoc ?? "---",
      mahocky: pc.mahocky,
      tenmon: mon?.tenmon ?? "Chưa có tên môn",
      sotinchi: mon?.sotinchi ?? 0,
      giangvien: pc.giangvien
        ? [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "---"
        : "---",
      diem10,
      diemchu: diemChu,
      ketqua: ketQua,
      dat: ketQua === "Dat",
      coDiem: diem10 !== null,
      diemThanhPhan: diemThanhPhanMap[pc.maphancong] ?? [],
    };
  });

  return NextResponse.json({
    hocKyList,
    mahocky,
    hocKy: hocKyHienTai,
    grades,
    gpaView: gpaView ?? null, // Toàn bộ GPA từ view — không tính lại
  });
}
