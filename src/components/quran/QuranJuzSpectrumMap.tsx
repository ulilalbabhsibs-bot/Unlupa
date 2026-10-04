import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Flame, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye,
  Check
} from 'lucide-react';
import { QuranPageItem } from '../../types';
import { isDue } from '../../lib/fsrs';

interface Props {
  juzNumber: number;
  quranPages: QuranPageItem[];
  startPage: number;
  endPage: number;
  totalPages: number;
  language: string;
  fromPage: number;
  toPage: number;
  onChangeRange: (from: number, to: number) => void;
  onSelectPage: (pageNumber: number) => void;
  onNavigateJuz?: (juzNumber: number) => void;
}

export const QuranJuzSpectrumMap: React.FC<Props> = ({
  juzNumber,
  quranPages,
  startPage,
  endPage,
  totalPages,
  language,
  fromPage,
  toPage,
  onChangeRange,
  onSelectPage,
  onNavigateJuz
}) => {
  // Drag / Sweep State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPage, setDragStartPage] = useState<number | null>(null);
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);
  const lastTapRef = useRef<{ pageNum: number; time: number } | null>(null);

  const dragStartRef = useRef<number | null>(null);
  dragStartRef.current = dragStartPage;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const minRange = Math.min(fromPage, toPage);
  const maxRange = Math.max(fromPage, toPage);
  const selectedCount = maxRange - minRange + 1;
  const isAllPagesSelected = minRange === startPage && maxRange === endPage;

  // Commit Range Helper
  const commitRange = useCallback(
    (start: number, end: number) => {
      const cMin = Math.max(startPage, Math.min(endPage, Math.min(start, end)));
      const cMax = Math.min(endPage, Math.max(startPage, Math.max(start, end)));
      onChangeRange(cMin, cMax);
    },
    [startPage, endPage, onChangeRange]
  );

  // Element coordinate helper
  const getPageFromCoords = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const item = el?.closest<HTMLElement>('[data-page-num]');
    if (!item) return null;
    const num = Number(item.dataset.pageNum);
    return !isNaN(num) && num >= startPage && num <= endPage ? num : null;
  };

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pageNum: number) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragStartPage(pageNum);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer Move Handler (Sweep / Drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;

    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x);
      const dy = Math.abs(e.clientY - pointerStartPos.current.y);
      if (dx > 6 || dy > 6) {
        hasMovedRef.current = true;
      }
    }

    if (hasMovedRef.current) {
      const current = getPageFromCoords(e.clientX, e.clientY);
      if (current !== null) {
        commitRange(dragStartRef.current, current);
      }
    }
  };

  // Pointer Up Handler (Click vs Double Click vs Finish Drag)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, pageNum: number) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const wasDrag = hasMovedRef.current;
    setIsDragging(false);
    setDragStartPage(null);
    pointerStartPos.current = null;
    hasMovedRef.current = false;

    if (!wasDrag) {
      // It was a tap / click!
      const now = Date.now();
      const lastTap = lastTapRef.current;

      if (lastTap && lastTap.pageNum === pageNum && now - lastTap.time < 350) {
        // DOUBLE CLICK: Select ONLY this page in the sweep system!
        lastTapRef.current = null;
        onChangeRange(pageNum, pageNum);
        onSelectPage(pageNum);
      } else {
        // SINGLE CLICK: Record tap and jump smoothly to page card below
        lastTapRef.current = { pageNum, time: now };
        onSelectPage(pageNum);
      }
    }
  };

  // Global window listeners for cancel/release
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setDragStartPage(null);
        hasMovedRef.current = false;
      }
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('pointercancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('pointercancel', handleGlobalEnd);
    };
  }, []);

  // Generate page slots data
  const pageSlots = Array.from({ length: totalPages }).map((_, idx) => {
    const targetPageNum = startPage + idx;
    const item = quranPages.find(p => p.pageNumber === targetPageNum);
    const isActive = item?.isActive ?? false;
    const stabilityDays = item ? Math.round((item.fsrsData?.stability || 0) * 0.4025587) : 0;
    const isMapan = item && (item.status === 'mastered_for_now' || stabilityDays >= 30);
    const isDueToday = item ? isDue(item.fsrsData?.nextReview, item.isActive) : false;

    let statusType: 'mapan' | 'due' | 'active' | 'inactive' = 'inactive';
    if (isActive) {
      if (isMapan) statusType = 'mapan';
      else if (isDueToday) statusType = 'due';
      else statusType = 'active';
    }

    const isInRange = targetPageNum >= minRange && targetPageNum <= maxRange;

    return {
      slotIndex: idx,
      pageNumber: targetPageNum,
      item,
      isActive,
      stabilityDays,
      isMapan,
      isDueToday,
      statusType,
      isInRange
    };
  });

  const mapanCount = pageSlots.filter(p => p.statusType === 'mapan').length;
  const dueCount = pageSlots.filter(p => p.statusType === 'due').length;
  const activeCount = pageSlots.filter(p => p.statusType === 'active').length;
  const inactiveCount = pageSlots.filter(p => p.statusType === 'inactive').length;

  // Presets of 5-page chunks
  const chunkPresets: { label: string; from: number; to: number }[] = [];
  const chunkSize = 5;
  for (let p = startPage; p <= endPage; p += chunkSize) {
    const chunkEnd = Math.min(endPage, p + chunkSize - 1);
    chunkPresets.push({
      label: `${p - startPage + 1}-${chunkEnd - startPage + 1}`,
      from: p,
      to: chunkEnd
    });
  }

  return (
    <div className="neumorph-card p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-md border border-white/50 dark:border-slate-800/80 select-none">
      
      {/* ========================================================
          1. HEADER & LEGEND WITH JUZ INFO IN EMPTY SPACE
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        
        {/* Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
              {language === 'en' ? 'Retention Spectrum & Page Sweep Navigation' : 'Peta Spektrum & Navigasi Sapu Halaman'}
            </h3>
          </div>
        </div>

        {/* Legend Badges & JUZ INFO IN EMPTY SPACE */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] font-bold flex-wrap w-full sm:w-auto">
          
          {/* Status Dots */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
              <span>Mapan ({mapanCount})</span>
            </span>
            <span className="flex items-center gap-1 text-[#FF6F3D]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6F3D] inline-block shadow-2xs" />
              <span>Review ({dueCount})</span>
            </span>
            <span className="flex items-center gap-1 text-[#0EA5E9]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] inline-block shadow-2xs" />
              <span>Aktif ({activeCount})</span>
            </span>
            <span className="flex items-center gap-1 text-[#8493AB]">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
              <span>Belum ({inactiveCount})</span>
            </span>
          </div>

          {/* SPACE KOSONG DI SAMPING 'BELUM': INFORMASI JUZ & TOMBOL KEMBALI */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            {/* Juz Badge / Switcher */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
              {onNavigateJuz && juzNumber > 1 && (
                <button
                  type="button"
                  onClick={() => onNavigateJuz(juzNumber - 1)}
                  className="p-0.5 hover:text-[#0EA5E9] transition-colors cursor-pointer"
                  title={`Juz ${juzNumber - 1}`}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
              <span className="font-extrabold text-[10px] tracking-tight">
                Juz {juzNumber}
              </span>
              {onNavigateJuz && juzNumber < 30 && (
                <button
                  type="button"
                  onClick={() => onNavigateJuz(juzNumber + 1)}
                  className="p-0.5 hover:text-[#0EA5E9] transition-colors cursor-pointer"
                  title={`Juz ${juzNumber + 1}`}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Filter Button if pages are sweep-filtered */}
            {!isAllPagesSelected && (
              <button
                type="button"
                onClick={() => onChangeRange(startPage, endPage)}
                className="px-2 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0EA5E9] hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs animate-in fade-in"
                title="Tampilkan semua 20 halaman juz ini"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Semua Hlm</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================
          2. THE 20-PAGE SPECTRUM & SWEEP INTERACTIVE GRID
          (5 Kolom per Baris, bisa disapu drag, klik 1x, klik 2x)
      ======================================================== */}
      <div 
        className="grid grid-cols-5 gap-1.5 sm:gap-2 p-2.5 rounded-2xl neumorph-inset bg-slate-50/50 dark:bg-slate-900/40 touch-none"
        onPointerMove={handlePointerMove}
      >
        {pageSlots.map((slot) => {
          return (
            <div
              key={slot.pageNumber}
              data-page-num={slot.pageNumber}
              onPointerDown={(e) => handlePointerDown(e, slot.pageNumber)}
              onPointerUp={(e) => handlePointerUp(e, slot.pageNumber)}
              className={`p-2 rounded-xl flex flex-col items-center justify-between text-center transition-all cursor-pointer h-13 sm:h-14 relative group select-none ${
                slot.statusType === 'mapan'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xs'
                  : slot.statusType === 'due'
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                  : slot.statusType === 'active'
                  ? 'bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white shadow-2xs'
                  : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8]'
              } ${
                slot.isInRange 
                  ? 'ring-2 ring-[#0EA5E9] dark:ring-sky-400 ring-offset-1 dark:ring-offset-slate-900 scale-[1.02] shadow-md z-10 opacity-100' 
                  : 'opacity-40 hover:opacity-85'
              }`}
              title={`Hal ${slot.pageNumber} • Klik 1x: Buka • Klik 2x: Pilih Halaman • Geser: Sapu`}
            >
              <span className="text-[10px] font-mono font-black tracking-tight leading-none pointer-events-none">
                Hal {slot.pageNumber}
              </span>

              <div className="flex items-center justify-center mt-0.5 pointer-events-none">
                {slot.statusType === 'mapan' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : slot.statusType === 'due' ? (
                  /* Animasi sangat pelan (4s) dan lembut agar nyaman di mata tanpa membuat pusing */
                  <Flame className="w-3.5 h-3.5 text-white animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                ) : slot.statusType === 'active' ? (
                  <span className="text-[9px] font-extrabold text-white/90 font-mono">
                    {slot.stabilityDays > 0 ? `${slot.stabilityDays}d` : 'Aktif'}
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-[#8493AB]">-</span>
                )}
              </div>

              {/* Surah Name Badge on Hover */}
              {slot.item && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                  {slot.item.surahNameEn} • Hal {slot.pageNumber}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================
          3. KONTROL SAPU HALAMAN TERPADU (PRESETS & RANGE BAR)
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
        
        {/* Status Rentang Aktif */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
          <Filter className="w-3 h-3 text-[#0EA5E9]" />
          <span>
            {isAllPagesSelected ? (
              <span>Menampilkan: <strong>Semua {totalPages} Halaman</strong> Juz {juzNumber}</span>
            ) : selectedCount === 1 ? (
              <span>Menampilkan: <strong>Halaman {minRange}</strong> (Fokus 1 Halaman)</span>
            ) : (
              <span>Menampilkan: <strong>Hal {minRange} - {maxRange}</strong> ({selectedCount} hlm)</span>
            )}
          </span>
        </div>

        {/* Quick Range Presets (Semua, 1-5, 6-10, dst) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onChangeRange(startPage, endPage)}
            className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
              isAllPagesSelected
                ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-2xs scale-102 font-black'
                : 'clay-card-subtle text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            {language === 'en' ? 'All (1-20)' : 'Semua (1-20)'}
          </button>

          {chunkPresets.map((preset, idx) => {
            const isSelected = minRange === preset.from && maxRange === preset.to;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeRange(preset.from, preset.to)}
                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-2xs scale-102 font-black'
                    : 'clay-card-subtle text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Hal {preset.label}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
