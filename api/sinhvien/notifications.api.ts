import { studentFetch } from "./client";

export async function fetchNotifications() {
  const res = await studentFetch("/api/student/notifications");
  return res.json();
}

export async function markAsRead(mathongbao: number) {
  const res = await studentFetch("/api/student/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mathongbao }),
  });
  return res.json();
}

export async function markAllAsRead() {
  const res = await studentFetch("/api/student/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ all: true }),
  });
  return res.json();
}

