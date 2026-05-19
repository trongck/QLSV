import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log("Connecting to Supabase at:", supabaseUrl);
  
  // Query 1 record from sinhvien to check column keys
  const { data, error } = await supabase
    .from("sinhvien")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Lỗi truy vấn sinhvien:", error);
  } else {
    console.log("Danh sách các cột trong bảng sinhvien:");
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log("Dữ liệu mẫu:", data[0]);
    } else {
      console.log("Không có dữ liệu trong bảng sinhvien");
    }
  }
}

inspectSchema();
