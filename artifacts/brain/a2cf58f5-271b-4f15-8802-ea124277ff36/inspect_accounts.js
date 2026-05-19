const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    console.log("=== SEARCH FOR anh@vnua.edu.vn in taikhoan ===");
    const { data: accounts, error: err1 } = await supabase
      .from('taikhoan')
      .select('*')
      .eq('email', 'anh@vnua.edu.vn');
    if (err1) throw err1;
    console.log("taikhoan match:", JSON.stringify(accounts, null, 2));

    console.log("=== SEARCH FOR anh@vnua.edu.vn in giangvien ===");
    const { data: gv1, error: err2 } = await supabase
      .from('giangvien')
      .select('*')
      .eq('emailtruong', 'anh@vnua.edu.vn');
    if (err2) throw err2;
    console.log("giangvien match:", JSON.stringify(gv1, null, 2));
    
  } catch (error) {
    console.error("Error inspecting database:", error.message);
  }
}

inspect();
