import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;

    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

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

    const exams = await giangVienService.getExams(gv.magv);

    return NextResponse.json({ success: true, data: exams });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const maphancong = Number(formData.get("maphancong"));
    const tieude = formData.get("tieude") as string;
    const mota = formData.get("mota") as string;
    const thoigianlam = Number(formData.get("thoigianlam"));
    const thoigianbatdau = formData.get("thoigianbatdau") as string;
    const thoigianketthuc = formData.get("thoigianketthuc") as string;
    const matkhau = formData.get("matkhau") as string;
    const file = formData.get("file") as File;

    if (!maphancong || !tieude || !thoigianlam || !thoigianbatdau || !thoigianketthuc || !file) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let textToParse = "";
    let inlineDataPart: any = null;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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
                    ladapandung: { type: "BOOLEAN" }
                  },
                  required: ["noidung", "ladapandung"]
                }
              }
            },
            required: ["noidung", "dapan"]
          }
        } as any
      }
    });

    if (fileExtension === "docx" || fileExtension === "doc") {
      // Dùng textutil của macos để chuyển docx -> txt
      const fs = await import("fs");
      const path = await import("path");
      const { execSync } = await import("child_process");

      const tempDir = path.join(process.cwd(), "scratch");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `temp_upload_${Date.now()}.${fileExtension}`);
      fs.writeFileSync(tempFilePath, fileBuffer);

      try {
        textToParse = execSync(`/usr/bin/textutil -convert txt -stdout "${tempFilePath}"`).toString("utf-8");
      } catch (err: any) {
        console.error("Lỗi chạy textutil:", err.message);
        throw new Error("Không thể trích xuất văn bản từ tệp Word. Hãy chắc chắn rằng tệp không bị lỗi.");
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } else if (fileExtension === "pdf") {
      // Đưa trực tiếp PDF base64 cho Gemini xử lý
      inlineDataPart = {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: "application/pdf"
        }
      };
    } else {
      // Fallback cho file text
      textToParse = fileBuffer.toString("utf-8");
    }

    const prompt = "Hãy đọc tài liệu kiểm tra này và trích xuất ra toàn bộ danh sách câu hỏi trắc nghiệm cùng đáp án. Mỗi câu hỏi cần ghi nhận rõ đáp án đúng (ladapandung: true). Điểm mặc định cho mỗi câu là 0.2 nếu không được chỉ rõ.";
    
    let resultText = "";
    if (inlineDataPart) {
      const result = await model.generateContent([inlineDataPart, prompt]);
      resultText = result.response.text();
    } else {
      const result = await model.generateContent([textToParse, prompt]);
      resultText = result.response.text();
    }

    const parsedQuestions = JSON.parse(resultText);

    const createdExam = await giangVienService.createExamWithQuestions(gv.magv, {
      maphancong,
      tieude,
      mota: mota || "",
      thoigianlam,
      thoigianbatdau,
      thoigianketthuc,
      matkhau: matkhau || ""
    }, parsedQuestions);

    return NextResponse.json({ success: true, data: createdExam, message: "Tạo đề thi mới thành công" });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo đề thi từ tài liệu" },
      { status: 500 }
    );
  }
}
