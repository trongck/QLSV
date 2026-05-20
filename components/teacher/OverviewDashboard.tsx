"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThongBao {
  mathongbao: number;
  tieude: string;
  loai: string;
  ngaytao: string;
}

interface LichHoc {
  malichhoc: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

interface DashboardData {
  hoten: string;
  soLop: number;
  soSinhVien: number;
  soBaiTap: number;
  soBaiDaCham: number;
  tiLeDiemDanh: number | null;
  thongBaoMoi: ThongBao[];
  lichHomNay: LichHoc[];
}

// ─── Helper: tiết học → giờ hiển thị ─────────────────────────────────────────
// Tiết 1 bắt đầu 07:00, mỗi tiết 50 phút, nghỉ giữa 10 phút
function tietToTime(tiet: number): string {
  const START_MINUTES = 7 * 60; // 07:00
  const TIET_MINUTES = 50;
  const BREAK_MINUTES = 10;
  const total = START_MINUTES + (tiet - 1) * (TIET_MINUTES + BREAK_MINUTES);
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/giangvien/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Lỗi tải dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  // Xác định trạng thái buổi học theo tiết hiện tại
  const currentTiet = (() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const elapsed = minutes - 7 * 60;
    if (elapsed < 0) return 0;
    return Math.floor(elapsed / 60) + 1; // ước lượng tiết
  })();

  const getBadge = (tietBD: number, tietKT: number) => {
    if (currentTiet < tietBD) return { label: "Sắp diễn ra", color: "#F2A8A8", text: "#fff" };
    if (currentTiet <= tietKT) return { label: "Đang diễn ra", color: "#FFD8A8", text: "#8B5E3C" };
    return { label: "Đã kết thúc", color: "#eee", text: "#888" };
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  const tenGV = data?.hoten ?? user?.hoten ?? "Giảng viên";

  return (
    <>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: "25px", alignItems: "center", display: "flex" }}>
        <div style={{ flex: 1 }}>
          <h1 className={styles.greeting}>
            Xin chào, {tenGV}
          </h1>
          <p className={styles.date}>
            Chào mừng trở lại hệ thống quản lý học tập
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "15px" }}>
          <div className={styles.profile} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className={styles.avatar} style={{
                background: "#C25450",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {tenGV.charAt(0)}
              </div>
              <div style={{ textAlign: "left" }}>
                <div className={styles.profileName}>GV. {tenGV}</div>
                <div className={styles.profileRole}>Giảng viên</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS - 5 Cards */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <div className={`card ${styles.statCard}`}>
          <span className={styles.statLabel}>Lớp đang dạy</span>
          <span className={styles.statValue}>{data?.soLop ?? "—"}</span>
          <span className={styles.statSub}>Học kỳ hiện tại</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <span className={styles.statLabel}>Sinh viên</span>
          <span className={styles.statValue}>{data?.soSinhVien ?? "—"}</span>
          <span className={styles.statSub}>Đang theo học</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <span className={styles.statLabel}>Bài tập đã tạo</span>
          <span className={styles.statValue}>{data?.soBaiTap ?? "—"}</span>
          <span className={styles.statSub}>Tổng bài tập</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <span className={styles.statLabel}>Điểm danh hôm nay</span>
          <span className={styles.statValue}>
            {data?.tiLeDiemDanh != null ? `${data.tiLeDiemDanh}%` : "—"}
          </span>
          <span className={styles.statSub}>Tỉ lệ có mặt</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <span className={styles.statLabel}>Bài đã chấm</span>
          <span className={styles.statValue}>{data?.soBaiDaCham ?? "—"}</span>
          <span className={styles.statSub}>
            {data && data.soBaiTap > 0
              ? `Còn ${data.soBaiTap - data.soBaiDaCham} chưa chấm`
              : "Chưa có bài nộp"}
          </span>
        </div>
      </div>

      {/* GRID - 3 Columns Layout */}
      <div className={styles.dashboardGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>

        {/* LỊCH DẠY HÔM NAY */}
        <section className="card">
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Lịch dạy hôm nay</h2>
          </div>
          <div className={styles.cardBody}>
            {!data?.lichHomNay?.length ? (
              <p style={{ textAlign: "center", color: "#8B6F5F", fontSize: "13px", padding: "20px 0" }}>
                Không có lịch dạy hôm nay
              </p>
            ) : (
              data.lichHomNay.map((l) => {
                const badge = getBadge(l.tietbatdau, l.tietketthuc);
                return (
                  <div key={l.malichhoc} className={styles.scheduleItem}>
                    <div>
                      <strong>{l.phancong?.monhoc?.tenmon ?? "—"}</strong>
                      <p>
                        {tietToTime(l.tietbatdau)} - {tietToTime(l.tietketthuc + 1)}
                        {l.phonghoc ? ` | Phòng ${l.phonghoc}` : ""}
                      </p>
                      <p style={{ fontSize: "11px", color: "#8B6F5F" }}>
                        {l.phancong?.lop?.tenlop ?? ""}
                      </p>
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: "12px",
                      fontSize: "11px", fontWeight: "600",
                      background: badge.color, color: badge.text,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* THÔNG BÁO MỚI */}
        <section className="card">
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Thông báo mới</h2>
          </div>
          <ul className={styles.notifList}>
            {!data?.thongBaoMoi?.length ? (
              <li style={{ padding: "20px", textAlign: "center", color: "#8B6F5F", fontSize: "13px" }}>
                Chưa có thông báo
              </li>
            ) : (
              data.thongBaoMoi.map((tb) => {
                const dotColor =
                  tb.loai === "KhanCap" ? "#D65D5D" :
                  tb.loai === "HocVu" ? "#F4B6B6" : "#A8DDD3";
                return (
                  <li key={tb.mathongbao} className={styles.notifItem}>
                    <div className={styles.notifDot} style={{ background: dotColor }} />
                    <div>
                      <p className={styles.notifTitle}>{tb.tieude}</p>
                      <p className={styles.notifMeta}>{timeAgo(tb.ngaytao)}</p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* TỈ LỆ CHẤM BÀI */}
        <section className="card">
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Tỉ lệ chấm bài</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "20px" }}>
            {data && data.soBaiTap > 0 ? (() => {
              const pct = Math.round((data.soBaiDaCham / data.soBaiTap) * 100);
              return (
                <>
                  <div className={styles.chartCircle} style={{ margin: 0, width: "100px", height: "100px", fontSize: "20px" }}>
                    {pct}%
                  </div>
                  <div style={{ marginLeft: "20px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <span style={{ color: "#178A57" }}>Đã chấm: {data.soBaiDaCham}</span>
                    <span style={{ color: "#D65D5D" }}>Chưa chấm: {data.soBaiTap - data.soBaiDaCham}</span>
                    <span style={{ color: "#8B6F5F" }}>Tổng bài nộp: {data.soBaiTap}</span>
                  </div>
                </>
              );
            })() : (
              <p style={{ color: "#8B6F5F", fontSize: "13px" }}>Chưa có bài tập nào</p>
            )}
          </div>
        </section>

      </div>
    </>
  );
}
