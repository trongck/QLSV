"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchExamResultApi(madethi: number) {
  const res = await apiFetch(`/api/student/exam/${madethi}/result`);
  if (!res.ok) throw new Error(`Lỗi tải kết quả (${res.status})`);
  return res.json();
}

export function useStudentExamResult(examId: number) {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  // Chỉ phụ thuộc examId — không phụ thuộc function reference
  useEffect(() => {
    if (!examId) return;

    let cancelled = false;
    setLoading(true);

    fetchExamResultApi(examId)
      .then((json) => {
        if (!cancelled && json.data) setResultData(json.data);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch result:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [examId]); // ← chỉ examId, không có function trong deps

  return { loading, resultData };
}
