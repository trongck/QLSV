const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mjyxgwodxvntotsnuads.supabase.co";
const supabaseKey = "sb_publishable_EuAFHxr6UXt3W6-Ywa301g_13zpNZfU"; // Using publishable key

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== THỬ NGHIỆM ĐIỂM DANH ===");
  
  // 1. Kiểm tra xem có buổi học nào trên DB không
  const { data: buoihoc, error: bhError } = await supabase
    .from("buoihoc")
    .select("mabuoihoc, malichhoc, ngayhoc, trangthai")
    .order("ngayhoc", { ascending: false })
    .limit(5);

  if (bhError) {
    console.error("Lỗi lấy danh sách buổi học:", bhError.message);
    return;
  }

  console.log("5 buổi học mới nhất:", buoihoc);

  if (buoihoc.length === 0) {
    console.log("Không có buổi học nào.");
    return;
  }

  const mabuoihoc = buoihoc[0].mabuoihoc;
  const masv = "687692"; // Trần Thị Thuỳ Linh

  // 2. Tra cứu điểm danh hiện tại của SV này
  const { data: currentDD, error: ddError } = await supabase
    .from("diemdanh")
    .select("*")
    .eq("mabuoihoc", mabuoihoc)
    .eq("masv", masv);

  console.log(`Bản ghi điểm danh hiện tại cho SV ${masv} tại buổi học ${mabuoihoc}:`, currentDD);

  // 3. Thử nghiệm thực hiện UPSERT
  console.log("Thử nghiệm thực hiện UPSERT...");
  const { data: upsertResult, error: upsertError } = await supabase
    .from("diemdanh")
    .upsert({
      mabuoihoc: mabuoihoc,
      masv: masv,
      trangthai: "Comat",
      phuongthuc: "Manual"
    }, { onConflict: "mabuoihoc,masv" })
    .select();

  if (upsertError) {
    console.error("LỖI UPSERT:", upsertError.message, upsertError.details, upsertError.hint);
  } else {
    console.log("UPSERT THÀNH CÔNG:", upsertResult);
  }
}

test();
