const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mjyxgwodxvntotsnuads.supabase.co";
const supabaseKey = "sb_publishable_EuAFHxr6UXt3W6-Ywa301g_13zpNZfU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from("thongbao").select("*").limit(1);
  if (error) {
    console.error("Error:", error.message);
    return;
  }
  console.log("SUCCESS! Columns:", data && data[0] ? Object.keys(data[0]) : "No data");
  console.log("Sample:", data && data[0]);
}

main();
