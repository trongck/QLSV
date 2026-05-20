const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the ANON key for this script just to be safe if SERVICE_ROLE is missing, though we use RPC if needed
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Let's try to insert each type one by one to see which one fails
  const types = ["ChuyenCan", "BaiTap", "GiuaKy", "CuoiKy"];
  for (const t of types) {
    const { error } = await supabase.from("diem").insert({
      maphancong: 5,
      masv: "687644", // Bùi Đỗ Quốc Huy
      loaidiem: t,
      giatri: 8,
      heso: 0.1
    });
    console.log(`Insert ${t}:`, error ? error.message : "Success");
  }
}
run();
