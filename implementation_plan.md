# Luồng Hoạt Động Thi Trực Tuyến — Implementation Plan (v2)

## Tổng quan luồng thời gian ca thi

```
Thời điểm GV tạo ca thi
        │
        ▼
[TRẠNG THÁI: Sắp tới] ← SV thấy thông báo, bài thi màu "Chưa đến giờ"
        │
        │  (thoigianbatdau - 5~10 phút)
        ▼
[CỬA PHÒNG CHỜ MỞ] ← SV có thể vào phòng chờ, chờ đến giờ chính thức
        │
        │  = thoigianbatdau
        ▼
[CA THI BẮT ĐẦU] ← SV ấn "Bắt đầu làm bài" → ghi thoigianvaothi, timer chạy
        │
        │  Timer của từng SV = min(thoigianlam, thoigianketthuc - now)
        │  SV vào sớm → làm đủ 60 phút  
        │  SV vào muộn 20 phút → chỉ còn 40 phút
        │
        │  = thoigianketthuc
        ▼
[CA THI KẾT THÚC] ← Tất cả bài đang làm bị tự động nộp (trangthai=HetGio)
        │            SV không nộp kịp → điểm theo câu đã làm (hoặc 0)
        ▼
[LỊCH SỬ CA THI] ← GV xem lại kết quả
```

---

## LUỒNG 1: Giảng Viên

```
[Bước A] Tạo ca thi
 ├── Chọn lớp học phần (maphancong)
 ├── Upload đề thi (AI parse)
 ├── Đặt: thoigianbatdau, thoigianketthuc, thoigianlam, thoigianchuanbi
 └── Ấn "Tạo" → Hệ thống:
       ├── Insert vào bảng dethi
       └── Gửi thông báo đến TẤT CẢ sinh viên trong lớp

[Bước B] Trước giờ thi (thoigianbatdau - thoigianchuanbi)
 └── GV thấy ca thi trong danh sách "Sắp diễn ra"

[Bước C] Ca thi đang diễn ra → Màn hình Thống kê
 ├── Bảng thống kê tổng:
 │     Tổng SV | Chưa vào | Vào phòng chờ | Đang làm | Đã nộp | Vi phạm
 ├── Danh sách từng SV:
 │     Họ tên | Mã SV | Trạng thái | Tiến trình (X/Y câu = Z%)
 │     [Chưa vào] = SV có trong danh sách nhưng chưa tạo ketquathi nào
 │     [Đang làm] = ketquathi.trangthai = DangLam
 │     [Đã nộp]   = ketquathi.trangthai = DaNop
 │     [Vi phạm]  = ketquathi.trangthai = ViPham
 ├── Dữ liệu cập nhật mỗi 10 giây (polling)
 └── Nút "Kết thúc ca thi ngay" → xác nhận → forceEnd

[Bước D] Kết thúc (tự động hoặc sớm)
 └── Tất cả bài DangLam → trangthai = HetGio
     Hệ thống tính điểm theo câu đã làm tại thời điểm đó

[Bước E] Sau thi — Lịch sử
 └── 2 danh sách trên cùng trang /teacher/exam:
       Tab "Sắp tới" — ca thi chưa đến thoigianketthuc
       Tab "Đã kết thúc" — lịch sử, xem chi tiết kết quả
```

---

## LUỒNG 2: Sinh Viên

```
[Trạng thái 0: Sắp tới]
 └── Nhận thông báo → thấy bài thi, nút "Chưa đến giờ" (disabled)

[Trạng thái 1: Phòng chờ mở - 5~10 phút trước thoigianbatdau]
 └── Nút "Vào phòng chờ" (active) → SV có thể click để vào màn hình chờ
     Màn hình chờ: đếm ngược đến giờ bắt đầu

[Trạng thái 2: Ca thi bắt đầu - thoigianbatdau đã qua]
 └── Nút "Bắt đầu làm bài" → SV xác nhận:
       ⚠️ "Khi ấn bắt đầu, KHÔNG được thoát. Thoát = Vi phạm = không vào lại."
       → Gọi API START → Insert ketquathi(trangthai=DangLam, thoigianvaothi=now)
       → Vào giao diện làm bài
       → Timer = min(thoigianlam * 60 giây, thoigianketthuc - now)

[Trạng thái 3: Đang làm bài]
 ├── Timer đếm ngược
 ├── Chọn đáp án (lưu local state)
 ├── Nếu rời tab (blur event):
 │     → Set trangthai=ViPham trong DB
 │     → Khóa UI: hiển thị modal "Bạn đã rời bài thi — Vi phạm"
 │     → Không cho tiếp tục, chỉ có thể thoát
 └── Nộp bài (ấn nút hoặc hết giờ):
       → Submit đáp án → tính điểm → trangthai=DaNop (hoặc HetGio nếu tự động)

[Trạng thái 4: Đã nộp / Vi phạm / Hết giờ]
 └── Hiển thị màn hình kết quả (điểm, số câu đúng)
     ViPham: hiển thị cảnh báo riêng
```

