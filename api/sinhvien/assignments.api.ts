import { studentFetch } from "./client";

export async function fetchAssignments() {
  const res = await studentFetch("/api/student/assignment");
  return res.json();
}

export async function uploadFile(file: File): Promise<{ success: boolean; url: string; fileName?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await studentFetch("/api/student/upload", {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Upload file thất bại.");
  return json;
}

export async function submitAssignment(
  mabaitap: number,
  noidungnop: string | null,
  filenop: string | null
) {
  const res = await studentFetch("/api/student/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mabaitap, noidungnop, filenop }),
  });
  return res.json();
}
