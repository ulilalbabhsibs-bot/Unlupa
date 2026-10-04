import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Users, 
  ShieldCheck, 
  TrendingDown, 
  Brain, 
  ChevronRight, 
  Lock, 
  Smartphone, 
  Zap, 
  Share2, 
  CheckCircle2, 
  Award, 
  Clock, 
  Check, 
  Crown, 
  Heart, 
  Shield, 
  Star,
  Quote,
  Flame,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveAppPhoneMockup } from './InteractiveAppPhoneMockup';
import { HomeHeroProgressRings } from '../home/HomeHeroProgressRings';
import { WorkloadForecastWaveWidget } from '../home/WorkloadForecastWaveWidget';
import { VisualReviewCalendar } from '../home/VisualReviewCalendar';
import { WeeklyStreakWidget } from '../home/WeeklyStreakWidget';
import { MemoryStabilityPyramidWidget } from '../home/MemoryStabilityPyramidWidget';
import { AccuracyRetentionDialWidget } from '../home/AccuracyRetentionDialWidget';
import { ConsistencyJourneyWidget } from '../home/ConsistencyJourneyWidget';

export const LandingPage: React.FC = () => {
  const { setIsLandingPageOpen, setActiveSpace, openUpgradeModal, quranPages, items, language } = useApp();

  // Interactive Time-Saved Calculator State
  const [targetPages, setTargetPages] = useState<number>(30); // 30 pages default (1.5 Juz)
  
  // Interactive FAQ Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Handlers
  const handleLaunchApp = (targetSpace: 'dashboard' | 'quran' | 'personal' | 'teaching' = 'dashboard') => {
    setIsLandingPageOpen(false);
    setActiveSpace(targetSpace);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPro = () => {
    openUpgradeModal(
      'Landing Page Showcase',
      'Upgrade ke Unlupa Pro untuk membuka seluruh 30 Juz Al-Qur\'an (604 Halaman), AI Audio Tasmi\', Ruang Kelas santri tanpa batas, dan cetak sertifikat resmi.'
    );
  };

  const faqs = [
    {
      q: 'Bagaimana cara Unlupa menjamin hafalan tidak hilang tanpa harus mengulang semua tiap hari?',
      a: 'Unlupa menggunakan algoritma perhitungan kurva kelupaan adaptif. Setiap lembar Al-Qur\'an atau matan kitab memiliki rekam jejak kekuatan unik di memori Anda. Aplikasi memprediksi persis kapan sebuah materi mendekati ambang lupa, dan HANYA memunculkannya di jadwal muraja\'ah hari itu. Materi yang sudah mapan dijadwalkan mingguan atau bulanan sehingga Anda hemat waktu hingga 75%.'
    },
    {
      q: 'Apakah Unlupa menggunakan Mushaf Standar Madinah?',
      a: 'Ya, 100% menggunakan tata letak Mushaf Standar Madinah 604 Halaman (pojok ayat) yang diakui secara internasional. Setiap awal juz dan batas halaman sama persis dengan mushaf fisik yang biasa Anda baca di pesantren atau halaqah.'
    },
    {
      q: 'Apakah aplikasi bisa digunakan saat tidak ada koneksi internet (offline)?',
      a: 'Tentu. Unlupa didesain sebagai Progressive Web App (PWA) modern yang dapat diinstal langsung di layar utama smartphone Android, iPhone, tablet, maupun laptop. Semua lembar mushaf dan jadwal muraja\'ah tersimpan di perangkat sehingga Anda tetap bisa muraja\'ah di masjid atau asrama tanpa kuota.'
    },
    {
      q: 'Bagaimana untuk ustadz atau pembina halaqah tahfidz?',
      a: 'Tersedia Ruang Mengajar terintegrasi di mana ustadz dapat membuat kelas santri, menerima setoran ayat atau matan, memberikan penilaian (Mumtaz, Jayyid, Dha\'if), memantau santri yang rawan lupa, serta mengirim rekap rapor otomatis berlogo resmi ke WhatsApp wali santri hanya dengan 1 klik.'
    },
    {
      q: 'Apa perbedaan akun Standar Gratis dengan Unlupa Pro?',
      a: 'Akun Standar gratis selamanya untuk 2 juz aktif dan 1 kitab. Unlupa Pro membuka akses tanpa batas ke seluruh 30 Juz (604 Halaman), seluruh khazanah kitab di pustaka umum, evaluasi audio tasmi\' cloud, kelas santri tak terbatas, audit setoran hingga 100 riwayat, dan generator sertifikat kelulusan HD resmi.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EEF2F7] dark:bg-[#0B1120] text-[#1B254B] dark:text-[#F8FAFC] font-sans selection:bg-[#FF6F3D]/20 selection:text-[#FF6F3D] transition-colors">
      
      {/* ============================================================
          1. STICKY TOP LUMINOUS CLAYMORPHIC NAVIGATION BAR
          Strict 3-Zone Contract: Brand Wordmark | Nav Links | Actions
          ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#EEF2F7]/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-white/60 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => handleLaunchApp('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl clay-icon-pod-orange text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl sm:text-2xl tracking-tight text-[#1B254B] dark:text-white">
                  unlupa<span className="text-[#FF6F3D] font-sans">.id</span>
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full clay-badge-orange text-white shadow-2xs">
                  Retensi Mutqin
                </span>
              </div>
              <p className="text-[11px] text-[#707E94] dark:text-slate-400 font-medium hidden sm:block -mt-0.5">
                Pengunci Ingatan Al-Qur'an & Kitab Klasik
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#707E94] dark:text-slate-300">
            <a href="#demo-aplikasi" className="hover:text-[#FF6F3D] transition-colors">Demo Aplikasi</a>
            <a href="#tragedi-lupa" className="hover:text-[#FF6F3D] transition-colors">Tragedi Lupa</a>
            <a href="#tiga-ruang" className="hover:text-[#FF6F3D] transition-colors">3 Ruang Khazanah</a>
            <a href="#kalkulator" className="hover:text-[#FF6F3D] transition-colors">Kalkulator Waktu</a>
            <a href="#unlupa-pro" className="hover:text-[#FF6F3D] transition-colors flex items-center gap-1 text-[#FF6F3D]">
              <Crown className="w-3.5 h-3.5 fill-[#FF6F3D]" />
              <span>Unlupa Pro</span>
            </a>
            <a href="#faq" className="hover:text-[#FF6F3D] transition-colors">FAQ</a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Masuk dengan Gmail */}
            <button
              onClick={() => handleLaunchApp('dashboard')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Masuk dengan Akun Google / Gmail"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.3 7.22 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              <span>Masuk Gmail</span>
            </button>

            {/* Login */}
            <button
              onClick={() => handleLaunchApp('dashboard')}
              className="px-3.5 py-2 rounded-2xl clay-card-subtle text-xs font-bold text-[#1B254B] dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>Login</span>
            </button>

            {/* Daftar / Register */}
            <button
              onClick={() => handleLaunchApp('dashboard')}
              className="px-4.5 py-2.5 rounded-2xl clay-btn-primary text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Daftar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          2. GRAND HERO SECTION: SELLING THE SACRED DREAM
          ============================================================ */}
      <section className="relative pt-8 sm:pt-14 pb-12 sm:pb-20 overflow-hidden">
        {/* Luminous Clay Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#FF6F3D]/15 via-[#4E89FF]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-7 sm:space-y-8">
          
          {/* Eyebrow Inset Tag */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clay-inset text-xs font-bold text-[#707E94] dark:text-slate-300"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span>Sistem Kunci Ingatan Adaptif Pertama untuk Penghafal Al-Qur'an & Kitab</span>
          </motion.div>

          {/* Emotional Heart-Piercing Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-[#1B254B] dark:text-white leading-[1.15]"
            >
              Dulu Berdarah-darah Menghafal. <br />
              <span className="text-[#FF6F3D] italic font-normal">
                Jangan Biarkan Satu Ayat Pun Hilang.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-lg md:text-xl text-[#707E94] dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal"
            >
              Menghafal 30 Juz dan bait-bait ilmu syar'i butuh ribuan jam pengorbanan air mata. Tragedi terbesarnya adalah melupakannya. <strong className="text-[#1B254B] dark:text-white font-bold">Unlupa.id</strong> adalah pengunci ingatan digital cerdas yang menghitung persis titik ambang lupa otak Anda — <span className="text-[#FF6F3D] font-bold">hafalan terkunci mutqin seumur hidup, hemat waktu hingga 75%</span>.
            </motion.p>
          </div>

          {/* Primary CTA Cluster */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto"
          >
            <button
              onClick={() => handleLaunchApp('dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl clay-btn-primary text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF6F3D]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Kunci Hafalan Anda — 100% Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleLaunchApp('quran')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl clay-card-subtle text-[#1B254B] dark:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              <BookOpen className="w-5 h-5 text-[#FF6F3D]" />
              <span>Buka Mushaf 604 Halaman</span>
            </button>
          </motion.div>

          {/* Uncompromising Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 pt-2 text-xs font-bold text-[#707E94] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>100% Bebas Iklan & Distraksi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#4E89FF]" />
              <span>Bisa Dipakai Offline (PWA)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#FF6F3D]" />
              <span>Data Tersinkron & Terenkripsi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#8B5CF6]" />
              <span>Algoritma Adaptif Target Retensi 95%+</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
          3. REAL INTERACTIVE SMARTPHONE GADGET SHOWCASE (PERMINTAAN USER)
          Bentuk Gadget HP yang di dalamnya persis aplikasi kita
          ============================================================ */}
      <section id="demo-aplikasi" className="relative py-12 sm:py-20 bg-white/40 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <InteractiveAppPhoneMockup />
        </div>
      </section>

      {/* ============================================================
          LIVE DASHBOARD BERANDA PREVIEW (DARI AWAL SAMPAI AKHIR SAMA PERSIS)
          ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#EEF2F7] dark:bg-[#0B1120]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <span className="px-3.5 py-1 rounded-full clay-badge-orange text-white text-xs font-black uppercase tracking-wider">
              Live Preview Beranda Asli
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1B254B] dark:text-white">
              Tampilan Utuh Workspace Beranda unlupa.id
            </h2>
            <p className="text-sm text-[#707E94] dark:text-slate-300 max-w-2xl mx-auto">
              Inilah tampilan persis yang akan Anda nikmati setelah masuk. Memantau progres Al-Quran, beban kerja, kalender muraja'ah, hingga piramida memori FSRS dalam satu layar interaktif.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5 bg-[#EEF2F7] dark:bg-[#0B1120] p-4 sm:p-6 rounded-3xl border-2 border-white/80 dark:border-white/10 shadow-xl">
            {/* 1. Dual Progress Rings */}
            <HomeHeroProgressRings
              language={language || 'id'}
              quranPages={quranPages}
              items={items}
              onNavigateQuran={() => handleLaunchApp('quran')}
              onNavigateBooks={() => handleLaunchApp('personal')}
            />

            {/* 2. Workload Forecast */}
            <WorkloadForecastWaveWidget />

            {/* 3. Visual Review Calendar */}
            <VisualReviewCalendar
              onOpenQuranReview={() => handleLaunchApp('quran')}
              onOpenPersonalReview={() => handleLaunchApp('personal')}
              onOpenMushafViewer={() => handleLaunchApp('quran')}
            />

            {/* 4. Weekly Streak */}
            <WeeklyStreakWidget />

            {/* 5. Memory Stability & Accuracy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
              <MemoryStabilityPyramidWidget />
              <AccuracyRetentionDialWidget />
            </div>

            {/* 6. Consistency Journey */}
            <ConsistencyJourneyWidget />
          </div>
        </div>
      </section>

      {/* ============================================================
          4. THE AGONY & THE SOLUTION: TRAGEDI LUPA VS RAHASIA UNLUPA
          ============================================================ */}
      <section id="tragedi-lupa" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full clay-badge-danger text-white text-xs font-bold uppercase shadow-2xs">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Kenyataan Pahit Muraja'ah Konvensional</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#1B254B] dark:text-white tracking-tight">
              Mengapa 85% Penghafal Al-Qur'an <br />
              <span className="text-red-500 italic font-normal">Kehilangan Hafalannya Setelah Khatam?</span>
            </h2>

            <p className="text-sm sm:text-base text-[#707E94] dark:text-slate-300 leading-relaxed">
              Rasulullah ﷺ telah mengingatkan: <em>"Jagalah Al-Qur'an ini, demi Dzat yang jiwaku berada di tangan-Nya, sungguh ia lebih cepat lepas daripada unta dalam ikatannya."</em> (HR. Bukhari). Tanpa sistem kalkulasi presisi, muraja'ah hanya mengandalkan ingatan spontan yang melelahkan fisik dan mental.
            </p>
          </div>

          {/* 2-Column Dramatic Contrast: Cara Lama vs Cara Unlupa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            
            {/* Box 1: Tragedi Muraja'ah Konvensional */}
            <div className="clay-card p-6 sm:p-8 space-y-5 border-l-4 border-l-red-500 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl clay-badge-danger text-white flex items-center justify-center">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Metode Konvensional (Acak)
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#1B254B] dark:text-white">
                  Muraja'ah Buta Tanpa Perhitungan Kognitif
                </h3>

                <ul className="space-y-3 text-xs sm:text-sm text-[#707E94] dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span><strong>Mengulang materi yang sudah sangat lancar terus-menerus</strong> sehingga membuang 2-3 jam waktu setiap hari dengan sia-sia.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span><strong>Terlambat mengulang ayat yang kritis</strong> sampai akhirnya benar-benar hilang dan terpaksa menghafal dari nol kembali.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span><strong>Stres dan cemas setiap kali disuruh setoran tasmi'</strong> karena tidak pernah tahu pasti lembar mana yang sudah mutqin.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl clay-inset text-xs font-semibold text-red-600 dark:text-red-400 text-center">
                ⚠️ Hasil: Lelah fisik, rasa bersalah mendalam, dan hafalan tetap pudar perlahan.
              </div>
            </div>

            {/* Box 2: Revolusi Unlupa Mutqin Engine */}
            <div className="clay-card p-6 sm:p-8 space-y-5 border-l-4 border-l-[#10B981] flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl clay-badge-emerald text-white flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">
                    Sistem Pengunci Ingatan Unlupa
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#1B254B] dark:text-white">
                  Kecerdasan Komputasi Pengunci Ingatan Abadi
                </h3>

                <ul className="space-y-3 text-xs sm:text-sm text-[#707E94] dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                    <span><strong>Hanya mereview materi yang mendekati batas lupa</strong> — hemat waktu hingga 75% (cukup 20-30 menit per hari).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                    <span><strong>Setiap lembar mushaf memiliki bobot stabilitas unik</strong> (misal: halaman mutasyabihat dijadwalkan lebih intensif).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                    <span><strong>Hafalan tertanam permanen ke memori jangka panjang</strong> — tenang dan siap shalat malam kapan pun diminta.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl clay-badge-emerald text-white text-xs font-bold text-center shadow-xs">
                ✨ Hasil: Retensi 95%+ stabil, muraja'ah nikmat tanpa beban berlebih.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          5. TIGA RUANG KHAZANAH UNLUPA (AL-QURAN, KITAB, KELAS)
          ============================================================ */}
      <section id="tiga-ruang" className="py-16 sm:py-24 bg-white/40 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full clay-pill text-xs font-bold text-[#FF6F3D] uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Ekosistem Khazanah Lengkap</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#1B254B] dark:text-white tracking-tight">
              Tiga Ruang Pembelajaran. <br />
              <span className="text-[#FF6F3D] italic font-normal">Satu Tujuan: Mutqin Seumur Hidup.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#707E94] dark:text-slate-300">
              Didesain khusus untuk memenuhi seluruh siklus belajar santri, penghafal Al-Qur'an, dan guru tahfidz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            
            {/* Card 1: Ruang Al-Qur'an */}
            <div className="clay-card p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:scale-[1.02] transition-transform">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl clay-icon-pod-orange text-white flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#FF6F3D] uppercase tracking-wider block">Ruang 1</span>
                  <h3 className="text-xl font-bold text-[#1B254B] dark:text-white">Ruang Al-Qur'an (604 Halaman)</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 leading-relaxed">
                  Navigasi 30 Juz dan 604 halaman mushaf Madinah. Dilengkapi pelacak status mutqin per halaman, audio murottal, dan perekam suara tasmi'.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-[#1B254B] dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF6F3D]" />
                    <span>Heatmap 30 Juz & Mode Ritme Mapan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF6F3D]" />
                    <span>Perekam Suara & Audio Syaikh Misyari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF6F3D]" />
                    <span>Pencarian Cepat 604 Halaman, 114 Surah, 30 Juz</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchApp('quran')}
                className="w-full py-3 rounded-xl clay-btn-primary text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Buka Ruang Al-Qur'an</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Ruang Kitab & Matn */}
            <div className="clay-card p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:scale-[1.02] transition-transform">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl clay-icon-pod-pacific text-white flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#4E89FF] uppercase tracking-wider block">Ruang 2</span>
                  <h3 className="text-xl font-bold text-[#1B254B] dark:text-white">Ruang Kitab & Matn Klasik</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 leading-relaxed">
                  Hafalkan matn hadits, nadhom tajwid, ushul fiqh, dan kaidah bahasa Arab. Lengkap dengan pustaka kitab dan AI Book Builder.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-[#1B254B] dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4E89FF]" />
                    <span>Hadits Arba'in, Jazariyah, Tuhfatul Athfal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4E89FF]" />
                    <span>AI Studio Pembuat Flashcard Kitab Mandiri</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4E89FF]" />
                    <span>Mutqin &gt; 336 Hari untuk Memori Permanen</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchApp('personal')}
                className="w-full py-3 rounded-xl clay-card-subtle text-[#4E89FF] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:text-white hover:bg-[#4E89FF] transition-all"
              >
                <span>Buka Ruang Kitab</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Ruang Halaqah & Asatidz */}
            <div className="clay-card p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:scale-[1.02] transition-transform">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl clay-icon-pod-emerald text-white flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#10B981] uppercase tracking-wider block">Ruang 3</span>
                  <h3 className="text-xl font-bold text-[#1B254B] dark:text-white">Ruang Guru & Kelas Santri</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 leading-relaxed">
                  LMS Tahfidz modern untuk ustadz, musyrif, dan pesantren. Pantau setoran harian, audit hingga 100 riwayat, dan kirim rapor ke WhatsApp wali.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-[#1B254B] dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Audit Setoran Santri Hingga 100 Log</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Generator Rapor WhatsApp Siap Kirim</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Cetak Sertifikat Kelulusan HD Resmi</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchApp('teaching')}
                className="w-full py-3 rounded-xl clay-card-subtle text-[#10B981] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:text-white hover:bg-[#10B981] transition-all"
              >
                <span>Buka Ruang Guru</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          6. INTERACTIVE VALUE CALCULATOR: BERAPA WAKTU YANG DIHEMAT?
          ============================================================ */}
      <section id="kalkulator" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="clay-card p-6 sm:p-10 space-y-8">
            
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold text-[#FF6F3D] uppercase tracking-wider clay-pill px-3 py-1">
                Kalkulator Efisiensi Kognitif
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1B254B] dark:text-white">
                Berapa Jam Hidup yang Anda Selamatkan?
              </h2>
              <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300">
                Geser slider target hafalan di bawah ini untuk melihat perbandingan waktu muraja'ah konvensional vs algoritma presisi Unlupa.
              </p>
            </div>

            {/* Slider Control */}
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-[#707E94] dark:text-slate-400">Target Hafalan Aktif:</span>
                <span className="text-lg text-[#FF6F3D] clay-pill px-3.5 py-1">
                  {targetPages} Halaman (± Juz {(targetPages / 20).toFixed(1)})
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="604"
                step="5"
                value={targetPages}
                onChange={(e) => setTargetPages(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#FF6F3D]"
              />
              <div className="flex justify-between text-[11px] font-bold text-[#8E9BAE]">
                <span>5 Hal</span>
                <span>1 Juz (20 Hal)</span>
                <span>15 Juz (300 Hal)</span>
                <span>30 Juz (604 Hal)</span>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              <div className="p-5 rounded-2xl clay-inset text-center space-y-1.5 border border-red-200/50 dark:border-red-900/30">
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Cara Konvensional (Ulang Semua)
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-red-600 dark:text-red-400 py-1">
                  ~{Math.round(targetPages * 2.5)} Menit / Hari
                </div>
                <p className="text-[11px] text-[#707E94] dark:text-slate-400">
                  Semakin banyak juz, waktu muraja'ah meledak hingga 2-3 jam/hari (rawan putus asa).
                </p>
              </div>

              <div className="p-5 rounded-2xl clay-card-subtle text-center space-y-1.5 border border-emerald-300/50 dark:border-emerald-800/40">
                <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">
                  Dengan Algoritma Adaptif Unlupa
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#FF6F3D] py-1">
                  ~{Math.max(8, Math.round(targetPages * 0.45))} Menit / Hari
                </div>
                <p className="text-[11px] text-[#10B981] font-bold">
                  ⚡ Hemat hingga 78% waktu dengan jaminan 95% retensi mutqin.
                </p>
              </div>

            </div>

            <div className="p-4 rounded-2xl clay-inset text-center text-xs font-semibold text-[#1B254B] dark:text-slate-200">
              🎉 <strong>Dalam 1 Tahun:</strong> Anda menghemat lebih dari <strong className="text-[#FF6F3D] font-mono">{Math.round((targetPages * 2.5 - Math.max(8, targetPages * 0.45)) * 365 / 60)} Jam</strong>! Waktu berharga ini dapat Anda gunakan untuk menambah hafalan juz baru atau mempelajari kitab lainnya.
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          7. THE SHOW-STOPPING PRO SHOWCASE: "RUGI KALAU GAK PAKAI PRO"
          ============================================================ */}
      <section id="unlupa-pro" className="py-16 sm:py-24 bg-white/40 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full clay-badge-orange text-white text-xs font-black uppercase shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-white" />
              <span>Unlupa Pro Mastery</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#1B254B] dark:text-white tracking-tight">
              Investasi Terbaik untuk Menjaga Kalam Ilahi <br />
              <span className="text-[#FF6F3D] italic font-normal">Seumur Hidup Anda.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#707E94] dark:text-slate-300">
              Bandingkan biaya kursus atau karantina tahfidz jutaan rupiah. Di Unlupa Pro, seluruh teknologi mutqin tercanggih tersedia hanya dengan harga secangkir kopi.
            </p>
          </div>

          {/* Pricing & Value Stack Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-4xl mx-auto">
            
            {/* Free Plan */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1B254B] dark:text-white">Akun Standar</h3>
                  <span className="text-xs font-bold clay-pill px-3 py-1 text-slate-500">Gratis Selamanya</span>
                </div>
                <div className="text-3xl font-black font-mono text-[#1B254B] dark:text-white">
                  Rp 0 <span className="text-xs font-sans font-normal text-slate-400">/ bulan</span>
                </div>
                <p className="text-xs text-[#707E94] dark:text-slate-300 leading-relaxed">
                  Cukup untuk pemula yang baru memulai muraja'ah 1 atau 2 juz awal.
                </p>

                <ul className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Akses hingga 2 Juz Al-Qur'an aktif</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>1 Kitab Pustaka pribadi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Algoritma jadwal adaptif harian</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <span className="w-4 h-4 text-center font-bold text-slate-400">&times;</span>
                    <span>AI Audio Voice Evaluation (Terkunci)</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <span className="w-4 h-4 text-center font-bold text-slate-400">&times;</span>
                    <span>Ruang Kelas Santri & Rapor WhatsApp (Terkunci)</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchApp('dashboard')}
                className="w-full py-3.5 rounded-2xl clay-card-subtle text-[#1B254B] dark:text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Gunakan Versi Gratis
              </button>
            </div>

            {/* Unlupa Pro (Hero Highlight) */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between space-y-6 border-2 border-[#FF6F3D] relative overflow-hidden shadow-xl">
              {/* Corner Ribbon */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full clay-badge-orange text-white shadow-2xs">
                  Sangat Direkomendasikan
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[#FF6F3D]">
                    <Crown className="w-4 h-4 fill-[#FF6F3D]" />
                    <span className="text-xs font-black uppercase tracking-wider">Unlupa Pro Tahfidz</span>
                  </div>
                  <h3 className="text-xl font-black text-[#1B254B] dark:text-white mt-1">Akses 30 Juz & Asatidz Penuh</h3>
                </div>

                <div className="text-3xl font-black font-mono text-[#FF6F3D]">
                  Rp 29.000 <span className="text-xs font-sans font-normal text-slate-400">/ bulan</span>
                </div>
                <p className="text-xs text-[#707E94] dark:text-slate-300 leading-relaxed">
                  Menjaga 30 Juz lengkap dan seluruh khazanah kitab Anda tanpa batas. Garansi kepuasan penuh.
                </p>

                <ul className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs font-bold text-[#1B254B] dark:text-slate-200">
                  <li className="flex items-center gap-2 text-[#FF6F3D]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Buka Seluruh 30 Juz Al-Qur'an (604 Halaman) Sekaligus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>AI Voice Audio Tasmi' Evaluation Tanpa Batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Buka Seluruh Kitab & AI Book Builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Ruang Kelas Santri & Generator Rapor WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Audit Setoran Santri Hingga 100 Log Evaluasi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Cetak Sertifikat Kelulusan HD Resmi Berkelulusan</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleOpenPro}
                className="w-full py-4 rounded-2xl clay-btn-primary text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Crown className="w-4 h-4 fill-white" />
                <span>Buka Akses Unlupa Pro Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          8. TESTIMONIALS & SOCIAL PROOF: KISAH NYATA
          ============================================================ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#FF6F3D] uppercase tracking-wider clay-pill px-3 py-1">
              Kisah Nyata Kemutqinan
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1B254B] dark:text-white">
              Dipercaya Santri, Asatidz, & Profesional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 */}
            <div className="clay-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 italic leading-relaxed">
                  "Setelah khatam 30 Juz, saya sempat putus asa karena rasanya hafalan terus memudar. Dengan Unlupa, jadwal muraja'ah saya jadi sangat terarah. Waktu belajar hemat, tapi ingatan jauh lebih lekat!"
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full clay-badge-orange text-white font-black text-sm flex items-center justify-center">
                  H
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1B254B] dark:text-white">Hafizh Al-Fatih</div>
                  <div className="text-[10px] text-slate-400">Santri Tahfidz 30 Juz &bull; Jombang</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="clay-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 italic leading-relaxed">
                  "Fitur Ruang Guru di Unlupa mengubah cara saya mengajar. Saya bisa memantau 30 santri secara real-time, tahu siapa yang tertinggal, dan sekali klik bisa kirim rekap laporan rapi ke WhatsApp wali santri."
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full clay-badge-emerald text-white font-black text-sm flex items-center justify-center">
                  U
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1B254B] dark:text-white">Ust. Abdullah Fauzi, Lc.</div>
                  <div className="text-[10px] text-slate-400">Musyrif Ma'had Tahfidz &bull; Solo</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="clay-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 italic leading-relaxed">
                  "Sebagai karyawan kantoran dengan waktu terbatas, saya pikir mustahil bisa mutqin. Algoritma Unlupa hanya menyuruh saya mengulang lembar yang kritis. 20 menit tiap subuh sudah cukup!"
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full clay-badge-pacific text-white font-black text-sm flex items-center justify-center">
                  R
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1B254B] dark:text-white">Rizky Pratama, S.T.</div>
                  <div className="text-[10px] text-slate-400">Software Engineer & Penghafal Mandiri &bull; Jakarta</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          9. FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
          ============================================================ */}
      <section id="faq" className="py-16 sm:py-24 bg-white/40 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold text-[#FF6F3D] uppercase tracking-wider clay-pill px-3 py-1">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1B254B] dark:text-white">
              Semua Jawaban untuk Keraguan Anda
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="clay-card overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-[#1B254B] dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#FF6F3D] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 text-xs sm:text-sm text-[#707E94] dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================
          10. GRAND CLIMAX CTA: GERBANG KEMUTQINAN SEJATI
          ============================================================ */}
      <section className="py-20 sm:py-32 text-center relative overflow-hidden">
        {/* Luminous Glow Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#FF6F3D]/20 via-[#4E89FF]/15 to-[#10B981]/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="space-y-5">
            <p className="text-3xl sm:text-5xl md:text-6xl font-arabic text-[#FF6F3D] leading-loose dir-rtl">
              وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ
            </p>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-[#1B254B] dark:text-white tracking-tight leading-tight">
              Kunci Hafalan Anda Hari Ini. <br />
              <span className="text-[#FF6F3D] italic font-normal">
                Sebelum Ia Benar-benar Pergi.
              </span>
            </h2>

            <p className="text-sm sm:text-lg text-[#707E94] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Hafalan Al-Qur'an adalah mahkota kemuliaan bagi Anda dan kedua orang tua di akhirat kelak. Mulai langkah pertama Anda bersama sistem muraja'ah tercanggih hari ini — tanpa bayar sepeser pun.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleLaunchApp('dashboard')}
              className="w-full sm:w-auto px-10 py-4.5 rounded-2xl clay-btn-primary text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-[#FF6F3D]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Buka Unlupa Workspace — Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#8E9BAE] pt-2">
            Tanpa kartu kredit &bull; Bisa diinstal di Android & iOS &bull; 100% Bebas Iklan
          </p>

        </div>
      </section>

      {/* ============================================================
          11. LUXURY EDITORIAL FOOTER
          ============================================================ */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-950/80 py-10 text-xs text-[#707E94] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl clay-icon-pod-orange text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[#1B254B] dark:text-white font-serif font-black text-sm">unlupa.id</span>
              <span className="text-slate-300 mx-2">|</span>
              <span>Sistem Pengunci Ingatan &bull; Mesin Retensi Cerdas Mutqin</span>
            </div>
          </div>

          <div className="text-center sm:text-left text-[#8E9BAE]">
            Mushaf Madinah 604 Halaman &bull; Khazanah Kitab & Matn &bull; Halaqah Santri
          </div>

          <button
            type="button"
            onClick={() => handleLaunchApp('dashboard')}
            className="text-[#FF6F3D] hover:text-[#E65320] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>Masuk ke Aplikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

    </div>
  );
};
