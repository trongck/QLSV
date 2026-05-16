"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/services/auth.service";
import { X, Search, BookOpen, User, FolderKanban, Unlink } from "lucide-react";

interface MonHocItem { maphancong: number; tenmon: string; hoten: string; }
interface GiangVienItem { magv: string; hoten: string; tenmon: string; }
interface DoanItem { mabaitap: number; tieude: string; tenmon: string; }

export interface CreateNoteResult {
  tieude: string;
  maphancong: number | null;
  magv: string | null;
  loaiGanKet: "none" | "monhoc" | "giangvien" | "doan";
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: CreateNoteResult) => void;
}

type Tab = "none" | "monhoc" | "giangvien" | "doan";

export default function CreateNoteModal({ open, onClose, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("none");
  const [tieude, setTieude] = useState("Nhật ký mới");
  const [search, setSearch] = useState("");
  const [monHocList, setMonHocList] = useState<MonHocItem[]>([]);
  const [giangVienList, setGiangVienList] = useState<GiangVienItem[]>([]);
  const [doanList, setDoanList] = useState<DoanItem[]>([]);
  const [selectedMaphancong, setSelectedMaphancong] = useState<number | null>(null);
  const [selectedMagv, setSelectedMagv] = useState<string | null>(null);
  const [selectedMabaitap, setSelectedMabaitap] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Mount check — tránh lỗi SSR với createPortal
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    setTab("none"); setTieude("Nhật ký mới"); setSearch("");
    setSelectedMaphancong(null); setSelectedMagv(null); setSelectedMabaitap(null);
    loadData();
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schRes, doanRes] = await Promise.all([
        apiFetch("/api/sinhvien/schedule"),
        apiFetch("/api/sinhvien/doan"),
      ]);
      const schJson = await schRes.json();
      const doanJson = await doanRes.json();

      if (schJson.success && Array.isArray(schJson.data)) {
        const seenMon = new Set<number>();
        const seenGv = new Set<string>();
        const monArr: MonHocItem[] = [];
        const gvArr: GiangVienItem[] = [];
        for (const item of schJson.data) {
          if (item.maphancong && !seenMon.has(item.maphancong)) {
            seenMon.add(item.maphancong);
            monArr.push({ maphancong: item.maphancong, tenmon: item.monhoc?.tenmon ?? `PC ${item.maphancong}`, hoten: item.giangvien?.hoten ?? "" });
          }
          if (item.magv && !seenGv.has(item.magv)) {
            seenGv.add(item.magv);
            gvArr.push({ magv: item.magv, hoten: item.giangvien?.hoten ?? item.magv, tenmon: item.monhoc?.tenmon ?? "" });
          }
        }
        setMonHocList(monArr);
        setGiangVienList(gvArr);
      }
      if (doanJson.success && Array.isArray(doanJson.data)) {
        setDoanList(doanJson.data.map((d: any) => ({
          mabaitap: d.mabaitap,
          tieude: d.tieude,
          tenmon: d.phancong?.monhoc?.tenmon ?? "",
        })));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleConfirm = () => {
    let maphancong: number | null = null;
    let magv: string | null = null;
    if (tab === "monhoc") maphancong = selectedMaphancong;
    if (tab === "giangvien") magv = selectedMagv;
    if (tab === "doan") maphancong = doanList.find(d => d.mabaitap === selectedMabaitap)?.mabaitap ?? null;

    onConfirm({ tieude: tieude.trim() || "Nhật ký mới", maphancong, magv, loaiGanKet: tab });
  };

  const q = search.toLowerCase();
  const filteredMon = monHocList.filter(m => m.tenmon.toLowerCase().includes(q));
  const filteredGv = giangVienList.filter(g => g.hoten.toLowerCase().includes(q));
  const filteredDoan = doanList.filter(d => d.tieude.toLowerCase().includes(q));

  if (!mounted || !open) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "none", label: "Không gắn", icon: <Unlink size={15} /> },
    { key: "monhoc", label: "Môn học", icon: <BookOpen size={15} /> },
    { key: "giangvien", label: "Giảng viên", icon: <User size={15} /> },
    { key: "doan", label: "Đồ án", icon: <FolderKanban size={15} /> },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Tạo nhật ký mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
        </div>

        {/* Title input */}
        <div className="px-6 pt-4 pb-2">
          <input
            type="text"
            value={tieude}
            onChange={e => setTieude(e.target.value)}
            placeholder="Tiêu đề nhật ký..."
            className="w-full text-xl font-bold text-gray-800 border-none outline-none placeholder:text-gray-300 bg-transparent"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Gắn kết với</p>
          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${tab === t.key ? "bg-[#E57373] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + List */}
        {tab !== "none" && (
          <div className="px-6 flex flex-col gap-2 flex-1 min-h-0 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 border-none" />
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1" style={{ maxHeight: 220 }}>
              {loading && <p className="text-xs text-gray-400 text-center py-4">Đang tải...</p>}
              {tab === "monhoc" && filteredMon.map(m => (
                <div key={m.maphancong} onClick={() => setSelectedMaphancong(m.maphancong)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedMaphancong === m.maphancong ? "bg-red-50 border border-red-200" : "hover:bg-gray-50 border border-transparent"}`}>
                  <BookOpen size={16} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.tenmon}</p>
                    {m.hoten && <p className="text-xs text-gray-400">{m.hoten}</p>}
                  </div>
                  {selectedMaphancong === m.maphancong && <span className="ml-auto w-2 h-2 rounded-full bg-red-400" />}
                </div>
              ))}
              {tab === "giangvien" && filteredGv.map(g => (
                <div key={g.magv} onClick={() => setSelectedMagv(g.magv)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedMagv === g.magv ? "bg-red-50 border border-red-200" : "hover:bg-gray-50 border border-transparent"}`}>
                  <User size={16} className="text-purple-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.hoten}</p>
                    {g.tenmon && <p className="text-xs text-gray-400">{g.tenmon}</p>}
                  </div>
                  {selectedMagv === g.magv && <span className="ml-auto w-2 h-2 rounded-full bg-red-400" />}
                </div>
              ))}
              {tab === "doan" && filteredDoan.length === 0 && !loading && (
                <p className="text-xs text-gray-400 text-center py-6">Không có đồ án nào</p>
              )}
              {tab === "doan" && filteredDoan.map(d => (
                <div key={d.mabaitap} onClick={() => setSelectedMabaitap(d.mabaitap)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedMabaitap === d.mabaitap ? "bg-red-50 border border-red-200" : "hover:bg-gray-50 border border-transparent"}`}>
                  <FolderKanban size={16} className="text-orange-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{d.tieude}</p>
                    {d.tenmon && <p className="text-xs text-gray-400">{d.tenmon}</p>}
                  </div>
                  {selectedMabaitap === d.mabaitap && <span className="ml-auto w-2 h-2 rounded-full bg-red-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 mt-auto">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Huỷ</button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#E57373] text-white text-sm font-semibold hover:bg-[#d32f2f] transition shadow-sm">
            Tạo nhật ký
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
