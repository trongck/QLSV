import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

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

    const gv = await giangVienService.getMyProfile(payload.mataikhoan);

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
    const gv = await giangVienService.getMyProfile(payload.mataikhoan);

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
    
    const getModelInstance = (modelName: string) => {
      return genAI.getGenerativeModel({
        model: modelName,
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
    };

    if (fileExtension === "docx") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        textToParse = result.value;
      } catch (err: any) {
        console.error("Lỗi parse docx bằng mammoth:", err);
        throw new Error("Không thể trích xuất văn bản từ tệp Word (.docx). Hãy chắc chắn rằng tệp không bị lỗi.");
      }
    } else if (fileExtension === "doc") {
      throw new Error("Hệ thống chỉ hỗ trợ tệp Word định dạng mới (.docx). Vui lòng chuyển đổi tệp .doc của bạn sang .docx và thử lại.");
    } else if (fileExtension === "pdf") {
      // Đưa trực tiếp PDF base64 cho Gemini xử lý
      inlineDataPart = {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: "application/pdf"
        }
      };
    } else if (["png", "jpg", "jpeg", "webp"].includes(fileExtension || "")) {
      const mimeMap: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp"
      };
      inlineDataPart = {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: mimeMap[fileExtension || ""] || "image/jpeg"
        }
      };
    } else {
      // Fallback cho file text
      textToParse = fileBuffer.toString("utf-8");
    }

    const prompt = "Hãy đọc tài liệu kiểm tra này và trích xuất ra toàn bộ danh sách câu hỏi trắc nghiệm cùng đáp án. Mỗi câu hỏi cần ghi nhận rõ đáp án đúng (ladapandung: true). Điểm mặc định cho mỗi câu là 0.2 nếu không được chỉ rõ.";

    // Danh sách model fallback theo thứ tự ưu tiên
    const MODEL_FALLBACK_LIST = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let resultText = "";
    let lastError: any = null;

    for (const modelName of MODEL_FALLBACK_LIST) {
      try {
        console.log(`[Exams] Đang thử model: ${modelName}`);
        const model = getModelInstance(modelName);
        let result;
        if (inlineDataPart) {
          result = await model.generateContent([inlineDataPart, prompt]);
        } else {
          result = await model.generateContent([textToParse, prompt]);
        }
        resultText = result.response.text();
        console.log(`[Exams] Thành công với model: ${modelName}`);
        break; // Thành công, thoát vòng lặp
      } catch (err: any) {
        lastError = err;
        console.warn(`[Exams] Model ${modelName} thất bại: ${err.message}`);
        // Chờ 2 giây trước khi thử model tiếp theo
        await sleep(2000);
      }
    }

    if (!resultText) {
      console.error("[Exams] Tất cả model đều thất bại:", lastError?.message);
      throw new Error("Dịch vụ phân tích đề thi bằng AI tạm thời không khả dụng. Vui lòng thử lại sau ít phút.");
    }

    const parsedQuestions = JSON.parse(resultText);

    const createdExam = await giangVienService.createExamAndNotify(gv.magv, payload.mataikhoan, {
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
