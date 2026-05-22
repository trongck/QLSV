import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";
import { nhatkyService } from "@/services/service/sinhvien/nhatky.service";

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

// ─── GET /api/student/diary ───────────────────────────────────────────────────
// Trả về danh sách nhật ký của sinh viên đang đăng nhập.

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  try {
    // Lấy masv theo tài khoản qua sinhVienService
    const svData = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const { masv } = svData;

    const { data, count } = await nhatkyService.getPaged({
      masv,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      data,
      masv,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// ─── POST /api/student/diary ──────────────────────────────────────────────────
// Tạo nhật ký mới.

export async function POST(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const { tieude, noidung, tamtrang, maphancong } = body;

  try {
    // Lấy thêm thông tin từ sinhVienService
    const svData = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const tenSinhVien = [svData.hodem, svData.ten].filter(Boolean).join(" ") || "Sinh viên";

    const data = await nhatkyService.create(
      svData.masv,
      {
        tieude: tieude?.trim() || null,
        noidung: typeof noidung === "string" ? noidung.trim() : "",
        tamtrang: tamtrang ?? null,
        maphancong: maphancong ?? null,
      },
      {
        mataikhoan: payload.mataikhoan,
        tenSinhVien,
        request,
      }
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}