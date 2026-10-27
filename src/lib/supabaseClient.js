import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY;

const missingVars = [];
if (!supabaseUrl) {
  missingVars.push('VITE_SUPABASE_URL (atau SUPABASE_URL)');
}
if (!supabaseKey) {
  missingVars.push(
    'VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY (atau SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY)'
  );
}

if (missingVars.length > 0) {
  throw new Error(
    `Konfigurasi Supabase belum lengkap. Variabel environment berikut belum tersedia: ${missingVars.join(
      ', '
    )}.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
