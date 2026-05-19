"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/auth.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import styles from "../dashboard/teacher-dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubTab = "classes" | "schedule" | "materials";

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
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

interface TaiLieuItem {
  matailieu: number;
  tieude: string;
  loai: string;
  duongdan: string;
  dungluong: number | null;
  luotxem: number;
  chopheptai: boolean;
  ngaytao: string;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

interface ClassesData {
  dsLop: LopItem[];
  lichTuan: LichTuanItem[];
  dsTaiLieu: TaiLieuItem[];
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

const LOAI_COLOR: Record<string, string> = {
  File: "#2D9CDB", Video: "#9B51E0", Link: "#F2994A", Slide: "#EB5757",
};

const LOAI_EXT: Record<string, string> = {
  File: "FILE", Video: "VIDEO", Link: "LINK", Slide: "PPT",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherClasses() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>("classes");
  const [pageLoading, setPageLoading] = useState(true);
  const [data, setData] = useState<ClassesData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user) {
      apiFetch("/api/giangvien/classes")
        .then((r) => r.json())
        .then((json) => { if (json.success) setData(json.data); })
        .catch((e) => console.error("Lỗi tải lớp học:", e))
        .finally(() => setPageLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || pageLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#6B4F43", fontWeight: "bold" }}>
        Đang tải...
      </div>
    );
  }

  // Nhóm lịch tuần theo thứ (2–8)
  const lichTheoThu: Record<number, LichTuanItem[]> = {};
  for (const l of data?.lichTuan ?? []) {
    if (!lichTheoThu[l.thutrongtuan]) lichTheoThu[l.thutrongtuan] = [];
    lichTheoThu[l.thutrongtuan].push(l);
  }
  const thuHomNay = (() => { const d = new Date().getDay(); return d === 0 ? 8 : d + 1; })();

