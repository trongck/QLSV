"use client";

import React, { useState, useEffect, useRef } from "react";
import CreateNoteModal, { type CreateNoteResult } from "@/components/student/CreateNoteModal";
import { Plus, FileText } from "lucide-react";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentNotes, Note } from "@/hooks/sinhvien/useStudentNotes";
import { NoteSidebar } from "@/components/student/notes/NoteSidebar";
import { NoteEditor } from "@/components/student/notes/NoteEditor";
import { NoteStatsPanel } from "@/components/student/notes/NoteStatsPanel";

export default function StudentNotePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    notes,
    loading,
    saveStatus,
    createNote,
    deleteNote,
    scheduleAutoSave,
  } = useStudentNotes();

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Draft state cho editor (chứa dữ liệu đang chỉnh)
  const [draft, setDraft] = useState<Partial<Note>>({});
  const isFirstLoad = useRef(true);

  // ── Chọn note mặc định lúc mới vào ──────────────────────────────────────────
  useEffect(() => {
    if (isFirstLoad.current && notes.length > 0) {
      setSelectedId(notes[0].manhatky);
      setDraft(notes[0]);
      isFirstLoad.current = false;
    }
  }, [notes]);

  // ── Khi chọn note khác ──────────────────────────────────────────────────────
  const selectNote = (note: Note) => {
    setSelectedId(note.manhatky);
    setDraft(note);
  };

  // ── Auto-save khi draft thay đổi ────────────────────────────────────────────
  const handleDraftChange = (field: keyof Note, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (selectedId) {
      scheduleAutoSave(selectedId, { [field]: value }, (updated) => {
        setDraft((prev) => ({ ...prev, ...updated }));
      });
    }
  };

  // ── Thêm nhật ký mới ─────────────────────────────────────────────────────────
  const addNewNote = async (result: CreateNoteResult) => {
    const newNote = await createNote({
      tieude: result.tieude,
      noidung: "",
      maphancong: null,
      magv: null,
    });
    if (newNote) {
      selectNote(newNote);
    }
    setModalOpen(false);
  };

  // ── Xoá nhật ký ─────────────────────────────────────────────────────────────
  const handleDeleteNote = async (manhatky: number) => {
    if (!confirm("Bạn có chắc muốn xoá nhật ký này?")) return;
    const success = await deleteNote(manhatky);
    if (success) {
      const remaining = notes.filter((n) => n.manhatky !== manhatky);
      if (selectedId === manhatky) {
        if (remaining.length > 0) {
          selectNote(remaining[0]);
        } else {
          setSelectedId(null);
          setDraft({});
        }
      }
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
        <NoteSidebar
          notes={filteredNotes}
          selectedId={selectedId}
          onSelectNote={selectNote}
          onAddClick={() => setModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
        />

        {selectedId && draft ? (
          <NoteEditor
            draft={draft}
            saveStatus={saveStatus}
            onDraftChange={handleDraftChange}
            onDeleteClick={() => handleDeleteNote(selectedId)}
          />
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

        <NoteStatsPanel
          totalNotes={notes.length}
          selectedMood={draft?.tamtrang}
        />
      </div>

      <CreateNoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={addNewNote}
      />
    </DashboardShell>
  );
}

