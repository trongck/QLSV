import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";
import { examRepo } from "@/services/repositories/giangvien/exam.repo";

export async function GET(
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
    const gv = await giangVienService.getMyProfile(payload.mataikhoan);
    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const madethi = Number(id);
    if (isNaN(madethi)) {
      return NextResponse.json({ error: "ID đề thi không hợp lệ" }, { status: 400 });
    }

    // Trả về monitoring data (danh sách SV + trạng thái)
    const data = await giangVienService.getExamMonitoringData(gv.magv, madethi);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy dữ liệu giám sát" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const gv = await giangVienService.getMyProfile(payload.mataikhoan);

    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const madethi = Number(id);

    if (isNaN(madethi)) {
      return NextResponse.json({ error: "ID đề thi không hợp lệ" }, { status: 400 });
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

        if (!maphancong || !tieude || !thoigianlam || !thoigianbatdau || !thoigianketthuc) {
          return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        let parsedQuestions: any[] | undefined = undefined;

        if (file && file.size > 0) {
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
            textToParse = fileBuffer.toString("utf-8");
          }

          const prompt = "Hãy đọc tài liệu kiểm tra này và trích xuất ra toàn bộ danh sách câu hỏi trắc nghiệm cùng đáp án. Mỗi câu hỏi cần ghi nhận rõ đáp án đúng (ladapandung: true). Điểm mặc định cho mỗi câu là 0.2 nếu không được chỉ rõ.";
          let resultText = "";
          try {
            const model = getModelInstance("gemini-2.5-flash");
            let result;
            if (inlineDataPart) {
              result = await model.generateContent([inlineDataPart, prompt]);
            } else {
              result = await model.generateContent([textToParse, prompt]);
            }
            resultText = result.response.text();
          } catch (err: any) {
            console.warn("Lỗi khi dùng gemini-2.5-flash, thử chuyển sang gemini-1.5-flash:", err.message);
            try {
              const modelFallback = getModelInstance("gemini-1.5-flash");
              let result;
              if (inlineDataPart) {
                result = await modelFallback.generateContent([inlineDataPart, prompt]);
              } else {
                result = await modelFallback.generateContent([textToParse, prompt]);
              }
              resultText = result.response.text();
            } catch (fallbackErr: any) {
              console.error("Lỗi cả model fallback gemini-1.5-flash:", fallbackErr.message);
              throw new Error("Dịch vụ phân tích đề thi bằng AI đang quá tải (Lỗi 503). Vui lòng thử lại sau vài giây.");
            }
          }

          parsedQuestions = JSON.parse(resultText);
        }

        await giangVienService.updateExamFull(
          gv.magv, 
          madethi, 
          { maphancong, tieude, mota: mota || "", thoigianlam, thoigianbatdau, thoigianketthuc, matkhau: matkhau || "" },
          parsedQuestions
        );

        return NextResponse.json({ success: true, message: "Cập nhật đề thi thành công" });
      }
    } else {
      const body = await request.json();

      if (body.action === "END_EXAM") {
        await giangVienService.endExam(gv.magv, madethi);
        return NextResponse.json({ success: true, message: "Đã kết thúc ca thi" });
      }

      if (body.action === "FORCE_END") {
        const lydo = body.lydo as string;
        await giangVienService.forceEndExam(gv.magv, madethi);
        
        // Cập nhật lý do kết thúc vào mô tả đề thi
        if (lydo) {
          const { data: examInfo } = await examRepo.getExamCheck(madethi);
          if (examInfo) {
            const { data: fullExam } = await examRepo.getExamWithPhanCong(madethi);
            if (fullExam) {
              const currentMota = (fullExam as any).mota || "";
              const updatedMota = currentMota + `\n\n[ĐÃ KẾT THÚC KHẨN CẤP. Lý do: ${lydo}]`;
              await examRepo.updateExamInfo(madethi, { mota: updatedMota });
            }
          }
        }
        
        return NextResponse.json({ success: true, message: "Đã kết thúc ca thi ngay lập tức" });
      }

      if (body.action === "UPDATE_TIME") {
        const { thoigianlam, thoigianbatdau, thoigianketthuc } = body;
        if (!thoigianlam || !thoigianbatdau || !thoigianketthuc) {
          return NextResponse.json({ error: "Thiếu thông tin thời gian" }, { status: 400 });
        }
        await giangVienService.updateExamTime(gv.magv, madethi, {
          thoigianlam: Number(thoigianlam),
          thoigianbatdau,
          thoigianketthuc
        });
        return NextResponse.json({ success: true, message: "Cập nhật thời gian thi thành công" });
      }
    }

    return NextResponse.json({ error: "Hành động không được hỗ trợ" }, { status: 400 });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật ca thi" },
      { status: 500 }
    );
  }
}
