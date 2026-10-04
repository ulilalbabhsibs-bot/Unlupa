import React, { useMemo } from 'react';
import { ClassStudent, ClassGroup, QuranPageItem } from '../../types';
import { useApp, AppContext } from '../../context/AppContext';
import { QuranSpace } from '../quran/QuranSpace';
import { createSampleStudentQuranPages } from '../../data/sampleClasses';
import { isDue } from '../../lib/fsrs';
import { ArrowLeft, UserMinus, Printer, Share2 } from 'lucide-react';
import { TeacherReportPrintView } from './TeacherReportPrintView';

interface StudentQuranViewProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  onClose: () => void;
}

export const StudentQuranView: React.FC<StudentQuranViewProps> = ({ student, classGroup, onClose }) => {
  const parentContext = useApp();

  const studentContext = useMemo(() => {
    const isCurrentUser = student.quranSpaceCode === parentContext.quranSpaceCode;
    
    // Ensure student data has all 604 pages
    let fullPages: QuranPageItem[];
    if (isCurrentUser) {
      fullPages = parentContext.quranPages;
    } else if (student.quranData && student.quranData.length >= 604) {
      fullPages = student.quranData;
    } else if (student.quranData && student.quranData.length > 0) {
      const activeNums = student.quranData.filter(p => p.isActive).map(p => p.pageNumber);
      const dueNums = student.quranData.filter(p => isDue(p.fsrsData.nextReview, p.isActive)).map(p => p.pageNumber);
      fullPages = createSampleStudentQuranPages(activeNums, dueNums);
    } else {
      fullPages = parentContext.quranPages.map(p => ({
        ...p,
        isActive: false,
        status: 'inactive' as const,
        fsrsData: {
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReview: null,
          nextReview: null,
          state: 'new' as const,
        }
      }));
    }

    const activePages = fullPages.filter(p => p.isActive);
    const masteredPages = fullPages.filter(p => p.status === 'mastered_for_now');
    const duePages = activePages.filter(p => isDue(p.fsrsData.nextReview, p.isActive));
    
    const quranStats = {
      total: 604,
      active: activePages.length,
      mastered: masteredPages.length,
      dueToday: duePages.length,
      dueList: duePages,
    };

    return {
      ...parentContext,
      quranPages: fullPages,
      quranStats: quranStats,
      teacherFeedbacks: student.teacherFeedbacks || parentContext.teacherFeedbacks,
      isTeacherMode: true,
      
      // Real Teacher review handler: updates student's memory rating directly!
      reviewQuranPage: (pageNumber: number, rating: 1 | 2 | 3) => {
        parentContext.reviewStudentQuranPage(classGroup.id, student.id, pageNumber, rating);
        return null;
      },
      
      // Teacher can activate new page for student directly during halaqah
      activateQuranPage: (pageNumber: number) => {
        parentContext.activateStudentQuranPage(classGroup.id, student.id, pageNumber);
      },

      // Teacher can deactivate page
      deactivateQuranPage: (pageNumber: number) => {
        parentContext.deactivateStudentQuranPage(classGroup.id, student.id, pageNumber);
      },

      // Teacher can mark page as mapan (>300d)
      bypassQuranPageToMapan: (pageNumber: number) => {
        parentContext.bypassStudentQuranPageMapan(classGroup.id, student.id, pageNumber);
      },

      // Teacher can reset mapan status
      resetQuranPageMapan: (pageNumber: number) => {
        parentContext.resetStudentQuranPageMapan(classGroup.id, student.id, pageNumber);
      }
    };
  }, [parentContext, student, classGroup]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#faf8f5] dark:bg-slate-950 overflow-y-auto">
      {/* Sticky Teacher Navigation Bar */}
      <div className="print:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button 
            onClick={onClose} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Kembali ke Kelas"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Kelas</span>
          </button>
          
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight truncate">
                {student.name}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono font-semibold shrink-0">
                {student.quranSpaceCode || 'SANTRI'}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {classGroup.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const reportData = {
                studentName: student.name,
                studentId: student.quranSpaceCode || student.id,
                className: classGroup.name,
                teacherName: parentContext.userProfile.fullName,
                date: new Date().toISOString()
              };
              const encoded = btoa(encodeURIComponent(JSON.stringify(reportData)));
              const shareUrl = `${window.location.origin}?report=${encoded}`;
              
              if (navigator.share) {
                navigator.share({
                  title: `Rapor: ${student.name}`,
                  text: `Lihat laporan capaian hafalan santri atas nama ${student.name} pada kelas ${classGroup.name} di link berikut:`,
                  url: shareUrl
                }).catch((err) => {
                  if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      alert('Link rapor berhasil disalin! Silakan bagikan (paste) ke WhatsApp wali santri.');
                    });
                  }
                });
              } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  alert('Link rapor berhasil disalin! Silakan bagikan (paste) ke WhatsApp wali santri.');
                });
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            title="Bagikan Link Rapor"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
            title="Cetak Laporan Rapor (PDF)"
          >
            <Printer className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              if (window.confirm(`Keluarkan ${student.name} dari daftar santri kelas ini?`)) {
                parentContext.removeStudentFromClass(classGroup.id, student.id);
                onClose();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title="Keluarkan santri dari daftar kelas ini"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TeacherReportPrintView classGroup={classGroup} student={student} teacher={parentContext.userProfile} />

      {/* Embedded Quran Workspace for this student */}
      <div className="print:hidden p-3 sm:p-6 pb-24 max-w-7xl mx-auto">
        {/* @ts-ignore */}
        <AppContext.Provider value={studentContext}>
          <QuranSpace />
        </AppContext.Provider>
      </div>
    </div>
  );
};
