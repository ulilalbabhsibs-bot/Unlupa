import React, { useMemo } from 'react';
import { ClassStudent, ClassGroup, BookItem } from '../../types';
import { useApp, AppContext } from '../../context/AppContext';
import { PersonalSpace } from '../personal/PersonalSpace';
import { createSampleStudentBookItems } from '../../data/sampleClasses';
import { isDue } from '../../lib/fsrs';
import { ArrowLeft, BookOpen, Clock, Award, CheckCircle2, UserMinus, Printer, Share2 } from 'lucide-react';
import { TeacherReportPrintView } from './TeacherReportPrintView';

interface StudentBookViewProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  onClose: () => void;
}

export const StudentBookView: React.FC<StudentBookViewProps> = ({ student, classGroup, onClose }) => {
  const parentContext = useApp();

  const assignedBookId = classGroup.assignedBookIds?.[0] || parentContext.books[0]?.id || 'book-1';
  const assignedBook = parentContext.books.find(b => b.id === assignedBookId) || parentContext.books[0];

  const studentContext = useMemo(() => {
    const isCurrentUser = student.quranSpaceCode === parentContext.quranSpaceCode || student.id === `std-user-${parentContext.userProfile.id}`;
    
    const classBookId = `class-book-${classGroup.id}-${assignedBookId}`;
    const directClassItems = parentContext.items.filter(i => i.bookId === classBookId);
    const masterItems = parentContext.items.filter(i => i.bookId === assignedBookId);
    
    let dataToMap: BookItem[] = [];
    
    if (isCurrentUser && directClassItems.length > 0) {
      dataToMap = directClassItems;
    } else {
      const liveItems = parentContext.getLiveStudentBookItems(student.id);
      dataToMap = (liveItems && liveItems.length > 0) 
        ? liveItems 
        : (student.bookItemsData && student.bookItemsData.length > 0 ? student.bookItemsData : []);
    }

    const studentMap = new Map<string, BookItem>(
      dataToMap
        .filter(i => i.bookId === classBookId || i.bookId === assignedBookId)
        .map(i => {
          let originalId = i.masterItemId || i.id;
          if (!i.masterItemId && i.id.startsWith('class-item-')) {
            // Fallback for older items before masterItemId was added
            const parts = i.id.split('-');
            if (parts.length >= 5) {
               originalId = parts.slice(4).join('-');
            }
          }
          return [originalId, i];
        })
    );

    const studentItems: BookItem[] = masterItems.map(masterItem => {
      const stdItem = studentMap.get(masterItem.id);
      if (stdItem) {
        return {
          ...masterItem,
          isActive: stdItem.isActive,
          status: stdItem.status,
          fsrsData: stdItem.fsrsData,
          reviewLogs: stdItem.reviewLogs || []
        };
      }
      return {
        ...masterItem,
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
        },
        reviewLogs: []
      };
    });

    const activeItems = studentItems.filter(i => i.isActive);
    const dueItems = activeItems.filter(i => isDue(i.fsrsData.nextReview, i.isActive));
    const totalStability = activeItems.reduce((acc, i) => acc + (i.fsrsData.stability || 0), 0);
    const avgStability = activeItems.length > 0 ? Math.round(totalStability / activeItems.length) : 0;

    const bookStats = {
      totalBooks: parentContext.books.length,
      totalItems: studentItems.length,
      activeItems: activeItems.length,
      dueToday: dueItems.length,
      avgStability,
      dueList: dueItems
    };

    return {
      ...parentContext,
      items: studentItems,
      personalStats: bookStats,
      teacherFeedbacks: student.teacherFeedbacks || parentContext.teacherFeedbacks,
      
      // Teacher real-time review handler: updates student's memory rating directly!
      reviewItem: (itemId: string, rating: 1 | 2 | 3 | 4) => {
        parentContext.reviewStudentBookItem(classGroup.id, student.id, itemId, rating);
      },
      
      // Teacher can activate item for student
      activateItem: (itemId: string) => {
        parentContext.activateStudentBookItem(classGroup.id, student.id, itemId);
      },

      // Teacher can deactivate item for student
      deactivateItem: (itemId: string) => {
        parentContext.deactivateStudentBookItem(classGroup.id, student.id, itemId);
      }
    };
  }, [parentContext, student, classGroup, assignedBookId]);

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
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                Kloning Santri 100%
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {classGroup.name} {assignedBook ? `• Kitab: ${assignedBook.title}` : ''}
            </span>
          </div>
        </div>

        {/* Quick Student Book Stats */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{student.dueTodayCount || 0} Review Hari Ini</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-semibold">{student.activeItemsCount || 0} Kartu Aktif</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <Award className="w-3.5 h-3.5" />
            <span className="font-semibold">Skor Stabilitas {student.averageStability || 0}</span>
          </div>

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

      {/* Embedded Personal Space cloned for this student */}
      <div className="print:hidden p-3 sm:p-6 pb-24 max-w-7xl mx-auto">
        {/* @ts-ignore */}
        <AppContext.Provider value={studentContext}>
          <PersonalSpace 
            initialBookId={assignedBookId}
            isEmbeddedTeacherView={true}
            onExitEmbedded={onClose}
          />
        </AppContext.Provider>
      </div>
    </div>
  );
};
