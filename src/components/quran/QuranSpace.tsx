import React, { useState, useEffect } from 'react';
import { getIntervalDays, isDue, QuranIntervalClusterKey, isReviewedToday, getQuranPageClusterKey } from '../../lib/fsrs';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { JUZ_LIST, getQuranPageImageUrl, getJuzForPage } from '../../data/quranData';
import { QuranPageItem } from '../../types';
import { QuranReviewModal } from './QuranReviewModal';
import { MushafPageViewerModal } from './MushafPageViewerModal';
import { MapanScheduleModal } from './MapanScheduleModal';
import { QuranPageFeedbackModal } from './QuranPageFeedbackModal';
import { QuranPageCard } from './QuranPageCard';
import { IntervalPagesModal } from './IntervalPagesModal';
import { ConnectedClassesModal } from './ConnectedClassesModal';
import { QuranReviewCalendarModal } from './QuranReviewCalendarModal';
import { QuranSearchModal } from './QuranSearchModal';
import { JoinClassModal } from '../common/JoinClassModal';
import { QuranJuzBentoHero } from './QuranJuzBentoHero';
import { QuranJuzSpectrumMap } from './QuranJuzSpectrumMap';
import confetti from 'canvas-confetti';
import { MemoryMetricGrid } from '../common/MemoryMetricGrid';
import { UnifiedDueCard, DueFilterPill } from '../common/UnifiedDueCard';
import { getJuzOfflineStatus, cacheJuzOffline } from '../../lib/offlineStorage';
import { 
  Eye, FileText, MessageSquare, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Power,
  Plus,
  Check,
  Calendar,
  CalendarCheck,
  Sparkles,
  LayoutGrid,
  List,
  HardDrive,
  CloudDownload,
  Loader2,
  Flame,
  Brain,
  CalendarClock,
  Copy,
  Link,
  HelpCircle,
  Users,
  KeyRound
} from 'lucide-react';

