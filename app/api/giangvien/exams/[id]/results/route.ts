import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";
import { examRepo } from "@/services/repositories/giangvien/exam.repo";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const gv = await giangVienService.getMyProfile(payload.mataikhoan);
    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const madethi = Number(id);

    const { data: exam, error: examErr } = await examRepo.getExamWithPhanCong(madethi);
    if (examErr || !exam || exam.phancong.magv !== gv.magv) {
        return NextResponse.json({ error: "Không có quyền truy cập đề thi này" }, { status: 403 });
    }

    const { data: studentsData } = await examRepo.getStudentsByPhanCong(exam.maphancong);
    const { data: resultsData } = await examRepo.getKetQuaThiByExam(madethi);

    const students = (studentsData || []).map((s: any) => {
        const result = (resultsData || []).find((r: any) => r.masv === s.sinhvien.masv);
        let trangthai = 'Chưa bắt đầu';
        let chuyentab = 0;
        
        if (result) {
            trangthai = result.trangthai === 'DaNop' ? 'Đã nộp' : (result.trangthai === 'ViPham' ? 'Vi phạm' : 'Đang làm');
            if (result.ghichu && result.ghichu.includes("lần")) {
                const match = result.ghichu.match(/\d+/);
                if (match) chuyentab = parseInt(match[0]);
            }
        }

        return {
            masv: s.sinhvien.masv,
            tensv: s.sinhvien.hoten,
            trangthai,
            tiendo: result ? (result.trangthai === 'DaNop' ? 'Hoàn thành' : 'Đang làm') : "0%",
            phantram: result && result.trangthai === 'DaNop' ? 100 : 0,
            chuyentab,
            diemtong: result?.diemtong || null,
        };
    });

    return NextResponse.json({ success: true, data: { students } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Lỗi server" },
      { status: 500 }
    );
  }
}
