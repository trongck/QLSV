// app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Khởi tạo AI với key từ file .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Sử dụng model gemini-1.5-flash (nhanh và miễn phí)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Bạn là trợ lý giảng viên đại học. Hãy trả lời câu hỏi: ${message}`
    );
    
    const response = await result.response;
    return NextResponse.json({ text: response.text() });
    
  } catch (error) {
    console.error("Lỗi AI:", error);
    return NextResponse.json({ error: "Không kết nối được với Gemini AI" }, { status: 500 });
  }
}