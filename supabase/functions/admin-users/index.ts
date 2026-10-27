import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_ROLES = ['admin', 'admin_divisi', 'user'];
const VALID_DIVISIONS = [
  'Perlengkapan',
  'Humreg',
  'Dekdok',
  'Acara',
  'Keamanan',
];

function usernameToEmail(username: string): string {
  const sanitized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return `${sanitized}@perlap.internal`;
}

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token autentikasi tidak ditemukan.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: callerUser },
      error: callerError,
    } = await supabaseUserClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Sesi tidak valid atau telah berakhir.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Pastikan pemanggil memiliki role 'admin' (Admin Utama)
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', callerUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Akses ditolak: Hanya Admin Utama yang dapat mengelola akun.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const cleanUsername = String(body.username ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const role = String(body.role ?? 'user');
      const divisi = body.divisi ? String(body.divisi) : null;

      if (!cleanUsername || cleanUsername.length < 3) {
        return new Response(
          JSON.stringify({ error: 'Username minimal 3 karakter.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password minimal 6 karakter.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!VALID_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Role tidak valid.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (
        (role === 'admin_divisi' || role === 'user') &&
        (!divisi || !VALID_DIVISIONS.includes(divisi))
      ) {
        return new Response(
          JSON.stringify({
            error: 'Divisi wajib dipilih untuk Admin Divisi atau User.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const email = usernameToEmail(cleanUsername);

      const { data: createdAuth, error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: cleanUsername },
        });

      if (createAuthError || !createdAuth?.user) {
        return new Response(
          JSON.stringify({
            error: createAuthError?.message || 'Gagal membuat akun Auth.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: newProfile, error: profileInsertError } =
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: createdAuth.user.id,
            username: cleanUsername,
            role,
            divisi: role === 'admin' ? divisi || 'Perlengkapan' : divisi,
          })
          .select('*')
          .single();

      if (profileInsertError) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
        return new Response(
          JSON.stringify({ error: profileInsertError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ profile: newProfile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const targetId = String(body.id ?? '');
      const role = String(body.role ?? '');
      const divisi = body.divisi ? String(body.divisi) : null;
      const newPassword = body.password ? String(body.password) : '';

      if (!targetId || !VALID_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: 'ID pengguna atau role tidak valid.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (
        (role === 'admin_divisi' || role === 'user') &&
        (!divisi || !VALID_DIVISIONS.includes(divisi))
      ) {
        return new Response(
          JSON.stringify({ error: 'Divisi tidak valid.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Password baru minimal 6 karakter.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(
          targetId,
          { password: newPassword }
        );
        if (pwErr) {
          return new Response(JSON.stringify({ error: pwErr.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({
          role,
          divisi: role === 'admin' ? divisi || 'Perlengkapan' : divisi,
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ profile: updatedProfile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const targetId = String(body.id ?? '');
      if (!targetId) {
        return new Response(
          JSON.stringify({ error: 'ID pengguna wajib diisi.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (targetId === callerUser.id) {
        return new Response(
          JSON.stringify({
            error: 'Tidak dapat menghapus akun Admin Utama yang sedang aktif.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: deleteAuthErr } =
        await supabaseAdmin.auth.admin.deleteUser(targetId);

      if (deleteAuthErr) {
        return new Response(JSON.stringify({ error: deleteAuthErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabaseAdmin.from('profiles').delete().eq('id', targetId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Action tidak dikenali.' }),
      {
        status: 400,
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
