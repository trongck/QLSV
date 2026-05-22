import { studentFetch } from "./client";

export async function fetchGrades(mahocky?: number | string) {
  const url = mahocky ? `/api/student/grades?mahocky=${mahocky}` : "/api/student/grades";
  const res = await studentFetch(url);
  return res.json();
}
