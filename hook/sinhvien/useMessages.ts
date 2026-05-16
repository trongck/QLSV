// hook/sinhvien/useMessages.ts
import { useState, useCallback } from 'react';

export const useMessages = () => {
    const [chatList, setChatList] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Giả lập user hiện tại đang đăng nhập (Lý Thị Kiều)
    const CURRENT_USER_ID = "SV22A005";

    // Hàm tạo Avatar từ tên
    const getAvatarText = (name: string) => {
        if (!name) return "UI";
        const words = name.trim().split(" ");
        if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    // 1. FETCH DANH SÁCH PHÒNG CHAT
    const fetchChatRooms = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sinhvien/chat-rooms');
            const result = await res.json();

            if (result.success && result.data) {
                // MAPPING DỮ LIỆU DB -> GIAO DIỆN
                const formattedList = result.data.map((room: any) => {
                    const isGroup = room.cuoctrochuyen.loai === 'NhomMon';
                    let chatName = "";
                    let chatRole = "";

                    if (isGroup) {
                        chatName = room.cuoctrochuyen.tieude || "Nhóm học tập";
                        chatRole = "Nhóm học tập";
                    } else {
                        // Tìm người đối diện trong cuộc hội thoại (không phải mình)
                        // Backend mới trả về thanhvientrochuyen lồng trong cuoctrochuyen
                        const participants = room.cuoctrochuyen.thanhvientrochuyen || [];
                        const otherPerson = participants.find((p: any) => p.masv !== CURRENT_USER_ID);

                        if (otherPerson?.giangvien) {
                            // Lấy tên thật từ bảng giảng viên đã JOIN
                            chatName = `Thầy ${otherPerson.giangvien.hoten}`;
                            chatRole = "Giảng viên";
                        } else if (otherPerson?.masv) {
                            chatName = `Sinh viên ${otherPerson.masv}`;
                            chatRole = "Sinh viên";
                        } else {
                            chatName = "Liên hệ: " + (otherPerson?.magv || "Người dùng");
                            chatRole = otherPerson?.magv ? "Giảng viên" : "Sinh viên";
                        }
                    }

                    return {
                        id: room.macuoctrochuyen,
                        name: chatName,
                        avatar: getAvatarText(chatName),
                        lastMsg: "Bấm để xem tin nhắn...",
                        time: new Date(room.cuoctrochuyen.ngaytao).toLocaleDateString('vi-VN'),
                        unread: 0,
                        role: chatRole,
                    };
                });
                setChatList(formattedList);
            }
        } catch (error) {
            console.error('Lỗi lấy danh sách phòng:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. FETCH TIN NHẮN CỦA 1 PHÒNG
    const fetchMessages = useCallback(async (roomId: number) => {
        try {
            const res = await fetch(`/api/sinhvien/messages?roomId=${roomId}`);
            const result = await res.json();

            if (result.success && result.data) {
                const formattedMessages = result.data.map((msg: any) => {
                    const isFile = msg.filedinh && msg.filedinh.trim() !== "";
                    const fileName = isFile ? msg.filedinh.split('/').pop() : "";

                    return {
                        id: msg.matinnhan,
                        content: msg.noidung,
                        time: new Date(msg.ngaytao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        isMine: msg.masvgui === CURRENT_USER_ID,
                        type: isFile ? "file" : "text",
                        fileName: fileName,
                        fileSize: isFile ? "2.4 MB" : "", // Có thể nâng cấp để lấy size thật sau
                    };
                });
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Lỗi lấy tin nhắn:', error);
        }
    }, []);

    // 3. GỬI TIN NHẮN MỚI
    const sendMessage = async (roomId: number, studentId: string, content: string) => {
        if (!content.trim()) return;

        try {
            const res = await fetch('/api/sinhvien/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    macuoctrochuyen: roomId,
                    masvgui: studentId,
                    noidung: content
                })
            });

            const result = await res.json();

            if (result.success) {
                // Cập nhật state tin nhắn ngay lập tức để hiển thị trên UI
                const newMsg = {
                    id: result.data.matinnhan,
                    content: result.data.noidung,
                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    isMine: true,
                    type: "text",
                };
                setMessages((prev) => [...prev, newMsg]);
                return true;
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            return false;
        }
    };

    return { chatList, messages, isLoading, fetchChatRooms, fetchMessages, sendMessage };
};