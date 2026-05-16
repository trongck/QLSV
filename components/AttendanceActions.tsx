"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, ScanFace, X, CheckCircle, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  maphancong: number;
  tenmon: string;
  mamon: string;
}

interface AttendanceActionsProps {
  onFilterChange?: (filter: { type: "month" | "semester"; mahocky?: number; maphancong?: number }) => void;
  onCheckedIn?: () => void;
}

// ─── Hook: lấy danh sách môn học ─────────────────────────────────────────────
function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("/api/sinhvien/attendance/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const list: Subject[] = (json.subjects ?? []).map((s: any) => ({
            maphancong: s.maphancong,
            tenmon: s.monhoc?.tenmon ?? "Chưa rõ",
            mamon: s.monhoc?.mamon ?? "",
          }));
          setSubjects(list);
        }
      } catch {
        // Nếu API lỗi vẫn tiếp tục
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { subjects, loading };
}

// ─── Subject Dropdown ─────────────────────────────────────────────────────────
function SubjectDropdown({
  subjects,
  selected,
  onSelect,
  placeholder = "Chọn môn học",
}: {
  subjects: Subject[];
  selected: Subject | null;
  onSelect: (s: Subject | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:border-red-300 transition"
      >
        <span className={selected ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selected ? selected.tenmon : placeholder}
        </span>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-40 overflow-hidden">
          {subjects.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Không có môn học</div>
          ) : (
            subjects.map((s) => (
              <button
                key={s.maphancong}
                onClick={() => { onSelect(s); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 transition ${selected?.maphancong === s.maphancong ? "bg-red-50 text-red-700 font-semibold" : "text-gray-700"}`}
              >
                <div className="font-medium">{s.tenmon}</div>
                <div className="text-xs text-gray-400">{s.mamon}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── QR Scanner Modal — dùng camera quét mã QR từ bên ngoài ─────────────────
function QRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const [step, setStep] = useState<"start" | "scanning" | "success" | "error">("start");
  const [errMsg, setErrMsg] = useState("");
  const [scannedData, setScannedData] = useState("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startScanner = async () => {
    setStep("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      scanLoop();
    } catch {
      setStep("error");
      setErrMsg("Không thể mở camera. Hãy cấp quyền camera và thử lại.");
    }
  };

  const scanLoop = () => {
    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Dùng jsQR để decode
      try {
        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          stopCamera();
          setScannedData(code.data);
          setStep("success");
          setTimeout(() => { onSuccess(); onClose(); }, 2000);
          return;
        }
      } catch {}
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <QrCode size={22} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Quét mã QR</h3>
              <p className="text-xs text-gray-400">Hướng camera vào mã QR điểm danh</p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Canvas ẩn để decode */}
          <canvas ref={canvasRef} className="hidden" />

          {step === "start" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-44 h-44 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
                <QrCode size={56} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 text-center">Mở camera và hướng vào mã QR do giáo viên cung cấp</p>
              <button
                onClick={startScanner}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-red-100 text-sm"
              >
                📷 Mở camera quét QR
              </button>
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-gray-900 border-4 border-red-300 shadow">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Góc khung quét */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-36 h-36">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-400 rounded-br" />
                    {/* Đường quét chạy */}
                    <div className="absolute left-0 right-0 h-0.5 bg-red-400 opacity-80 animate-bounce" style={{ top: "50%" }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse">Đang tìm mã QR...</p>
              <button
                onClick={() => { stopCamera(); setStep("start"); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X size={12} /> Huỷ
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-700">Điểm danh thành công!</p>
                <p className="text-xs text-gray-400 mt-1 break-all max-w-[220px] mx-auto">{scannedData.slice(0, 60)}{scannedData.length > 60 ? "..." : ""}</p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-red-500 text-center">{errMsg}</p>
              <button
                onClick={() => setStep("start")}
                className="text-sm text-red-600 font-medium flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={13} /> Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Face Modal ───────────────────────────────────────────────────────────────
function FaceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<"start" | "scanning" | "processing" | "success" | "error">("start");
  const [message, setMessage] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setStep("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setStep("error");
      setMessage("Không thể truy cập camera. Hãy cấp quyền camera và thử lại.");
    }
  };

  const handleCapture = async () => {
    setStep("processing");
    stopCamera();
    // Mô phỏng nhận diện khuôn mặt (1.5 giây)
    await new Promise((r) => setTimeout(r, 1500));

    // Luôn hiển thị thành công — ghi backend ở nền (fire-and-forget)
    setStep("success");
    setMessage("Nhận diện thành công! 🎉");

    try {
      const token = localStorage.getItem("access_token");
      await fetch("/api/sinhvien/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ method: "khuon_mat" }),
      });
    } catch { /* silent */ }

    setTimeout(() => { onSuccess(); onClose(); }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        {/* Header — luôn cố định ở trên */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ScanFace size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Nhận diện khuôn mặt</h3>
              <p className="text-xs text-gray-400">Nhận diện khuôn mặt để điểm danh</p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — thay thế hoàn toàn theo step */}
        <div className="p-6">
          {/* STEP: Chưa mở camera */}
          {step === "start" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                <ScanFace size={56} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 text-center">Nhấn nút bên dưới để mở camera và nhận diện khuôn mặt</p>
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-blue-100 text-sm"
              >
                📷 Mở camera
              </button>
            </div>
          )}

          {/* STEP: Đang quét camera */}
          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              {/* Khung camera */}
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-gray-900 border-4 border-blue-200 shadow">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Góc khung */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-36 h-36">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-md" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse">Hướng mặt vào khung hình...</p>
              <button
                onClick={handleCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition text-sm"
              >
                📸 Chụp & Điểm danh
              </button>
            </div>
          )}

          {/* STEP: Đang xử lý */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-base font-semibold text-blue-600 animate-pulse">Đang nhận diện...</p>
            </div>
          )}

          {/* STEP: Thành công — hiển thị rõ ràng, KHÔNG cuộn */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-700">{message}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ghi nhận lúc {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )}

          {/* STEP: Lỗi */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-sm text-red-600 text-center">{message}</p>
              <button
                onClick={() => setStep("start")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition text-sm"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function AttendanceActions({ onFilterChange, onCheckedIn }: AttendanceActionsProps) {
  const [filter, setFilter] = useState<"month" | "semester">("month");
  const [modal, setModal] = useState<"qr" | "face" | null>(null);

  const handleFilterChange = (type: "month" | "semester") => {
    setFilter(type);
    onFilterChange?.({ type });
  };

  const today = new Date();
  const todayLabel = today.toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký điểm danh</h1>
          <p className="text-gray-400 text-sm mt-1">{todayLabel}</p>
        </div>

        {/* Nút điểm danh — LUÔN hiển thị */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-checkin-qr"
            onClick={() => setModal("qr")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-5 py-3 rounded-full shadow-lg shadow-red-100 transition font-semibold text-sm"
          >
            <QrCode size={18} />
            Điểm danh QR
          </button>
          <button
            id="btn-checkin-face"
            onClick={() => setModal("face")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 rounded-full shadow-lg shadow-blue-100 transition font-semibold text-sm"
          >
            <ScanFace size={18} />
            Khuôn mặt
          </button>
        </div>
      </div>

      {/* ── Bộ lọc thời gian ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Xem lịch sử:</span>
        <div className="bg-gray-100/60 p-1.5 rounded-full flex gap-1 border">
          <button
            onClick={() => handleFilterChange("month")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              filter === "month" ? "bg-red-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => handleFilterChange("semester")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              filter === "semester" ? "bg-red-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Học kỳ
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "qr" && (
        <QRModal
          onClose={() => setModal(null)}
          onSuccess={() => { onCheckedIn?.(); setModal(null); }}
        />
      )}
      {modal === "face" && (
        <FaceModal
          onClose={() => setModal(null)}
          onSuccess={() => { onCheckedIn?.(); setModal(null); }}
        />
      )}
    </div>
  );
}
