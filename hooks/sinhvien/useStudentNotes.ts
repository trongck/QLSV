"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    fetchNotes as fetchNotesApi,
    createNote as createNoteApi,
    updateNote as updateNoteApi,
    deleteNote as deleteNoteApi,
} from "@/api/sinhvien/notes.api";
import { useAuth } from "@/hooks/auth/useAuth";

export interface Note {
    manhatky: number;
    tieude: string | null;
    noidung: string;
    tamtrang: 1 | 2 | 3 | 4 | 5 | null;
    maphancong: number | null;
    magv: string | null;
    ngaytao: string;
    ngaycapnhat: string;
    phancong: {
        maphancong: number;
        monhoc: { mamon: string; tenmon: string } | null;
        lop: { malop: string; tenlop: string } | null;
    } | null;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useStudentNotes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchNotesApi();
            if (json.success) {
                setNotes(json.data ?? []);
            } else {
                setError(json.message ?? "Không thể tải ghi chú");
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải ghi chú");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchNotes();
    }, [user, fetchNotes]);

    /** Tạo ghi chú mới */
    const createNote = async (payload: Partial<Note>): Promise<Note | null> => {
        try {
            const json = await createNoteApi(payload as Record<string, unknown>);
            if (!json.success) throw new Error(json.message ?? "Tạo ghi chú thất bại");
            await fetchNotes();
            return json.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    /** Cập nhật ghi chú (auto-save) */
    const updateNote = useCallback(async (manhatky: number, payload: Partial<Note>): Promise<Note | null> => {
        setSaveStatus("saving");
        try {
            const json = await updateNoteApi(manhatky, payload as Record<string, unknown>);
            if (!json.success) throw new Error(json.message ?? "Lưu thất bại");
            setSaveStatus("saved");
            const updatedNote = json.data;
            setNotes((prev) =>
                prev.map((n) => (n.manhatky === manhatky ? { ...n, ...updatedNote } : n))
            );
            return updatedNote;
        } catch {
            setSaveStatus("error");
            return null;
        }
    }, []);

    /** Lên lịch auto-save sau 1 giây không gõ */
    const scheduleAutoSave = useCallback(
        (manhatky: number, payload: Partial<Note>, onSaved?: (updated: Note) => void) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(async () => {
                const updated = await updateNote(manhatky, payload);
                if (updated && onSaved) {
                    onSaved(updated);
                }
            }, 1000);
        },
        [updateNote]
    );

    /** Xóa ghi chú */
    const deleteNote = async (manhatky: number): Promise<boolean> => {
        try {
            const json = await deleteNoteApi(manhatky);
            if (!json.success) throw new Error(json.message ?? "Xóa thất bại");
            setNotes((prev) => prev.filter((n) => n.manhatky !== manhatky));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        notes,
        loading,
        saveStatus,
        error,
        fetchNotes,
        createNote,
        updateNote,
        scheduleAutoSave,
        deleteNote,
    };
}
