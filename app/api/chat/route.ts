// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

const STUDENT_SYSTEM_INSTRUCTION = `trả lời các câu hỏi liên quan đến học tập, và các câu hỏi liên quan đến trường học của sinh viên, có thể báo cáo được lịch học,

Nhiệm vụ của bạn:
- Hỗ trợ sinh viên tra cứu thông tin học tập: điểm số, lịch học, lịch thi, thời khóa biểu
- Giải đáp thắc mắc về quy chế học tập, quy định của nhà trường
- Hướng dẫn sử dụng các tính năng trong hệ thống QLSV (điểm danh, xem lịch, thông báo,...)
- Hỗ trợ giải bài tập, học thuật ở mức độ gợi ý
- Tư vấn định hướng học tập và kỹ năng mềm cho sinh viên

Các tính năng hệ thống QLSV bạn biết:
- Trang Dashboard: Tổng quan tình trạng học tập
- Lịch học: Xem thời khóa biểu theo tuần/kỳ
- Điểm danh: Điểm danh bằng QR Code hoặc nhận diện khuôn mặt
- Điểm số: Xem bảng điểm theo học kỳ
- Thông báo: Nhận thông báo từ giảng viên và nhà trường
- Bài tập: Xem và nộp bài tập
- Ghi chú: Tạo và quản lý ghi chú cá nhân

Phong cách giao tiếp:
- Thân thiện, nhiệt tình, dùng ngôn ngữ phù hợp với sinh viên
- Trả lời súc tích nhưng đầy đủ thông tin
- Dùng emoji phù hợp để tạo cảm giác gần gũi
- Nếu không biết thông tin cụ thể của sinh viên (như điểm số cụ thể), hãy hướng dẫn họ xem trên hệ thống
- Luôn trả lời bằng tiếng Việt trừ khi được yêu cầu khác`;

const TEACHER_SYSTEM_INSTRUCTION = `Bạn là Trợ lý Giảng viên Trí tuệ nhân tạo (AI Copilot) của hệ thống quản lý sinh viên (QLSV).

Nhiệm vụ của bạn:
- Hỗ trợ giảng viên soạn đề kiểm tra, soạn giáo án, câu hỏi ôn tập (trắc nghiệm/tự luận ngắn).
- Phân tích phổ điểm thi, kết quả học tập của lớp và đề xuất giải pháp cải thiện chất lượng giảng dạy.
- Đưa ra cảnh báo rủi ro học vụ (ví dụ: phát hiện sinh viên vắng nhiều, điểm thấp, có nguy cơ trượt môn).
- Tóm tắt giáo trình, bài giảng, tài liệu tham khảo khoa học.
- Tư vấn các phương pháp sư phạm, gợi ý tài liệu học tập bổ sung cho môn học.

Phong cách giao tiếp:
- Chuyên nghiệp, lịch sự, tôn trọng giảng viên, hỗ trợ đắc lực và súc tích.
- Dùng emoji phù hợp để tăng tính tương tác nhưng vẫn giữ sự nghiêm túc sư phạm.
- Luôn trả lời bằng tiếng Việt trừ khi được giảng viên yêu cầu khác.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userName } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Tin nhắn không hợp lệ" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
    }

    // Xác định vai trò từ token gửi kèm trong header
    const token = extractBearer(req.headers.get("authorization"));
    let systemInstruction = STUDENT_SYSTEM_INSTRUCTION;
    let actualUserName = userName;

    if (token) {
      try {
        const payload = await verifyToken(token) as any;
        if (payload.vaitro === VaiTro.GiangVien) {
          systemInstruction = TEACHER_SYSTEM_INSTRUCTION;
        }
        if (payload.hoten && !actualUserName) {
          actualUserName = payload.hoten;
        }
      } catch (err) {
        console.warn("Không thể giải mã hoặc token hết hạn trong API chat:", err);
      }
    }

    // Khởi tạo bên trong handler để luôn đọc env mới nhất
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemInstruction,
    });

    // Chuyển đổi history sang định dạng Gemini
    const formattedHistory = Array.isArray(history)
      ? history
        .filter((msg: any) => msg.role && msg.parts?.[0]?.text)
        .map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.parts[0].text }],
        }))
      : [];

    // Đảm bảo history hợp lệ: phải bắt đầu bằng "user" nếu có
    const safeHistory =
      formattedHistory.length > 0 && formattedHistory[0].role === "model"
        ? formattedHistory.slice(1)
        : formattedHistory;

    const chat = model.startChat({
      history: safeHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const contextualMessage = actualUserName
      ? `[Họ tên: ${actualUserName}] ${message}`
      : message;

    const result = await chat.sendMessage(contextualMessage);
    const text = result.response.text();

    return NextResponse.json({ text }, { status: 200 });
  } catch (error: any) {
    // Log lỗi chi tiết để debug
    console.error("[AI Chat Error]", error?.message ?? error);

    const msg: string = error?.message ?? "";
    const isKeyError =
      msg.includes("API_KEY") ||
      msg.includes("API key") ||
      msg.includes("403") ||
      msg.includes("PERMISSION_DENIED") ||
      msg.includes("invalid");

    const isQuotaError =
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("Quota") ||
      msg.includes("limit") ||
      msg.includes("Limit");

    const isModelError =
      !isQuotaError &&
      (msg.includes("not found") ||
        msg.includes("404") ||
        msg.includes("models/"));

    let friendlyError = "Không thể kết nối AI lúc này. Vui lòng thử lại sau.";
    if (isKeyError) friendlyError = "API key Gemini không hợp lệ. Vui lòng kiểm tra lại.";
    else if (isQuotaError) friendlyError = "Tài khoản AI đang quá tải hoặc hết hạn ngạch. Vui lòng thử lại sau ít phút!";
    else if (isModelError) friendlyError = "Model AI không khả dụng. Đang thử model dự phòng.";

    return NextResponse.json({ error: friendlyError }, { status: 500 });
  }
}
