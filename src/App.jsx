import { useState, useCallback } from 'react';
import { INITIAL_ITEMS, INITIAL_TIMELINE } from './data/initialData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRoleRoute } from './hooks/useRoleRoute';
import Header from './components/layout/Header';
import Toast from './components/ui/Toast';
import FormPage from './pages/FormPage';
import RekapPage from './pages/RekapPage';
import TimelinePage from './pages/TimelinePage';

export default function App() {
  const { isAdmin } = useRoleRoute();
  const [items, setItems] = useLocalStorage('perlap_items_v2', INITIAL_ITEMS);
  const [timeline, setTimeline] = useLocalStorage(
    'perlap_timeline_v1',
    INITIAL_TIMELINE
  );
  const [activeView, setActiveView] = useState(() =>
    isAdmin ? 'rekap' : 'form'
  );
  const [activeDivisiTab, setActiveDivisiTab] = useState('ALL');
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'success') => {
      const id =
        'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast]
  );

  const handleSubmitItems = ({ divisi, tanggalPermintaan, rows }) => {
    const newEntries = rows.map((r, idx) => ({
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      divisi,
      namaBarang: r.namaBarang.trim(),
      jumlahBarang: Math.max(1, Number(r.jumlahBarang) || 1),
      kategori: r.kategori,
      tersediaDiPerlap: r.tersediaDiPerlap || 'Belum Ada',
      jikaMembeli: r.jikaMembeli.trim() || '-',
      jikaMenyewa: r.jikaMenyewa.trim() || '-',
      jikaMeminjam: r.jikaMeminjam.trim() || '-',
      catatanOpsional: r.catatanOpsional.trim() || '-',
      tanggalPermintaan,
    }));

    setItems((prev) => [...prev, ...newEntries]);
    setActiveDivisiTab(divisi);

    if (isAdmin) {
      setActiveView('rekap');
      notify(
        `${newEntries.length} barang berhasil ditambahkan ke Rekap - ${divisi}!`
      );
    } else {
      notify(
        `Pengajuan ${newEntries.length} barang dari Divisi ${divisi} berhasil dikirim!`
      );
    }
  };

  const handleTogglePerlapStatus = (id, newStatus) => {
    if (!isAdmin) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, tersediaDiPerlap: newStatus } : item
      )
    );
    notify(`Status ketersediaan di Perlap diubah menjadi "${newStatus}".`);
  };

  const handleSaveCrudItem = (payload) => {
    if (!isAdmin) return;
    if (payload.id) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === payload.id ? { ...item, ...payload } : item
        )
      );
      notify(`Data "${payload.namaBarang}" berhasil diperbarui!`);
    } else {
      const newItem = {
        ...payload,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setItems((prev) => [...prev, newItem]);
      notify(`Barang "${payload.namaBarang}" berhasil ditambahkan oleh Admin!`);
    }
  };

  const handleDeleteItem = (id) => {
    if (!isAdmin) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    notify('Data barang dihapus.');
  };

  const handleResetDefaultData = () => {
    if (!isAdmin) return;
    setItems(INITIAL_ITEMS);
    setTimeline(INITIAL_TIMELINE);
    setActiveDivisiTab('ALL');
    notify('Data dikembalikan ke data awal.');
  };

  const handleChangeTimelineStatus = (id, newStatus) => {
    setTimeline((prev) =>
      prev.map((tl) => {
        if (tl.id !== id) return tl;
        let nextProgres = tl.progres;
        if (newStatus === 'Selesai') {
          nextProgres = 100;
        } else if (newStatus === 'Belum Mulai') {
          nextProgres = 0;
        } else if (
          newStatus === 'Sedang Berjalan' &&
          (tl.progres === 0 || tl.progres === 100)
        ) {
          nextProgres = 50;
        }
        return {
          ...tl,
          status: newStatus,
          progres: nextProgres,
        };
      })
    );
  };

  const handleChangeTimelineProgress = (id, newProgres) => {
    setTimeline((prev) =>
      prev.map((tl) => {
        if (tl.id !== id) return tl;
        let nextStatus = 'Belum Mulai';
        if (newProgres === 100) {
          nextStatus = 'Selesai';
        } else if (newProgres > 0) {
          nextStatus = 'Sedang Berjalan';
        }
        return {
          ...tl,
          progres: newProgres,
          status: nextStatus,
        };
      })
    );
  };

  const currentView = isAdmin ? activeView : 'form';

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FF] text-[#0A1936]">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <Header
        activeView={currentView}
        onSelectView={setActiveView}
        totalItemsCount={items.length}
        isAdmin={isAdmin}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'form' && (
          <FormPage onSubmitItems={handleSubmitItems} onNotify={notify} />
        )}

        {isAdmin && currentView === 'rekap' && (
          <RekapPage
            items={items}
            isAdmin={isAdmin}
            activeDivisiTab={activeDivisiTab}
            onSelectDivisi={setActiveDivisiTab}
            onTogglePerlapStatus={handleTogglePerlapStatus}
            onSaveCrudItem={handleSaveCrudItem}
            onDeleteItem={handleDeleteItem}
            onResetDefaultData={handleResetDefaultData}
            onNotify={notify}
          />
        )}

        {isAdmin && currentView === 'timeline' && (
          <TimelinePage
            timeline={timeline}
            onChangeStatus={handleChangeTimelineStatus}
            onChangeProgress={handleChangeTimelineProgress}
          />
        )}
      </main>
    </div>
  );
}