---

## Xử lý xung đột thời gian (QUAN TRỌNG)

### Công thức tính timer cho sinh viên:
```typescript
const now = Date.now();
const examEndMs = new Date(exam.thoigianketthuc).getTime();
const fullDurationSec = exam.thoigianlam * 60;
const timeRemainingToEnd = Math.floor((examEndMs - now) / 1000);

// Timer thực tế = min của 2 giá trị
const effectiveTimeSec = Math.min(fullDurationSec, timeRemainingToEnd);

// Nếu <= 0 → không cho vào (ca thi đã kết thúc)
if (effectiveTimeSec <= 0) → báo lỗi "Ca thi đã kết thúc"
```

### Kịch bản minh họa:
| Kịch bản | thoigianlam | Vào lúc | Còn lại đến hết giờ | Timer thực tế |
|----------|-------------|---------|---------------------|---------------|
| Đúng giờ | 60 phút | 8:00 | 60 phút (hết 9:00) | **60 phút** |
| Vào trễ 20' | 60 phút | 8:20 | 40 phút (hết 9:00) | **40 phút** |
| Vào đúng lúc sắp hết | 60 phút | 8:55 | 5 phút | **5 phút** |
| Sau khi hết giờ | 60 phút | 9:01 | -1 phút | **Bị từ chối** |

---

## Scoring System (Đã xác nhận)

- Điểm mỗi câu được AI đọc từ file upload và lưu vào `cauhoi.diem` — **đã hoạt động**
- Ví dụ: 50 câu trắc nghiệm → AI parse ra `diem = 0.2` mỗi câu → tổng 10 điểm
- Khi SV nộp bài: server so sánh `answers` vs `dapan.ladapandung=true` → tổng `diemtong`
- Logic tính điểm đã có trong `exam.service.ts` (sinhvien) → **giữ nguyên**

---

## Progress Tracking (Tiến trình realtime cho GV)

**Vấn đề**: Để GV thấy "SV A đã làm 5/10 câu (50%)" trong khi SV chưa nộp.

**Giải pháp**: Thêm cột `socauhoidalam INT DEFAULT 0` vào bảng `ketquathi` trong Supabase.
- SV chọn đáp án → client gửi progress update lên server (debounced 15 giây hoặc mỗi 5 câu)
- API `PATCH /api/student/exam/[id]` → cập nhật `socauhoidalam`
- Teacher polling 10s → đọc `socauhoidalam` của từng SV → hiển thị progress bar

> [!IMPORTANT]
> Cần thêm cột `socauhoidalam INT DEFAULT 0` vào bảng `ketquathi` trong Supabase Dashboard trước khi code.

---

## Open Questions (Còn lại)

> [!IMPORTANT]
> **Phòng chờ (Waiting Room)**: "5-10 phút" trước `thoigianbatdau` là do GV tự cài đặt khi tạo đề hay fix cứng 5 phút? 
> - Nếu GV cài đặt: cần thêm field `thoigianchuanbi INT DEFAULT 5` vào bảng `dethi`
> - Nếu fix cứng 5 phút: không cần sửa DB, chỉ cần hardcode trong frontend

> [!IMPORTANT]
> **Khi GV force-end**: Điểm SV đang làm tính theo câu đã làm (dựa vào `socauhoidalam`) hay tất cả bị 0 điểm?

---

## Proposed Changes

### Backend — Giảng Viên

