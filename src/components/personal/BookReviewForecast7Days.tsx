import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Book, BookItem } from '../../types';
import { getNonQuranIntervalDays, isDue } from '../../lib/fsrs';

interface Props {
  book: Book;
  items: BookItem[];
  language: string;
  onOpenCalendarOnDate?: (dateStr: string) => void;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const BookReviewForecast7Days: React.FC<Props> = ({
  book,
  items,
  language,
  onOpenCalendarOnDate
}) => {
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4 | 5>(1);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  // Generate 7 consecutive days for the selected week
  const next7Days = useMemo(() => {
    const startOffset = (selectedWeek - 1) * 7;
    const days: {
      date: Date;
      dateStr: string;
      dayName: string;
      dateDisplay: string;
      isToday: boolean;
    }[] = [];

    const dayNamesId = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const dayOffset = startOffset + i;
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dStr = formatLocalDate(d);
      const dayIndex = d.getDay();
      const monthIndex = d.getMonth();
      const isRealToday = dStr === todayStr;
      const dayName = isRealToday 
        ? (language === 'en' ? 'Today' : 'Hari Ini')
        : (language === 'en' ? dayNamesEn[dayIndex] : dayNamesId[dayIndex]);
      const dateDisplay = `${d.getDate()} ${language === 'en' ? monthNamesEn[monthIndex] : monthNamesId[monthIndex]}`;

      days.push({
        date: d,
        dateStr: dStr,
        dayName,
        dateDisplay,
        isToday: isRealToday
      });
    }
    return days;
  }, [today, todayStr, selectedWeek, language]);

  // Map review load for each of the 7 days
  const forecastData = useMemo(() => {
    const countMap = new Map<string, { regularCount: number; overdueCount: number }>();
    next7Days.forEach(d => countMap.set(d.dateStr, { regularCount: 0, overdueCount: 0 }));

    const activeBookItems = (items || []).filter(it => it.bookId === book.id && it.isActive);

    activeBookItems.forEach(it => {
      const nextReview = it.fsrsData?.nextReview;

      let primaryDueDate: Date;
      let isOverdue = false;

      if (nextReview) {
        const nextDate = new Date(nextReview);
        if (nextDate < today || isDue(nextReview, it.isActive)) {
          primaryDueDate = new Date(today);
          isOverdue = formatLocalDate(nextDate) !== todayStr;
        } else {
          primaryDueDate = nextDate;
        }
      } else {
        primaryDueDate = new Date(today);
      }

      const primaryStr = formatLocalDate(primaryDueDate);
      if (countMap.has(primaryStr)) {
        const entry = countMap.get(primaryStr)!;
        if (isOverdue) {
          entry.overdueCount += 1;
        } else {
          entry.regularCount += 1;
        }
      }
    });

    let maxLoad = 1;
    let totalScheduled7Days = 0;
    let peakDay = next7Days[0];
    let peakCount = 0;

    next7Days.forEach(d => {
      const counts = countMap.get(d.dateStr) || { regularCount: 0, overdueCount: 0 };
      const totalDay = counts.regularCount + counts.overdueCount;
      if (totalDay > maxLoad) maxLoad = totalDay;
      totalScheduled7Days += totalDay;
      if (totalDay > peakCount) {
        peakCount = totalDay;
        peakDay = d;
      }
    });

    return {
      countMap,
      maxLoad,
      totalScheduled7Days,
      averagePerDay: Math.round(totalScheduled7Days / 7),
      peakDay,
      peakCount
    };
  }, [items, book.id, next7Days, today, todayStr]);

  const hasHighLoad = forecastData.peakCount >= 100;

