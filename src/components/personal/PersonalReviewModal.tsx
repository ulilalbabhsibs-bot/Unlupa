import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookItem } from '../../types';
import { predictNonQuranIntervals } from '../../lib/fsrs';
import { X, Trophy, ArrowRight, BookOpen, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, FileText, Maximize2, Sparkles, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from '../common/BilingualCardText';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { AdaptiveFlashcardImage } from '../common/AdaptiveFlashcardImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  specificBookId?: string;
  specificChapterId?: string;
}

export const PersonalReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  specificBookId,
  specificChapterId,
}) => {
  const { personalStats, reviewItem, books, chapters, language } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionQueue, setSessionQueue] = useState<BookItem[]>([]);
  const [justRated, setJustRated] = useState<{
    rating: 1 | 2 | 3 | 4;
    label: string;
    interval: string;
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string | null; title: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const q = specificChapterId
        ? personalStats.dueList.filter(i => i.chapterId === specificChapterId)
        : specificBookId 
        ? personalStats.dueList.filter(i => i.bookId === specificBookId)
        : personalStats.dueList;
      setSessionQueue(q);
      setCurrentIndex(0);
      setReviewedCount(0);
      setShowAnswer(false);
      setShowExplanation(false);
      setJustRated(null);
    } else {
      setSessionQueue([]);
    }
  }, [isOpen, specificBookId, specificChapterId]);

  React.useEffect(() => {
    setShowExplanation(false);
  }, [currentIndex, showAnswer]);

  const queue = sessionQueue;
  const currentItem = queue[currentIndex] || null;
  const currentBook = currentItem ? books.find(b => b.id === currentItem.bookId) : null;
  const currentChapter = currentItem ? chapters.find(c => c.id === currentItem.chapterId) : null;

  const handleRating = (rating: 1 | 2 | 3 | 4) => {
    if (!currentItem || justRated) return;

    // Subtle audio micro-interaction
    soundEffects.playRatingFeedback(rating);

    const intervals = predictNonQuranIntervals(currentItem.fsrsData);
    const ratingLabels = {
      1: language === 'en' ? 'Review Again' : 'Perlu Diulang',
      2: language === 'en' ? 'Hard' : 'Sukar / Berat',
      3: language === 'en' ? 'Good' : 'Baik / Mantap',
      4: language === 'en' ? 'Easy' : 'Sangat Lancar',
    };

    setJustRated({
      rating,
      label: ratingLabels[rating],
      interval: intervals[rating],
    });

    // Gentle micro confirmation delay for smooth visual transition
    setTimeout(() => {
      reviewItem(currentItem.id, rating);
      setReviewedCount(prev => prev + 1);
      setShowAnswer(false);
      setJustRated(null);

      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setCurrentIndex(queue.length);
      }
    }, 280);
  };

  const isFinished = !currentItem || currentIndex >= queue.length;

  // Swipe support during card review session
  useSwipeGesture(null, {
    disabled: !isOpen || Boolean(typeof document !== 'undefined' && (document.body.getAttribute('data-annotation-open') === 'true' || document.body.getAttribute('data-image-modal-open') === 'true')),
    onSwipeRight: () => {
      if (isFinished) {
        onClose();
      } else if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setShowAnswer(false);
      } else {
        onClose();
      }
    },
    onSwipeLeft: () => {
      if (isFinished) return;
      if (!showAnswer) {
        setShowAnswer(true);
      } else {
        handleRating(3); // Default to 'Good' on swipe left after answer is shown
      }
    },
    threshold: 45,
  });

  if (!isOpen) return null;

  const currentProgressCount = Math.min(currentIndex + (isFinished ? 0 : 1), queue.length);
  const progressPercent = queue.length > 0 
    ? Math.round((currentIndex / queue.length) * 100) 
    : 100;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                {language === 'en' ? 'Flashcard Review Session' : 'Sesi Review Kartu'}
              </h2>
              {currentBook ? (
                <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                  {currentBook.title} {currentChapter ? `› ${currentChapter.title}` : ''}
                </p>
              ) : (
                <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                  {language === 'en' ? 'All Due Flashcards' : 'Semua Kartu Jatuh Tempo'}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between space-y-4">
          {isFinished ? (
            <div className="text-center py-8 my-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl clay-icon-pod-emerald text-white mx-auto flex items-center justify-center shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {language === 'en' ? 'Review Session Complete!' : 'Sesi Review Selesai!'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                {language === 'en'
                  ? `Outstanding! You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'}. FSRS retention intervals have been successfully updated.`
                  : `Alhamdulillah! Anda telah mereview ${reviewedCount} kartu. Jadwal interval retensi memori telah dihitung dan diperbarui.`}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl clay-btn-primary text-white font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{language === 'en' ? 'Back to Library' : 'Kembali ke Koleksi Buku'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col min-h-0">
              {/* Visual Review Progress Bar */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8]">
                  <span>{language === 'en' ? 'Card' : 'Kartu'} {currentIndex + 1} / {queue.length}</span>
                  <span className="text-[#FF6F3D]">
                    {progressPercent}% ({queue.length - currentIndex} {language === 'en' ? 'remaining' : 'tersisa'})
                  </span>
                </div>
                <div className="w-full clay-inset h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#FF6F3D] to-[#FFA180] h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                    style={{ width: `${Math.min(100, Math.max(6, progressPercent))}%` }}
                  />
                </div>
              </div>

              {/* CARD CONTAINER: Front (Question) vs Back (Answer + 4 Rating Buttons) */}
              {!showAnswer ? (
                /* Front of Card: Question + Click anywhere to flip hint */
                <div 
                  onClick={() => setShowAnswer(true)}
                  className="clay-card p-5 sm:p-7 min-h-[200px] sm:min-h-[230px] flex flex-col justify-between cursor-pointer transition-all duration-200 active:scale-[0.99] select-none group flex-1"
                >
                  <div className="flex-1 flex flex-col justify-center">
                    {currentItem.imageQ && (
                      <div className="mb-3">
                        <AdaptiveFlashcardImage
                          src={currentItem.imageQ}
                          alt="Question"
                          title={language === 'en' ? 'Question Image' : 'Gambar Pertanyaan'}
                          language={language}
                          onEnlarge={() => setLightboxImage({ url: currentItem.imageQ || null, title: language === 'en' ? 'Question Image' : 'Gambar Pertanyaan' })}
                        />
                      </div>
                    )}
                    {currentItem.question?.trim() && (
                      <BilingualCardText 
                        text={currentItem.question}
                        type="question"
                        variant="review"
                      />
                    )}
                  </div>

                  {/* Minimalist Hint at the bottom */}
                  <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center text-xs text-[#5E6D88] dark:text-[#94A3B8] group-hover:text-[#FF6F3D] transition-colors font-medium">
                    <span>{language === 'en' ? '👆 Tap anywhere to reveal answer' : '👆 Ketuk di mana saja untuk melihat jawaban'}</span>
                  </div>
                </div>
              ) : (
                /* Back of Card: Answer + 4 Rating Feedback Buttons */
                <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between min-h-0">
                  <div className="clay-card p-5 sm:p-7 min-h-[190px] sm:min-h-[220px] flex flex-col justify-between flex-1 overflow-y-auto">
                    <div className="flex-1 flex flex-col justify-center">
                      {currentItem.imageA && (
                        <div className="mb-3">
                          <AdaptiveFlashcardImage
                            src={currentItem.imageA}
                            alt="Answer"
                            title={language === 'en' ? 'Answer Image' : 'Gambar Jawaban'}
                            language={language}
                            onEnlarge={() => setLightboxImage({ url: currentItem.imageA || null, title: language === 'en' ? 'Answer Image' : 'Gambar Jawaban' })}
                          />
                        </div>
                      )}
                      {currentItem.answer?.trim() && (
                        <BilingualCardText 
                          text={currentItem.answer}
                          type="answer"
                          variant="review"
                        />
                      )}
                    </div>

                    {/* Extra Explanation Accordion */}
                    {currentItem.explanation && (
                      <div className="mt-4 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.04] text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowExplanation(prev => !prev);
                          }}
                          className={`w-full py-2.5 px-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            showExplanation
                              ? 'clay-btn-primary text-white shadow-xs'
                              : 'clay-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {showExplanation
                                ? (language === 'en' ? 'Hide Detailed Explanation' : 'Sembunyikan Penjelasan')
                                : (language === 'en' ? 'Read Explanation & Extra Material' : 'Buka Penjelasan / Materi Tambahan')}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] opacity-80 shrink-0">
                            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>

                        {showExplanation && (
                          <div className="mt-2.5 p-4 rounded-2xl clay-inset shadow-inner animate-in fade-in slide-in-from-top-1 duration-200 text-[#18234A] dark:text-[#F8FAFC] select-text max-h-56 overflow-y-auto">
                            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-black/[0.04] dark:border-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-[#FF6F3D]">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {language === 'en' ? 'Material Explanation' : 'Materi & Rincian Penjelasan'}
                              </span>
                            </div>
                            <div className="text-xs leading-relaxed">
                              <BilingualCardText 
                                text={currentItem.explanation}
                                type="general"
                                variant="detail-modal"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Soft confirmation micro-banner */}
                  {justRated && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-md animate-in fade-in zoom-in-95 duration-150 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold">{justRated.label}</span>
                      <span className="text-[11px] font-medium opacity-80">({justRated.interval})</span>
                    </div>
                  )}

                  {/* 4 Feedback Rating Buttons with Pleasing, Psychologically Friendly Colors */}
                  {(() => {
                    const p = predictNonQuranIntervals(currentItem.fsrsData);
                    return (
                      <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-1 shrink-0">
                        {/* 1. Lagi (Again) */}
                        <button
                          type="button"
                          onClick={() => handleRating(1)}
                          disabled={!!justRated}
                          className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-95 ${
                            justRated?.rating === 1
                              ? 'bg-rose-500 text-white scale-105 shadow-md'
                              : 'bg-gradient-to-br from-[#FFF1F0] to-[#FFE4E6] dark:from-[#2A1518] dark:to-[#381B20] text-[#E11D48] dark:text-[#FDA4AF] border border-[#FECDD3] dark:border-[#881337]'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-0.5">{p[1]}</span>
                        </button>

                        {/* 2. Sulit (Hard) */}
                        <button
                          type="button"
                          onClick={() => handleRating(2)}
                          disabled={!!justRated}
                          className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-95 ${
                            justRated?.rating === 2
                              ? 'bg-amber-500 text-white scale-105 shadow-md'
                              : 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#2B2110] dark:to-[#382B15] text-[#D97706] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#78350F]'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-0.5">{p[2]}</span>
                        </button>

                        {/* 3. Baik (Good) */}
                        <button
                          type="button"
                          onClick={() => handleRating(3)}
                          disabled={!!justRated}
                          className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-95 ${
                            justRated?.rating === 3
                              ? 'bg-blue-600 text-white scale-105 shadow-md'
                              : 'bg-gradient-to-br from-[#F0F7FF] to-[#E0EFFF] dark:from-[#0F2038] dark:to-[#172D4F] text-[#2563EB] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1E3A8A]'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-0.5">{p[3]}</span>
                        </button>

                        {/* 4. Mudah (Easy) */}
                        <button
                          type="button"
                          onClick={() => handleRating(4)}
                          disabled={!!justRated}
                          className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-95 ${
                            justRated?.rating === 4
                              ? 'bg-emerald-600 text-white scale-105 shadow-md'
                              : 'bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0E281C] dark:to-[#143B28] text-[#16A34A] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#065F46]'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-0.5">{p[4]}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Voice Note Recorder (Docked at bottom of review) */}
              <div className="pt-1 shrink-0">
                <AudioRecorderPlayer 
                  itemId={currentItem.id}
                  itemType="book"
                  itemLabel={language === 'en' ? 'Card Voice Note' : 'Setoran Suara Kartu'}
                  language={language}
                  compact={true}
                  variant="mushaf-dock"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Zoom Viewer for Flashcard Review */}
      <ImageLightboxModal 
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