#### [MODIFY] [exam.repo.ts (giangvien)](file:///e:/Thực tập chuyên ngành/QLSV/services/repositories/giangvien/exam.repo.ts)
Thêm các query:
- `getStudentsByPhanCong(maphancong)` — lấy danh sách SV + mataikhoan để gửi thông báo
- `getExamMonitoring(madethi)` — lấy tất cả `ketquathi` của ca thi + info SV
- `forceEndAllActive(madethi)` — UPDATE ketquathi SET trangthai=HetGio WHERE madethi=? AND trangthai=DangLam
- `getExamsByTeacher(magv)` — lấy tất cả ca thi (cả sắp tới lẫn đã kết thúc)

#### [MODIFY] [exam.service.ts (giangvien)](file:///e:/Thực tập chuyên ngành/QLSV/services/service/giangvien/exam.service.ts)
Thêm:
- `createExamAndNotify(magv, examData, questions)`:
  1. Gọi `createExamWithQuestions()`
  2. Lấy danh sách SV trong lớp (maphancong)
  3. Insert thông báo vào bảng `thongbao` (loai=Hoctap, doituong=SinhVien, malop=lớp đó)
- `getExamMonitoringData(magv, madethi)`:
  - Lấy danh sách tất cả SV trong lớp
  - Lấy `ketquathi` hiện tại của từng SV
  - Map: SV nào không có record → "Chưa vào"
  - Trả về thống kê + danh sách chi tiết từng SV
- `forceEndExam(magv, madethi)`:
  - Validate quyền GV
  - Gọi `forceEndAllActive(madethi)`
  - Cập nhật `thoigianketthuc = now` trên bảng `dethi`
- `getExamHistory(magv)`:
  - Lấy tất cả ca thi của GV
  - Phân loại: `upcoming` (thoigianketthuc > now) và `ended` (thoigianketthuc <= now)

#### [MODIFY] [route.ts (giangvien/exams)](file:///e:/Thực tập chuyên ngành/QLSV/app/api/giangvien/exams/route.ts)
- `POST`: gọi `createExamAndNotify` thay vì `createExamWithQuestions`

#### [MODIFY] [route.ts (giangvien/exams/[id])](file:///e:/Thực tập chuyên ngành/QLSV/app/api/giangvien/exams/[id]/route.ts)
- `GET`: trả về monitoring data của ca thi
- `PUT` action `FORCE_END`: gọi `forceEndExam`

---

### Backend — Sinh Viên

#### [MODIFY] [exam.repo.ts (sinhvien)](file:///e:/Thực tập chuyên ngành/QLSV/services/repositories/sinhvien/exam.repo.ts)
Thêm:
- `startExam(masv, madethi, thoigianvaothi)` — INSERT ketquathi với trangthai=DangLam
- `checkKetQua(masv, madethi)` — kiểm tra đã có record chưa (để ngăn vào lại)
- `markCheat(maketqua)` — UPDATE trangthai=ViPham

#### [MODIFY] [exam.service.ts (sinhvien)](file:///e:/Thực tập chuyên ngành/QLSV/services/service/sinhvien/exam.service.ts)
Thêm:
- `startExam(masv, madethi)`:
  1. Lấy info dethi (thoigianbatdau, thoigianketthuc)
  2. Validate: `now >= thoigianbatdau` → nếu sớm → lỗi "Ca thi chưa bắt đầu"
  3. Validate: `now <= thoigianketthuc` → nếu trễ → lỗi "Ca thi đã kết thúc"
  4. Check `checkKetQua(masv, madethi)` → nếu đã có record → lỗi "Bạn đã tham gia/vi phạm, không thể vào lại"
  5. Insert `ketquathi` với trangthai=DangLam, thoigianvaothi=now
  6. Trả về `effectiveTimeSec = min(thoigianlam*60, thoigianketthuc - now)`
- `markCheat(masv, madethi)`:
  - Tìm maketqua của SV với ca thi này (trangthai=DangLam)
  - UPDATE trangthai=ViPham

#### [MODIFY] [route.ts (student/exam/[id])](file:///e:/Thực tập chuyên ngành/QLSV/app/api/student/exam/[id]/route.ts)
- `POST` body `{ action: "START" }` → gọi `startExam`, trả về `effectiveTimeSec`
- `POST` body `{ action: "CHEAT" }` → gọi `markCheat`

---

### Frontend — Giảng Viên

#### [MODIFY] [ExamRoom.tsx](file:///e:/Thực tập chuyên ngành/QLSV/components/teacher/ExamRoom.tsx)
Cải tổ UI thành:

