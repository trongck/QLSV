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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: msgs, error } = await supabase
    .from("tinnhan")
    .select("*")
    .order("ngaytao", { ascending: false })
    .limit(3);

  console.log("Recent messages:");
  if (msgs) {
    msgs.forEach((m) => {
      console.log(`ID: ${m.matinnhan}, Content: ${m.noidung}, ngaytao: ${m.ngaytao}`);
    });
  } else {
    console.log("Error:", error);
  }

  // Get postgres timezone
  const { data: tz } = await supabase.rpc("show_timezone").select("*").catch(() => ({}));
  if (tz) {
    console.log("RPC show_timezone:", tz);
  } else {
    const { data: rawTz } = await supabase.from("tinnhan").select("ngaytao").limit(1);
    console.log("Postgres timestamp sample:", rawTz);
  }
}
check();
