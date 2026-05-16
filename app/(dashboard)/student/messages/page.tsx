"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Edit3, Info, Paperclip, Send, X, ChevronDown, ChevronRight, Image as Img, FileText, Trash2 } from "lucide-react";
import { useAuth } from "@/hook/useAuth";
import {
  getConversations, getMessages, sendMessage, getConversationMembers,
  searchUsers, createOrGetConversation, deleteConversation, deleteMessage,
  uploadAttachment, getConversationDisplayName, getInitials, formatMsgTime,
  type ConversationRow, type MessageRow, type ConversationMember, type UserSearchResult,
} from "@/services/service/messages.service";

function isImg(url: string | null) {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(url.split("?")[0].split(".").pop()?.toLowerCase() ?? "");
}
function extractImg(s: string): string | null {
  const m = s.match(/^\s*\[IMAGE_URL:([^\]]+)\]/i);
  return m ? m[1].trim() : null;
}
function Av({ name, size = 44 }: { name: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: "#FFDAB9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color: "#E57373", flexShrink: 0 }}>{getInitials(name)}</div>;
}

function NewChat({ onClose, onSelect }: { onClose: () => void; onSelect: (u: UserSearchResult) => void }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState<UserSearchResult[]>([]); const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const t = setTimeout(async () => { setLoading(true); try { setRes(await searchUsers(q)); } finally { setLoading(false); } }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 420, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f0e9e4" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2D1B14" }}>Tin nhắn mới</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0e9e4" }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm sinh viên, giảng viên..." style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #FFDBB6", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && <p style={{ textAlign: "center", color: "#8B6F5F", padding: 20, fontSize: 13 }}>Đang tìm...</p>}
          {!loading && res.length === 0 && q.trim() && <p style={{ textAlign: "center", color: "#8B6F5F", padding: 20, fontSize: 13 }}>Không có kết quả.</p>}
          {res.map(u => (
            <div key={u.id} onClick={() => onSelect(u)} style={{ display: "flex", gap: 12, padding: "12px 20px", cursor: "pointer", alignItems: "center", borderBottom: "1px solid #fdf5f0" }} onMouseOver={e => (e.currentTarget.style.background = "#FFF8F4")} onMouseOut={e => (e.currentTarget.style.background = "")}>
              <Av name={u.hoten} size={38} />
              <div><p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "#2D1B14" }}>{u.hoten}</p><p style={{ margin: 0, fontSize: 11, color: "#8B6F5F" }}>{u.role === "SinhVien" ? "Sinh viên" : "Giảng viên"}{u.extra ? ` · ${u.extra}` : ""}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ conv, members, messages, onClose }: { conv: ConversationRow; members: ConversationMember[]; messages: MessageRow[]; onClose: () => void }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const other = members.find(m => !m.isSelf) ?? members[0];
  const profile = other?.sinhvien ?? other?.giangvien;
  const name = profile?.hoten ?? "Người dùng";
  const role = other?.sinhvien ? "Sinh viên" : other?.giangvien ? "Giảng viên" : "";
  const email = (profile as any)?.emailtruong ?? null;
  const photos: string[] = [];
  const files: MessageRow[] = [];
  messages.forEach(m => {
    const i = extractImg(m.noidung);
    if (i) photos.push(i);
    else if (m.filedinh) { if (isImg(m.filedinh)) photos.push(m.filedinh); else files.push(m); }
  });
  return (
    <div style={{ width: 288, background: "#fff", borderLeft: "1px solid #f0e9e4", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f0e9e4" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#2D1B14" }}>Thông tin hội thoại</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B6F5F" }}><X size={17} /></button>
      </div>
      <div style={{ padding: "20px 16px 14px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid #f0e9e4" }}>
        <Av name={name} size={68} />
        <p style={{ margin: "10px 0 2px", fontWeight: 700, fontSize: 14, color: "#2D1B14", textAlign: "center" }}>{name}</p>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#E57373", fontWeight: 600 }}>{role}</p>
        {email && <p style={{ margin: 0, fontSize: 11, color: "#8B6F5F" }}>{email}</p>}
        {other?.ngaythamgia && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#A08070" }}>Tham gia: {new Date(other.ngaythamgia).toLocaleDateString("vi-VN")}</p>}
      </div>
      {/* Ảnh */}
      <button onClick={() => setShowPhotos(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid #f0e9e4", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Img size={15} color="#E57373" /><span style={{ fontSize: 12.5, fontWeight: 600, color: "#2D1B14" }}>Ảnh & Phương tiện</span><span style={{ fontSize: 10, color: "#A08070", background: "#f5f0ec", borderRadius: 99, padding: "1px 6px" }}>{photos.length}</span></div>
        {showPhotos ? <ChevronDown size={14} color="#A08070" /> : <ChevronRight size={14} color="#A08070" />}
      </button>
      {showPhotos && (
        <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid #f0e9e4" }}>
          {photos.length === 0 ? <p style={{ fontSize: 12, color: "#A08070", textAlign: "center", padding: "6px 0" }}>Chưa có ảnh.</p>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
              {photos.map((src, i) => <a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 7, border: "1px solid #f0e9e4" }} onError={e => ((e.target as HTMLImageElement).style.display = "none")} /></a>)}
            </div>}
        </div>
      )}
      {/* File */}
      <button onClick={() => setShowFiles(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid #f0e9e4", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText size={15} color="#C25450" /><span style={{ fontSize: 12.5, fontWeight: 600, color: "#2D1B14" }}>File & Tài liệu</span><span style={{ fontSize: 10, color: "#A08070", background: "#f5f0ec", borderRadius: 99, padding: "1px 6px" }}>{files.length}</span></div>
        {showFiles ? <ChevronDown size={14} color="#A08070" /> : <ChevronRight size={14} color="#A08070" />}
      </button>
      {showFiles && (
        <div style={{ padding: "8px 16px 10px", borderBottom: "1px solid #f0e9e4" }}>
          {files.length === 0 ? <p style={{ fontSize: 12, color: "#A08070", textAlign: "center", padding: "6px 0" }}>Chưa có file.</p>
            : files.map(f => <a key={f.matinnhan} href={f.filedinh!} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 9, border: "1px solid #f0e9e4", marginBottom: 5, textDecoration: "none", background: "#FFFDF9" }}>
              <div style={{ background: "#C25450", borderRadius: 5, padding: "4px 6px", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>FILE</div>
              <span style={{ fontSize: 11.5, color: "#2D1B14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.filedinh!.split("/").pop()}</span>
            </a>)}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<ConversationRow[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [me, setMe] = useState<{ masv: string | null; magv: string | null }>({ masv: null, magv: null });
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConvs = useCallback(async () => {
    try { const d = await getConversations(); setConvs(d); if (!selId && d.length > 0) setSelId(d[0].macuoctrochuyen); }
    catch (e: any) { setErrMsg(e.message); } finally { setLoadingConvs(false); }
  }, [selId]);

  useEffect(() => { if (user) loadConvs(); }, [user, loadConvs]);

  const loadMsgs = useCallback(async (id: number) => {
    setLoadingMsgs(true); setErrMsg("");
    try {
      const mr = await getMessages(id);
      setMsgs(mr.data); setMe(mr.me);
      setConvs(p => p.map(c => c.macuoctrochuyen === id ? { ...c, unread: 0 } : c));
      // Load members riêng — lỗi không ảnh hưởng tin nhắn
      getConversationMembers(id).then(setMembers).catch(() => setMembers([]));
    } catch (e: any) { setErrMsg(e.message); }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => { if (selId) { setShowInfo(false); loadMsgs(selId); } }, [selId, loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    if (!selId) return;
    pollRef.current = setInterval(() => getMessages(selId).then(r => {
      // Dedup: ưu tiên dữ liệu mới nhất từ server, loại bỏ trùng id
      setMsgs(r.data);
      setMe(r.me);
    }).catch(() => { }), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selId]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      getConversations().then(d => setConvs(d)).catch(() => { });
    }, 5000);
    return () => clearInterval(t);
  }, [user]);

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !selId || sending) return;
    setSending(true);
    let filedinhUrl = undefined;

    try {
      if (attachment) {
        const upRes = await uploadAttachment(attachment);
        filedinhUrl = upRes.url;
      }
      const text = input.trim();
      const nm = await sendMessage(selId, text, filedinhUrl);
      setInput("");
      setAttachment(null);

      // Dedup: thêm tin nhắn mới, loại bỏ nếu đã có cùng matinnhan
      setMsgs(p => {
        const exists = p.some(m => m.matinnhan === nm.matinnhan);
        return exists ? p : [...p, nm];
      });
      setConvs(p => p.map(c => c.macuoctrochuyen === selId ? { ...c, lastMsg: { matinnhan: nm.matinnhan, noidung: nm.noidung, masvgui: nm.masvgui, magvgui: nm.magvgui, ngaytao: nm.ngaytao } } : c));
    } catch (e: any) { setErrMsg(e.message); } finally { setSending(false); }
  };

  const handleDelete = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa toàn bộ hội thoại này?")) return;
    try {
      await deleteConversation(convId);
      setConvs(p => p.filter(c => c.macuoctrochuyen !== convId));
      if (selId === convId) { setSelId(null); setMsgs([]); setMembers([]); }
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm("Xóa tin nhắn này ở phía bạn?")) return;
    try {
      await deleteMessage(msgId);
      setMsgs((p) => p.filter((m) => m.matinnhan !== msgId));
      setConvs((p) =>
        p.map((c) => {
          if (c.macuoctrochuyen === selId && c.lastMsg?.matinnhan === msgId) {
            const remaining = msgs.filter((m) => m.matinnhan !== msgId);
            const newLast = remaining.length > 0 ? remaining[remaining.length - 1] : null;
            return { ...c, lastMsg: newLast ? { matinnhan: newLast.matinnhan, noidung: newLast.noidung, masvgui: newLast.masvgui, magvgui: newLast.magvgui, ngaytao: newLast.ngaytao } : null };
          }
          return c;
        })
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleNew = async (u: UserSearchResult) => {
    setShowNew(false);
    try { const r = await createOrGetConversation(u.masv ?? undefined, u.magv ?? undefined); await loadConvs(); setSelId(r.data.macuoctrochuyen); }
    catch (e: any) { alert(e.message); }
  };

  const selConv = convs.find(c => c.macuoctrochuyen === selId);
  const selName = selConv ? getConversationDisplayName(selConv, me.masv, me.magv) : "";
  const filtered = searchQ.trim() ? convs.filter(c => getConversationDisplayName(c, me.masv, me.magv).toLowerCase().includes(searchQ.toLowerCase())) : convs;
  const isMine = (m: MessageRow) => (me.masv && m.masvgui === me.masv) || (me.magv && m.magvgui === me.magv);
  const senderName = (m: MessageRow) => {
    const mem = members.find(mb => (m.masvgui && mb.masv === m.masvgui) || (m.magvgui && mb.magv === m.magvgui));
    return mem?.sinhvien?.hoten ?? mem?.giangvien?.hoten ?? "";
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "#FDF8F6", overflow: "hidden" }}>
      {/* LEFT */}
      <div style={{ width: 310, display: "flex", flexDirection: "column", background: "#fff", borderRight: "1px solid #f0e9e4", flexShrink: 0 }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f5f0ec" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2D1B14" }}>Tin nhắn</h1>
            <button onClick={() => setShowNew(true)} style={{ padding: "7px 8px", background: "#E57373", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", display: "flex" }}><Edit3 size={15} /></button>
          </div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm kiếm..." style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: "1.5px solid #f0e9e4", fontSize: 12.5, background: "#FDF8F6", outline: "none", boxSizing: "border-box" }} />
        </div>
        {errMsg && <p style={{ margin: 0, padding: "8px 14px", fontSize: 11, color: "#C25450", background: "#FFF0F0" }}>{errMsg}</p>}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingConvs ? [1, 2, 3].map(i => <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f0e9e4", flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ height: 10, width: "55%", background: "#f0e9e4", borderRadius: 6, marginBottom: 7 }} /><div style={{ height: 9, width: "75%", background: "#f5f0ec", borderRadius: 6 }} /></div></div>)
            : filtered.length === 0 ? <div style={{ padding: "36px 16px", textAlign: "center" }}><p style={{ color: "#8B6F5F", fontSize: 13 }}>Chưa có hội thoại nào.</p><button onClick={() => setShowNew(true)} style={{ marginTop: 8, padding: "7px 14px", background: "#E57373", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 12 }}>+ Bắt đầu nhắn tin</button></div>
              : filtered.map(conv => {
                const name = getConversationDisplayName(conv, me.masv, me.magv);
                const active = conv.macuoctrochuyen === selId;
                return (
                  <div key={conv.macuoctrochuyen} onClick={() => setSelId(conv.macuoctrochuyen)}
                    style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer", background: active ? "#FFF0EC" : "transparent", borderRight: `3px solid ${active ? "#E57373" : "transparent"}`, borderBottom: "1px solid #fdf5f0", position: "relative" }}
                    onMouseOver={e => { (e.currentTarget.querySelector(".del-btn") as HTMLElement)?.style.setProperty("opacity", "1"); }}
                    onMouseOut={e => { (e.currentTarget.querySelector(".del-btn") as HTMLElement)?.style.setProperty("opacity", "0"); }}>
                    <Av name={name} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontWeight: conv.unread > 0 ? 700 : 600, fontSize: 12.5, color: "#2D1B14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                        <span style={{ fontSize: 10, color: "#A08070", flexShrink: 0, marginLeft: 4 }}>{conv.lastMsg ? formatMsgTime(conv.lastMsg.ngaytao) : ""}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#8B6F5F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{conv.lastMsg?.noidung ?? "Chưa có tin nhắn"}</p>
                        {conv.unread > 0 && <span style={{ background: "#E57373", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700, marginLeft: 4, flexShrink: 0 }}>{conv.unread}</span>}
                      </div>
                    </div>
                    <button className="del-btn" onClick={e => handleDelete(conv.macuoctrochuyen, e)}
                      style={{ opacity: 0, transition: "opacity .15s", background: "none", border: "none", cursor: "pointer", color: "#C25450", padding: "4px", display: "flex", flexShrink: 0 }}
                      title="Xóa hội thoại"><Trash2 size={14} /></button>
                  </div>
                );
              })}
        </div>
      </div>

      {/* CENTER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!selConv ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}><span style={{ fontSize: 48 }}>💬</span><p style={{ color: "#8B6F5F", fontSize: 14 }}>Chọn một cuộc trò chuyện để bắt đầu</p></div> : <>
          <div style={{ padding: "12px 18px", background: "#fff", borderBottom: "1px solid #f0e9e4", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Av name={selName} size={38} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#2D1B14" }}>{selName}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#4CAF50", fontWeight: 600 }}>{selConv.loai === "NhomMon" ? "Nhóm học tập" : selConv.otherMembers[0]?.sinhvien ? "Sinh viên" : selConv.otherMembers[0]?.giangvien ? "Giảng viên" : ""}</p>
              </div>
            </div>
            <button onClick={() => setShowInfo(v => !v)} title="Thông tin hội thoại"
              style={{ padding: "7px 8px", background: showInfo ? "#E57373" : "#f5f0ec", color: showInfo ? "#fff" : "#8B6F5F", border: "none", borderRadius: 9, cursor: "pointer", display: "flex", transition: "all .15s" }}>
              <Info size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingMsgs ? <p style={{ textAlign: "center", color: "#8B6F5F", fontSize: 13, paddingTop: 40 }}>Đang tải...</p>
              : errMsg ? <p style={{ textAlign: "center", color: "#C25450", fontSize: 13, paddingTop: 40 }}>{errMsg}</p>
                : msgs.length === 0 ? <p style={{ textAlign: "center", color: "#8B6F5F", fontSize: 13, paddingTop: 40 }}>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
                  : msgs.map(msg => {
                    const mine = isMine(msg);
                    const imgUrl = extractImg(msg.noidung);
                    const txt = imgUrl ? msg.noidung.replace(/^\s*\[IMAGE_URL:[^\]]+\]\n?/i, "") : msg.noidung;
                    return (
                      <div key={msg.matinnhan} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}
                        onMouseOver={e => { (e.currentTarget.querySelector(".del-msg-btn") as HTMLElement)?.style.setProperty("opacity", "1"); }}
                        onMouseOut={e => { (e.currentTarget.querySelector(".del-msg-btn") as HTMLElement)?.style.setProperty("opacity", "0"); }}>
                        {!mine && <span style={{ fontSize: 10.5, color: "#A08070", paddingLeft: 4 }}>{senderName(msg)}</span>}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}>
                            {imgUrl && <img src={imgUrl} alt="" style={{ maxWidth: 220, borderRadius: 11, border: "1px solid #f0e9e4", marginBottom: 3 }} onError={e => ((e.target as HTMLImageElement).style.display = "none")} />}
                            {txt && <div style={{ padding: "9px 13px", borderRadius: 17, fontSize: 13, maxWidth: 400, background: mine ? "#E57373" : "#fff", color: mine ? "#fff" : "#2D1B14", borderTopRightRadius: mine ? 3 : 17, borderTopLeftRadius: mine ? 17 : 3, boxShadow: "0 1px 3px rgba(0,0,0,.07)", border: mine ? "none" : "1px solid #f0e9e4", wordBreak: "break-word" }}>{txt}</div>}
                            {msg.filedinh && !isImg(msg.filedinh) && <a href={msg.filedinh} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 11, background: "#fff", border: "1px solid #f0e9e4", textDecoration: "none", maxWidth: 260 }}>
                              <div style={{ background: "#C25450", borderRadius: 5, padding: "4px 6px", color: "#fff", fontSize: 9, fontWeight: 700 }}>FILE</div>
                              <span style={{ fontSize: 11.5, color: "#2D1B14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.filedinh.split("/").pop()}</span>
                            </a>}
                          </div>
                          <button className="del-msg-btn" onClick={() => handleDeleteMessage(msg.matinnhan)} style={{ opacity: 0, transition: "opacity .15s", background: "none", border: "none", cursor: "pointer", color: "#C25450", padding: "4px", display: "flex", flexShrink: 0 }} title="Xóa tin nhắn"><Trash2 size={14} /></button>
                        </div>
                        <span style={{ fontSize: 10, color: "#A08070", padding: "0 4px" }}>{formatMsgTime(msg.ngaytao)}</span>
                      </div>
                    );
                  })}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "10px 18px", background: "#fff", borderTop: "1px solid #f0e9e4", flexShrink: 0 }}>
            {errMsg && <p style={{ margin: "0 0 6px", fontSize: 11, color: "#C25450" }}>{errMsg}</p>}

            {attachment && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px", background: "#FDF8F6", borderRadius: 8, border: "1px solid #f0e9e4", width: "max-content" }}>
                {attachment.type.startsWith("image/") ? (
                  <Img size={16} color="#E57373" />
                ) : (
                  <div style={{ background: "#E57373", borderRadius: 5, padding: "4px 6px", color: "#fff", fontSize: 9, fontWeight: 700 }}>FILE</div>
                )}
                <span style={{ fontSize: 12, color: "#2D1B14", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</span>
                <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B6F5F", padding: 2, display: "flex" }}><X size={14} /></button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#FDF8F6", padding: "7px 11px", borderRadius: 13, border: "1.5px solid #f0e9e4" }}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setAttachment(e.target.files[0]);
                }
                // Reset value to allow selecting the same file again
                e.target.value = "";
              }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "#A08070", display: "flex" }} title="Đính kèm file hoặc ảnh"><Paperclip size={17} /></button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Nhập tin nhắn... (Enter để gửi)" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#2D1B14" }} />
              <button onClick={handleSend} disabled={(!input.trim() && !attachment) || sending}
                style={{ padding: "6px 8px", background: (input.trim() || attachment) ? "#E57373" : "#f0e9e4", color: (input.trim() || attachment) ? "#fff" : "#A08070", border: "none", borderRadius: 9, cursor: (input.trim() || attachment) ? "pointer" : "default", display: "flex", transition: "all .15s" }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </>}
      </div>

      {/* RIGHT */}
      {showInfo && selConv && <InfoPanel conv={selConv} members={members} messages={msgs} onClose={() => setShowInfo(false)} />}
      {showNew && <NewChat onClose={() => setShowNew(false)} onSelect={handleNew} />}
    </div>
  );
}
