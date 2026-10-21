import React from 'react';
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  Printer,
  Camera,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
  LogIn,
  LayoutDashboard
} from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface FrontPageProps {
  items: InventoryItem[];
  isLoggedIn: boolean;
  currentUser: { name: string; email: string; role: string } | null;
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
  onOpenScanner: () => void;
  onSelectDemoItem: (item: InventoryItem) => void;
}

export const FrontPage: React.FC<FrontPageProps> = ({
  items,
  isLoggedIn,
  currentUser,
  onNavigateToLogin,
  onNavigateToDashboard,
  onOpenScanner,
  onSelectDemoItem,
}) => {
  const totalItems = items.length;
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const baikCount = items.filter((it) => it.condition === 'Baik').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a href="#" className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <QrCode className="w-5 h-5" />
            </div>
            <span>Sistem Inventaris</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#fitur" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Fitur Utama
            </a>
            <a href="#alur-kerja" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Alur Kerja
            </a>
            <a href="#uji-coba" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Uji Coba Scan
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {isLoggedIn ? (
              <button
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard</span>
              </button>
            ) : (
              <button
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Sistem</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manajemen Aset & Pelabelan Thermal Presisi</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]" style={{ textWrap: 'balance' }}>
                Sistem Inventarisasi & Pemindaian QR Code Terintegrasi
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Catat aset kantor dengan cepat, hasilkan QR Code otomatis, cetak stiker label thermal 50x30 mm, dan lakukan audit inventaris secara instan melalui kamera ponsel pintar.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                {isLoggedIn ? (
                  <button
                    onClick={onNavigateToDashboard}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <span>Masuk ke Dashboard ({currentUser?.role || 'Admin'})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <span>Masuk sebagai Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onOpenScanner}
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Coba Scan QR Barang</span>
                </button>
              </div>

              {/* Quick Metrics Strip */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Total Jenis Item</span>
                  <p className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">{totalItems} Data</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Stok Aktif</span>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono mt-0.5">{totalUnits} Unit</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Label Standar</span>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">50 x 30 mm</p>
                </div>
              </div>
            </div>

            {/* Right Dominant Visual Carrier */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800 aspect-16/10 group">
                <img
                  src="/src/assets/images/hero_inventory_warehouse_1792422592438.jpg"
                  alt="Stasiun Inventaris dan Pelabelan Barcode"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-white">Stasiun Pelabelan Aktif</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300">Format: Thermal 50x30 mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Kerja Section (Human Editorial Numbering) */}
      <section id="alur-kerja" className="py-16 bg-slate-950/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Alur Pengelolaan Praktis
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              4 Langkah Mudah dari Pencatatan Hingga Audit
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Dirancang dengan antarmuka minim klik agar staf administrasi dan logistik dapat bekerja efisien.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400">01. Pencatatan & Foto</span>
              <h3 className="text-sm font-bold text-white">Input Detail & Kompresi Foto</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin mengisi nama barang, kategori, lokasi, jumlah, dan mengunggah foto yang otomatis dikompresi ke Base64.
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400">02. Otomatisasi Kode</span>
              <h3 className="text-sm font-bold text-white">Generate ID & QR Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sistem menghasilkan ID unik otomatis berformat <code className="text-indigo-300">INV-YYYYMM-XXX</code> beserta gambar QR Code presisi.
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400">03. Cetak Label Thermal</span>
              <h3 className="text-sm font-bold text-white">Stiker 50 x 30 mm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cetak langsung stiker thermal atau unduh file PNG label resolusi tinggi. Qty dan kondisi sengaja dihilangkan agar label tetap rapi.
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400">04. Audit & Pindai Cepat</span>
              <h3 className="text-sm font-bold text-white">Scan Kamera Smartphone</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Arahkan kamera ke stiker barang untuk membuka pop-up kartu informasi lengkap, foto, lokasi, dan stok secara instan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Utama (Bento Grid) */}
      <section id="fitur" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Kemampuan Unggulan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Teknologi Ringan & Fungsional Tanpa Kerumitan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Format Cetak Thermal Siap Pakai</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Didesain khusus untuk printer kasir / barcode thermal mini (50 x 30 mm). Menampilkan identitas aset, kategori, lokasi gudang, dan QR Code tanpa memuat kuantitas atau status rusak.
              </p>
            </div>

            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Pemindai Kamera dengan Beep Audio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Terintegrasi dengan pustaka <code className="text-emerald-300">html5-qrcode</code> yang mendukung kamera belakang ponsel dan webcam komputer, lengkap dengan nada suara konfirmasi saat kode terbaca.
              </p>
            </div>

            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Ekspor Rekap Excel 1-Klik</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download seluruh rekap inventaris yang telah difilter ke dalam file spreadsheet <code className="text-blue-300">.xlsx</code> resmi dengan penyesuaian lebar kolom otomatis via SheetJS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Test / Scan Simulation Section */}
      <section id="uji-coba" className="py-16 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/60 p-8 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center lg:text-left">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Uji Coba Langsung (Tanpa Perlu Login)
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ingin Menguji Cara Kerja Scanner & Viewer?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Anda dapat langsung memindai QR Code menggunakan kamera ponsel Anda sekarang atau mengklik salah satu contoh barang di bawah ini untuk melihat pratinjau kartu informasi publik.
              </p>

              {/* Sample Quick Click Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-xs text-slate-400 font-medium mr-1">Klik contoh barang:</span>
                {items.slice(0, 3).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onSelectDemoItem(it)}
                    className="px-3 py-1.5 text-xs font-mono font-medium bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    {it.id} ({it.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenScanner}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Pemindai</span>
              </button>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Buka Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto py-8 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">Sistem Inventarisasi Barang</span>
            <span>&bull;</span>
            <span>Manajemen QR Code & Label Thermal 50x30 mm</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#fitur" className="hover:text-slate-300 transition-colors">Fitur</a>
            <a href="#alur-kerja" className="hover:text-slate-300 transition-colors">Alur Kerja</a>
            {isLoggedIn ? (
              <button onClick={onNavigateToDashboard} className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                Dashboard
              </button>
            ) : (
              <button onClick={onNavigateToLogin} className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                Login Admin
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
