import React, { useState } from 'react';
import { ClassStudent, ClassGroup, QuranPageItem, QuranFeedbackItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue , getIntervalDays } from '../../lib/fsrs';
import { MushafPageViewerModal } from '../quran/MushafPageViewerModal';

function getNextReviewInfo(nextReviewStr?: string | null, isActive?: boolean): string {
  if (!nextReviewStr || !isActive) {
    return 'Belum dijadwalkan';
  }
  try {
    const target = new Date(nextReviewStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = new Date(target);
    t.setHours(0, 0, 0, 0);
    const diffDays = Math.round((t.getTime() - today.getTime()) / 86400000);
    
    if (diffDays < 0) {
      return `Terlambat ${Math.abs(diffDays)} hari`;
    } else if (diffDays === 0) {
      return 'Hari Ini ⚠️ (Jatuh Tempo)';
    } else if (diffDays === 1) {
      return 'Besok';
    } else {
      return `${diffDays} hari lagi`;
    }
  } catch {
    return 'Telah dijadwalkan';
  }
}

import { 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Send, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  User, 
  Flame, 
  Eye, 
  Brain,
  Award,
  AlertCircle
} from 'lucide-react';

interface StudentDetailModalProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuranSpace?: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  classGroup,
  isOpen,
  onClose,
  onOpenQuranSpace,
}) => {
  const { 
    quranPages, 
    quranSpaceCode, 
    teacherFeedbacks,
    reviewStudentQuranPage, 
    addStudentDailyFeedback, 
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'due' | 'all_pages' | 'feedback'>('due');
  const [dailyNote, setDailyNote] = useState('');
  const [inlineNotes, setInlineNotes] = useState<Record<number, string>>({});
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCurrentUser = student.quranSpaceCode === quranSpaceCode;

  // Derive student's active pages
  // If it's the current user, read live quranPages from AppContext!
  // If another student, read from their quranData or generate fallback.
  const studentActivePages: QuranPageItem[] = isCurrentUser
    ? quranPages.filter(p => p.isActive)
    : (student.quranData || []).filter(p => p.isActive);

  // Due pages for daily tasks
  const studentDuePages = studentActivePages.filter(p => isDue(p.fsrsData.nextReview, p.isActive));

  // Combined feedbacks for display
  const feedbacksList: QuranFeedbackItem[] = isCurrentUser
    ? teacherFeedbacks
    : (student.teacherFeedbacks || []);

  const handleReview = (pageNumber: number, rating: 1 | 2) => {
    const note = inlineNotes[pageNumber]?.trim();
    reviewStudentQuranPage(classGroup.id, student.id, pageNumber, rating, note);

    setActionSuccessMessage(
      rating === 2 
        ? `Halaman ${pageNumber} berhasil dinilai Lancar (Mutqin). Interval memori bertambah.` 
        : `Halaman ${pageNumber} dicatat Perlu Murajaah Ulang.`
    );

    // Clear note for this page
    setInlineNotes(prev => {
      const copy = { ...prev };
      delete copy[pageNumber];
      return copy;
    });

    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyNote.trim()) return;

    addStudentDailyFeedback(classGroup.id, student.id, dailyNote.trim());
    setDailyNote('');
    setActionSuccessMessage('Catatan dan evaluasi guru berhasil dikirim kepada santri.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-[#faf8f5] dark:bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <img 
              src={student.avatarUrl} 
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500/30 shadow-xs"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {student.name}
                </h3>
                {student.quranSpaceCode && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                    Kode: {student.quranSpaceCode}
                  </span>
                )}
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                    Akun Anda (Live Sync)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.email} • Terakhir aktif: <strong className="text-slate-700 dark:text-slate-300">{student.lastActive}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {classGroup.type === 'quran' && onOpenQuranSpace && (
              <button
                onClick={onOpenQuranSpace}
                className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-200 dark:hover:bg-blue-800/80 transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Buka Ruang Quran Santri
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center shrink-0">
          <div className="bg-[#fcfaf7] dark:bg-slate-800/60 p-2.5 rounded-2xl border border-[#ede6db] dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Halaman Aktif
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
              {studentActivePages.length} <span className="text-xs font-normal text-slate-400">/ 604</span>
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block">
              Tugas Harian (Due)
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5 block">
              {studentDuePages.length} <span className="text-xs font-normal text-amber-600/70">halaman</span>
            </span>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
            <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-400 block">
              Stabilitas Memori
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5 block">
              {student.averageStability} <span className="text-xs font-normal text-blue-600/70">Skor</span>
            </span>
          </div>

          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-400 block">
              Status Murajaah
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5 block">
              {studentDuePages.length === 0 ? 'Tuntas' : `${studentDuePages.length} Pending`}
            </span>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 pt-2 shrink-0 gap-3">
          <button
            onClick={() => setActiveTab('due')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'due'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>Tugas Murajaah Hari Ini (Due)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              {studentDuePages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all_pages')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'all_pages'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>Semua Halaman Aktif</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              {studentActivePages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>Catatan & Evaluasi Guru</span>
            {feedbacksList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                {feedbacksList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'due' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Berikut daftar halaman yang dijadwalkan untuk disimak (tasmi') hari ini.
                </p>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {studentDuePages.length} Halaman Pending
                </span>
              </div>

              {studentDuePages.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#faf8f5] dark:bg-slate-800/40 border border-[#ece6d9] dark:border-slate-800 text-center">
                  <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Santri ini telah menyelesaikan seluruh murajaah hari ini!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Tidak ada halaman yang jatuh tempo (due) saat ini. Anda dapat melihat tab "Semua Halaman Aktif" jika ingin menguji halaman lainnya.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentDuePages.map(page => (
                    <div 
                      key={page.pageNumber}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[#f7f4ed] dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center border border-[#ece6d9] dark:border-slate-600 shrink-0">
                            {page.pageNumber}
                          </div>
                          <div className="truncate">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              Hal. {page.pageNumber} (QS. {page.surahNameEn})
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Total review: <span className="font-semibold">{page.fsrsData.reps || 0} kali</span> • Kekuatan interval: <span className="font-semibold">{getIntervalDays(page.fsrsData)} hari</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              Jadwal mendatang: <span className="font-medium text-slate-600 dark:text-slate-300">{getNextReviewInfo(page.fsrsData.nextReview, page.isActive)}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setPreviewPageNumber(page.pageNumber)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mushaf</span>
                        </button>
                      </div>

                      {/* Optional teacher note for this page */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <input
                          type="text"
                          placeholder="Catatan tasmi' (opsional, mis: Makhraj & Tajwid baik)..."
                          value={inlineNotes[page.pageNumber] || ''}
                          onChange={e => setInlineNotes({ ...inlineNotes, [page.pageNumber]: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Review Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReview(page.pageNumber, 1)}
                            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span>Perlu Ulang</span>
                          </button>

                          <button
                            onClick={() => handleReview(page.pageNumber, 2)}
                            className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-[#13382c] hover:bg-[#0e2a21] dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-300" />
                            <span>Lancar (Mutqin)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'all_pages' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Daftar seluruh halaman Al-Qur'an yang telah diaktivasi oleh santri ini.
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total: {studentActivePages.length} Halaman
                </span>
              </div>

              {studentActivePages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada halaman yang diaktivasi oleh santri ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studentActivePages.map(page => {
                    const pageIsDue = isDue(page.fsrsData.nextReview, page.isActive);
                    return (
                      <div 
                        key={page.pageNumber}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#f7f4ed] dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center border border-[#ece6d9] dark:border-slate-600 shrink-0">
                            {page.pageNumber}
                          </div>
                          <div className="truncate">
                            <h6 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              Hal. {page.pageNumber} (QS. {page.surahNameEn})
                            </h6>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Total review: {page.fsrsData.reps || 0} kali • Kekuatan interval: {getIntervalDays(page.fsrsData)} hari
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">
                              Jadwal mendatang: {getNextReviewInfo(page.fsrsData.nextReview, page.isActive)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {pageIsDue ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                              Due
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                              Aman
                            </span>
                          )}

                          <button
                            onClick={() => setPreviewPageNumber(page.pageNumber)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                            title="Lihat Mushaf"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {/* Add Feedback Form */}
              <form onSubmit={handleSendFeedback} className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-slate-800/60 border border-[#ede6db] dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    Beri Catatan & Evaluasi Harian untuk Santri
                  </h5>
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan evaluasi tasmi', makhraj, tajwid, atau motivasi murajaah untuk santri ini..."
                  value={dailyNote}
                  onChange={e => setDailyNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#13382c] hover:bg-[#0e2a21] dark:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Catatan ke Santri</span>
                  </button>
                </div>
              </form>

              {/* Feedback History */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  Riwayat Evaluasi Guru ({feedbacksList.length})
                </h5>

                {feedbacksList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    Belum ada riwayat catatan guru untuk santri ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {feedbacksList.map(item => (
                      <div 
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            {item.teacherName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.date).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {item.pageNumber && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300/40 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 text-[10px] font-bold">
                              Halaman {item.pageNumber}
                            </span>
                            {item.rating && (
                              <span className={`text-[10px] font-bold ${item.rating === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {item.rating === 2 ? '✓ Lancar Mutqin' : '↻ Perlu Murajaah Ulang'}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#faf8f5] dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Terhubung via Kode Ruang Al-Qur'an santri
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Mushaf Page Viewer Modal if teacher wants to inspect the text */}
      {previewPageNumber !== null && (
        <MushafPageViewerModal
          pageNumber={previewPageNumber}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
        />
      )}
    </div>
  );
};
