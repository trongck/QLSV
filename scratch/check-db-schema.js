const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mjyxgwodxvntotsnuads.supabase.co";
const supabaseKey = "sb_publishable_EuAFHxr6UXt3W6-Ywa301g_13zpNZfU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== KIỂM TRA SCHEMA CƠ SỞ DỮ LIỆU ===");

  // Lấy một dòng từ bảng phonghoc hoặc phancong hoặc buoihoc để khảo sát cột
  const { data: buoihoc, error: e1 } = await supabase.from("buoihoc").select("*").limit(1);
  console.log("Dữ liệu mẫu buoihoc:", buoihoc, e1?.message);

  const { data: lichhoc, error: e2 } = await supabase.from("lichhoc").select("*").limit(1);
  console.log("Dữ liệu mẫu lichhoc:", lichhoc, e2?.message);

  // Xem có bảng phonghoc hay không
  const { data: phonghoc, error: e3 } = await supabase.from("phonghoc").select("*").limit(1).catch(() => null);
  console.log("Dữ liệu mẫu phonghoc:", phonghoc, e3?.message);
}

test();
