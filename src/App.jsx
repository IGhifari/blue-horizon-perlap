import { useState, useCallback, useEffect } from 'react';
import { INITIAL_TIMELINE } from './data/initialData';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './hooks/useAuth';
import {
  ROLES,
  resolveEffectiveDivisionForCreate,
  canEditItem,
  canDeleteItem,
  canManagePhotos,
  filterItemsByProfileAccess,
} from './features/auth/permissions';
import {
  normalizePhotoList,
  getFallbackPhotosForItem,
  saveFallbackPhotosForItem,
  removeFallbackPhotosForItem,
} from './utils/photoUtils';
import Header from './components/layout/Header';
import Toast from './components/ui/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import FormPage from './pages/FormPage';
import RekapPage from './pages/RekapPage';
import TimelinePage from './pages/TimelinePage';
import { supabase } from './lib/supabaseClient';

const LEGACY_LOCAL_STORAGE_KEYS = [
  'perlap_items_v1',
  'perlap_items_v2',
  'perlap_timeline_v1',
];

function clearLegacyLocalStorage() {
  try {
    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch {
    // Abaikan jika akses localStorage dibatasi oleh browser
  }
}

function isMissingFotoBuktiColumnError(error) {
  if (!error) return false;
  const msg = String(error.message || error.details || '').toLowerCase();
  return msg.includes('foto_bukti');
}

const toDbItem = (item, { includeFotoBukti = true } = {}) => {
  const rawNote = String(item.catatanOpsional ?? '')
    .replace(/\[PERLAP:SUDAH_ADA\]\s*/g, '')
    .trim();
  const cleanNote = rawNote || '-';

  const payload = {
    divisi: item.divisi,
    nama_barang: item.namaBarang,
    jumlah_barang: Number(item.jumlahBarang) || 1,
    kategori: item.kategori,
    jika_membeli: item.jikaMembeli || null,
    jika_menyewa: item.jikaMenyewa || null,
    jika_meminjam: item.jikaMeminjam || null,
    catatan_opsional: cleanNote,
    tanggal_permintaan: item.tanggalPermintaan,
  };

  if (includeFotoBukti && item.fotoBukti !== undefined) {
    payload.foto_bukti = normalizePhotoList(item.fotoBukti);
  }

  return payload;
};

const fromDbItem = (item) => {
  const rawCatatan = String(item.catatan_opsional ?? '');
  const cleanCatatan = rawCatatan
    .replace(/\[PERLAP:SUDAH_ADA\]\s*/g, '')
    .trim();

  const dbPhotos = normalizePhotoList(item.foto_bukti ?? item.fotoBukti);
  const fallbackPhotos =
    dbPhotos.length > 0 ? dbPhotos : getFallbackPhotosForItem(item.id);

  return {
    id: item.id,
    divisi: item.divisi,
    namaBarang: item.nama_barang,
    jumlahBarang: item.jumlah_barang,
    kategori: item.kategori,
    jikaMembeli: item.jika_membeli || '-',
    jikaMenyewa: item.jika_menyewa || '-',
    jikaMeminjam: item.jika_meminjam || '-',
    catatanOpsional: cleanCatatan || '-',
    tanggalPermintaan: item.tanggal_permintaan,
    fotoBukti: fallbackPhotos,
  };
};

const toDbTimeline = (item, index) => ({
  urutan: index + 1,
  rentang: item.rentang,
  target: item.target,
  output: item.output,
  status: item.status,
  progres: item.progres,
});

function AuthenticatedPortal() {
  const {
    profile,
    loading,
    authError,
    isAuthenticated,
    isMainAdmin,
    isDivisionAdmin,
    canManageTimeline,
    login,
    logout,
  } = useAuth();

  const [items, setItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activeView, setActiveView] = useState('form');
  const [activeDivisiTab, setActiveDivisiTab] = useState('ALL');
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 3200);
    },
    [dismissToast]
  );

  // Bersihkan key localStorage warisan saat aplikasi pertama kali dibuka
  useEffect(() => {
    clearLegacyLocalStorage();
  }, []);

  // Sesuaikan tab divisi default berdasarkan role dan divisi pengguna yang login
  useEffect(() => {
    if (!profile) {
      setItems([]);
      setTimeline([]);
      return;
    }

    if (profile.role === ROLES.ADMIN) {
      setActiveDivisiTab('ALL');
    } else if (profile.divisi) {
      setActiveDivisiTab(profile.divisi);
    }
  }, [profile]);

  // Ambil data dari Supabase hanya ketika pengguna sudah terautentikasi
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !profile) return;

    const requestsQuery =
      profile.role === ROLES.ADMIN
        ? supabase.from('requests').select('*').order('created_at')
        : supabase
            .from('requests')
            .select('*')
            .eq('divisi', profile.divisi)
            .order('created_at');

    const [requestsResult, timelineResult] = await Promise.all([
      requestsQuery,
      supabase.from('timeline_tasks').select('*').order('urutan'),
    ]);

    if (requestsResult.error) {
      console.error('Gagal mengambil pengajuan:', requestsResult.error);
      notify(
        'Gagal mengambil data pengajuan. Periksa koneksi dan kebijakan RLS.',
        'error'
      );
    } else {
      const mapped = requestsResult.data.map(fromDbItem);
      setItems(filterItemsByProfileAccess(mapped, profile));
    }

    if (timelineResult.error) {
      console.error('Gagal mengambil timeline:', timelineResult.error);
      notify('Gagal mengambil timeline.', 'error');
    } else if (timelineResult.data.length === 0 && profile.role === ROLES.ADMIN) {
      const { data, error } = await supabase
        .from('timeline_tasks')
        .insert(INITIAL_TIMELINE.map(toDbTimeline))
        .select('*')
        .order('urutan');

      if (error) {
        console.error('Gagal membuat timeline awal:', error);
        setTimeline(INITIAL_TIMELINE);
      } else {
        setTimeline(data);
      }
    } else {
      setTimeline(timelineResult.data);
    }
  }, [isAuthenticated, profile, notify]);

  useEffect(() => {
    if (isAuthenticated && profile) {
      loadData();
    }
  }, [isAuthenticated, profile, loadData]);
  
  const handleLogin = async (username, password) => {
    const result = await login(username, password);
    const loggedProfile = result.profile;
    if (
      loggedProfile.role === ROLES.ADMIN ||
      loggedProfile.role === ROLES.ADMIN_DIVISI
    ) {
      setActiveView('rekap');
    } else {
      setActiveView('form');
    }
    notify(`Selamat datang, @${loggedProfile.username}!`);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      setItems([]);
      setTimeline([]);
      setActiveView('form');
      notify('Anda telah keluar dari sesi.');
    } catch (err) {
      notify(err?.message || 'Gagal keluar dari sesi.', 'error');
    }
  };

  // Simpan pengajuan form ke database Supabase (divisi divalidasi dari profil)
  const handleSubmitItems = async ({
    divisi,
    tanggalPermintaan,
    rows,
  }) => {
    let effectiveDivisi;
    try {
      effectiveDivisi = resolveEffectiveDivisionForCreate(profile, divisi);
    } catch (err) {
      notify(err.message, 'error');
      return;
    }

    const newEntries = rows
      .filter((r) => r.namaBarang.trim())
      .map((r) => ({
        divisi: effectiveDivisi,
        namaBarang: r.namaBarang.trim(),
        jumlahBarang: Math.max(1, Number(r.jumlahBarang) || 1),
        kategori: r.kategori,
        jikaMembeli: r.jikaMembeli.trim() || '-',
        jikaMenyewa: r.jikaMenyewa.trim() || '-',
        jikaMeminjam: r.jikaMeminjam.trim() || '-',
        catatanOpsional: r.catatanOpsional.trim() || '-',
        tanggalPermintaan,
      }));

    if (!newEntries.length) {
      notify('Isi minimal satu nama barang.', 'error');
      return;
    }

    const { data, error } = await supabase
      .from('requests')
      .insert(newEntries.map(toDbItem))
      .select('*');

    if (error) {
      console.error(error);
      notify(`Gagal menyimpan: ${error.message}`, 'error');
      return;
    }

    setItems((prev) => [...prev, ...data.map(fromDbItem)]);
    setActiveDivisiTab(effectiveDivisi);

    if (isMainAdmin || isDivisionAdmin) {
      setActiveView('rekap');
    }

    notify(`${data.length} pengajuan untuk divisi ${effectiveDivisi} berhasil disimpan!`);
  };

  // Tambah atau edit barang dari halaman rekap ke Supabase
  const handleSaveCrudItem = async (payload) => {
    if (payload.id) {
      const existingItem = items.find((item) => item.id === payload.id);
      if (!canEditItem(profile, existingItem, payload)) {
        notify(
          'Akses ditolak: Anda hanya dapat mengubah data divisi Anda sendiri.',
          'error'
        );
        return;
      }
    } else {
      try {
        payload.divisi = resolveEffectiveDivisionForCreate(
          profile,
          payload.divisi
        );
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }

    const canUpload = canManagePhotos(profile);
    const dbPayload = toDbItem(payload, { includeFotoBukti: canUpload });
    let result;

    if (payload.id) {
      result = await supabase
        .from('requests')
        .update(dbPayload)
        .eq('id', payload.id)
        .select('*')
        .single();

      if (result.error && isMissingFotoBuktiColumnError(result.error)) {
        result = await supabase
          .from('requests')
          .update(toDbItem(payload, { includeFotoBukti: false }))
          .eq('id', payload.id)
          .select('*')
          .single();
      }
    } else {
      result = await supabase
        .from('requests')
        .insert(dbPayload)
        .select('*')
        .single();

      if (result.error && isMissingFotoBuktiColumnError(result.error)) {
        result = await supabase
          .from('requests')
          .insert(toDbItem(payload, { includeFotoBukti: false }))
          .select('*')
          .single();
      }
    }

    if (result.error) {
      notify(`Gagal menyimpan barang: ${result.error.message}`, 'error');
      return;
    }

    if (canUpload && payload.fotoBukti !== undefined) {
      saveFallbackPhotosForItem(result.data.id, payload.fotoBukti);
    }

    const savedItem = fromDbItem({
      ...result.data,
      foto_bukti:
        result.data.foto_bukti ??
        (canUpload ? normalizePhotoList(payload.fotoBukti) : undefined),
    });

    setItems((prev) =>
      payload.id
        ? prev.map((item) => (item.id === payload.id ? savedItem : item))
        : [...prev, savedItem]
    );

    notify('Data barang berhasil disimpan!');
  };

  // Perbarui foto bukti transaksi langsung dari tabel / lightbox (Khusus Admin Utama)
  const handleUpdateItemPhotos = async (itemId, nextPhotos) => {
    if (!canManagePhotos(profile)) {
      notify(
        'Akses ditolak: Hanya Admin Utama (Divisi Perlengkapan) yang dapat mengelola foto bukti transaksi.',
        'error'
      );
      return;
    }

    const normalized = normalizePhotoList(nextPhotos);
    const { error } = await supabase
      .from('requests')
      .update({ foto_bukti: normalized })
      .eq('id', itemId)
      .select('*')
      .single();

    if (error && !isMissingFotoBuktiColumnError(error)) {
      notify(`Gagal menyimpan foto bukti: ${error.message}`, 'error');
      return;
    }

    saveFallbackPhotosForItem(itemId, normalized);

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, fotoBukti: normalized } : item
      )
    );

    notify('Foto bukti transaksi berhasil diperbarui!');
  };

  // Hapus barang dari database Supabase
  const handleDeleteItem = async (id) => {
    const existingItem = items.find((item) => item.id === id);
    if (!canDeleteItem(profile, existingItem)) {
      notify(
        'Akses ditolak: Anda tidak memiliki izin untuk menghapus data ini.',
        'error'
      );
      return;
    }

    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) {
      notify(`Gagal menghapus: ${error.message}`, 'error');
      return;
    }

    removeFallbackPhotosForItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    notify('Data barang berhasil dihapus.');
  };

  // Simpan perubahan timeline ke Supabase (Hanya Admin Utama)
  const saveTimeline = async (id, status, progres) => {
    if (!canManageTimeline) {
      notify('Hanya Admin Utama yang dapat mengubah timeline.', 'error');
      return;
    }

    const { data, error } = await supabase
      .from('timeline_tasks')
      .update({ status, progres })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      notify(`Gagal menyimpan timeline: ${error.message}`, 'error');
      return;
    }

    setTimeline((prev) => prev.map((tl) => (tl.id === id ? data : tl)));
  };

  const handleChangeTimelineStatus = async (id, newStatus) => {
    if (!canManageTimeline) return;

    const current = timeline.find((tl) => tl.id === id);
    if (!current) return;

    let progres = current.progres;

    if (newStatus === 'Selesai') progres = 100;
    else if (newStatus === 'Belum Mulai') progres = 0;
    else if (progres === 0 || progres === 100) progres = 50;

    await saveTimeline(id, newStatus, progres);
  };

  const handleChangeTimelineProgress = async (id, newProgres) => {
    if (!canManageTimeline) return;

    const progres = Math.max(0, Math.min(100, Number(newProgres)));
    const status =
      progres === 100
        ? 'Selesai'
        : progres > 0
          ? 'Sedang Berjalan'
          : 'Belum Mulai';

    await saveTimeline(id, status, progres);
  };

  const visibleItemsCount = filterItemsByProfileAccess(items, profile).length;

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <ProtectedRoute
        loading={loading}
        isAuthenticated={isAuthenticated}
        profile={profile}
        fallbackLogin={
          <LoginPage onLogin={handleLogin} authError={authError} />
        }
      >
        <div className="min-h-screen flex flex-col bg-[#EAF2FF] text-[#0A1936]">
          <Header
            activeView={activeView}
            onSelectView={setActiveView}
            totalItemsCount={visibleItemsCount}
            profile={profile}
            onLogout={handleLogout}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {activeView === 'form' && (
              <FormPage
                profile={profile}
                onSubmitItems={handleSubmitItems}
                onNotify={notify}
              />
            )}

            {activeView === 'rekap' && (
              <RekapPage
                items={items}
                profile={profile}
                activeDivisiTab={activeDivisiTab}
                onSelectDivisi={setActiveDivisiTab}
                onSaveCrudItem={handleSaveCrudItem}
                onUpdateItemPhotos={handleUpdateItemPhotos}
                onDeleteItem={handleDeleteItem}
                onNotify={notify}
              />
            )}

            {activeView === 'timeline' && (
              <ProtectedRoute
                loading={false}
                isAuthenticated={isAuthenticated}
                profile={profile}
                allowedRoles={[ROLES.ADMIN]}
                onReturnAllowedView={() => setActiveView('form')}
              >
                <TimelinePage
                  timeline={timeline}
                  canEdit={canManageTimeline}
                  onChangeStatus={handleChangeTimelineStatus}
                  onChangeProgress={handleChangeTimelineProgress}
                />
              </ProtectedRoute>
            )}
          </main>
        </div>
      </ProtectedRoute>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedPortal />
    </AuthProvider>
  );
}
