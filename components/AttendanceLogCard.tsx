import { ChevronRight, QrCode, ScanFace, User } from "lucide-react";

export type TrangThai = "co_mat" | "vang_co_phep" | "vang_khong_phep" | "muon";
export type PhuongThuc = "qr" | "khuon_mat" | "thu_cong";

export interface LogEntry {
  madiemdanh?: number;
  day: string;
  month: string;
  subjectName: string;
  time: string;
  room: string;
  status: TrangThai | "success" | "late";
  notes?: string;
  phuongthuc?: PhuongThuc;
  giangvien?: string;
}

const STATUS_CONFIG: Record<string, { text: string; bgColor: string; textColor: string; dotColor: string }> = {
  co_mat:         { text: "Có mặt",       bgColor: "bg-green-50",  textColor: "text-green-700",  dotColor: "bg-green-500" },
  success:        { text: "Có mặt",       bgColor: "bg-green-50",  textColor: "text-green-700",  dotColor: "bg-green-500" },
  muon:           { text: "Đi muộn",      bgColor: "bg-orange-50", textColor: "text-orange-700", dotColor: "bg-orange-400" },
  late:           { text: "Đi muộn",      bgColor: "bg-orange-50", textColor: "text-orange-700", dotColor: "bg-orange-400" },
  vang_co_phep:   { text: "Vắng CP",      bgColor: "bg-blue-50",   textColor: "text-blue-700",   dotColor: "bg-blue-400" },
  vang_khong_phep:{ text: "Vắng KP",      bgColor: "bg-red-50",    textColor: "text-red-700",    dotColor: "bg-red-500" },
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  qr:        <QrCode size={11} />,
  khuon_mat: <ScanFace size={11} />,
  thu_cong:  <User size={11} />,
};
const METHOD_LABEL: Record<string, string> = {
  qr:        "QR Code",
  khuon_mat: "Khuôn mặt",
  thu_cong:  "Thủ công",
};

export default function AttendanceLogCard({ log }: { log: LogEntry }) {
  const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG["co_mat"];

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md hover:border-gray-200 group">
      <div className="flex items-center gap-4">
        {/* Badge ngày */}
        <div className="bg-gray-50 p-3 rounded-xl text-center border min-w-[52px]">
          <span className="text-xl font-bold text-gray-800 leading-none">{log.day}</span>
          <span className="text-[10px] text-gray-400 block mt-1 uppercase font-semibold tracking-wide">{log.month}</span>
        </div>

        {/* Thông tin môn */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition">{log.subjectName}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">⏰ {log.time}</span>
            {log.room && <span className="text-xs text-gray-400">📍 {log.room}</span>}
            {log.giangvien && <span className="text-xs text-gray-400 hidden sm:inline">👤 {log.giangvien}</span>}
          </div>
          {/* Phương thức điểm danh */}
          {log.phuongthuc && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {METHOD_ICON[log.phuongthuc]}
                {METHOD_LABEL[log.phuongthuc] ?? log.phuongthuc}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Badge trạng thái */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.bgColor} ${cfg.textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
          {cfg.text}
          {log.notes && <span className="text-[10px] font-normal opacity-70 hidden sm:inline">· {log.notes}</span>}
        </div>
        <ChevronRight size={18} className="text-gray-300 group-hover:text-red-400 transition" />
      </div>
    </div>
  );
}
