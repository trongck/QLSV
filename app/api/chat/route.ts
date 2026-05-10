import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Khởi tạo Gemini với API Key (Lấy tại Google AI Studio)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Tạo luồng chat với lịch sử để AI nhớ được ngữ cảnh trước đó
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 500 },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    return NextResponse.json({ text: response.text() });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi kết nối AI" }, { status: 500 });
  }
}
