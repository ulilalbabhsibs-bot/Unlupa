import React from 'react';
import { BookOpen, Library, ArrowRight } from 'lucide-react';
import { QuranPageItem, BookItem, Language } from '../../types';
import { getNonQuranIntervalDays } from '../../lib/fsrs';

interface Props {
  language: Language;
  quranPages: QuranPageItem[];
  items: BookItem[];
  onNavigateQuran: () => void;
  onNavigateBooks: () => void;
}

export const HomeHeroProgressRings: React.FC<Props> = ({
  language,
  quranPages,
  items,
  onNavigateQuran,
  onNavigateBooks
}) => {
  // 1. Al-Qur'an Calculations
  const totalQuranPages = 604;
  const activeQuranPages = quranPages.filter(p => p.isActive).length;
  const quranActivePct = ((activeQuranPages / totalQuranPages) * 100);
  
  // Mutqin for Quran: stability >= 74.5 or interval > 30 days
  const mutqinQuranPages = quranPages.filter(p => 
    p.isActive && (p.status === 'mastered_for_now' || (p.fsrsData.stability >= 74.5 || Math.round(p.fsrsData.stability * 0.4025587) > 30))
  ).length;
  const quranMutqinOfActivePct = activeQuranPages > 0 ? Math.round((mutqinQuranPages / activeQuranPages) * 100) : 0;

  // 2. Ruang Buku (Non Al-Qur'an) Calculations (Pribadi + Pustaka + Kelas)
  const totalBookItems = items.length;
  const activeBookItems = items.filter(i => i.isActive).length;
  const booksActivePct = totalBookItems > 0 ? ((activeBookItems / totalBookItems) * 100) : 0;
  
  // Mutqin for Books: interval >= 336 days (or status === 'mastered')
  const mutqinBookItems = items.filter(i => 
    i.isActive && (i.status === 'mastered' || getNonQuranIntervalDays(i.fsrsData) >= 336)
  ).length;
  const booksMutqinOfActivePct = activeBookItems > 0 ? Math.round((mutqinBookItems / activeBookItems) * 100) : 0;

  // SVG Geometry Constants
  // Outer Ring: radius 36, circumference 2 * PI * 36 = 226.19
  const outerCircumference = 226.19;
  // Inner Ring: radius 26, circumference 2 * PI * 26 = 163.36
  const innerCircumference = 163.36;

  const quranOuterOffset = outerCircumference - (outerCircumference * Math.min(100, Math.max(0, quranActivePct)) / 100);
  const quranInnerOffset = innerCircumference - (innerCircumference * Math.min(100, Math.max(0, quranMutqinOfActivePct)) / 100);

  const booksOuterOffset = outerCircumference - (outerCircumference * Math.min(100, Math.max(0, booksActivePct)) / 100);
  const booksInnerOffset = innerCircumference - (innerCircumference * Math.min(100, Math.max(0, booksMutqinOfActivePct)) / 100);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
      
      {/* ========================================================
          Card 1 (Sebelah Kiri): Diagram Al-Qur'an (604 Halaman)
          True Neumorphic Tactile Dial & Inset Wells
          ======================================================== */}
      <button
        type="button"
        onClick={onNavigateQuran}
        className="neumorph-card p-3 sm:p-4 rounded-3xl flex flex-col items-center justify-between text-center hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group shadow-sm relative overflow-hidden"
      >
        {/* Atas: Dual Concentric Circular Gauge with Raised Tactile Knob */}
        <div className="relative w-22 h-22 sm:w-26 sm:h-26 shrink-0 my-1 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <defs>
              <linearGradient id="quranOuterGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6F3D" />
                <stop offset="100%" stopColor="#FFA180" />
              </linearGradient>
              <linearGradient id="quranInnerGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <filter id="quranGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#FF6F3D" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Sunken Outer Track (Total Active / 604) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#D2DBE8"
              strokeWidth="7"
              fill="transparent"
              className="dark:stroke-[#1B263B]"
            />
            {/* Luminous Active Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#quranOuterGradCompact)"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) - ((2 * Math.PI * 40) * Math.min(100, Math.max(0, quranActivePct)) / 100)}
              strokeLinecap="round"
              filter="url(#quranGlow)"
              className="transition-all duration-1000 ease-out"
            />

            {/* Sunken Inner Track (Mutqin Portion) */}
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="#DCE4EE"
              strokeWidth="5"
              fill="transparent"
              className="dark:stroke-[#151F30]"
            />
            {/* Inner Mutqin Arc */}
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="url(#quranInnerGradCompact)"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={(2 * Math.PI * 30) - ((2 * Math.PI * 30) * Math.min(100, Math.max(0, quranMutqinOfActivePct)) / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center 3D Raised Dial Knob */}
          <div className="absolute inset-0 m-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
              {quranActivePct < 1 && quranActivePct > 0 ? quranActivePct.toFixed(1) : Math.round(quranActivePct)}%
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] text-[#8493AB] dark:text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
              604 Hal
            </span>
          </div>
        </div>

        {/* Bawah: Title & Metrics Information */}
        <div className="w-full mt-1.5 space-y-1 sm:space-y-1.5">
          {/* Card Title Header with Icon and Subtle Arrow */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[#18234A] dark:text-[#F8FAFC]">
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(255,111,61,0.35)]">
              <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold truncate">
              {language === 'en' ? 'Al-Quran' : 'Al-Qur\'an'}
            </span>
            <ArrowRight className="w-3 h-3 text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* Inset Metrics Tray */}
          <div className="neumorph-inset p-1.5 sm:p-2 rounded-xl space-y-1 text-[10px] sm:text-xs">
            {/* Active Hafalan */}
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                <span>{language === 'en' ? 'Active' : 'Hafalan'}</span>
              </span>
              <span className="font-mono font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {activeQuranPages} <span className="font-sans font-normal text-[9px] text-[#8493AB]">/ 604</span>
              </span>
            </div>

            {/* Mutqin (> 30 days) */}
            <div className="flex items-center justify-between px-1 border-t border-black/[0.04] dark:border-white/[0.04] pt-0.5">
              <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span title="Stabilitas interval > 30 hari">
                  Mutqin
                </span>
              </span>
              <span className="font-mono font-bold text-[#10B981]">
                {mutqinQuranPages} <span className="font-sans font-normal text-[9px] text-[#8493AB]">({quranMutqinOfActivePct}%)</span>
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* ========================================================
          Card 2 (Sebelah Kanan): Diagram Ruang Buku
          True Neumorphic Tactile Dial & Inset Wells
          ======================================================== */}
      <button
        type="button"
        onClick={onNavigateBooks}
        className="neumorph-card p-3 sm:p-4 rounded-3xl flex flex-col items-center justify-between text-center hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group shadow-sm relative overflow-hidden"
      >
        {/* Atas: Dual Concentric Circular Gauge with Raised Tactile Knob */}
        <div className="relative w-22 h-22 sm:w-26 sm:h-26 shrink-0 my-1 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <defs>
              <linearGradient id="booksOuterGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <linearGradient id="booksInnerGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <filter id="booksGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3B82F6" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Sunken Outer Track (Total Active / Total Items) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#D2DBE8"
              strokeWidth="7"
              fill="transparent"
              className="dark:stroke-[#1B263B]"
            />
            {/* Luminous Active Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#booksOuterGradCompact)"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) - ((2 * Math.PI * 40) * Math.min(100, Math.max(0, booksActivePct)) / 100)}
              strokeLinecap="round"
              filter="url(#booksGlow)"
              className="transition-all duration-1000 ease-out"
            />

            {/* Sunken Inner Track (Mutqin Portion) */}
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="#DCE4EE"
              strokeWidth="5"
              fill="transparent"
              className="dark:stroke-[#151F30]"
            />
            {/* Inner Mutqin Arc */}
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="url(#booksInnerGradCompact)"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={(2 * Math.PI * 30) - ((2 * Math.PI * 30) * Math.min(100, Math.max(0, booksMutqinOfActivePct)) / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center 3D Raised Dial Knob */}
          <div className="absolute inset-0 m-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
              {booksActivePct < 1 && booksActivePct > 0 ? booksActivePct.toFixed(1) : Math.round(booksActivePct)}%
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] text-[#8493AB] dark:text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
              {totalBookItems} Item
            </span>
          </div>
        </div>

        {/* Bawah: Title & Metrics Information */}
        <div className="w-full mt-1.5 space-y-1 sm:space-y-1.5">
          {/* Card Title Header with Icon and Subtle Arrow */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[#18234A] dark:text-[#F8FAFC]">
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(59,130,246,0.35)]">
              <Library className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold truncate">
              {language === 'en' ? 'Books Space' : 'Ruang Buku'}
            </span>
            <ArrowRight className="w-3 h-3 text-[#8493AB] group-hover:text-[#3B82F6] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* Inset Metrics Tray */}
          <div className="neumorph-inset p-1.5 sm:p-2 rounded-xl space-y-1 text-[10px] sm:text-xs">
            {/* Active Items */}
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                <span>{language === 'en' ? 'Active' : 'Materi Aktif'}</span>
              </span>
              <span className="font-mono font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {activeBookItems} <span className="font-sans font-normal text-[9px] text-[#8493AB]">/ {totalBookItems}</span>
              </span>
            </div>

            {/* Mutqin (> 336 days) */}
            <div className="flex items-center justify-between px-1 border-t border-black/[0.04] dark:border-white/[0.04] pt-0.5">
              <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span title="Stabilitas interval > 336 hari">
                  Mutqin
                </span>
              </span>
              <span className="font-mono font-bold text-[#10B981]">
                {mutqinBookItems} <span className="font-sans font-normal text-[9px] text-[#8493AB]">({booksMutqinOfActivePct}%)</span>
              </span>
            </div>
          </div>
        </div>
      </button>

    </div>
  );
};
