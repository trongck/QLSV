import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 h-[90px] bg-[#f6ede8] border-b border-[#ece6e1] flex items-center justify-between px-8 z-40">
      <div>
        <h2 className="text-3xl font-bold">Chào, An 👋</h2>
        <p className="text-[#777] mt-1">Thứ Hai, 04/05/2026</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <Bell />

          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>

        <div className="bg-white px-5 py-3 rounded-2xl font-semibold">
          SV25A001
        </div>
      </div>
    </header>
  );
}
