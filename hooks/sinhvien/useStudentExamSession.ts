"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchExamDetailApi(madethi: number) {
  const res = await apiFetch(`/api/student/exam/${madethi}`);
  if (!res.ok) throw new Error(`Lỗi tải đề thi (${res.status})`);
  return res.json();
}

async function submitExamApi(
  madethi: number,
  answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
  cheatCount?: number
) {
  const res = await apiFetch(`/api/student/exam/${madethi}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, cheatCount }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài (${res.status})`);
  return res.json();
}

export function useStudentExamSession(examId: number) {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [cheatCount, setCheatCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Dùng ref để tránh handleSubmit bị stale trong timer effect
  const isFinishedRef = useRef(isFinished);
  const isSubmittingRef = useRef(isSubmitting);
  isFinishedRef.current = isFinished;
  isSubmittingRef.current = isSubmitting;

  // Load đề thi — chỉ chạy 1 lần khi examId thay đổi
  useEffect(() => {
    if (!examId) return;

    let cancelled = false;
    setLoading(true);

    fetchExamDetailApi(examId)
      .then((json) => {
        if (cancelled) return;
        const data = json.data;
        if (data) {
          setExam(data);
          setQuestions(data.questions || []);
          setTimeLeft(data.thoigianlam * 60);
          if (data.matkhau) setShowPasswordModal(true);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch exam:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [examId]); // ← chỉ phụ thuộc examId, không phụ thuộc function

  // Timer — dùng ref để tránh circular dependency
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  answersRef.current = answers;
  questionsRef.current = questions;

  useEffect(() => {
    if (loading || isFinished || showPasswordModal || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit khi hết giờ
          if (!isFinishedRef.current && !isSubmittingRef.current) {
            const formattedAnswers = questionsRef.current.map((q) => ({
              macauhoi: q.macauhoi,
              madapan: q.loaicauhoi !== "TuLuan" ? answersRef.current[q.macauhoi] : null,
              cautraloituluan: q.loaicauhoi === "TuLuan" ? answersRef.current[q.macauhoi] : null,
            }));
            submitExamApi(examId, formattedAnswers, cheatCount)
              .then((json) => {
                if (json.data) { setResult(json.data); setIsFinished(true); }
              })
              .catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, showPasswordModal]); // ← không có timeLeft trong deps

  // Cheat detection
  useEffect(() => {
    if (loading || isFinished || showPasswordModal) return;
    const handleBlur = () => setCheatCount((prev) => prev + 1);
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [loading, isFinished, showPasswordModal]);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleEssayChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleConfirmSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    setUnansweredCount(unanswered);
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);
    try {
      const formattedAnswers = questions.map((q) => ({
        macauhoi: q.macauhoi,
        madapan: q.loaicauhoi !== "TuLuan" ? answers[q.macauhoi] : null,
        cautraloituluan: q.loaicauhoi === "TuLuan" ? answers[q.macauhoi] : null,
      }));
      const json = await submitExamApi(examId, formattedAnswers, cheatCount);
      if (json.data) { setResult(json.data); setIsFinished(true); }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = () => {
    if (passwordInput === exam?.matkhau) {
      setShowPasswordModal(false);
      setPasswordError("");
    } else {
      setPasswordError("Mật khẩu không chính xác");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return {
    loading, exam, questions, answers,
    currentQuestionIndex, setCurrentQuestionIndex,
    timeLeft, isSubmitting, isFinished, result,
    showSubmitModal, setShowSubmitModal, unansweredCount, cheatCount,
    showPasswordModal, passwordInput, setPasswordInput, passwordError,
    handleAnswerSelect, handleEssayChange, handleConfirmSubmit,
    handleSubmit, handleVerifyPassword, formatTime,
  };
}
