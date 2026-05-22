"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import CreateNoteModal, { type CreateNoteResult } from "@/components/student/CreateNoteModal";
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  manhatky: number;
  tieude: string | null;
  noidung: string;
  tamtrang: 1 | 2 | 3 | 4 | 5 | null;
  maphancong: number | null;
  magv: string | null;
  ngaytao: string;
  ngaycapnhat: string;
  phancong: { maphancong: number; monhoc: { mamon: string; tenmon: string } | null; lop: { malop: string; tenlop: string } | null } | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUpdated(note: Note) {
  if (!note.ngaycapnhat || !note.ngaytao) return false;
  return (
    new Date(note.ngaycapnhat).getTime() - new Date(note.ngaytao).getTime() >
    1000
  );
}

const MOOD_LABELS: Record<number, string> = {
  1: "😞",
  2: "😐",
  3: "🙂",
  4: "😊",
  5: "🤩",
};


// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentNotePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);

  // Draft state cho editor (chứa dữ liệu đang chỉnh)
  const [draft, setDraft] = useState<Partial<Note>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // ── Fetch danh sách nhật ký ─────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/student/notes");
      const json = await res.json();
      if (json.success) {
        setNotes(json.data);
        if (isFirstLoad.current && json.data.length > 0) {
          setSelectedId(json.data[0].manhatky);
          setDraft(json.data[0]);
          isFirstLoad.current = false;
        }
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Khi chọn note khác ──────────────────────────────────────────────────────
  const selectNote = (note: Note) => {
    setSelectedId(note.manhatky);
    setDraft(note);
    setSaveStatus("idle");
  };

  // ── Auto-save khi draft thay đổi ────────────────────────────────────────────
  const handleDraftChange = (field: keyof Note, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("saving");

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!selectedId) return;
      try {
        const res = await apiFetch(`/api/student/notes/${selectedId}`, {
          method: "PUT",
          body: JSON.stringify({ [field]: value }),
        });
        const json = await res.json();
        if (json.success) {
          setSaveStatus("saved");
          setNotes((prev) =>
            prev.map((n) =>
              n.manhatky === selectedId ? { ...n, ...json.data } : n
            )
          );
          setDraft((prev) => ({ ...prev, ...json.data }));
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, 900);
  };

  // ── Thêm nhật ký mới ─────────────────────────────────────────────────────────
  const addNewNote = async (result: CreateNoteResult) => {
    try {
      const res = await apiFetch("/api/student/notes", {
        method: "POST",
        body: JSON.stringify({
          tieude: result.tieude,
          noidung: "",
          maphancong: null,
          magv: null,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newNote: Note = json.data;
        setNotes((prev) => [newNote, ...prev]);
        selectNote(newNote);
      }
    } catch { /* silent */ } finally {
      setModalOpen(false);
    }
  };

  // ── Xoá nhật ký ─────────────────────────────────────────────────────────────
  const deleteNote = async (manhatky: number) => {
    if (!confirm("Bạn có chắc muốn xoá nhật ký này?")) return;
    try {
      await apiFetch(`/api/student/notes/${manhatky}`, { method: "DELETE" });
      const remaining = notes.filter((n) => n.manhatky !== manhatky);
      setNotes(remaining);
      if (selectedId === manhatky) {
        if (remaining.length > 0) {
          selectNote(remaining[0]);
        } else {
          setSelectedId(null);
          setDraft({});
        }
      }
    } catch {
      // handle silently
    }
  };

  // ── Filter list ────────────────────────────────────────────────────────
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.tieude ?? "").toLowerCase().includes(q) ||
      n.noidung.toLowerCase().includes(q)
    );
  });

  if (authLoading || !user) return null;

  return (
    <DashboardShell pageTitle="Nhật ký học tập">
        <style>{`
          .note-layout {
            display: flex;
            height: 100%;
            background: #FDF8F6;
            overflow: hidden;
          }
          .note-sidebar {
            width: 360px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            background: white;
            border-right: 1px solid #f3f4f6;
            box-shadow: 1px 0 4px rgba(0,0,0,0.04);
          }
          .note-editor {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
            min-width: 0;
          }
          @media (max-width: 768px) {
            .note-layout {
              flex-direction: column;
            }
            .note-sidebar {
              width: 100%;
              height: 260px;
              border-right: none;
              border-bottom: 1px solid #f3f4f6;
              flex-shrink: 0;
            }
          }
        `}</style>
        <div className="note-layout">
        {/* ══ CỘT 1: DANH SÁCH ══════════════════════════════════════════════════ */}
        <div className="note-sidebar">
            <div className="p-5 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Nhật ký học tập</h1>
                <button
                onClick={() => setModalOpen(true)}
                className="p-2 bg-[#E57373] text-white rounded-lg hover:bg-[#d32f2f] transition shadow-md active:scale-95"
                title="Thêm nhật ký"
                >
                <Plus size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
                <input
                type="text"
                placeholder="Tìm kiếm nhật ký..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-red-100 outline-none"
                />
            </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="flex justify-center items-center py-16 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2 text-gray-400 text-sm">
                <FileText size={36} strokeWidth={1.2} />
                <span>Chưa có nhật ký nào</span>
                </div>
            ) : (
                filteredNotes.map((note) => (
                <div
                    key={note.manhatky}
                    onClick={() => selectNote(note)}
                    className={`p-4 cursor-pointer border-b border-gray-50 transition-all ${
                    selectedId === note.manhatky
                        ? "bg-red-50 border-r-4 border-red-500"
                        : "hover:bg-gray-50"
                    }`}
                >
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-1.5">
                        {note.tamtrang && (
                        <span className="text-xs">{MOOD_LABELS[note.tamtrang]}</span>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock size={9} />
                        {formatDate(note.ngaytao).split(",")[0]}
                    </span>
                    </div>

                    {/* Title */}
                    <h3
                    className={`font-bold text-sm mb-1 truncate ${
                        selectedId === note.manhatky
                        ? "text-red-700"
                        : "text-gray-800"
                    }`}
                    >
                    {note.tieude || "Không có tiêu đề"}
                    </h3>

                    {/* Preview */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {note.noidung || "Chưa có nội dung..."}
                    </p>
                </div>
                ))
            )}
            </div>
        </div>

        {/* ══ CỘT 2: TRÌNH SOẠN THẢO ════════════════════════════════════════════ */}
        {selectedId && draft ? (
            <div className="note-editor">
            {/* Toolbar */}
            <div className="px-8 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4 text-gray-400">
                <button
                    onClick={() => deleteNote(selectedId)}
                    className="hover:text-red-600 transition"
                    title="Xoá nhật ký"
                >
                    <Trash2 size={18} />
                </button>
                <div className="h-5 w-[1px] bg-gray-100 mx-1" />
                {/* Mood picker */}
                <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => handleDraftChange("tamtrang", m)}
                        className={`text-base transition hover:scale-125 ${
                        draft.tamtrang === m ? "scale-125" : "opacity-50"
                        }`}
                        title={`Tâm trạng ${m}`}
                    >
                        {MOOD_LABELS[m]}
                    </button>
                    ))}
                </div>
                </div>

                {/* Save status */}
                <div className="text-[11px] font-medium italic flex items-center gap-1.5">
                {saveStatus === "saving" && (
                    <span className="text-gray-400 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Đang lưu...
                    </span>
                )}
                {saveStatus === "saved" && (
                    <span className="text-green-500 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Đã lưu
                    </span>
                )}
                {saveStatus === "error" && (
                    <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> Lỗi khi lưu
                    </span>
                )}
                {saveStatus === "idle" && (
                    <span className="text-gray-300">
                    {isUpdated(draft as Note)
                        ? `Cập nhật: ${formatDate(draft.ngaycapnhat ?? null)}`
                        : `Tạo: ${formatDate(draft.ngaytao ?? null)}`}
                    </span>
                )}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-5 md:p-10 max-w-4xl mx-auto w-full">
                {/* Title */}
                <input
                type="text"
                value={draft.tieude ?? ""}
                onChange={(e) => handleDraftChange("tieude", e.target.value)}
                placeholder="Tiêu đề nhật ký..."
                className="w-full text-3xl font-extrabold text-gray-800 border-none focus:ring-0 mb-6 placeholder:text-gray-200 outline-none bg-transparent"
                />

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-5 mb-6 pb-4 border-b border-gray-50">
                {/* Ngày tạo */}
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Calendar size={13} className="text-red-400" />
                    <span>Ngày tạo: {formatDate(draft.ngaytao ?? null)}</span>
                </div>

                {/* Ngày cập nhật (chỉ hiện nếu khác ngaytao) */}
                {isUpdated(draft as Note) && (
                    <div className="flex items-center gap-2 text-xs text-orange-500 font-semibold">
                    <Clock size={13} />
                    <span>Cập nhật: {formatDate(draft.ngaycapnhat ?? null)}</span>
                    </div>
                )}
                </div>

                {/* Content */}
                <textarea
                value={draft.noidung ?? ""}
                onChange={(e) => handleDraftChange("noidung", e.target.value)}
                placeholder="Bắt đầu viết nhật ký học tập của bạn tại đây..."
                className="w-full min-h-[500px] border-none focus:ring-0 text-gray-700 leading-loose text-lg resize-none placeholder:text-gray-200 outline-none bg-transparent"
                />
            </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
            <FileText size={64} strokeWidth={1} />
            <p className="text-lg">Chọn nhật ký hoặc tạo mới</p>
            <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E57373] text-white rounded-xl hover:bg-[#d32f2f] transition text-sm font-medium"
            >
                <Plus size={18} /> Tạo nhật ký mới
            </button>
            </div>
        )}

        {/* ══ CỘT 3: TIỆN ÍCH (ẩn trên màn nhỏ) ════════════════════════════════ */}
        <div className="w-[280px] bg-[#FDF8F6] p-5 border-l border-gray-100 hidden xl:flex flex-col gap-6">
            {/* Tóm tắt */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={14} className="text-red-500" /> Tổng quan
            </h4>
            <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tổng nhật ký:</span>
                <span className="font-bold text-gray-800">{notes.length}</span>
                </div>
            </div>
            </div>

            {/* Tâm trạng */}
            {selectedId && draft.tamtrang && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Tâm trạng</h4>
                <div className="text-4xl text-center py-2">
                {MOOD_LABELS[draft.tamtrang]}
                </div>
            </div>
            )}
        </div>
        </div>
        
        {/* Modal tạo nhật ký */}
        <CreateNoteModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={addNewNote}
        />
    </DashboardShell>
  );
}
