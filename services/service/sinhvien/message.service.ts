// services/service/sinhvien/message.service.ts
import { messageRepo } from '@/services/repositories/sinhvien/message.repo';
import { validateTinNhan } from '@/lib/validation/sinhvien';

export const messageService = {
    // 1. Tìm kiếm sinh viên & giảng viên
    searchUsers: async (search: string, limit: number = 10) => {
        const { data: svRows } = await messageRepo.searchStudents(search, limit);
        const { data: gvRows } = await messageRepo.searchTeachers(search, limit);

        const students = (svRows ?? []).map((s) => ({
            id: s.masv,
            masv: s.masv,
            magv: null,
            hoten: [s.hodem, s.ten].filter(Boolean).join(" ") || "Sinh Viên",
            avatar: s.anhdaidien ?? null,
            email: s.emailtruong ?? null,
            role: "SinhVien",
            extra: (s.lop as any)?.tenlop ?? null,
        }));

        const teachers = (gvRows ?? []).map((g) => ({
            id: g.magv,
            masv: null,
            magv: g.magv,
            hoten: [g.hodem, g.ten].filter(Boolean).join(" ") || "Giảng Viên",
            avatar: g.anhdaidien ?? null,
            email: g.emailtruong ?? null,
            role: "GiangVien",
            extra: (g.khoa as any)?.tenkhoa ?? null,
        }));

        return [...students, ...teachers];
    },

    // 2. Lấy danh sách cuộc trò chuyện của user
    getConversations: async (userId: string) => {
        const { data: memberRows, error: memberErr } = await messageRepo.getRoomsForUser(userId);
        if (memberErr) throw new Error(memberErr.message);
        if (!memberRows || memberRows.length === 0) return [];

        const conversationIds = memberRows.map((r) => r.macuoctrochuyen);
        const viewTimeMap: Record<number, string | null> = {};
        memberRows.forEach((r) => { viewTimeMap[r.macuoctrochuyen] = r.thoigianxemcuoi; });

        const { data: conversations, error: convErr } = await messageRepo.getConversationsDetail(conversationIds);
        if (convErr) throw new Error(convErr.message);

        const result = (conversations ?? [])
            .filter((conv: any) => !(conv.nguoidaxoa || []).includes(userId))
            .map((conv: any) => {
                let messages: any[] = conv.tinnhan ?? [];
                messages = messages.filter((m: any) => !m.nguoidaxoa?.includes(userId));

                const sorted = [...messages].sort(
                    (a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime()
                );
                const lastMsg = sorted[0] ?? null;

                const viewTime = viewTimeMap[conv.macuoctrochuyen];
                const unread = viewTime
                    ? messages.filter((m) => m.mataikhoangui !== userId && new Date(m.ngaytao) > new Date(viewTime)).length
                    : messages.filter((m) => m.mataikhoangui !== userId).length;

                const members: any[] = (conv.thanhvientrochuyen ?? []).map((tv: any) => {
                    const tk = tv.taikhoan;
                    if (tk) {
                        const gv = Array.isArray(tk.giangvien) ? tk.giangvien[0] : tk.giangvien;
                        if (gv) {
                            tv.giangvien = {
                                ...gv,
                                hoten: [gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên",
                                emailtruong: gv.emailtruong || tk.email
                            };
                        }
                        const sv = Array.isArray(tk.sinhvien) ? tk.sinhvien[0] : tk.sinhvien;
                        if (sv) {
                            tv.sinhvien = {
                                ...sv,
                                hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên",
                                emailtruong: sv.emailtruong || tk.email
                            };
                        }
                    }
                    return tv;
                });

                const otherMembers = members.filter((m) => m.mataikhoan !== userId);

                return {
                    macuoctrochuyen: conv.macuoctrochuyen,
                    tieude: conv.tieude,
                    loai: conv.loai,
                    ngaytao: conv.ngaytao,
                    members,
                    otherMembers,
                    lastMsg,
                    unread,
                };
            });

        // Sắp xếp cuộc trò chuyện theo tin nhắn mới nhất
        result.sort((a, b) => {
            const ta = a.lastMsg ? new Date(a.lastMsg.ngaytao).getTime() : new Date(a.ngaytao).getTime();
            const tb = b.lastMsg ? new Date(b.lastMsg.ngaytao).getTime() : new Date(b.ngaytao).getTime();
            return tb - ta;
        });

        return result;
    },

    // 3. Tạo cuộc trò chuyện 1-1
    createConversation: async (myUserId: string, otherMataikhoan: string, request?: Request) => {
        if (!otherMataikhoan) throw new Error("Cần cung cấp otherMataikhoan của người nhận.");

        // Kiểm tra xem đã tồn tại cuộc trò chuyện 1-1 chưa
        const existingConv = await messageRepo.findSharedPersonalConversation(myUserId, otherMataikhoan);
        if (existingConv) {
            const currentArr = existingConv.nguoidaxoa || [];
            if (currentArr.includes(myUserId)) {
                const newArr = currentArr.filter((id: string) => id !== myUserId);
                await messageRepo.updateConversationDeletedUsers(existingConv.macuoctrochuyen, newArr);
            }
            return { data: existingConv, existed: true };
        }

        // Tạo mới
        const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const vnNow = vnDate.toISOString().replace("T", " ").substring(0, 19);

        const { data: newConv, error: convErr } = await messageRepo.createConversation("CaNhan", null, vnNow);
        if (convErr || !newConv) {
            throw new Error(convErr?.message ?? "Không thể tạo cuộc trò chuyện.");
        }

        const membersToInsert = [
            { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: myUserId, vaitro: "member" },
            { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: otherMataikhoan, vaitro: "member" },
        ];

        const { error: memberErr } = await messageRepo.addConversationMembers(membersToInsert);
        if (memberErr) throw new Error(memberErr.message);

        if (request) {
            await messageRepo.logAudit(myUserId, "INSERT", "cuoctrochuyen", String(newConv.macuoctrochuyen), request);
        }

        return { data: newConv, existed: false };
    },

    // 4. Lấy tin nhắn (có phân trang)
    getMessages: async (convId: number, userId: string, page: number = 1, limit: number = 30) => {
        if (isNaN(convId)) throw new Error("ID không hợp lệ");

        const offset = (page - 1) * limit;
        const { data: msgs, error, count } = await messageRepo.getMessagesPaginated(convId, offset, limit, userId);
        if (error) throw new Error(error.message);

        // Cập nhật thoigianxemcuoi
        const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const vnNow = vnDate.toISOString().replace("T", " ").substring(0, 19);
        await messageRepo.updateMemberLastView(convId, userId, vnNow);

        return {
            data: msgs ?? [],
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
            me: { mataikhoan: userId },
        };
    },

    // 5. Gửi tin nhắn
    sendMessage: async (convId: number, userId: string, content: string, filedinh?: string | null, request?: Request) => {
        if (isNaN(convId)) throw new Error("ID không hợp lệ");

        // Nếu không có tệp đính kèm, thực hiện validateTinNhan
        if (!filedinh) {
            const v = validateTinNhan({ macuoctrochuyen: convId, noidung: content });
            if (!v.valid) throw new Error(v.error);
        }

        const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const vnNow = vnDate.toISOString().replace("T", " ").substring(0, 19);

        const { data, error } = await messageRepo.insertMessage({
            macuoctrochuyen: convId,
            mataikhoangui: userId,
            noidung: content?.trim() ?? "",
            filedinh: filedinh || null
        }, vnNow);

        if (error || !data) throw new Error(error?.message ?? "Không thể gửi tin nhắn.");

        // Khôi phục hiển thị cuộc trò chuyện cho cả 2 người khi có tin nhắn mới
        await messageRepo.restoreConversationVisibility(convId);

        // Cập nhật thoigianxemcuoi cho người gửi
        await messageRepo.updateMemberLastView(convId, userId, vnNow);

        if (request) {
            let senderName = userId;
            let recipientName = "cuộc hội thoại #" + convId;
            try {
                const senderTk = await messageService.getAccountDetailForLog(userId);
                if (senderTk) {
                    if (senderTk.sinhvien?.[0]) {
                        const sv = senderTk.sinhvien[0];
                        senderName = `${[sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên"} (${sv.masv})`;
                    } else if (senderTk.giangvien?.[0]) {
                        const gv = senderTk.giangvien[0];
                        senderName = `${[gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên"} (${gv.magv})`;
                    } else if (senderTk.admin?.[0]) {
                        senderName = `${senderTk.admin[0].hoten} (Admin)`;
                    } else {
                        senderName = senderTk.email;
                    }
                }
                const members = await messageService.getConversationMembers(convId);
                if (members) {
                    const other = members.find((m: any) => m.mataikhoan !== userId);
                    if (other?.mataikhoan) {
                        const recvTk = await messageService.getAccountDetailForLog(other.mataikhoan);
                        if (recvTk) {
                            if (recvTk.sinhvien?.[0]) {
                                const sv = recvTk.sinhvien[0];
                                recipientName = `${[sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên"} (${sv.masv})`;
                            } else if (recvTk.giangvien?.[0]) {
                                const gv = recvTk.giangvien[0];
                                recipientName = `${[gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên"} (${gv.magv})`;
                            } else if (recvTk.admin?.[0]) {
                                recipientName = `${recvTk.admin[0].hoten} (Admin)`;
                            } else {
                                recipientName = recvTk.email;
                            }
                        }
                    }
                }
            } catch (_) {}
            await messageRepo.logAudit(userId, `Gửi tin nhắn: ${senderName} ⇒ ${recipientName}`, "tinnhan", String(data.matinnhan), request);
        }

        // Trả về tin nhắn vừa được tạo
        return data;
    },

    // 6. Xóa / Ẩn cuộc trò chuyện
    deleteConversation: async (convId: number, userId: string, request?: Request) => {
        if (isNaN(convId)) throw new Error("ID không hợp lệ");

        // Lấy danh sách tin nhắn hiện tại
        const { data: msgs } = await messageRepo.getMessageIdsForDeletion(convId);
        if (msgs && msgs.length > 0) {
            const updates = msgs.map((m) => {
                const arr = m.nguoidaxoa || [];
                if (!arr.includes(userId)) {
                    return messageRepo.updateMessageDeletedUsers(m.matinnhan, [...arr, userId]);
                }
                return Promise.resolve();
            });
            await Promise.all(updates);
        }

        // Cập nhật cuộc trò chuyện để ẩn khỏi danh sách của user
        const { data: conv } = await messageRepo.getConversationsDetail([convId]);
        if (conv && conv.length > 0) {
            const arr = conv[0].nguoidaxoa || [];
            if (!arr.includes(userId)) {
                await messageRepo.updateConversationDeletedUsers(convId, [...arr, userId]);
            }
        }

        if (request) {
            await messageRepo.logAudit(userId, "Xóa hội thoại (ẩn với user)", "tinnhan", String(convId), request);
        }

        return true;
    },

    // 6b. Xóa / Ẩn một tin nhắn đơn lẻ
    deleteMessage: async (msgId: number, userId: string, request?: Request) => {
        if (isNaN(msgId)) throw new Error("ID không hợp lệ");

        const { data: msg, error } = await messageRepo.getMessageDetail(msgId);
        if (error || !msg) throw new Error(error?.message ?? "Không tìm thấy tin nhắn");

        const currentArray = msg.nguoidaxoa || [];
        if (!currentArray.includes(userId)) {
            const { error: updateErr } = await messageRepo.updateMessageDeletedUsers(msgId, [...currentArray, userId]);
            if (updateErr) throw new Error(updateErr.message);
        }

        if (request) {
            await messageRepo.logAudit(userId, "Xóa tin nhắn (ẩn với user)", "tinnhan", String(msgId), request);
        }

        return true;
    },

    // Helper cho logging/audit
    getAccountDetailForLog: async (userId: string) => {
        const { data } = await messageRepo.getAccountDetailForLog(userId);
        return data;
    },

    getConversationMembers: async (convId: number) => {
        const { data } = await messageRepo.getConversationMembers(convId);
        return data;
    },

    getConversationMembersDetail: async (convId: number, mataikhoan: string) => {
        const { data: memberRows, error } = await messageRepo.getConversationMembersDetail(convId);
        if (error) throw new Error(error.message);

        return (memberRows ?? []).map((m: any) => {
            let profile: any = null;
            const role = m.taikhoan?.vaitro;
            if (role === 'SinhVien' && m.taikhoan?.sinhvien?.[0]) {
                profile = m.taikhoan.sinhvien[0];
            } else if (role === 'GiangVien' && m.taikhoan?.giangvien?.[0]) {
                profile = m.taikhoan.giangvien[0];
            } else if (role === 'Admin' && m.taikhoan?.admin?.[0]) {
                profile = m.taikhoan.admin[0];
            }

            return {
                mataikhoan: m.mataikhoan,
                vaitro: m.vaitro,
                ngaythamgia: m.ngaythamgia,
                thoigianxemcuoi: m.thoigianxemcuoi,
                taikhoan: {
                    email: m.taikhoan?.email,
                    vaitro: m.taikhoan?.vaitro,
                    hoten: profile?.hoten || (profile?.hodem && profile?.ten ? `${profile.hodem} ${profile.ten}` : '—'),
                    anhdaidien: profile?.anhdaidien,
                    id_phu: profile?.masv || profile?.magv || profile?.maadmin,
                },
                isSelf: m.mataikhoan === mataikhoan,
            };
        });
    },

    uploadMessageFile: async (mataikhoan: string, file: File, request: Request) => {
        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
        const ALLOWED_TYPES = [
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
        ];

        if (file.size > MAX_SIZE) throw new Error("File vượt quá giới hạn 10MB");
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Loại file không được hỗ trợ");

        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const filePath = `messages/${mataikhoan}/${Date.now()}_${safeName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await messageRepo.uploadMessageFile(filePath, buffer, file.type);
        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = await messageRepo.getPublicUrl(filePath);

        // Ghi audit log qua repo
        await messageRepo.logAudit(mataikhoan, "Upload tệp đính kèm tin nhắn", "tinnhan-files", filePath, request);

        return { url: urlData.publicUrl, name: file.name, type: file.type, size: file.size };
    },
};