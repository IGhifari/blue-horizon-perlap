import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server Supabase belum lengkap.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { username, password } = await req.json();
    const cleanUsername = String(username ?? '').trim().toLowerCase();

    if (!cleanUsername || !password) {
      return new Response(
        JSON.stringify({ error: 'Username dan password wajib diisi.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Cari user berdasarkan username di public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, divisi, created_at')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Username atau password tidak valid.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Ambil email Auth dari auth.users berdasarkan profile.id
    const { data: userRecord, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userError || !userRecord?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Akun autentikasi tidak ditemukan.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Verifikasi password menggunakan client Auth standar
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: signInError } =
      await supabaseAnon.auth.signInWithPassword({
        email: userRecord.user.email,
        password: String(password),
      });

    if (signInError || !authData?.session) {
      return new Response(
        JSON.stringify({ error: 'Username atau password tidak valid.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        },
        user: authData.user,
        profile,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Terjadi kesalahan server.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
