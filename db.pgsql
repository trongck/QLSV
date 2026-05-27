-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin (
  maadmin character varying NOT NULL,
  mataikhoan character varying UNIQUE,
  hoten character varying NOT NULL,
  CONSTRAINT admin_pkey PRIMARY KEY (maadmin),
  CONSTRAINT admin_mataikhoan_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan)
);
CREATE TABLE public.baitap (
  mabaitap integer NOT NULL DEFAULT nextval('baitap_mabaitap_seq'::regclass),
  maphancong integer NOT NULL,
  tieude character varying NOT NULL,
  mota text,
  filedinh character varying,
  hannop timestamp without time zone NOT NULL,
  diemtoida numeric NOT NULL DEFAULT 10.0 CHECK (diemtoida > 0::numeric),
  loai character varying NOT NULL DEFAULT 'Baitap'::character varying CHECK (loai::text = ANY (ARRAY['Baitap'::character varying, 'Tieuluan'::character varying, 'Doan'::character varying, 'Khac'::character varying]::text[])),
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT baitap_pkey PRIMARY KEY (mabaitap),
  CONSTRAINT baitap_maphancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.buoihoc (
  mabuoihoc integer NOT NULL DEFAULT nextval('buoihoc_mabuoihoc_seq'::regclass),
  malichhoc integer NOT NULL,
  ngayhoc date NOT NULL CHECK (ngayhoc >= '2000-01-01'::date),
  noidung text,
  trangthai character varying NOT NULL DEFAULT 'ChuaDiemdanh'::character varying CHECK (trangthai::text = ANY (ARRAY['ChuaDiemdanh'::character varying, 'DangDiemdanh'::character varying, 'Hoanthanh'::character varying]::text[])),
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  qr_secret character varying,
  CONSTRAINT buoihoc_pkey PRIMARY KEY (mabuoihoc),
  CONSTRAINT buoihoc_malichhoc_fkey FOREIGN KEY (malichhoc) REFERENCES public.lichhoc(malichhoc)
);
CREATE TABLE public.cauhoi (
  macauhoi integer NOT NULL DEFAULT nextval('cauhoi_macauhoi_seq'::regclass),
  madethi integer NOT NULL,
  noidung text NOT NULL,
  hinhanh character varying,
  loaicauhoi character varying NOT NULL DEFAULT 'TracNghiem'::character varying CHECK (loaicauhoi::text = ANY (ARRAY['TracNghiem'::character varying, 'NhieuLuaChon'::character varying, 'TuLuan'::character varying]::text[])),
  diem numeric NOT NULL DEFAULT 1.0 CHECK (diem > 0::numeric),
  thutu integer,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT cauhoi_pkey PRIMARY KEY (macauhoi),
  CONSTRAINT cauhoi_madethi_fkey FOREIGN KEY (madethi) REFERENCES public.dethi(madethi)
);
CREATE TABLE public.chitietbailam (
  machitiet integer NOT NULL DEFAULT nextval('chitietbailam_machitiet_seq'::regclass),
  maketqua integer NOT NULL,
  macauhoi integer NOT NULL,
  madapan integer,
  cautraloituluan text,
  diemdatduoc numeric NOT NULL DEFAULT 0 CHECK (diemdatduoc >= 0::numeric),
  dagvcham boolean NOT NULL DEFAULT false,
  CONSTRAINT chitietbailam_pkey PRIMARY KEY (machitiet),
  CONSTRAINT chitietbailam_maketqua_fkey FOREIGN KEY (maketqua) REFERENCES public.ketquathi(maketqua),
  CONSTRAINT chitietbailam_macauhoi_fkey FOREIGN KEY (macauhoi) REFERENCES public.cauhoi(macauhoi),
  CONSTRAINT chitietbailam_madapan_fkey FOREIGN KEY (madapan) REFERENCES public.dapan(madapan)
);
CREATE TABLE public.dapan (
  madapan integer NOT NULL DEFAULT nextval('dapan_madapan_seq'::regclass),
  macauhoi integer NOT NULL,
  noidung text NOT NULL,
  ladapandung boolean NOT NULL DEFAULT false,
  thutu integer,
  giaithich text,
  CONSTRAINT dapan_pkey PRIMARY KEY (madapan),
  CONSTRAINT dapan_macauhoi_fkey FOREIGN KEY (macauhoi) REFERENCES public.cauhoi(macauhoi)
);
CREATE TABLE public.dethi (
  madethi integer NOT NULL DEFAULT nextval('dethi_madethi_seq'::regclass),
  maphancong integer NOT NULL,
  tieude character varying NOT NULL,
  mota text,
  thoigianlam integer NOT NULL CHECK (thoigianlam > 0),
  thoigianbatdau timestamp without time zone NOT NULL,
  thoigianketthuc timestamp without time zone NOT NULL,
  matkhau character varying,
  xaotroncauhoi boolean NOT NULL DEFAULT true,
  xaotrondapan boolean NOT NULL DEFAULT true,
  solan integer NOT NULL DEFAULT 1,
  hienthidapan boolean NOT NULL DEFAULT false,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT dethi_pkey PRIMARY KEY (madethi),
  CONSTRAINT dethi_maphancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.diem (
  madiem integer NOT NULL DEFAULT nextval('diem_madiem_seq'::regclass),
  masv character varying NOT NULL,
  maphancong integer NOT NULL,
  loaidiem character varying NOT NULL CHECK (loaidiem::text = ANY (ARRAY['ChuyenCan'::character varying, 'GiuaKy'::character varying, 'CuoiKy'::character varying, 'Thuchanh'::character varying, 'Tieuluan'::character varying, 'Khac'::character varying]::text[])),
  giatri numeric NOT NULL CHECK (giatri >= 0::numeric AND giatri <= 10::numeric),
  heso numeric NOT NULL DEFAULT 1.0 CHECK (heso > 0::numeric),
  ghichu character varying,
  magvnhap character varying,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT diem_pkey PRIMARY KEY (madiem),
  CONSTRAINT diem_magvnhap_fkey FOREIGN KEY (magvnhap) REFERENCES public.giangvien(magv),
  CONSTRAINT diem_svm_fkey FOREIGN KEY (masv) REFERENCES public.sinhvienmonhoc(masv),
  CONSTRAINT diem_svm_fkey FOREIGN KEY (maphancong) REFERENCES public.sinhvienmonhoc(masv),
  CONSTRAINT diem_svm_fkey FOREIGN KEY (masv) REFERENCES public.sinhvienmonhoc(maphancong),
  CONSTRAINT diem_svm_fkey FOREIGN KEY (maphancong) REFERENCES public.sinhvienmonhoc(maphancong)
);
CREATE TABLE public.diemdanh (
  madiemdanh integer NOT NULL DEFAULT nextval('diemdanh_madiemdanh_seq'::regclass),
  mabuoihoc integer NOT NULL,
  masv character varying NOT NULL,
  trangthai character varying NOT NULL DEFAULT 'Vangmat'::character varying CHECK (trangthai::text = ANY (ARRAY['Comat'::character varying, 'Vangmat'::character varying, 'Dimuon'::character varying, 'Cophep'::character varying]::text[])),
  ghichu text,
  thoigiandiemdanh timestamp without time zone,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  phuongthuc character varying NOT NULL DEFAULT 'Manual'::character varying CHECK (phuongthuc::text = ANY (ARRAY['QR'::character varying, 'Face'::character varying, 'Manual'::character varying]::text[])),
  CONSTRAINT diemdanh_pkey PRIMARY KEY (madiemdanh),
  CONSTRAINT diemdanh_mabuoihoc_fkey FOREIGN KEY (mabuoihoc) REFERENCES public.buoihoc(mabuoihoc),
  CONSTRAINT diemdanh_masv_fkey FOREIGN KEY (masv) REFERENCES public.sinhvien(masv)
);
CREATE TABLE public.diemtongket (
  masv character varying NOT NULL,
  maphancong integer NOT NULL,
  diemtongket numeric CHECK (diemtongket >= 0::numeric AND diemtongket <= 10::numeric),
  diemchu character varying,
  ketqua character varying CHECK (ketqua::text = ANY (ARRAY['Dat'::character varying, 'KhongDat'::character varying, 'ChoCham'::character varying]::text[])),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT diemtongket_pkey PRIMARY KEY (masv, maphancong),
  CONSTRAINT diemtongket_svm_fkey FOREIGN KEY (masv) REFERENCES public.sinhvienmonhoc(masv),
  CONSTRAINT diemtongket_svm_fkey FOREIGN KEY (maphancong) REFERENCES public.sinhvienmonhoc(masv),
  CONSTRAINT diemtongket_svm_fkey FOREIGN KEY (masv) REFERENCES public.sinhvienmonhoc(maphancong),
  CONSTRAINT diemtongket_svm_fkey FOREIGN KEY (maphancong) REFERENCES public.sinhvienmonhoc(maphancong)
);
CREATE TABLE public.donxinnghi (
  madon integer NOT NULL DEFAULT nextval('donxinnghi_madon_seq'::regclass),
  masv character varying NOT NULL,
  mabuoihoc integer NOT NULL,
  lydo text NOT NULL,
  minhchung character varying,
  trangthai character varying NOT NULL DEFAULT 'ChoDuyet'::character varying CHECK (trangthai::text = ANY (ARRAY['ChoDuyet'::character varying, 'DaDuyet'::character varying, 'TuChoi'::character varying]::text[])),
  magvduyet character varying,
  ghichugv text,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT donxinnghi_pkey PRIMARY KEY (madon),
  CONSTRAINT donxinnghi_masv_fkey FOREIGN KEY (masv) REFERENCES public.sinhvien(masv),
  CONSTRAINT donxinnghi_mabuoihoc_fkey FOREIGN KEY (mabuoihoc) REFERENCES public.buoihoc(mabuoihoc),
  CONSTRAINT donxinnghi_magvduyet_fkey FOREIGN KEY (magvduyet) REFERENCES public.giangvien(magv)
);
CREATE TABLE public.giangvien (
  magv character varying NOT NULL,
  mataikhoan character varying UNIQUE,
  makhoa character varying,
  ngaysinh date,
  gioitinh character varying CHECK (gioitinh::text = ANY (ARRAY['Nam'::character varying, 'Nu'::character varying, 'Khac'::character varying]::text[])),
  hocvi character varying,
  chuyennganh character varying,
  anhdaidien character varying,
  emailtruong character varying UNIQUE,
  thanhtuu text,
  diachi character varying,
  sodienthoai character varying,
  emailcanhan character varying,
  ngayvaotruong date,
  hesoluong numeric CHECK (hesoluong > 0::numeric),
  hodem character varying,
  ten character varying,
  CONSTRAINT giangvien_pkey PRIMARY KEY (magv),
  CONSTRAINT giangvien_mataikhoan_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan),
  CONSTRAINT giangvien_makhoa_fkey FOREIGN KEY (makhoa) REFERENCES public.khoa(makhoa)
);
CREATE TABLE public.hocky (
  mahocky integer NOT NULL DEFAULT nextval('hocky_mahocky_seq'::regclass),
  tenhocky character varying NOT NULL,
  namhoc integer NOT NULL CHECK (namhoc >= 2000 AND namhoc <= 2100),
  ky integer NOT NULL CHECK (ky = ANY (ARRAY[1, 2, 3])),
  ngaybatdau date,
  ngayketthuc date,
  danghieuluc boolean NOT NULL DEFAULT false,
  CONSTRAINT hocky_pkey PRIMARY KEY (mahocky)
);
CREATE TABLE public.ketquathi (
  maketqua integer NOT NULL DEFAULT nextval('ketquathi_maketqua_seq'::regclass),
  madethi integer NOT NULL,
  masv character varying NOT NULL,
  lanthi integer NOT NULL DEFAULT 1 CHECK (lanthi >= 1),
  thoigianvaothi timestamp without time zone NOT NULL DEFAULT now(),
  thoigiannopbai timestamp without time zone,
  diemtong numeric CHECK (diemtong >= 0::numeric AND diemtong <= 10::numeric),
  socandung integer NOT NULL DEFAULT 0,
  trangthai character varying NOT NULL DEFAULT 'DangLam'::character varying CHECK (trangthai::text = ANY (ARRAY['DangLam'::character varying, 'DaNop'::character varying, 'ViPham'::character varying, 'HetGio'::character varying]::text[])),
  ghichu text,
  CONSTRAINT ketquathi_pkey PRIMARY KEY (maketqua),
  CONSTRAINT ketquathi_madethi_fkey FOREIGN KEY (madethi) REFERENCES public.dethi(madethi),
  CONSTRAINT ketquathi_masv_fkey FOREIGN KEY (masv) REFERENCES public.sinhvien(masv)
);
CREATE TABLE public.khoa (
  makhoa character varying NOT NULL,
  tenkhoa character varying NOT NULL,
  dienthoai character varying,
  email character varying,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT khoa_pkey PRIMARY KEY (makhoa)
);
CREATE TABLE public.lichhoc (
  malichhoc integer NOT NULL DEFAULT nextval('lichhoc_malichhoc_seq'::regclass),
  maphancong integer NOT NULL,
  thutrongtuan integer NOT NULL CHECK (thutrongtuan >= 2 AND thutrongtuan <= 8),
  tietbatdau integer NOT NULL CHECK (tietbatdau >= 1 AND tietbatdau <= 15),
  tietketthuc integer NOT NULL CHECK (tietketthuc >= 1 AND tietketthuc <= 15),
  maphong character varying,
  tuantu_batdau integer CHECK (tuantu_batdau >= 1 AND tuantu_batdau <= 20),
  tuantu_ketthuc integer CHECK (tuantu_ketthuc >= 1 AND tuantu_ketthuc <= 20),
  ghichu text,
  CONSTRAINT lichhoc_pkey PRIMARY KEY (malichhoc),
  CONSTRAINT lichhoc_maphong_fkey FOREIGN KEY (maphong) REFERENCES public.phonghoc(maphong),
  CONSTRAINT lichhoc_maphancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.lop (
  malop character varying NOT NULL,
  makhoa character varying,
  tenlop character varying NOT NULL,
  nganh character varying,
  khoahoc character varying,
  magv character varying,
  CONSTRAINT lop_pkey PRIMARY KEY (malop),
  CONSTRAINT lop_makhoa_fkey FOREIGN KEY (makhoa) REFERENCES public.khoa(makhoa),
  CONSTRAINT lop_magv_fkey FOREIGN KEY (magv) REFERENCES public.giangvien(magv)
);
CREATE TABLE public.monhoc (
  mamon character varying NOT NULL,
  makhoa character varying,
  tenmon character varying NOT NULL,
  sotinchi integer NOT NULL CHECK (sotinchi > 0),
  sotietlythuyet integer,
  sotietthuchanh integer,
  mota text,
  batbuoc boolean NOT NULL DEFAULT true,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT monhoc_pkey PRIMARY KEY (mamon),
  CONSTRAINT monhoc_makhoa_fkey FOREIGN KEY (makhoa) REFERENCES public.khoa(makhoa)
);
CREATE TABLE public.nhatkyhethong (
  manhatky integer NOT NULL DEFAULT nextval('nhatkyhethong_manhatky_seq'::regclass),
  mataikhoan character varying,
  hanhdong character varying NOT NULL,
  tentable character varying,
  makhoachinh character varying,
  giatricu jsonb,
  giatrimoi jsonb,
  diachiip character varying,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT nhatkyhethong_pkey PRIMARY KEY (manhatky),
  CONSTRAINT nhatkyhethong_tai_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan)
);
CREATE TABLE public.nopbai (
  manopbai integer NOT NULL DEFAULT nextval('nopbai_manopbai_seq'::regclass),
  mabaitap integer NOT NULL,
  masv character varying NOT NULL,
  noidungnop text,
  filenop character varying,
  thoigiannop timestamp without time zone NOT NULL DEFAULT now(),
  trenop boolean NOT NULL DEFAULT false,
  diem numeric CHECK (diem >= 0::numeric AND diem <= 10::numeric),
  nhanxet text,
  magvcham character varying,
  thoigiancham timestamp without time zone,
  CONSTRAINT nopbai_pkey PRIMARY KEY (manopbai),
  CONSTRAINT nopbai_mabaitap_fkey FOREIGN KEY (mabaitap) REFERENCES public.baitap(mabaitap),
  CONSTRAINT nopbai_masv_fkey FOREIGN KEY (masv) REFERENCES public.sinhvien(masv),
  CONSTRAINT nopbai_magvcham_fkey FOREIGN KEY (magvcham) REFERENCES public.giangvien(magv)
);
CREATE TABLE public.phancong (
  maphancong integer NOT NULL DEFAULT nextval('phancong_maphancong_seq'::regclass),
  magv character varying NOT NULL,
  mamon character varying NOT NULL,
  malop character varying NOT NULL,
  mahocky integer NOT NULL,
  malophoc character varying,
  sisomax integer DEFAULT 50 CHECK (sisomax > 0),
  danghieuluc boolean NOT NULL DEFAULT true,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaybatdau date,
  ngayketthuc date,
  CONSTRAINT phancong_pkey PRIMARY KEY (maphancong),
  CONSTRAINT phancong_magv_fkey FOREIGN KEY (magv) REFERENCES public.giangvien(magv),
  CONSTRAINT phancong_mamon_fkey FOREIGN KEY (mamon) REFERENCES public.monhoc(mamon),
  CONSTRAINT phancong_malop_fkey FOREIGN KEY (malop) REFERENCES public.lop(malop),
  CONSTRAINT phancong_mahocky_fkey FOREIGN KEY (mahocky) REFERENCES public.hocky(mahocky)
);
CREATE TABLE public.phiendangnhap (
  maphien integer NOT NULL DEFAULT nextval('phiendangnhap_maphien_seq'::regclass),
  mataikhoan character varying,
  refreshtoken character varying NOT NULL UNIQUE,
  diachiip character varying,
  thoigianhethan timestamp without time zone NOT NULL,
  ngaytao timestamp without time zone DEFAULT now(),
  CONSTRAINT phiendangnhap_pkey PRIMARY KEY (maphien),
  CONSTRAINT phiendangnhap_tai_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan)
);
CREATE TABLE public.phonghoc (
  maphong character varying NOT NULL,
  loaiphong text NOT NULL CHECK (loaiphong = ANY (ARRAY['Lythuyet'::text, 'Thuchanh'::text, 'Online'::text])),
  suchua smallint NOT NULL DEFAULT 40 CHECK (suchua > 0),
  CONSTRAINT phonghoc_pkey PRIMARY KEY (maphong)
);
CREATE TABLE public.sinhvien (
  masv character varying NOT NULL,
  mataikhoan character varying UNIQUE,
  malop character varying NOT NULL,
  ngaysinh date,
  gioitinh character varying CHECK (gioitinh::text = ANY (ARRAY['Nam'::character varying, 'Nu'::character varying, 'Khac'::character varying]::text[])),
  anhdaidien character varying,
  emailtruong character varying UNIQUE,
  trangthai character varying NOT NULL DEFAULT 'Danghoc'::character varying CHECK (trangthai::text = ANY (ARRAY['Danghoc'::character varying, 'Baoluu'::character varying, 'Thoi'::character varying, 'Totnghiep'::character varying]::text[])),
  diachithuongtru character varying,
  diachitamtru character varying,
  sodienthoai character varying,
  emailcanhan character varying,
  tenphuhuynh character varying,
  sodienthoaiphuhuynh character varying,
  cccd character varying UNIQUE,
  ngaycapcccd date,
  noicapcccd character varying,
  dantoc character varying,
  tongiao character varying,
  face_embedding jsonb,
  hodem character varying,
  ten character varying,
  CONSTRAINT sinhvien_pkey PRIMARY KEY (masv),
  CONSTRAINT sinhvien_mataikhoan_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan),
  CONSTRAINT sinhvien_malop_fkey FOREIGN KEY (malop) REFERENCES public.lop(malop)
);
CREATE TABLE public.sinhvienmonhoc (
  masv character varying NOT NULL,
  maphancong integer NOT NULL,
  ngaythem timestamp without time zone NOT NULL DEFAULT now(),
  trangthai character varying NOT NULL DEFAULT 'Danghoc'::character varying CHECK (trangthai::text = ANY (ARRAY['Danghoc'::character varying, 'Hoan'::character varying, 'Huy'::character varying]::text[])),
  CONSTRAINT sinhvienmonhoc_pkey PRIMARY KEY (masv, maphancong),
  CONSTRAINT sinhvienmonhoc_masv_fkey FOREIGN KEY (masv) REFERENCES public.sinhvien(masv),
  CONSTRAINT sinhvienmonhoc_maphancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.taikhoan (
  mataikhoan character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  matkhau character varying NOT NULL,
  vaitro character varying NOT NULL CHECK (vaitro::text = ANY (ARRAY['Admin'::character varying, 'GiangVien'::character varying, 'SinhVien'::character varying]::text[])),
  trangthai character varying NOT NULL DEFAULT 'HoatDong'::character varying CHECK (trangthai::text = ANY (ARRAY['HoatDong'::character varying, 'Khoa'::character varying]::text[])),
  dangnhaplancuoi timestamp without time zone,
  CONSTRAINT taikhoan_pkey PRIMARY KEY (mataikhoan)
);
CREATE TABLE public.tailieu (
  matailieu integer NOT NULL DEFAULT nextval('tailieu_matailieu_seq'::regclass),
  maphancong integer NOT NULL,
  tieude character varying NOT NULL,
  mota text,
  loai character varying NOT NULL DEFAULT 'File'::character varying CHECK (loai::text = ANY (ARRAY['File'::character varying, 'Video'::character varying, 'Link'::character varying, 'Slide'::character varying]::text[])),
  duongdan character varying NOT NULL,
  dungluong bigint,
  luotxem integer NOT NULL DEFAULT 0,
  chopheptai boolean NOT NULL DEFAULT true,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT tailieu_pkey PRIMARY KEY (matailieu),
  CONSTRAINT tailieu_maphancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.thongbao (
  mathongbao integer NOT NULL DEFAULT nextval('thongbao_mathongbao_seq'::regclass),
  mataikhoantao character varying NOT NULL,
  tieude character varying NOT NULL,
  noidung text NOT NULL,
  loai character varying NOT NULL DEFAULT 'Chung'::character varying CHECK (loai::text = ANY (ARRAY['Chung'::character varying, 'Hoctap'::character varying, 'Thoikhoabieu'::character varying, 'Diem'::character varying, 'Baitap'::character varying, 'Tailieu'::character varying, 'Khancap'::character varying]::text[])),
  doituong character varying NOT NULL DEFAULT 'Tatca'::character varying CHECK (doituong::text = ANY (ARRAY['Tatca'::character varying, 'SinhVien'::character varying, 'GiangVien'::character varying]::text[])),
  malop character varying,
  maphancong integer,
  ngayhethan timestamp without time zone,
  ghim boolean NOT NULL DEFAULT false,
  ngaytao timestamp without time zone NOT NULL DEFAULT now(),
  ngaycapnhat timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT thongbao_pkey PRIMARY KEY (mathongbao),
  CONSTRAINT thongbao_taikhoantao_fkey FOREIGN KEY (mataikhoantao) REFERENCES public.taikhoan(mataikhoan),
  CONSTRAINT thongbao_malop_fkey FOREIGN KEY (malop) REFERENCES public.lop(malop),
  CONSTRAINT thongbao_phancong_fkey FOREIGN KEY (maphancong) REFERENCES public.phancong(maphancong)
);
CREATE TABLE public.thongbaodadoc (
  mathongbao integer NOT NULL,
  mataikhoan character varying NOT NULL,
  dadoc boolean NOT NULL DEFAULT false,
  thoigiandoc timestamp without time zone,
  CONSTRAINT thongbaodadoc_pkey PRIMARY KEY (mathongbao, mataikhoan),
  CONSTRAINT thongbaodadoc_tb_fkey FOREIGN KEY (mathongbao) REFERENCES public.thongbao(mathongbao),
  CONSTRAINT thongbaodadoc_tai_fkey FOREIGN KEY (mataikhoan) REFERENCES public.taikhoan(mataikhoan)
);