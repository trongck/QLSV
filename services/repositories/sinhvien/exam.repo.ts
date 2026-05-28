// repositories/sinhvien/exam.repo.ts
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

const parseSessionMeta = (ghichu?: string | null) => {
  if (!ghichu) return { starts: 0, cheat: 0, answered: 0 };
  try {
    const parsed = JSON.parse(ghichu);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        starts: Number(parsed.starts ?? 0),
        cheat: Number(parsed.cheat ?? 0),
        answered: Number(parsed.answered ?? 0),
      };
    }
  } catch {
    // ignore
  }

  const match = ghichu.match(/(\d+)\s*lần/);
  return {
    starts: 0,
    cheat: match ? Number(match[1]) : 0,
    answered: 0,
  };
};

const serializeSessionMeta = (meta: {
  starts: number;
  cheat: number;
  answered: number;
}) => {
  return JSON.stringify({
    starts: meta.starts,
    cheat: meta.cheat,
    answered: meta.answered,
  });
};

export const examRepo = {
  /**
   * Lấy danh sách đề thi của sinh viên dựa trên phân công môn học
   */
  getExams: async (masv: string) => {
    const supabase = await getSupabase();
    console.log("Simplifying getExams for debugging...");

    // 4. Lấy danh sách các lớp sinh viên đang theo học
    const { data: enrolledClasses, error: classError } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .eq("masv", masv)
      .eq("trangthai", "Danghoc");

    if (classError) return { data: null, error: classError };

    const maphancongIds = (enrolledClasses ?? []).map(
      (row: any) => row.maphancong,
    );
    if (maphancongIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("dethi")
      .select(
        `
                madethi, tieude, mota, thoigianlam, thoigianbatdau, thoigianketthuc, maphancong, matkhau, solan,
                phancong:maphancong (
                    monhoc:mamon ( tenmon )
                )
            `,
      )
      .in("maphancong", maphancongIds)
      .order("thoigianbatdau", { ascending: false });

    console.log("Exams found in repo:", data?.length, error);
    if (error) return { data: null, error };

    // 3. Lấy trạng thái đã làm bài hay chưa và điểm số
    const { data: results } = await supabase
      .from("ketquathi")
      .select("madethi, trangthai, diemtong, socandung")
      .eq("masv", masv);

    const { data: enrolledStudents, error: studentCountErr } = await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .in("maphancong", maphancongIds)
      .eq("trangthai", "Danghoc");

    if (studentCountErr) return { data: null, error: studentCountErr };

    const studentCountMap: Record<number, number> = {};
    (enrolledStudents ?? []).forEach((row: any) => {
      const key = row.maphancong;
      studentCountMap[key] = (studentCountMap[key] || 0) + 1;
    });

    const processedData = data.map((exam) => {
      const result = results?.find((r) => r.madethi === exam.madethi);
      return {
        ...exam,
        trangthai: result ? "DaLam" : "ChuaLam",
        diemtong: result?.diemtong,
        socandung: result?.socandung,
        monhoc: (exam.phancong as any)?.monhoc?.tenmon,
        issuedCount: studentCountMap[exam.maphancong] ?? 0,
      };
    });

    return { data: processedData, error: null };
  },

  /**
   * Lấy chi tiết đề thi (câu hỏi và các lựa chọn)
   */
  getExamDetail: async (madethi: number) => {
    const supabase = await getSupabase();

    // Lấy thông tin đề thi
    const { data: exam, error: examErr } = await supabase
      .from("dethi")
      .select("*")
      .eq("madethi", madethi)
      .single();

    if (examErr) return { data: null, error: examErr };

    // Lấy danh sách câu hỏi
    const { data: questions, error: qErr } = await supabase
      .from("cauhoi")
      .select(
        `
                macauhoi, noidung, hinhanh, loaicauhoi, diem, thutu,
                dapan ( madapan, noidung, thutu )
            `,
      )
      .eq("madethi", madethi)
      .order("thutu", { ascending: true });

    if (qErr) return { data: null, error: qErr };

    return { data: { ...exam, questions }, error: null };
  },

  updateExamSession: async (
    masv: string,
    madethi: number,
    payload: {
      startEvent?: boolean;
      answeredCount?: number;
      cheatCount?: number;
    },
  ) => {
    const supabase = await getSupabase();
    const { data: existing, error: existingError } = await supabase
      .from("ketquathi")
      .select("*")
      .eq("madethi", madethi)
      .eq("masv", masv)
      .eq("lanthi", 1)
      .maybeSingle();

<<<<<<< Updated upstream
    /**
     * Nộp bài thi
     */
    /**
     * Nộp bài thi
     */
    submitExam: async (masv: string, madethi: number, answers: { macauhoi: number, madapan: number | null, cautraloituluan: string | null }[]) => {
        const supabase = await getSupabase();
        console.log('--- START SUBMIT EXAM ---');
        console.log('MASV:', masv, 'MaDeThi:', madethi);
        console.log('Answers received:', answers.length);
=======
    if (existingError) {
      return { data: null, error: existingError };
    }
>>>>>>> Stashed changes

    const now = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "");
    const existingMeta = parseSessionMeta(existing?.ghichu);
    const starts = existingMeta.starts + (payload.startEvent ? 1 : 0);
    const answered =
      payload.answeredCount ??
      existingMeta.answered ??
      existing?.socandung ??
      0;
    const cheat = payload.cheatCount ?? existingMeta.cheat ?? 0;
    const ghichu = serializeSessionMeta({ starts, cheat, answered });

    if (existing) {
      if (["DaNop", "ViPham", "HetGio"].includes(existing.trangthai)) {
        return { data: existing, error: null };
      }

      const { data: updated, error: updateErr } = await supabase
        .from("ketquathi")
        .update({
          thoigianvaothi: existing.thoigianvaothi || now,
          thoigiannopbai: null,
          diemtong: 0,
          socandung: answered,
          trangthai: "DangLam",
          ghichu,
        })
        .eq("maketqua", existing.maketqua)
        .select()
        .single();

      return { data: updated, error: updateErr };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("ketquathi")
      .insert({
        madethi,
        masv,
        lanthi: 1,
        thoigianvaothi: now,
        thoigiannopbai: null,
        diemtong: 0,
        socandung: answered,
        trangthai: "DangLam",
        ghichu,
      })
      .select()
      .single();

    return { data: inserted, error: insertErr };
  },

  /**
   * Nộp bài thi
   */
  submitExam: async (
    masv: string,
    madethi: number,
    answers: {
      macauhoi: number;
      madapan: number | null;
      cautraloituluan: string | null;
    }[],
    cheatCount?: number,
  ) => {
    const supabase = await getSupabase();
    console.log("--- START SUBMIT EXAM ---");
    console.log("MASV:", masv, "MaDeThi:", madethi);
    console.log("Answers received:", answers.length);

    // 1. Lấy thông tin đề thi và câu hỏi
    const { data: questions, error: qErr } = await supabase
      .from("cauhoi")
      .select("macauhoi, diem, loaicauhoi")
      .eq("madethi", madethi);

    if (qErr) {
      console.error("Error fetching questions:", qErr);
      return { data: null, error: qErr };
    }

    // 2. Lấy toàn bộ đáp án đúng của các câu hỏi trong đề
    const { data: correctAnswers, error: daErr } = await supabase
      .from("dapan")
      .select("madapan, macauhoi")
      .in(
        "macauhoi",
        questions.map((q) => q.macauhoi),
      )
      .eq("ladapandung", true);

    if (daErr) {
      console.error("Error fetching correct answers:", daErr);
      return { data: null, error: daErr };
    }

    let totalScore = 0;
    let correctCount = 0;

    const details = answers
      .map((ans) => {
        const question = questions.find((q) => q.macauhoi === ans.macauhoi);
        if (!question) return null;

        let isCorrect = false;

        if (question.loaicauhoi === "TracNghiem") {
          // Kiểm tra xem madapan gửi lên có phải là đáp án đúng không
          isCorrect = correctAnswers.some(
            (ca) => ca.macauhoi === ans.macauhoi && ca.madapan === ans.madapan,
          );
        } else if (question.loaicauhoi === "NhieuLuaChon") {
          // Tạm thời xử lý như Trắc nghiệm nếu frontend chỉ gửi 1 đáp án
          isCorrect = correctAnswers.some(
            (ca) => ca.macauhoi === ans.macauhoi && ca.madapan === ans.madapan,
          );
        }
        // Tự luận (TuLuan) sẽ được chấm sau bởi giảng viên, mặc định 0 điểm lúc này

        const score = isCorrect ? question.diem || 0 : 0;

        if (isCorrect) {
          totalScore += score;
          correctCount++;
        }

        return {
          macauhoi: ans.macauhoi,
          madapan: ans.madapan,
          cautraloituluan: ans.cautraloituluan,
          diemdatduoc: score,
          dagvcham: question.loaicauhoi !== "TuLuan",
        };
      })
      .filter((d) => d !== null);

    // Nếu sinh viên đã bắt đầu nhưng chưa nộp, cập nhật lại kết quả thi hiện tại
    const { data: existingResult, error: existingError } = await supabase
      .from("ketquathi")
      .select("*")
      .eq("madethi", madethi)
      .eq("masv", masv)
      .eq("lanthi", 1)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing exam result:", existingError);
      return { data: null, error: existingError };
    }

    const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "");
    const isCheat = cheatCount && cheatCount > 0;
    const trangthai = isCheat ? "ViPham" : "DaNop";

    let sessionMeta = parseSessionMeta(existingResult?.ghichu);
    if (cheatCount !== undefined) {
      sessionMeta.cheat = cheatCount;
    }
    sessionMeta.answered = existingResult?.socandung ?? answers.length;

    const ghichu = serializeSessionMeta({
      starts: sessionMeta.starts,
      cheat: sessionMeta.cheat,
      answered: sessionMeta.answered,
    });

    let result: any;
    let resErr: any;

<<<<<<< Updated upstream
        // 3. Lưu kết quả thi
        const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        const { data: result, error: resErr } = await supabase
            .from('ketquathi')
            .insert({
                madethi,
                masv,
                lanthi: 1,
                thoigianvaothi: vnNow,
                thoigiannopbai: vnNow,
                diemtong: totalScore,
                socandung: correctCount,
                trangthai: 'DaNop'
=======
    if (existingResult) {
      if (
        existingResult.trangthai === "DaNop" ||
        existingResult.trangthai === "ViPham" ||
        existingResult.trangthai === "HetGio"
      ) {
        console.log(
          "Existing final exam result found, returning without duplicate update.",
        );
        return { data: existingResult, error: null };
      }

      const { data: updatedResult, error: updateErr } = await supabase
        .from("ketquathi")
        .update({
          thoigianvaothi: existingResult.thoigianvaothi || vnNow,
          thoigiannopbai: vnNow,
          diemtong: totalScore,
          socandung: correctCount,
          trangthai: trangthai,
          ghichu,
        })
        .eq("maketqua", existingResult.maketqua)
        .select()
        .single();

      result = updatedResult;
      resErr = updateErr;
    } else {
      const { data: insertedResult, error: insertErr } = await supabase
        .from("ketquathi")
        .insert({
          madethi,
          masv,
          lanthi: 1,
          thoigianvaothi: vnNow,
          thoigiannopbai: vnNow,
          diemtong: totalScore,
          socandung: correctCount,
          trangthai: trangthai,
          ghichu,
        })
        .select()
        .single();

      result = insertedResult;
      resErr = insertErr;
    }

    if (resErr) {
      console.error("Error saving exam result:", resErr);
      return { data: null, error: resErr };
    }

    const detailsToInsert = details.map((d) => ({
      maketqua: result.maketqua,
      ...d,
    }));

    // Bỏ qua insert chi tiết nếu không có câu nào được trả lời
    if (detailsToInsert.length > 0) {
      const { error: detailErr } = await supabase
        .from("chitietbailam")
        .insert(detailsToInsert);

      if (detailErr) {
        console.error("Error inserting chitietbailam:", detailErr);
        if (existingResult) {
          await supabase
            .from("ketquathi")
            .update({
              thoigiannopbai: existingResult.thoigiannopbai,
              diemtong: existingResult.diemtong,
              socandung: existingResult.socandung,
              trangthai: existingResult.trangthai,
              ghichu: existingResult.ghichu,
>>>>>>> Stashed changes
            })
            .eq("maketqua", existingResult.maketqua);
        } else {
          await supabase
            .from("ketquathi")
            .delete()
            .eq("maketqua", result.maketqua);
        }
        return { data: null, error: detailErr };
      }
    }

    console.log("--- SUBMIT SUCCESS --- Score:", totalScore);
    return { data: result, error: null };
  },

  /**
   * Lấy chi tiết bài làm (Câu đúng/sai)
   */
  getExamResultDetail: async (masv: string, madethi: number) => {
    const supabase = await getSupabase();

    // 1. Lấy thông tin kết quả thi
    const { data: ketqua, error: kErr } = await supabase
      .from("ketquathi")
      .select("*")
      .eq("masv", masv)
      .eq("madethi", madethi)
      .order("thoigiannopbai", { ascending: false })
      .limit(1)
      .single();

    if (kErr) return { data: null, error: kErr };

    // 2. Lấy chi tiết bài làm, câu hỏi và đáp án
    const { data: details, error: dErr } = await supabase
      .from("chitietbailam")
      .select(
        `
                machitiet, madapan, cautraloituluan, diemdatduoc,
                cauhoi:macauhoi (
                    macauhoi, noidung, hinhanh, loaicauhoi, diem,
                    dapan ( madapan, noidung, ladapandung )
                )
            `,
      )
      .eq("maketqua", ketqua.maketqua);

    if (dErr) return { data: null, error: dErr };

    return {
      data: {
        ketqua,
        details,
      },
      error: null,
    };
  },
};
