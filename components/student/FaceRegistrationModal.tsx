"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScanFace, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/services/service/auth/auth.service";
import * as faceapi from "@vladmandic/face-api";

interface FaceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FaceRegistrationModal({ isOpen, onClose, onSuccess }: FaceRegistrationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [step, setStep] = useState<"start" | "scanning" | "processing" | "success" | "error">("start");
  const [message, setMessage] = useState("");
  const [captures, setCaptures] = useState<Float32Array[]>([]);

  // Load models from
  useEffect(() => {
    if (!isOpen) return;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Lỗi tải model AI:", err);
      }
    };
    
    if (!modelsLoaded) {
      loadModels();
    }
  }, [isOpen, modelsLoaded]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep("start");
      setCaptures([]);
    }
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (step === "scanning" && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [step]);

  const startCamera = async () => {
    if (!modelsLoaded) {
      setStep("error");
      setMessage("Hệ thống AI chưa sẵn sàng. Vui lòng chờ thêm giây lát rồi thử lại.");
      return;
    }
    setStep("scanning");
    setCaptures([]);
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
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setStep("error");
      setMessage("Camera chưa sẵn sàng hoặc bị lỗi khung hình, vui lòng thử lại.");
      return;
    }
    
    // Chụp lại khung hình hiện tại thành Canvas tĩnh trước khi chuyển sang bước processing (làm ẩn video)
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    setStep("processing");
    setMessage("Đang quét khuôn mặt...");

    try {
      // Phân tích khuôn mặt từ ảnh tĩnh (canvas) thay vì video đang chạy
      const detection = await faceapi.detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStep("error");
        setMessage("Không phát hiện thấy khuôn mặt. Vui lòng nhìn thẳng vào camera, đảm bảo đủ sáng và không bị che khuất.");
        return;
      }

      const newCaptures = [...captures, detection.descriptor];
      
      if (newCaptures.length < 3) {
        setCaptures(newCaptures);
        setStep("scanning"); // Return to scanning for the next capture
        return;
      }

      // We have 3 captures. Stop camera and process.
      stopCamera();
      setMessage("Đang so sánh và chuẩn hóa dữ liệu (3/3)...");

      // Compute distances and find the most representative vector
      let bestIndex = 0;
      let minDistanceSum = Infinity;

      for (let i = 0; i < newCaptures.length; i++) {
        let sumDist = 0;
        for (let j = 0; j < newCaptures.length; j++) {
          if (i !== j) {
            sumDist += faceapi.euclideanDistance(newCaptures[i], newCaptures[j]);
          }
        }
        if (sumDist < minDistanceSum) {
          minDistanceSum = sumDist;
          bestIndex = i;
        }
      }

      // Convert Float32Array to regular Array for JSON stringification
      const bestVector = Array.from(newCaptures[bestIndex]);

      // Call API
      const res = await apiFetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_embedding: bestVector }),
      });
      
      const json = await res.json();
      if (json.success) {
        setStep("success");
        setMessage("Đăng ký dữ liệu khuôn mặt thành công! 🎉");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setStep("error");
        setMessage(json.error || "Lỗi khi lưu dữ liệu khuôn mặt trên máy chủ.");
      }
    } catch (err) {
      console.error(err);
      setStep("error");
      setMessage("Lỗi xử lý khuôn mặt. Vui lòng thử lại.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ScanFace size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Đăng ký khuôn mặt</h3>
              <p className="text-xs text-gray-400">Yêu cầu chụp 3 lần để chuẩn hóa</p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === "start" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                <ScanFace size={56} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                {modelsLoaded ? "Nhấn nút bên dưới để mở camera. Quá trình yêu cầu chụp 3 lần liên tiếp." : "Đang khởi tạo hệ thống AI, vui lòng chờ..."}
              </p>
              <button
                onClick={startCamera}
                disabled={!modelsLoaded}
                className={`w-full font-bold py-3.5 rounded-2xl transition shadow-lg text-sm flex items-center justify-center gap-2 ${
                  modelsLoaded 
                  ? "bg-[#C25450] hover:bg-[#A9433F] active:scale-95 text-white shadow-red-100" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {modelsLoaded ? "📷 Bắt đầu lấy mẫu" : "Đang tải dữ liệu AI..."}
              </button>
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Tiến độ: {captures.length}/3
                </span>
                <span className="text-xs text-gray-400">Giữ thẳng đầu</span>
              </div>
              
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-gray-900 border-4 border-blue-200 shadow">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-36 h-36">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-md" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse text-center">
                Lần {captures.length + 1}: Hướng mặt vào khung hình và nhìn thẳng...
              </p>
              <button
                onClick={handleCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition text-sm shadow-lg shadow-blue-100"
              >
                📸 Chụp mẫu lần {captures.length + 1}
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-base font-semibold text-blue-600 animate-pulse text-center">{message}</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-700">{message}</p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-sm text-red-600 text-center">{message}</p>
              <button
                onClick={() => setStep(captures.length < 3 && captures.length > 0 ? "scanning" : "start")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Chụp lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
