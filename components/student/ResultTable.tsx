import React from "react";

// Dữ liệu mẫu dựa trên Ảnh 2
const mockData = [
  {
    stt: 1,
    id: "GT01023",
    name: "Cờ vua",
    credits: 1,
    score10: 6.0,
    score4: 2.0,
    letter: "C",
    passed: true,
  },
  {
    stt: 2,
    id: "KN01001",
    name: "Kỹ năng giao tiếp",
    credits: 2,
    score10: 7.6,
    score4: 3.0,
    letter: "B",
    passed: true,
  },
  {
    stt: 3,
    id: "KQ01211",
    name: "Quản trị học",
    credits: 3,
    score10: 7.2,
    score4: 3.0,
    letter: "B",
    passed: true,
  },
  {
    stt: 4,
    id: "KQ02209",
    name: "Quản trị doanh nghiệp",
    credits: 3,
    score10: 6.6,
    score4: 2.5,
    letter: "C+",
    passed: true,
  },
  {
    stt: 5,
    id: "MT01008",
    name: "Sinh thái môi trường",
    credits: 2,
    score10: 6.3,
    score4: 2.0,
    letter: "C",
    passed: true,
  },
  {
    stt: 6,
    id: "TH03115",
    name: "Phát triển ứng dụng GIS",
    credits: 3,
    score10: 7.1,
    score4: 3.0,
    letter: "B",
    passed: true,
  },
  {
    stt: 7,
    id: "TH03133",
    name: "Phát triển ứng dụng web",
    credits: 4,
    score10: 6.1,
    score4: 2.0,
    letter: "C",
    passed: true,
  },
];

export default function ResultTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-center border-collapse">
        {/* Tiêu đề bảng */}
        <thead className="bg-red-50 text-gray-700 font-semibold">
          <tr>
            <th className="py-4 px-2 rounded-tl-lg">Stt</th>
            <th className="py-4 px-2">Mã MH</th>
            <th className="py-4 px-2 text-left">Tên môn học</th>
            <th className="py-4 px-2">Tín chỉ</th>
            <th className="py-4 px-2">Điểm (10)</th>
            <th className="py-4 px-2">Điểm (4)</th>
            <th className="py-4 px-2">Điểm chữ</th>
            <th className="py-4 px-2 rounded-tr-lg">Kết quả</th>
          </tr>
        </thead>

        {/* Nội dung bảng */}
        <tbody>
          {mockData.map((row, index) => (
            <tr
              key={index}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-2 text-gray-400">{row.stt}</td>
              <td className="py-4 px-2 font-medium">{row.id}</td>
              <td className="py-4 px-2 text-left">{row.name}</td>
              <td className="py-4 px-2">{row.credits}</td>
              <td className="py-4 px-2">{row.score10.toFixed(1)}</td>
              <td className="py-4 px-2">{row.score4.toFixed(1)}</td>
              <td className="py-4 px-2 font-medium">{row.letter}</td>
              <td className="py-4 px-2 flex justify-center">
                {row.passed && (
                  /* Icon dấu tick xanh */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
