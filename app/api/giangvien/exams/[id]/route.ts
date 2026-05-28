import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 },
    );
  }

  try {
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv, error: gvErr } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (gvErr || !gv) {
      return NextResponse.json(
        { error: "Không tìm thấy giảng viên" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const madethi = Number(id);
    if (isNaN(madethi)) {
      return NextResponse.json(
        { error: "ID đề thi không hợp lệ" },
        { status: 400 },
      );
    }

    const { data: exam, error: examErr } = await supabase
      .from("dethi")
      .select(
        "madethi, maphancong, tieude, mota, thoigianlam, thoigianbatdau, thoigianketthuc, matkhau",
      )
      .eq("madethi", madethi)
      .single();

    if (examErr || !exam) {
      return NextResponse.json(
        { error: "Không tìm thấy ca thi" },
        { status: 404 },
      );
    }

    const { data: pcCheck, error: pcErr } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", exam.maphancong)
      .eq("magv", gv.magv)
      .single();

    if (pcErr || !pcCheck) {
      return NextResponse.json(
        { error: "Không có quyền truy cập ca thi này" },
        { status: 403 },
      );
    }

    const [studentsRes, questionCountRes, resultsRes] = await Promise.all([
      supabase
        .from("sinhvienmonhoc")
        .select("masv, sinhvien:masv(hodem, ten)")
        .eq("maphancong", exam.maphancong)
        .eq("trangthai", "Danghoc"),
      supabase
        .from("cauhoi")
        .select("macauhoi", { count: "exact", head: true })
        .eq("madethi", madethi),
      supabase
        .from("ketquathi")
        .select(
          "masv, trangthai, diemtong, socandung, ghichu, thoigianvaothi, thoigiannopbai",
        )
        .eq("madethi", madethi),
    ]);

    if (studentsRes.error) {
      return NextResponse.json(
        {
          error:
            studentsRes.error.message || "Không lấy được danh sách sinh viên",
        },
        { status: 500 },
      );
    }
    if (questionCountRes.error) {
      console.warn(
        "Không lấy được số lượng câu hỏi của đề thi",
        questionCountRes.error,
      );
    }
    if (resultsRes.error) {
      return NextResponse.json(
        { error: resultsRes.error.message || "Không lấy được kết quả thi" },
        { status: 500 },
      );
    }

    const totalQuestions = questionCountRes.count ?? 0;

    const parseSessionMeta = (ghichu: string | null | undefined) => {
      if (!ghichu) return { starts: 0, cheat: 0, answered: 0 };
      try {
        const parsed = JSON.parse(ghichu);
        if (typeof parsed === "object" && parsed !== null) {
          return {
            starts: Number(parsed.starts ?? 0),
            cheat: Number(parsed.cheat ?? 0),
            answered: Number(parsed.answered ?? 0),
          };
        }
      } catch {
        // ignore
      }

      const match = ghichu.match(/(\d+)\s*lần/);
      return { starts: 0, cheat: match ? Number(match[1]) : 0, answered: 0 };
    };

    const students = (studentsRes.data ?? []).map((item: any) => {
      const result = (resultsRes.data ?? []).find(
        (r: any) => r.masv === item.masv,
      );
      const status = result ? result.trangthai : "ChuaLam";
      const tensv =
        `${item.sinhvien?.hodem || ""} ${item.sinhvien?.ten || ""}`.trim() ||
        item.masv;
      const meta = parseSessionMeta(result?.ghichu);
      const answeredQuestions = result
        ? meta.answered || (status !== "ChuaLam" ? totalQuestions : 0)
        : 0;
      const progress =
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : result
            ? 100
            : 0;
      return {
        masv: item.masv,
        tensv,
        trangthai: status,
        tiendo: `${progress}%`,
        phantram: progress,
        chuyentab: meta.cheat,
        starts: result ? Math.max(meta.starts, 1) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: { ...exam, ketquathi: students },
    });
  } catch (err: any) {
    console.error("Error GET /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi tải dữ liệu giám sát" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 },
    );
  }

  try {
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!gv) {
      return NextResponse.json(
        { error: "Không tìm thấy giảng viên" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const madethi = Number(id);

    if (isNaN(madethi)) {
      return NextResponse.json(
        { error: "ID đề thi không hợp lệ" },
        { status: 400 },
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action") as string;

      if (action === "UPDATE_EXAM") {
        const maphancong = Number(formData.get("maphancong"));
        const tieude = formData.get("tieude") as string;
        const mota = formData.get("mota") as string;
        const thoigianlam = Number(formData.get("thoigianlam"));
        const thoigianbatdau = formData.get("thoigianbatdau") as string;
        const thoigianketthuc = formData.get("thoigianketthuc") as string;
        const matkhau = formData.get("matkhau") as string;
        const file = formData.get("file") as File | null;

        if (
          !maphancong ||
          !tieude ||
          !thoigianlam ||
          !thoigianbatdau ||
          !thoigianketthuc
        ) {
          return NextResponse.json(
            { error: "Thiếu thông tin bắt buộc" },
            { status: 400 },
          );
        }

        let parsedQuestions: any[] | undefined = undefined;

        if (file && file.size > 0) {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          let textToParse = "";
          let inlineDataPart: any = null;
          const fileExtension = file.name.split(".").pop()?.toLowerCase();

          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY || "",
          );
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    noidung: { type: "STRING" },
                    diem: { type: "NUMBER" },
                    dapan: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          noidung: { type: "STRING" },
                          ladapandung: { type: "BOOLEAN" },
                        },
                        required: ["noidung", "ladapandung"],
                      },
                    },
                  },
                  required: ["noidung", "dapan"],
                },
              } as any,
            },
          });

          if (fileExtension === "docx" || fileExtension === "doc") {
            const fs = await import("fs");
            const path = await import("path");
            const { execSync } = await import("child_process");

            const tempDir = path.join(process.cwd(), "scratch");
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFilePath = path.join(
              tempDir,
              `temp_edit_${Date.now()}.${fileExtension}`,
            );
            fs.writeFileSync(tempFilePath, fileBuffer);

            try {
              textToParse = execSync(
                `/usr/bin/textutil -convert txt -stdout "${tempFilePath}"`,
              ).toString("utf-8");
            } catch (err: any) {
              console.error("Lỗi chạy textutil:", err.message);
              throw new Error(
                "Không thể trích xuất văn bản từ tệp Word. Hãy chắc chắn rằng tệp không bị lỗi.",
              );
            } finally {
              if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
          } else if (fileExtension === "pdf") {
            inlineDataPart = {
              inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: "application/pdf",
              },
            };
          } else {
            textToParse = fileBuffer.toString("utf-8");
          }

          const prompt =
            "Hãy đọc tài liệu kiểm tra này và trích xuất ra toàn bộ danh sách câu hỏi trắc nghiệm cùng đáp án. Mỗi câu hỏi cần ghi nhận rõ đáp án đúng (ladapandung: true). Điểm mặc định cho mỗi câu là 0.2 nếu không được chỉ rõ.";
          let resultText = "";
          if (inlineDataPart) {
            const result = await model.generateContent([
              inlineDataPart,
              prompt,
            ]);
            resultText = result.response.text();
          } else {
            const result = await model.generateContent([textToParse, prompt]);
            resultText = result.response.text();
          }

          parsedQuestions = JSON.parse(resultText);
        }

        await giangVienService.updateExamFull(
          gv.magv,
          madethi,
          {
            maphancong,
            tieude,
            mota: mota || "",
            thoigianlam,
            thoigianbatdau,
            thoigianketthuc,
            matkhau: matkhau || "",
          },
          parsedQuestions,
        );

        return NextResponse.json({
          success: true,
          message: "Cập nhật đề thi thành công",
        });
      }
    } else {
      const body = await request.json();
      if (body.action === "END_EXAM") {
        await giangVienService.endExam(gv.magv, madethi);
        return NextResponse.json({
          success: true,
          message: "Đã kết thúc ca thi",
        });
      }

      if (body.action === "UPDATE_TIME") {
        const { thoigianlam, thoigianbatdau, thoigianketthuc } = body;
        if (!thoigianlam || !thoigianbatdau || !thoigianketthuc) {
          return NextResponse.json(
            { error: "Thiếu thông tin thời gian" },
            { status: 400 },
          );
        }
        await giangVienService.updateExamTime(gv.magv, madethi, {
          thoigianlam: Number(thoigianlam),
          thoigianbatdau,
          thoigianketthuc,
        });
        return NextResponse.json({
          success: true,
          message: "Cập nhật thời gian thi thành công",
        });
      }
    }

    return NextResponse.json(
      { error: "Hành động không được hỗ trợ" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật ca thi" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const madethi = Number(id);

    if (isNaN(madethi)) {
      return NextResponse.json({ error: "ID đề thi không hợp lệ" }, { status: 400 });
    }

<<<<<<< Updated upstream
    const body = await request.json();
    if (body.action === "END_EXAM") {
      await giangVienService.endExam(gv.magv, madethi);
      return NextResponse.json({ success: true, message: "Đã kết thúc ca thi" });
    }

    if (body.action === "UPDATE_TIME") {
      const { thoigianlam, thoigianbatdau, thoigianketthuc } = body;
      if (!thoigianlam || !thoigianbatdau || !thoigianketthuc) {
        return NextResponse.json({ error: "Thiếu thông tin thời gian" }, { status: 400 });
=======
    const { data: exam, error: examErr } = await supabase
      .from("dethi")
      .select("madethi, maphancong")
      .eq("madethi", madethi)
      .single();

    if (examErr || !exam) {
      return NextResponse.json({ error: "Không tìm thấy ca thi" }, { status: 404 });
    }

    const { data: pcCheck, error: pcErr } = await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", exam.maphancong)
      .eq("magv", gv.magv)
      .single();

    if (pcErr || !pcCheck) {
      return NextResponse.json({ error: "Không có quyền truy cập ca thi này" }, { status: 403 });
    }

    // Lấy danh sách maketqua của ca thi này
    const { data: ketquaData, error: ketquaGetErr } = await supabase
      .from("ketquathi")
      .select("maketqua")
      .eq("madethi", madethi);

    if (ketquaGetErr) {
      console.warn("Lỗi lấy kết quả thi:", ketquaGetErr);
    }

    const maketquaList = (ketquaData || []).map((k: any) => k.maketqua);

    // Xóa chi tiết bài làm trước
    if (maketquaList.length > 0) {
      const { error: chitietErr } = await supabase
        .from("chitietbailam")
        .delete()
        .in("maketqua", maketquaList);

      if (chitietErr) {
        console.warn("Lỗi xóa chi tiết bài làm:", chitietErr);
>>>>>>> Stashed changes
      }
      await giangVienService.updateExamTime(gv.magv, madethi, {
        thoigianlam: Number(thoigianlam),
        thoigianbatdau,
        thoigianketthuc
      });
      return NextResponse.json({ success: true, message: "Cập nhật thời gian thi thành công" });
    }

    // Xóa kết quả thi
    const { error: ketquaErr } = await supabase
      .from("ketquathi")
      .delete()
      .eq("madethi", madethi);

    if (ketquaErr) {
      console.warn("Lỗi xóa kết quả thi:", ketquaErr);
    }

    // Xóa câu hỏi
    const { error: cauhoiErr } = await supabase
      .from("cauhoi")
      .delete()
      .eq("madethi", madethi);

    if (cauhoiErr) {
      console.warn("Lỗi xóa câu hỏi:", cauhoiErr);
    }

    // Xóa ca thi
    const { error: deleteErr } = await supabase
      .from("dethi")
      .delete()
      .eq("madethi", madethi);

    if (deleteErr) {
      return NextResponse.json(
        { error: deleteErr.message || "Không thể xóa ca thi" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ca thi đã được kết thúc thành công",
    });
  } catch (err: any) {
    console.error("Lỗi DELETE /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi kết thúc ca thi" },
      { status: 500 },
    );
  }
}
