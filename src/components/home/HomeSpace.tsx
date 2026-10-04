import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { HomeHeroProgressRings } from './HomeHeroProgressRings';
import { WorkloadForecastWaveWidget } from './WorkloadForecastWaveWidget';
import { VisualReviewCalendar } from './VisualReviewCalendar';
import { WeeklyStreakWidget } from './WeeklyStreakWidget';
import { MemoryStabilityPyramidWidget } from './MemoryStabilityPyramidWidget';
import { AccuracyRetentionDialWidget } from './AccuracyRetentionDialWidget';
import { ConsistencyJourneyWidget } from './ConsistencyJourneyWidget';
import { QuranReviewModal } from '../quran/QuranReviewModal';
import { MushafPageViewerModal } from '../quran/MushafPageViewerModal';
import { PersonalReviewModal } from '../personal/PersonalReviewModal';

export const HomeSpace: React.FC = () => {
  const {
    quranPages,
    items,
    language,
    setActiveSpace,
  } = useApp();

  const [quranReviewConfig, setQuranReviewConfig] = useState<{ isOpen: boolean; juzFilter: number | null }>({
    isOpen: false,
    juzFilter: null
  });
  const [isPersonalReviewOpen, setIsPersonalReviewOpen] = useState(false);
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);

  useSwipeGesture(null, {
    disabled: quranReviewConfig.isOpen || isPersonalReviewOpen || previewPageNumber !== null || Boolean(typeof document !== 'undefined' && (document.body.getAttribute('data-annotation-open') === 'true' || document.body.getAttribute('data-image-modal-open') === 'true')),
    onSwipeLeft: () => setActiveSpace('quran'),
    onSwipeRight: () => setActiveSpace('admin'),
    threshold: 50,
    minRatio: 1.25,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-20 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. DUAL PROGRESS DIAGRAMS (AL-QUR'AN & RUANG BUKU) - STATUS MAKRO & PENCAPAIAN */}
      <section className="pt-1 sm:pt-2">
        <HomeHeroProgressRings
          language={language}
          quranPages={quranPages}
          items={items}
          onNavigateQuran={() => setActiveSpace('quran')}
          onNavigateBooks={() => setActiveSpace('personal')}
        />
      </section>

      {/* 2. PRAKIRAAN BEBAN MASA DEPAN (14/30/50/100/365-DAY WORKLOAD FORECAST WAVE) - TEPAT DI ATAS KALENDER */}
      <section>
        <WorkloadForecastWaveWidget />
      </section>

      {/* 3. KALENDER / PREDIKSI MURAJAAH (EKSEKUSI TUGAS HARI INI & JADWAL TERDEKAT) */}
      <section>
        <VisualReviewCalendar
          onOpenQuranReview={(juz) => setQuranReviewConfig({ isOpen: true, juzFilter: juz || null })}
          onOpenPersonalReview={() => setIsPersonalReviewOpen(true)}
          onOpenMushafViewer={(page) => setPreviewPageNumber(page)}
        />
      </section>

      {/* 4. ZONA MOMENTUM & DISIPLIN: ISTIQOMAH MINGGUAN (7 HARI) */}
      <section>
        <WeeklyStreakWidget />
      </section>

      {/* 5. DIAGNOSIS KUALITAS & KEDALAMAN MEMORI FSRS (PIRAMIDA STABILITAS & KUALITAS HASIL) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        <div className="flex flex-col h-full">
          <MemoryStabilityPyramidWidget />
        </div>
        <div className="flex flex-col h-full">
          <AccuracyRetentionDialWidget />
        </div>
      </section>

      {/* 6. ZONA MOMENTUM & DISIPLIN: RIWAYAT KEAKTIFAN & RETENSI KONSISTENSI (70 HARI) */}
      <section>
        <ConsistencyJourneyWidget />
      </section>

      {/* Global Review Modals Triggered from Home */}
      <QuranReviewModal
        isOpen={quranReviewConfig.isOpen}
        onClose={() => setQuranReviewConfig({ isOpen: false, juzFilter: null })}
        juzFilter={quranReviewConfig.juzFilter}
      />

      <MushafPageViewerModal
        isOpen={previewPageNumber !== null}
        onClose={() => setPreviewPageNumber(null)}
        pageNumber={previewPageNumber || 1}
      />

      <PersonalReviewModal
        isOpen={isPersonalReviewOpen}
        onClose={() => setIsPersonalReviewOpen(false)}
      />
    </div>
  );
};
