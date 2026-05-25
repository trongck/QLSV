"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, X, CheckCircle, AlertCircle, RefreshCw, ChevronDown, Calendar, Upload, FileText } from "lucide-react";
import { apiFetch } from "@/services/service/auth/auth.service";

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
        const res = await apiFetch("/api/student/attendance/sessions");
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

  const handleQRScanned = async (data: string) => {
    stopCamera();
    let token = data;
    if (token.includes("token=")) {
      try {
        const url = new URL(token);
        token = url.searchParams.get("token") || token;
      } catch {}
    }

    let lat: number | null = null;
    let lng: number | null = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Không lấy được GPS:", err);
      }
    }

    try {
      const res = await apiFetch("/api/student/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "qr",
          qrToken: token,
          lat,
          lng
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setScannedData("Điểm danh thành công!");
        setStep("success");
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        setStep("error");
        setErrMsg(json.message || "Điểm danh thất bại. Vui lòng thử lại.");
      }
    } catch (e: any) {
      setStep("error");
      setErrMsg("Lỗi kết nối máy chủ. Vui lòng thử lại.");
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
      try {
        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          handleQRScanned(code.data);
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
                Mở camera quét QR
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
                <p className="text-xl font-bold text-green-700">{scannedData}</p>
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


// ─── Leave Request Modal ────────────────────────────────────────────────────────
interface LeaveSubjectSchedule {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  maphong: string;
}

interface LeaveSubject {
  maphancong: number;
  tenmon: string;
  mamon: string;
  schedules: LeaveSubjectSchedule[];
}

interface LeaveRequest {
  madon: number;
  lydo: string;
  minhchung: string | null;
  trangthai: "ChoDuyet" | "DaDuyet" | "TuChoi";
  ghichugv: string | null;
  ngaytao: string;
  buoihoc?: {
    ngayhoc: string;
    lichhoc?: {
      tietbatdau: number;
      tietketthuc: number;
      maphong: string;
      phancong?: {
        monhoc?: {
          tenmon: string;
          mamon: string;
        };
        giangvien?: {
          hodem: string;
          ten: string;
        };
      };
    };
  };
}

function LeaveRequestModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [subjects, setSubjects] = useState<LeaveSubject[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedPC, setSelectedPC] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState(""); // base64 data url
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch("/api/student/attendance/leave");
      const json = await res.json();
      if (json.success) {
        setSubjects(json.subjects ?? []);
        setRequests(json.requests ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn hình ảnh hợp lệ (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Dung lượng tối đa là 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setEvidence(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getDayName = (dow: number) => {
    if (dow === 8) return "Chủ nhật";
    return `Thứ ${dow}`;
  };

  const selectedSubject = subjects.find(s => s.maphancong === Number(selectedPC));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPC || !selectedDate || !reason) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ các trường" });
      return;
    }

    const parts = selectedDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dow = dateObj.getDay();
    const targetDow = dow === 0 ? 8 : dow + 1;

    const schedule = selectedSubject?.schedules?.find((s) => s.thutrongtuan === targetDow);
    if (!schedule) {
      setMessage({ type: "error", text: `Môn này không có lịch học vào ngày đã chọn (${getDayName(targetDow)})` });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/student/attendance/leave", {
        method: "POST",
        body: JSON.stringify({
          malichhoc: schedule.malichhoc,
          ngayhoc: selectedDate,
          lydo: reason,
          minhchung: evidence || null
        })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Đơn xin nghỉ phép đã được gửi thành công!" });
        setReason("");
        setEvidence("");
        setSelectedPC("");
        setSelectedDate("");
        loadData();
        setTimeout(() => {
          setActiveTab("history");
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: "error", text: json.message || "Gửi đơn xin nghỉ phép thất bại" });
      }
    } catch {
      setMessage({ type: "error", text: "Có lỗi xảy ra, vui lòng thử lại sau" });
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLORS = {
    ChoDuyet: "bg-amber-50 text-amber-700 border-amber-200",
    DaDuyet: "bg-green-50 text-green-700 border-green-200",
    TuChoi: "bg-red-50 text-red-700 border-red-200",
  };

  const STATUS_LABELS = {
    ChoDuyet: "Chờ duyệt",
    DaDuyet: "Đã duyệt",
    TuChoi: "Từ chối",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Calendar size={22} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Đơn xin nghỉ phép</h3>
              <p className="text-xs text-gray-400">Gửi đơn và theo dõi lịch sử nghỉ phép</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab("create"); setMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "create" ? "bg-amber-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Tạo đơn mới
          </button>
          <button
            onClick={() => { setActiveTab("history"); setMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "history" ? "bg-amber-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Lịch sử đơn ({requests.length})
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingData ? (
            <div className="flex justify-center items-center py-12 text-gray-400">
              <RefreshCw size={24} className="animate-spin text-amber-500" />
            </div>
          ) : activeTab === "create" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Môn học cần xin nghỉ</label>
                <select
                  value={selectedPC}
                  onChange={(e) => { setSelectedPC(e.target.value === "" ? "" : Number(e.target.value)); setMessage(null); }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 font-medium"
                  required
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map(s => (
                    <option key={s.maphancong} value={s.maphancong}>{s.tenmon} ({s.mamon})</option>
                  ))}
                </select>
              </div>

              {/* Subject schedules review */}
              {selectedSubject && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <p className="font-semibold flex items-center gap-1">Lịch học trong tuần:</p>
                  {selectedSubject.schedules?.length === 0 ? (
                    <p className="italic text-gray-400">Không tìm thấy lịch học cụ thể</p>
                  ) : (
                    selectedSubject.schedules.map((sch) => (
                      <p key={sch.malichhoc}>
                        • <strong>{getDayName(sch.thutrongtuan)}</strong>: Tiết {sch.tietbatdau}-{sch.tietketthuc} (Phòng {sch.maphong})
                      </p>
                    ))
                  )}
                </div>
              )}

              {/* Date Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Ngày nghỉ học</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setMessage(null); }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 font-medium"
                  required
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Lý do xin nghỉ</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết (ví dụ: bị ốm, việc gia đình bận...)"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 resize-none"
                  required
                />
              </div>

              {/* Evidence upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Minh chứng / Ảnh đính kèm (nếu có)</label>
                <div 
                  onClick={() => document.getElementById("evidence-upload-input")?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-amber-400 bg-gray-50/50 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    id="evidence-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Upload size={20} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-500">
                      {evidence ? "✓ Đã chọn ảnh minh chứng" : "Tải ảnh từ thiết bị (Tối đa 3MB)"}
                    </span>
                  </div>
                </div>
                {evidence && (
                  <div className="relative mt-2 border border-gray-100 rounded-2xl overflow-hidden p-2 bg-gray-50 flex items-center justify-between">
                    <img src={evidence} alt="Minh chứng" className="h-16 w-16 object-cover rounded-lg border border-gray-100" />
                    <button 
                      type="button" 
                      onClick={() => setEvidence("")}
                      className="text-xs text-red-500 font-semibold hover:underline px-3 py-1"
                    >
                      Xoá ảnh
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-sm border flex items-center gap-2 animate-in fade-in ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                  {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold rounded-2xl transition shadow-lg shadow-amber-100 text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Đang gửi đơn...
                  </>
                ) : (
                  "Gửi đơn xin nghỉ phép"
                )}
              </button>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-gray-400 text-sm">
                  <FileText size={40} strokeWidth={1.2} />
                  <span>Không tìm thấy đơn xin nghỉ nào</span>
                </div>
              ) : (
                requests.map((req) => {
                  const mon = req.buoihoc?.lichhoc?.phancong?.monhoc?.tenmon ?? "Môn học";
                  const ngay = req.buoihoc?.ngayhoc ?? "Chưa rõ";
                  const gv = req.buoihoc?.lichhoc?.phancong?.giangvien;
                  const gvName = gv ? [gv.hodem, gv.ten].filter(Boolean).join(" ") : "Giảng viên";
                  const createdDate = new Date(req.ngaytao).toLocaleDateString("vi-VN");

                  return (
                    <div key={req.madon} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{mon}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Ngày nộp: {createdDate}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[req.trangthai] || ""}`}>
                          {STATUS_LABELS[req.trangthai] || req.trangthai}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• <strong>Buổi học:</strong> Ngày {ngay} (Tiết {req.buoihoc?.lichhoc?.tietbatdau}-{req.buoihoc?.lichhoc?.tietketthuc})</p>
                        <p>• <strong>GV Phụ trách:</strong> {gvName}</p>
                        <p>• <strong>Lý do:</strong> {req.lydo}</p>
                      </div>

                      {/* Evidence image preview */}
                      {req.minhchung && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden p-1.5 bg-gray-50 inline-block">
                          <span className="text-[9px] text-gray-400 block mb-1">Ảnh minh chứng:</span>
                          <img src={req.minhchung} alt="Minh chứng" className="h-16 max-w-[200px] object-contain rounded-md" />
                        </div>
                      )}

                      {/* GV Response */}
                      {req.ghichugv && (
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600 mt-2">
                          <p className="font-semibold text-gray-700 flex items-center gap-1">Phản hồi của GV:</p>
                          <p className="italic text-gray-500 mt-0.5">{req.ghichugv}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
  const [modal, setModal] = useState<"qr" | "leave" | null>(null);

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

        {/* Nút điểm danh + Đơn xin nghỉ */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-leave-request"
            onClick={() => setModal("leave")}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-5 py-3 rounded-full shadow-lg shadow-amber-100 transition font-semibold text-sm"
          >
            <Calendar size={18} />
            Đơn xin nghỉ
          </button>
          <button
            id="btn-checkin-qr"
            onClick={() => setModal("qr")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-5 py-3 rounded-full shadow-lg shadow-red-100 transition font-semibold text-sm"
          >
            <QrCode size={18} />
            Điểm danh QR
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
      {modal === "leave" && (
        <LeaveRequestModal
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
