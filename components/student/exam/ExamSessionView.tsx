"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Timer,
  Play
} from "lucide-react";
import { useStudentExamSession } from "@/hooks/sinhvien/useStudentExamSession";

interface ExamSessionViewProps {
  examId: number;
}

export function ExamSessionView({ examId }: ExamSessionViewProps) {
  const router = useRouter();

  const {
    sessionPhase,
    startError,
    timeUntilStart,
    handleStart,
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
  } = useStudentExamSession(examId);

  // ── ANTI-CHEAT LOGIC ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (sessionPhase !== "in_progress") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheat();
      }
    };

    const handleBlur = () => {
      handleCheat();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [sessionPhase, handleCheat]);

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={48} />
          <p className="text-gray-500 font-medium">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────────
  if (sessionPhase === "waiting_room") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-blue-100">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Timer size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Phòng chờ</h2>
          <p className="text-gray-500 mb-2 font-medium">{exam?.tieude}</p>
          <p className="text-gray-400 text-sm mb-8">Vui lòng chờ đến giờ bắt đầu chính thức</p>

          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">Ca thi bắt đầu sau</p>
            <p className="text-4xl font-black text-blue-600 font-mono">{formatCountdown(timeUntilStart)}</p>
          </div>

          <div className="text-left space-y-3 text-sm text-gray-500 bg-gray-50 rounded-2xl p-4">
            <div className="flex gap-3 items-start">
              <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Thời lượng: <strong className="text-gray-700">{exam?.thoigianlam} phút</strong></span>
            </div>
            <div className="flex gap-3 items-start">
              <AlertCircle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <span>Khi bắt đầu, <strong className="text-red-600">không được rời khỏi trang</strong> — vi phạm sẽ bị ghi nhận tự động.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CONFIRM START ─────────────────────────────────────────────────────────────
  if (sessionPhase === "confirm_start" && !showPasswordModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-orange-100">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sẵn sàng bắt đầu?</h2>
          <p className="text-gray-500 mb-6 font-medium">{exam?.tieude}</p>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
            <div className="flex gap-3 items-start mb-3">
              <ShieldAlert size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-sm">⚠️ Lưu ý quan trọng</p>
                <p className="text-red-600 text-sm mt-1">Khi ấn &quot;Bắt đầu làm bài&quot;, <strong>KHÔNG được thoát khỏi trang</strong> hoặc chuyển sang tab khác.</p>
              </div>
            </div>
            <p className="text-red-600 text-sm pl-7">Hệ thống sẽ tự động ghi nhận vi phạm và <strong>khóa bài thi vĩnh viễn</strong> nếu phát hiện rời màn hình.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Thời lượng</p>
              <p className="font-black text-gray-800 text-lg">{exam?.thoigianlam} phút</p>
            </div>
            <div className="text-center border-l border-gray-200">
              <p className="text-xs text-gray-400 font-bold uppercase">Số câu hỏi</p>
              <p className="font-black text-gray-800 text-lg">{questions.length} câu</p>
            </div>
          </div>

          {startError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-red-700 text-sm font-medium">
              {startError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Quay lại
            </button>
            <button
              onClick={handleStart}
              className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHEATING LOCKED ───────────────────────────────────────────────────────────
  if (sessionPhase === "cheating_locked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-900 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Phát hiện vi phạm!</h2>
          <p className="text-gray-500 mb-6">Bạn đã rời khỏi màn hình thi.</p>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-red-700 text-sm font-bold">Kết quả của bạn:</p>
            <p className="text-red-600 text-sm">• Bài thi đã bị đánh dấu <strong>Vi Phạm</strong></p>
            <p className="text-red-600 text-sm">• Bạn không thể tiếp tục làm bài</p>
            <p className="text-red-600 text-sm">• Điểm sẽ được tính theo các câu đã trả lời trước đó</p>
          </div>

          <button
            onClick={() => router.push("/sinhvien/test")}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
          >
            Về trang danh sách
          </button>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────────
  if (sessionPhase === "finished" || isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F6] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành bài thi!</h2>
          <p className="text-gray-500 mb-8">Bài làm của bạn đã được ghi nhận thành công.</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Điểm số</p>
              <p className="text-3xl font-black text-red-600">{result?.diemtong ?? 0}</p>
            </div>
            <div className="text-center border-l border-gray-200">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Số câu đúng</p>
              <p className="text-3xl font-black text-gray-800">{result?.socandung ?? 0}/{questions.length}</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/sinhvien/test")}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
          >
            Về trang danh sách
          </button>
        </div>
      </div>
    );
  }

  // ── IN PROGRESS ───────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#FAF7F6] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => { if (confirm("Bạn có chắc muốn thoát? Vi phạm sẽ bị ghi nhận.")) router.back(); }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-sm md:text-base leading-tight truncate max-w-[160px] md:max-w-xs">{exam?.tieude}</h1>
            <p className="text-xs text-gray-400 font-medium hidden sm:block">Câu {currentQuestionIndex + 1} / {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-gray-50 text-gray-700 border-gray-100"}`}>
            <Clock size={16} />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 text-sm"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3 sm:hidden">
        <span className="text-xs text-gray-400">Câu {currentQuestionIndex + 1}/{questions.length}</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{Object.keys(answers).length} đã trả lời</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* Left: Question */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex-1 p-5 md:p-8 overflow-y-auto">
            {currentQuestion ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-5">
                  <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Câu {currentQuestionIndex + 1}
                  </span>
                  <span className="text-gray-400 text-sm font-medium">({currentQuestion.diem} điểm)</span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.noidung}
                </h2>

                {currentQuestion.hinhanh && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100">
                    <img src={currentQuestion.hinhanh} alt="Question" className="max-w-full" />
                  </div>
                )}

                <div className="space-y-3">
                  {currentQuestion.loaicauhoi === "TuLuan" ? (
                    <textarea
                      className="w-full min-h-[160px] p-5 rounded-2xl border-2 border-gray-100 focus:border-red-600 focus:ring-0 outline-none text-gray-700 transition-all resize-none text-sm md:text-base"
                      placeholder="Nhập câu trả lời của bạn tại đây..."
                      value={answers[currentQuestion.macauhoi] || ""}
                      onChange={(e) => handleEssayChange(currentQuestion.macauhoi, e.target.value)}
                    />
                  ) : (
                    currentQuestion.dapan?.map((option: any) => (
                      <button
                        key={option.madapan}
                        onClick={() => handleAnswerSelect(currentQuestion.macauhoi, option.madapan)}
                        className={`w-full p-4 md:p-5 rounded-2xl border-2 text-left flex items-center gap-3 md:gap-4 transition-all group ${
                          answers[currentQuestion.macauhoi] === option.madapan
                            ? "border-red-600 bg-red-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          answers[currentQuestion.macauhoi] === option.madapan
                            ? "border-red-600 bg-red-600"
                            : "border-gray-300 group-hover:border-gray-400"
                        }`}>
                          {answers[currentQuestion.macauhoi] === option.madapan && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`font-medium text-sm md:text-base ${answers[currentQuestion.macauhoi] === option.madapan ? "text-red-900" : "text-gray-700"}`}>
                          {option.noidung}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Đề thi này chưa có câu hỏi
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-gray-50 px-5 md:px-8 py-3 md:py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft size={18} /> Câu trước
            </button>
            <button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              Câu sau <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Palette (ẩn trên mobile, hiện từ lg) */}
        <div className="hidden lg:flex w-72 xl:w-80 flex-col gap-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.macauhoi}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition-all border-2 ${
                    currentQuestionIndex === idx
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-100"
                      : answers[q.macauhoi]
                        ? "bg-red-50 text-red-600 border-red-100"
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                <div className="w-3.5 h-3.5 bg-red-600 rounded-sm" /> Hiện tại
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                <div className="w-3.5 h-3.5 bg-red-50 border border-red-100 rounded-sm" /> Đã trả lời
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                <div className="w-3.5 h-3.5 bg-white border border-gray-100 rounded-sm" /> Chưa trả lời
              </div>
            </div>
          </div>

          <div className="bg-red-600 rounded-3xl p-5 text-white shadow-xl shadow-red-100">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Lưu ý</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Hệ thống tự động nộp bài khi hết thời gian. Không chuyển tab hay rời màn hình.
            </p>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đề thi có mật khẩu</h2>
            <p className="text-gray-500 mb-8">Vui lòng nhập mật khẩu được cung cấp để bắt đầu bài thi.</p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Mật khẩu bài thi"
                className={`w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 focus:ring-0 outline-none font-bold text-center text-lg transition-all ${passwordError ? "border-red-600" : "border-transparent focus:border-gray-200"}`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {passwordError && <p className="text-red-600 text-sm font-bold">{passwordError}</p>}
              <div className="flex gap-3">
                <button onClick={() => router.back()} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                  Quay lại
                </button>
                <button onClick={handleVerifyPassword} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                  Bắt đầu ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${unansweredCount > 0 ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
              <AlertCircle size={32} />
            </div>
            {unansweredCount > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa hoàn thành bài thi!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Bạn còn <span className="font-bold text-red-600">{unansweredCount}</span> câu hỏi chưa trả lời.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận nộp bài</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Bạn đã trả lời hết tất cả các câu hỏi. Hãy kiểm tra kỹ trước khi nộp.</p>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                Tiếp tục làm bài
              </button>
              <button onClick={handleSubmit} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
