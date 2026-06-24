# 📋 Hướng Dẫn Chạy Thử Chức Năng Tạo Ca Thi

## 📁 Các file trong thư mục này

| File | Mô tả |
|------|-------|
| `bai_kiem_tra_mau.txt` | Đề thi mẫu 50 câu trắc nghiệm môn Cơ Sở Dữ Liệu |
| `test_tao_ca_thi.ps1` | Script PowerShell tự động gọi API tạo ca thi |
| `README.md` | File hướng dẫn này |

---

## ⚡ Cách test nhanh (2 bước)

### Bước 1 – Lấy JWT Token của tài khoản giảng viên

1. Chạy ứng dụng: `npm run dev`
2. Đăng nhập bằng tài khoản **Giảng Viên** tại `http://localhost:3000`
3. Mở **DevTools** (F12) → Tab **Application** → **Cookies** hoặc **Local Storage**
4. Tìm key `token` → Copy giá trị

### Bước 2 – Chạy script test

Mở PowerShell trong thư mục này và chạy:

```powershell
# Trước tiên, mở file script và điền 2 biến:
# $TOKEN = "eyJhb..."    ← Token vừa copy
# $MAPHANCONG = 5        ← Mã phân công thực tế trong DB của bạn

.\test_tao_ca_thi.ps1
```

---

## 🔍 Kiểm tra kết quả trong ứng dụng

Sau khi script chạy thành công:
- Vào trang **Quản lý Đề Thi** của giảng viên
- Bạn sẽ thấy đề thi vừa tạo: **"Kiểm tra Giữa Kỳ - Cơ Sở Dữ Liệu"**
- Đề thi có **50 câu trắc nghiệm** được AI phân tích từ file `.txt`

---

## 📄 Cấu trúc đề thi mẫu (`bai_kiem_tra_mau.txt`)

File `.txt` chứa **50 câu hỏi trắc nghiệm** về môn **Cơ Sở Dữ Liệu**, mỗi câu có:
- 4 đáp án (A, B, C, D)
- Đáp án đúng được đánh dấu bằng `(Đáp án đúng)`
- Điểm mặc định: **0.2 điểm/câu** (tổng: 10 điểm)

Ví dụ định dạng:
```
Câu 1: Mô hình dữ liệu nào dưới đây là phổ biến nhất?
A. Mô hình phân cấp
B. Mô hình quan hệ (Đáp án đúng)
C. Mô hình mạng
D. Mô hình hướng đối tượng
```

---

## 🔧 Thông số API

| Tham số | Giá trị mặc định trong script |
|---------|-------------------------------|
| `tieude` | Kiểm tra Giữa Kỳ - Cơ Sở Dữ Liệu |
| `thoigianlam` | 45 phút |
| `thoigianbatdau` | 5 phút kể từ lúc chạy script |
| `thoigianketthuc` | 2 giờ kể từ lúc chạy script |
| `matkhau` | qlsv2025 |
| `file` | bai_kiem_tra_mau.txt |

---

## ❗ Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `401 Unauthorized` | Token sai hoặc hết hạn | Đăng nhập lại, lấy token mới |
| `403 Forbidden` | Tài khoản không phải GiangVien | Dùng đúng tài khoản giảng viên |
| `400 Bad Request` | Thiếu thông tin | Kiểm tra `MAPHANCONG` có đúng không |
| `500 Server Error` | Lỗi Gemini AI | Kiểm tra `GEMINI_API_KEY` trong `.env.local` |

---

## 📌 Ghi chú

- File đề thi cũng hỗ trợ định dạng **PDF** và **DOCX** (ngoài TXT)
- Gemini AI sẽ tự động nhận diện câu hỏi và đáp án từ file
- Thời gian xử lý thường từ **5–30 giây** tùy độ lớn file
