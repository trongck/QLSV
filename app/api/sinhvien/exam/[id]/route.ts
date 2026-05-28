// app/api/sinhvien/exam/[id]/route.ts
<<<<<<< Updated upstream:app/api/sinhvien/exam/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { examRepo } from '@/services/repositories/sinhvien/exam.repo';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';
=======
import { NextRequest, NextResponse } from "next/server";
import { examService } from "@/services/service/sinhvien/exam.service";
import { sinhVienService } from "@/services/service/sinhvien/student.service";
>>>>>>> Stashed changes:app/api/student/exam/[id]/route.ts
import { verifyToken, extractBearer } from "@/lib/utils/jwt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
<<<<<<< Updated upstream:app/api/sinhvien/exam/[id]/route.ts
    try {
        const { id } = await params;
        const { data, error } = await examRepo.getExamDetail(parseInt(id));

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
=======
  try {
    const { id } = await params;
    const data = await examService.getExamDetail(parseInt(id));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
>>>>>>> Stashed changes:app/api/student/exam/[id]/route.ts
    }

    let payload: any;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc đã hết hạn." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, answeredCount, cheatCount } = body;

    if (!["START", "PROGRESS"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Yêu cầu không hợp lệ." },
        { status: 400 },
      );
    }

    const sinhvien = await sinhVienService.getBasicInfo(payload.mataikhoan);
    const data = await examService.updateExamSession(
      sinhvien.masv,
      parseInt(id),
      {
        startEvent: action === "START",
        answeredCount:
          typeof answeredCount === "number" ? answeredCount : undefined,
        cheatCount: typeof cheatCount === "number" ? cheatCount : undefined,
      },
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
<<<<<<< Updated upstream:app/api/sinhvien/exam/[id]/route.ts
    try {
        const token = extractBearer(request.headers.get("authorization"));
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Xác thực JWT
        let payload;
        try {
            payload = await verifyToken(token);
        } catch {
            return NextResponse.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { answers } = body;

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Tìm masv từ mataikhoan
        const { data: sinhvien } = await supabase
            .from('sinhvien')
            .select('masv')
            .eq('mataikhoan', payload.mataikhoan)
            .single();

        if (!sinhvien) {
            return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
        }

        const { data, error } = await examRepo.submitExam(sinhvien.masv, parseInt(id), answers);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
=======
  try {
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
>>>>>>> Stashed changes:app/api/student/exam/[id]/route.ts
    }

    // Xác thực JWT
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc đã hết hạn." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { answers, cheatCount } = body;

    // Tìm masv từ mataikhoan qua sinhVienService
    const sinhvien = await sinhVienService.getBasicInfo(payload.mataikhoan);

    // Gọi examService
    const data = await examService.submitExam(
      sinhvien.masv,
      parseInt(id),
      answers,
      cheatCount,
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
