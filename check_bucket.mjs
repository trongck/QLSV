import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjyxgwodxvntotsnuads.supabase.co';
const supabaseKey = 'sb_publishable_EuAFHxr6UXt3W6-Ywa301g_13zpNZfU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
  } else {
    console.log("Buckets:", data.map(b => b.name));
  }
}

main();
