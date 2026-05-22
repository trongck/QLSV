import { studentFetch } from "./client";

export async function fetchNotes() {
  const res = await studentFetch("/api/student/notes");
  return res.json();
}

export async function createNote(payload: any) {
  const res = await studentFetch("/api/student/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateNote(id: number, payload: any) {
  const res = await studentFetch(`/api/student/notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteNote(id: number) {
  const res = await studentFetch(`/api/student/notes/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

