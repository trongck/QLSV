"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

export type SessionPhase =
  | "loading"
  | "waiting_room"
  | "confirm_start"
  | "in_progress"
  | "cheating_locked"
  | "finished";

async function fetchExamDetailApi(madethi: number) {
  const res = await apiFetch(`/api/student/exam/${madethi}`);
  if (!res.ok) throw new Error(`Lỗi tải đề thi (${res.status})`);
  return res.json();
}

async function startExamApi(madethi: number) {
  const res = await apiFetch(`/api/student/exam/${madethi}`, {
    method: "POST",
    body: JSON.stringify({ action: "START" }),
  });
  return res.json();
}

async function cheatApi(madethi: number) {
  try {
    await apiFetch(`/api/student/exam/${madethi}`, {
      method: "POST",
      body: JSON.stringify({ action: "CHEAT" }),
    });
  } catch {
    // Không block UI nếu lỗi network
  }
}

async function submitExamApi(
  madethi: number,
  answers: {
    macauhoi: number;
    madapan: number | null;
    cautraloituluan: string | null;
  }[],
  cheatCount?: number,
) {
  const res = await apiFetch(`/api/student/exam/${madethi}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, cheatCount }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài (${res.status})`);
  return res.json();
}


export function useStudentExamSession(examId: number) {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("loading");
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [cheatCount, setCheatCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [startError, setStartError] = useState<string | null>(null);

  // Countdown đến giờ bắt đầu (waiting room)
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  // Ref để timer không bị stale
  const isFinishedRef = useRef(false);
  const isSubmittingRef = useRef(isSubmitting);
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const cheatCountRef = useRef(cheatCount);
  const sessionPhaseRef = useRef(sessionPhase);

  // Progress update debounce
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredCountRef = useRef(0);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
    answersRef.current = answers;
    questionsRef.current = questions;
    cheatCountRef.current = cheatCount;
    sessionPhaseRef.current = sessionPhase;
    isFinishedRef.current = sessionPhase === "finished";
  }, [isSubmitting, answers, questions, cheatCount, sessionPhase]);

  // Load đề thi — xác định phase ban đầu
  useEffect(() => {
    if (!examId) return;
    let cancelled = false;

    fetchExamDetailApi(examId)
      .then((json) => {
        if (cancelled) return;
        const data = json.data;
        if (data) {
          setExam(data);
          setQuestions(data.questions || []);

          const now = Date.now();
          const startMs = new Date(data.thoigianbatdau).getTime();
          const endMs = new Date(data.thoigianketthuc).getTime();

          if (now >= endMs) {
            // Đã kết thúc
            setSessionPhase("finished");
          } else if (now < startMs) {
            // Chưa đến giờ → phòng chờ
            setTimeUntilStart(Math.floor((startMs - now) / 1000));
            setSessionPhase("waiting_room");
          } else {
            // Đang trong giờ thi → confirm_start (trừ khi có mật khẩu)
            if (data.matkhau) {
              setShowPasswordModal(true);
              setSessionPhase("confirm_start");
            } else {
              setSessionPhase("confirm_start");
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch exam:", err);
        if (!cancelled) setSessionPhase("finished");
      });

    return () => { cancelled = true; };
  }, [examId]);

  // Countdown trong phòng chờ
  useEffect(() => {
    if (sessionPhase !== "waiting_room") return;

    const timer = setInterval(() => {
      setTimeUntilStart((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionPhase("confirm_start");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionPhase]);

  // Timer đếm ngược khi đang làm bài
  useEffect(() => {
    if (sessionPhase !== "in_progress") return;
    if (timeLeft <= 0) return;

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
            submitExamApi(examId, formattedAnswers, cheatCountRef.current)
              .then((json) => {
                if (json.data) {
                  setResult(json.data);
                  setSessionPhase("finished");
                }
              })
              .catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionPhase, examId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Auto-submit khi sinh viên thoát (Unmount hoặc đóng tab)
  useEffect(() => {
    if (sessionPhase !== "in_progress") return;

    // 1. Xử lý khi sinh viên đóng tab hoặc tải lại trang
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Gửi request nộp bài khẩn cấp bằng sendBeacon (nếu có thể) hoặc fetch với keepalive
      if (!isFinishedRef.current && !isSubmittingRef.current) {
        const formattedAnswers = questionsRef.current.map((q) => ({
          macauhoi: q.macauhoi,
          madapan: q.loaicauhoi !== "TuLuan" ? answersRef.current[q.macauhoi] : null,
          cautraloituluan: q.loaicauhoi === "TuLuan" ? answersRef.current[q.macauhoi] : null,
        }));
        
        // Không thể dùng await trong beforeunload, dùng fetch keepalive
        const token = localStorage.getItem("accessToken");
        if (token) {
          fetch(`/api/student/exam/${examId}/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ answers: formattedAnswers, cheatCount: cheatCountRef.current }),
            keepalive: true
          }).catch(() => {});
        }
      }
      // Không chặn người dùng, chỉ nộp bài ngầm
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2. Xử lý khi sinh viên bấm Back / chuyển route trong ứng dụng (Component unmount)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sessionPhaseRef.current === "in_progress" && !isFinishedRef.current && !isSubmittingRef.current) {
        const formattedAnswers = questionsRef.current.map((q) => ({
          macauhoi: q.macauhoi,
          madapan: q.loaicauhoi !== "TuLuan" ? answersRef.current[q.macauhoi] : null,
          cautraloituluan: q.loaicauhoi === "TuLuan" ? answersRef.current[q.macauhoi] : null,
        }));
        submitExamApi(examId, formattedAnswers, cheatCountRef.current).catch(() => {});
      }
    };
  }, [sessionPhase, examId]);

  // Bắt đầu làm bài
  const handleStart = useCallback(async () => {
    setStartError(null);
    try {
      const json = await startExamApi(examId);
      if (json.success && json.data?.effectiveTimeSec) {
        setTimeLeft(json.data.effectiveTimeSec);
        setSessionPhase("in_progress");
      } else {
        setStartError(json.error || "Không thể bắt đầu ca thi");
      }
    } catch (err: any) {
      setStartError(err.message || "Lỗi kết nối");
    }
  }, [examId]);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: answerId };
      const answeredCount = Object.keys(updated).length;
      answeredCountRef.current = answeredCount;

      return updated;
    });
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
      if (json.data) {
        setResult(json.data);
        setSessionPhase("finished");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = async () => {
    try {
      const res = await apiFetch(
        `/api/student/exam/${examId}/verify-password`,
        {
          method: "POST",
          body: JSON.stringify({ matkhau: passwordInput }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setShowPasswordModal(false);
        setPasswordError("");
      } else {
        setPasswordError(data.message || "Mật khẩu không chính xác");
      }
    } catch (err) {
      setPasswordError("Lỗi xác thực mật khẩu");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + "h " : ""}${m}m ${s}s`;
  };

  const handleCheat = useCallback(() => {
    setCheatCount((prev) => prev + 1);
    cheatApi(examId);
  }, [examId]);

  // Legacy support
  const isFinished = sessionPhase === "finished";
  const loading = sessionPhase === "loading";

  return {
    // Phase-based
    sessionPhase,
    startError,
    timeUntilStart,
    handleStart,
    // Legacy
    loading,
    exam,
    questions,
    answers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    isSubmitting,
    isFinished,
    result,
    showSubmitModal,
    setShowSubmitModal,
    unansweredCount,
    cheatCount,
    handleCheat,
    showPasswordModal,
    passwordInput,
    setPasswordInput,
    passwordError,
    handleAnswerSelect,
    handleEssayChange,
    handleConfirmSubmit,
    handleSubmit,
    handleVerifyPassword,
    formatTime,
    formatCountdown,
  };
}
