"use client"; // Bắt buộc phải có dòng này để sử dụng useState trong Next.js App Router

import React, { useState } from "react";
import {
  Search,
  Edit3,
  Phone,
  Video,
  Info,
  Paperclip,
  Send,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
} from "lucide-react";

// 1. DỮ LIỆU DANH SÁCH NGƯỜI NHẮN TIN
const chatList = [
  {
    id: 1,
    name: "Nguyễn Văn Minh",
    avatar: "NM",
    lastMsg: "Cảm ơn thầy rất nhiều ạ!",
    time: "10:30",
    unread: 2,
    role: "Sinh viên",
  },
  {
    id: 2,
    name: "Trần Thị Mai",
    avatar: "TM",
    lastMsg: "Mai: Oke An nhé!",
    time: "09:15",
    unread: 1,
    role: "Sinh viên",
  },
  {
    id: 3,
    name: "Thầy Lê Hoàng Nam",
    avatar: "LH",
    lastMsg: "Bài tập tuần sau nộp trước thứ 6.",
    time: "Hôm qua",
    unread: 0,
    role: "Giảng viên",
  },
  {
    id: 4,
    name: "Nhóm: CTDL & GT",
    avatar: "NH",
    lastMsg: "Minh: Mọi người xem tài liệu nhé",
    time: "Hôm qua",
    unread: 0,
    role: "Nhóm học tập",
  },
];

// 2. DỮ LIỆU TIN NHẮN RIÊNG BIỆT CHO TỪNG NGƯỜI
const allMessages: Record<number, any[]> = {
  1: [
    { id: 1, content: "Chào An 👋", time: "10:28", isMine: false },
    {
      id: 2,
      content: "Bạn có thể gửi mình tài liệu môn Cơ sở dữ liệu được không?",
      time: "10:28",
      isMine: false,
    },
    {
      id: 3,
      content: "Chào Minh! Mình có đây nè",
      time: "10:29",
      isMine: true,
    },
    {
      id: 4,
      type: "file",
      fileName: "CSDL_Notes_Chuong1-4.pdf",
      fileSize: "2.4 MB",
      time: "10:29",
      isMine: true,
    },
  ],
  2: [
    {
      id: 1,
      content: "An ơi, chiều nay có đi học không?",
      time: "08:30",
      isMine: false,
    },
    {
      id: 2,
      content: "Có chứ Mai, mình đi sớm 15p nhé",
      time: "08:35",
      isMine: true,
    },
    { id: 3, content: "Oke An nhé!", time: "09:15", isMine: false },
  ],
  3: [
    {
      id: 1,
      content: "Chào em, bài tập lớn nhóm em làm đến đâu rồi?",
      time: "Hôm qua",
      isMine: false,
    },
    {
      id: 2,
      content: "Dạ thưa thầy, nhóm em đang hoàn thiện phần Database ạ",
      time: "Hôm qua",
      isMine: true,
    },
    {
      id: 3,
      content: "Tốt, bài tập tuần sau nộp trước thứ 6 nhé.",
      time: "Hôm qua",
      isMine: false,
    },
  ],
  4: [
    {
      id: 1,
      content: "Mọi người ơi nộp slide ở đâu nhỉ?",
      time: "Hôm qua",
      isMine: false,
    },
    {
      id: 2,
      content: "Minh: Mọi người xem tài liệu ở file nhé, có link nộp trong đó",
      time: "Hôm qua",
      isMine: false,
    },
  ],
};

export default function MessagesPage() {
  // State quản lý ID người đang được chọn
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [inputText, setInputText] = useState("");

  // Lấy thông tin người được chọn và tin nhắn tương ứng
  const selectedChat =
    chatList.find((c) => c.id === selectedChatId) || chatList[0];
  const messages = allMessages[selectedChatId] || [];

  return (
    <div className="flex h-full bg-[#FDF8F6] overflow-hidden">
      {/* --- CỘT 1: DANH SÁCH CHAT --- */}
      <div className="w-[350px] flex flex-col bg-white border-r border-gray-100">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Tin nhắn</h1>
            <button className="p-2 bg-[#E57373] text-white rounded-lg hover:bg-[#d32f2f] transition">
              <Edit3 size={18} />
            </button>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-md border-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatList.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)} // SỰ KIỆN ĐỔI NGƯỜI
              className={`p-4 flex gap-3 items-center cursor-pointer hover:bg-gray-50 transition ${
                selectedChatId === chat.id
                  ? "bg-red-50 border-r-4 border-red-500"
                  : ""
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#FFDAB9] flex items-center justify-center text-[#E57373] font-bold flex-shrink-0">
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-gray-800 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-[10px] text-gray-400">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <p className="text-gray-500 truncate">{chat.lastMsg}</p>
                  {chat.unread > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 ml-2">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CỘT 2: NỘI DUNG CHAT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFDAB9] flex items-center justify-center text-[#E57373] font-bold">
              {selectedChat.avatar}
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-800">
                {selectedChat.name}
              </h2>
              <p className="text-[10px] text-green-500 font-medium">
                {selectedChat.role}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-gray-400">
            <Phone size={18} className="cursor-pointer hover:text-gray-600" />
            <Video size={18} className="cursor-pointer hover:text-gray-600" />
            <Info size={18} className="cursor-pointer hover:text-gray-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.isMine ? "items-end" : "items-start"} gap-1`}
            >
              {msg.type === "file" ? (
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
                  <div className="bg-red-500 p-2 rounded text-white font-bold text-[10px]">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {msg.fileName}
                    </p>
                    <p className="text-[10px] text-gray-400">{msg.fileSize}</p>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl text-sm max-w-[70%] shadow-sm ${
                    msg.isMine
                      ? "bg-[#E57373] text-white rounded-tr-none"
                      : "bg-white text-gray-700 rounded-tl-none border border-gray-50"
                  }`}
                >
                  {msg.content}
                </div>
              )}
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
            />
            <button className="p-2 bg-[#E57373] text-white rounded-lg">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CỘT 3: THÔNG TIN HỘI THOẠI --- */}
      <div className="w-[320px] bg-white border-l border-gray-100 p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-gray-800 mb-6">
          Thông tin hội thoại
        </h3>
        <div className="w-20 h-20 rounded-full bg-[#FFDAB9] flex items-center justify-center text-[#E57373] font-bold text-2xl shadow-inner mb-3">
          {selectedChat.avatar}
        </div>
        <h4 className="font-bold text-sm text-gray-800">{selectedChat.name}</h4>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
          {selectedChat.role}
        </p>

        <button className="w-full py-2 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 mb-8 hover:bg-gray-50 transition">
          Xem trang cá nhân
        </button>

        <div className="w-full space-y-4 pt-4 border-t border-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-800">
              Ảnh, tài liệu, link
            </span>
            <span className="text-[10px] text-red-500 font-bold cursor-pointer">
              Xem tất cả
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
              <ImageIcon size={20} className="text-gray-200" />
            </div>
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-red-200" />
            </div>
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">
              +8
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
