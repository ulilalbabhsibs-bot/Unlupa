import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Eye, 
  Play, 
  CalendarCheck, 
  FolderTree, 
  Clock, 
  ShieldCheck, 
  Check,
  RotateCw
} from 'lucide-react';
import { Book, BookItem, Chapter } from '../../types';
import { isDue, getNonQuranIntervalDays } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  allBooks?: Book[];
  onSelectBook?: (b: Book) => void;
  items: BookItem[];
  chapters?: Chapter[];
  language: string;
  initialChapterFilter?: string | null;
  onStartReview: (chapterId?: string) => void;
  onPreviewItem?: (item: BookItem) => void;
}

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

export const BookReviewCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  book,
  allBooks = [],
  onSelectBook,
  items,
  chapters = [],
  language,
  initialChapterFilter = null,
  onStartReview,
  onPreviewItem
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [chapterFilter, setChapterFilter] = useState<string | 'all'>(initialChapterFilter || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mapan' | 'active'>('all');
  const [includeProjection, setIncludeProjection] = useState<boolean>(false);
  const [isBookMenuOpen, setIsBookMenuOpen] = useState<boolean>(false);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState<boolean>(false);

  // Map chapter IDs to title
  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    chapters.forEach(c => map.set(c.id, c.title));
    return map;
  }, [chapters]);

  // Sync initial chapter filter if passed
  useEffect(() => {
    if (initialChapterFilter) {
      setChapterFilter(initialChapterFilter);
    } else {
      setChapterFilter('all');
    }
  }, [initialChapterFilter, book.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = language === 'en' 
    ? monthNamesEn[currentMonth] 
    : monthNamesId[currentMonth];

  const weekDayLabels = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

  // Calculate days in the displayed month and grid structure
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes 6

    const days: { 
      dateStr: string; 
      dayNumber: number; 
      isCurrentMonth: boolean; 
      isToday: boolean;
      dateObj: Date;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const dObj = new Date(currentYear, currentMonth - 1, dNum);
      days.push({
        dateStr: formatLocalDate(dObj),
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: formatLocalDate(dObj) === todayStr,
        dateObj: dObj
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dObj = new Date(currentYear, currentMonth, i);
      const dStr = formatLocalDate(dObj);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        dateObj: dObj
      });
    }

    // Next month padding to complete 7-column rows
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        const dObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          dateStr: formatLocalDate(dObj),
          dayNumber: i,
          isCurrentMonth: false,
          isToday: formatLocalDate(dObj) === todayStr,
          dateObj: dObj
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Aggregate book review schedules (immediate & projected) and completed history
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<string, { item: BookItem; isProjected?: boolean; isOverdue?: boolean; overdueDays?: number }[]>();
    const completedMap = new Map<string, { item: BookItem; rating: number }[]>();

    const monthStartDate = new Date(currentYear, currentMonth, 1);
    const monthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    (items || []).forEach(it => {
      if (it.bookId !== book.id) return;
      if (!it.isActive) return;

      // Filter by Chapter if specified
      if (chapterFilter !== 'all') {
        if (chapterFilter === 'unassigned') {
          if (it.chapterId && chapters.some(c => c.id === it.chapterId)) return;
        } else if (it.chapterId !== chapterFilter) {
          return;
        }
      }

      // Filter by Status if specified
      const intervalDays = getNonQuranIntervalDays(it.fsrsData);
      const isMapan = it.status === 'mastered' || intervalDays >= 30;
      if (statusFilter === 'mapan' && !isMapan) return;
      if (statusFilter === 'active' && isMapan) return;

      // 1. Immediate Planned Review
      const nextReview = it.fsrsData?.nextReview;
      let primaryDueDate: Date;
      let isOverdue = false;
      let overdueDays = 0;

      if (nextReview) {
        const nextDate = new Date(nextReview);
        if (nextDate <= today || isDue(nextReview, it.isActive)) {
          primaryDueDate = new Date(today);
          const diffMs = today.getTime() - nextDate.getTime();
          overdueDays = Math.max(1, Math.floor(diffMs / 86400000));
          isOverdue = formatLocalDate(nextDate) !== todayStr;
        } else {
          primaryDueDate = nextDate;
        }
      } else {
        primaryDueDate = new Date(today);
      }

      const primaryStr = formatLocalDate(primaryDueDate);
      if (!plannedMap.has(primaryStr)) plannedMap.set(primaryStr, []);
      const primaryList = plannedMap.get(primaryStr)!;
      if (!primaryList.some(entry => entry.item.id === it.id)) {
        primaryList.push({ item: it, isProjected: false, isOverdue, overdueDays });
      }

      // 2. Projected Future Reviews into Subsequent Months (Only if includeProjection is enabled)
      if (includeProjection && primaryDueDate < monthEndDate) {
        const stepDays = Math.max(1, intervalDays || 1);
        let curProjDate = new Date(primaryDueDate);
        
        const oneYearAhead = new Date(today);
        oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

        for (let cycle = 0; cycle < 12; cycle++) {
          curProjDate = new Date(curProjDate.getTime() + stepDays * 86400000);
          if (curProjDate > oneYearAhead) break;

          if (curProjDate >= monthStartDate && curProjDate <= monthEndDate) {
            const projStr = formatLocalDate(curProjDate);
            if (!plannedMap.has(projStr)) plannedMap.set(projStr, []);
            const list = plannedMap.get(projStr)!;
            if (!list.some(entry => entry.item.id === it.id)) {
              list.push({ item: it, isProjected: true });
            }
          }
        }
      }

      // 3. Historical Review Logs (Completed)
      (it.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) completedMap.set(logDateStr, []);
          completedMap.get(logDateStr)!.push({
            item: it,
            rating: log.rating || 3
          });
        }
      });
    });

    return { plannedMap, completedMap };
  }, [items, book.id, chapterFilter, statusFilter, chapters, today, todayStr, currentYear, currentMonth, includeProjection]);

  // Monthly summary metrics for this specific book
  const metrics = useMemo(() => {
    let scheduledInMonth = 0;
    let definitiveInMonth = 0;
    let projectedInMonth = 0;
    let completedInMonth = 0;

    calendarDays.forEach(day => {
      if (!day.isCurrentMonth) return;
      const planned = scheduleData.plannedMap.get(day.dateStr) || [];
      const completed = scheduleData.completedMap.get(day.dateStr) || [];

      let dayDefCount = 0;
      let dayProjCount = 0;
      planned.forEach(p => {
        if (p.isProjected) dayProjCount++;
        else dayDefCount++;
      });

      definitiveInMonth += dayDefCount;
      projectedInMonth += dayProjCount;
      scheduledInMonth += planned.length;
      completedInMonth += completed.length;
    });

    const activeInScope = (items || []).filter(it => {
      if (it.bookId !== book.id) return false;
      if (!it.isActive) return false;
      if (chapterFilter !== 'all') {
        if (chapterFilter === 'unassigned') {
          if (it.chapterId && chapters.some(c => c.id === it.chapterId)) return false;
        } else if (it.chapterId !== chapterFilter) {
          return false;
        }
      }
      return true;
    });

    const mapanInScope = activeInScope.filter(it => {
      const intervalDays = getNonQuranIntervalDays(it.fsrsData);
      return it.status === 'mastered' || intervalDays >= 30;
    });

    const retentionRate = activeInScope.length > 0 
      ? Math.round((mapanInScope.length / activeInScope.length) * 100) 
      : 0;

    return {
      scheduledInMonth,
      definitiveInMonth,
      projectedInMonth,
      completedInMonth,
      activeCount: activeInScope.length,
      mapanCount: mapanInScope.length,
      retentionRate
    };
  }, [calendarDays, scheduleData, items, book.id, chapterFilter, chapters]);

  // Selected date details
  const selectedDetails = useMemo(() => {
    const planned = scheduleData.plannedMap.get(selectedDateStr) || [];
    const completed = scheduleData.completedMap.get(selectedDateStr) || [];

    const isDateToday = selectedDateStr === todayStr;
    const selectedObj = new Date(selectedDateStr + 'T00:00:00');
    const isPast = selectedObj < new Date(todayStr + 'T00:00:00');
    const isFuture = selectedObj > new Date(todayStr + 'T00:00:00');

    let formattedTitle = selectedDateStr;
    try {
      formattedTitle = selectedObj.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      // fallback
    }

    return {
      formattedTitle,
      isDateToday,
      isPast,
      isFuture,
      planned,
      completed
    };
  }, [selectedDateStr, scheduleData, todayStr, language]);

  // SVG Gauge calculations for Ketahanan Mapan Ring
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringCircumference * metrics.retentionRate) / 100;

  if (!isOpen) return null;

  return (
    <div 
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="book-review-calendar-modal"
        className="neumorph-card rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER: Title + Month Switcher Capsule + Close Button */}
        <div className="p-3.5 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck className="w-4 h-4 text-white shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                  {book.title}
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-extrabold text-[9px] shadow-2xs">
                  {language === 'en' ? 'Book Calendar' : 'Kalender Buku'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                {language === 'en' 
                  ? 'Visual review calendar & spaced retention timeline' 
                  : 'Peta sebaran jadwal murajaah kartu kitab berdasarkan interval FSRS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Month Switcher Capsule */}
            <div className="flex items-center gap-0.5 neumorph-card px-1 py-0.5 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
                className="w-6.5 h-6.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2 py-0.5 text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-colors cursor-pointer whitespace-nowrap"
              >
                {currentMonthName} {currentYear}
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
                className="w-6.5 h-6.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl neumorph-card flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          {/* CONTROLS ROW: Book Switcher + Chapter Filter + Status Segmented Buttons + Simulation Toggle (ALL INLINE/COMPACT) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-black/[0.04] dark:border-white/[0.04] scrollbar-none flex-nowrap">
            {/* Optional Multiple Books Switcher */}
            {allBooks.length > 1 && onSelectBook && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBookMenuOpen(!isBookMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
                  <span className="max-w-[110px] truncate">{book.title}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#5E6D88] transition-transform ${isBookMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBookMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBookMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-60 max-h-60 overflow-y-auto rounded-2xl neumorph-card p-1.5 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {allBooks.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            onSelectBook(b);
                            setChapterFilter('all');
                            setIsBookMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            b.id === book.id
                              ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-xs'
                              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]'
                          }`}
                        >
                          <span className="truncate pr-2">{b.title}</span>
                          {b.id === book.id && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Chapter Filter Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsChapterMenuOpen(!isChapterMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <FolderTree className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
                <span className="max-w-[120px] truncate">
                  {chapterFilter === 'all'
                    ? (language === 'en' ? `All Chapters (${chapters.length})` : `Semua Bab (${chapters.length})`)
                    : chapterFilter === 'unassigned'
                    ? (language === 'en' ? 'Unassigned' : 'Tanpa Bab')
                    : (chapters.find(c => c.id === chapterFilter)?.title || 'Bab')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#5E6D88] transition-transform ${isChapterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isChapterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsChapterMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-64 max-h-64 overflow-y-auto rounded-2xl neumorph-card p-1.5 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setChapterFilter('all');
                        setIsChapterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        chapterFilter === 'all'
                          ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-xs'
                          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]'
                      }`}
                    >
                      <span>{language === 'en' ? `All Chapters (${chapters.length})` : `Semua Bab (${chapters.length})`}</span>
                      {chapterFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>

                    {chapters.map(c => {
                      const isSelected = chapterFilter === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setChapterFilter(c.id);
                            setIsChapterMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-bold shadow-xs'
                              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]'
                          }`}
                        >
                          <span className="truncate pr-2">{c.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setChapterFilter('unassigned');
                        setIsChapterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        chapterFilter === 'unassigned'
                          ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-bold shadow-xs'
                          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]'
                      }`}
                    >
                      <span>{language === 'en' ? 'Unassigned Cards' : 'Tanpa Bab'}</span>
                      {chapterFilter === 'unassigned' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex items-center neumorph-inset p-1 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' 
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs' 
                    : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                }`}
              >
                {language === 'en' ? 'All' : 'Semua'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'active' 
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs' 
                    : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                }`}
              >
                {language === 'en' ? 'Active' : 'Aktif'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('mapan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'mapan' 
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs' 
                    : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                }`}
              >
                {language === 'en' ? 'Mastered' : 'Mapan'}
              </button>
            </div>

            {/* Toggle Simulasi Proyeksi (INLINE HORIZONTALLY) */}
            <button
              type="button"
              onClick={() => setIncludeProjection(!includeProjection)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                includeProjection
                  ? 'neumorph-inset text-[#FF6F3D] ring-1 ring-[#FF6F3D]/30 shadow-xs'
                  : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
              title={includeProjection 
                ? 'Menampilkan jadwal pasti + estimasi siklus masa depan' 
                : 'Aktifkan untuk melihat estimasi siklus pengulangan masa depan'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${includeProjection ? 'text-[#FF6F3D]' : 'text-[#5E6D88]'}`} />
              <span>
                {language === 'en' 
                  ? (includeProjection ? 'Projection Active' : 'Simulate Future') 
                  : (includeProjection ? 'Proyeksi Aktif' : 'Simulasi Proyeksi')}
              </span>
            </button>
          </div>

          {/* SINGLE-ROW ULTRA-COMPACT METRIC SUMMARY STRIP WITH RING GAUGE */}
          <div className="p-2 sm:p-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Left: Mini Circular Progress Ring for Ketahanan Mapan */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={ringRadius}
                    className="stroke-black/[0.06] dark:stroke-white/[0.08]"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={ringRadius}
                    stroke={metrics.retentionRate >= 50 ? '#10B981' : '#FF7E4A'}
                    strokeWidth="5"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {metrics.retentionRate}%
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[11px] font-extrabold text-[#18234A] dark:text-[#F8FAFC] block leading-tight">
                  Ketahanan Mapan
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {metrics.mapanCount}/{metrics.activeCount} kartu mapan
                </span>
              </div>
            </div>

            {/* Right: 2 Compact Stat Pill Capsules */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Jadwal Bulan Ini */}
              <div className="px-2.5 py-1.5 rounded-xl neumorph-inset flex items-center gap-2 min-w-[120px] justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-lg bg-[#FF6F3D]/10 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3 h-3 text-[#FF6F3D]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] truncate">
                    Bulan Ini
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {metrics.definitiveInMonth}
                  </span>
                  <span className="text-[9px] font-semibold text-[#5E6D88]">kartu</span>
                  {includeProjection && metrics.projectedInMonth > 0 && (
                    <span className="text-[9px] font-bold text-[#FF6F3D]">+{metrics.projectedInMonth}</span>
                  )}
                </div>
              </div>

              {/* Sudah Diulang */}
              <div className="px-2.5 py-1.5 rounded-xl neumorph-inset flex items-center gap-2 min-w-[120px] justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] truncate">
                    Diulang
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {metrics.completedInMonth}
                  </span>
                  <span className="text-[9px] font-semibold text-[#5E6D88]">kali</span>
                </div>
              </div>
            </div>
          </div>

          {/* CALENDAR MONTH GRID */}
          <div className="space-y-1.5">
            {/* Day Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
              {weekDayLabels.map((lbl, idx) => (
                <div 
                  key={lbl} 
                  className={`py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    idx === 4 || idx === 6
                      ? 'text-[#FF6E65]' 
                      : 'text-[#64748B] dark:text-[#94A3B8]'
                  }`}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Days Cells (PERFECTLY CENTERED DATE NUMBER LIKE HOME CALENDAR) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day) => {
                const plannedList = scheduleData.plannedMap.get(day.dateStr) || [];
                const completedList = scheduleData.completedMap.get(day.dateStr) || [];

                const definitiveList = plannedList.filter(p => !p.isProjected);
                const projectedList = plannedList.filter(p => p.isProjected);

                const defCount = definitiveList.length;
                const projCount = projectedList.length;
                const plannedCount = plannedList.length;
                const completedCount = completedList.length;
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`h-13 sm:h-15 p-1 sm:p-1.5 rounded-2xl transition-all flex flex-col justify-between items-center relative cursor-pointer group ${
                      !day.isCurrentMonth
                        ? 'opacity-20 pointer-events-none'
                        : isToday && isSelected
                        ? 'neumorph-card ring-2 ring-[#FF6F3D] shadow-[0_0_15px_rgba(255,111,61,0.4)] scale-105 z-10 bg-gradient-to-b from-[#FFF5F0] to-[#FFE8DE] dark:from-[#2A1D1A] dark:to-[#1E1715]'
                        : isToday
                        ? 'neumorph-card ring-2 ring-[#FF6F3D] shadow-[0_0_12px_rgba(255,111,61,0.3)] bg-gradient-to-b from-[#FFF5F0]/70 to-transparent dark:from-[#2A1D1A]/40'
                        : isSelected 
                        ? 'neumorph-card ring-2 ring-[#18234A] dark:ring-slate-300 scale-105 z-10 shadow-md' 
                        : plannedCount > 0
                        ? 'neumorph-card hover:scale-[1.03]'
                        : 'neumorph-card opacity-90 hover:opacity-100 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Day number: STRICTLY CENTERED IN CELL */}
                    <div className="flex items-center justify-center w-full px-0.5 relative">
                      <span className={`text-xs font-black tracking-tight ${
                        !day.isCurrentMonth
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-[#18234A] dark:text-[#F8FAFC]'
                      }`}>
                        {day.dayNumber}
                      </span>

                      {/* Luminous beacon for today */}
                      {isToday && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6F3D] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6F3D]"></span>
                        </span>
                      )}

                      {/* Completed checkmark badge */}
                      {completedCount > 0 && day.isCurrentMonth && !isToday && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 absolute -top-0.5 -right-0.5" />
                      )}
                    </div>

                    {/* Badges for planned load: Distinct rounded pill style and coloring */}
                    {day.isCurrentMonth && plannedCount > 0 ? (
                      <div className="w-full flex items-center justify-center gap-0.5 pb-0.5 flex-wrap">
                        {defCount > 0 && (
                          <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg font-black text-[9px] min-w-[20px] text-center shadow-2xs ${
                            isToday
                              ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_6px_rgba(255,111,61,0.4)]'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          }`}>
                            {defCount}
                          </span>
                        )}
                        {projCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-lg font-bold text-[8px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-400/30">
                            <Sparkles className="w-2 h-2 text-purple-600 shrink-0" />
                            ~{projCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="h-2.5 block" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAIL DRAWER FOR SELECTED DATE (PORCELAIN / NEUMORPH INSET) */}
          <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/5 rounded-3xl neumorph-inset p-3 sm:p-4 overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CalendarIcon className="w-4 h-4 text-white shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] capitalize truncate">
                      {selectedDetails.formattedTitle}
                    </h3>
                    {selectedDetails.isDateToday && (
                      <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-extrabold text-[9px] shadow-2xs">
                        {language === 'en' ? 'Today' : 'Hari Ini'}
                      </span>
                    )}
                    {selectedDetails.isFuture && (
                      <span className="px-2 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[9px] shadow-2xs">
                        {language === 'en' ? 'Upcoming' : 'Terjadwal'}
                      </span>
                    )}
                    {selectedDetails.isPast && !selectedDetails.isDateToday && (
                      <span className="px-2 py-0.2 rounded-full bg-slate-500 text-white font-bold text-[9px] shadow-2xs">
                        {language === 'en' ? 'Past Day' : 'Lampau'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                    {selectedDetails.planned.length > 0 ? (
                      <span>
                        <strong className="text-[#FF6F3D] font-bold">
                          {selectedDetails.planned.filter(p => !p.isProjected).length} {language === 'en' ? 'official cards' : 'kartu jadwal pasti'}
                        </strong>
                        {selectedDetails.planned.some(p => p.isProjected) && (
                          <span className="ml-1 text-purple-600 dark:text-purple-300 font-semibold">
                            + {selectedDetails.planned.filter(p => p.isProjected).length} {language === 'en' ? 'simulated' : 'simulasi'}
                          </span>
                        )}
                        {' '}{language === 'en' ? 'scheduled for murajaah' : 'terjadwal untuk murajaah'}
                      </span>
                    ) : (
                      language === 'en' ? 'No cards scheduled for review on this date' : 'Tidak ada kartu yang perlu diulang pada tanggal ini'
                    )}
                  </p>
                </div>
              </div>

              {selectedDetails.isDateToday && selectedDetails.planned.some(p => !p.isProjected) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartReview(chapterFilter !== 'all' && chapterFilter !== 'unassigned' ? chapterFilter : undefined);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{language === 'en' ? 'Review Now' : 'Mulai Murajaah'}</span>
                </button>
              )}
            </div>

            {/* PLANNED CARDS LIST (BOUNDED SCROLLABLE CONTAINER WITH COMPACT CARDS) */}
            {selectedDetails.planned.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider">
                  <span>{language === 'en' ? 'Scheduled Cards:' : 'Daftar Kartu Terjadwal:'}</span>
                  <span>({selectedDetails.planned.length} {language === 'en' ? 'items' : 'kartu'})</span>
                </div>

                <div className="max-h-64 sm:max-h-80 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-orange-300/40 dark:scrollbar-thumb-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetails.planned.map(({ item, isProjected, isOverdue, overdueDays }) => {
                      const intervalDays = getNonQuranIntervalDays(item.fsrsData);
                      const isMapan = item.status === 'mastered' || intervalDays >= 30;
                      const chTitle = item.chapterId ? chapterMap.get(item.chapterId) : null;

                      return (
                        <div
                          key={`${item.id}-${isProjected ? 'proj' : 'def'}`}
                          className="p-2.5 rounded-2xl neumorph-card flex flex-col justify-between gap-2 shadow-xs transition-all bg-white dark:bg-[#182236] border border-black/[0.04] dark:border-white/[0.06]"
                        >
                          <div className="space-y-1 min-w-0">
                            {/* Top row: Chapter name badge & status/interval pill */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8] max-w-[130px] truncate">
                                {chTitle || (language === 'en' ? 'General' : 'Umum')}
                              </span>

                              <div className="flex items-center gap-1 flex-wrap">
                                {isOverdue && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-2xs">
                                    {overdueDays && overdueDays > 1 ? `Terlambat ${overdueDays}d` : 'Tertunggak'}
                                  </span>
                                )}
                                {isProjected ? (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-400/30 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                    <span>Simulasi</span>
                                  </span>
                                ) : isMapan ? (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white shadow-2xs">
                                    Mapan ({intervalDays}d)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                                    Aktif ({intervalDays}d)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Question text */}
                            <div className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] line-clamp-2 leading-snug pt-0.5">
                              <BilingualCardText
                                text={item.question || item.answer || 'Kartu Materi'}
                                type="question"
                                variant="compact"
                              />
                            </div>
                          </div>

                          {/* Footer: Reps count & Actions */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                            <span className="text-[10px] font-semibold text-[#5E6D88] dark:text-[#94A3B8]">
                              {item.fsrsData?.reps || 0} {language === 'en' ? 'reviews' : 'kali'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {onPreviewItem && (
                                <button
                                  type="button"
                                  onClick={() => onPreviewItem(item)}
                                  title={language === 'en' ? 'Preview Card' : 'Pratinjau Kartu'}
                                  className="w-7 h-7 rounded-xl neumorph-inset flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {selectedDetails.isDateToday && !isProjected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onStartReview(item.chapterId || undefined);
                                  }}
                                  title={language === 'en' ? 'Review this Card' : 'Murajaah Kartu Ini'}
                                  className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETED REVIEWS ON THIS DAY (HIGH-CONTRAST & CLEAR READABILITY) */}
            {selectedDetails.completed.length > 0 && (
              <div className="space-y-1.5 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider block">
                  {language === 'en' ? 'Completed on this day:' : 'Riwayat Evaluasi Selesai pada Hari Ini:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDetails.completed.map(({ item, rating }, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-2.5 bg-white dark:bg-[#182236] border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] line-clamp-1 block">
                          <BilingualCardText
                            text={item.question || item.answer || (language === 'en' ? 'Card Item' : 'Kartu Materi')}
                            type="question"
                            variant="compact"
                          />
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 shadow-xs ${
                        rating === 4 
                          ? 'bg-sky-500 text-white' 
                          : rating === 3 
                          ? 'bg-emerald-500 text-white' 
                          : rating === 2 
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {rating === 4 ? 'Mudah' : rating === 3 ? 'Bagus' : rating === 2 ? 'Sulit' : 'Lagi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ZERO STATE FOR SELECTED DATE */}
            {selectedDetails.planned.length === 0 && selectedDetails.completed.length === 0 && (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' 
                    ? 'No review sessions scheduled on this date.' 
                    : 'Tidak ada jadwal murajaah pada tanggal ini.'}
                </p>
                <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto font-medium">
                  {language === 'en'
                    ? 'Enjoy your free time, or use it for adding new cards (Ziyadah) or studying.'
                    : 'Waktu luang optimal untuk menambah hafalan/materi baru (Ziyadah) atau memperdalam pemahaman.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
