import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Activity,
  Flame, 
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { motion } from 'motion/react';

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type ForecastHorizon = 14 | 30 | 50 | 100 | 365;

export const WorkloadForecastWaveWidget: React.FC = () => {
  const { quranPages, items, language } = useApp();
  const [daysHorizon, setDaysHorizon] = useState<ForecastHorizon>(30);
  const [filterType] = useState<'all' | 'quran' | 'books'>('all');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // Uniform compact naming for all horizons: 14 Hari, 30 Hari, 50 Hari, 100 Hari, 365 Hari
  const horizonOptions: { value: ForecastHorizon; labelEn: string; labelId: string }[] = [
    { value: 14, labelEn: '14 Days', labelId: '14 Hari' },
    { value: 30, labelEn: '30 Days', labelId: '30 Hari' },
    { value: 50, labelEn: '50 Days', labelId: '50 Hari' },
    { value: 100, labelEn: '100 Days', labelId: '100 Hari' },
    { value: 365, labelEn: '365 Days', labelId: '365 Hari' },
  ];

  const forecastData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map of date string to item counts
    const dateCounts = new Map<string, { quran: number; books: number; total: number }>();

    // 1. Project Quran items
    (quranPages || []).forEach(p => {
      if (!p.isActive) return;

      // Real FSRS scheduled nextReview date
      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const nextStr = formatLocalDate(nextDate);
          if (!dateCounts.has(nextStr)) {
            dateCounts.set(nextStr, { quran: 0, books: 0, total: 0 });
          }
          const entry = dateCounts.get(nextStr)!;
          entry.quran += 1;
          entry.total += 1;
        }
      }

      // Check recurrent Mapan schedule ONLY if this item is truly mastered/mapan
      if (p.status === 'mastered_for_now' && p.mapanSchedule && p.mapanSchedule.mode !== 'fsrs') {
        for (let d = 1; d <= daysHorizon; d++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + d);
          const fStr = formatLocalDate(futureDate);

          if (p.mapanSchedule.mode === 'weekly' && p.mapanSchedule.weeklyDay === futureDate.getDay()) {
            if (!dateCounts.has(fStr)) dateCounts.set(fStr, { quran: 0, books: 0, total: 0 });
            dateCounts.get(fStr)!.quran += 1;
            dateCounts.get(fStr)!.total += 1;
          } else if (p.mapanSchedule.mode === 'monthly' && p.mapanSchedule.monthlyDate === futureDate.getDate()) {
            if (!dateCounts.has(fStr)) dateCounts.set(fStr, { quran: 0, books: 0, total: 0 });
            dateCounts.get(fStr)!.quran += 1;
            dateCounts.get(fStr)!.total += 1;
          }
        }
      }
    });

    // 2. Project Personal Book items
    (items || []).forEach(it => {
      if (!it.isActive) return;
      const nextReview = it.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const nextStr = formatLocalDate(nextDate);
          if (!dateCounts.has(nextStr)) {
            dateCounts.set(nextStr, { quran: 0, books: 0, total: 0 });
          }
          const entry = dateCounts.get(nextStr)!;
          entry.books += 1;
          entry.total += 1;
        }
      }
    });

    // Generate days array from tomorrow up to horizon
    const days: {
      date: Date;
      dateStr: string;
      label: string;
      dayOfWeek: string;
      count: number;
      quranCount: number;
      booksCount: number;
    }[] = [];

    let maxCount = 0;
    let totalScheduled = 0;
    let peakDay = { dateStr: '', label: '', count: 0 };

    for (let i = 1; i <= daysHorizon; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = formatLocalDate(d);

      const entry = dateCounts.get(dStr) || { quran: 0, books: 0, total: 0 };
      let count = 0;
      if (filterType === 'all') count = entry.total;
      else if (filterType === 'quran') count = entry.quran;
      else count = entry.books;

      totalScheduled += count;
      if (count > maxCount) {
        maxCount = count;
      }
      if (count > peakDay.count) {
        peakDay = {
          dateStr: dStr,
          label: d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: daysHorizon >= 100 ? 'numeric' : undefined }),
          count
        };
      }

      const dayLabel = d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'numeric' });
      const dayOfWeek = d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'narrow' });

      days.push({
        date: d,
        dateStr: dStr,
        label: dayLabel,
        dayOfWeek,
        count,
        quranCount: entry.quran,
        booksCount: entry.books
      });
    }

    const dailyAvg = (totalScheduled / daysHorizon).toFixed(1);

    return { days, maxCount, totalScheduled, peakDay, dailyAvg };
  }, [quranPages, items, daysHorizon, filterType, language]);

  // Construct SVG Wave coordinates
  const svgWidth = 600;
  const svgHeight = 120;
  const paddingX = 16;
  const paddingY = 18;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const points = useMemo(() => {
    const numPoints = forecastData.days.length;
    if (numPoints <= 1) return [];
    const effectiveMax = Math.max(forecastData.maxCount, 2);

    return forecastData.days.map((d, idx) => {
      const x = paddingX + (idx / (numPoints - 1)) * graphWidth;
      // Invert Y because SVG 0 is at top
      const normalizedY = d.count > 0 ? (d.count / effectiveMax) : 0;
      const y = svgHeight - paddingY - normalizedY * graphHeight;
      return { x, y, ...d };
    });
  }, [forecastData, graphWidth, graphHeight]);

  // Build smooth bezier path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x} ${svgHeight - paddingY} L ${first.x} ${svgHeight - paddingY} Z`;
  }, [pathD, points, svgHeight]);

  const activeHoveredPoint = hoveredDayIdx !== null ? points[hoveredDayIdx] : null;

  return (
    <div 
      data-no-swipe="true"
      className="neumorph-card p-3.5 sm:p-5 rounded-3xl space-y-3 sm:space-y-4 relative overflow-hidden"
    >
      {/* 1. Header with Title, Peak Badge & Horizon Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(56,189,248,0.35)]">
            <Activity className="w-4.5 h-4.5 text-white shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {language === 'en' ? 'Future Workload Forecast' : 'Prakiraan Beban Murajaah'}
              </h3>
              <span className="px-2 py-0.5 rounded-full neumorph-inset text-[10px] sm:text-[11px] font-bold text-[#0284C7] dark:text-[#38BDF8]">
                {daysHorizon} {language === 'en' ? 'Days' : 'Hari ke Depan'}
              </span>
            </div>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
              ~{forecastData.dailyAvg} {language === 'en' ? 'items/day avg' : 'materi/hari rata-rata'} • {forecastData.totalScheduled} {language === 'en' ? 'total sessions scheduled' : 'total sesi terjadwal'}
            </p>
          </div>
        </div>

        {/* Horizon Switcher & Peak Warning Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          {/* Multi-Option Horizon Switcher: 14 Hari | 30 Hari | 50 Hari | 100 Hari | 365 Hari */}
          <div className="flex items-center gap-1 neumorph-inset p-1 rounded-2xl text-[11px] font-bold overflow-x-auto scrollbar-none max-w-full">
            {horizonOptions.map(opt => {
              const isActive = daysHorizon === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDaysHorizon(opt.value);
                    setHoveredDayIdx(null);
                  }}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white font-black shadow-xs'
                      : 'text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                  }`}
                  title={`${opt.value} ${language === 'en' ? 'Days Horizon' : 'Hari Horizon'}`}
                >
                  <span className="sm:hidden">{opt.value}h</span>
                  <span className="hidden sm:inline">{language === 'en' ? opt.labelEn : opt.labelId}</span>
                </button>
              );
            })}
          </div>

          {/* Peak Warning Pill */}
          {forecastData.peakDay.count > 0 && (
            <span className="px-2.5 py-1 rounded-2xl neumorph-card text-xs font-bold text-[#FF6F3D] flex items-center gap-1 shrink-0">
              <Flame className="w-3.5 h-3.5 fill-[#FF6F3D]" />
              <span className="hidden sm:inline">{language === 'en' ? 'Peak:' : 'Puncak:'}</span>
              <span>{forecastData.peakDay.label} ({forecastData.peakDay.count})</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Interactive SVG Soft Wave Chart */}
      <div className="relative pt-1 pb-0.5">
        <div className="w-full h-32 sm:h-36 neumorph-inset rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal Guide Lines */}
            <line
              x1={paddingX}
              y1={svgHeight - paddingY}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingY}
              stroke="currentColor"
              strokeWidth="1"
              className="text-black/[0.06] dark:text-white/[0.06]"
            />
            <line
              x1={paddingX}
              y1={paddingY}
              x2={svgWidth - paddingX}
              y2={paddingY}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-black/[0.04] dark:text-white/[0.04]"
            />

            {/* Gradient Area Fill */}
            <defs>
              <linearGradient id="waveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#0284C7" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="waveLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#FF7E4A" />
              </linearGradient>
            </defs>

            {forecastData.totalScheduled > 0 && (
              <motion.path
                d={areaD}
                fill="url(#waveAreaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* Main Wave Curve */}
            <motion.path
              d={pathD}
              fill="none"
              stroke={forecastData.totalScheduled > 0 ? "url(#waveLineGradient)" : "#94A3B8"}
              strokeWidth={forecastData.totalScheduled > 0 ? "3.5" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Interactive Data Pins on Key Points (Clean node rendering depending on horizon density) */}
            {points.map((p, idx) => {
              const isPeak = forecastData.maxCount > 0 && p.count === forecastData.maxCount;
              const isHovered = hoveredDayIdx === idx;
              // Only render pins on days with actual load (>0) or when hovered or on peaks
              const shouldRenderPin = p.count > 0 || isHovered;

              return (
                <g key={idx} className="cursor-pointer">
                  {/* Hit Area for Smooth Hover/Tap */}
                  <rect
                    x={p.x - Math.max(4, graphWidth / points.length / 2)}
                    y={0}
                    width={Math.max(8, graphWidth / points.length)}
                    height={svgHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                    onClick={() => setHoveredDayIdx(idx)}
                  />

                  {/* Visual Node Pin */}
                  {shouldRenderPin && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : isPeak ? 4.5 : 2.5}
                      fill={isPeak ? '#FF6F3D' : '#0284C7'}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 2 : 1.2}
                      className="transition-all shadow-xs"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {activeHoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-xl neumorph-card shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-none z-20"
            >
              <span className="text-[#18234A] dark:text-[#F8FAFC]">
                {activeHoveredPoint.date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: daysHorizon >= 100 ? 'numeric' : undefined })}:
              </span>
              <span className={activeHoveredPoint.count > 0 ? "text-[#0284C7] font-black" : "text-[#5E6D88] dark:text-[#94A3B8]"}>
                {activeHoveredPoint.count} {language === 'en' ? 'materials due' : 'materi tempo'}
              </span>
              {activeHoveredPoint.quranCount > 0 && (
                <span className="text-[10px] text-[#8493AB]">
                  ({activeHoveredPoint.quranCount} Quran • {activeHoveredPoint.booksCount} Kitab)
                </span>
              )}
            </motion.div>
          )}

          {/* Calm/Empty Indicator when 0 scheduled */}
          {forecastData.totalScheduled === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] px-3 py-1 rounded-xl neumorph-card">
                {language === 'en' ? 'No future reviews scheduled in this horizon' : 'Belum ada murajaah jatuh tempo di rentang ini'}
              </span>
            </div>
          )}
        </div>

        {/* Days Ribbon Labels */}
        <div className="flex justify-between items-center px-2 pt-1.5 text-[10px] font-bold text-[#8493AB]">
          <span>+1 {language === 'en' ? 'Day' : 'Hari'} ({forecastData.days[0]?.dayOfWeek})</span>
          <span>+{Math.round(daysHorizon / 4)} {language === 'en' ? 'd' : 'h'}</span>
          <span>+{Math.round(daysHorizon / 2)} {language === 'en' ? 'd' : 'h'}</span>
          <span>+{Math.round((daysHorizon * 3) / 4)} {language === 'en' ? 'd' : 'h'}</span>
          <span>+{daysHorizon} {language === 'en' ? 'Days' : 'Hari'}</span>
        </div>
      </div>
    </div>
  );
};
