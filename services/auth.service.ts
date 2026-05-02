import { createClient } from "@/lib/utils/supabase/client";
import type { LoginRequest, LoginResponse, UserProfile } from "@/models";
import { VaiTro } from "@/types";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const supabase = createClient();


    const { data: taikhoan, error: tkError } = await supabase
      .from("taikhoan")
      .select("mataikhoan, email, vaitro, trangthai, matkhau")
      .or(`email.eq.${payload.email},mataikhoan.eq.${payload.email}`)
      .single();

    if (tkError || !taikhoan) {
      throw new Error("Không tìm thấy tài khoản hoặc sai email.");
    }

    const { data: isMatch, error: verifyError } = await supabase
      .rpc('verify_password', {
        input_password: payload.matkhau,
        hashed_password: taikhoan.matkhau
      });

    if (taikhoan.trangthai === "Khoa") {
      throw new Error("Tài khoản của bạn đã bị khóa.");
    }

    // 2. Lấy profile theo vai trò
    let hoten = "";
    let anhdaidien: string | null = null;
    let maSinhVien: string | undefined;
    let maGiangVien: string | undefined;
    let maAdmin: string | undefined;

    if (taikhoan.vaitro === VaiTro.SinhVien) {
      const { data: sv } = await supabase
        .from("sinhvien")
        .select("masv, hoten, anhdaidien")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = sv?.hoten ?? "Sinh Viên";
      anhdaidien = sv?.anhdaidien ?? null;
      maSinhVien = sv?.masv;
    } else if (taikhoan.vaitro === VaiTro.GiangVien) {
      const { data: gv } = await supabase
        .from("giangvien")
        .select("magv, hoten, anhdaidien")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = gv?.hoten ?? "Giảng Viên";
      anhdaidien = gv?.anhdaidien ?? null;
      maGiangVien = gv?.magv;
    } else if (taikhoan.vaitro === VaiTro.Admin) {
      const { data: admin } = await supabase
        .from("admin")
        .select("maadmin, hoten")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = admin?.hoten ?? "Admin";
      maAdmin = admin?.maadmin;
    }

    const userProfile: UserProfile = {
      mataikhoan: taikhoan.mataikhoan,
      email: taikhoan.email,
      vaitro: taikhoan.vaitro as VaiTro,
      hoten,
      anhdaidien,
      maSinhVien,
      maGiangVien,
      maAdmin,
    };

    // 3. Lưu session thủ công
    if (typeof window !== "undefined") {
      localStorage.setItem("session_mataikhoan", taikhoan.mataikhoan);
    }

    return {
      accessToken: "dummy_token",
      refreshToken: "dummy_token",
      user: userProfile,
    };
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_mataikhoan");
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    if (typeof window === "undefined") return null;

    const mataikhoanId = localStorage.getItem("session_mataikhoan");
    if (!mataikhoanId) return null;

    const supabase = createClient();
    const { data: taikhoan } = await supabase
      .from("taikhoan")
      .select("mataikhoan, email, vaitro")
      .eq("mataikhoan", mataikhoanId)
      .single();

    if (!taikhoan) {
      localStorage.removeItem("session_mataikhoan");
      return null;
    }

    let hoten = "";
    let anhdaidien: string | null = null;
    let maSinhVien: string | undefined;
    let maGiangVien: string | undefined;
    let maAdmin: string | undefined;

    if (taikhoan.vaitro === VaiTro.SinhVien) {
      const { data: sv } = await supabase
        .from("sinhvien")
        .select("masv, hoten, anhdaidien")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = sv?.hoten ?? "Sinh Viên";
      anhdaidien = sv?.anhdaidien ?? null;
      maSinhVien = sv?.masv;
    } else if (taikhoan.vaitro === VaiTro.GiangVien) {
      const { data: gv } = await supabase
        .from("giangvien")
        .select("magv, hoten, anhdaidien")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = gv?.hoten ?? "Giảng Viên";
      anhdaidien = gv?.anhdaidien ?? null;
      maGiangVien = gv?.magv;
    } else if (taikhoan.vaitro === VaiTro.Admin) {
      const { data: admin } = await supabase
        .from("admin")
        .select("maadmin, hoten")
        .eq("mataikhoan", taikhoan.mataikhoan)
        .single();
      hoten = admin?.hoten ?? "Admin";
      maAdmin = admin?.maadmin;
    }

    return {
      mataikhoan: taikhoan.mataikhoan,
      email: taikhoan.email,
      vaitro: taikhoan.vaitro as VaiTro,
      hoten,
      anhdaidien,
      maSinhVien,
      maGiangVien,
      maAdmin,
    };
  },
};