  return (
    <div className="clay-card p-3.5 sm:p-4.5 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
              {language === 'en' ? '7-Day Review Horizon' : 'Prakiraan Beban 7 Hari ke Depan'}
            </h3>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
              {language === 'en'
                ? `Total ${forecastData.totalScheduled7Days} reviews scheduled (avg. ${forecastData.averagePerDay}/day)`
                : `Total ${forecastData.totalScheduled7Days} kartu terjadwal (rata-rata ${forecastData.averagePerDay} kartu/hari)`}
            </p>
          </div>
        </div>

        {/* Peak load badge & Top-Right Calendar Button */}
        <div className="flex items-center gap-2">
          {hasHighLoad ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-bold shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{language === 'en' ? 'Dense Peak: 100+ cards' : 'Puncak Padat: 100+ kartu'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Balanced Flow (<100/day)' : 'Beban Terkendali (<100/hari)'}</span>
            </span>
          )}

          {onOpenCalendarOnDate && (
            <button
              type="button"
              onClick={() => onOpenCalendarOnDate(todayStr)}
              className="px-3 py-1 rounded-xl clay-btn-gold text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title={language === 'en' ? 'Open Review Calendar' : 'Buka Kalender Jadwal'}
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>{language === 'en' ? 'Calendar' : 'Kalender Jadwal'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Interactive Columns Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
        {next7Days.map((day) => {
          const counts = forecastData.countMap.get(day.dateStr) || { regularCount: 0, overdueCount: 0 };
          const totalCards = counts.regularCount + counts.overdueCount;
          const isHeavy = totalCards >= 100;
          const isModerate = totalCards >= 40 && totalCards < 100;

          // Compute relative height percentage (min 18%, max 100%)
          const heightPct = forecastData.maxLoad > 0 
            ? Math.max(18, Math.round((totalCards / forecastData.maxLoad) * 100))
            : 18;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onOpenCalendarOnDate && onOpenCalendarOnDate(day.dateStr)}
              className={`flex flex-col items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group text-center select-none ${
                day.isToday
                  ? 'clay-card border border-[#FF6F3D]/40 shadow-md scale-102 bg-white dark:bg-[#162035]'
                  : 'clay-inset hover:scale-105 active:scale-95'
              }`}
              title={
                language === 'en'
                  ? `${day.dayName}, ${day.dateDisplay}: ${totalCards} cards (${counts.overdueCount} overdue)`
                  : `${day.dayName}, ${day.dateDisplay}: ${totalCards} kartu (${counts.overdueCount} tunggakan)`
              }
            >
              {/* Day Name */}
              <span className={`text-[11px] font-bold block uppercase tracking-tight ${
                day.isToday ? 'text-[#FF6F3D]' : 'text-[#18234A] dark:text-[#F8FAFC]'
              }`}>
                {day.dayName}
              </span>

              {/* Date */}
              <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-mono font-semibold">
                {day.dateDisplay}
              </span>

              {/* Visual Bar Indicator */}
              <div className="w-full h-12 flex items-end justify-center my-1.5 px-1">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[28px] rounded-lg transition-all duration-300 shadow-inner ${
                    totalCards === 0
                      ? 'bg-black/5 dark:bg-white/10'
                      : isHeavy
                      ? 'bg-rose-500'
                      : isModerate
                      ? 'bg-amber-500'
                      : day.isToday
                      ? 'bg-gradient-to-t from-[#FF6F3D] to-[#FFA180]'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              {/* Card Count Pill */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] leading-tight ${
                totalCards === 0
                  ? 'text-[#8493AB]'
                  : isHeavy
                  ? 'bg-rose-500 text-white'
                  : isModerate
                  ? 'bg-amber-500 text-white'
                  : day.isToday
                  ? 'bg-[#FF6F3D] text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {totalCards}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week Selector Pills - Proportional grid from corner to corner */}
      <div className="grid grid-cols-5 gap-1.5 w-full pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
        {([1, 2, 3, 4, 5] as const).map((wk) => (
          <button
            key={wk}
            type="button"
            onClick={() => setSelectedWeek(wk)}
            className={`py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
              selectedWeek === wk
                ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-xs scale-105'
                : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
            }`}
          >
            {language === 'en' ? `Wk ${wk}` : `Pekan ${wk}`}
          </button>
        ))}
      </div>
    </div>
  );
};
