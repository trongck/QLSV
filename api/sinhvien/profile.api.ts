import { studentFetch } from "./client";

export async function fetchProfile() {
  const res = await studentFetch("/api/student/profile");
  return res.json();
}

export async function updateProfile(payload: any) {
  const res = await studentFetch("/api/student/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function registerFace(embedding: number[]) {
  const res = await studentFetch("/api/student/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ face_embedding: embedding }),
  });
  return res.json();
}

