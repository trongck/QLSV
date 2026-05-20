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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // Just need to see if tables exist
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select("*").limit(1);
  if (!error) {
    console.log(`Table '${tableName}' EXISTS. Columns:`, data && data.length > 0 ? Object.keys(data[0]) : "Empty table");
  } else if (error.code !== '42P01') { // 42P01 is relation does not exist
    console.log(`Table '${tableName}' might exist but error:`, error.message);
  }
}

async function run() {
  const possibleTables = [
    "kythi", "cathi", "dethi", "cauthoi", "baithi", "bailam", 
    "chitietdethi", "chitietbailam", "cauthoitracnghiem", "ketquathi", "thi"
  ];
  for (const t of possibleTables) {
    await checkTable(t);
  }
}
run();
