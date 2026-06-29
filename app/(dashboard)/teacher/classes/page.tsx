"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubTab = "classes" | "schedule" | "documents";

interface ClassTaiLieuItem {
  matailieu: number;
  tieude: string;
  loai: string;
  duongdan: string;
  dungluong: number | null;
  luotxem: number;
  chopheptai: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  maphancong: number;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

interface LichItem {
  thutrongtuan: number; // 2=T2 ... 8=CN
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
}

interface LopItem {
  maphancong: number;
  malophoc: string;
  tenmon: string;
  mamon: string;
  sotinchi: number;
  tenlop: string;
  soSinhVien: number;
  lich: LichItem[];
  ngaybatdau: string | null;
  ngayketthuc: string | null;
}

interface LichTuanItem {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    ngaybatdau: string | null;
    ngayketthuc: string | null;
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}



interface HocKy {
  mahocky: number;
  tenhocky: string;
  namhoc: string;
  ky: number;
  danghieuluc: boolean;
}

interface ClassesData {
  dsLop: LopItem[];
  lichTuan: LichTuanItem[];
  dsTaiLieu?: ClassTaiLieuItem[];
  hockyList?: HocKy[];
  selectedHockyId?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const THU_LABEL: Record<number, string> = {
  2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4",
  5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật",
};
const THU_SHORT: Record<number, string> = {
  2: "T2", 3: "T3", 4: "T4", 5: "T5", 6: "T6", 7: "T7", 8: "CN",
};

function tietToTime(tiet: number): string {
  const total = 7 * 60 + (tiet - 1) * 60;
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}



// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherClasses() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>("classes");
  const [pageLoading, setPageLoading] = useState(true);
  const [data, setData] = useState<ClassesData | null>(null);
  const [selectedHk, setSelectedHk] = useState<number | null>(null);

  // Upload states
  const [selectedClassForUpload, setSelectedClassForUpload] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [filterClassId, setFilterClassId] = useState<string>("Tất cả");

