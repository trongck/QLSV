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

// ─── GET /api/student/diary/[id] ─────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  try {
    const svData = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const data = await nhatkyService.getById(manhatky, svData.masv);
    return NextResponse.json({ data });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// ─── PATCH /api/student/diary/[id] ───────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const dto: any = {};
  if ("tieude" in body) dto.tieude = body.tieude?.trim() || null;
  if ("noidung" in body) dto.noidung = body.noidung?.trim();
  if ("tamtrang" in body) dto.tamtrang = body.tamtrang;

  if (dto.noidung !== undefined && !dto.noidung) {
    return NextResponse.json({ error: "Nội dung không được để trống." }, { status: 400 });
  }

  try {
    const svData = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const tenSinhVien = [svData.hodem, svData.ten].filter(Boolean).join(" ") || "Sinh viên";

    // getById will check ownership and throw if not found/unauthorized
    await nhatkyService.getById(manhatky, svData.masv);

    const data = await nhatkyService.update(
      manhatky,
      svData.masv,
      dto,
      {
        mataikhoan: payload.mataikhoan,
        tenSinhVien,
        request,
      }
    );

    return NextResponse.json({ data });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// ─── DELETE /api/student/diary/[id] ──────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  try {
    const svData = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const tenSinhVien = [svData.hodem, svData.ten].filter(Boolean).join(" ") || "Sinh viên";

    // getById will check ownership
    await nhatkyService.getById(manhatky, svData.masv);

    await nhatkyService.delete(
      manhatky,
      svData.masv,
      {
        mataikhoan: payload.mataikhoan,
        tenSinhVien,
        request,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}