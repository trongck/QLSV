"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import * as faceapi from "@vladmandic/face-api";

// Synthesize beep via browser Web Audio API for satisfying user experience
function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    // Arpeggio sound: low frequency then high frequency
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio context might be blocked or unsupported
    console.log("Audio feedback error:", e);
  }
}

interface StudentAttendance {
  mssv: string;
  name: string;
  status: string;
  type: string;
  time: string;
  note: string;
  face_embedding?: number[] | null;
}

interface FaceAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: StudentAttendance[];
  onMarkPresent: (mssv: string) => Promise<void>;
  className?: string;
}

export function FaceAttendanceModal({ isOpen, onClose, roster, onMarkPresent }: FaceAttendanceModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraState, setCameraState] = useState<"loading" | "active" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [scannedHistory, setScannedHistory] = useState<{ mssv: string; name: string; time: string }[]>([]);
  const [currentMatch, setCurrentMatch] = useState<{ name: string; mssv: string; distance: number } | null>(null);
  const [matchStatus, setMatchStatus] = useState<"idle" | "matching" | "success" | "cooldown">("idle");


  // Filter roster to find students who actually have face registration data
  const registeredStudents = roster.filter(s => s.face_embedding && Array.isArray(s.face_embedding) && s.face_embedding.length > 0);

  // Sử dụng Refs để lưu trữ dữ liệu động, tránh re-render làm restart camera
  const registeredStudentsRef = useRef(registeredStudents);
  const onMarkPresentRef = useRef(onMarkPresent);
  const lastScannedMssvRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Đồng bộ Refs với Props và State mới nhất
  useEffect(() => {
    registeredStudentsRef.current = registeredStudents;
  }, [registeredStudents]);

  useEffect(() => {
    onMarkPresentRef.current = onMarkPresent;
  }, [onMarkPresent]);

  // Load models from CDN (same as student side for compatibility)
  useEffect(() => {
    if (!isOpen) return;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models/"; // Tải model từ server nội bộ thay vì CDN nước ngoài để tăng tốc
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Lỗi tải model AI:", err);
        setCameraState("error");
        setErrorMessage("Không thể tải các mô hình nhận diện khuôn mặt. Vui lòng kiểm tra kết nối mạng.");
      }
    };
    
    if (!modelsLoaded) {
      loadModels();
    }
  }, [isOpen, modelsLoaded]);

  // Clean up camera stream and scanner interval
  const stopCameraAndScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn("Lỗi khi giải phóng video element:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCameraAndScanning();
      const timer = setTimeout(() => {
        setScannedHistory([]);
        setCurrentMatch(null);
        setMatchStatus("idle");
      }, 0);
      lastScannedMssvRef.current = null;
      lastScannedTimeRef.current = 0;
      return () => clearTimeout(timer);
    }
  }, [isOpen, stopCameraAndScanning]);

  // Real-time face scanner matching
  const performFaceScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || video.readyState < 2) return;

    try {
      // 1. Detect single face with landmarks & descriptor
      const detection = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        // No face found in current frame
        return;
      }

      setMatchStatus("matching");
      const detectedDescriptor = detection.descriptor;
      
      let bestMatch: { student: StudentAttendance; distance: number } | null = null;
      let minDistance = Infinity;

      // 2. Perform Euclidean distance matching against all registered students in the classroom
      const currentStudents = registeredStudentsRef.current;
      for (const student of currentStudents) {
        if (!student.face_embedding) continue;
        
        // Convert stored number[] back to Float32Array
        const savedDescriptor = new Float32Array(student.face_embedding);
        const distance = faceapi.euclideanDistance(detectedDescriptor, savedDescriptor);
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { student, distance };
        }
      }

      // 3. Evaluate match using a standard strict threshold (0.55)
      if (bestMatch && minDistance <= 0.55) {
        const matchedSv = bestMatch.student;
        const now = Date.now();

        // Prevent repeated scans of the same student within 5 seconds cooldown
        if (lastScannedMssvRef.current === matchedSv.mssv && (now - lastScannedTimeRef.current) < 5000) {
          setMatchStatus("cooldown");
          return;
        }

        // Match found!
        setCurrentMatch({
          name: matchedSv.name,
          mssv: matchedSv.mssv,
          distance: minDistance
        });
        setMatchStatus("success");
        lastScannedMssvRef.current = matchedSv.mssv;
        lastScannedTimeRef.current = now;

        // Update database and parent local state to "Có mặt"
        await onMarkPresentRef.current(matchedSv.mssv);

        // Play subtle custom success sound (synthesized via Web Audio API, works in all modern browsers without asset loading!)
        playSuccessBeep();

        // Add to scanned history log in modal
        const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setScannedHistory(prev => [
          { mssv: matchedSv.mssv, name: matchedSv.name, time: timeStr },
          ...prev
        ]);
        
        // Reset status message after a short delay
        setTimeout(() => {
          setMatchStatus("idle");
          setCurrentMatch(null);
        }, 3000);
      } else {
        // Face detected but not matched to anyone registered with enough confidence
        setMatchStatus("idle");
      }
    } catch (err) {
      console.error("Lỗi quét khuôn mặt:", err);
    }
  }, []);

  // Start camera and begin scanning loop
  const startCameraAndScanning = useCallback(async () => {
    if (!modelsLoaded) return;
    
    setCameraState("loading");
    setErrorMessage("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraState("active");
      
      // Start processing loop (every 600ms to balance accuracy and CPU load)
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(() => {
        performFaceScan();
      }, 600);
      
    } catch (err) {
      console.error(err);
      setCameraState("error");
      setErrorMessage("Không thể mở camera. Hãy chắc chắn rằng bạn đã cấp quyền truy cập camera.");
    }
  }, [modelsLoaded, performFaceScan]);

  // Trigger camera start when models are ready and modal is open
  useEffect(() => {
    if (isOpen && modelsLoaded) {
      const timer = setTimeout(() => {
        startCameraAndScanning();
      }, 0);
      return () => {
        clearTimeout(timer);
        stopCameraAndScanning();
      };
    }
    return () => {
      stopCameraAndScanning();
    };
  }, [isOpen, modelsLoaded, startCameraAndScanning, stopCameraAndScanning]);




  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(45, 27, 20, 0.55)", backdropFilter: "blur(8px)" }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative"
        style={{ border: "1px solid #EAD9CB", height: "auto", maxHeight: "90vh" }}
      >
        {/* Close Button */}
        <button
          onClick={() => { stopCameraAndScanning(); onClose(); }}
          className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 transition shadow text-lg font-bold"
        ></button>

        {/* LEFT COLUMN: Camera Stream and Real-time matches */}
        <div className="flex-[5] bg-[#FAF5F2] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#EAD9CB] min-h-[450px]">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#6B4F43]">Điểm danh bằng khuôn mặt</h3>
                <p className="text-xs text-[#8B6F5F]">Quét camera để tự động đối chiếu cơ sở dữ liệu học phần</p>
              </div>
            </div>

            {/* Camera viewport container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 border-2 border-[#EAD9CB] shadow-inner flex items-center justify-center">
              
              {/* Active Video Stream (Luôn mount trong DOM để tránh race-condition videoRef bị null) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraState === "active" ? "block" : "hidden"}`}
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Scanning visual guide - Laser line scanning effect */}
              {cameraState === "active" && matchStatus !== "success" && (
                <div 
                  className="absolute left-0 w-full h-[3px] bg-red-400 opacity-60 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none"
                  style={{
                    animation: "scanLine 2.5s infinite linear",
                    top: "0%"
                  }}
                />
              )}

              {/* Glowing camera border effect on Match Success */}
              {matchStatus === "success" && (
                <div className="absolute inset-0 border-8 border-green-500/80 animate-pulse pointer-events-none" />
              )}

              {/* Overlay states */}
              {(!modelsLoaded || cameraState === "loading") && (
                <div className="absolute inset-0 bg-[#2D1B14]/80 flex flex-col items-center justify-center gap-4 text-white p-6">
                  <div className="w-12 h-12 border-4 border-[#F2A8A8] border-t-white rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse text-center">
                    {!modelsLoaded ? "Đang tải dữ liệu mô hình AI..." : "Đang khởi tạo Camera..."}
                  </p>
                </div>
              )}

              {cameraState === "error" && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center gap-4 text-white p-6 text-center">
                  <p className="text-sm font-semibold max-w-xs">{errorMessage}</p>
                  <button
                    onClick={startCameraAndScanning}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Matches Info Status Box */}
          <div className="mt-4">
            {matchStatus === "success" && currentMatch ? (
              <div 
                className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-4 animate-scaleUp"
                style={{ boxShadow: "0 6px 20px rgba(74, 222, 128, 0.15)" }}
              >
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-green-700 uppercase tracking-widest bg-green-100 px-2 py-0.5 rounded-md">Khớp 100%</span>
                    <span className="text-xs text-gray-400">Độ lệch: {currentMatch.distance.toFixed(3)}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#6B4F43] mt-1">{currentMatch.name}</h4>
                  <p className="text-xs text-gray-500">Mã sinh viên: <strong className="text-green-700">{currentMatch.mssv}</strong> • Đã cập nhật chuyên cần!</p>
                </div>
              </div>
            ) : matchStatus === "cooldown" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-[#6B4F43] text-sm">
                <span>Nhận diện sinh viên trùng lặp, hãy chờ vài giây trước khi quét lại.</span>
              </div>
            ) : matchStatus === "matching" ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3 text-blue-700 text-sm">
                <span>Đang phân tích và so khớp khuôn mặt...</span>
              </div>
            ) : (
              <div className="bg-[#FFF8F5] border border-[#F0E1D9] rounded-2xl p-3.5 flex items-center gap-3 text-[#8B6F5F] text-sm">
                <span>Hãy đưa khuôn mặt sinh viên vào trước camera để bắt đầu điểm danh.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Roster Statistics and Scanning Audit Log */}
        <div className="flex-[4] p-6 flex flex-col justify-between h-full min-h-[400px]">
          <div>
            {/* Statistics Row */}
            <div className="bg-[#FAF5F2] border border-[#F0E1D9] rounded-2xl p-4 mb-5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#6B4F43]">Dữ liệu khuôn mặt</h4>
                <p className="text-xs text-[#8B6F5F]">Đã đăng ký hệ thống</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-[#C25450]">
                  {registeredStudents.length}
                </span>
                <span className="text-xs text-gray-400">/{roster.length} SV</span>
              </div>
            </div>

            {/* Scanned Log title */}
            <h4 className="text-sm font-bold text-[#6B4F43] mb-3 flex items-center gap-2">
               Nhật ký quét vừa rồi ({scannedHistory.length})
            </h4>

            {/* Audit Log list */}
            <div 
              className="overflow-y-auto pr-1 flex flex-col gap-2.5"
              style={{ maxHeight: "280px" }}
            >
              {scannedHistory.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-2xl py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                  Chưa có sinh viên nào được điểm danh trong ca này.
                </div>
              ) : (
                scannedHistory.map((item, idx) => (
                  <div 
                    key={item.mssv + "-" + idx} 
                    className="flex items-center justify-between p-3 bg-green-50/60 hover:bg-green-50 border border-green-100 rounded-xl transition duration-150 animate-slideRight"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[#6B4F43]">{item.name}</h5>
                      <p className="text-[10px] text-gray-400">Mã SV: {item.mssv}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Có mặt</span>
                      <p className="text-[9px] text-gray-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-[#F0E1D9] pt-4 mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  stopCameraAndScanning();
                  startCameraAndScanning();
                }}
                className="px-4 py-2 border border-[#EAD9CB] hover:bg-[#FAF5F2] text-[#6B4F43] rounded-xl text-xs font-bold transition"
              >
                Khởi động lại
              </button>
            </div>
            
            <button
              onClick={() => { stopCameraAndScanning(); onClose(); }}
              className="px-5 py-2.5 btn-teacher text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/30 hover:scale-95 transition"
            >
              Hoàn tất điểm danh
            </button>
          </div>
        </div>
      </div>
      
      {/* Dynamic Keyframes injected locally */}
      <style jsx global>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideRight {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
