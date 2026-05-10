import { ChevronRight } from "lucide-react";

interface LogEntry {
  day: string;
  month: string;
  subjectName: string;
  time: string;
  room: string;
  status: "success" | "late";
  notes?: string;
}

export default function AttendanceLogCard({ log }: { log: LogEntry }) {
  const statusConfig = {
    success: {
      text: "CHÍNH XÁC",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    late: {
      text: "MUỘN 10P",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
  };

  const { text, bgColor, textColor } = statusConfig[log.status];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md hover:border-gray-200">
      <div className="flex items-center gap-4">
        {/* Badge ngày tháng */}
        <div className="bg-gray-50 p-4 rounded-xl text-center border">
          <span className="text-xl font-bold text-gray-800">{log.day}</span>
          <span className="text-xs text-gray-400 block mt-1 uppercase font-semibold">
            {log.month}
          </span>
        </div>

        {/* Thông tin môn */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {log.subjectName}
          </h3>
          <p className="text-xs text-gray-400 mt-1 flex gap-4">
            <span>📅 {log.time}</span>
            <span>📍 {log.room}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Trạng thái */}
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${bgColor} ${textColor}`}
        >
          {text}
          {log.notes && (
            <span className="block text-[10px] font-normal text-gray-400 mt-0.5">
              {log.notes}
            </span>
          )}
        </div>

        {/* Icon điều hướng */}
        <ChevronRight size={20} className="text-gray-300" />
      </div>
    </div>
  );
}
