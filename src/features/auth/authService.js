import { supabase } from '../../lib/supabaseClient';
import {
  normalizeUsername,
  usernameToInternalEmail,
} from './permissions';

export async function fetchProfileByUserId(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, divisi, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat profil pengguna: ${error.message}`);
  }

  return data;
}

export async function loginWithUsername(username, password) {
  const cleanUsername = normalizeUsername(username);
  const rawPassword = String(password ?? '');

  if (!cleanUsername || !rawPassword) {
    throw new Error('Username dan password wajib diisi.');
  }

  // 1. Coba login melalui Supabase Edge Function (username-login) terlebih dahulu
  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'username-login',
      {
        body: { username: cleanUsername, password: rawPassword },
      }
    );

    if (!fnError && fnData?.session?.access_token) {
      const { data: sessionData, error: setSessionErr } =
        await supabase.auth.setSession({
          access_token: fnData.session.access_token,
          refresh_token: fnData.session.refresh_token,
        });

      if (setSessionErr) {
        throw new Error(setSessionErr.message);
      }

      const profile =
        fnData.profile ||
        (await fetchProfileByUserId(sessionData?.user?.id || fnData.user?.id));

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Profil pengguna tidak ditemukan pada tabel profiles.');
      }

      return {
        session: sessionData.session,
        user: sessionData.user,
        profile,
      };
    }

    // Jika Edge Function mengembalikan status 401 eksplisit, langsung lempar pesan error
    if (fnData?.error && !String(fnError?.message || '').includes('Failed to send')) {
      throw new Error(fnData.error);
    }
  } catch (err) {
    // Jika error adalah kredensial salah dari Edge Function, teruskan errornya
    if (
      err?.message &&
      (err.message.includes('tidak valid') ||
        err.message.includes('tidak ditemukan'))
    ) {
      throw err;
    }
    // Jika Edge Function belum dideploy, lanjut ke mekanisme RPC / Auth langsung
  }

  // 2. Resolusi email dari username melalui fungsi database SECURITY DEFINER (resolve_login_email)
  let resolvedEmail = null;
  try {
    const { data: rpcEmail, error: rpcError } = await supabase.rpc(
      'resolve_login_email',
      { p_username: cleanUsername }
    );
    if (!rpcError && rpcEmail) {
      resolvedEmail = rpcEmail;
    }
  } catch {
    // Abaikan jika RPC belum dijalankan, gunakan format email internal kanonik
  }

  const emailToUse = resolvedEmail || usernameToInternalEmail(cleanUsername);

  const { data: authData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: rawPassword,
    });

  if (signInError || !authData?.session || !authData?.user) {
    throw new Error('Username atau password salah.');
  }

  const profile = await fetchProfileByUserId(authData.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error(
      'Akun ditemukan tetapi belum memiliki data role/divisi di tabel profiles.'
    );
  }

  return {
    session: authData.session,
    user: authData.user,
    profile,
  };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Gagal logout: ${error.message}`);
  }
}
