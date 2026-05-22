import React from "react";
import { type AttendanceSubjectStat } from "@/services/repositories/sinhvien/diemdanh.repo";

export interface SubjectStatsRowProps {
  stat: AttendanceSubjectStat;
}

export function SubjectStatsRow({ stat }: SubjectStatsRowProps) {
  const attendRate = stat.total > 0 ? Math.round(((stat.coMat + stat.muon) / stat.total) * 100) : 0;
  const barColor = attendRate >= 80 ? "bg-green-500" : attendRate >= 60 ? "bg-orange-400" : "bg-red-500";
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{stat.tenmon}</h4>
          <p className="text-xs text-gray-400">{stat.tenhocky}</p>
        </div>
        <span className={`text-sm font-bold ${attendRate >= 80 ? "text-green-600" : attendRate >= 60 ? "text-orange-500" : "text-red-600"}`}>
          {attendRate}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${attendRate}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="font-bold text-green-600">{stat.coMat}</div>
          <div className="text-gray-400">Có mặt</div>
        </div>
        <div>
          <div className="font-bold text-orange-500">{stat.muon}</div>
          <div className="text-gray-400">Muộn</div>
        </div>
        <div>
          <div className="font-bold text-blue-500">{stat.vangCoPhep}</div>
          <div className="text-gray-400">V.CP</div>
        </div>
        <div>
          <div className="font-bold text-red-500">{stat.vangKhongPhep}</div>
          <div className="text-gray-400">V.KP</div>
        </div>
      </div>
    </div>
  );
}
