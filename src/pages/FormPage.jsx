import { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { KETENTUAN_ITEMS } from '../data/initialData';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RequestForm from '../components/form/RequestForm';

export default function FormPage({ profile, onSubmitItems, onNotify }) {
  const [showKetentuan, setShowKetentuan] = useState(true);

  return (
    <section className="space-y-6">
      {/* Banner Ketentuan Pendataan */}
      <Card variant="blue" className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#0A1936] flex items-center gap-2">
              <Info className="w-5 h-5 text-[#132956] shrink-0" />
              <span>Ketentuan Pendataan Barang dan Peralatan — Blue Horizon</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              Mohon setiap divisi mengisi daftar barang atau alat yang dibutuhkan. Anda dapat menambahkan{' '}
              <strong>Barang 1, Barang 2, dan seterusnya</strong> sekaligus dalam satu kali pengajuan.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-expanded={showKetentuan}
            onClick={() => setShowKetentuan((prev) => !prev)}
            className="self-start shrink-0"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                showKetentuan ? 'rotate-180' : 'rotate-0'
              }`}
            />
            <span>
              {showKetentuan ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
            </span>
          </Button>
        </div>

        {/* Smooth Collapsible Container */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showKetentuan
              ? 'grid-rows-[1fr] opacity-100 mt-4'
              : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-4 pb-1 border-t-2 border-[#0A1936] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-[#0A1936]">
              {KETENTUAN_ITEMS.map((item) => (
                <div
                  key={item.number}
                  className="bg-white rounded-xl p-3 border-2 border-[#0A1936] shadow-[2px_2px_0px_#0A1936]"
                >
                  <span className="font-black text-[#132956] block mb-0.5">
                    {item.number}
                  </span>
                  <span className="font-medium text-slate-700">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Form Pengajuan Barang */}
      <RequestForm
        profile={profile}
        onSubmitItems={onSubmitItems}
        onNotify={onNotify}
      />
    </section>
  );
}
