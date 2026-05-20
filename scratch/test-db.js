const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const masv = '687644';
  
  console.log("--- Querying sinhvien ---");
  const { data: sv, error: svErr } = await supabase
    .from('sinhvien')
    .select('*')
    .eq('masv', masv);
  console.log("sinhvien:", sv, "Error:", svErr);

  console.log("--- Querying view_gpa_sinhvien ---");
  const { data: gpaView, error: gpaErr } = await supabase
    .from('view_gpa_sinhvien')
    .select('*')
    .eq('masv', masv);
  console.log("view_gpa_sinhvien:", gpaView, "Error:", gpaErr);

  if (sv && sv.length > 0) {
    const malop = sv[0].malop;
    console.log("--- Querying lop ---");
    const { data: lop, error: lopErr } = await supabase
      .from('lop')
      .select('*')
      .eq('malop', malop);
    console.log("lop:", lop, "Error:", lopErr);
  }
}

test();
