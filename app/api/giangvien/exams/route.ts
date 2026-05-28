import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";
import * as XLSX from "xlsx";

const normalizeValue = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  return value == null ? "" : String(value).trim();
};

const findValue = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const normalizedKey = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === key.toLowerCase().trim(),
    );
    if (normalizedKey && row[normalizedKey] != null) {
      const value = normalizeValue(row[normalizedKey]);
      if (value) return value;
    }
  }
  return "";
};

const parseStudentExcel = async (file: File | null) => {
  if (!file) return [];

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows
    .map((row) => {
      const masv = findValue(row, [
        "mssv",
        "masv",
        "ma sinh vien",
        "student id",
        "studentid",
      ]);
      const tensv = findValue(row, [
        "ho va ten",
        "hoten",
        "full name",
        "name",
        "ten",
      ]);
      return { masv, tensv: tensv || "Khong ro" };
    })
    .filter((item) => item.masv);
};

const getTeacherMagv = async (mataikhoan: string) => {
  const { createClient } = await import("@/lib/utils/supabase/server");
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: gv, error } = await supabase
    .from("giangvien")
    .select("magv")
    .eq("mataikhoan", mataikhoan)
    .single();

  if (error || !gv) {
    throw new Error("Giáo viên không tìm thấy hoặc không hợp lệ.");
  }

  return gv.magv;
};

const parseQuestionsFromExcel = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const sanitizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, "");
  const findColumn = (row: Record<string, unknown>, candidates: string[]) => {
    const normalized = Object.keys(row).map((key) => ({
      original: key,
      normalized: sanitizeKey(key),
    }));
    const match = candidates
      .map((cand) => sanitizeKey(cand))
      .find((cand) => normalized.some((col) => col.normalized === cand));
    return normalized.find((col) => col.normalized === match)?.original;
  };

  const questionKeyCandidates = [
    "cauhoi",
    "câuhoi",
    "noidung",
    "question",
    "questiontext",
    "stem",
  ];
  const typeKeyCandidates = ["loai", "loaicauhoi", "type", "questiontype"];
  const scoreKeyCandidates = ["diem", "score", "points"];
  const answerKeyCandidates = [
    "dapan",
    "daan",
    "answer",
    "correctanswer",
    "correct",
  ];
  const optionKeyCandidates = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "optiona",
    "optionb",
    "optionc",
    "optiond",
    "optione",
  ];

  const questions = rows
    .map((row) => {
      const questionCol = findColumn(row, questionKeyCandidates);
      const typeCol = findColumn(row, typeKeyCandidates);
      const pointCol = findColumn(row, scoreKeyCandidates);
      const answerCol = findColumn(row, answerKeyCandidates);

      const rawQuestion = questionCol ? normalizeValue(row[questionCol]) : "";
      if (!rawQuestion) return null;

      const rawType = typeCol ? normalizeValue(row[typeCol]) : "";
      const rawScore = pointCol ? normalizeValue(row[pointCol]) : "";
      const rawAnswer = answerCol ? normalizeValue(row[answerCol]) : "";

      const options = optionKeyCandidates
        .map((key) => {
          const col = findColumn(row, [key]);
          if (!col) return null;
          const value = normalizeValue(row[col]);
          return value ? { key: key.toUpperCase(), noidung: value } : null;
        })
        .filter(Boolean) as { key: string; noidung: string }[];

      let loaicauhoi: string = "TuLuan";
      if (options.length > 0) {
        const normalizedAnswer = rawAnswer.toLowerCase();
        const correctKeys = normalizedAnswer
          .split(/[;,\s]+/)
          .map((item) => item.trim().replace(/[^A-Za-z0-9]/g, ""))
          .filter(Boolean)
          .map((item) => item.toUpperCase());

        const dapan = options.map((opt) => ({
          noidung: opt.noidung,
          ladapandung: correctKeys.includes(opt.key),
        }));

        const correctCount = dapan.filter(
          (option) => option.ladapandung,
        ).length;
        loaicauhoi = correctCount > 1 ? "NhieuLuaChon" : "TracNghiem";

        return {
          noidung: rawQuestion,
          diem: Number(rawScore) || 1,
          loaicauhoi,
          dapan,
        };
      }

      return {
        noidung: rawQuestion,
        diem: Number(rawScore) || 1,
        loaicauhoi:
          rawType === "TuLuan" || rawType === "Tự luận" ? "TuLuan" : "TuLuan",
        dapan: [] as Array<{ noidung: string; ladapandung: boolean }>,
      };
    })
    .filter(Boolean) as Array<{
    noidung: string;
    diem: number;
    loaicauhoi: string;
    dapan: Array<{ noidung: string; ladapandung: boolean }>;
  }>;

  if (questions.length === 0) {
    throw new Error("Không tìm thấy câu hỏi hợp lệ trong file Excel đề thi.");
  }

  return questions;
};

