"use client";
import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";

export const ChatAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false); // Quản lý đóng/mở
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Khởi tạo danh sách tin nhắn với lời chào từ AI
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [
        { text: "Chào An, mình là AI hỗ trợ học viên. Bạn cần giúp gì không?" },
      ],
    },
  ]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Gọi API Route bạn đã tạo tại app/api/chat/route.ts
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: messages.slice(-6), // Gửi lịch sử ngắn để AI nhớ ngữ cảnh
        }),
      });

      const data = await response.json();

      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "model", parts: [{ text: data.text }] },
        ]);
      } else {
        throw new Error("Không có phản hồi");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [
            {
              text: "Rất tiếc, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé!",
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trạng thái nút tròn ban đầu
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 animate-bounce-subtle"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  // Trạng thái khung chat hoạt động
  return (
    <div className="fixed bottom-5 right-5 w-80 bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col z-50 animate-in fade-in zoom-in duration-300">
      {/* Header - Bấm X để quay về nút tròn */}
      <div className="bg-red-600 p-4 text-white flex justify-between items-center font-bold">
        <span>AI hỗ trợ học viên</span>
        <X
          size={18}
          className="cursor-pointer hover:bg-red-700 rounded-full transition-colors"
          onClick={() => setIsOpen(false)}
        />
      </div>

      {/* Danh sách tin nhắn */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-red-500 text-white rounded-tr-none shadow-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-3 py-2 rounded-full text-[10px] animate-pulse">
              AI đang soạn tin nhắn...
            </div>
          </div>
        )}
      </div>

      {/* Input gửi câu hỏi */}
      <div className="p-3 border-t bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Bạn cần hỏi gì về học tập?"
          className="flex-1 text-sm outline-none border border-gray-200 p-2 rounded-xl focus:border-red-500 transition-colors"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors shadow-lg shadow-red-100"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
