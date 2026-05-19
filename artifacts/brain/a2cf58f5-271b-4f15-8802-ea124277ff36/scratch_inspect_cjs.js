const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

let envUrl = "";
let envKey = "";

const envPath = "/Users/macbookair/Documents/NhiemVu/QLSV/.env.local";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      if (key === "NEXT_PUBLIC_SUPABASE_URL") envUrl = val;
      if (key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") envKey = val;
    }
  }
}

if (!envUrl || !envKey) {
  console.error("Lỗi: Không tìm thấy NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tại " + envPath);
  process.exit(1);
}

const supabase = createClient(envUrl, envKey);

async function inspectSchema() {
  console.log("Connecting to Supabase URL:", envUrl);
  const { data, error } = await supabase
    .from("sinhvien")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Lỗi truy vấn sinhvien:", error);
  } else {
    console.log("Danh sách các cột trong bảng sinhvien:");
    if (data && data.length > 0) {
      console.log(JSON.stringify(Object.keys(data[0]), null, 2));
      console.log("Dữ liệu mẫu:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Không có dữ liệu trong bảng sinhvien");
    }
  }
}

inspectSchema();
