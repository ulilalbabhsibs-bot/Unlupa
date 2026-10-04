import React, { useMemo } from 'react';
import { 
  Play, 
  CalendarCheck, 
  CloudDownload, 
  CheckCircle2, 
  Loader2, 
  Flame, 
  TrendingUp, 
  Activity,
  Layers,
  Sparkles,
  Zap,
  Calendar
} from 'lucide-react';
import { JuzMeta } from '../../data/quranData';
import { QuranPageItem } from '../../types';
import { isDue } from '../../lib/fsrs';

interface Props {
  juz: JuzMeta;
  quranPages: QuranPageItem[];
  activeCount: number;
  dueCount: number;
  mapanCount: number;
  language: string;
  isDownloadingJuz: boolean;
  downloadProgress: { current: number; total: number } | null;
  juzOfflineStatus: { total: number; cached: number; isFullyCached: boolean } | null;
  onDownloadJuz: () => void;
  onStartReview: () => void;
  onOpenCalendar: () => void;
  onFilterTabChange: (tab: 'all' | 'due' | 'active' | 'mapan') => void;
  activeFilterTab: 'all' | 'due' | 'active' | 'mapan';
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const QuranJuzBentoHero: React.FC<Props> = ({
  juz,
  quranPages,
  activeCount,
  dueCount,
  mapanCount,
  language,
  isDownloadingJuz,
  downloadProgress,
  juzOfflineStatus,
  onDownloadJuz,
  onStartReview,
  onOpenCalendar,
  onFilterTabChange,
  activeFilterTab
}) => {
  const totalPages = juz.totalPages;
  const inactiveCount = Math.max(0, totalPages - activeCount);
  const mapanPercentage = totalPages > 0 ? Math.round((mapanCount / totalPages) * 100) : 0;

  // Mini Proyeksi Wave & Beban 7 Hari
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  // 7-day scheduled pages for this Juz
  const next7DaysData = useMemo(() => {
    const juzPages = (quranPages || []).filter(p => p.juzNumber === juz.juzNumber && p.isActive);
    const dateCounts = new Map<string, number>();

    juzPages.forEach(p => {
      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        const dStr = formatLocalDate(nextDate);
        dateCounts.set(dStr, (dateCounts.get(dStr) || 0) + 1);
      }
    });

    const days: { dateStr: string; count: number; dayName: string; isToday: boolean }[] = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = formatLocalDate(d);
      days.push({
        dateStr: dStr,
        count: dateCounts.get(dStr) || 0,
        dayName: i === 0 ? 'Hari Ini' : dayNames[d.getDay()],
        isToday: i === 0
      });
    }

    const totalScheduled = days.reduce((acc, curr) => acc + curr.count, 0);
    return { days, totalScheduled };
  }, [quranPages, juz.juzNumber, today]);

  // Ring geometry
  const rDial = 26;
  const cDial = 2 * Math.PI * rDial; // 163.36
  const offsetDial = cDial - (cDial * mapanPercentage) / 100;

  return (
    <div className="neumorph-card rounded-3xl p-3 sm:p-4 shadow-md border border-white/60 dark:border-slate-800/80 space-y-2.5">
      
      {/* ========================================================
          KARTU BENTO SUPER-KOMPAK (GRID DENSITAS TINGGI: SEPEREMPAT LAYAR)
      ======================================================== */}
      <div className="grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch">

        {/* ----------------------------------------------------
            BLOK 1 (KIRI, 4 COLS): DIAL LINGKARAN MAPAN & AKSI
        ---------------------------------------------------- */}
        <div className="col-span-4 sm:col-span-3 p-2 rounded-2xl clay-card-subtle bg-slate-50/70 dark:bg-slate-900/50 flex flex-col items-center justify-between text-center relative overflow-hidden">
          
          {/* Circular Mapan Progress */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center my-0.5">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={rDial}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-200 dark:text-slate-800"
              />
              <circle
                cx="32"
                cy="32"
                r={rDial}
                fill="none"
                stroke="#10B981"
                strokeWidth="5"
                strokeDasharray={cDial}
                strokeDashoffset={offsetDial}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
                {mapanPercentage}%
              </span>
              <span className="text-[7.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Mapan
              </span>
            </div>
          </div>

          {/* Quick Icon Actions (Kalender & Offline) */}
          <div className="flex items-center gap-1.5 mt-1">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="w-6 h-6 rounded-lg clay-pill text-indigo-500 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
              title={language === 'en' ? 'Review Calendar' : 'Kalender Murajaah'}
            >
              <Calendar className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={onDownloadJuz}
              disabled={isDownloadingJuz}
              className={`w-6 h-6 rounded-lg clay-pill flex items-center justify-center cursor-pointer shadow-2xs transition-all ${
                juzOfflineStatus?.isFullyCached
                  ? 'text-emerald-500'
                  : isDownloadingJuz
                  ? 'text-amber-500'
                  : 'text-[#0EA5E9] hover:scale-105'
              }`}
              title={
                juzOfflineStatus?.isFullyCached
                  ? 'Tersimpan Offline'
                  : isDownloadingJuz
                  ? `Mengunduh... ${downloadProgress?.current}/${downloadProgress?.total}`
                  : 'Unduh Halaman Offline'
              }
            >
              {isDownloadingJuz ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : juzOfflineStatus?.isFullyCached ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <CloudDownload className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------
            BLOK 2 (TENGAH, 5 COLS): 4 STATUS METRIK UTAMA (2x2 GRID)
        ---------------------------------------------------- */}
        <div className="col-span-8 sm:col-span-5 p-2 rounded-2xl clay-card-subtle bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-1.5 h-full">
            
            {/* Metrik 1: Halaman Aktif (Biru) */}
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-[#0EA5E9] block leading-none">
                  {activeCount} <span className="text-[9px] text-slate-400 font-semibold">/ {totalPages}</span>
                </span>
                <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Hlm Aktif
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#0EA5E9] shrink-0" />
            </div>

            {/* Metrik 2: Jatuh Tempo (Oranye) */}
            <div 
              onClick={dueCount > 0 ? onStartReview : undefined}
              className={`p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between ${
                dueCount > 0 ? 'cursor-pointer hover:border-orange-300' : ''
              }`}
            >
              <div>
                <span className="text-xs sm:text-sm font-black text-[#FF6F3D] block leading-none">
                  {dueCount} <span className="text-[9px] text-slate-400 font-semibold">Hlm</span>
                </span>
                <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Jatuh Tempo
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#FF6F3D] shrink-0" />
            </div>

            {/* Metrik 3: Ayat/Halaman Mapan (Hijau) */}
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block leading-none">
                  {mapanCount} <span className="text-[9px] text-slate-400 font-semibold">Hlm</span>
                </span>
                <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Mapan
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>

            {/* Metrik 4: Belum Aktif (Abu-abu) */}
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 block leading-none">
                  {inactiveCount} <span className="text-[9px] text-slate-400 font-semibold">Hlm</span>
                </span>
                <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Belum Aktif
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------
            BLOK 3 (KANAN, 12 COLS DI HP / 4 COLS DI DESKTOP):
            PROYEKSI & PRAKIRAAN BEBAN GELOMBANG RINGKAS
        ---------------------------------------------------- */}
        <div className="col-span-12 sm:col-span-4 p-2 rounded-2xl clay-card-subtle bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-emerald-500" />
              <span>Proyeksi Beban</span>
            </span>
            <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400">
              {next7DaysData.totalScheduled} hlm / 7 hari
            </span>
          </div>

          {/* Mini 7-Day Sparkline Bar */}
          <div className="flex items-end justify-between gap-1 h-8 my-1 px-1">
            {next7DaysData.days.map((d, i) => {
              const maxC = Math.max(1, ...next7DaysData.days.map(x => x.count));
              const heightPct = Math.max(15, Math.round((d.count / maxC) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                  <div 
                    className={`w-full rounded-2xs transition-all ${
                      d.count > 0 
                        ? (d.isToday ? 'bg-[#FF6F3D]' : 'bg-[#0EA5E9]') 
                        : 'bg-slate-200 dark:bg-slate-700/60'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.dayName}: ${d.count} halaman`}
                  />
                  <span className="text-[7px] text-slate-400 font-mono leading-none">
                    {d.dayName.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action / Status Pill */}
          {dueCount > 0 ? (
            <button
              type="button"
              onClick={onStartReview}
              className="w-full py-1 rounded-xl bg-gradient-to-r from-[#FF6F3D] to-[#E65320] text-white text-[9.5px] font-extrabold flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-101 active:scale-98 transition-all"
            >
              <Zap className="w-2.5 h-2.5 fill-white" />
              <span>Murajaah Sekarang ({dueCount})</span>
            </button>
          ) : (
            <div className="flex items-center justify-between text-[8.5px] text-slate-500 px-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Beban Terkendali
              </span>
              <span className="text-slate-400">Juz {juz.juzNumber}</span>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================
          BOTTOM RIBBON: FILTER TABS COMPACT
      ======================================================== */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.05] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => onFilterTabChange('all')}
            className={`flex-1 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
              activeFilterTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Semua ({totalPages})
          </button>

          <button
            type="button"
            onClick={() => onFilterTabChange('due')}
            className={`flex-1 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
              activeFilterTab === 'due'
                ? 'bg-[#FF6F3D] text-white shadow-2xs font-extrabold'
                : 'text-[#FF6F3D] hover:bg-[#FF6F3D]/10'
            }`}
          >
            Review ({dueCount})
          </button>

          <button
            type="button"
            onClick={() => onFilterTabChange('active')}
            className={`flex-1 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
              activeFilterTab === 'active'
                ? 'bg-[#0EA5E9] text-white shadow-2xs font-extrabold'
                : 'text-[#0EA5E9] hover:bg-[#0EA5E9]/10'
            }`}
          >
            Aktif ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => onFilterTabChange('mapan')}
            className={`flex-1 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
              activeFilterTab === 'mapan'
                ? 'bg-emerald-500 text-white shadow-2xs font-extrabold'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            Mapan ({mapanCount})
          </button>
        </div>
      </div>

    </div>
  );
};
