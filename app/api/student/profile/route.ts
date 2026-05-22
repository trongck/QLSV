import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";

// ─── GET /api/sinhvien/profile ────────────────────────────────────────────────

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;

    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const data = await sinhVienService.getMyProfile(payload.mataikhoan);
    if (!data) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ sinh viên" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }
}

// ─── PUT /api/sinhvien/profile ────────────────────────────────────────────────

export async function PUT(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Ủy quyền cho service — service sẽ validate và gọi repo
    await sinhVienService.updateProfile(payload.mataikhoan, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lỗi PUT /api/sinhvien/profile:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật hồ sơ" },
      { status: 400 }
    );
  }
}
