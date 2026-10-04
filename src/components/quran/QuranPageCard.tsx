import React, { useState, useEffect } from 'react';
import { QuranPageItem, Language } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue, isReviewedToday, getIntervalDays, predictQuranIntervals } from '../../lib/fsrs';
import { AudioStorageService } from '../../lib/AudioStorageService';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { 
  Play, 
  Power, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  Flame, 
  Brain, 
  CalendarClock, 
  Mic,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  page: QuranPageItem;
  language: Language;
  onToggleActive: (pageNumber: number) => void;
  onOpenMapanModal: (page: QuranPageItem) => void;
  onOpenFeedbackModal: (page: QuranPageItem) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
  onInlineReview?: (pageNumber: number, rating: 1 | 2 | 3) => void;
  isJustReviewed?: boolean;
  justReviewedRating?: 1 | 2 | 3;
  isHighlighted?: boolean;
}

export const QuranPageCard: React.FC<Props> = ({
  page,
  language,
  onToggleActive,
  onOpenMapanModal,
  onOpenFeedbackModal,
  onOpenMushafViewer,
  onInlineReview,
  isJustReviewed,
  justReviewedRating,
  isHighlighted
}) => {
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(page.pageNumber).then(exists => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(page.pageNumber)) {
        AudioStorageService.hasAudio(page.pageNumber).then(exists => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener('audio-updated', handleAudioChange);
    return () => {
      mounted = false;
      window.removeEventListener('audio-updated', handleAudioChange);
    };
  }, [page.pageNumber]);

  const isDueToday = isDue(page.fsrsData.nextReview, page.isActive);
  const reviewedToday = isReviewedToday(page.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const isMapan = page.status === 'mastered_for_now' || !!page.mapanCelebrated || (page.fsrsData.stability || 0) * 0.4025587 >= 30;
  const isMutqinUnlocked = isMapan;

  const formatAccurateDueDate = () => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isOverdue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
    if (isOverdue) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = () => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    return nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const pageInterval = getIntervalDays(page.fsrsData) || Math.max(1, Math.round((page.fsrsData.stability || 0) * 0.4025587));
  const unresolvedIssuesCount = page.issues ? page.issues.filter(i => !i.isResolved).length : 0;
  const qIntervals = predictQuranIntervals(page.fsrsData, page.mapanSchedule);

  return (
    <div
      id={`quran-page-card-${page.pageNumber}`}
      className={`neumorph-card p-3.5 sm:p-4 rounded-3xl transition-all flex flex-col justify-between relative overflow-hidden group ${
        isHighlighted
          ? 'ring-4 ring-[#0EA5E9] shadow-[0_0_30px_rgba(14,165,233,0.5)] scale-[1.02] z-10 duration-300'
          : isDueToday 
          ? 'ring-2 ring-[#FF6F3D]/70 shadow-[0_6px_20px_rgba(255,111,61,0.2)]' 
          : showDimmed
          ? 'opacity-85'
          : page.isActive 
          ? '' 
          : 'opacity-70 hover:opacity-100'
      }`}
    >
      {/* Top Identity Row */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Left Side: Play/Power Button & Page Title / Verse Info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Play / Active Power Button - Tactile Soft-Clay Pod */}
          <button
            type="button"
            onClick={() => onToggleActive(page.pageNumber)}
            className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
              page.isActive
                ? 'bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white shadow-[0_3px_10px_rgba(14,165,233,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.7)] hover:scale-105'
                : 'neumorph-inset text-[#8493AB] hover:text-[#0EA5E9] hover:scale-105 shadow-2xs'
            }`}
            title={page.isActive ? (language === 'en' ? 'Deactivate Page' : 'Nonaktifkan Halaman') : (language === 'en' ? 'Activate Page' : 'Aktivasi Halaman')}
          >
            {page.isActive ? (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            ) : (
              <Power className="w-4 h-4 text-[#8493AB]" />
            )}
          </button>

          {/* Clickable Page Identity: Opens Mushaf directly */}
          <div 
            onClick={() => onOpenMushafViewer(page.pageNumber)}
            className="flex-1 min-w-0 cursor-pointer group/title select-none"
            title={language === 'en' ? 'Click to open Mushaf' : 'Klik untuk buka Mushaf'}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-black text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] group-hover/title:text-[#FF6F3D] transition-colors shrink-0">
                {language === 'en' ? 'Page' : language === 'id' ? 'Hal' : 'صفحة'} {page.pageNumber}
              </span>
              <span className="text-[#FF6F3D] text-xs font-bold">•</span>
              <span className="font-black text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] truncate group-hover/title:text-[#FF6F3D] transition-colors">
                {page.surahNameEn}
              </span>
            </div>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-semibold mt-0.5">
              {language === 'en' ? 'Verse' : language === 'id' ? 'Ayat' : 'آية'} {page.ayahRange}
            </p>
          </div>
        </div>

        {/* Right Side: Stacked Column - Badges on TOP, Action Buttons BELOW */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Badge Row (Jatuh Tempo / Mapan) with WOW-Factor 3D Glow */}
          {(isDueToday || isMapan) && (
            <div className="flex items-center gap-1.5 justify-end">
              {isDueToday && (
                <span className="px-2.5 py-1 rounded-2xl bg-gradient-to-r from-[#FF7E4A] via-[#FF6F3D] to-[#E65320] text-white font-black text-[10px] tracking-wide shadow-[0_3px_10px_rgba(255,111,61,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.8)] flex items-center gap-1 leading-none">
                  <Flame className="w-3 h-3 fill-white text-white" />
                  <span>{language === 'en' ? 'Due Today' : 'Jatuh Tempo'}</span>
                </span>
              )}
              {isMapan && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMapanModal(page);
                  }}
                  className="px-2.5 py-1 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-[10px] tracking-wide flex items-center gap-1 transition-all cursor-pointer shadow-[0_3px_10px_rgba(16,185,129,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 leading-none"
                  title={language === 'en' ? 'Customize Mastered Murajaah Rhythm' : 'Atur Ritme Murajaah Mapan'}
                >
                  <Sparkles className="w-3 h-3 text-white fill-white" />
                  <span>{language === 'en' ? 'Mastered' : 'Mapan'}</span>
                  {page.mapanSchedule?.mode === 'weekly' && (
                    <span className="text-[8.5px] font-bold opacity-90">• Mgg</span>
                  )}
                  {page.mapanSchedule?.mode === 'monthly' && (
                    <span className="text-[8.5px] font-bold opacity-90">• Bln</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Action Icon Pods Row ([Catatan Evaluasi] [Mic / Record] [Eye / View Mushaf]) */}
          <div className="flex items-center gap-1.5">
            {/* Evaluation Notes button with badge */}
            <button
              type="button"
              onClick={() => onOpenFeedbackModal(page)}
              className="relative w-8 h-8 rounded-2xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
              title={language === 'en' ? 'Evaluation Notes' : 'Catatan Evaluasi'}
            >
              <MessageSquare className="w-4 h-4" strokeWidth={2.2} />
              {unresolvedIssuesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs ring-1 ring-white dark:ring-[#141C2B]">
                  {unresolvedIssuesCount}
                </span>
              )}
            </button>

            {/* Audio Recording & Playback button with active indicator */}
            <button
              type="button"
              onClick={() => setShowAudio(!showAudio)}
              className={`relative w-8 h-8 rounded-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                showAudio
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_8px_rgba(255,111,61,0.4)]'
                  : hasAudio 
                  ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' 
                  : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#3B82F6]'
              }`}
              title={language === 'en' ? 'Voice Recording (Self Tasmi\')' : 'Rekaman Suara Tasmi\' Mandiri (24 Jam)'}
            >
              <Mic className="w-4 h-4" strokeWidth={2.2} />
              {hasAudio && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full ring-2 ring-white dark:ring-[#141C2B]" />
              )}
            </button>

            {/* Mushaf Page Viewer Eye button */}
            <button
              type="button"
              onClick={() => onOpenMushafViewer(page.pageNumber)}
              className="w-8 h-8 rounded-2xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
              title={language === 'en' ? 'View Printed Mushaf' : 'Lihat Mushaf Cetak'}
            >
              <Eye className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* Single-Line Bottom Row with Compact Metrics & 3 Rating Buttons */}
      {page.isActive ? (
        <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-1">
          {/* Metrics - Compacted to the left */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs min-w-0">
            {/* 1. Review Reps (Flame) */}
            <div 
              className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] shrink-0" 
              title={language === 'en' ? `Reviewed: ${page.fsrsData.reps} times` : `Sudah direview: ${page.fsrsData.reps} kali`}
            >
              <Flame className="w-3.5 h-3.5 text-[#FF6F3D] fill-[#FF6F3D] shrink-0" />
              <span className="font-black text-[11px] text-[#18234A] dark:text-[#F8FAFC]">{page.fsrsData.reps}×</span>
            </div>

            {/* 2. Stability calculated into days (Brain) */}
            <div 
              className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] shrink-0" 
              title={language === 'en' ? `Interval: ${pageInterval} days` : `Interval murajaah: ${pageInterval} hari`}
            >
              <Brain className="w-3.5 h-3.5 text-[#5E6D88] dark:text-[#94A3B8] shrink-0" />
              <span className="font-bold text-[11px] text-[#18234A] dark:text-[#F8FAFC]">
                {pageInterval}{language === 'en' ? 'd' : ' hr'}
              </span>
            </div>

            {/* 3. Accurate Due Date (CalendarClock) */}
            <div 
              className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] truncate max-w-[65px] sm:max-w-[90px]" 
              title={language === 'en' ? `Due Date: ${getFullDueDateStr()}` : `Jatuh tempo: ${getFullDueDateStr()}`}
            >
              <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDueToday ? 'text-[#FF6F3D]' : 'text-[#8493AB]'}`} />
              <span className={`font-bold text-[10.5px] truncate ${isDueToday ? 'text-[#FF6F3D] font-black' : ''}`}>
                {formatAccurateDueDate()}
              </span>
            </div>
          </div>

          {/* Quick 1-Click Action Buttons: Rating 1 (Belum), Rating 2 (Lancar), Rating 3 (Mutqin - Locked until Mapan) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Rating 1: Belum / Ulang */}
            <button
              type="button"
              onClick={() => {
                if (isDueToday && onInlineReview) onInlineReview(page.pageNumber, 1);
              }}
              disabled={!isDueToday || !onInlineReview}
              className={`py-1.5 px-2.5 min-w-[50px] rounded-2xl flex flex-col items-center justify-center transition-all ${
                isJustReviewed && justReviewedRating === 1
                  ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white scale-105 cursor-default shadow-xs'
                  : isDueToday
                  ? 'neumorph-card text-[#EF4444] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:scale-105 active:scale-95 cursor-pointer shadow-xs font-bold'
                  : 'neumorph-inset opacity-35 text-[#8493AB] cursor-not-allowed'
              }`}
              title={
                !isDueToday
                  ? (language === 'en' ? `Available on due date (${formatAccurateDueDate()})` : `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`)
                  : (language === 'en' ? 'Needs review / Repeat (Next review in 1 day)' : 'Belum lancar / Perlu latihan (Review ulang 1 hari)')
              }
            >
              <span className="text-[10px] font-black leading-tight">
                {qIntervals.needReviewDays || 1} {language === 'en' ? 'd' : 'hr'}
              </span>
              <span className="text-[9px] font-bold opacity-85 leading-none mt-0.5">
                {language === 'en' ? 'Repeat' : 'Belum'}
              </span>
            </button>

            {/* Rating 2: Lancar */}
            <button
              type="button"
              onClick={() => {
                if (isDueToday && onInlineReview) onInlineReview(page.pageNumber, 2);
              }}
              disabled={!isDueToday || !onInlineReview}
              className={`py-1.5 px-2.5 min-w-[50px] rounded-2xl flex flex-col items-center justify-center transition-all ${
                isJustReviewed && justReviewedRating === 2
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white scale-105 cursor-default shadow-xs'
                  : isDueToday
                  ? 'neumorph-card text-[#FF6F3D] hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:scale-105 active:scale-95 cursor-pointer shadow-xs font-bold'
                  : 'neumorph-inset opacity-35 text-[#8493AB] cursor-not-allowed'
              }`}
              title={
                !isDueToday
                  ? (language === 'en' ? `Available on due date (${formatAccurateDueDate()})` : `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`)
                  : (language === 'en' ? `Fluent / Good (Next review in +${qIntervals.hardDays} days)` : `Lancar (+${qIntervals.hardDays} hari berikutnya)`)
              }
            >
              <span className="text-[10px] font-black leading-tight">
                +{qIntervals.hardDays} {language === 'en' ? 'd' : 'hr'}
              </span>
              <span className="text-[9px] font-bold opacity-85 leading-none mt-0.5">
                {language === 'en' ? 'Good' : 'Lancar'}
              </span>
            </button>

            {/* Rating 3: Mutqin (STRICTLY LOCKED UNTIL MAPAN) */}
            {isMutqinUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  if (isDueToday && onInlineReview) onInlineReview(page.pageNumber, 3);
                }}
                disabled={!isDueToday || !onInlineReview}
                className={`py-1.5 px-2.5 min-w-[50px] rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isJustReviewed && justReviewedRating === 3
                    ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white scale-105 cursor-default shadow-xs'
                    : isDueToday
                    ? 'neumorph-card text-[#10B981] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:scale-105 active:scale-95 cursor-pointer shadow-xs font-bold'
                    : 'neumorph-inset opacity-35 text-[#8493AB] cursor-not-allowed'
                }`}
                title={
                  !isDueToday
                    ? (language === 'en' ? `Available on due date (${formatAccurateDueDate()})` : `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`)
                    : (language === 'en' ? `Mastered / Mutqin (Next review in +${qIntervals.goodDays} days)` : `Sangat Lancar / Mutqin (+${qIntervals.goodDays} hari)`)
                }
              >
                <span className="text-[10px] font-black leading-tight">
                  +{qIntervals.goodDays} {language === 'en' ? 'd' : 'hr'}
                </span>
                <span className="text-[9px] font-bold opacity-85 leading-none mt-0.5">
                  {language === 'en' ? 'Mutqin' : 'Mutqin'}
                </span>
              </button>
            ) : (
              /* Locked Mutqin State: Disables clicking and clearly shows lock */
              <div
                className="py-1.5 px-2.5 min-w-[50px] rounded-2xl neumorph-inset opacity-40 text-[#8493AB] flex flex-col items-center justify-center cursor-not-allowed select-none"
                title={language === 'en' ? 'Locked until page reaches Mastered/Mapan status (Interval ≥ 30 days)' : 'Terkunci sampai halaman mencapai status Mapan (interval ≥ 30 hari)'}
              >
                <div className="flex items-center gap-0.5 text-[10px] font-black leading-tight">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{qIntervals.goodDays}hr</span>
                </div>
                <span className="text-[9px] font-bold leading-none mt-0.5">
                  Mutqin
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
          <span className="text-[11px] text-[#8493AB] font-medium italic">
            {language === 'en' ? 'Page inactive in schedule' : 'Halaman belum aktif di jadwal'}
          </span>
          <button
            type="button"
            onClick={() => onToggleActive(page.pageNumber)}
            className="px-3 py-1 rounded-xl neumorph-card text-[#10B981] text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
          >
            {language === 'en' ? '+ Activate' : '+ Aktifkan'}
          </button>
        </div>
      )}

      {/* Inline Audio Recorder Player (Revealed when user taps mic button) */}
      {showAudio && (
        <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] animate-in fade-in duration-200">
          <AudioRecorderPlayer
            itemId={page.pageNumber}
            itemType="quran"
            itemLabel={`Hal ${page.pageNumber}`}
            language={language}
            variant="card"
            onHasRecordingChange={(has) => setHasAudio(has)}
            onOpenFeedback={() => onOpenFeedbackModal(page)}
          />
        </div>
      )}
    </div>
  );
};