const parseQuestionsFromFile = async (file: File) => {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const supportedExtensions = [
    "pdf",
    "docx",
    "doc",
    "txt",
    "xlsx",
    "xls",
    "csv",
  ];

  if (!supportedExtensions.includes(fileExtension)) {
    throw new Error(
      "Định dạng file đề thi không hợp lệ. Chỉ chấp nhận PDF, DOCX, DOC, TXT, XLSX, XLS hoặc CSV.",
    );
  }

  if (["xlsx", "xls", "csv"].includes(fileExtension)) {
    return await parseQuestionsFromExcel(file);
  }

  const mimeType =
    fileExtension === "pdf"
      ? "application/pdf"
      : fileExtension === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : fileExtension === "doc"
          ? "application/msword"
          : "text/plain";

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Cần thiết lập GEMINI_API_KEY để xử lý file Word/PDF. Vui lòng cấu hình biến môi trường GEMINI_API_KEY.",
      );
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              noidung: { type: "STRING" },
              diem: { type: "NUMBER" },
              loaicauhoi: { type: "STRING" },
              dapan: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    noidung: { type: "STRING" },
                    ladapandung: { type: "BOOLEAN" },
                  },
                  required: ["noidung", "ladapandung"],
                },
              },
            },
            required: ["noidung", "loaicauhoi", "diem", "dapan"],
          },
        } as any,
      },
    });

    const prompt =
      "Read the exam document and extract all questions. Return a JSON array of objects with keys noidung, loaicauhoi, diem, and dapan. For multiple-choice questions, include dapan array with each answer option and ladapandung true for correct options. For essay questions, set loaicauhoi to TuLuan and dapan to an empty array.";
    const result = await model.generateContent([
      { inlineData: { data: fileBuffer.toString("base64"), mimeType } },
      prompt,
    ]);

    const resultText = result.response.text();
    const parsed = JSON.parse(resultText) as Array<{
      noidung: string;
      diem: number;
      loaicauhoi: string;
      dapan: Array<{ noidung: string; ladapandung: boolean }>;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Không tìm thấy câu hỏi hợp lệ trong file đề thi.");
    }

    return parsed.map((question) => {
      if (
        !question.noidung ||
        typeof question.loaicauhoi !== "string" ||
        Number.isNaN(Number(question.diem)) ||
        !Array.isArray(question.dapan)
      ) {
        throw new Error("File đề thi không chứa cấu trúc câu hỏi hợp lệ.");
      }
      return {
        noidung: question.noidung,
        diem: Number(question.diem) || 1,
        loaicauhoi:
          question.loaicauhoi === "TuLuan" ||
          question.loaicauhoi.toLowerCase().includes("tự luận")
            ? "TuLuan"
            : question.loaicauhoi === "NhieuLuaChon"
              ? "NhieuLuaChon"
              : "TracNghiem",
        dapan: question.dapan.map((option) => ({
          noidung: String(option.noidung || ""),
          ladapandung: Boolean(option.ladapandung),
        })),
      };
    });
  } catch (err: any) {
    console.warn("Cannot parse questions from file:", err);
    const detail = err?.message || String(err);
    throw new Error(`Không thể đọc file đề thi. ${detail}`);
  }
};

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chua cung cap token" }, { status: 401 });
  }

  try {
    const payload = (await verifyToken(token)) as any;
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!gv) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const exams = await giangVienService.getExams(gv.magv);
    return NextResponse.json({ success: true, data: exams });
  } catch (err: any) {
    console.error("Error GET /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to get exam list" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chua cung cap token" }, { status: 401 });
  }

  let payload: any;
  let magv: string;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json(
        { error: "Khong co quyen truy cap" },
        { status: 403 },
      );
    }
    magv = await getTeacherMagv(payload.mataikhoan);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Phien dang nhap het han hoac khong hop le" },
      { status: err.message?.includes("Giáo viên") ? 404 : 401 },
    );
  }

  try {
    const contentType = (
      request.headers.get("content-type") || ""
    ).toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Yêu cầu phải gửi multipart/form-data" },
        { status: 400 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err: any) {
      console.error("Failed to parse form data for /api/giangvien/exams:", err);
      return NextResponse.json(
        {
          error:
            "Không thể đọc dữ liệu upload. Vui lòng thử gửi lại file đề thi dưới dạng form-data.",
        },
        { status: 400 },
      );
    }
    const maphancong = Number(formData.get("maphancong"));
    const tieude = String(formData.get("tieude") || "");
    const mota = String(formData.get("mota") || "");
    const thoigianlam = Number(formData.get("thoigianlam"));
    const thoigianbatdau = String(formData.get("thoigianbatdau") || "");
    const thoigianketthuc = String(formData.get("thoigianketthuc") || "");
    const matkhau = String(formData.get("matkhau") || "");
    const studentSource = String(formData.get("studentSource") || "system");
    const file = formData.get("file") as File | null;
    const excelFile = formData.get("excelFile") as File | null;

    if (
      !maphancong ||
      !tieude ||
      !thoigianlam ||
      !thoigianbatdau ||
      !thoigianketthuc ||
      !file
    ) {
      return NextResponse.json(
        { error: "Thieu thong tin bat buoc" },
        { status: 400 },
      );
    }

    const startDate = new Date(thoigianbatdau);
    const endDate = new Date(thoigianketthuc);
    const now = new Date();

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Thời điểm mở/pháp đóng đề thi không hợp lệ." },
        { status: 400 },
      );
    }

    if (startDate.getTime() < now.getTime()) {
      return NextResponse.json(
        {
          error:
            "Thời điểm mở phòng đề thi phải là thời điểm hiện tại hoặc tương lai. Vui lòng chọn thời gian mới.",
        },
        { status: 400 },
      );
    }

    if (endDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        {
          error:
            "Thời điểm đóng đề thi phải là thời điểm tương lai. Vui lòng chọn thời gian kết thúc lớn hơn hiện tại.",
        },
        { status: 400 },
      );
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json(
        {
          error:
            "Thời điểm đóng đề thi phải lớn hơn thời điểm mở phòng đề thi. Vui lòng điều chỉnh lại.",
        },
        { status: 400 },
      );
    }

    if (endDate.getTime() - startDate.getTime() < thoigianlam * 60000) {
      return NextResponse.json(
        {
          error: `Khoảng thời gian từ lúc mở đến lúc đóng đề thi phải lớn hơn hoặc bằng thời gian làm bài (${thoigianlam} phút). Vui lòng điều chỉnh lại.`,
        },
        { status: 400 },
      );
    }

    const questions = await parseQuestionsFromFile(file);

    let students: Array<{ masv: string; tensv: string }> = [];
    if (studentSource === "excel") {
      students = await parseStudentExcel(excelFile);
    } else {
      const classStudents = await giangVienService.getGradeSheet(maphancong);
      students = Array.isArray(classStudents)
        ? classStudents.map((item: any) => ({
            masv: item.masv,
            tensv:
              item.hoten ||
              `${item.sinhvien?.hodem || ""} ${item.sinhvien?.ten || ""}`.trim() ||
              "Khong ro",
          }))
        : [];
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: "Danh sach sinh vien khong hop le hoac rong." },
        { status: 400 },
      );
    }

    const created = await giangVienService.createExamWithQuestions(
      magv,
      {
        maphancong,
        tieude,
        mota,
        thoigianlam,
        thoigianbatdau,
        thoigianketthuc,
        matkhau,
      },
      questions,
      students,
    );

    return NextResponse.json({
      success: true,
      data: {
        madethi: created.madethi,
        students,
        assignedCount: students.length,
      },
    });
  } catch (err: any) {
    console.error("Loi POST /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: err.message || "Loi tao ca thi" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chua cung cap token" }, { status: 401 });
  }

  let payload: any;
  let magv: string;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json(
        { error: "Khong co quyen truy cap" },
        { status: 403 },
      );
    }
    magv = await getTeacherMagv(payload.mataikhoan);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Phien dang nhap het han hoac khong hop le" },
      { status: err.message?.includes("Giáo viên") ? 404 : 401 },
    );
  }

  try {
    const body = await request.json();
    const madethi = Number(body.madethi);
    const thoigianlam = Number(body.thoigianlam);
    const thoigianbatdau = String(body.thoigianbatdau || "");
    const thoigianketthuc = String(body.thoigianketthuc || "");

    if (!madethi || !thoigianlam || !thoigianbatdau || !thoigianketthuc) {
      return NextResponse.json(
        { error: "Thieu thong tin cap nhat ca thi" },
        { status: 400 },
      );
    }

    await giangVienService.updateExamTime(magv, madethi, {
      thoigianlam,
      thoigianbatdau,
      thoigianketthuc,
    });

    return NextResponse.json({
      success: true,
      message: "Cap nhat thoi gian ca thi thanh cong.",
    });
  } catch (err: any) {
    console.error("Loi PUT /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: err.message || "Loi cap nhat ca thi" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chua cung cap token" }, { status: 401 });
  }

  let payload: any;
  let magv: string;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json(
        { error: "Khong co quyen truy cap" },
        { status: 403 },
      );
    }
    magv = await getTeacherMagv(payload.mataikhoan);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Phien dang nhap het han hoac khong hop le" },
      { status: err.message?.includes("Giáo viên") ? 404 : 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const madethi = Number(searchParams.get("madethi"));
    if (!madethi) {
      return NextResponse.json(
        { error: "Ma de thi khong hop le" },
        { status: 400 },
      );
    }

    await giangVienService.endExam(magv, madethi);
    return NextResponse.json({
      success: true,
      message: "Ca thi da duoc ket thuc.",
    });
  } catch (err: any) {
    console.error("Loi DELETE /api/giangvien/exams:", err.message);
    return NextResponse.json(
      { error: err.message || "Loi ket thuc ca thi" },
      { status: 500 },
    );
  }
}
