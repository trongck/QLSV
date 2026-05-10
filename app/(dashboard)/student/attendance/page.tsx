import AttendanceActions from "@/components/AttendanceActions";
import AttendanceLogCard from "@/components/AttendanceLogCard";

// Dữ liệu mẫu nhật ký
const mockLogs: any[] = [
  {
    day: "10",
    month: "T05",
    subjectName: "Toán cao cấp 1",
    time: "07:05:22",
    room: "A203",
    status: "success",
    notes: "Đã xác thực GPS",
  },
  {
    day: "05",
    month: "T05",
    subjectName: "Lập trình cơ bản",
    time: "09:10:15",
    room: "B101",
    status: "late",
    notes: "Đã xác thực GPS",
  },
  {
    day: "04",
    month: "T05",
    subjectName: "Tiếng Anh 2",
    time: "11:02:01",
    room: "C202",
    status: "success",
    notes: "Đã xác thực GPS",
  },
];

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-10 w-full p-8 bg-gray-50/50 min-h-screen">
      {/* PHẦN HEADER VÀ HÀNH ĐỘNG */}
      <AttendanceActions />

      {/* DANH SÁCH NHẬT KÝ */}
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Lịch sử điểm danh gần đây
        </h2>

        {mockLogs.map((log, index) => (
          <AttendanceLogCard key={index} log={log} />
        ))}
      </div>
    </div>
  );
}
