import { studentFetch } from "./client";

export async function fetchExams() {
  const res = await studentFetch("/api/student/exam");
  return res.json();
}

export async function fetchExamDetail(madethi: number) {
  const res = await studentFetch(`/api/student/exam/${madethi}`);
  return res.json();
}

export async function submitExam(madethi: number, answers: any, cheatCount?: number) {
  const res = await studentFetch(`/api/student/exam/${madethi}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers, cheatCount }),
  });
  return res.json();
}

export async function fetchExamResult(madethi: number) {
  const res = await studentFetch(`/api/student/exam/${madethi}/result`);
  return res.json();
}
