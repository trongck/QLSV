# Database Table Relationships

<div align="center">

![Database](https://img.shields.io/badge/Database-Schema-0A84FF?style=for-the-badge&logo=postgresql&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-34C759?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-FF9F0A?style=for-the-badge)

**Tài liệu mô tả các mối quan hệ giữa các bảng trong hệ thống cơ sở dữ liệu**

</div>

---

## Mục lục

- [Quan hệ 1-1 (One-to-One)](#-quan-hệ-1-1-one-to-one)
- [Quan hệ 1-N (One-to-Many)](#-quan-hệ-1-n-one-to-many)
- [Quan hệ N-N (Many-to-Many)](#-quan-hệ-n-n-many-to-many-qua-bảng-trung-gian)

---

## Quan hệ 1-1 (One-to-One)

> Mỗi bản ghi trong **Bảng A** tương ứng với **đúng một** bản ghi trong **Bảng B** và ngược lại.

| **Bảng A** | **Bảng B** | **Ghi chú** |
|:---|:---|:---|
| `TaiKhoan` | `GiangVien` | `mataikhoan` UNIQUE trong GiangVien |
| `TaiKhoan` | `SinhVien` | `mataikhoan` UNIQUE trong SinhVien |
| `TaiKhoan` | `Admin` | `mataikhoan` UNIQUE trong Admin |
| `GiangVien` | `ChiTietGiangVien` | `magv` là PK đồng thời là FK |
| `SinhVien` | `ChiTietSinhVien` | `masv` là PK đồng thời là FK |
| `PhanCong` | `ThongKePhanCong` | `maphanCong` là PK đồng thời là FK |

---

## Quan hệ 1-N (One-to-Many)

> Mỗi bản ghi trong **Bảng "1"** có thể tương ứng với **nhiều** bản ghi trong **Bảng "N"**.

| **Bảng "1"** | **Bảng "N"** | **Cột FK** |
|:---|:---|:---|
| `Khoa` | `GiangVien` | `makhoa` |
| `Khoa` | `Lop` | `makhoa` |
| `Khoa` | `MonHoc` | `makhoa` |
| `GiangVien` | `PhanCong` | `magv` |
| `GiangVien` | `BaiTap` | `magv` |
| `GiangVien` | `TaiLieu` | `magv` |
| `GiangVien` | `DeThi` | `magvtao` |
| `GiangVien` | `NopBai` | `magvcham` |
| `GiangVien` | `Diem` | `magvnhap` |
| `GiangVien` | `DonXinNghi` | `magvduyet` |
| `GiangVien` | `Lop` | `magv` |
| `GiangVien` | `ThongBao` | `magvtao` |
| `GiangVien` | `NhatKy` | `magv` |
| `Lop` | `SinhVien` | `malop` |
| `Lop` | `PhanCong` | `malop` |
| `Lop` | `ThongBao` | `malop` |
| `HocKy` | `PhanCong` | `mahocky` |
| `HocKy` | `ThongKeSinhVien` | `mahocky` |
| `MonHoc` | `PhanCong` | `mamon` |
| `PhanCong` | `LichHoc` | `maphanCong` |
| `PhanCong` | `SinhVienMonHoc` | `maphanCong` |
| `PhanCong` | `BaiTap` | `maphanCong` |
| `PhanCong` | `TaiLieu` | `maphanCong` |
| `PhanCong` | `DeThi` | `maphanCong` |
| `PhanCong` | `ThongBao` | `maphanCong` |
| `PhanCong` | `NhatKy` | `maphanCong` |
| `PhanCong` | `CuocTroChuyen` | `maphanCong` |
| `LichHoc` | `BuoiHoc` | `malichhoc` |
| `BuoiHoc` | `DiemDanh` | `mabuoihoc` |
| `BuoiHoc` | `DonXinNghi` | `mabuoihoc` |
| `DeThi` | `CauHoi` | `madethi` |
| `DeThi` | `KetQuaThi` | `madethi` |
| `CauHoi` | `DapAn` | `macauhoi` |
| `CauHoi` | `ChiTietBaiLam` | `macauhoi` |
| `KetQuaThi` | `ChiTietBaiLam` | `maketqua` |
| `BaiTap` | `NopBai` | `mabaitap` |
| `ThongBao` | `ThongBaoDaDocSV` | `mathongbao` |
| `ThongBao` | `ThongBaoDaDocGV` | `mathongbao` |
| `CuocTroChuyen` | `ThanhVienTroChuyen` | `macuoctrochuyen` |
| `CuocTroChuyen` | `TinNhan` | `macuoctrochuyen` |
| `TaiKhoan` | `PhienDangNhap` | `mataikhoan` |
| `TaiKhoan` | `NhatKyHeThong` | `mataikhoan` |
| `SinhVien` | `ThongKeSinhVien` | `masv` |
| `SinhVien` | `DonXinNghi` | `masv` |
| `SinhVien` | `NhatKy` | `masv` |
| `DapAn` | `ChiTietBaiLam` | `madapan` |
| `Admin` | `ThongBao` | `maadmintao` |
| `PhongHoc` | `LichHoc` | `maphong` |

---

## 🔄 Quan hệ N-N (Many-to-Many) qua Bảng Trung Gian

> Mỗi bản ghi trong **Bảng A** có thể liên kết với **nhiều** bản ghi trong **Bảng B** và ngược lại — thông qua một **bảng trung gian**.

| **Bảng A** | **Bảng B** | **Bảng trung gian** | **PK của trung gian** |
|:---|:---|:---|:---|
| `SinhVien` | `PhanCong` | `SinhVienMonHoc` | `(masv, maphanCong)` |
| `SinhVien` | `PhanCong` | `Diem` | `madiem` *(nhưng FK kép vào SinhVienMonHoc)* |
| `SinhVien` | `PhanCong` | `DiemTongKet` | `(masv, maphanCong)` |
| `SinhVien` | `BuoiHoc` | `DiemDanh` | `(mabuoihoc, masv)` |
| `SinhVien` | `BaiTap` | `NopBai` | `(mabaitap, masv)` |
| `SinhVien` | `DeThi` | `KetQuaThi` | `(madethi, masv, lanthi)` |
| `SinhVien` | `HocKy` | `ThongKeSinhVien` | `(masv, mahocky)` |
| `ThongBao` | `SinhVien` | `ThongBaoDaDocSV` | `(mathongbao, masv)` |
| `ThongBao` | `GiangVien` | `ThongBaoDaDocGV` | `(mathongbao, magv)` |
| `CuocTroChuyen` | `SinhVien / GiangVien` | `ThanhVienTroChuyen` | `(macuoctrochuyen, masv/magv)` |
| `SinhVienMonHoc` | `DiemTongKet` | — | FK kép `(masv, maphanCong)` → SinhVienMonHoc; DiemTongKet mở rộng SinhVienMonHoc |
| `SinhVienMonHoc` | `Diem` | — | FK kép `(masv, maphanCong)` → SinhVienMonHoc; Diem bắt buộc phải đăng ký môn trước |

---

## Thống kê tổng quan

| Loại quan hệ | Số lượng |
|:---|:---:|
|  Quan hệ 1-1 | **6** |
|  Quan hệ 1-N | **48** |
|  Quan hệ N-N | **12** |
| **Tổng cộng** | **67** |

---

## Chú thích ký hiệu

| Ký hiệu | Ý nghĩa |
|:---|:---|
| `PK` | Primary Key — Khóa chính |
| `FK` | Foreign Key — Khóa ngoại |
| `UNIQUE` | Ràng buộc duy nhất trên cột |
| `—` | Không có bảng trung gian độc lập |

---

<div align="center">

*Tài liệu được tạo từ file `lien_ket_cac_table.docx`*

</div>
