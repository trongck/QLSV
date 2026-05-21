const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatDate(isoString) {
  try {
    if (!isoString) return "";
    let normalized = isoString.trim();
    if (normalized.includes(" ")) {
      normalized = normalized.replace(" ", "T");
    }
    if (!normalized.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
      normalized += "Z";
    }
    const d = new Date(normalized);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

async function run() {
  const { data: convs, error } = await supabase
    .from('cuoctrochuyen')
    .select('macuoctrochuyen, ngaytao')
    .order('macuoctrochuyen', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }

  console.log('Convs from db:');
  convs.forEach(c => {
    console.log(`macuoctrochuyen: ${c.macuoctrochuyen}`);
    console.log(`  raw ngaytao: ${c.ngaytao}`);
    console.log(`  formatDate: ${formatDate(c.ngaytao)}`);
    console.log(`  parsed Date: ${new Date(c.ngaytao).toISOString()}`);
    console.log(`  local DateString: ${new Date(c.ngaytao).toString()}`);
  });
}

run();