const InfoTooltip: React.FC<{ text: string, textEn: string, language: string }> = ({ text, textEn, language }) => (
  <div className="relative group flex items-center">
    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] sm:text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center leading-snug border border-slate-700">
      {language === 'en' ? textEn : text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export const QuranSpace: React.FC = () => {
  const { 
    quranPages, 
    quranStats, 
    activateQuranPage, 
    deactivateQuranPage,
    reviewQuranPage,
    language,
    quranSpaceCode,
    userProfile,
    joinClassByCode,
    myClasses,
    leaveClass,
    setActiveSpace,
    spaceResetCounter,
    isFeatureAllowed,
    openUpgradeModal
  } = useApp();

  const handleTogglePageActive = (pageNumber: number) => {
    const target = quranPages.find(p => p.pageNumber === pageNumber);
    if (!target) return;
    if (target.isActive) {
      deactivateQuranPage(pageNumber);
    } else {
      const check = isFeatureAllowed('quran_juz', target.juzNumber);
      if (!check.allowed) {
        openUpgradeModal(
          check.reason,
          language === 'en'
            ? `Free plan allows up to ${check.limit} active Juz concurrently. Upgrade to Unlupa Pro to memorize and review all 30 Juz simultaneously.`
            : `Akun Free dibatasi hingga ${check.limit} Juz aktif sekaligus. Upgrade ke Unlupa Pro untuk mengaktifkan seluruh 30 Juz tanpa batas.`
        );
        return;
      }
      activateQuranPage(pageNumber);
    }
  };

  // Reset to root dashboard if user clicks Quran space tab
  useEffect(() => {
    if (spaceResetCounter?.space === 'quran' && spaceResetCounter.count > 0) {
      setSelectedJuzNumber(null);
    }
  }, [spaceResetCounter]);

  const [inputClassCode, setInputClassCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Navigation state between Screen 1 (Dashboard) and Screen 2 (Juz Page List)
  const [selectedJuzNumber, setSelectedJuzNumber] = useState<number | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'due' | 'active' | 'mapan'>('all');
  const [viewDensity, setViewDensity] = useState<'grid' | 'compact'>('grid');
  const [pageRange, setPageRange] = useState<{ from: number; to: number } | null>(null);
  const [highlightedPageNum, setHighlightedPageNum] = useState<number | null>(null);

  // Jump to specific page flashcard from spectrum map
  const handleJumpToPageCard = (pageNumber: number) => {
    if (selectedJuz) {
      if (!pageRange || pageNumber < pageRange.from || pageNumber > pageRange.to) {
        setPageRange({ from: selectedJuz.startPage, to: selectedJuz.endPage });
      }
    }
    setActiveFilterTab('all');
    setHighlightedPageNum(pageNumber);

    setTimeout(() => {
      const el = document.getElementById(`quran-page-card-${pageNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    setTimeout(() => {
      setHighlightedPageNum(prev => prev === pageNumber ? null : prev);
    }, 3200);
  };

  // Sync page range when selecting a Juz
  useEffect(() => {
    if (selectedJuzNumber) {
      const targetJuz = JUZ_LIST.find(j => j.juzNumber === selectedJuzNumber);
      if (targetJuz) {
        setPageRange({ from: targetJuz.startPage, to: targetJuz.endPage });
      }
    } else {
      setPageRange(null);
    }
  }, [selectedJuzNumber]);
  
  // Offline caching status for current Juz
  const [juzOfflineStatus, setJuzOfflineStatus] = useState<{ total: number; cached: number; isFullyCached: boolean } | null>(null);
  const [isDownloadingJuz, setIsDownloadingJuz] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isConnectedClassesOpen, setIsConnectedClassesOpen] = useState(false);
  const [isQuranSearchOpen, setIsQuranSearchOpen] = useState(false);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<{ current: number; total: number } | null>(null);

  const handleDownloadAllJuz = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    setDownloadAllProgress({ current: 0, total: 30 });
    for (let j = 1; j <= 30; j++) {
      await cacheJuzOffline(j, () => {});
      setDownloadAllProgress({ current: j, total: 30 });
    }
    setIsDownloadingAll(false);
    setDownloadAllProgress(null);
    alert(language === 'en' ? 'All 30 Juz downloaded successfully for offline reading!' : 'Semua 30 Juz berhasil diunduh untuk dibaca secara offline!');
    setIsDownloadModalOpen(false);
  };

  useEffect(() => {
    if (selectedJuzNumber) {
      getJuzOfflineStatus(selectedJuzNumber).then(setJuzOfflineStatus);
    } else {
      setJuzOfflineStatus(null);
    }
  }, [selectedJuzNumber]);

  const handleDownloadJuz = async () => {
    if (!selectedJuzNumber || isDownloadingJuz) return;
    setIsDownloadingJuz(true);
    setDownloadProgress({ current: 0, total: 20 });
    await cacheJuzOffline(selectedJuzNumber, (current, total) => {
      setDownloadProgress({ current, total });
    });
    const updated = await getJuzOfflineStatus(selectedJuzNumber);
    setJuzOfflineStatus(updated);
    setIsDownloadingJuz(false);
    setDownloadProgress(null);
  };

  // Modals state
  const [reviewModalConfig, setReviewModalConfig] = useState<{ isOpen: boolean; juzFilter: number | null }>({
    isOpen: false,
    juzFilter: null
  });
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);
  const [justReviewedPage, setJustReviewedPage] = useState<{ pageNumber: number; rating: 1 | 2 | 3 } | null>(null);
  const [selectedMapanPage, setSelectedMapanPage] = useState<QuranPageItem | null>(null);
  const [isMapanModalOpen, setIsMapanModalOpen] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState<QuranPageItem | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQuranCalendarOpen, setIsQuranCalendarOpen] = useState(false);
  const [intervalModalConfig, setIntervalModalConfig] = useState<{isOpen: boolean, clusterKey: QuranIntervalClusterKey | null, pages: QuranPageItem[]}>({isOpen: false, clusterKey: null, pages: []});
  const [mapanCelebrationNotice, setMapanCelebrationNotice] = useState<{ pageNumber: number; surah: string } | null>(null);

  // Gestur usap (swipe navigation) for Quran Space
  useSwipeGesture(null, {
    disabled: previewPageNumber !== null || reviewModalConfig.isOpen || Boolean(typeof document !== 'undefined' && (document.body.getAttribute('data-annotation-open') === 'true' || document.body.getAttribute('data-image-modal-open') === 'true')),
    onSwipeRight: () => {
      if (selectedJuzNumber !== null) {
        if (selectedJuzNumber > 1) {
          setSelectedJuzNumber(selectedJuzNumber - 1);
        } else {
          setSelectedJuzNumber(null);
        }
      } else {
        setActiveSpace('dashboard');
      }
    },
    onSwipeLeft: () => {
      if (selectedJuzNumber !== null) {
        if (selectedJuzNumber < 30) {
          setSelectedJuzNumber(selectedJuzNumber + 1);
        } else {
          setActiveSpace('personal');
        }
      } else {
        setActiveSpace('personal');
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });

  
  const t = {
    overallProgress: { en: 'OVERALL MEMORIZATION PROGRESS', id: 'TOTAL PROGRES HAFALAN', ar: 'التقدم العام في الحفظ' },
    pagesMapan: { en: 'Mastered', id: 'Mapan', ar: 'متقن' },
    pagesDueToday: { en: 'Due Today', id: 'Jatuh Tempo', ar: 'مراجعة' },
    activated: { en: 'Active', id: 'Aktif', ar: 'مفعل' },
    notActivated: { en: 'Not yet activated', id: 'Belum diaktivasi', ar: 'غير مفعل' },
    allCaughtUp: { en: 'All caught up', id: 'Semua sudah dimurajaah', ar: 'تمت المراجعة بالكامل' },
    inJuz: { en: 'In Juz', id: 'Pada Juz', ar: 'في الجزء' },
    acrossJuz: { en: 'Across Juz', id: 'Pada Juz', ar: 'في الأجزاء' },
    due: { en: 'due', id: 'jatuh tempo', ar: 'مراجعة' },
    review: { en: 'Review', id: 'Murajaah', ar: 'مراجعة' },
    mapan: { en: 'Mastered', id: 'Mapan', ar: 'متقن' },
    all: { en: 'All', id: 'Semua', ar: 'الكل' },
    active: { en: 'Active', id: 'Aktif', ar: 'نشط' }
  };

  const selectedJuz = selectedJuzNumber ? JUZ_LIST.find(j => j.juzNumber === selectedJuzNumber) || null : null;

  // Find all Juz numbers that have pages due today
  const dueJuzMap = new Map<number, number>();
  (quranStats?.dueList || []).forEach(item => {
    dueJuzMap.set(item.juzNumber, (dueJuzMap.get(item.juzNumber) || 0) + 1);
  });
  const dueJuzNumbers = Array.from(dueJuzMap.keys()).sort((a, b) => a - b);

  // Subtitle text for "Across Juz 1, 28 & 29"
  const dueJuzDescription = dueJuzNumbers.length === 0
    ? (language === 'en' ? 'All caught up' : 'Semua sudah dimurajaah')
    : dueJuzNumbers.length === 1
    ? (language === 'en' ? `In Juz ${dueJuzNumbers[0]}` : `Pada Juz ${dueJuzNumbers[0]}`)
    : dueJuzNumbers.length === 2
    ? (language === 'en' ? `Across Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}` : `Pada Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}`)
    : (language === 'en' 
        ? `Across Juz ${dueJuzNumbers.slice(0, -1).join(', ')} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`
        : `Pada Juz ${dueJuzNumbers.slice(0, -1).join(', ')} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`);

  // Handle direct review action on page card
  const handleInlineReview = (pageNumber: number, rating: 1 | 2 | 3) => {
    const res = reviewQuranPage(pageNumber, rating);
    setJustReviewedPage({ pageNumber, rating });
    setTimeout(() => {
      setJustReviewedPage(prev => prev?.pageNumber === pageNumber ? null : prev);
    }, 1800);

    if (res?.justBecameMastered) {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
      });
      const target = quranPages.find(p => p.pageNumber === pageNumber);
      if (target) {
        setSelectedMapanPage(target);
        setIsMapanModalOpen(true);
        setMapanCelebrationNotice({
          pageNumber,
          surah: target.surahNameEn
        });
        setTimeout(() => setMapanCelebrationNotice(null), 6000);
      }
    }
  };

  // Format accurate due date for CalendarClock icon
  const formatAccurateDueDate = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isDue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
    if (isDue) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    return nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filter pages when inside Screen 2 (Juz Page List)
  const currentJuzPages = selectedJuz
    ? quranPages.filter(p => p.juzNumber === selectedJuz.juzNumber)
    : [];

  function pageHasMapan(page: QuranPageItem) {
    return page.status === 'mastered_for_now' || (page.isActive && (page.fsrsData.stability >= 74.5 || Math.round(page.fsrsData.stability * 0.4025587) > 30));
  }

  const displayedPages = currentJuzPages.filter(page => {
    if (pageRange) {
      if (page.pageNumber < pageRange.from || page.pageNumber > pageRange.to) {
        return false;
      }
    }
    const isDuePage = isDue(page.fsrsData.nextReview, page.isActive);
    const isMapan = pageHasMapan(page);
    
    if (activeFilterTab === 'due') return isDuePage || (page.isActive && isReviewedToday(page.fsrsData.lastReview));
    if (activeFilterTab === 'active') return page.isActive;
    if (activeFilterTab === 'mapan') return isMapan;
    return true; // 'all'
  });

  // Calculate stats for current Juz in Screen 2
  const currentJuzActiveCount = currentJuzPages.filter(p => p.isActive).length;
  const currentJuzDueCount = currentJuzPages.filter(p => isDue(p.fsrsData.nextReview, p.isActive)).length;
  const currentJuzMapanCount = currentJuzPages.filter(p => pageHasMapan(p)).length;

  return (
    <div className="space-y-4 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* Header Bar: Title, Badge, and Join Class Code Box strictly in 1 horizontal row */}
      {selectedJuzNumber === null && (
        <div className="flex items-center justify-between w-full mb-2 gap-1.5 sm:gap-2 flex-nowrap">
          {/* Left: Title, Connected Classes Badge, and Join Class with Code Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0 whitespace-nowrap">
            <h1 className="text-lg sm:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight shrink-0">
              {language === 'en' ? 'Quran Room' : language === 'id' ? 'Ruang Al-Qur\'an' : 'غرفة القرآن'}
            </h1>
            <button
              onClick={() => setIsConnectedClassesOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 h-8 sm:h-9 rounded-2xl neumorph-card text-[#FF6F3D] font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title={language === 'en' ? `${myClasses.length} Connected Classes` : `${myClasses.length} Kelas Terhubung`}
            >
              <Users className="w-3.5 h-3.5 text-[#FF6F3D]" />
              <span className="text-xs font-bold">
                {myClasses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsJoinClassOpen(true)}
              className="w-8 h-8 sm:w-auto sm:px-3 sm:h-9 rounded-2xl neumorph-card text-[#B45309] dark:text-amber-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title={language === 'en' ? 'Join class with code' : 'Masukkan kode kelas'}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden sm:inline">{language === 'en' ? 'Class Code' : 'Kode Kelas'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl neumorph-card text-[#0EA5E9] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              title={language === 'en' ? 'Offline Download Manager' : 'Kelola Unduhan Offline'}
            >
              <CloudDownload className="w-4 h-4 text-[#0EA5E9]" />
            </button>
          </div>
          
          {/* Right: Unified Search Trigger Bar strictly at top rightmost corner */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setIsQuranSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:pl-3 sm:pr-3.5 h-8 sm:h-9 rounded-2xl neumorph-inset text-xs font-semibold text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-all cursor-pointer group shrink-0"
              title={language === 'en' ? 'Search Quran (Pages, Surah, Juz)...' : 'Cari Al-Qur\'an (Halaman, Surah, Juz)...'}
            >
              <Search className="w-3.5 h-3.5 text-[#FF6F3D] group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden sm:inline truncate">{language === 'en' ? 'Search Quran...' : 'Cari Al-Qur\'an...'}</span>
              <span className="sm:hidden text-xs font-bold text-[#5E6D88] dark:text-slate-300">{language === 'en' ? 'Search' : 'Cari'}</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-[#8493AB] bg-white/70 dark:bg-black/20 rounded shadow-2xs border border-black/5 dark:border-white/5">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      )}

      {selectedJuzNumber === null ? (
        <div className="space-y-4">
          {/* Standard Minimalist Due Card (Unified Across All Rooms) */}
          <UnifiedDueCard
            language={language}
            title={language === 'en' ? 'Daily Review' : 'Kartu Jatuh Tempo'}
            dueCount={quranStats.dueToday}
            totalActiveCount={quranStats.active}
            itemTypeLabel={language === 'en' ? 'pages' : 'halaman'}
            primaryActionLabel={language === 'en' ? `All (${quranStats.dueToday})` : `Semua (${quranStats.dueToday})`}
            pillGridCols={5}
            onStartAll={() => setReviewModalConfig({ isOpen: true, juzFilter: null })}
            onOpenCalendar={() => setIsQuranCalendarOpen(true)}
            filterPills={dueJuzNumbers.map(juzNum => ({
              id: juzNum,
              label: `J.${juzNum}`,
              count: dueJuzMap.get(juzNum) || 0,
              onClick: () => setReviewModalConfig({ isOpen: true, juzFilter: juzNum }),
            }))}
            allCaughtUpTitle={language === 'en' ? 'All Quran pages reviewed today!' : 'Semua hafalan Al-Qur\'an sudah dimurajaah!'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {JUZ_LIST.map(juz => {
              const activeCount = quranPages.filter(p => p.juzNumber === juz.juzNumber && p.isActive).length;
              const dueCount = quranPages.filter(p => p.juzNumber === juz.juzNumber && isDue(p.fsrsData.nextReview, p.isActive)).length;
              const masteredCount = quranPages.filter(p => p.juzNumber === juz.juzNumber && pageHasMapan(p)).length;

              return (
                <div
                  key={juz.juzNumber}
                  onClick={() => {
                    setSelectedJuzNumber(juz.juzNumber);
                    setActiveFilterTab('all');
                  }}
                  className="neumorph-card p-4 rounded-3xl hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-xs sm:text-sm shrink-0 flex items-center justify-center shadow-[0_3px_8px_rgba(255,111,61,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.7)] group-hover:scale-105 transition-transform">
                      J{juz.juzNumber}
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6F3D] truncate transition-colors">
                        Juz {juz.juzNumber}
                      </h4>
                      <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                        {juz.surahSpan}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="neumorph-inset px-2.5 py-0.5 rounded-full text-[10px] text-[#18234A] dark:text-[#F8FAFC] font-extrabold">
                      {activeCount} / {juz.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      {dueCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-black text-[9px] shadow-2xs">
                          {dueCount} {t.due[language]}
                        </span>
                      )}
                      {masteredCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-[9px] shadow-2xs">
                          {masteredCount} {t.mapan[language]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Navigation Bar Back to Quran Room */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setSelectedJuzNumber(null);
                setActiveFilterTab('all');
              }}
              className="flex items-center gap-2 text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-colors cursor-pointer group neumorph-card px-3.5 py-2 rounded-2xl w-fit"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>{language === 'en' ? 'Qur\'an Room' : language === 'id' ? 'Ruang Al-Qur\'an' : 'غرفة القرآن'}</span>
            </button>
          </div>

          {/* 1. Bento Hero Super-Kompak (Seperempat Layar: 4 Metrik, Dial Mapan, Aksi, & Proyeksi 7 Hari) */}
          {selectedJuz && (
            <QuranJuzBentoHero
              juz={selectedJuz}
              quranPages={quranPages}
              activeCount={currentJuzActiveCount}
              dueCount={currentJuzDueCount}
              mapanCount={currentJuzMapanCount}
              language={language}
              isDownloadingJuz={isDownloadingJuz}
              downloadProgress={downloadProgress}
              juzOfflineStatus={juzOfflineStatus}
              onDownloadJuz={handleDownloadJuz}
              onStartReview={() => setReviewModalConfig({ isOpen: true, juzFilter: selectedJuzNumber })}
              onOpenCalendar={() => setIsQuranCalendarOpen(true)}
              onFilterTabChange={(tab) => setActiveFilterTab(tab)}
              activeFilterTab={activeFilterTab}
            />
          )}

          {/* 2. Peta Spektrum & Navigasi Sapu Halaman (Diletakkan Tepat Sebelum Daftar Halaman Mushaf) */}
          {selectedJuz && pageRange && (
            <QuranJuzSpectrumMap
              juzNumber={selectedJuz.juzNumber}
              quranPages={quranPages}
              startPage={selectedJuz.startPage}
              endPage={selectedJuz.endPage}
              totalPages={selectedJuz.totalPages}
              language={language}
              fromPage={pageRange.from}
              toPage={pageRange.to}
              onChangeRange={(from, to) => setPageRange({ from, to })}
              onSelectPage={(pageNumber) => {
                handleJumpToPageCard(pageNumber);
              }}
              onNavigateJuz={(juzNum) => {
                setSelectedJuzNumber(juzNum);
                setActiveFilterTab('all');
              }}
            />
          )}

          {/* Section Header: PAGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5E6D88] dark:text-[#94A3B8]">
                {language === 'en' ? 'PAGES IN JUZ' : 'DAFTAR HALAMAN JUZ'} ({displayedPages.length})
              </h4>
            </div>

            {/* Streamlined, Compact Page Cards in 2-Column Grid on Tablet/Desktop */}
            <div className={viewDensity === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'}>
              {displayedPages.map(page => (
                <QuranPageCard
                  key={page.pageNumber}
                  page={page}
                  language={language}
                  onToggleActive={(pageNumber) => {
                    handleTogglePageActive(pageNumber);
                  }}
                  onOpenMapanModal={(p) => {
                    setSelectedMapanPage(p);
                    setIsMapanModalOpen(true);
                  }}
                  onOpenFeedbackModal={(p) => {
                    setFeedbackPage(p);
                    setIsFeedbackModalOpen(true);
                  }}
                  onOpenMushafViewer={(pageNumber) => {
                    setPreviewPageNumber(pageNumber);
                  }}
                  onInlineReview={(pageNumber, rating) => {
                    handleInlineReview(pageNumber, rating);
                  }}
                  isJustReviewed={justReviewedPage?.pageNumber === page.pageNumber}
                  justReviewedRating={justReviewedPage?.pageNumber === page.pageNumber ? justReviewedPage.rating : undefined}
                  isHighlighted={highlightedPageNum === page.pageNumber}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal (supports filtering by specific Juz) */}
      <QuranReviewModal
        isOpen={reviewModalConfig.isOpen}
        juzFilter={reviewModalConfig.juzFilter}
        onClose={() => setReviewModalConfig({ isOpen: false, juzFilter: null })}
        onSelectNextJuz={(nextJuz) => setReviewModalConfig({ isOpen: true, juzFilter: nextJuz })}
      />

      {/* Fullscreen Mushaf Page Viewer Modal */}
      {previewPageNumber !== null && (
        <MushafPageViewerModal
          pageNumber={previewPageNumber}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
          onNavigatePage={(p) => setPreviewPageNumber(p)}
          onOpenFeedback={(p) => {
            const pageItem = quranPages.find(item => item.pageNumber === p);
            if (pageItem) {
              setFeedbackPage(pageItem);
              setIsFeedbackModalOpen(true);
            }
          }}
        />
      )}

      {/* Mastered / Mapan Custom Rhythm Schedule Modal */}
      <MapanScheduleModal
        isOpen={isMapanModalOpen}
        onClose={() => {
          setIsMapanModalOpen(false);
          setSelectedMapanPage(null);
        }}
        page={selectedMapanPage}
      />

      {/* Stability Interval Clusters Modal */}
      <IntervalPagesModal
        isOpen={intervalModalConfig.isOpen}
        onClose={() => setIntervalModalConfig(prev => ({ ...prev, isOpen: false }))}
        clusterKey={intervalModalConfig.clusterKey}
        quranPages={quranPages}
        language={language}
        onToggleActive={(pageNumber) => {
          const target = quranPages.find(p => p.pageNumber === pageNumber);
          if (target?.isActive) {
            deactivateQuranPage(pageNumber);
          } else {
            activateQuranPage(pageNumber);
          }
        }}
        onOpenMapanModal={(page) => {
          setSelectedMapanPage(page);
          setIsMapanModalOpen(true);
        }}
        onOpenFeedbackModal={(page) => {
          setFeedbackPage(page);
          setIsFeedbackModalOpen(true);
        }}
        onOpenMushafViewer={(pageNumber) => {
          setPreviewPageNumber(pageNumber);
        }}
        onInlineReview={(pageNumber, rating) => {
          handleInlineReview(pageNumber, rating);
        }}
        justReviewedPage={justReviewedPage}
      />

      {/* Quran Page Issue & Feedback Modal */}
      <QuranPageFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackPage(null);
        }}
        page={feedbackPage}
      />

      {/* Floating Mapan Celebration Banner/Toast */}
      {mapanCelebrationNotice && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 dark:bg-slate-850 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-amber-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md w-[92%]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300">
              {language === 'en' ? 'Mabruk! Page Mastered (Mapan)!' : 'Mabruk! Halaman Resmi Mapan!'}
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {language === 'en'
                ? `Page ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) rotation reached >30 days.`
                : `Hal ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) telah mencapai rotasi >30 hari.`}
            </p>
          </div>
          <button
            onClick={() => {
              const target = quranPages.find(p => p.pageNumber === mapanCelebrationNotice.pageNumber);
              if (target) {
                setSelectedMapanPage(target);
                setIsMapanModalOpen(true);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
          >
            {language === 'en' ? 'Set Rhythm' : 'Atur Ritme'}
          </button>
        </div>
      )}

      {/* Connected Classes Modal */}
      <ConnectedClassesModal
        isOpen={isConnectedClassesOpen}
        onClose={() => setIsConnectedClassesOpen(false)}
        language={language}
        connectedClasses={myClasses}
        onLeaveClass={leaveClass}
      />

      {/* Planned Quran Review Calendar Modal */}
      <QuranReviewCalendarModal
        isOpen={isQuranCalendarOpen}
        onClose={() => setIsQuranCalendarOpen(false)}
        quranPages={quranPages}
        language={language}
        initialJuzFilter={selectedJuzNumber}
        onStartReview={(juz) => setReviewModalConfig({ isOpen: true, juzFilter: juz || null })}
        onOpenMushafViewer={(pageNumber) => setPreviewPageNumber(pageNumber)}
      />

      {/* Quran Surah & Juz Search Modal */}
      <QuranSearchModal
        isOpen={isQuranSearchOpen}
        onClose={() => setIsQuranSearchOpen(false)}
        language={language}
        onSelectJuz={(juzNumber) => {
          setSelectedJuzNumber(juzNumber);
        }}
        onSelectPage={(pageNumber) => {
          const juz = getJuzForPage(pageNumber);
          setSelectedJuzNumber(juz);
          setPreviewPageNumber(pageNumber);
        }}
      />

      {/* Join Class Code Modal */}
      <JoinClassModal
        isOpen={isJoinClassOpen}
        onClose={() => setIsJoinClassOpen(false)}
        language={language}
      />

      {/* Offline Download Manager Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="neumorph-card p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-[#0EA5E9]" />
                <span>{language === 'en' ? 'Offline Download Manager' : 'Kelola Unduhan Offline'}</span>
              </h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Download all 30 Juz for offline use, or open any specific Juz to download individually.'
                : 'Unduh seluruh 30 Juz sekaligus untuk akses offline, atau buka Juz spesifik untuk mengunduh per Juz.'}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isDownloadingAll}
                onClick={handleDownloadAllJuz}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === 'en' ? `Downloading All (${downloadAllProgress?.current}/30)...` : `Mengunduh Semua (${downloadAllProgress?.current}/30)...`}</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
                    <span>{language === 'en' ? 'Download All 30 Juz' : 'Unduh Semua 30 Juz'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  alert(language === 'en' ? 'Click on any Juz card in the list below to download or view offline status for that specific Juz.' : 'Klik pada kartu Juz manapun di daftar utama untuk mengunduh atau melihat status offline Juz tersebut.');
                }}
                className="w-full py-2.5 rounded-2xl neumorph-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#FF6F3D] transition-colors cursor-pointer text-center"
              >
                {language === 'en' ? 'Select Specific Juz from List' : 'Pilih Juz Tertentu dari Daftar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
