"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Save,
  FileText,
  Tag,
  Calendar,
  Clock,
  Star,
  Loader2,
  AlertCircle,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import {
  getDiaryList,
  createDiary,
  updateDiary,
  deleteDiary,
  TAMTRANG_MAP,
  formatDiaryDate,
  formatDiaryDateShort,
  formatDiaryTime,
  type NhatKyItem,
} from "@/services/service/diary.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentNotePage() {
  // Danh sách
  const [notes, setNotes] = useState<NhatKyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Bản ghi đang chọn
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Trạng thái chỉnh sửa local (chưa lưu)
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTamTrang, setEditTamTrang] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Saving / deleting
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Timer tự lưu
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Tải danh sách ─────────────────────────────────────────────────────────

  const fetchList = useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDiaryList({ search, limit: 50 });
      setNotes(res.data);
      setTotal(res.pagination.total);
      // Tự chọn bản đầu tiên nếu chưa có selection
      if (res.data.length > 0 && selectedId === null) {
        const first = res.data[0];
        setSelectedId(first.manhatky);
        syncEditor(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải nhật ký.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchList(debouncedSearch); }, [debouncedSearch, fetchList]);

  // ─── Đồng bộ editor khi chọn bản ghi ────────────────────────────────────

  function syncEditor(note: NhatKyItem) {
    setEditTitle(note.tieude ?? "");
    setEditContent(note.noidung);
    setEditTamTrang(note.tamtrang ?? null);
    setIsDirty(false);
  }

  function handleSelectNote(note: NhatKyItem) {
    setSelectedId(note.manhatky);
    syncEditor(note);
  }

  const selectedNote = notes.find((n) => n.manhatky === selectedId) ?? null;

  // ─── Tự lưu sau 2 giây không gõ ──────────────────────────────────────────

  useEffect(() => {
    if (!isDirty || !selectedId) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => { handleSave(); }, 2000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editContent, editTamTrang, isDirty]);

  // ─── Lưu nhật ký ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedId || saving) return;
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await updateDiary(selectedId, {
        tieude: editTitle.trim() || null,
        noidung: editContent.trim(),
        tamtrang: editTamTrang as 1 | 2 | 3 | 4 | 5 | null,
      });
      setNotes((prev) =>
        prev.map((n) => (n.manhatky === selectedId ? updated : n))
      );
      setIsDirty(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Tạo nhật ký mới ─────────────────────────────────────────────────────

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleCreate() {
    setSaving(true);
    try {
      const newNote = await createDiary({
        tieude: "Nhật ký mới",
        noidung: "",
        tamtrang: null,
      });
      setNotes((prev) => [newNote, ...prev]);
      setTotal((t) => t + 1);
      setSelectedId(newNote.manhatky);
      syncEditor(newNote);
      // Focus vào textarea để người dùng bắt đầu viết ngay
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tạo nhật ký.");
    } finally {
      setSaving(false);
    }
  }


  // ─── Xoá nhật ký ─────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Bạn có chắc chắn muốn xoá nhật ký này không?")) return;
    setDeleting(true);
    try {
      await deleteDiary(selectedId);
      const remaining = notes.filter((n) => n.manhatky !== selectedId);
      setNotes(remaining);
      setTotal((t) => Math.max(0, t - 1));
      if (remaining.length > 0) {
        setSelectedId(remaining[0].manhatky);
        syncEditor(remaining[0]);
      } else {
        setSelectedId(null);
        setEditTitle("");
        setEditContent("");
        setEditTamTrang(null);
        setIsDirty(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại.");
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full bg-[#FDF8F6] overflow-hidden">

      {/* ─── CỘT 1: DANH SÁCH ─────────────────────────────────────────────── */}
      <div className="w-[380px] flex flex-col bg-white border-r border-gray-100 shadow-sm">
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Nhật ký học tập</h1>
            <div className="flex gap-2">
              <button
                onClick={() => fetchList(debouncedSearch)}
                className="p-2 text-gray-400 hover:text-red-500 transition"
                title="Làm mới"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="p-2 bg-[#E57373] text-white rounded-lg hover:bg-[#d32f2f] transition shadow-md active:scale-95 disabled:opacity-60"
                title="Thêm nhật ký mới"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm nhật ký..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-red-100 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 size={28} className="animate-spin text-red-400" />
              <span className="text-sm">Đang tải nhật ký...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-red-400 p-4">
              <AlertCircle size={28} />
              <span className="text-sm text-center">{error}</span>
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400 p-4">
              <BookOpen size={28} />
              <span className="text-sm text-center">
                {debouncedSearch
                  ? "Không tìm thấy nhật ký phù hợp."
                  : "Bạn chưa có nhật ký nào. Hãy tạo nhật ký đầu tiên!"}
              </span>
            </div>
          )}

          {!loading &&
            notes.map((note) => {
              const tm = note.tamtrang ? TAMTRANG_MAP[note.tamtrang] : null;
              const isActive = selectedId === note.manhatky;
              return (
                <div
                  key={note.manhatky}
                  onClick={() => handleSelectNote(note)}
                  className={`p-5 cursor-pointer border-b border-gray-50 transition-all ${isActive
                    ? "bg-red-50 border-r-4 border-red-500"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDiaryDate(note.ngaycapnhat)}
                    </span>
                    <div className="flex items-center gap-1">
                      {tm && (
                        <span className="text-base" title={tm.label}>
                          {tm.emoji}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3
                    className={`font-bold text-sm mb-1 truncate ${isActive ? "text-red-700" : "text-gray-800"
                      }`}
                  >
                    {note.tieude || "Không có tiêu đề"}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {note.noidung || "Chưa có nội dung..."}
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─── CỘT 2: SOẠN THẢO ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4 text-gray-400">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving || !selectedId}
              className={`transition flex items-center gap-1 text-sm ${isDirty
                ? "text-red-500 hover:text-red-700"
                : "text-gray-300 cursor-default"
                }`}
              title="Lưu (Ctrl+S)"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isDirty && !saving && (
                <span className="text-xs font-medium">Chưa lưu</span>
              )}
              {saving && (
                <span className="text-xs font-medium">Đang lưu...</span>
              )}
            </button>

            <div className="h-6 w-[1px] bg-gray-100 mx-1" />

            <button
              onClick={handleDelete}
              disabled={!selectedId || deleting}
              className="hover:text-red-600 transition disabled:text-gray-200"
              title="Xoá nhật ký"
            >
              {deleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-400 font-medium italic">
            {selectedNote ? (
              <>
                Lần cuối chỉnh sửa:{" "}
                {formatDiaryTime(selectedNote.ngaycapnhat)} -{" "}
                {formatDiaryDateShort(selectedNote.ngaycapnhat)}
              </>
            ) : (
              "Chưa chọn nhật ký"
            )}
          </div>
        </div>

        {/* Vùng soạn thảo */}
        {!selectedNote && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
            <BookOpen size={56} strokeWidth={1} />
            <p className="text-sm">Chọn hoặc tạo nhật ký để bắt đầu viết</p>
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-[#E57373] text-white rounded-xl text-sm hover:bg-[#d32f2f] transition shadow"
            >
              + Tạo nhật ký đầu tiên
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full">
            {/* Tiêu đề */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setIsDirty(true); }}
              placeholder="Tiêu đề nhật ký..."
              className="w-full text-3xl font-extrabold text-gray-800 border-none focus:ring-0 mb-6 placeholder:text-gray-200 outline-none bg-transparent"
            />

            {/* Meta: ngày tạo + tâm trạng + riêng tư */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Calendar size={14} className="text-red-400" />
                <span>
                  Ngày tạo:{" "}
                  {selectedNote
                    ? formatDiaryDateShort(selectedNote.ngaytao)
                    : "—"}
                </span>
              </div>

              {/* Tâm trạng */}
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Star size={14} className="text-yellow-400" />
                <select
                  className="bg-transparent border-none p-0 text-xs focus:ring-0 font-bold text-gray-600 cursor-pointer outline-none"
                  value={editTamTrang ?? ""}
                  onChange={(e) => {
                    setEditTamTrang(e.target.value ? Number(e.target.value) : null);
                    setIsDirty(true);
                  }}
                >
                  <option value="">-- Tâm trạng --</option>
                  {Object.entries(TAMTRANG_MAP).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.emoji} {v.label}
                    </option>
                  ))}
                </select>
              </div>


            </div>

            {/* Nội dung */}
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
              placeholder="Bắt đầu viết nhật ký học tập của bạn tại đây..."
              className="w-full h-full min-h-[500px] border-none focus:ring-0 text-gray-700 leading-loose text-lg resize-none placeholder:text-gray-100 outline-none bg-transparent"
            />
          </div>
        )}
      </div>

      {/* ─── CỘT 3: TIỆN ÍCH PHỤ ─────────────────────────────────────────── */}
      <div className="w-[300px] bg-[#FDF8F6] p-6 border-l border-gray-100 hidden xl:flex flex-col gap-8">
        {/* Tóm tắt */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-50">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-red-500" /> Tóm tắt nhật ký
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tổng số:</span>
              <span className="font-bold text-gray-800">{total}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Đã tải:</span>
              <span className="font-bold text-gray-800">{notes.length}</span>
            </div>
            {selectedNote && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tâm trạng:</span>
                <span className="font-bold text-gray-800">
                  {editTamTrang
                    ? `${TAMTRANG_MAP[editTamTrang]?.emoji} ${TAMTRANG_MAP[editTamTrang]?.label}`
                    : "Chưa chọn"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hướng dẫn phím tắt */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Tag size={16} className="text-blue-400" /> Gợi ý
          </h4>
          <ul className="space-y-2 text-[11px] text-gray-400">
            <li>✏️ Nhật ký tự lưu sau 2 giây không gõ</li>
            <li>🔒 Chọn chế độ riêng tư/công khai</li>
            <li>😊 Ghi lại tâm trạng mỗi ngày</li>
            <li>🔍 Tìm kiếm theo tiêu đề hoặc nội dung</li>
          </ul>
        </div>

        {/* Tâm trạng gần đây */}
        {notes.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              Tâm trạng gần đây
            </h4>
            <div className="flex flex-wrap gap-2">
              {notes.slice(0, 6).map((n) =>
                n.tamtrang ? (
                  <span
                    key={n.manhatky}
                    className="text-xl cursor-pointer"
                    title={`${TAMTRANG_MAP[n.tamtrang]?.label} — ${formatDiaryDateShort(n.ngaytao)}`}
                    onClick={() => handleSelectNote(n)}
                  >
                    {TAMTRANG_MAP[n.tamtrang]?.emoji}
                  </span>
                ) : null
              )}
              {notes.slice(0, 6).every((n) => !n.tamtrang) && (
                <span className="text-xs text-gray-400">Chưa có tâm trạng nào</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
