const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mjyxgwodxvntotsnuads.supabase.co";
const supabaseKey = "sb_publishable_EuAFHxr6UXt3W6-Ywa301g_13zpNZfU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const possibleNames = [
    "caplaimatkhau",
    "yeucau_caplaimatkhau",
    "yeucau_matkhau",
    "yeucau",
    "reset_password",
    "password_resets",
    "khoiphocmatkhau",
    "yeucau_reset_matkhau",
    "yeucaucaplaimk",
    "yeucaucaplaimatkhau"
  ];

  for (const name of possibleNames) {
    const { data, error } = await supabase.from(name).select("*").limit(1);
    if (!error) {
      console.log(`Table '${name}' exists!`, data);
    } else {
      if (!error.message.includes("Could not find the table")) {
        console.log(`Table '${name}' exists but has error:`, error.message);
      }
    }
  }
  console.log("Done checking possible table names.");
}

main();
