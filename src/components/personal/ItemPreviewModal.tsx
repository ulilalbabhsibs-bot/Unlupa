import React, { useState, useEffect } from 'react';
import { BookItem, Language } from '../../types';
import { X, CheckCircle2, ChevronLeft, ChevronRight, BookOpen, ChevronDown, ChevronUp, FileText, Maximize2, Power, Layers, Play } from 'lucide-react';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { BilingualCardText } from '../common/BilingualCardText';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { AdaptiveFlashcardImage } from '../common/AdaptiveFlashcardImage';

interface Props {
  item: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  language: Language;
}

export const ItemPreviewModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  onActivate,
  onDeactivate,
  language,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ''
  });

  useEffect(() => {
    setShowExplanation(false);
  }, [item?.id]);

  // Swipe to navigate between flashcards inside modal preview
  useSwipeGesture(null, {
    disabled: !isOpen || Boolean(typeof document !== 'undefined' && (document.body.getAttribute('data-annotation-open') === 'true' || document.body.getAttribute('data-image-modal-open') === 'true')),
    onSwipeLeft: () => {
      if (onNavigateNext) onNavigateNext();
    },
    onSwipeRight: () => {
      if (onNavigatePrev) {
        onNavigatePrev();
      } else {
        onClose();
      }
    },
    threshold: 40,
  });

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header: Clean & Focused with Previous / Next Stepper */}
        <div className="px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] block">
                {language === 'en' ? 'Flashcard Detail' : 'Detail Kartu Materi'}
              </span>
              <span className={`text-[10px] font-bold ${
                item.isActive 
                  ? 'text-sky-600 dark:text-sky-400' 
                  : 'text-[#8493AB]'
              }`}>
                {item.isActive ? (language === 'en' ? '● Active in reviews' : '● Aktif dalam review') : (language === 'en' ? '○ Inactive' : '○ Nonaktif')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(onNavigatePrev || onNavigateNext) && (
              <div className="flex items-center gap-0.5 clay-inset p-0.5 rounded-xl mr-1">
                <button
                  disabled={!onNavigatePrev}
                  onClick={onNavigatePrev}
                  className="p-1 rounded-lg text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === 'en' ? 'Previous Card (Swipe Right)' : 'Kartu Sebelumnya (Usap Kanan)'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!onNavigateNext}
                  onClick={onNavigateNext}
                  className="p-1 rounded-lg text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === 'en' ? 'Next Card (Swipe Left)' : 'Kartu Berikutnya (Usap Kiri)'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title={language === 'en' ? 'Close' : 'Tutup'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Question (+ image) and Answer (+ image) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Question */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6F3D] block mb-1.5">
              {language === 'en' ? 'Question' : 'Pertanyaan'}
            </span>
            {item.imageQ && (
              <div className="mb-3">
                <AdaptiveFlashcardImage
                  src={item.imageQ}
                  alt="Question visual"
                  title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                  language={language}
                  onEnlarge={() => setLightbox({ isOpen: true, url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                />
              </div>
            )}
            {item.question?.trim() && (
              <div className="clay-card-subtle p-4 sm:p-5 rounded-2xl select-text">
                <BilingualCardText 
                  text={item.question} 
                  type="question" 
                  variant="detail-modal"
                />
              </div>
            )}
          </div>

          {/* Answer */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
              {language === 'en' ? 'Answer' : 'Jawaban'}
            </span>
            {item.imageA && (
              <div className="mb-3">
                <AdaptiveFlashcardImage
                  src={item.imageA}
                  alt="Answer visual"
                  title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                  language={language}
                  onEnlarge={() => setLightbox({ isOpen: true, url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                />
              </div>
            )}
            {item.answer?.trim() && (
              <div className="clay-card-subtle p-4 sm:p-5 rounded-2xl select-text">
                <BilingualCardText 
                  text={item.answer} 
                  type="answer" 
                  variant="detail-modal"
                />
              </div>
            )}
          </div>

          {/* Explanation / Additional Material */}
          {item.explanation && (
            <div className="space-y-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6F3D] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Explanation / Notes' : 'Penjelasan / Rincian Materi'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowExplanation(prev => !prev)}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-[#FF6F3D] clay-card-subtle flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <span>
                    {showExplanation 
                      ? (language === 'en' ? 'Hide' : 'Sembunyikan') 
                      : (language === 'en' ? 'Read Explanation' : 'Buka Penjelasan')}
                  </span>
                  {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showExplanation ? (
                <div className="clay-inset p-4 sm:p-5 rounded-2xl select-text animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 pb-2 mb-2.5 border-b border-black/[0.04] dark:border-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-[#8493AB]">
                    <FileText className="w-3 h-3 text-[#FF6F3D]" />
                    <span>{language === 'en' ? 'Supplemental Details & References' : 'Rincian Penjelasan Tambahan'}</span>
                  </div>
                  <BilingualCardText 
                    text={item.explanation} 
                    type="general" 
                    variant="detail-modal"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExplanation(true)}
                  className="w-full py-2.5 px-3 rounded-2xl clay-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-[#FF6F3D]" />
                  <span>{language === 'en' ? 'Click to open detailed explanation' : 'Klik untuk membaca penjelasan / materi tambahan'}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}
            </div>
          )}

          {/* Voice Note Recorder */}
          <div className="pt-2">
            <AudioRecorderPlayer 
              itemId={item.id}
              itemType="book"
              itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
              language={language} 
              compact={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {!item.isActive && onActivate ? (
              <button
                type="button"
                onClick={onActivate}
                className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>{language === 'en' ? 'Activate Card' : 'Aktifkan Kartu'}</span>
              </button>
            ) : item.isActive && onDeactivate ? (
              <button
                type="button"
                onClick={onDeactivate}
                className="px-4 py-2 rounded-2xl clay-card-subtle text-[#5E6D88] hover:text-rose-600 font-bold text-xs transition-all cursor-pointer"
              >
                <span>{language === 'en' ? 'Deactivate Card' : 'Nonaktifkan Kartu'}</span>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Viewer */}
      <ImageLightboxModal 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.url}
        title={lightbox.title}
        onClose={() => setLightbox({ isOpen: false, url: null, title: '' })}
      />
    </div>
  );
};