  return (
    <DashboardShell pageTitle="Lớp học">
      <div className={styles.page}>

        {/* Sub-tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid #F0E1D9", marginBottom: "20px", gap: "25px" }}>
          {[
            { key: "classes",   label: "Lớp học phần" },
            { key: "schedule",  label: "Lịch dạy học" },
            { key: "materials", label: "Kho bài giảng" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as SubTab)}
              style={{
                background: "none", border: "none", padding: "10px 5px",
                fontSize: "15px", fontWeight: tab === item.key ? "700" : "500",
                color: tab === item.key ? "#6B4F43" : "#8B6F5F",
                borderBottom: tab === item.key ? "3px solid #F2A8A8" : "3px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: LỚP HỌC PHẦN ═══════════════════════════════════════════ */}
        {tab === "classes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>
                  Lớp học đang giảng dạy
                </h2>
                <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>
                  Các học phần được phân công trong học kỳ hiện tại
                </p>
              </div>
            </div>

            {!data?.dsLop?.length ? (
              <p style={{ textAlign: "center", color: "#8B6F5F", padding: "40px" }}>
                Chưa có lớp học nào được phân công
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {data.dsLop.map((c) => {
                  // Lịch đại diện: lấy buổi đầu tiên
                  const l0 = c.lich[0];
                  const scheduleStr = l0
                    ? `${THU_LABEL[l0.thutrongtuan]} (Tiết ${l0.tietbatdau}–${l0.tietketthuc})${l0.phonghoc ? ` | Phòng ${l0.phonghoc}` : ""}`
                    : "Chưa xếp lịch";
                  return (
                    <div key={c.maphancong} className="card"
                      style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #F0E1D9" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", background: "#FFEAEA", color: "#EB5757", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                          {c.malophoc}
                        </span>
                        <span style={{ fontSize: "12px", color: "#8B6F5F" }}>
                          {c.soSinhVien} sinh viên
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#2D1B14", fontWeight: "bold" }}>
                          {c.tenmon}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#8B6F5F" }}>
                          {c.tenlop} &bull; {c.sotinchi} tín chỉ
                        </p>
                      </div>
                      <div style={{ fontSize: "12px", color: "#8B6F5F", borderTop: "1px dashed #F0E1D9", paddingTop: "10px" }}>
                        <b>Lịch:</b> {scheduleStr}
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}
                          onClick={() => router.push("/teacher/students")}
                        >
                          Sinh viên
                        </button>
                        <button
                          style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", fontWeight: "600" }}
                          onClick={() => setTab("materials")}
                        >
                          Bài giảng
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
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Lịch theo thứ trong tuần */}
            <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "20px", color: "#6B4F43", fontWeight: "bold" }}>
                Lịch dạy theo thứ
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: "1px solid #F0E1D9" }}>
                {[2, 3, 4, 5, 6, 7, 8].map((thu, i) => {
                  const list = lichTheoThu[thu] ?? [];
                  const isToday = thu === thuHomNay;
                  return (
                    <div key={thu} style={{
                      padding: "15px", textAlign: "center",
                      borderRight: i < 6 ? "1px solid #F0E1D9" : "none",
                      background: isToday ? "#FDF3F3" : "transparent",
                    }}>
                      <div style={{ fontSize: "13px", fontWeight: isToday ? "800" : "bold", color: isToday ? "#EB5757" : "#2D1B14" }}>
                        {THU_SHORT[thu]}
                      </div>
                      <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {list.length === 0 ? (
                          <span style={{ fontSize: "11px", color: "#ccc" }}>—</span>
                        ) : list.map((l) => (
                          <div key={l.malichhoc} style={{ fontSize: "11px", background: "#FFEAEA", borderRadius: "6px", padding: "4px 6px", color: "#EB5757", fontWeight: "600" }}>
                            {l.phancong?.monhoc?.tenmon ?? "—"}
                            <div style={{ color: "#8B6F5F", fontWeight: "400" }}>
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
            </section>

            {/* Chi tiết lịch hôm nay */}
            <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
              <h3 style={{ fontSize: "16px", color: "#6B4F43", marginBottom: "16px", fontWeight: "bold" }}>
                Lịch dạy hôm nay — {THU_LABEL[thuHomNay]}
              </h3>
              {!(lichTheoThu[thuHomNay]?.length) ? (
                <p style={{ color: "#8B6F5F", fontSize: "13px" }}>Không có lịch dạy hôm nay</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {lichTheoThu[thuHomNay].map((l) => (
                    <div key={l.malichhoc} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "15px", borderRadius: "12px", borderLeft: "5px solid #F2A8A8",
                      background: "#FFF", boxShadow: "0 2px 5px rgba(0,0,0,0.03)", border: "1px solid #F0E1D9",
                    }}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#F2A8A8", width: "120px" }}>
                          Tiết {l.tietbatdau}–{l.tietketthuc}
                        </span>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "15px" }}>
                            {l.phancong?.monhoc?.tenmon ?? "—"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#8B6F5F" }}>
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

        {/* ═══ TAB: KHO BÀI GIẢNG ════════════════════════════════════════ */}
        {tab === "materials" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>
                  Kho bài giảng & Học liệu
                </h2>
                <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>
                  Tài liệu từ tất cả lớp học phần đang giảng dạy
                </p>
              </div>
            </div>

            {!data?.dsTaiLieu?.length ? (
              <p style={{ textAlign: "center", color: "#8B6F5F", padding: "40px" }}>
                Chưa có tài liệu nào được tải lên
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                {data.dsTaiLieu.map((f) => {
                  const color = LOAI_COLOR[f.loai] ?? "#8B6F5F";
                  const ext = LOAI_EXT[f.loai] ?? f.loai;
                  return (
                    <div key={f.matailieu} className="card"
                      style={{ padding: "15px", border: "1px solid #F0E1D9", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" }}
                    >
                      <div style={{ width: "40px", height: "50px", background: color, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "10px" }}>
                        {ext}
                      </div>
                      <h4 style={{ fontSize: "13px", color: "#6B4F43", margin: 0, fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.tieude}
                      </h4>
                      <div style={{ fontSize: "11px", color: "#8B6F5F" }}>
                        {f.phancong?.monhoc?.tenmon ?? ""} &bull; {fmtDate(f.ngaytao)}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8B6F5F" }}>
                        {f.luotxem} lượt xem{f.dungluong ? ` | ${Math.round(f.dungluong / 1024)} KB` : ""}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <a
                          href={f.duongdan}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, padding: "6px", fontSize: "11px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "#FFF", color: "#6B4F43", cursor: "pointer", textAlign: "center", textDecoration: "none" }}
                        >
                          Xem
                        </a>
                        {f.chopheptai && (
                          <a
                            href={f.duongdan}
                            download
                            style={{ flex: 1, padding: "6px", fontSize: "11px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", textAlign: "center", textDecoration: "none", fontWeight: "600" }}
                          >
                            Tải
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