**Tab "Sắp tới"**: Danh sách ca thi chưa bắt đầu hoặc đang diễn ra
- Mỗi item: Tiêu đề | Môn học | Lớp | Giờ bắt đầu | Thời lượng | Trạng thái (Sắp tới / Đang diễn ra)
- Nút "Xem thống kê" (khi ca đang diễn ra) → mở màn thống kê
- Nút "Kết thúc sớm" (khi ca đang diễn ra)

**Tab "Đã kết thúc"**: Lịch sử ca thi
- Mỗi item: Tiêu đề | Môn học | Lớp | Thời gian | Tổng SV | Đã nộp | Vi phạm

**Màn hình Thống kê** (slide-in panel hoặc trang con):
- Thống kê tổng dạng card: Tổng / Chưa vào / Đang làm / Đã nộp / Vi phạm
- Bảng danh sách SV: Tên | Mã SV | Trạng thái (badge màu) | Tiến trình
- Tự động refresh mỗi 10 giây bằng `useInterval`
- Nút "Kết thúc ca thi ngay" với confirm dialog

#### [MODIFY] [useTeacherExams.ts](file:///e:/Thực tập chuyên ngành/QLSV/hooks/giangvien/useTeacherExams.ts)
Thêm:
- `getMonitoringData(madethi)` — fetch `/api/giangvien/exams/${id}` GET
- `forceEndExam(madethi)` — fetch PUT với action FORCE_END
- `getHistory()` — fetch lịch sử

---

### Frontend — Sinh Viên

#### [MODIFY] [useStudentExamSession.ts](file:///e:/Thực tập chuyên ngành/QLSV/hooks/sinhvien/useStudentExamSession.ts)
Thay đổi logic:
- State mới: `sessionPhase: 'loading' | 'waiting_room' | 'confirm_start' | 'in_progress' | 'cheating_locked' | 'finished'`
- `handleStart()`:
  1. Gọi `POST /api/student/exam/${id}` với `{ action: "START" }`
  2. Nhận về `effectiveTimeSec`
  3. Dùng `effectiveTimeSec` làm timer thay vì `thoigianlam * 60`
- Cheat detection:
  - Blur event → gọi `POST /api/student/exam/${id}` với `{ action: "CHEAT" }`
  - Set `sessionPhase = 'cheating_locked'`
  - UI bị khóa hoàn toàn

#### [MODIFY] [ExamSessionView.tsx](file:///e:/Thực tập chuyên ngành/QLSV/components/student/exam/ExamSessionView.tsx)
Thêm các màn hình theo phase:
- `waiting_room`: Đồng hồ đếm ngược đến `thoigianbatdau`, thông tin ca thi
- `confirm_start`: Cảnh báo "Không được thoát" + nút xác nhận
- `cheating_locked`: Modal đỏ "Bạn đã rời bài thi — Vi phạm quy chế thi"
- `in_progress`: UI làm bài hiện tại (với timer từ `effectiveTimeSec`)

#### [MODIFY] [page.tsx (sinhvien/test)](file:///e:/Thực tập chuyên ngành/QLSV/app/(dashboard)/sinhvien/test/page.tsx)
Cập nhật `getExamStatus()` để hiển thị đúng 5 trạng thái:
- `Chưa đến giờ` (now < thoigianbatdau - thoigianchuanbi)
- `Phòng chờ` (trong khoảng chuẩn bị)
- `Đang diễn ra` (now trong [thoigianbatdau, thoigianketthuc])
- `Đã nộp / Vi phạm / Hết giờ` (lấy từ ketquathi của SV)
- `Đã kết thúc` (now > thoigianketthuc, SV chưa có kết quả)

---

## Verification Plan

### Build Check
```bash
npx tsc --noEmit
npm run build
```

### Manual Test Flow
1. GV tạo ca thi → kiểm tra SV nhận thông báo
2. SV vào đúng giờ → timer = 60 phút
3. SV vào trễ 20 phút → timer = 40 phút  
4. SV cố vào sau `thoigianketthuc` → bị từ chối
5. SV blur tab → màn hình bị khóa, không vào lại được
6. GV xem thống kê → số liệu đúng (Chưa vào / Đang làm / Đã nộp)
7. GV force-end → tất cả DangLam → HetGio
8. Tab "Đã kết thúc" hiển thị ca thi vừa kết thúc