  const uploadDocument = async (formData: FormData) => {
    try {
      const res = await apiFetch("/api/giangvien/classes/documents", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        loadData(selectedHk || undefined);
        return json.data;
      } else {
        throw new Error(json.error || "Không thể tải lên tài liệu");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const deleteDocument = async (matailieu: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    try {
      const res = await apiFetch(`/api/giangvien/classes/documents/${matailieu}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        loadData(selectedHk || undefined);
      } else {
        throw new Error(json.error || "Không thể xóa tài liệu");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  function formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return "—";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const loadData = (hkId?: number) => {
    setPageLoading(true);
    const url = hkId ? `/api/giangvien/classes?mahocky=${hkId}` : "/api/giangvien/classes";
    apiFetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          if (json.data.selectedHockyId) {
            setSelectedHk(json.data.selectedHockyId);
          }
        }
      })
      .catch((e) => console.error("Lỗi tải lớp học:", e))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleHockyChange = (hkId: number) => {
    setSelectedHk(hkId);
    loadData(hkId);
  };

  if (authLoading || pageLoading) {
    return (
      <div className="p-6 text-center text-fg-muted font-bold">
        Đang tải...
      </div>
    );
  }

  // Nhóm lịch tuần theo thứ (2–8) và lọc lịch đã kết thúc
  const currentHk = data?.hockyList?.find(h => h.mahocky === (selectedHk ?? data.selectedHockyId));
  const isActiveSemester = currentHk ? currentHk.danghieuluc : false;
  const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const lichTheoThu: Record<number, LichTuanItem[]> = {};
  for (const l of data?.lichTuan ?? []) {
    // Nếu là học kỳ hiện tại đang hoạt động, lọc bỏ các lớp đã kết thúc
    if (isActiveSemester && l.phancong) {
      const { ngaybatdau, ngayketthuc } = l.phancong;
      if (ngayketthuc && todayStr > ngayketthuc) continue;
      if (ngaybatdau && todayStr < ngaybatdau) continue;
    }

    if (!lichTheoThu[l.thutrongtuan]) lichTheoThu[l.thutrongtuan] = [];
    lichTheoThu[l.thutrongtuan].push(l);
  }
  const thuHomNay = (() => { const d = new Date().getDay(); return d === 0 ? 8 : d + 1; })();

  return (
    <DashboardShell pageTitle="Lớp học">
      <div className="flex flex-col gap-5">

        {/* Sub-tabs & Học kỳ Selector */}
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#F0E1D9] mb-5">
          <div className="flex gap-6">
            {[
              { key: "classes",  label: "Lớp học phần" },
              { key: "schedule", label: "Lịch dạy học" },
              { key: "documents", label: "Tài liệu môn học" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as SubTab)}
                className={`bg-transparent border-none py-2.5 px-1.5 text-[15px] cursor-pointer transition-all duration-200 ${tab === item.key ? "font-bold text-fg border-b-3 border-primary" : "font-medium text-fg-subtle border-b-3 border-transparent"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {data?.hockyList && data.hockyList.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[14px] font-semibold text-fg-muted">Học kỳ:</span>
              <select
                value={selectedHk ?? data.selectedHockyId ?? ""}
                onChange={(e) => handleHockyChange(Number(e.target.value))}
                className="py-1.5 px-3 rounded-lg border border-[#EAD9CB] bg-white text-fg-muted text-[14px] font-medium outline-none focus:border-primary cursor-pointer transition-colors"
              >
                {data.hockyList.map((hk) => (
                  <option key={hk.mahocky} value={hk.mahocky}>
                    {hk.tenhocky} ({hk.namhoc}){hk.danghieuluc ? " - Hiện tại" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ═══ TAB: LỚP HỌC PHẦN ═══════════════════════════════════════════ */}
        {tab === "classes" && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[20px] font-bold text-fg-muted m-0">
                  Lớp học đang giảng dạy
                </h2>
                <p className="text-[13px] text-fg-subtle mt-1 mb-0">
                  Các học phần được phân công giảng dạy
                </p>
              </div>
            </div>

            {!data?.dsLop?.length ? (
              <p className="text-center text-fg-subtle p-10 m-0">
                Chưa có lớp học nào được phân công
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
                {data.dsLop.map((c) => {
                  // Lịch đại diện: lấy buổi đầu tiên
                  const l0 = c.lich[0];
                  const scheduleStr = l0
                    ? `${THU_LABEL[l0.thutrongtuan]} (Tiết ${l0.tietbatdau}–${l0.tietketthuc})${l0.phonghoc ? ` | Phòng ${l0.phonghoc}` : ""}`
                    : "Chưa xếp lịch";
                  return (
                    <div key={c.maphancong} className="card p-5 flex flex-col gap-3.5 border border-[#F0E1D9]">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] bg-[#FFEAEA] text-red-500 py-1 px-2 rounded font-bold">
                          {c.malophoc}
                        </span>
                        <span className="text-[12px] text-fg-subtle">
                          {c.soSinhVien} sinh viên
                        </span>
                      </div>
                      <div>
                        <h3 className="my-1 text-base text-fg font-bold">
                          {c.tenmon}
                        </h3>
                        <p className="m-0 text-[13px] text-fg-subtle">
                          {c.tenlop} &bull; {c.sotinchi} tín chỉ
                        </p>
                      </div>
                      <div className="text-[12px] text-fg-subtle border-t border-dashed border-[#F0E1D9] pt-2.5">
                        <b>Lịch:</b> {scheduleStr}
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          className="flex-1 py-2 text-[12px] rounded-lg border border-[#EAD9CB] bg-white text-fg-muted font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push("/teacher/students")}
                        >
                          Sinh viên
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: LỊCH DẠY HỌC ══════════════════════════════════════════ */}
        {tab === "schedule" && (
          <div className="flex flex-col gap-5">

            {/* Lịch theo thứ trong tuần */}
            <section className="card p-5 border border-[#F0E1D9]">
              <h3 className="text-base mb-5 text-fg-muted font-bold m-0">
                Lịch dạy theo thứ
              </h3>
              <div className="overflow-x-auto w-full">
                <div className="grid grid-cols-7 border-t border-[#F0E1D9] min-w-[700px]">
                  {[2, 3, 4, 5, 6, 7, 8].map((thu, i) => {
                    const list = lichTheoThu[thu] ?? [];
                    const isToday = thu === thuHomNay;
                    return (
                      <div key={thu} className={`p-3.5 text-center ${i < 6 ? "border-r border-[#F0E1D9]" : ""} ${isToday ? "bg-[#FDF3F3]" : "bg-transparent"}`}>
                        <div className={`text-[13px] ${isToday ? "font-extrabold text-red-500" : "font-bold text-fg"}`}>
                          {THU_SHORT[thu]}
                        </div>
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          {list.length === 0 ? (
                            <span className="text-[11px] text-gray-300">—</span>
                          ) : list.map((l) => (
                            <div key={l.malichhoc} className="text-[11px] bg-[#FFEAEA] rounded-lg p-1.5 text-red-500 font-semibold">
                              {l.phancong?.monhoc?.tenmon ?? "—"}
                              <div className="text-fg-subtle font-normal mt-0.5">
                                T{l.tietbatdau}–T{l.tietketthuc}
                                {l.phonghoc ? ` | ${l.phonghoc}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Chi tiết lịch hôm nay */}
            <section className="card p-5 border border-[#F0E1D9]">
              <h3 className="text-base text-fg-muted mb-4 font-bold m-0">
                Lịch dạy hôm nay — {THU_LABEL[thuHomNay]}
              </h3>
              {!(lichTheoThu[thuHomNay]?.length) ? (
                <p className="text-fg-subtle text-[13px] m-0">Không có lịch dạy hôm nay</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {lichTheoThu[thuHomNay].map((l) => (
                    <div key={l.malichhoc} className="flex items-center justify-between p-3.5 rounded-xl border-l-[5px] border-l-[#F2A8A8] bg-white shadow-xs border border-[#F0E1D9]">
                      <div className="flex gap-5 items-center">
                        <span className="text-[14px] font-bold text-[#F2A8A8] w-[120px]">
                          Tiết {l.tietbatdau}–{l.tietketthuc}
                        </span>
                        <div>
                          <div className="font-bold text-[15px] text-fg">
                            {l.phancong?.monhoc?.tenmon ?? "—"}
                          </div>
                          <div className="text-[12px] text-fg-subtle mt-0.5">
                            {l.phancong?.lop?.tenlop ?? ""}{l.phonghoc ? ` | Phòng ${l.phonghoc}` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}



        {/* ═══ TAB: TÀI LIỆU MÔN HỌC ════════════════════════════════════════ */}
        {tab === "documents" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Form Upload */}
              <div className="card p-5 border border-[#F0E1D9] h-fit flex flex-col gap-4 bg-white rounded-xl shadow-sm">
                <h3 className="text-[16px] font-bold text-[#6B4F43] m-0">Tải lên tài liệu mới</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedClassForUpload) return alert("Vui lòng chọn lớp học!");
                    if (!selectedFile) return alert("Vui lòng chọn file!");
                    if (!documentTitle.trim()) return alert("Vui lòng nhập tiêu đề!");

                    setUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append("maphancong", selectedClassForUpload);
                      formData.append("tieude", documentTitle.trim());
                      formData.append("file", selectedFile);

                      await uploadDocument(formData);
                      alert("Tải lên tài liệu thành công!");
                      setDocumentTitle("");
                      setSelectedFile(null);
                      const fileInput = document.getElementById("doc-file-input") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    } catch {} finally {
                      setUploading(false);
                    }
                  }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#8B6F5F] uppercase">Lớp học phần *</label>
                    <select
                      required
                      value={selectedClassForUpload}
                      onChange={(e) => setSelectedClassForUpload(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] text-[#6B4F43] outline-none focus:border-[#F2A8A8] bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {data?.dsLop.map((cls) => (
                        <option key={cls.maphancong} value={cls.maphancong}>
                          {cls.tenmon} - {cls.tenlop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#8B6F5F] uppercase">Tiêu đề tài liệu *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ví dụ: Slide bài giảng chương 1"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#F0E1D9] text-[13px] text-[#6B4F43] outline-none focus:border-[#F2A8A8] bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#8B6F5F] uppercase">Chọn tệp tin *</label>
                    <input
                      required
                      type="file"
                      id="doc-file-input"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      className="text-[13px] file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-[#FFF8F5] file:text-[#6B4F43] file:border file:border-[#EAD9CB] hover:file:bg-[#FFF2EC]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full btn-teacher text-white border-none py-2.5 rounded-xl font-bold text-[13px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-75"
                  >
                    {uploading ? "Đang tải lên..." : "Tải tài liệu lên"}
                  </button>
                </form>
              </div>

              {/* List Documents */}
              <div className="col-span-1 lg:col-span-2 min-w-0 overflow-hidden flex flex-col gap-4 bg-white rounded-xl p-5 border border-[#F0E1D9] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0E1D9] pb-3">
                  <h3 className="text-[16px] font-bold text-[#6B4F43] m-0">Tài liệu môn học đã tải lên</h3>
                  
                  {/* Filter by class */}
                  <div className="flex items-center gap-2 w-full sm:w-auto min-w-0 overflow-hidden">
                    <span className="text-[13px] text-[#8B6F5F] font-semibold shrink-0">Lọc lớp:</span>
                    <select
                      value={filterClassId}
                      onChange={(e) => setFilterClassId(e.target.value)}
                      className="min-w-0 max-w-full w-full py-1.5 px-3 rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F43] text-[13px] font-medium outline-none focus:border-[#F2A8A8] cursor-pointer"
                    >
                      <option value="Tất cả">Tất cả lớp</option>
                      {data?.dsLop.map((cls) => (
                        <option key={cls.maphancong} value={cls.maphancong}>
                          {cls.tenmon} - {cls.tenlop}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Document cards */}
                {(() => {
                  const docs = (data?.dsTaiLieu || []).filter((doc) => {
                    return filterClassId === "Tất cả" || String(doc.maphancong) === filterClassId;
                  });

                  if (docs.length === 0) {
                    return (
                      <div className="text-center p-8 text-[#8B6F5F] text-[13px] bg-[#FDF8F5] rounded-xl border border-dashed border-[#F0E1D9]">
                        Chưa có tài liệu học tập nào được lưu trữ cho học kỳ này.
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-3">
                      {docs.map((doc) => (
                        <div
                          key={doc.matailieu}
                          className="flex flex-col sm:flex-row sm:items-center p-3.5 rounded-xl border border-[#F0E1D9] hover:shadow-xs transition-shadow bg-[#FDF8F5] gap-2"
                        >
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="m-0 text-[14px] font-bold text-[#6B4F43] break-words">{doc.tieude}</h4>
                            <p className="m-0 mt-1 text-[11px] text-[#8B6F5F] break-words">
                              Lớp: {doc.phancong?.monhoc?.tenmon} ({doc.phancong?.lop?.tenlop})
                              <span className="hidden sm:inline"> &bull; </span>
                              <span className="block sm:inline">Dung lượng: {formatBytes(doc.dungluong)}</span>
                            </p>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2 pt-2 sm:pt-0 border-t border-[#F0E1D9] sm:border-none mt-1 sm:mt-0 sm:shrink-0">
                            <a
                              href={doc.duongdan}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-white text-[#6B4F43] border border-[#EAD9CB] hover:bg-[#FFF2EC] transition-colors rounded-lg text-xs font-semibold cursor-pointer text-center no-underline flex items-center justify-center"
                            >
                              Tải về
                            </a>
                            <button
                              onClick={() => deleteDocument(doc.matailieu)}
                              className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-[#FFF2F2] text-red-500 border border-red-200 hover:bg-red-50 transition-colors rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
