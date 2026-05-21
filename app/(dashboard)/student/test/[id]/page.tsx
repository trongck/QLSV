"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Lock
} from "lucide-react";
import { apiFetch } from "@/services/service/auth/auth.service";

export default function ExamSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  
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
  
  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchExamDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/sinhvien/exam/${id}`);
      const json = await res.json();
      if (json.success) {
        setExam(json.data);
        setQuestions(json.data.questions || []);
        setTimeLeft(json.data.thoigianlam * 60);
        
        if (json.data.matkhau) {
          setShowPasswordModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch exam:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExamDetail();
  }, [fetchExamDetail]);

  // Timer logic
  useEffect(() => {
    if (loading || isFinished || showPasswordModal) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isFinished, showPasswordModal]);

  // Cheat detection (Tab switching & Window blur)
  useEffect(() => {
    if (loading || isFinished || showPasswordModal) return;
    
    const handleBlur = () => {
      setCheatCount(prev => prev + 1);
      // Optional: show a warning toast here if needed
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [loading, isFinished, showPasswordModal]);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleEssayChange = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleConfirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const total = questions.length;
    const unanswered = total - answeredCount;
    setUnansweredCount(unanswered);
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);
    
    try {
      const formattedAnswers = questions.map(q => ({
        macauhoi: q.macauhoi,
        madapan: q.loaicauhoi !== 'TuLuan' ? answers[q.macauhoi] : null,
        cautraloituluan: q.loaicauhoi === 'TuLuan' ? answers[q.macauhoi] : null
      }));

      const res = await apiFetch(`/api/sinhvien/exam/${id}`, {
        method: "POST",
        body: JSON.stringify({ answers: formattedAnswers, cheatCount })
      });
      
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setIsFinished(true);
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = () => {
    if (passwordInput === exam.matkhau) {
      setShowPasswordModal(false);
      setPasswordError("");
    } else {
      setPasswordError("Mật khẩu không chính xác");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

  if (isFinished) {
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
            onClick={() => router.push('/student/test')}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
          >
            Về trang danh sách
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#FAF7F6] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { if(confirm("Bạn có chắc muốn thoát? Kết quả sẽ không được lưu.")) router.back() }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{exam?.tieude}</h1>
            <p className="text-xs text-gray-400 font-medium">Câu hỏi {currentQuestionIndex + 1} / {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
            <Clock size={18} />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Nộp bài
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        {/* Left: Question View */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            {currentQuestion ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Câu hỏi {currentQuestionIndex + 1}
                  </span>
                  <span className="text-gray-400 text-sm font-medium">({currentQuestion.diem} điểm)</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-8 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.noidung}
                </h2>

                {currentQuestion.hinhanh && (
                  <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100">
                    <img src={currentQuestion.hinhanh} alt="Question" className="max-w-full" />
                  </div>
                )}

                {/* Answers Section */}
                <div className="space-y-3">
                  {currentQuestion.loaicauhoi === 'TuLuan' ? (
                    <textarea 
                      className="w-full min-h-[200px] p-6 rounded-2xl border-2 border-gray-100 focus:border-red-600 focus:ring-0 outline-none text-gray-700 transition-all resize-none"
                      placeholder="Nhập câu trả lời của bạn tại đây..."
                      value={answers[currentQuestion.macauhoi] || ""}
                      onChange={(e) => handleEssayChange(currentQuestion.macauhoi, e.target.value)}
                    />
                  ) : (
                    currentQuestion.dapan?.map((option: any) => (
                      <button
                        key={option.madapan}
                        onClick={() => handleAnswerSelect(currentQuestion.macauhoi, option.madapan)}
                        className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all group ${
                          answers[currentQuestion.macauhoi] === option.madapan
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          answers[currentQuestion.macauhoi] === option.madapan
                            ? 'border-red-600 bg-red-600'
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {answers[currentQuestion.macauhoi] === option.madapan && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`font-medium ${
                          answers[currentQuestion.macauhoi] === option.madapan ? 'text-red-900' : 'text-gray-700'
                        }`}>
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
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
            <button 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} /> Câu trước
            </button>

            <button 
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Câu sau <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right: Question Palette */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-4 gap-3">
              {questions.map((q, idx) => (
                <button
                  key={q.macauhoi}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${
                    currentQuestionIndex === idx 
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100' 
                      : answers[q.macauhoi]
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                <div className="w-4 h-4 bg-red-600 rounded-sm" /> Hiện tại
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                <div className="w-4 h-4 bg-red-50 border border-red-100 rounded-sm" /> Đã trả lời
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                <div className="w-4 h-4 bg-white border border-gray-100 rounded-sm" /> Chưa trả lời
              </div>
            </div>
          </div>

          <div className="bg-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-100">
             <div className="flex items-center gap-3 mb-2 opacity-80">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Lưu ý</span>
             </div>
             <p className="text-sm font-medium leading-relaxed">
               Hệ thống sẽ tự động nộp bài khi hết thời gian. Đừng quên nhấn "Nộp bài" sau khi hoàn thành.
             </p>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleUp">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đề thi có mật khẩu</h2>
            <p className="text-gray-500 mb-8">Vui lòng nhập mật khẩu được cung cấp để bắt đầu bài thi.</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Mật khẩu bài thi"
                className={`w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 focus:ring-0 outline-none font-bold text-center text-lg transition-all ${
                  passwordError ? 'border-red-600' : 'border-transparent focus:border-gray-200'
                }`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {passwordError && <p className="text-red-600 text-sm font-bold">{passwordError}</p>}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => router.back()}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Quay lại
                </button>
                <button 
                  onClick={handleVerifyPassword}
                  className="flex-2 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Bắt đầu ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleUp">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${unansweredCount > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
              <AlertCircle size={32} />
            </div>
            
            {unansweredCount > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa hoàn thành bài thi!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Bạn còn <span className="font-bold text-red-600">{unansweredCount}</span> câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận nộp bài</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Bạn đã trả lời hết tất cả các câu hỏi. Hãy kiểm tra kỹ lại một lần nữa trước khi nộp bài.
                </p>
              </>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Tiếp tục làm bài
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
