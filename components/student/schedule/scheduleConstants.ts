export const DAYS = [
  { thu: 2, label: "Thứ 2" },
  { thu: 3, label: "Thứ 3" },
  { thu: 4, label: "Thứ 4" },
  { thu: 5, label: "Thứ 5" },
  { thu: 6, label: "Thứ 6" },
  { thu: 7, label: "Thứ 7" },
  { thu: 8, label: "CN" },
];

export const TIET_SLOTS = [
  { label: "Tiết 1", tietStart: 1, tietEnd: 1, time: "07:00 - 07:50" },
  { label: "Tiết 2", tietStart: 2, tietEnd: 2, time: "07:55 - 08:45" },
  { label: "Tiết 3", tietStart: 3, tietEnd: 3, time: "08:50 - 09:40" },
  { label: "Tiết 4", tietStart: 4, tietEnd: 4, time: "09:55 - 10:45" },
  { label: "Tiết 5", tietStart: 5, tietEnd: 5, time: "10:50 - 11:40" },
  { label: "Tiết 6", tietStart: 6, tietEnd: 6, time: "12:45 - 13:35" },
  { label: "Tiết 7", tietStart: 7, tietEnd: 7, time: "13:40 - 14:30" },
  { label: "Tiết 8", tietStart: 8, tietEnd: 8, time: "14:35 - 15:25" },
  { label: "Tiết 9", tietStart: 9, tietEnd: 9, time: "15:40 - 16:30" },
  { label: "Tiết 10", tietStart: 10, tietEnd: 10, time: "16:35 - 17:25" },
];

export const SUBJECT_COLORS = [
  "bg-red-50 text-red-700 border-red-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

export function getColor(maphancong: number): string {
  return SUBJECT_COLORS[maphancong % SUBJECT_COLORS.length];
}
