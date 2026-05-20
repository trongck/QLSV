import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface GradeRow {
  stt: number;
  mamon: string;
  tenmon: string;
  sotinchi: number;
  diem10: number | null;
  diem4: number | null;
  diemchu: string | null;
  dat: boolean;
}

interface ResultTableProps {
  data?: GradeRow[];
}

export default function ResultTable({ data = [] }: ResultTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
        <p className="text-gray-400 font-medium italic">Chưa có dữ liệu điểm cho học kỳ này.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-center border-collapse">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest text-left pl-6">Mã MH</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest text-left">Tên môn học</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest">Tín chỉ</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest">Điểm (10)</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest">Điểm (4)</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest">Điểm chữ</th>
            <th className="py-4 px-2 text-[10px] uppercase font-black tracking-widest pr-6">Kết quả</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="group hover:bg-gray-50/50 transition-all border-b border-gray-50 last:border-0"
            >
              <td className="py-5 px-2 text-left pl-6 font-bold text-gray-500 uppercase">{row.mamon}</td>
              <td className="py-5 px-2 text-left font-black text-gray-900">{row.tenmon}</td>
              <td className="py-5 px-2 font-bold text-gray-700">{row.sotinchi}</td>
              <td className="py-5 px-2">
                <span className={`px-3 py-1 rounded-full font-black text-xs ${row.diem10 !== null ? "bg-gray-100 text-gray-900" : "text-gray-300"}`}>
                    {row.diem10 !== null ? row.diem10.toFixed(2) : "—"}
                </span>
              </td>
              <td className="py-5 px-2 font-black text-gray-900">{row.diem4 !== null ? row.diem4.toFixed(1) : "—"}</td>
              <td className="py-5 px-2">
                <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs border ${
                    row.dat ? "bg-green-50 text-green-600 border-green-100" : row.diemchu ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-300 border-gray-100"
                }`}>
                    {row.diemchu ?? "—"}
                </div>
              </td>
              <td className="py-5 px-2 pr-6">
                <div className="flex justify-center">
                  {row.dat ? (
                    <CheckCircle2 className="text-green-500" size={18} />
                  ) : row.diem10 !== null ? (
                    <XCircle className="text-red-400" size={18} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-100" />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
