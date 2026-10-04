import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuranPageItem, MapanScheduleConfig } from '../../types';
import { predictQuranIntervals, isDue } from '../../lib/fsrs';
import { getQuranPageImageUrl } from '../../data/quranData';
import { getOfflinePageUrl, cachePageOffline, logOfflineReview } from '../../lib/offlineStorage';
import { MushafPageViewerModal } from './MushafPageViewerModal';
import { QuranPageFeedbackModal } from './QuranPageFeedbackModal';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { 
  X, 
  Eye, 
  EyeOff,
  CheckCircle2, 
  RotateCcw, 
  BookOpen, 
  Sparkles,
  Trophy,
  ArrowRight,
  Maximize2,
  Loader2,
  Zap,
  CalendarDays,
  CalendarCheck2,
  Check,
  Lock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../lib/soundFeedback';

const WEEK_DAYS = [
  { id: 0, labelId: 'Ahad', labelEn: 'Sun' },
  { id: 1, labelId: 'Senin', labelEn: 'Mon' },
  { id: 2, labelId: 'Selasa', labelEn: 'Tue' },
  { id: 3, labelId: 'Rabu', labelEn: 'Wed' },
  { id: 4, labelId: 'Kamis', labelEn: 'Thu' },
  { id: 5, labelId: "Jum'at", labelEn: 'Fri' },
  { id: 6, labelId: 'Sabtu', labelEn: 'Sat' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPageNumber?: number;
  juzFilter?: number | null;
  onSelectNextJuz?: (nextJuzNumber: number) => void;
}

export const QuranReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPageNumber,
  juzFilter,
  onSelectNextJuz,
}) => {
  const { quranPages, quranStats, reviewQuranPage, updateQuranMapanSchedule, language, isTeacherMode, activeSpace } = useApp();
  const isTeacher = isTeacherMode || activeSpace === 'teaching';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullViewerOpen, setIsFullViewerOpen] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isPageRevealed, setIsPageRevealed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackIssues, setFeedbackIssues] = useState<('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]>([]);

  const [masteredCelebration, setMasteredCelebration] = useState<{
    pageNumber: number;
    surahName: string;
    juzNumber: number;
  } | null>(null);

  const [celebrationMode, setCelebrationMode] = useState<'fsrs' | 'weekly' | 'monthly'>('fsrs');
  const [celebrationWeeklyDay, setCelebrationWeeklyDay] = useState<number>(5);
  const [celebrationMonthlyDate, setCelebrationMonthlyDate] = useState<number>(1);
  const [sessionQueue, setSessionQueue] = useState<QuranPageItem[]>([]);
  const [justRated, setJustRated] = useState<{ rating: 1 | 2 | 3; label: string } | null>(null);

  // Snapshot the exact list of pages when modal opens so queue does not shift or skip pages during session
  useEffect(() => {
    if (isOpen) {
      const filtered = (juzFilter 
        ? quranStats.dueList.filter(p => p.juzNumber === juzFilter)
        : quranStats.dueList
      ).slice().sort((a, b) => a.pageNumber - b.pageNumber);

      if (initialPageNumber && !filtered.some(p => p.pageNumber === initialPageNumber)) {
        const targetPage = quranPages.find(p => p.pageNumber === initialPageNumber);
        if (targetPage) filtered.unshift(targetPage);
      }

      setSessionQueue(filtered);
      setCurrentIndex(0);
      setReviewedCount(0);
      setIsPageRevealed(false);
      setMasteredCelebration(null);
      setJustRated(null);
      setIsFeedbackOpen(false);
      setFeedbackNotes('');
      setFeedbackIssues([]);
    } else {
      setSessionQueue([]);
    }
  }, [isOpen, juzFilter, initialPageNumber]);

  const queue: QuranPageItem[] = sessionQueue;

  // Retrieve latest state of the current item from quranPages to ensure accurate updates
  const currentItem = queue[currentIndex] 
    ? (quranPages.find(p => p.pageNumber === queue[currentIndex].pageNumber) || queue[currentIndex])
    : null;

  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (currentItem) {
      setImageLoading(true);
      (async () => {
        const cached = await getOfflinePageUrl(currentItem.pageNumber);
        if (active) {
          if (cached) {
            setLocalImageUrl(cached);
            setImageLoading(false);
          } else {
            setLocalImageUrl(null);
          }
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [currentItem?.pageNumber]);

  const advanceQueue = () => {
    if (masteredCelebration) {
      const config: MapanScheduleConfig = {
        mode: celebrationMode,
        weeklyDay: celebrationMode === 'weekly' ? celebrationWeeklyDay : undefined,
        monthlyDate: celebrationMode === 'monthly' ? celebrationMonthlyDate : undefined,
      };
      updateQuranMapanSchedule(masteredCelebration.pageNumber, config);
    }
    setMasteredCelebration(null);
    setCurrentIndex(prev => prev + 1);
    setIsPageRevealed(false);
    setIsFeedbackOpen(false);
    setFeedbackNotes('');
    setFeedbackIssues([]);

    if (currentIndex + 1 >= queue.length) {
      // Completed queue! Trigger celebration
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });
      soundEffects.playMasteredCelebration();
    }
  };

  const handleRating = async (rating: 1 | 2 | 3) => {
    if (!currentItem) return;

    // Trigger immediate tactile audio sound feedback
    if (rating === 3) {
      soundEffects.playMasteredCelebration();
    } else if (rating === 2) {
      soundEffects.playReviewSuccess();
    } else {
      soundEffects.playReviewAgain();
    }

    const wasMasteredBefore = currentItem.status === 'mastered_for_now' || (currentItem.fsrsData?.stability || 0) * 0.4025587 >= 30;

    // Execute state transition in context
    const updatedResult = await reviewQuranPage(
      currentItem.pageNumber, 
      rating, 
      feedbackNotes || feedbackIssues.length > 0 ? {
        notes: feedbackNotes || undefined,
        issueTypes: feedbackIssues.length > 0 ? feedbackIssues : undefined
      } : undefined
    );
    setReviewedCount(prev => prev + 1);

    // Also write to offline storage log
    logOfflineReview('quran', currentItem.pageNumber, rating);

    const isNowMastered = updatedResult?.isMasteredForNow || false;

    // Check if this review newly crossed the Mapan threshold (>30 days interval)
    if (!wasMasteredBefore && isNowMastered) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setMasteredCelebration({
        pageNumber: currentItem.pageNumber,
        surahName: currentItem.surahNameEn,
        juzNumber: currentItem.juzNumber,
      });
      return;
    }

    const ratingLabel = rating === 3 
      ? (language === 'en' ? 'Mutqin Saved' : 'Tersimpan: Mutqin') 
      : rating === 2 
      ? (language === 'en' ? 'Fluent Saved' : 'Tersimpan: Lancar') 
      : (language === 'en' ? 'Scheduled for tomorrow' : 'Dijadwalkan ulang besok');

    setJustRated({ rating, label: ratingLabel });

    // Brief delay to display positive visual feedback before moving to next item
    setTimeout(() => {
      setJustRated(null);
      advanceQueue();
    }, 450);
  };

  const isFinished = currentIndex >= queue.length && queue.length > 0;
  const currentImageUrl = currentItem ? getQuranPageImageUrl(currentItem.pageNumber, 1260) : '';

  // Check which other Juz have due items remaining
  const otherDueJuzMap = new Map<number, number>();
  (quranStats?.dueList || []).forEach(p => {
    if (!juzFilter || p.juzNumber !== juzFilter) {
      otherDueJuzMap.set(p.juzNumber, (otherDueJuzMap.get(p.juzNumber) || 0) + 1);
    }
  });
  const otherDueJuzNumbers = Array.from(otherDueJuzMap.keys()).sort((a, b) => a - b);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] text-slate-900 dark:text-slate-100 w-full max-w-4xl h-[95vh] rounded-3xl shadow-2xl border border-white/60 dark:border-white/5 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between bg-white/90 dark:bg-[#182236]/90 backdrop-blur-md shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(255,111,61,0.35)] shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {juzFilter
                  ? (language === 'en' ? `Murajaah Juz ${juzFilter}` : `Murajaah Juz ${juzFilter}`)
                  : (language === 'en' ? 'Quran Daily Murajaah' : 'Murajaah Harian Al-Qur\'an')}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
                {queue.length > 0
                  ? (language === 'en' ? `${queue.length} pages due in this session` : `${queue.length} halaman due untuk sesi ini`)
                  : (language === 'en' ? 'Mushaf Madinah Page Review' : 'Review Halaman Mushaf Madinah')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isFinished && currentItem && (
              <span className="text-xs font-black px-3 py-1 rounded-full neumorph-card text-[#FF6F3D] shadow-2xs">
                {currentIndex + 1} / {queue.length}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Tutup Sesi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Review Progress Bar */}
        {!isFinished && queue.length > 0 && !masteredCelebration && (
          <div className="bg-white/40 dark:bg-black/20 px-4 sm:px-5 py-2 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
            <div className="flex items-center justify-between text-xs text-[#5E6D88] dark:text-[#94A3B8] font-semibold mb-1">
              <span>{language === 'en' ? 'Session Progress' : 'Progres Sesi'}: {Math.min(currentIndex + 1, queue.length)} / {queue.length} ({Math.round((Math.min(currentIndex + 1, queue.length) / queue.length) * 100)}%)</span>
              <span className="font-black text-[#FF6F3D]">{Math.max(0, queue.length - currentIndex - 1)} {language === 'en' ? 'remaining' : 'halaman tersisa'}</span>
            </div>
            <div className="w-full neumorph-inset h-2 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#FF7E4A] to-[#E65320] h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(8, (Math.min(currentIndex + 1, queue.length) / queue.length) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col min-h-0">
          {masteredCelebration ? (
            /* Celebration Screen for Mapan Achievement with Custom Schedule Options */
            <div className="py-4 my-auto max-w-lg mx-auto animate-in zoom-in-95 duration-300 w-full text-left space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-orange-500/25">
                  <Sparkles className="w-8 h-8 animate-pulse text-white" />
                </div>
                <span className="inline-block text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white mb-2 shadow-xs">
                  {language === 'en' ? 'Mastered / Mutqin Status Achieved' : 'Hafalan Lulus & Mapan (Mutqin)'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' ? 'Mabruk! Page Successfully Mastered!' : 'Mabruk! Selamat, Halaman Ini Sudah Mapan!'}
                </h4>
                <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] mt-2 leading-relaxed">
                  {language === 'en'
                    ? `Page ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) is officially Mastered! You can continue with the app's default adaptive scheduling, or choose a custom weekly/monthly rhythm below:`
                    : `Halaman ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) telah resmi Mapan! Anda bisa tetap melanjutkan ritme murajaah otomatis FSRS, atau memilih ritme mingguan/bulanan:`}
                </p>
              </div>

              {/* Selection cards for schedule */}
              <div className="space-y-2.5 mb-5">
                {/* 1. App Adaptive Schedule */}
                <div
                  onClick={() => setCelebrationMode('fsrs')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'fsrs'
                      ? 'neumorph-card ring-2 ring-[#FF6F3D] shadow-md bg-gradient-to-br from-orange-500/5 to-transparent'
                      : 'neumorph-card hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${celebrationMode === 'fsrs' ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white' : 'neumorph-inset text-[#5E6D88]'}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === 'en' ? 'App Adaptive Schedule (Recommended)' : 'Penjadwalan Otomatis FSRS (Rekomendasi)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === 'fsrs' ? 'bg-[#FF6F3D] text-white' : 'border border-slate-300'}`}>
                      {celebrationMode === 'fsrs' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] pl-7 leading-relaxed">
                    {language === 'en'
                      ? 'Intervals adapt automatically based on your recall. If recitation ever falters, the app automatically schedules it for an earlier review.'
                      : 'Jadwal pengulangan diatur secara adaptif oleh aplikasi. Jika hafalan kelak terasa goyah saat diulang, sistem otomatis menjadwalkan murajaah lebih awal.'}
                  </p>
                </div>

                {/* 2. Weekly Fixed Day */}
                <div
                  onClick={() => setCelebrationMode('weekly')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'weekly'
                      ? 'neumorph-card ring-2 ring-[#10B981] shadow-md bg-gradient-to-br from-emerald-500/5 to-transparent'
                      : 'neumorph-card hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${celebrationMode === 'weekly' ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white' : 'neumorph-inset text-[#5E6D88]'}`}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === 'en' ? 'Weekly Fixed Day' : 'Jadwal Mingguan (Pilih Hari)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === 'weekly' ? 'bg-[#10B981] text-white' : 'border border-slate-300'}`}>
                      {celebrationMode === 'weekly' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  {celebrationMode === 'weekly' && (
                    <div className="pt-2 pl-7 space-y-1.5">
                      <span className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-bold block">
                        {language === 'en' ? 'Murajaah every:' : 'Murajaah setiap hari:'}
                      </span>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCelebrationWeeklyDay(day.id);
                            }}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-black text-center cursor-pointer transition-all ${
                              celebrationWeeklyDay === day.id
                                ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs'
                                : 'neumorph-inset text-[#5E6D88] hover:text-[#18234A]'
                            }`}
                          >
                            {language === 'en' ? day.labelEn : day.labelId}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Monthly Fixed Date */}
                <div
                  onClick={() => setCelebrationMode('monthly')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'monthly'
                      ? 'neumorph-card ring-2 ring-[#FF6F3D] shadow-md bg-gradient-to-br from-orange-500/5 to-transparent'
                      : 'neumorph-card hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${celebrationMode === 'monthly' ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white' : 'neumorph-inset text-[#5E6D88]'}`}>
                        <CalendarCheck2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === 'en' ? 'Monthly Fixed Date' : 'Jadwal Bulanan (Pilih Tanggal 1–31)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === 'monthly' ? 'bg-[#FF6F3D] text-white' : 'border border-slate-300'}`}>
                      {celebrationMode === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  {celebrationMode === 'monthly' && (
                    <div className="pt-2 pl-7 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5E6D88] dark:text-[#94A3B8] font-bold">
                          {language === 'en' ? 'Review date (1 - 31):' : 'Tanggal murajaah tiap bulan (1 - 31):'}
                        </span>
                        <span className="font-black px-2 py-0.5 rounded-lg bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs">
                          {language === 'en' ? `Day ${celebrationMonthlyDate}` : `Tanggal ${celebrationMonthlyDate}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="31"
                        value={celebrationMonthlyDate}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setCelebrationMonthlyDate(parseInt(e.target.value))}
                        className="w-full accent-[#FF6F3D] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#5E6D88] font-bold">
                        <span>Tgl 1</span>
                        <span>Tgl 10</span>
                        <span>Tgl 20</span>
                        <span>Tgl 31</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={advanceQueue}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-sm shadow-[0_4px_14px_rgba(255,111,61,0.4)] transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>{language === 'en' ? 'Save & Continue' : 'Simpan & Lanjut ke Halaman Berikutnya'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isFinished ? (
            <div className="text-center py-8 my-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {juzFilter 
                  ? (language === 'en' ? `Juz ${juzFilter} Murajaah Complete!` : `Murajaah Juz ${juzFilter} Selesai!`)
                  : (language === 'en' ? 'Murajaah Complete!' : 'Murajaah Hari Ini Selesai!')}
              </h4>
              <p className="text-sm text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto font-medium">
                {language === 'en'
                  ? `Alhamdulillah! You reviewed ${reviewedCount} page${reviewedCount === 1 ? '' : 's'}. Next intervals have been updated.`
                  : `Alhamdulillah! Anda telah mereview ${reviewedCount} halaman. Jadwal murajaah telah dihitung dan diperbarui.`}
              </p>

              {/* Next Due Juz Suggestions if any remain (Compact High-Density Grid: min 4 items per row) */}
              {otherDueJuzNumbers.length > 0 && (
                <div className="mt-5 p-3.5 sm:p-4 rounded-3xl neumorph-card max-w-lg mx-auto text-left space-y-2.5 border border-white/60 dark:border-white/5">
                  <p className="text-[11px] sm:text-xs font-black text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
                    {language === 'en' ? 'Other Juz due today:' : 'Juz lain yang masih due hari ini:'}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {otherDueJuzNumbers.map(nextJuz => {
                      const dueCount = otherDueJuzMap.get(nextJuz) || 0;
                      return (
                        <button
                          key={nextJuz}
                          type="button"
                          onClick={() => {
                            if (onSelectNextJuz) {
                              onSelectNextJuz(nextJuz);
                              setCurrentIndex(0);
                              setReviewedCount(0);
                              setIsPageRevealed(true);
                            }
                          }}
                          className="py-1.5 px-1 rounded-xl neumorph-card hover:scale-105 active:scale-95 text-xs font-black text-[#18234A] dark:text-[#F8FAFC] transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer border border-white/60 dark:border-white/5"
                          title={`Juz ${nextJuz}: ${dueCount} due`}
                        >
                          <span className="text-[10px] sm:text-xs font-black">Juz {nextJuz}</span>
                          <span className="px-1 py-0.2 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-[9px] font-black shrink-0 shadow-2xs leading-none">
                            {dueCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#18234A] to-[#0E1626] text-white font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <span>{language === 'en' ? 'Return to Quran Room' : 'Kembali ke Ruang Al-Qur\'an'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !currentItem ? (
            /* Safe Fallback: Empty Queue or No Active Pages Due */
            <div className="text-center py-8 my-auto space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {language === 'en' ? 'No Due Pages in This Session' : 'Tidak Ada Halaman yang Jatuh Tempo'}
              </h4>
              <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] font-medium leading-relaxed">
                {language === 'en'
                  ? 'All pages in this selection are currently up to date! Great job maintaining your memorization rhythm.'
                  : 'Seluruh hafalan pada pilihan ini telah dimurajaah atau belum jatuh tempo hari ini. Pertahankan konsistensi Anda!'}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  <span>{language === 'en' ? 'Close' : 'Tutup'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Page Information & Top Action Icons (Compact Sleek Bar) */}
              <div className="neumorph-card bg-white/90 dark:bg-[#182236]/90 border border-white/70 dark:border-white/5 rounded-2xl px-3 py-1.5 mb-1.5 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl neumorph-inset flex flex-col items-center justify-center shrink-0">
                    <span className="text-[7px] font-black text-[#FF6F3D] uppercase leading-none">Hal</span>
                    <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC] leading-none mt-0.5">{currentItem.pageNumber}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] truncate">
                        {currentItem.surahNameEn}
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full neumorph-inset font-bold text-[#5E6D88] dark:text-[#94A3B8] shrink-0">
                        Juz {currentItem.juzNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
                      Ayat {currentItem.ayahRange}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-serif text-sm font-bold text-[#FF6F3D] hidden lg:inline mr-1" dir="rtl">
                    سُورَةُ {currentItem.surahNameAr}
                  </span>

                  {/* Mode Toggle: Reveal / Hide Mushaf (Icon Mata Saja) */}
                  <button
                    type="button"
                    onClick={() => setIsPageRevealed(prev => !prev)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isPageRevealed
                        ? 'neumorph-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                        : 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs hover:scale-105'
                    }`}
                    title={isPageRevealed ? (language === 'en' ? 'Hide Mushaf' : 'Tutup Mushaf') : (language === 'en' ? 'Reveal Mushaf' : 'Lihat Mushaf')}
                  >
                    {isPageRevealed ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  {/* Pelacakan Masalah / Catat Koreksi (Opens Standard QuranPageFeedbackModal) */}
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 relative ${
                      (currentItem.issues || []).filter(i => !i.isResolved).length > 0
                        ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs'
                        : 'neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105'
                    }`}
                    title={language === 'en' ? 'Track Memorization Issues / Corrections' : 'Pelacakan Masalah Hafalan & Koreksi'}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {(currentItem.issues || []).filter(i => !i.isResolved).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#182236]">
                        {(currentItem.issues || []).filter(i => !i.isResolved).length}
                      </span>
                    )}
                  </button>

                  {/* Fullscreen Viewer Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullViewerOpen(true)}
                    className="w-8 h-8 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                    title={language === 'en' ? 'Fullscreen Mushaf' : 'Buka Layar Penuh'}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quran Printed Page Image Container (Standard Porcelain Canvas) */}
              <div className="flex-1 w-full rounded-3xl overflow-hidden relative flex items-center justify-center bg-white dark:bg-[#FFFDF7] shadow-inner border border-black/[0.06] dark:border-black/20 p-1 sm:p-2 min-h-0">
                {isPageRevealed ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EEF2F7] dark:bg-[#141C2B] z-10">
                        <Loader2 className="w-7 h-7 text-[#FF6F3D] animate-spin mb-2" />
                        <span className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-bold">Memuat Halaman Mushaf...</span>
                      </div>
                    )}
                    <img
                      src={localImageUrl || currentImageUrl}
                      alt={`Halaman ${currentItem.pageNumber}`}
                      onLoad={() => {
                        setImageLoading(false);
                        cachePageOffline(currentItem.pageNumber);
                      }}
                      className="w-full h-full object-contain select-none transition-all duration-200"
                    />
                  </>
                ) : (
                  <div className="text-center p-6 my-auto flex flex-col items-center justify-center space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-3xl neumorph-card flex items-center justify-center text-[#FF6F3D] bg-orange-500/5 shadow-inner">
                      <BookOpen className="w-8 h-8 text-[#FF6F3D]" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#18234A] dark:text-[#F8FAFC]">
                        {language === 'en' ? 'Recall Mode (From Memory)' : 'Mode Uji Hafalan (Luar Kepala)'}
                      </h4>
                      <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] mt-1 leading-relaxed">
                        {language === 'en' ? 'Recite from memory, then reveal the mushaf to check your accuracy.' : 'Lantunkan ayat secara mandiri, lalu buka mushaf untuk memverifikasi kelancaran.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPageRevealed(true)}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white text-xs font-black shadow-[0_4px_12px_rgba(255,111,61,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{language === 'en' ? 'Reveal Mushaf Page' : 'Lihat Halaman Mushaf'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Minimalist Audio Recorder Player (Positioned BELOW the Mushaf page) */}
              <div className="mt-1.5 mb-1 px-2.5 py-0.5 rounded-2xl neumorph-card border border-white/60 dark:border-white/5 shrink-0">
                <AudioRecorderPlayer 
                  itemId={currentItem.pageNumber}
                  itemType="quran"
                  itemLabel={`Hal ${currentItem.pageNumber}`}
                  language={language}
                  variant="mushaf-dock"
                />
              </div>

              {/* Rating Buttons */}
              <div className="mt-auto shrink-0 space-y-1">
                {/* Soft Confirmation Feedback Pill */}
                {justRated && (
                  <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-md animate-in fade-in zoom-in-95 duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-black">{justRated.label}</span>
                  </div>
                )}

                {/* 3 Feedback Rating Buttons (Tactile Soft-Clay with friendly psychological colors) */}
                {(() => {
                  const isItemDue = isDue(currentItem.fsrsData.nextReview, currentItem.isActive);
                  const isMapanEver = currentItem.status === 'mastered_for_now' || !!currentItem.mapanCelebrated || (currentItem.fsrsData.stability || 0) * 0.4025587 >= 30;
                  const isRating3Allowed = isMapanEver || isTeacher;
                  const qIntervals = predictQuranIntervals(currentItem.fsrsData, currentItem.mapanSchedule);

                  return (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                      {/* Rating 1: Belum (Review) - Soft Warm Rose/Peach (Supportive, non-intimidating) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue) handleRating(1);
                        }}
                        disabled={!isItemDue || !!justRated}
                        className={`py-1.5 sm:py-2 px-1 rounded-2xl transition-all flex flex-col items-center justify-center min-h-[50px] cursor-pointer shadow-xs border ${
                          justRated?.rating === 1
                            ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white scale-105 shadow-md border-rose-600'
                            : isItemDue
                            ? 'bg-gradient-to-b from-[#FFF5F5] to-[#FFEBEB] dark:from-[#2E141C] dark:to-[#220E15] border-rose-300/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 hover:scale-[1.02] active:scale-95 shadow-[0_2px_8px_rgba(244,63,94,0.08)]'
                            : 'neumorph-inset opacity-40 text-slate-400 dark:text-slate-500 cursor-not-allowed border-transparent'
                        }`}
                        title={language === 'en' ? 'Needs Review (Scheduled for tomorrow)' : 'Belum lancar (Dijadwalkan ulang besok)'}
                      >
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 leading-none">
                          {qIntervals.needReviewDays}{language === 'en' ? 'd' : ' hr'}
                        </span>
                        <span className="font-black text-xs sm:text-sm mt-0.5">
                          {language === 'en' ? 'Review' : language === 'id' ? 'Belum' : 'مراجعة'}
                        </span>
                      </button>

                      {/* Rating 2: Lancar (Fluent) - Oceanic Azure Blue (Inviting, refreshing) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue) handleRating(2);
                        }}
                        disabled={!isItemDue || !!justRated}
                        className={`py-1.5 sm:py-2 px-1 rounded-2xl transition-all flex flex-col items-center justify-center min-h-[50px] cursor-pointer shadow-xs border ${
                          justRated?.rating === 2
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white scale-105 shadow-md border-blue-600'
                            : isItemDue
                            ? 'bg-gradient-to-b from-[#F0F7FF] to-[#E0EFFF] dark:from-[#11243B] dark:to-[#0B1A2C] border-blue-300/80 dark:border-blue-900/60 text-blue-800 dark:text-blue-200 hover:scale-[1.02] active:scale-95 shadow-[0_2px_8px_rgba(37,99,235,0.08)]'
                            : 'neumorph-inset opacity-40 text-slate-400 dark:text-slate-500 cursor-not-allowed border-transparent'
                        }`}
                        title={language === 'en' ? 'Fluent (Extends interval)' : 'Lancar (Meningkatkan interval murajaah)'}
                      >
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 leading-none">
                          +{qIntervals.hardDays}{language === 'en' ? 'd' : ' hr'}
                        </span>
                        <span className="font-black text-xs sm:text-sm mt-0.5">
                          {language === 'en' ? 'Fluent' : language === 'id' ? 'Lancar' : 'حاضر'}
                        </span>
                      </button>

                      {/* Rating 3: Mutqin (Mastered) - Serene Emerald Jade (Rewarding, prestigious) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue && isRating3Allowed) handleRating(3);
                        }}
                        disabled={!isItemDue || !isRating3Allowed || !!justRated}
                        className={`py-1.5 sm:py-2 px-1 rounded-2xl transition-all flex flex-col items-center justify-center min-h-[50px] shadow-xs border ${
                          justRated?.rating === 3
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white scale-105 shadow-md border-emerald-600'
                            : isItemDue && isRating3Allowed
                            ? 'bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0E2E20] dark:to-[#091F16] border-emerald-400/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.1)]'
                            : 'neumorph-inset opacity-40 text-[#5E6D88] dark:text-[#94A3B8] cursor-not-allowed border-transparent'
                        }`}
                        title={
                          !isRating3Allowed
                            ? (language === 'en' ? 'Locked: Available once item reaches Mastered (>30d interval) or via Teacher in Class' : 'Terkunci: Aktif otomatis setelah hafalan mencapai status Mapan (>30 hari) atau dinilai oleh Guru di Ruang Mengajar')
                            : isTeacher && !isMapanEver
                            ? (language === 'en' ? 'Mutqin (Teacher Assessment / Direct Boost)' : 'Lancar Mutqin (Penilaian Guru Halaqah)')
                            : (language === 'en' ? 'Fluent Mutqin (Optimal interval boost)' : 'Lancar Mutqin (Kenaikan cepat optimal)')
                        }
                      >
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 leading-none">
                          {isRating3Allowed ? `+${qIntervals.goodDays}${language === 'en' ? 'd' : ' hr'}` : '🔒 Mapan'}
                        </span>
                        <span className="font-black text-xs sm:text-sm mt-0.5">
                          {language === 'en' ? 'Mutqin' : 'Mutqin'}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Standardized Quran Page Issue & Feedback Modal (Identical to Quran Space) */}
        {currentItem && (
          <QuranPageFeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            page={currentItem}
          />
        )}

        {/* Fullscreen Mushaf Page Viewer Sub-Modal */}
        {currentItem && (
          <MushafPageViewerModal
            pageNumber={currentItem.pageNumber}
            isOpen={isFullViewerOpen}
            onClose={() => setIsFullViewerOpen(false)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
          />
        )}
      </div>
    </div>
  );
};
