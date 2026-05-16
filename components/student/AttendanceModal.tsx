"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  QrCode, ScanFace, X, CheckCircle2, AlertCircle, Loader2,
  Camera, CameraOff, ZapOff,
} from "lucide-react";
import { apiFetch } from "@/services/service/auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrentSession {
  mabuoihoc: number;
  tenmon: string;
  giangvien: string;
  phonghoc: string;
  gioVao: string;
  gioRa: string;
  day: string;
  month: string;
}

interface AttendanceModalProps {
  mode: "qr" | "face";
  session: CurrentSession | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = "idle" | "loading" | "success" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceModal({
  mode,
  session,
  onClose,
  onSuccess,
}: AttendanceModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [qrInput, setQrInput] = useState("");
  const [message, setMessage] = useState("");

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const isQR = mode === "qr";

  // ── Khởi động camera (face mode) ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError(null);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCamReady(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setCamError("Bạn chưa cấp quyền truy cập camera. Vui lòng cho phép trong trình duyệt.");
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        setCamError("Không tìm thấy camera trên thiết bị này.");
      } else {
        setCamError("Không thể mở camera. Thử lại hoặc dùng QR Code.");
      }
    }
  }, []);

  // Dừng camera khi unmount
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
    setScanning(false);
    setScanProgress(0);
  }, []);

  // Auto-start camera khi face mode mở
  useEffect(() => {
    if (!isQR) {
      startCamera();
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      stopCamera();
    };
  }, [isQR, startCamera, stopCamera]);

  // ── Giả lập face scan ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanning) return;
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleSubmit("face");
          return 100;
        }
        return prev + 3;
      });
    }, 60);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  // ── Submit điểm danh ──────────────────────────────────────────────────────
  async function handleSubmit(phuongthuc: "qr" | "face") {
    if (!session) {
      setState("error");
      setMessage("Không có buổi học nào đang mở điểm danh.");
      return;
    }

    setState("loading");

    const body: Record<string, unknown> = {
      mabuoihoc: session.mabuoihoc,
      phuongthuc,
      ...(phuongthuc === "qr" ? { qr_data: qrInput.trim() } : {}),
    };

    try {
      const res = await apiFetch("/api/student/attendance", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Điểm danh thất bại.");
        setScanning(false);
        return;
      }

      stopCamera();
      setState("success");
      setMessage(data.message ?? "Điểm danh thành công!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch {
      setState("error");
      setMessage("Lỗi kết nối. Vui lòng thử lại.");
      setScanning(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background: isQR
              ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
              : "linear-gradient(135deg, #dc2626 0%, #e11d48 100%)",
          }}
        >
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              {isQR ? <QrCode size={22} className="text-white" /> : <ScanFace size={22} className="text-white" />}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {isQR ? "Điểm danh bằng QR" : "Điểm danh khuôn mặt"}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isQR ? "Nhập mã QR từ giảng viên" : "Camera tự động nhận dạng khuôn mặt"}
              </p>
            </div>
          </div>

          {/* Session info */}
          {session ? (
            <div className="bg-white/15 rounded-2xl px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm truncate max-w-[200px]">{session.tenmon}</p>
                <p className="text-white/70 text-xs mt-0.5">
                  📍 {session.phonghoc} &nbsp;·&nbsp; ⏰ {session.gioVao}–{session.gioRa}
                </p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center ml-3 flex-shrink-0">
                <span className="text-white font-bold text-base block">{session.day}</span>
                <span className="text-white/70 text-[10px] uppercase font-semibold">{session.month}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <ZapOff size={14} className="text-white/60" />
              <p className="text-white/60 text-xs">Không có buổi học nào đang mở điểm danh</p>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-6">

          {/* Success */}
          {state === "success" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <p className="font-semibold text-gray-800 text-center">{message}</p>
              <p className="text-gray-400 text-xs">Đang cập nhật lịch sử...</p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="font-semibold text-gray-800 text-center">{message}</p>
              <button
                onClick={() => { setState("idle"); setScanning(false); setScanProgress(0); }}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* ── QR Mode ── */}
          {state === "idle" && isQR && (
            <div className="flex flex-col gap-5">
              {/* QR viewfinder */}
              <div
                className="relative mx-auto rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ width: 200, height: 200, background: "linear-gradient(135deg, #f3f0ff, #ede9fe)", border: "2px dashed #7c3aed40" }}
              >
                {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2",
                  "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"]
                  .map((cls, i) => <div key={i} className={`absolute w-6 h-6 border-violet-600 rounded-sm ${cls}`} />)}
                <div className="flex flex-col items-center gap-2 text-violet-400">
                  <QrCode size={56} strokeWidth={1.2} />
                  <span className="text-xs font-medium">Scan QR</span>
                </div>
                <div
                  className="absolute left-4 right-4 h-0.5 bg-violet-500/60 rounded"
                  style={{ animation: "scanLine 2s ease-in-out infinite", top: "40%" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nhập mã QR từ giảng viên
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Nhập mã số buổi học..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  onKeyDown={(e) => { if (e.key === "Enter" && qrInput.trim()) handleSubmit("qr"); }}
                />
              </div>

              <button
                disabled={!qrInput.trim() || !session}
                onClick={() => handleSubmit("qr")}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                <QrCode size={18} /> Xác nhận điểm danh
              </button>

              {!session && (
                <p className="text-center text-xs text-amber-600 font-medium">
                  ⚠️ Không có buổi học nào đang mở điểm danh
                </p>
              )}
            </div>
          )}

          {/* ── Face Mode ── */}
          {state === "idle" && !isQR && (
            <div className="flex flex-col gap-4 items-center">
              {/* Camera viewfinder */}
              <div
                className="relative rounded-2xl overflow-hidden bg-black"
                style={{ width: 260, height: 220 }}
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }} // mirror
                />

                {/* Camera loading */}
                {!camReady && !camError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-2">
                    <Loader2 size={28} className="animate-spin text-red-400" />
                    <span className="text-white/60 text-xs">Đang mở camera...</span>
                  </div>
                )}

                {/* Camera error */}
                {camError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-3 p-4">
                    <CameraOff size={28} className="text-red-400" />
                    <p className="text-white/70 text-xs text-center leading-relaxed">{camError}</p>
                    <button
                      onClick={startCamera}
                      className="text-xs text-red-400 hover:text-red-300 underline transition"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {/* Face oval overlay */}
                {camReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="rounded-full border-2 transition-colors"
                      style={{
                        width: 120, height: 155,
                        borderColor: scanning ? "#22c55e" : "rgba(255,255,255,0.7)",
                        boxShadow: scanning ? "0 0 24px #22c55e60" : "0 0 0 9999px rgba(0,0,0,0.35)",
                      }}
                    />
                  </div>
                )}

                {/* Scanning overlay */}
                {scanning && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-green-400/80"
                    style={{ animation: "scanLine 1.2s ease-in-out infinite", top: "30%" }}
                  />
                )}

                {/* Camera icon badge */}
                {camReady && (
                  <div className="absolute top-2 right-2 bg-black/40 p-1.5 rounded-lg">
                    <Camera size={14} className="text-white/80" />
                  </div>
                )}
              </div>

              {/* Scan progress */}
              {scanning && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Đang nhận dạng khuôn mặt...</span>
                    <span className="font-semibold text-green-600">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${scanProgress}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              {!scanning ? (
                <button
                  disabled={!camReady || !session}
                  onClick={() => setScanning(true)}
                  className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #dc2626, #e11d48)" }}
                >
                  <ScanFace size={18} /> {camReady ? "Bắt đầu nhận dạng" : "Đang khởi động camera..."}
                </button>
              ) : (
                <button
                  onClick={() => { setScanning(false); setScanProgress(0); }}
                  className="w-full py-3 rounded-2xl text-gray-600 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              )}

              {!session && (
                <p className="text-center text-xs text-amber-600 font-medium">
                  ⚠️ Không có buổi học nào đang mở điểm danh
                </p>
              )}

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Đặt khuôn mặt vào khung oval rồi nhấn bắt đầu.
              </p>
            </div>
          )}

          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={36} className="animate-spin text-indigo-500" />
              <p className="text-gray-600 text-sm font-medium">Đang xác minh điểm danh...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scanLine {
          0%, 100% { top: 20%; }
          50%       { top: 70%; }
        }
      `}</style>
    </div>
  );
}
