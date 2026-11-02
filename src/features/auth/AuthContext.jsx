import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AuthContext } from './authContextInstance';
import {
  fetchProfileByUserId,
  loginWithUsername,
  logoutUser,
} from './authService';
import {
  isMainAdmin,
  isDivisionAdmin,
  isRegularUser,
  canManageUsers,
  canManageTimeline,
  canViewAllDivisions,
  canManageDivisionItems,
  canExportDivisionItems,
  getAllowedDivisions,
} from './permissions';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadUserProfile = useCallback(async (currentSession) => {
    if (!currentSession?.user?.id) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await fetchProfileByUserId(currentSession.user.id);
      if (!userProfile) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setAuthError(
          'Profil pengguna tidak ditemukan. Hubungi Admin Utama Perlengkapan.'
        );
      } else {
        setSession(currentSession);
        setUser(currentSession.user);
        setProfile(userProfile);
        setAuthError('');
      }
    } catch (err) {
      setAuthError(err?.message || 'Gagal memuat profil pengguna.');
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      setLoading(true);
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !initialSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      await loadUserProfile(initialSession);
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !nextSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUserProfile(nextSession);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = useCallback(async (username, password) => {
    setAuthError('');
    const result = await loginWithUsername(username, password);
    setSession(result.session);
    setUser(result.user);
    setProfile(result.profile);
    return result;
  }, []);

  const logout = useCallback(async () => {
    setAuthError('');
    await logoutUser();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null;
    const updated = await fetchProfileByUserId(session.user.id);
    setProfile(updated);
    return updated;
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      authError,
      isAuthenticated: Boolean(session && user && profile),
      isMainAdmin: isMainAdmin(profile),
      isDivisionAdmin: isDivisionAdmin(profile),
      isRegularUser: isRegularUser(profile),
      canManageUsers: canManageUsers(profile),
      canManageTimeline: canManageTimeline(profile),
      canViewAllDivisions: canViewAllDivisions(profile),
      canManageDivisionItems: canManageDivisionItems(profile),
      canExportDivisionItems: canExportDivisionItems(profile),
      allowedDivisions: getAllowedDivisions(profile),
      login,
      logout,
      refreshProfile,
      clearAuthError: () => setAuthError(''),
    }),
    [session, user, profile, loading, authError, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
