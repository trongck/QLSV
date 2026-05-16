import React from "react";
import ResultTable from "@/components/ResultTable";

export default function StudentGradesPage() {
  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {/* 3 Thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            GPA Theo Học Kỳ
          </p>
          <h2 className="text-4xl font-bold text-gray-800">2.50</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Tỉ lệ chuyên cần
          </p>
          <h2 className="text-4xl font-bold text-gray-800">98.5%</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Tổng tín chỉ đạt
          </p>
          <h2 className="text-4xl font-bold text-gray-800">15</h2>
        </div>
      </div>

      {/* Bảng điểm chi tiết */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-2">
        <h3 className="text-base font-semibold text-gray-800 mb-6">
          Học kỳ 1 - Năm học 2024 - 2025
        </h3>

        {/* Gọi component bảng điểm ra đây */}
        <ResultTable />
      </div>
    </div>
  );
}
