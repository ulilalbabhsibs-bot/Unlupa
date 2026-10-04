import React, { useState, useEffect } from 'react';
import { getIntervalDays, getNonQuranIntervalDays, predictNonQuranIntervals, isReviewedToday } from '../../lib/fsrs';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { Book, Chapter, BookItem, Language } from '../../types';
import { BookFormModal } from './BookFormModal';
import { ItemFormModal } from './ItemFormModal';
import { PageEditorModal } from './PageEditorModal';
import { PageViewerModal } from './PageViewerModal';
import { FileText } from 'lucide-react';
import { AIImportModal } from './AIImportModal';
import { AIBookBuilderModal } from './AIBookBuilderModal';
import { LibraryModal } from './LibraryModal';
import { PublishModal } from './PublishModal';
import { PersonalReviewModal } from './PersonalReviewModal';
import { ItemPreviewModal } from './ItemPreviewModal';
import { FolderMoveModal } from './FolderMoveModal';
import { ActivityHeatmap } from './ActivityHeatmap';
import { ConfirmModal } from './ConfirmModal';
import { BookInteractionTracker } from './BookInteractionTracker';
import Markdown from 'react-markdown';
import { BookReviewCalendarModal } from './BookReviewCalendarModal';
import { BookReviewForecast7Days } from './BookReviewForecast7Days';
import { GlobalCardSearchModal } from './GlobalCardSearchModal';
import { MemoryMetricGrid } from '../common/MemoryMetricGrid';
import { UnifiedDueCard, DueFilterPill } from '../common/UnifiedDueCard';
import { AudioStorageService } from '../../lib/AudioStorageService';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from '../common/BilingualCardText';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { AdaptiveFlashcardImage } from '../common/AdaptiveFlashcardImage';
import { normalizeBilingualText } from '../../utils/bilingualHelper';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Library, 
  Upload, 
  Download, 
  Play, 
  Eye,
  Mic, 
  EyeOff,
  Power, 
  Trash2, 
  Edit3, Pencil, MoreVertical, 
  ArrowLeft, 
  FolderPlus, 
  Sparkles, 
  Zap,
  Clock, 
  BookOpen, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Share2, 
  Tag, 
  Copy,
  Check,
  CheckCircle2,
  ListOrdered,
  Flame,
  Brain,
  CalendarClock,
  Edit2,
  Image,
  CornerDownRight,
  Layers,
  Search,
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  Folder,
  FolderOpen,
  MoveRight,
  Award,
  X,
  CircleDashed,
  MessageSquare,
  LogOut,
  ShieldCheck,
  CalendarCheck,
  KeyRound,
  LogIn,
  Maximize2,
  HelpCircle,
  Lock
} from 'lucide-react';

export interface PersonalSpaceProps {
  initialBookId?: string | null;
  classBanner?: {
    className: string;
    classCode: string;
    teacherName?: string;
    onLeaveClass?: () => void;
  };
  isEmbeddedTeacherView?: boolean;
  onExitEmbedded?: () => void;
}

export const PersonalSpace: React.FC<PersonalSpaceProps> = ({
  initialBookId,
  classBanner,
  isEmbeddedTeacherView,
  onExitEmbedded
}) => {
  const { 
    books, 
    chapters, 
    items, 
    pages,
    createPage,
    updatePage,
    deletePage,
    personalStats, 
    activateItem, 
    deactivateItem, 
    reviewItem,
    createBook, updateBook, 
    deleteBook, 
    createChapter, 
    updateChapter,
    deleteChapter, 
    createItem, updateItem,
    deleteItem,
    reorderItems,
    importFromJSON,
    publishBookToLibrary,
    language,
    setActiveSpace,
    spaceResetCounter,
    addStudentDailyFeedback,
    teachingClasses,
    joinClassByCode,
    leaveClass,
    myClasses,
    editingClassBookId,
    setEditingClassBookId,
    isFeatureAllowed,
    openUpgradeModal,
    tierConfig,
    userProfile
  } = useApp();

  const handleTriggerNewBook = () => {
    const check = isFeatureAllowed('create_book');
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? `Free tier allows up to ${check.limit} personal books. Upgrade to Unlupa Pro for unlimited modules & books.`
          : `Batas akun Free adalah maksimal ${check.limit} buku pribadi. Upgrade ke Unlupa Pro untuk membuat materi tanpa batas.`
      );
      return;
    }
    setIsNewBookOpen(true);
  };

  const handleTriggerAIBuilder = () => {
    setIsAIBookBuilderOpen(true);
  };

  const handleTriggerAIImport = () => {
    setIsAIImportOpen(true);
  };

  // Active classes only (excluding closed classes)
  const activeTeachingClasses = teachingClasses.filter(c => c.status !== 'closed');
  const activeJoinedClasses = myClasses.filter(c => c.status !== 'closed');
  const activeClassIds = new Set<string>([
    ...activeTeachingClasses.map(c => c.id),
    ...activeJoinedClasses.map(c => c.id)
  ]);

  const assignedBookIds = new Set<string>();
  activeTeachingClasses.forEach(c => {
    c.assignedBookIds?.forEach(id => assignedBookIds.add(id));
  });

  const joinedBookIds = new Set<string>();
  activeJoinedClasses.forEach(c => {
    c.assignedBookIds?.forEach(id => joinedBookIds.add(id));
  });

  const isBookInActiveClass = (b: Book): boolean => {
    // If book has a direct classId, that class must be active
    if (b.classId) {
      return activeClassIds.has(b.classId);
    }
    // If book id starts with class-book-{classId}-...
    if (b.id.startsWith('class-book-')) {
      return Array.from(activeClassIds).some(cid => b.id.startsWith(`class-book-${cid}-`));
    }
    // If book is linked through active joined classes and is readonly
    if (joinedBookIds.has(b.id) && b.isReadonly) {
      return true;
    }
    // If book has category 'class' but has no active class association, it's not active
    return false;
  };

  const [selectedBookId, setSelectedBookId] = useState<string | null>(initialBookId || null);

  useEffect(() => {
    if (editingClassBookId) {
      setSelectedBookId(editingClassBookId);
      setEditingClassBookId(null);
    }
  }, [editingClassBookId, setEditingClassBookId]);

  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
    }
  }, [initialBookId]);

  const selectedBook = books.find(b => b.id === selectedBookId) || null;
  const setSelectedBook = (b: Book | null) => setSelectedBookId(b ? b.id : null);

  useEffect(() => {
    if (spaceResetCounter?.space === 'personal' && spaceResetCounter.count > 0) {
      setSelectedBook(null);
      setSelectedChapter(null);
      setIsLibraryOpen(false);
      setIsReviewOpen(false);
      setPreviewItem(null);
      setIsNewBookOpen(false);
      setIsNewChapterOpen(false);
      setIsNewItemOpen(false);
      setEditingBook(null);
      setEditingItem(null);
      setEditingChapter(null);
      setIsBulkMode(false);
      setSelectedCardIds(new Set());
      setChapterCardSearch('');
      setTocSearch('');
      setMovingItem(null);
      setMovingChapter(null);
      setIsMoveModalOpen(false);
      setActiveMenuId(null);
      setIsBookCalendarOpen(false);
      setCalendarBook(null);
      setCalendarChapterFilter(null);
    }
  }, [spaceResetCounter]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<number | 'all'>(5);
  const [cardPage, setCardPage] = useState<number>(1);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishPreselectedId, setPublishPreselectedId] = useState<string | null>(null);
  const [activeBookTab, setActiveBookTab] = useState<'personal' | 'imported' | 'class'>('personal');
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ text: string, isError: boolean } | null>(null);
  const [classToLeave, setClassToLeave] = useState<string | null>(null);

  const handleJoinClass = async () => {
    const cleanCode = codeInputValue.trim();
    if (!cleanCode) {
      setJoinMessage({ 
        text: language === 'en' ? 'Class code cannot be empty' : 'Kode kelas tidak boleh kosong', 
        isError: true 
      });
      return;
    }
    const res = await joinClassByCode(cleanCode);
    if (res.success) {
      setJoinMessage({ text: res.message, isError: false });
      setTimeout(() => {
        setCodeInputValue('');
        setJoinMessage(null);
        setIsJoinClassModalOpen(false);
      }, 1400);
    } else {
      setJoinMessage({ text: res.message, isError: true });
    }
  };

  const handleConfirmLeaveClass = () => {
    if (!classToLeave) return;
    leaveClass(classToLeave);
    setClassToLeave(null);
  };
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSpecificBookId, setReviewSpecificBookId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BookItem | null>(null);

  // Book Review Calendar Modal state
  const [isBookCalendarOpen, setIsBookCalendarOpen] = useState(false);
  const [calendarBook, setCalendarBook] = useState<Book | null>(null);
  const [calendarChapterFilter, setCalendarChapterFilter] = useState<string | null>(null);

  // Global Card Search Modal state
  const [isGlobalCardSearchOpen, setIsGlobalCardSearchOpen] = useState(false);

  // Dialogs
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [parentChapterIdForNew, setParentChapterIdForNew] = useState<string | null>(null);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [viewingPage, setViewingPage] = useState<any>(null);
  const [isAIImportOpen, setIsAIImportOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingItem, setEditingItem] = useState<BookItem | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [virtualSelectedChapter, setVirtualSelectedChapter] = useState<Chapter | null>(null);

  const selectedChapter = virtualSelectedChapter ? virtualSelectedChapter : (chapters.find(c => c.id === selectedChapterId) || null);
  const setSelectedChapter = (c: Chapter | null) => {
    setSelectedChunkIndex(0);
    setCardPage(1);
    if (c && c.id === '__unassigned__') {
      setVirtualSelectedChapter(c);
      setSelectedChapterId(c.id);
    } else {
      setVirtualSelectedChapter(null);
      setSelectedChapterId(c ? c.id : null);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setSelectedChunkIndex(0);
    setCardPage(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedChapterId, virtualSelectedChapter, selectedBookId]);
  const [chapterFilter, setChapterFilter] = useState<'all' | 'active' | 'due' | 'inactive'>('all');
  const [chapterCardSearch, setChapterCardSearch] = useState('');
  const [tocSearch, setTocSearch] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveChapterId, setTargetMoveChapterId] = useState<string>('');
  const [movingItem, setMovingItem] = useState<BookItem | null>(null);
  const [movingChapter, setMovingChapter] = useState<Chapter | null>(null);
  const [selectedChapterIdForItem, setSelectedChapterIdForItem] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleBulkActivate = () => {
    selectedCardIds.forEach(id => activateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDeactivate = () => {
    selectedCardIds.forEach(id => deactivateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDelete = () => {
    const count = selectedCardIds.size;
    if (count === 0) return;
    setConfirmDialog({
        isOpen: true,
        message: language === 'en' ? `Delete ${count} selected cards?` : `Hapus ${count} kartu yang dipilih?`,
        onConfirm: () => {
          selectedCardIds.forEach(id => deleteItem(id));
          setSelectedCardIds(new Set());
          setIsBulkMode(false);
          setConfirmDialog(null);
        }
      });
  };

  const handleConfirmMove = () => {
    const targetId = targetMoveChapterId === '__unassigned__' ? '' : targetMoveChapterId;
    
    if (movingChapter) {
      if (targetId === movingChapter.id) {
        alert(language === 'en' ? 'Cannot move chapter into itself.' : 'Bab tidak bisa dipindah ke dalam dirinya sendiri.');
        return;
      }
      updateChapter(movingChapter.id, {
        parentId: targetId ? targetId : null
      });
      setMovingChapter(null);
    } else if (movingItem) {
      updateItem(movingItem.id, {
        chapterId: targetId || undefined
      });
      setMovingItem(null);
    } else if (selectedCardIds.size > 0) {
      selectedCardIds.forEach(id => {
        updateItem(id, {
          chapterId: targetId || undefined
        });
      });
      setSelectedCardIds(new Set());
      setIsBulkMode(false);
    }
    setIsMoveModalOpen(false);
    setTargetMoveChapterId('');
  };
    
        const sensors = useSensors(
      useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
      useSensor(TouchSensor, { activationConstraint: { delay: 2000, tolerance: 15 } })
    );
    
    
    
    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      if (!over) return;
      if (active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        let updatedItems = [...items];
        const activeItem = updatedItems[oldIndex];
        const overItem = updatedItems[newIndex];
        
        if (activeItem.chapterId !== overItem.chapterId) {
          updatedItems[oldIndex] = { ...activeItem, chapterId: overItem.chapterId };
        }
        
        updatedItems = arrayMove(updatedItems, oldIndex, newIndex);
        reorderItems(updatedItems);
      }
    };

  const [isAIBookBuilderOpen, setIsAIBookBuilderOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [bookForm, setBookForm] = useState({ title: '', description: '', coverUrl: '', isPublic: false });
  const [chapterForm, setChapterForm] = useState({ title: '', description: '', material: '' });
  const [itemForm, setItemForm] = useState({ question: '', answer: '', tags: '', imageQ: '', imageA: '' });
  const [importJsonText, setImportJsonText] = useState('');
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);

  
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) return;
    const created = createBook(bookForm);
    setBookForm({ title: '', description: '', coverUrl: '', isPublic: false });
    setIsNewBookOpen(false);
    setSelectedBook(created);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !chapterForm.title.trim()) return;
    
    if (editingChapter) {
      updateChapter(editingChapter.id, {
        title: chapterForm.title,
        description: chapterForm.description,
        material: chapterForm.material
      });
    } else {
      createChapter({
        bookId: selectedBook.id,
        title: chapterForm.title,
        description: chapterForm.description,
        material: chapterForm.material,
        parentId: parentChapterIdForNew
      });
    }
    
    setChapterForm({ title: '', description: '', material: '' });
    setIsNewChapterOpen(false);
    setEditingChapter(null);
    setParentChapterIdForNew(null);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !itemForm.question.trim() || !itemForm.answer.trim()) return;
    const tagsArray = itemForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    createItem({
      bookId: selectedBook.id,
      chapterId: selectedChapterIdForItem || undefined,
      question: itemForm.question,
      answer: itemForm.answer,
      tags: tagsArray,
      imageQ: itemForm.imageQ || undefined,
      imageA: itemForm.imageA || undefined,
    });

    setItemForm({ question: '', answer: '', tags: '', imageQ: '', imageA: '' });
    setIsNewItemOpen(false);
  };

  
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importFromJSON(importJsonText);
    if (res.success) {
      setImportMessage({ text: res.message, isError: false });
      setTimeout(() => {
        // setIsImportOpen(false);
        setImportJsonText('');
        setImportMessage(null);
      }, 1500);
    } else {
      setImportMessage({ text: res.message, isError: true });
    }
  };

  const bookChapters = selectedBook ? chapters.filter(c => c.bookId === selectedBook.id) : [];
  const bookItems = selectedBook ? items.filter(i => i.bookId === selectedBook.id) : [];
  const currentChapter = virtualSelectedChapter ? virtualSelectedChapter : (selectedChapterId ? chapters.find(c => c.id === selectedChapterId) : null);

  // Compute all navigable chapters in order (including unassigned general cards if any)
  const unassignedCount = selectedBook ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId)).length : 0;
  const navigableChapters = React.useMemo(() => {
    if (!selectedBook) return [];
    const list = [...bookChapters].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (unassignedCount > 0) {
      list.push({
        id: '__unassigned__',
        bookId: selectedBook.id,
        title: language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)',
        order: 9999
      });
    }
    return list;
  }, [selectedBook, bookChapters, unassignedCount, language]);

  const currentChapterIdx = currentChapter ? navigableChapters.findIndex(c => c.id === currentChapter.id) : -1;
  const prevChapter = currentChapterIdx > 0 ? navigableChapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx >= 0 && currentChapterIdx < navigableChapters.length - 1 ? navigableChapters[currentChapterIdx + 1] : null;

  const isItemDue = (item: BookItem) => {
    if (!item.isActive) return false;
    if (!item.fsrsData.nextReview) return true;
    return new Date(item.fsrsData.nextReview) <= new Date();
  };

  const getChapterBreadcrumbs = (chap: Chapter): Chapter[] => {
    const crumbs: Chapter[] = [];
    let curr: Chapter | undefined = chap;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      crumbs.unshift(curr);
      if (!curr.parentId) break;
      curr = chapters.find(c => c.id === curr!.parentId);
    }
    return crumbs;
  };

  const getChapterDepth = (chap: Chapter): number => {
    let depth = 0;
    let curr: Chapter | undefined = chap;
    const visited = new Set<string>();
    while (curr && curr.parentId && !visited.has(curr.id)) {
      visited.add(curr.id);
      depth++;
      curr = chapters.find(c => c.id === curr!.parentId);
    }
    return depth;
  };

  // Comprehensive swipe navigation support for Personal Space (Previous & Next page navigation across all levels)
  useSwipeGesture(null, {
    disabled: Boolean(
      previewItem ||
      (typeof document !== 'undefined' && (document.body.getAttribute('data-annotation-open') === 'true' || document.body.getAttribute('data-image-modal-open') === 'true')) ||
      isNewBookOpen ||
      isNewChapterOpen ||
      isNewItemOpen ||
      isAIImportOpen ||
      editingBook ||
      editingItem ||
      editingChapter ||
      confirmDialog ||
      isMoveModalOpen ||
      isPublishOpen ||
      isLibraryOpen ||
      isReviewOpen
    ),
    onSwipeRight: () => {
      // 1. If single item preview is open, go to previous item or close preview
      if (previewItem) {
        const cCards = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : bookItems.filter(i => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex(i => i.id === previewItem.id);
        if (pIdx > 0) {
          setPreviewItem(cCards[pIdx - 1]);
        } else {
          setPreviewItem(null);
        }
        return;
      }

      // 2. If inside a chapter: swipe right goes to previous chapter or back to book overview
      if (currentChapter) {
        if (currentChapterIdx > 0) {
          setSelectedChapter(navigableChapters[currentChapterIdx - 1]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else {
          // At first chapter -> back to Book Overview
          setSelectedChapter(null);
        }
        return;
      }

      // 3. If in Book Overview: swipe right goes back to Library
      if (selectedBook) {
        if (isEmbeddedTeacherView && onExitEmbedded) {
          onExitEmbedded();
        } else {
          setSelectedBook(null);
        }
        return;
      }

      // 4. If in Library Root: swipe right goes to Quran space
      setActiveSpace('quran');
    },
    onSwipeLeft: () => {
      // 1. If single item preview is open, go to next item
      if (previewItem) {
        const cCards = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : bookItems.filter(i => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex(i => i.id === previewItem.id);
        if (pIdx >= 0 && pIdx < cCards.length - 1) {
          setPreviewItem(cCards[pIdx + 1]);
        }
        return;
      }

      // 2. If inside a chapter: swipe left goes to next chapter
      if (currentChapter) {
        if (currentChapterIdx >= 0 && currentChapterIdx < navigableChapters.length - 1) {
          setSelectedChapter(navigableChapters[currentChapterIdx + 1]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else if (currentChapterIdx === navigableChapters.length - 1) {
          // Reached end of book's chapters -> go to next book if exists, or teaching space
          const bIdx = books.findIndex(b => b.id === selectedBook?.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace('teaching');
          }
        }
        return;
      }

      // 3. If in Book Overview: swipe left opens the first chapter if available
      if (selectedBook) {
        if (navigableChapters.length > 0) {
          setSelectedChapter(navigableChapters[0]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else {
          const bIdx = books.findIndex(b => b.id === selectedBook.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace('teaching');
          }
        }
        return;
      }

      // 4. If in Library Root: swipe left goes to Teaching space
      setActiveSpace('teaching');
    },
    threshold: 40,
    minRatio: 1.15,
  });


  useEffect(() => {
    if (selectedBook && (selectedBook.category === 'class' || Boolean(selectedBook.classId) || selectedBook.id.startsWith('class-book-'))) {
      if (!isBookInActiveClass(selectedBook)) {
        setSelectedBook(null);
        setSelectedBookId(null);
      }
    }
  }, [selectedBook, activeClassIds]);

  const isCurrentBookReadonly = selectedBook 
    ? (selectedBook.isReadonly || isBookInActiveClass(selectedBook) || (joinedBookIds.has(selectedBook.id) && !assignedBookIds.has(selectedBook.id) && !isEmbeddedTeacherView)) 
    : false;
  return (
    <div className="space-y-5 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* 1. Today's Review & Header Card */}
      {!selectedBook && (
        <div className="space-y-4">
          {/* Header & Search Bar - Clean, Proportional & Consistent with other rooms */}
          <div className="flex items-center justify-between w-full mb-2 gap-2 flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 whitespace-nowrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight shrink-0">
                {language === 'en' ? 'Books Space' : 'Ruang Buku'}
              </h1>
              <span
                className="flex items-center justify-center px-3 h-9 rounded-2xl clay-pill text-[#FF6E65] text-xs font-bold shrink-0"
                title={`${books.length} ${language === 'en' ? 'Books' : 'Kitab'}`}
              >
                {books.length}
              </span>
            </div>
            
            {/* Unified Search Trigger Bar (Opens Global Real-Time Search Modal) */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setIsGlobalCardSearchOpen(true)}
                className="flex items-center gap-2 pl-3 pr-3.5 h-9 rounded-2xl clay-inset text-xs font-semibold text-[#8E9BAE] hover:text-[#1E293B] dark:hover:text-[#F8FAFC] transition-all cursor-pointer group shadow-2xs shrink-0"
                title={language === 'en' ? 'Search books and cards...' : 'Cari buku dan materi kartu...'}
              >
                <Search className="w-3.5 h-3.5 text-[#FF6E65] group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">{language === 'en' ? 'Search books...' : 'Cari buku...'}</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/20 rounded shadow-2xs border border-black/5 dark:border-white/5">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Standard Minimalist Due Card (Primary Daily Review Card at Top) */}
            <UnifiedDueCard
              language={language}
              title={language === 'en' ? 'Daily Review' : 'Kartu Jatuh Tempo'}
              dueCount={personalStats.dueToday}
              totalActiveCount={personalStats.activeItems}
              itemTypeLabel={language === 'en' ? 'cards' : 'kartu'}
              primaryActionLabel={language === 'en' ? `All (${personalStats.dueToday})` : `Semua (${personalStats.dueToday})`}
              pillGridCols="books"
              onStartAll={() => {
                setReviewSpecificBookId(null);
                setIsReviewOpen(true);
              }}
              onOpenCalendar={() => {
                const targetBook = books.find(b => items.some(i => i.bookId === b.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date()))) || books[0];
                if (targetBook) {
                  setCalendarBook(targetBook);
                  setCalendarChapterFilter(null);
                  setIsBookCalendarOpen(true);
                }
              }}
              filterPills={books
                .filter(b => items.some(i => i.bookId === b.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())))
                .map(book => ({
                  id: book.id,
                  label: book.title,
                  count: items.filter(i => i.bookId === book.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())).length,
                  onClick: () => {
                    setReviewSpecificBookId(book.id);
                    setIsReviewOpen(true);
                  }
                }))}
              allCaughtUpTitle={language === 'en' ? 'All personal flashcards reviewed today!' : 'Semua kartu materi telah selesai diulang!'}
            />
            
            {/* 1. Aligned Action Ribbon - 3-Item Segmented Container + Right Plus Icon Button */}
            <div className="flex items-center gap-2 mt-2 mb-1.5 w-full">
              {/* Left: 3-Item Segmented Clay Inset Container (aligned directly above Pribadi | Pustaka | Kelas below) */}
              <div className="flex-1 p-1.5 clay-inset rounded-2xl grid grid-cols-3 gap-1.5">
                {/* 1. Buat Cepat (Format Baku) */}
                <button
                  type="button"
                  onClick={handleTriggerAIBuilder}
                  title={language === 'en' ? 'Quick book and flashcard builder with standard format' : 'Buat kitab & flashcard cepat dengan format baku'}
                  className="h-8 px-2 rounded-xl text-xs font-bold clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 group"
                >
                  <Zap className="w-3.5 h-3.5 text-[#F27A3D] shrink-0 fill-[#F27A3D]/20 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{language === 'en' ? 'Quick Build' : 'Buat Cepat'}</span>
                </button>

                {/* 2. Pustaka Kitab */}
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  title={language === 'en' ? 'Explore public library' : 'Jelajahi perpustakaan kitab umum'}
                  className="h-8 px-2 rounded-xl text-xs font-bold clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 group"
                >
                  <Library className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="truncate">{language === 'en' ? 'Library' : 'Pustaka'}</span>
                </button>

                {/* 3. Publikasi */}
                <button
                  type="button"
                  onClick={() => {
                    setPublishPreselectedId(null);
                    setIsPublishOpen(true);
                  }}
                  title={language === 'en' ? 'Publish and share books' : 'Publikasikan karya ke perpustakaan'}
                  className="h-8 px-2 rounded-xl text-xs font-bold clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 group"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#3B82F6] dark:text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{language === 'en' ? 'Publish' : 'Publikasi'}</span>
                </button>
              </div>

              {/* Right: Plus Icon-Only Button (aligned directly above Key Code Button below) */}
              <button
                type="button"
                onClick={handleTriggerNewBook}
                title={language === 'en' ? 'Create new book manually' : 'Tambah Kitab Baru'}
                className="w-9 h-9 rounded-2xl clay-btn-primary text-white flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-white stroke-[3] shrink-0" />
              </button>
            </div>

            {/* Book Tabs: Segmented Control (Pribadi vs Pustaka vs Kelas) + Sleek Join Class Trigger */}
            <div className="flex items-center gap-2 mt-1.5 mb-3 w-full">
              {/* Clay Inset Segmented Pill Tabs */}
              <div className="flex-1 p-1.5 clay-inset rounded-2xl grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveBookTab('personal')}
                  className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
                    activeBookTab === 'personal' 
                      ? 'clay-pill text-[#FF6E65]' 
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Personal' : 'Pribadi'}</span>
                  <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                    activeBookTab === 'personal'
                      ? 'bg-[#FF6E65] text-white shadow-2xs'
                      : 'bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]'
                  }`}>
                    {books.filter(b => !isBookInActiveClass(b) && !b.isReadonly).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBookTab('imported')}
                  className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
                    activeBookTab === 'imported' 
                      ? 'clay-pill text-[#FF6E65]' 
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Library className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Library' : 'Pustaka'}</span>
                  <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                    activeBookTab === 'imported'
                      ? 'bg-[#FF6E65] text-white shadow-2xs'
                      : 'bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]'
                  }`}>
                    {books.filter(b => !isBookInActiveClass(b) && b.isReadonly).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBookTab('class')}
                  className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
                    activeBookTab === 'class' 
                      ? 'clay-pill text-[#FF6E65]' 
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Classes' : 'Kelas'}</span>
                  <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                    activeBookTab === 'class'
                      ? 'bg-[#FF6E65] text-white shadow-2xs'
                      : 'bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]'
                  }`}>
                    {books.filter(b => isBookInActiveClass(b)).length}
                  </span>
                </button>
              </div>

              {/* Clay Join Class Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveBookTab('class');
                  setIsJoinClassModalOpen(true);
                }}
                className="w-9 h-9 rounded-2xl clay-pill text-[#B45309] dark:text-amber-300 flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer group shadow-2xs"
                title={language === 'en' ? 'Enter class code to join' : 'Masukkan kode kelas untuk bergabung'}
              >
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
              </button>
            </div>

            {/* Books List Grid - Ultra-Compact 3-Column Mobile Layout */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {books
                .filter(b => (b.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                .filter(b => {
                  const isClass = isBookInActiveClass(b);
                  if (activeBookTab === 'personal') return !isClass && !b.isReadonly;
                  if (activeBookTab === 'imported') return !isClass && b.isReadonly;
                  if (activeBookTab === 'class') return isClass;
                  return false;
                })
                .map(book => {
                const bookItemsList = items.filter(i => i.bookId === book.id);
                const activeCount = bookItemsList.filter(i => i.isActive).length;
                const dueCount = bookItemsList.filter(i => i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())).length;

                return (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="clay-card-subtle p-1.5 sm:p-2.5 pb-2 rounded-2xl flex flex-col items-center justify-between hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer group relative select-none"
                  >
                    {/* Top Action Bar: Calendar Icon + Active/Total Count + Due Badge */}
                    <div className="w-full flex items-center justify-between gap-1 mb-1 z-20">
                      {/* Left: Quick Review Calendar Button & Active / Total Count */}
                      <div className="flex items-center gap-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCalendarBook(book);
                            setCalendarChapterFilter(null);
                            setIsBookCalendarOpen(true);
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg clay-pill text-[#FF6F3D] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
                          title={language === 'en' ? `View ${book.title} review calendar` : `Lihat kalender jadwal ${book.title}`}
                        >
                          <CalendarCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                        
                        {/* Compact Active / Total Count */}
                        <span 
                          title={`${activeCount} ${language === 'en' ? 'active' : 'aktif'} / ${bookItemsList.length} total`}
                          className="text-[9px] sm:text-[10px] font-black text-[#64748B] dark:text-[#94A3B8] tracking-tight truncate"
                        >
                          <span className="text-sky-600 dark:text-sky-400">{activeCount}</span>
                          <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
                          <span>{bookItemsList.length}</span>
                        </span>
                      </div>

                      {/* Right: Readonly Tag & Due Count Badge */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {book.isReadonly && (
                          <span className="bg-black/60 backdrop-blur-xs text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.2 rounded">
                            {language === 'en' ? 'Read' : 'Baca'}
                          </span>
                        )}

                        {dueCount > 0 && (
                          <span className="clay-badge-orange text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 shadow-xs flex items-center gap-0.5 rounded-full">
                            <Play className="w-2 h-2 fill-white shrink-0" /> {dueCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Realistic 3D Standing Hardcover Book (Petak / Kotak) - Widened */}
                    <div className="w-full flex justify-center py-0.5">
                      <div className="w-full max-w-[96px] sm:max-w-[115px] md:max-w-[130px] aspect-[1/1.38] rounded-r-[3px] rounded-l-[1px] overflow-hidden shadow-[3px_6px_16px_rgba(0,0,0,0.18)] dark:shadow-[3px_6px_20px_rgba(0,0,0,0.55)] border-l-[3.5px] sm:border-l-[5px] border-l-slate-900/60 relative flex flex-col justify-between transition-transform duration-200 group-hover:scale-[1.03] group-hover:-translate-y-0.5">
                        {/* Lighting reflection & spine ridge overlay */}
                        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/25 to-transparent pointer-events-none z-20" />
                        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none z-20" />

                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          /* Handcrafted Hardcover Cloth/Leather Kitab */
                          <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-1.5 sm:p-2 flex flex-col justify-between text-amber-100 border border-emerald-700/60 relative overflow-hidden select-none">
                            <div className="absolute -right-4 -bottom-4 w-14 h-14 rounded-full border-2 border-amber-400/10 pointer-events-none" />
                            <div className="absolute inset-1 border border-amber-400/30 rounded-none pointer-events-none" />

                            {/* Top ornament */}
                            <div className="relative z-10 pt-0.2 text-center">
                              <div className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-black/40 border border-amber-400/30 text-[6px] font-extrabold uppercase tracking-widest text-amber-300">
                                <BookOpen className="w-1.5 h-1.5 text-amber-400" />
                                <span className="truncate max-w-[45px]">{language === 'en' ? 'Book' : 'Kitab'}</span>
                              </div>
                            </div>

                            {/* Center Title */}
                            <div className="relative z-10 my-auto text-center px-0.5">
                              <h3 
                                title={book.title}
                                className="font-serif font-bold text-[9px] sm:text-[10px] text-amber-50 leading-tight drop-shadow-md line-clamp-2 text-ellipsis tracking-tight"
                              >
                                {book.title}
                              </h3>
                              <div className="w-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto mt-0.5" />
                            </div>

                            {/* Bottom */}
                            <div className="relative z-10 pb-0.2 text-center">
                              <span className="text-[5px] sm:text-[6px] font-semibold text-amber-300/80 tracking-widest uppercase block">
                                {language === 'en' ? 'Manual' : 'Kitab'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bookmark ribbon */}
                        <div className="absolute top-0 right-2 w-1.5 h-3.5 bg-[#FF6F3D] shadow-xs z-20 clip-ribbon pointer-events-none opacity-90 group-hover:opacity-100" />
                      </div>
                    </div>

                    {/* Book Information Area: Only Title with 2-Line Automatic Wrap */}
                    <div className="w-full pt-1.5 flex flex-col items-center justify-center min-w-0">
                      <h4 
                        title={book.title}
                        className="font-extrabold text-[11px] sm:text-xs text-[#18234A] dark:text-[#F8FAFC] line-clamp-2 leading-snug break-words text-center w-full group-hover:text-[#FF6F3D] transition-colors"
                      >
                        {book.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {books.filter(b => {
              const isClass = isBookInActiveClass(b);
              if (activeBookTab === 'personal') return !isClass && !b.isReadonly;
              if (activeBookTab === 'imported') return !isClass && b.isReadonly;
              if (activeBookTab === 'class') return isClass;
              return false;
            }).length === 0 && (
              <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 mt-4">
                <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {language === 'en' ? 'No Books Found' : 'Tidak Ada Buku'}
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  {activeBookTab === 'personal' 
                    ? (language === 'en' ? 'Create a new book to start learning.' : 'Buat buku baru untuk mulai belajar.')
                    : activeBookTab === 'imported'
                    ? (language === 'en' ? 'Import a book from the library.' : 'Impor buku dari perpustakaan.')
                    : (language === 'en' ? 'You have not joined any classes yet. Enter your teacher\'s code to join.' : 'Anda belum bergabung dengan kelas manapun. Masukkan kode dari pengajar Anda untuk bergabung.')}
                </p>
                {activeBookTab === 'personal' && (
                  <button
                    type="button"
                    onClick={() => setIsNewBookOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'en' ? 'Create New Book' : 'Buat Buku Baru'}</span>
                  </button>
                )}
                {activeBookTab === 'class' && (
                  <button
                    type="button"
                    onClick={() => setIsJoinClassModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{language === 'en' ? 'Enter Class Code' : 'Masukkan Kode Kelas'}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* 2. Book Level: Buku Induk & Hierarki Bab (Ketika Buku dipilih, belum memilih bab) */}
      {selectedBook && !currentChapter && (
        <div className="space-y-6">
          {/* Top Bar: Back button, Title & Book Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { 
                  if (isEmbeddedTeacherView && onExitEmbedded) {
                    onExitEmbedded();
                  } else {
                    setSelectedBook(null); 
                    setSelectedChapter(null); 
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full clay-pill text-[#652B09] dark:text-[#FDE68A] text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#EA580C] dark:text-[#FB923C]" />
                <span>{language === 'en' ? 'Back to Library' : 'Kembali ke Koleksi'}</span>
              </button>

              {teachingClasses.some(c => c.assignedBookIds?.includes(selectedBook.id) && c.teacherId === userProfile.id) && (
                <button
                  type="button"
                  onClick={() => setActiveSpace('teaching')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-pill text-[#FF6F3D] text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                  title={language === 'en' ? 'Return to Teaching Space' : 'Kembali ke Ruang Mengajar'}
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#FF6F3D]" />
                  <span>{language === 'en' ? 'Back to Teaching' : 'Ke Ruang Mengajar'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isCurrentBookReadonly && (
                <>
                  <button
                    onClick={() => setEditingBook(selectedBook)}
                    className="px-2.5 py-1.5 rounded-full clay-pill text-[#652B09] dark:text-[#FDE68A] hover:scale-105 active:scale-95 text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                    title="Edit Book"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8A5A35] dark:text-[#CBB5A1]" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Edit Book' : 'Edit Buku'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPublishPreselectedId(selectedBook.id);
                      setIsPublishOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-full clay-pill text-[#652B09] dark:text-[#FDE68A] hover:scale-105 active:scale-95 text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                    title={language === 'en' ? 'Publish to Library' : 'Publikasikan ke Perpustakaan'}
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#8A5A35] dark:text-[#CBB5A1]" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Publish' : 'Publikasi'}</span>
                  </button>
                </>
              )}
              {!classBanner && !isCurrentBookReadonly && (
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      message: language === 'en' ? 'Are you sure you want to delete this book?' : 'Hapus buku ini beserta seluruh isinya?',
                      onConfirm: () => {
                        deleteBook(selectedBook.id);
                        setSelectedBook(null);
                        setSelectedChapter(null);
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  className="p-1.5 rounded-full clay-pill text-rose-600 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                  title="Delete Book"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              )}

            </div>

          </div>

          {/* Master Book Presentation - Authentic 3D Book Cover & Two Learning Progress Metrics */}
          {(() => {
            const totalCards = bookItems.length;
            const activeBookCards = bookItems.filter(i => i.isActive);
            const dueBookCards = bookItems.filter(i => isItemDue(i));
            const masteredCards = activeBookCards.filter(i => getNonQuranIntervalDays(i.fsrsData) >= 300);

            // Ukuran 1: Persentase kartu diaktifkan dari total kartu pada buku
            const activationPct = totalCards > 0 ? Math.round((activeBookCards.length / totalCards) * 100) : 0;

            // Ukuran 2: Kemajuan belajar (persentase kartu yang mencapai interval >300 hari)
            const masteryPct = totalCards > 0 ? Math.round((masteredCards.length / totalCards) * 100) : 0;
            const masteryFromActivePct = activeBookCards.length > 0 ? Math.round((masteredCards.length / activeBookCards.length) * 100) : 0;
            const joinedClass = myClasses.find(c => c.assignedBookIds?.includes(selectedBook.id));

            return (
              <div className="clay-card p-4 sm:p-5 relative overflow-hidden flex flex-col gap-3.5">
                {/* Embedded Class Integration Bar for Enrolled Students */}
                {joinedClass && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.03] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        Kelas: {joinedClass.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F27A3D]/15 text-[10px] font-mono font-bold text-[#F27A3D]">
                        {joinedClass.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white text-[10px] font-bold">
                        Terhubung Pengajar
                      </span>
                      {joinedClass.teacherName && (
                        <span className="text-xs text-[#687086] dark:text-[#94A3B8] font-medium">
                          • Pengajar: <strong className="text-[#18234A] dark:text-[#F8FAFC]">{joinedClass.teacherName}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClassToLeave(joinedClass.id);
                        setConfirmDialog({
                          isOpen: true,
                          message: language === 'en' ? 'Are you sure you want to leave this class?' : 'Yakin ingin keluar dari kelas ini?',
                          onConfirm: () => {
                            leaveClass(joinedClass.id);
                            setSelectedBook(null);
                          }
                        });
                      }}
                      className="px-3 py-1.5 rounded-full clay-pill text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs self-start sm:self-auto hover:scale-105 active:scale-95"
                      title={language === 'en' ? 'Leave this class' : 'Keluar dari kelas ini'}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Leave Class' : 'Keluar Kelas'}</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-row gap-4 sm:gap-5 items-center">
                  {/* Compact 3D Book Cover Object */}
                  <div className="shrink-0 relative group">
                    <div className="w-20 sm:w-24 md:w-28 aspect-[1/1.38] rounded-r-[3px] rounded-l-[1px] overflow-hidden shadow-lg shadow-black/20 dark:shadow-black/60 border-l-[5px] border-l-slate-900/50 relative flex flex-col justify-between transition-transform duration-200 group-hover:-translate-y-0.5">
                      {/* Lighting reflection & spine ridge overlay */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                      {selectedBook.coverUrl ? (
                        <img
                          src={selectedBook.coverUrl}
                          alt={selectedBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        /* Handcrafted Hardcover Cloth/Leather Kitab */
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-2 sm:p-2.5 flex flex-col justify-between text-amber-100 border border-emerald-700/60 relative overflow-hidden select-none">
                          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full border-4 border-amber-400/10 pointer-events-none" />
                          <div className="absolute inset-1.5 border border-amber-400/30 rounded-xs pointer-events-none" />

                          {/* Top ornament */}
                          <div className="relative z-10 pt-0.5 text-center">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-amber-400/30 text-[7px] font-extrabold uppercase tracking-widest text-amber-300">
                              <BookOpen className="w-2 h-2 text-amber-400" />
                              <span className="truncate max-w-[70px]">{language === 'en' ? 'Book' : 'Kitab'}</span>
                            </div>
                          </div>

                          {/* Center Title */}
                          <div className="relative z-10 my-auto text-center px-1">
                            <h3 
                              title={selectedBook.title}
                              className="font-serif font-bold text-[11px] sm:text-xs text-amber-50 leading-snug drop-shadow-md truncate whitespace-nowrap overflow-hidden text-ellipsis block tracking-wide"
                            >
                              {selectedBook.title}
                            </h3>
                            <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto mt-1" />
                          </div>

                          {/* Bottom */}
                          <div className="relative z-10 pb-0.5 text-center">
                            <span className="text-[6px] font-semibold text-amber-300/80 tracking-widest uppercase block">
                              {language === 'en' ? 'Manual' : 'Kitab'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bookmark ribbon */}
                      <div className="absolute bottom-0 right-2.5 w-2.5 h-4 bg-rose-600 shadow-sm transform translate-y-1.5 z-10" />

                      {/* Readonly Badge on Cover */}
                      { (isCurrentBookReadonly) && (
                        <div className="absolute top-1.5 right-1.5 z-30 bg-black/75 backdrop-blur-xs text-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs border border-amber-400/40">
                          {language === 'en' ? 'Read-only' : 'Hanya Baca'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Metadata & Compact Progress Bar beside Cover */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h1 
                          title={selectedBook.title}
                          className="text-lg sm:text-xl font-bold text-[#18234A] dark:text-[#F8FAFC] leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis block"
                        >
                          {selectedBook.title}
                        </h1>
                        { (isCurrentBookReadonly) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-[#F27A3D] shrink-0" />
                            <span>{language === 'en' ? 'Read-only' : 'Hanya Baca'}</span>
                          </span>
                        )}
                      </div>
                      {selectedBook.description && (
                        <p className="text-xs text-[#687086] dark:text-[#94A3B8] font-medium mt-1 line-clamp-1 leading-relaxed">
                          {selectedBook.description}
                        </p>
                      )}
                    </div>

                    {/* Single Straight Progress Line (Active & Mapan) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-[#8C5E3C] dark:text-[#E2D2C3] flex-wrap gap-x-3 gap-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {language === 'en' ? 'Active' : 'Aktif'}: {activeBookCards.length}/{totalCards} ({activationPct}%)
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            {language === 'en' ? 'Mastered' : 'Mapan'}: {masteredCards.length}/{totalCards} ({masteryPct}%)
                          </span>
                        </div>
                        {dueBookCards.length > 0 && (
                          <span className="text-[#EA580C] dark:text-[#FB923C] font-black text-[10px]">
                            {dueBookCards.length} {language === 'en' ? 'due today' : 'perlu review'}
                          </span>
                        )}
                      </div>

                      {/* Single segmented straight bar in tactile clay inset */}
                      <div className="w-full h-3 rounded-full clay-inset overflow-hidden flex p-0.5">
                        {/* Mastered portion (amber) */}
                        <div
                          style={{ width: `${totalCards > 0 ? (masteredCards.length / totalCards) * 100 : 0}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full transition-all duration-500 shrink-0 shadow-xs"
                          title={`Mapan: ${masteredCards.length}`}
                        />
                        {/* Active non-mastered portion (emerald) */}
                        <div
                          style={{ width: `${totalCards > 0 ? (Math.max(0, activeBookCards.length - masteredCards.length) / totalCards) * 100 : 0}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-r-full transition-all duration-500 shrink-0 shadow-xs"
                          title={`Aktif: ${activeBookCards.length}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pelacakan Frekuensi Interaksi & Ketepatan Tugas (Tepat di Halaman Awal Kitab, di Atas Daftar Isi) */}
          <BookInteractionTracker
            book={selectedBook}
            items={bookItems}
            chapters={bookChapters}
            language={language}
            dueCount={bookItems.filter(i => isItemDue(i)).length}
            onStartReview={() => {
              setReviewSpecificBookId(selectedBook.id);
              setIsReviewOpen(true);
            }}
            onSelectCard={(item) => setPreviewItem(item)}
          />
          
          {/* Prakiraan Beban Review 7 Hari ke Depan (7-Day Review Horizon Forecast) */}
          <BookReviewForecast7Days
            book={selectedBook}
            items={bookItems}
            language={language}
            onOpenCalendarOnDate={(dateStr) => {
              setCalendarBook(selectedBook);
              setCalendarChapterFilter(null);
              setIsBookCalendarOpen(true);
            }}
          />

          {/* Daftar Isi Kitab (Table of Contents - Professional, Compact, Breathable) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0 shadow-xs">
                  <ListOrdered className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#451E08] dark:text-[#FDE68A] clay-title">
                    {language === 'en' ? 'Table of Contents' : 'Daftar Isi Kitab'}
                  </h2>
                </div>
              </div>

              {/* Table of Contents Search & Quick Add */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C5E3C] dark:text-[#CBB5A1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search TOC...' : 'Cari bab / sub-bab...'}
                    value={tocSearch}
                    onChange={(e) => setTocSearch(e.target.value)}
                    className="w-44 sm:w-56 pl-8 pr-7 py-1.5 rounded-full clay-inset text-xs font-medium text-[#451E08] dark:text-[#FDE68A] placeholder-[#8C5E3C]/60 focus:outline-none shadow-xs"
                  />
                  {tocSearch && (
                    <button
                      onClick={() => setTocSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C5E3C] hover:text-[#451E08]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {!isCurrentBookReadonly && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChapterIdForItem('');
                        handleTriggerAIImport();
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-full clay-pill text-[#B45309] dark:text-amber-300 hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                      title={language === 'en' ? 'Quick Q&A import with standard format' : 'Impor flashcard cepat dengan format baku'}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                      <span className="hidden xs:inline">{language === 'en' ? 'Quick Import' : 'Format Cepat'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setParentChapterIdForNew(null); setIsNewChapterOpen(true); }}
                      className="px-3.5 py-1.5 rounded-full clay-btn-gold text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{language === 'en' ? 'Add Chapter' : 'Tambah Bab'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {bookChapters.length === 0 && bookItems.length === 0 ? (
              <div className="clay-card p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl clay-icon-pod-gold mx-auto flex items-center justify-center shadow-xs">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-[#451E08] dark:text-[#FDE68A] text-sm clay-title">
                  {language === 'en' ? 'This book is empty' : 'Buku ini masih kosong'}
                </h3>
                <p className="text-xs text-[#8C5E3C] dark:text-[#E2D2C3] max-w-sm mx-auto mt-1 mb-4 font-medium">
                  {language === 'en' ? 'Create chapters and flashcards to begin learning.' : 'Tambahkan bab dan kartu pertanyaan-jawaban untuk mulai belajar.'}
                </p>
                {!isCurrentBookReadonly ? (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedChapterIdForItem('');
                        handleTriggerAIImport();
                      }}
                      className="px-3.5 py-1.5 rounded-full clay-pill text-[#B45309] dark:text-amber-300 text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95"
                      title={language === 'en' ? 'Quick Q&A import with standard format' : 'Impor flashcard cepat dengan format baku'}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                      {language === 'en' ? 'Quick Import' : 'Format Cepat'}
                    </button>
                    <button
                      onClick={() => { setParentChapterIdForNew(null); setIsNewChapterOpen(true); }}
                      className="px-3.5 py-1.5 rounded-full clay-btn-gold text-white text-xs font-black cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                    >
                      {language === 'en' ? 'Add First Chapter' : 'Tambah Bab Pertama'}
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-pill text-[#8C5E3C] dark:text-[#E2D2C3] text-xs font-bold shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'en' ? 'Authentic Protected Material' : 'Materi Otentik Terkunci oleh Pengajar'}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Table of Contents Container */}
            <div className="clay-card p-2.5 sm:p-3 pb-12 shadow-xs space-y-1.5">
              {(() => {
                const renderChapterHierarchyTree = (parentId: string | null = null, depth = 0, parentIdxPrefix = ''): React.ReactNode[] => {
                  let chaptersInLevel = bookChapters.filter(c => (c.parentId || null) === parentId);

                  if (tocSearch.trim()) {
                    const q = tocSearch.toLowerCase();
                    // Keep chapter if it or any descendant matches
                    const matchesOrHasMatchingDescendants = (ch: Chapter): boolean => {
                      if ((ch.title || '').toLowerCase().includes(q) || (ch.description || '').toLowerCase().includes(q)) return true;
                      const children = bookChapters.filter(c => c.parentId === ch.id);
                      return children.some(matchesOrHasMatchingDescendants);
                    };
                    chaptersInLevel = chaptersInLevel.filter(matchesOrHasMatchingDescendants);
                  }

                  return chaptersInLevel.map((chapter, idx) => {
                    const directItems = bookItems.filter(i => i.chapterId === chapter.id);
                    const childChapters = bookChapters.filter(c => c.parentId === chapter.id);
                    const dueCount = directItems.filter(i => isItemDue(i)).length;
                    const currentIdxStr = parentIdxPrefix ? `${parentIdxPrefix}.${idx + 1}` : `${idx + 1}`;
                    const isExpanded = expandedChapters.has(chapter.id); // default collapsed (closed)
                    const isNearBottom = idx >= Math.max(0, chaptersInLevel.length - 2) || (depth > 0 && idx >= Math.max(0, chaptersInLevel.length - 1));

                    return (
                      <div key={chapter.id} className="space-y-1">
                        <div
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setChapterFilter('all');
                            setChapterCardSearch('');
                          }}
                          className={`group transition-all cursor-pointer select-none rounded-2xl ${
                            depth === 0
                              ? 'py-2.5 px-3 sm:px-3.5 clay-card-subtle hover:scale-[1.01] active:scale-[0.99] shadow-xs'
                              : depth === 1
                              ? 'ml-3 sm:ml-6 py-2 px-2.5 sm:px-3 clay-pill hover:scale-[1.01] active:scale-[0.99] shadow-xs'
                              : 'ml-6 sm:ml-10 py-1.5 px-2 sm:px-2.5 clay-inset'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            {/* Left: Folder Toggle & Chapter Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {childChapters.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedChapters(prev => {
                                      const next = new Set(prev);
                                      if (next.has(chapter.id)) {
                                        next.delete(chapter.id);
                                      } else {
                                        next.add(chapter.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="p-1 rounded-lg clay-pill text-[#B45309] hover:scale-105 active:scale-95 transition-all shrink-0"
                                  title={isExpanded ? 'Collapse subchapters' : 'Expand subchapters'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#F27A3D]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-[#687086]" />
                                  )}
                                </button>
                              ) : depth > 0 ? (
                                <CornerDownRight className="w-3 h-3 text-[#687086] dark:text-[#94A3B8] shrink-0 ml-1" />
                              ) : (
                                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-[#F27A3D] shadow-xs" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                <h3 className={`font-bold text-[#18234A] dark:text-[#F8FAFC] truncate group-hover:text-[#F27A3D] transition-colors ${
                                  depth === 0 ? 'text-xs sm:text-sm' : 'text-xs'
                                }`}>
                                  {chapter.title}
                                </h3>

                                {chapter.description && (
                                  <span className="text-[11px] text-[#687086] dark:text-[#94A3B8] truncate hidden md:inline font-medium">
                                    — {chapter.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Status, Quick Subbab & Kebab Menu */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              {/* Subchapters Count Badge */}
                              {childChapters.length > 0 && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 clay-pill px-2 py-0.5 shadow-2xs">
                                  {childChapters.length} {language === 'en' ? 'subch.' : 'subbab'}
                                </span>
                              )}

                              {/* Total Direct Cards */}
                              <span className="text-[10px] font-bold text-[#687086] dark:text-[#94A3B8] clay-pill px-2.5 py-0.5 shadow-2xs hidden xs:inline">
                                {directItems.length} {language === 'en' ? 'cards' : 'kartu'}
                              </span>

                              {/* Review Task Button (Direct Jump to Chapter Due Review) */}
                              {dueCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChapter(chapter);
                                    setChapterFilter('due');
                                    setChapterCardSearch('');
                                  }}
                                  className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white font-black text-[10px] flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs"
                                  title={language === 'en' ? `${dueCount} cards due for review in this chapter` : `${dueCount} kartu perlu direview di bab ini`}
                                >
                                  <Clock className="w-3 h-3 text-white" />
                                  <span>{dueCount}</span>
                                </button>
                              )}

                              {/* Quick Add Subchapter Button (for depth < 2) */}
                              {!isCurrentBookReadonly && depth < 2 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setParentChapterIdForNew(chapter.id);
                                    setEditingChapter(null);
                                    setChapterForm({ title: '', description: '', material: '' });
                                    setIsNewChapterOpen(true);
                                  }}
                                  className="h-7 px-2 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/50 transition-colors hidden sm:flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  title={language === 'en' ? 'Add subchapter to this chapter' : 'Tambah subbab di dalam bab ini'}
                                >
                                  <FolderPlus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>+ Subbab</span>
                                </button>
                              )}

                              {/* Three-Dots Menu (Kebab) with 36px touch target */}
                              {!isCurrentBookReadonly && (
                                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveMenuId(activeMenuId === `chap-${chapter.id}` ? null : `chap-${chapter.id}`)}
                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Pilihan"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {activeMenuId === `chap-${chapter.id}` && (
                                    <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs`}>
                                      {depth < 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setParentChapterIdForNew(chapter.id);
                                            setEditingChapter(null);
                                            setChapterForm({ title: '', description: '', material: '' });
                                            setIsNewChapterOpen(true);
                                          }}
                                          className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                        >
                                          <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>{language === 'en' ? 'Add Subchapter' : 'Tambah Subbab'}</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setEditingChapter(chapter);
                                          setChapterForm({ title: chapter.title, description: chapter.description || '', material: chapter.material || '' });
                                          setIsNewChapterOpen(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{language === 'en' ? 'Edit Chapter' : 'Edit Bab'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            message: language === 'en' ? 'Delete this chapter and all its subchapters?' : 'Yakin ingin menghapus bab ini beserta sub-bab dan kartunya?',
                                            onConfirm: () => {
                                              deleteChapter(chapter.id);
                                              setConfirmDialog(null);
                                            }
                                          });
                                        }}
                                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Delete Chapter' : 'Hapus Bab'}</span>
                                      </button>

                                    </div>
                                  )}

                                </div>
                              )}

                              {/* Buka Bab Arrow Button */}
                              <div className="p-1 rounded-md text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </div>

                            </div>

                          </div>

                        </div>

                        {/* Recursively render children if expanded */}
                        {childChapters.length > 0 && isExpanded && (
                          <div className="space-y-1">
                            {renderChapterHierarchyTree(chapter.id, depth + 1, currentIdxStr)}

                          </div>
                        )}

                      </div>
                    );
                  });
                };

                return renderChapterHierarchyTree(null, 0);
              })()}

              {/* Unassigned items box (if any) */}
              {(() => {
                const unassignedItems = bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId));
                if (unassignedItems.length === 0) return null;


  return (
                  <div
                    onClick={() => {
                      setSelectedChapter({
                        id: '__unassigned__',
                        bookId: selectedBook.id,
                        title: language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)',
                        order: 999
                      });
                      setChapterFilter('all');
                      setChapterCardSearch('');
                    }}
                    className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                          {language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)'}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {language === 'en' 
                            ? `${unassignedItems.length} cards not organized into a chapter` 
                            : `${unassignedItems.length} kartu di luar bab`}
                        </p>

                      </div>

                    </div>
                    {!isCurrentBookReadonly && (
                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === 'unassigned-menu' ? null : 'unassigned-menu')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                          title="Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === 'unassigned-menu' && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setConfirmDialog({
                                  isOpen: true,
                                  message: language === 'en' ? 'Delete all cards in this category?' : 'Hapus semua kartu di kategori ini?',
                                  onConfirm: () => {
                                    unassignedItems.forEach(i => deleteItem(i.id));
                                    setConfirmDialog(null);
                                    if (currentChapter?.id === '__unassigned__') {
                                      setSelectedChapter(null);
                                    }
                                  }
                                });
                              }}
                              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Delete All Cards' : 'Hapus Semua Kartu'}</span>
                            </button>

                          </div>
                        )}

                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-indigo-600">
                      <span className="text-[11px] font-semibold">{language === 'en' ? 'Open Cards' : 'Buka'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />

                    </div>

                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

      {/* 3. Chapter View: Halaman Khusus Bab & Item-Item Kartu (Seperti Halaman Juz Al-Qur'an) */}
      {selectedBook && currentChapter && (
        <div className="space-y-6">
          {/* Chapter Page Navigation & Breadcrumbs - Sleek Single Row */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
            {/* Left: Back button + Breadcrumb */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button
                onClick={() => setSelectedChapter(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title={language === 'en' ? 'Back to Book' : 'Kembali ke Buku Induk'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'en' ? 'Back' : 'Buku'}</span>
              </button>

              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1 text-xs text-slate-500 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                <span 
                  onClick={() => setSelectedChapter(null)}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-medium truncate max-w-[120px] sm:max-w-[180px]"
                  title={selectedBook.title}
                >
                  {selectedBook.title}
                </span>
                <span className="text-slate-300 dark:text-slate-600 shrink-0">/</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[220px]" dir="auto">
                  {currentChapter.title}
                </span>
              </div>
            </div>

            {/* Right: Stepper (if >1) + Calendar + Edit + Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              {navigableChapters.length > 1 && (
                <div className="hidden md:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <button
                    disabled={!prevChapter}
                    onClick={() => {
                      if (prevChapter) {
                        setSelectedChapter(prevChapter);
                        setChapterFilter('all');
                        setChapterCardSearch('');
                      }
                    }}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title={prevChapter ? (language === 'en' ? `Previous: ${prevChapter.title}` : `Sebelumnya: ${prevChapter.title}`) : undefined}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1.5 select-none whitespace-nowrap">
                    {currentChapterIdx + 1} / {navigableChapters.length}
                  </span>
                  <button
                    disabled={!nextChapter}
                    onClick={() => {
                      if (nextChapter) {
                        setSelectedChapter(nextChapter);
                        setChapterFilter('all');
                        setChapterCardSearch('');
                      }
                    }}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title={nextChapter ? (language === 'en' ? `Next: ${nextChapter.title}` : `Berikutnya: ${nextChapter.title}`) : undefined}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chapter Review Calendar Button */}
              <button
                type="button"
                onClick={() => {
                  setCalendarBook(selectedBook);
                  setCalendarChapterFilter(currentChapter.id === '__unassigned__' ? 'unassigned' : currentChapter.id);
                  setIsBookCalendarOpen(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Chapter Schedule Calendar' : 'Kalender Jadwal Bab'}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Calendar' : 'Kalender'}</span>
              </button>

              {!isCurrentBookReadonly && currentChapter.id !== '__unassigned__' && (
                <>
                  <button
                    onClick={() => {
                      setEditingChapter(currentChapter);
                      setChapterForm({ title: currentChapter.title, description: currentChapter.description || '', material: currentChapter.material || '' });
                      setIsNewChapterOpen(true);
                    }}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title={language === 'en' ? 'Edit Chapter' : 'Edit Bab'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{language === 'en' ? 'Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        message: language === 'en' ? 'Are you sure you want to delete this chapter?' : 'Hapus bab ini beserta isinya?',
                        onConfirm: () => {
                          deleteChapter(currentChapter.id);
                          setSelectedChapter(null);
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
                    title={language === 'en' ? 'Delete Chapter' : 'Hapus Bab'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {!isCurrentBookReadonly && currentChapter.id === '__unassigned__' && (
                <button
                  onClick={() => {
                    const unassignedItems = bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId));
                    if (unassignedItems.length === 0) return;
                    setConfirmDialog({
                      isOpen: true,
                      message: language === 'en' ? 'Delete all cards in this category?' : 'Hapus semua kartu di kategori ini?',
                      onConfirm: () => {
                        unassignedItems.forEach(i => deleteItem(i.id));
                        setConfirmDialog(null);
                        setSelectedChapter(null);
                      }
                    });
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title={language === 'en' ? 'Delete All Cards' : 'Hapus Semua Kartu'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Chapter Hero Card (Like Quran Juz Hero Card) */}
          {(() => {
            const chapterCards = currentChapter.id === '__unassigned__'
              ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
              : bookItems.filter(i => i.chapterId === currentChapter.id);
            const chapterPages = currentChapter.id === '__unassigned__'
              ? pages.filter(p => p.bookId === selectedBook!.id && (!p.chapterId || !bookChapters.some(c => c.id === p.chapterId)))
              : pages.filter(p => p.bookId === selectedBook!.id && p.chapterId === currentChapter.id);
            const activeCards = chapterCards.filter(i => i.isActive);
            const dueCards = chapterCards.filter(i => isItemDue(i));
            const masteredCards = chapterCards.filter(i => i.fsrsData.stability >= 74.5);
            const childChapters = currentChapter.id !== '__unassigned__' 
              ? bookChapters.filter(c => c.parentId === currentChapter.id) 
              : [];
            const depth = currentChapter.id !== '__unassigned__' ? getChapterDepth(currentChapter) : 0;

            const filteredCards = chapterCards.filter(card => {
              if (chapterFilter === 'active' && !card.isActive) return false;
              if (chapterFilter === 'inactive' && card.isActive) return false;
              if (chapterFilter === 'due') {
                const isDue = isItemDue(card);
                const isReviewedToday = card.fsrsData.lastReview && new Date(card.fsrsData.lastReview).toDateString() === new Date().toDateString();
                if (!isDue && !isReviewedToday) return false;
              }
              if (chapterCardSearch.trim()) {
                const q = chapterCardSearch.toLowerCase();
                const matchQ = (card.question || '').toLowerCase().includes(q);
                const matchA = (card.answer || '').toLowerCase().includes(q);
                const matchT = (card.tags || []).some(t => (t || '').toLowerCase().includes(q));
                if (!matchQ && !matchA && !matchT) return false;
              }
              return true;
            });

            const chunkSize = 5;
            const totalChunks = Math.ceil(filteredCards.length / chunkSize);
            const safeChunkIndex = Math.min(Math.max(0, selectedChunkIndex), Math.max(0, totalChunks - 1));
            const paginatedCards = filteredCards.slice(
              safeChunkIndex * chunkSize,
              (safeChunkIndex + 1) * chunkSize
            );

            const renderRangeBar = () => {
              if (filteredCards.length === 0 || totalChunks <= 1) return null;
              return (
                <div className="flex items-center justify-between gap-2 py-2 px-3 sm:px-3.5 rounded-2xl clay-card-subtle text-xs w-full shadow-2xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-[#687086] dark:text-[#94A3B8] shrink-0 mr-1">
                      {language === 'en' ? 'Range:' : 'Navigasi Kartu:'}
                    </span>
                    {Array.from({ length: totalChunks }).map((_, idx) => {
                      const start = idx * chunkSize + 1;
                      const end = Math.min(filteredCards.length, (idx + 1) * chunkSize);
                      const isSelected = safeChunkIndex === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedChunkIndex(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'clay-btn-gold text-white scale-105 shadow-xs'
                              : 'clay-pill text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6E65]'
                          }`}
                        >
                          Kartu {start} - {end}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8] shrink-0 hidden sm:inline">
                    Total {filteredCards.length}
                  </span>
                </div>
              );
            };


  return (
              <div className="space-y-4">
                {/* Chapter Banner - Ultra Compact 1-Line Layout */}
                <div className="clay-card py-2.5 px-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 min-w-0">
                  {/* Left Side: Title & Inline Badges */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                    <h1 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] truncate font-serif shrink-0 max-w-[200px] sm:max-w-[320px]" dir="auto" title={currentChapter.title}>
                      {currentChapter.title}
                    </h1>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-pill text-slate-600 dark:text-slate-300">
                        {chapterCards.length} {language === 'en' ? 'Cards' : 'Kartu'}
                      </span>

                      {dueCards.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-badge-orange flex items-center gap-1">
                          <Flame className="w-3 h-3 text-white" />
                          <span>{dueCards.length} {language === 'en' ? 'Due' : 'Perlu Diulang'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-badge-emerald flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>{language === 'en' ? 'Up to Date' : 'Selesai'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: 1-Line Action Bar (Scrollable or Flex 1-Line) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                    {dueCards.length > 0 && (
                      <button
                        onClick={() => setIsReviewOpen(true)}
                        className="h-8 px-3 rounded-xl clay-btn-primary font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95 hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span className="whitespace-nowrap">{language === 'en' ? `Review (${dueCards.length})` : `Mulai Review (${dueCards.length})`}</span>
                      </button>
                    )}

                    {!isCurrentBookReadonly ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsNewItemOpen(true);
                          }}
                          className="h-8 px-2.5 rounded-xl clay-pill font-bold text-xs flex items-center gap-1 text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6E65] transition-all cursor-pointer shrink-0 active:scale-95"
                          title={language === 'en' ? 'Add Flashcard' : 'Tambah Kartu Hafalan'}
                        >
                          <Plus className="w-3.5 h-3.5 text-[#FF6E65]" />
                          <span className="whitespace-nowrap">{language === 'en' ? 'Card' : 'Kartu'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsAIImportOpen(true);
                          }}
                          className="h-8 px-2.5 rounded-xl clay-pill font-bold text-xs flex items-center gap-1 text-[#18234A] dark:text-[#F8FAFC] hover:text-amber-600 transition-all cursor-pointer shrink-0 active:scale-95"
                          title={language === 'en' ? 'Quick Flashcard Importer' : 'Impor Flashcard Cepat'}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                          <span className="whitespace-nowrap">{language === 'en' ? 'Quick Import' : 'Format Cepat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsPageEditorOpen(true);
                            setEditingPage(null);
                          }}
                          className="h-8 px-2.5 rounded-xl clay-pill font-bold text-xs flex items-center gap-1 text-[#18234A] dark:text-[#F8FAFC] hover:text-[#10B981] transition-all cursor-pointer shrink-0 active:scale-95"
                          title={language === 'en' ? 'Add Study Material' : 'Tambah Materi'}
                        >
                          <Plus className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="whitespace-nowrap">{language === 'en' ? 'Material' : 'Materi'}</span>
                        </button>

                        {currentChapter.id !== '__unassigned__' && (
                          <button
                            type="button"
                            onClick={() => {
                              setParentChapterIdForNew(currentChapter.id);
                              setEditingChapter(null);
                              setChapterForm({ title: '', description: '', material: '' });
                              setIsNewChapterOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-xl clay-pill font-bold text-xs flex items-center gap-1 text-[#18234A] dark:text-[#F8FAFC] hover:text-[#3B82F6] transition-all cursor-pointer shrink-0 active:scale-95"
                            title={language === 'en' ? 'Add Subchapter' : 'Tambah Subbab'}
                          >
                            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span className="whitespace-nowrap">{language === 'en' ? 'Subchapter' : 'Subbab'}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl clay-inset text-[11px] font-semibold text-[#687086] dark:text-[#94A3B8] shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="whitespace-nowrap">{language === 'en' ? 'Protected' : 'Terkunci'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bulk Actions Toolbar (Active when isBulkMode) */}
                {isBulkMode && (
                  <div className="bg-indigo-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-lg border border-indigo-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCardIds.size === filteredCards.length && filteredCards.length > 0) {
                            setSelectedCardIds(new Set());
                          } else {
                            setSelectedCardIds(new Set(filteredCards.map(c => c.id)));
                          }
                        }}
                        className="flex items-center gap-2 text-xs font-semibold text-indigo-200 hover:text-white transition-colors"
                      >
                        {selectedCardIds.size === filteredCards.length && filteredCards.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-300" />
                        ) : (
                          <Square className="w-4 h-4 text-indigo-300" />
                        )}
                        <span>
                          {selectedCardIds.size === filteredCards.length && filteredCards.length > 0
                            ? (language === 'en' ? 'Deselect All' : 'Batal Semua')
                            : (language === 'en' ? `Select All (${filteredCards.length})` : `Pilih Semua (${filteredCards.length})`)}
                        </span>
                      </button>

                      <span className="text-xs text-indigo-300 font-medium">
                        | <strong className="text-white ml-1">{selectedCardIds.size}</strong> {language === 'en' ? 'selected' : 'dipilih'}
                      </span>

                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={selectedCardIds.size === 0}
                        onClick={handleBulkActivate}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title={language === 'en' ? 'Activate selected cards' : 'Aktifkan kartu yang dipilih'}
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{language === 'en' ? 'Activate' : 'Aktifkan'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={selectedCardIds.size === 0}
                        onClick={handleBulkDeactivate}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title={language === 'en' ? 'Deactivate selected cards' : 'Nonaktifkan kartu yang dipilih'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Deactivate' : 'Nonaktifkan'}</span>
                      </button>

                      {!isCurrentBookReadonly && (
                        <>
                          <button
                            type="button"
                            disabled={selectedCardIds.size === 0}
                            onClick={() => {
                              setMovingItem(null);
                              setMovingChapter(null);
                              setTargetMoveChapterId(currentChapter.id === '__unassigned__' ? '__unassigned__' : currentChapter.id);
                              setIsMoveModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title={language === 'en' ? 'Move selected cards to chapter' : 'Pindahkan kartu yang dipilih ke bab lain'}
                          >
                            <Folder className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Move' : 'Pindah Bab'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={selectedCardIds.size === 0}
                            onClick={handleBulkDelete}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title={language === 'en' ? 'Delete selected cards' : 'Hapus kartu yang dipilih'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsBulkMode(false);
                          setSelectedCardIds(new Set());
                        }}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
                        title={language === 'en' ? 'Exit Bulk Selection' : 'Tutup Aksi Massal'}
                      >
                        <X className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                )}



                {/* Subbab List (shown only when subchapters exist - Sleek Horizontal Strip) */}
                {currentChapter.id !== '__unassigned__' && childChapters.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-extrabold text-[#687086] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-[#3B82F6]" />
                        <span>{language === 'en' ? 'Subchapters List' : 'Daftar Subbab'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                      {childChapters.map(sub => {
                        const subItems = bookItems.filter(i => i.chapterId === sub.id);
                        const subDue = subItems.filter(i => isItemDue(i)).length;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setSelectedChapter(sub);
                              setChapterFilter('all');
                              setChapterCardSearch('');
                            }}
                            className="group px-3 py-1.5 rounded-xl clay-pill hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2 shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                          >
                            <CornerDownRight className="w-3 h-3 text-[#3B82F6] shrink-0" />
                            <span className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6E65] transition-colors truncate max-w-[150px]">
                              {sub.title}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {subItems.length}
                            </span>
                            {subDue > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full clay-badge-orange text-white">
                                {subDue}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-[#3B82F6] group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Materi List Grid (shown only when pages exist) */}
                {chapterPages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8] uppercase tracking-wider">
                        {language === 'en' ? 'Study Modules' : 'Materi Pembelajaran'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {chapterPages.map(page => {
                        const blockTypes = Array.from(new Set(page.blocks.map(b => b.type)));
                        return (
                          <div 
                            key={page.id}
                            className="group relative clay-card-subtle rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:scale-[1.01] transition-all cursor-pointer"
                            onClick={() => setViewingPage(page)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl clay-icon-pod-emerald flex items-center justify-center shrink-0 mt-0.5">
                                  <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-[#18234A] dark:text-[#F8FAFC] text-xs sm:text-sm font-serif line-clamp-1 group-hover:text-[#10B981] transition-colors">
                                    {page.title}
                                  </h5>
                                  <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] mt-0.5">
                                    {page.blocks.length} {language === 'en' ? 'content blocks' : 'blok konten'}
                                  </p>
                                </div>
                              </div>

                              {!isCurrentBookReadonly && (
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setEditingPage(page);
                                      setIsPageEditorOpen(true);
                                    }}
                                    className="p-1.5 text-[#687086] hover:text-[#FF6E65] rounded-lg transition-colors cursor-pointer"
                                    title={language === 'en' ? 'Edit Material' : 'Edit Materi'}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDialog({
                                        isOpen: true,
                                        message: language === 'en' ? `Delete material "${page.title}"?` : `Hapus materi "${page.title}"?`,
                                        onConfirm: () => {
                                          deletePage(page.id);
                                          setConfirmDialog(null);
                                        }
                                      });
                                    }}
                                    className="p-1.5 text-[#687086] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title={language === 'en' ? 'Delete Material' : 'Hapus Materi'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Block Type Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
                              {blockTypes.map(t => (
                                <span 
                                  key={t}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold clay-pill text-[#687086] dark:text-[#94A3B8]"
                                >
                                  {t === 'arabic' ? 'Arab Interaktif' : t === 'text' ? 'Teks' : t === 'image' ? 'Gambar' : t === 'multiple-choice' ? 'Kuis' : 'Urutan'}
                                </span>
                              ))}
                              <span className="ml-auto text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>{language === 'en' ? 'Read' : 'Baca Materi'}</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Tabs & Search Bar */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Clay Inset Tabs - 4 Columns Single Row on Mobile */}
                    <div className="grid grid-cols-4 gap-1 p-1 clay-inset rounded-2xl w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => { setChapterFilter('all'); setSelectedChunkIndex(0); }}
                        className={`py-1 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none text-center ${
                          chapterFilter === 'all'
                            ? 'clay-pill text-[#FF6E65] shadow-2xs'
                            : 'text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
                        <span className="truncate">{language === 'en' ? 'All' : 'Semua'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${chapterFilter === 'all' ? 'bg-[#FF6E65] text-white' : 'clay-pill'}`}>{chapterCards.length}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => { setChapterFilter('due'); setSelectedChunkIndex(0); }}
                        className={`py-1 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none text-center ${
                          chapterFilter === 'due'
                            ? 'clay-pill text-[#FF6E65] shadow-2xs'
                            : 'text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
                        <span className="truncate">{language === 'en' ? 'Due' : 'Review'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${chapterFilter === 'due' ? 'bg-[#FF6E65] text-white' : 'clay-pill'}`}>{dueCards.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setChapterFilter('active'); setSelectedChunkIndex(0); }}
                        className={`py-1 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none text-center ${
                          chapterFilter === 'active'
                            ? 'clay-pill text-sky-600 shadow-2xs'
                            : 'text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current shrink-0 hidden xs:inline" />
                        <span className="truncate">{language === 'en' ? 'Active' : 'Aktif'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${chapterFilter === 'active' ? 'bg-sky-600 text-white' : 'clay-pill'}`}>{activeCards.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setChapterFilter('inactive'); setSelectedChunkIndex(0); }}
                        className={`py-1 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none text-center ${
                          chapterFilter === 'inactive'
                            ? 'clay-pill text-[#687086] shadow-2xs'
                            : 'text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]'
                        }`}
                      >
                        <CircleDashed className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
                        <span className="truncate">{language === 'en' ? 'Inactive' : 'Nonaktif'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${chapterFilter === 'inactive' ? 'bg-slate-500 text-white' : 'clay-pill'}`}>{chapterCards.length - activeCards.length}</span>
                      </button>
                    </div>

                    {/* Right: Search + Bulk Mode Toggle */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="w-3.5 h-3.5 text-[#687086] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={language === 'en' ? 'Search cards...' : 'Cari kartu...'}
                          value={chapterCardSearch}
                          onChange={(e) => {
                            setChapterCardSearch(e.target.value);
                            setSelectedChunkIndex(0);
                          }}
                          className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-xl clay-inset text-xs text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#687086] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsBulkMode(!isBulkMode);
                          setSelectedCardIds(new Set());
                        }}
                        className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          isBulkMode
                            ? 'clay-btn-primary text-white shadow-xs'
                            : 'clay-pill text-[#18234A] dark:text-[#F8FAFC]'
                        }`}
                        title={language === 'en' ? 'Toggle bulk operations' : 'Buka menu aksi massal kartu'}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {language === 'en' ? (isBulkMode ? 'Done' : 'Bulk') : (isBulkMode ? 'Selesai' : 'Aksi Massal')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards List / Grid */}
                {filteredCards.length === 0 ? (
                  <div className="clay-card p-6 text-center">
                    <FileText className="w-8 h-8 text-[#687086] mx-auto mb-2 opacity-60" />
                    <h4 className="font-bold text-[#18234A] dark:text-[#F8FAFC] text-sm">
                      {chapterCards.length === 0 
                        ? (language === 'en' ? 'No cards in this chapter yet' : 'Belum ada kartu di bab ini')
                        : (language === 'en' ? 'No cards match the filter' : 'Tidak ada kartu yang cocok dengan filter')}
                    </h4>
                    <p className="text-xs text-[#687086] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 mb-3">
                      {chapterCards.length === 0 
                        ? (language === 'en' ? 'Add flashcards to begin learning this chapter.' : 'Tambahkan kartu tanya-jawab untuk mulai menguasai bab ini.')
                        : (language === 'en' ? 'Try changing your filter tabs or search keywords.' : 'Coba ganti tab filter atau kata kunci pencarian.')}
                    </p>
                    {!isCurrentBookReadonly && chapterCards.length === 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsAIImportOpen(true);
                          }}
                          className="h-8 px-3 rounded-xl clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6E65] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title={language === 'en' ? 'Quick Flashcard Importer' : 'Impor Flashcard Cepat'}
                        >
                          <Zap className="w-3.5 h-3.5 text-[#FF6E65] fill-[#FF6E65]/20" />
                          <span>{language === 'en' ? 'Quick Import' : 'Format Cepat'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsNewItemOpen(true);
                          }}
                          className="h-8 px-3 rounded-xl clay-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Add Card' : 'Tambah Kartu'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pb-36">
                    {/* Range Navigation Bar (Top) */}
                    {renderRangeBar()}

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={paginatedCards.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {paginatedCards.map(item => (
                            <SortableItemWrapper
                              key={item.id}
                              activeMenuId={activeMenuId}
                              setActiveMenuId={setActiveMenuId}
                              isReadonly={isCurrentBookReadonly}
                              item={item}
                              isBulkMode={isBulkMode}
                              isSelected={selectedCardIds.has(item.id)}
                              onToggleSelect={() => {
                                setSelectedCardIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(item.id)) next.delete(item.id);
                                  else next.add(item.id);
                                  return next;
                                });
                              }}
                              onMove={() => {
                                setMovingItem(item);
                                setMovingChapter(null);
                                setTargetMoveChapterId(item.chapterId || '__unassigned__');
                                setIsMoveModalOpen(true);
                              }}
                              onPreview={() => setPreviewItem(item)}
                              onEdit={() => setEditingItem(item)}
                              onActivate={() => activateItem(item.id)}
                              onDeactivate={() => deactivateItem(item.id)}
                              onReview={(rating: 1 | 2 | 3 | 4) => reviewItem(item.id, rating)}
                              onDelete={() => deleteItem(item.id)}
                              language={language}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Range Navigation Bar (Bottom) */}
                    {renderRangeBar()}
                  </div>
                )}

              </div>
            );
          })()}

        </div>
      )}

      {/* Dialog: New Book */}
      <BookFormModal 
        isOpen={isNewBookOpen || !!editingBook}
        onClose={() => { setIsNewBookOpen(false); setEditingBook(null); }}
        onSubmit={(data) => {
          if (editingBook) {
            updateBook(editingBook.id, data);
          } else {
            const created = createBook(data);
            setSelectedBook(created);
          }
          setIsNewBookOpen(false);
          setEditingBook(null);
        }}
        initialData={editingBook || undefined}
        language={language}
      />

      {/* Dialog: New Chapter / Subchapter */}
      {isNewChapterOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {editingChapter 
                    ? (language === 'en' ? 'Edit Chapter' : 'Edit Bab')
                    : (language === 'en' 
                        ? (parentChapterIdForNew ? 'Add New Subchapter' : 'Add New Chapter') 
                        : (parentChapterIdForNew ? 'Tambah Subbab Baru' : 'Tambah Bab Baru'))}
                </h3>
                {parentChapterIdForNew && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>
                      {language === 'en' ? 'Inside chapter: ' : 'Di dalam bab: '}
                      <strong className="font-bold underline">{bookChapters.find(c => c.id === parentChapterIdForNew)?.title || ''}</strong>
                    </span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setIsNewChapterOpen(false); setEditingChapter(null); setParentChapterIdForNew(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {parentChapterIdForNew 
                    ? (language === 'en' ? 'Subchapter Title *' : 'Nama Subbab *')
                    : (language === 'en' ? 'Chapter Title *' : 'Nama Bab *')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={parentChapterIdForNew 
                    ? (language === 'en' ? 'e.g. Grammar Rules Part 1' : 'Tuliskan nama subbab...')
                    : (language === 'en' ? 'e.g. Introduction & Fundamentals' : 'Tuliskan nama bab...')}
                  value={chapterForm.title}
                  onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Description (Optional)' : 'Deskripsi Ringkas (Opsional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Brief summary of this topic...' : 'Ringkasan materi atau tujuan bab ini...'}
                  value={chapterForm.description}
                  onChange={e => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Preliminary Material (Optional Markdown)' : 'Catatan Materi Pembuka (Opsional Markdown)'}
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'en' ? 'Add explanatory notes, text, or references...' : 'Tambahkan catatan kaidah, ringkasan, atau referensi...'}
                  value={chapterForm.material}
                  onChange={e => setChapterForm({ ...chapterForm, material: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-sans transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsNewChapterOpen(false); setEditingChapter(null); setParentChapterIdForNew(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {editingChapter
                    ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                    : parentChapterIdForNew
                    ? (language === 'en' ? 'Add Subchapter' : 'Simpan Subbab')
                    : (language === 'en' ? 'Add Chapter' : 'Simpan Bab')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: New Item Card */}
      {isAIBookBuilderOpen && (
        <AIBookBuilderModal
          language={language}
          onClose={() => setIsAIBookBuilderOpen(false)}
          onImport={(bookData) => {
            const newBookId = `book-${Date.now()}`;
            createBook({
              id: newBookId,
              title: bookData.title || (language === 'en' ? 'Generated Book' : 'Buku Baru'),
              description: bookData.description || '',
              coverUrl: '',
              isPublic: false
            });
            
            if (bookData.chapters && Array.isArray(bookData.chapters)) {
              bookData.chapters.forEach((ch: any, chIndex: number) => {
                const newChapterId = `chap-${Date.now()}-${chIndex}`;
                createChapter({
                  id: newChapterId,
                  bookId: newBookId,
                  title: ch.title || (language === 'en' ? 'Untitled' : 'Tanpa Judul'),
                  order: chIndex
                });
                
                if (ch.cards && Array.isArray(ch.cards)) {
                  ch.cards.forEach((card: any, cardIndex: number) => {
                    createItem({
                      id: `item-${Date.now()}-${chIndex}-${cardIndex}-${Math.random().toString(36).substr(2, 9)}`,
                      bookId: newBookId,
                      chapterId: newChapterId,
                      question: normalizeBilingualText(card.question),
                      answer: normalizeBilingualText(card.answer),
                      order: Date.now()
                    });
                  });
                }
              });
            }
            
            setIsAIBookBuilderOpen(false);
          }}
        />
      )}
      {isAIImportOpen && (
        <AIImportModal
          language={language}
          sourceMaterial={chapters.find(c => c.id === selectedChapterIdForItem)?.material}
          onClose={() => setIsAIImportOpen(false)}
          onImport={(cards) => {
            cards.forEach((card, cIndex) => {
              createItem({
                id: `item-${Date.now()}-${cIndex}-${Math.random().toString(36).substr(2, 9)}`,
                bookId: selectedBook!.id,
                chapterId: selectedChapterIdForItem || undefined,
                question: normalizeBilingualText(card.question),
                answer: normalizeBilingualText(card.answer),
                tags: []
              });
            });
            setIsAIImportOpen(false);
          }}
        />
      )}
      
      <PageEditorModal 
        isOpen={isPageEditorOpen || !!editingPage}
        onClose={() => { setIsPageEditorOpen(false); setEditingPage(null); }}
        bookId={selectedBook?.id || ''}
        chapterId={selectedChapterIdForItem}
        initialData={editingPage}
      />
      <PageViewerModal 
        isOpen={!!viewingPage}
        onClose={() => setViewingPage(null)}
        page={viewingPage}
      />
      <ItemFormModal
        isOpen={isNewItemOpen || !!editingItem}
        onClose={() => { setIsNewItemOpen(false); setEditingItem(null); }}
        onSubmit={(data, keepOpen) => {
          if (editingItem) {
            updateItem(editingItem.id, data);
            setEditingItem(null);
            setIsNewItemOpen(false);
          } else if (selectedBook) {
            createItem({
              bookId: selectedBook.id,
              ...data,
              tags: []
            });
            if (!keepOpen) {
              setIsNewItemOpen(false);
            }
          }
        }}
        chapters={bookChapters}
        initialData={editingItem || undefined}
        initialChapterId={selectedChapterIdForItem}
        language={language}
      />




      {/* Dialog: Export JSON */}
      

      {/* Item Preview Modal */}
      {(() => {
        const previewList = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : (currentChapter ? bookItems.filter(i => i.chapterId === currentChapter.id) : bookItems);
        const pIdx = previewItem ? previewList.findIndex(i => i.id === previewItem.id) : -1;
        const nextPreviewItem = pIdx >= 0 && pIdx < previewList.length - 1 ? previewList[pIdx + 1] : undefined;
        const prevPreviewItem = pIdx > 0 ? previewList[pIdx - 1] : undefined;


  return (
          <ItemPreviewModal
            item={previewItem}
            isOpen={Boolean(previewItem)}
            onClose={() => setPreviewItem(null)}
            onNavigateNext={nextPreviewItem ? () => setPreviewItem(nextPreviewItem) : undefined}
            onNavigatePrev={prevPreviewItem ? () => setPreviewItem(prevPreviewItem) : undefined}
            onActivate={() => {
              if (previewItem) {
                activateItem(previewItem.id);
                setPreviewItem({ ...previewItem, isActive: true });
              }
            }}
            onDeactivate={() => {
              if (previewItem) {
                deactivateItem(previewItem.id);
                setPreviewItem({ ...previewItem, isActive: false });
              }
            }}
            language={language}
          />
        );
      })()}

      {/* Curated Library Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => {
          setIsPublishOpen(false);
          setPublishPreselectedId(null);
        }}
        preselectedBookId={publishPreselectedId}
      />

      {/* Move Chapter / Item Modal */}
      <FolderMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingItem(null);
          setMovingChapter(null);
        }}
        onConfirm={handleConfirmMove}
        targetMoveChapterId={targetMoveChapterId}
        setTargetMoveChapterId={setTargetMoveChapterId}
        chapters={chapters}
        items={items}
        movingItem={movingItem}
        movingChapter={movingChapter}
        selectedCount={selectedCardIds.size}
        language={language}
      />

      {/* Review Modal */}
      <PersonalReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setReviewSpecificBookId(null);
        }}
        specificBookId={selectedBook ? selectedBook.id : (reviewSpecificBookId || undefined)}
        specificChapterId={currentChapter && currentChapter.id !== '__unassigned__' ? currentChapter.id : undefined}
      />

      {/* Per-Book Review Schedule Calendar Modal */}
      {calendarBook && (
        <BookReviewCalendarModal
          isOpen={isBookCalendarOpen}
          onClose={() => setIsBookCalendarOpen(false)}
          book={calendarBook}
          allBooks={books}
          onSelectBook={(newBook) => {
            setCalendarBook(newBook);
            setCalendarChapterFilter(null);
          }}
          items={items}
          chapters={chapters.filter(c => c.bookId === calendarBook.id)}
          language={language}
          initialChapterFilter={calendarChapterFilter}
          onStartReview={(chapterId) => {
            setIsBookCalendarOpen(false);
            setReviewSpecificBookId(calendarBook.id);
            setSelectedBook(calendarBook);
            if (chapterId) {
              const ch = chapters.find(c => c.id === chapterId);
              if (ch) setSelectedChapter(ch);
            }
            setIsReviewOpen(true);
          }}
          onPreviewItem={(item) => {
            setPreviewItem(item);
          }}
        />
      )}

      {/* Global Flashcard Search Modal across all books */}
      <GlobalCardSearchModal
        isOpen={isGlobalCardSearchOpen}
        onClose={() => setIsGlobalCardSearchOpen(false)}
        books={books}
        items={items}
        chapters={chapters}
        language={language}
        onSelectCard={(item, book, chapter) => {
          setSelectedBook(book);
          if (chapter) {
            setSelectedChapter(chapter);
          } else {
            setSelectedChapter(null);
          }
          setPreviewItem(item);
        }}
      />
      {/* Join Class Code Modal Dialog */}
      {isJoinClassModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left relative">
            <button
              onClick={() => {
                setIsJoinClassModalOpen(false);
                setCodeInputValue('');
                setJoinMessage(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Join Class with Code' : 'Gabung Kelas dengan Kode'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Enter the class invitation code provided by your teacher.' : 'Masukkan kode undangan kelas dari pengajar Anda.'}
                </p>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinClass();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Class Code' : 'Kode Kelas'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={language === 'en' ? 'e.g. CLS-89AB' : 'contoh: CLS-89AB'}
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                  />
                </div>
                {joinMessage && (
                  <p className={`text-xs mt-2 ml-1 font-medium ${joinMessage.isError ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {joinMessage.text}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinClassModalOpen(false);
                    setCodeInputValue('');
                    setJoinMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={!codeInputValue.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'en' ? 'Join Class' : 'Gabung Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {language === 'en' ? 'Confirmation' : 'Konfirmasi'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Yes' : 'Ya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ItemRowProps {
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  isReadonly?: boolean;
  item: BookItem;
  onPreview: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onReview?: (rating: 1 | 2 | 3 | 4) => void;
  onDelete: () => void;
  onMove?: () => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  language: Language;
}


const SortableItemWrapper = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.item.id, disabled: props.isReadonly });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (props.activeMenuId === `item-${props.item.id}` ? 50 : undefined),
    position: (isDragging || props.activeMenuId === `item-${props.item.id}`) ? 'relative' : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined,
    scale: isDragging ? '1.02' : '1',
    touchAction: 'manipulation', // Allows scroll but handles drag
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  };


  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="select-none">
      <ItemCardRow {...props} />

      {/* Audio Recorder Drawer ends here */}
    </div>
  );
};

const ItemCardRow: React.FC<ItemRowProps & { onEdit: () => void }> = ({
  item,
  onPreview,
  onEdit,
  onActivate,
  onDeactivate,
  onReview,
  onDelete,
  onMove,
  isBulkMode,
  isSelected,
  onToggleSelect,
  language,
  activeMenuId,
  setActiveMenuId,
  isReadonly
}) => {
  const [showInlineQuestion, setShowInlineQuestion] = useState(true);
  const [showInlineAnswer, setShowInlineAnswer] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [justReviewedRating, setJustReviewedRating] = useState<number | null>(null);
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string | null; title: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(item.id).then(exists => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(item.id)) {
        AudioStorageService.hasAudio(item.id).then(exists => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener('audio-updated', handleAudioChange);

  return () => {
      mounted = false;
      window.removeEventListener('audio-updated', handleAudioChange);
    };
  }, [item.id]);

  const isDueToday = item.isActive && (!item.fsrsData.nextReview || new Date(item.fsrsData.nextReview) <= new Date());
  const reviewedToday = isReviewedToday(item.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
  const isMapan = item.isActive && intervalDays >= 300;
  const intervals = predictNonQuranIntervals(item.fsrsData);
  
  const formatDate = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    const now = new Date();
    const formatted = nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short', day: 'numeric' });
    if (nextDate <= now) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    return nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const menuId = `item-${item.id}`;
  const isMenuOpen = activeMenuId === menuId;


  return (
    <div className={`group relative p-3 sm:p-3.5 transition-all flex flex-col justify-between gap-2 rounded-2xl ${isMenuOpen ? 'z-50 ring-2 ring-amber-500/20' : ''} ${
      isSelected
        ? 'ring-2 ring-amber-500 shadow-md clay-card-subtle'
        : isDueToday
        ? 'clay-card-subtle ring-1.5 ring-[#FF6E65]/60 shadow-[0_4px_16px_rgba(255,110,101,0.15)]'
        : item.isActive
        ? 'clay-card-subtle'
        : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 opacity-75 hover:opacity-100'
    }`}>
      
      {/* Top Header Bar: Activation Power Button + Metrics (Flame, Brain, Due Date) + Action Pods (Mic, Toggle Jawaban, More Options) */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Left: Checkbox (if bulk) + Power Button + Metrics */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Bulk Selection Checkbox */}
          {isBulkMode && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              className="p-1 rounded-md text-amber-600 hover:scale-105 transition-transform shrink-0 cursor-pointer"
              title={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#F27A3D]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Quick 1-Touch Power/Active Button (Al-Qur'an Style: Blue for Activation) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); item.isActive ? onDeactivate() : onActivate(); }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
              item.isActive
                ? 'bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)] hover:scale-105'
                : 'clay-pill text-slate-400 dark:text-slate-500 hover:text-[#0EA5E9] hover:scale-105'
            }`}
            title={item.isActive 
              ? (language === 'en' ? 'Deactivate Card' : 'Nonaktifkan Kartu')
              : (language === 'en' ? 'Activate Card' : 'Aktifkan Kartu')
            }
          >
            {item.isActive ? (
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            ) : (
              <Power className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Mapan Badge (Green is for Mapan) */}
          {isMapan && (
            <span 
              className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] flex items-center gap-1 border border-emerald-500/20 shrink-0" 
              title={language === 'en' ? `Mastered (Interval: ${intervalDays} days)` : `Kartu Mapan (Interval: ${intervalDays} hari)`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{language === 'en' ? 'Mastered' : 'Mapan'}</span>
            </span>
          )}

          {/* Compact Metrics: Flame (Reps) + Brain (Interval) + Calendar (Due) */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0" 
              title={language === 'en' ? `Reviewed: ${item.fsrsData.reps} times` : `Direview: ${item.fsrsData.reps} kali`}
            >
              <Flame className="w-3.5 h-3.5 text-[#FF6E65] fill-[#FF6E65] shrink-0" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.fsrsData.reps}×</span>
            </div>

            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0" 
              title={language === 'en' ? `Interval: ${intervalDays} days` : `Interval: ${intervalDays} hari`}
            >
              <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{intervalDays}d</span>
            </div>

            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[75px] sm:max-w-[110px]" 
              title={language === 'en' ? `Due Date: ${getFullDueDateStr(item.fsrsData.nextReview)}` : `Jatuh tempo: ${getFullDueDateStr(item.fsrsData.nextReview)}`}
            >
              <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDueToday ? 'text-[#FF6E65]' : 'text-slate-400'}`} />
              <span className={`text-[10.5px] font-semibold truncate ${isDueToday ? 'text-[#FF6E65] font-black' : ''}`}>
                {formatDate(item.fsrsData.nextReview)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Action Pods: [Mic Audio] + [👁 Jawaban] + [More Options ...] */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio Mic Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAudio(!showAudio); }}
            className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              showAudio
                ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_8px_rgba(255,111,61,0.4)]'
                : hasAudio 
                ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' 
                : 'clay-pill text-slate-500 dark:text-slate-400 hover:text-indigo-600'
            }`}
            title={language === 'en' ? 'Voice Recording' : 'Rekaman Suara Mandiri'}
          >
            <Mic className="w-3.5 h-3.5" />
            {hasAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Pop-up Button (Replaces old Answer toggle in header) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 clay-pill text-[#FF6F3D] dark:text-[#FF8A65] hover:bg-orange-50 dark:hover:bg-orange-950/40 shadow-2xs"
            title={language === 'en' ? 'Open full screen pop-up view' : 'Buka tampilan pop-up penuh'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Pop-up' : 'Pop-up'}</span>
          </button>

          {/* More Options Menu */}
          {!isReadonly && (
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === menuId ? null : menuId); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {activeMenuId === menuId && (
                <div 
                  className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setActiveMenuId(null); onPreview(); }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Pop-up' : 'Pop-up'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveMenuId(null); onEdit(); }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'en' ? 'Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveMenuId(null); onDelete(); }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Intelligent Flashcard Front (Question) & Back (Answer) Flip Container */}
      <div className="py-1 min-w-0">
        {!showInlineAnswer ? (
          /* FRONT CARD (QUESTION) */
          <div 
            onClick={(e) => { e.stopPropagation(); setShowInlineAnswer(true); }}
            className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#EEF3FA] dark:bg-[#121B2B] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-600/50 transition-all cursor-pointer group/card flex flex-col gap-2.5"
          >
            {/* If BOTH imageQ and question text exist: side-by-side (Image left, Text right) */}
            {item.imageQ && item.imageQ.trim() !== '' && item.question?.trim() ? (
              <div className="grid grid-cols-12 gap-3 items-stretch">
                <div className="col-span-5 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 p-1.5 flex items-center justify-center shadow-2xs">
                  <AdaptiveFlashcardImage
                    src={item.imageQ}
                    alt="Pertanyaan"
                    title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                    language={language}
                    onEnlarge={() => setLightboxImage({ url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                  />
                </div>
                <div className="col-span-7 flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    {language === 'en' ? 'Question' : 'Pertanyaan'}
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed select-text">
                    <BilingualCardText text={item.question} type="question" variant="card-list" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* If ONLY imageQ (no text): Centered full-width image */}
                {item.imageQ && item.imageQ.trim() !== '' && (
                  <div className="w-full rounded-xl overflow-hidden bg-white/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 p-2 flex items-center justify-center shadow-2xs">
                    <AdaptiveFlashcardImage
                      src={item.imageQ}
                      alt="Pertanyaan"
                      title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                      language={language}
                      onEnlarge={() => setLightboxImage({ url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                    />
                  </div>
                )}

                {/* If ONLY question text (no image): Text displayed */}
                {item.question?.trim() && (
                  <div className="w-full min-w-0 select-text">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      {language === 'en' ? 'Question' : 'Pertanyaan'}
                    </span>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      <BilingualCardText text={item.question} type="question" variant="card-list" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Minimalist Flip Icon Footer with Audio Recorder / Player */}
            <div className="pt-2 mt-0.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
              {showAudio ? (
                <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                  <AudioRecorderPlayer 
                    itemId={item.id}
                    itemType="book"
                    itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
                    language={language} 
                    compact={true} 
                    onHasRecordingChange={setHasAudio}
                  />
                </div>
              ) : (
                <div className="flex-1" />
              )}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInlineAnswer(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                title={language === 'en' ? 'Click to flip card' : 'Klik untuk balik kartu'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {language === 'en' ? 'Flip' : 'Balik'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* BACK CARD (ANSWER) */
          <div 
            onClick={(e) => { e.stopPropagation(); setShowInlineAnswer(false); }}
            className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#FEFCE8] dark:bg-[#1F1B16] border border-amber-200/80 dark:border-amber-900/40 shadow-sm animate-in fade-in duration-200 cursor-pointer group/card flex flex-col gap-2.5"
          >
            {/* If BOTH imageA and answer text exist: side-by-side (Image left, Text right) */}
            {item.imageA && item.imageA.trim() !== '' && item.answer?.trim() ? (
              <div className="grid grid-cols-12 gap-3 items-stretch">
                <div className="col-span-5 rounded-xl overflow-hidden bg-white/75 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 p-1.5 flex items-center justify-center shadow-2xs">
                  <AdaptiveFlashcardImage
                    src={item.imageA}
                    alt="Jawaban"
                    title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                    language={language}
                    onEnlarge={() => setLightboxImage({ url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                  />
                </div>
                <div className="col-span-7 flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {language === 'en' ? 'Answer' : 'Jawaban'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed select-text">
                    <BilingualCardText text={item.answer} type="answer" variant="card-list" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* If ONLY imageA (no text): Centered full-width image */}
                {item.imageA && item.imageA.trim() !== '' && (
                  <div className="w-full rounded-xl overflow-hidden bg-white/75 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 p-2 flex items-center justify-center shadow-2xs">
                    <AdaptiveFlashcardImage
                      src={item.imageA}
                      alt="Jawaban"
                      title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                      language={language}
                      onEnlarge={() => setLightboxImage({ url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                    />
                  </div>
                )}

                {/* If ONLY answer text (no image): Text displayed */}
                {item.answer?.trim() && (
                  <div className="w-full min-w-0 select-text">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                      {language === 'en' ? 'Answer' : 'Jawaban'}
                    </span>
                    <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      <BilingualCardText text={item.answer} type="answer" variant="card-list" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Explanation Button if available */}
            {item.explanation && (
              <div className="flex items-center justify-end pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExplanationModal(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-amber-900/80 text-amber-700 dark:text-amber-100 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs border border-amber-200/60"
                  title={language === 'en' ? 'Open detailed explanation' : 'Buka rincian penjelasan'}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                  <span>{language === 'en' ? 'Explanation' : 'Penjelasan'}</span>
                </button>
              </div>
            )}

            {/* Minimalist Flip Back Icon Footer with Audio Recorder / Player */}
            <div className="pt-2 mt-0.5 border-t border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between gap-3">
              {showAudio ? (
                <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                  <AudioRecorderPlayer 
                    itemId={item.id}
                    itemType="book"
                    itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
                    language={language} 
                    compact={true} 
                    onHasRecordingChange={setHasAudio}
                  />
                </div>
              ) : (
                <div className="flex-1" />
              )}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInlineAnswer(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                title={language === 'en' ? 'Click to flip back' : 'Klik untuk balik ke pertanyaan'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {language === 'en' ? 'Question' : 'Tanya'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>





      {/* 4 Evaluation / Rating Buttons (Active when card is Due and not reviewed today) */}
      {item.isActive && (
        <div className="pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
          {reviewedToday || !isDueToday ? (
            <div className="grid grid-cols-4 gap-1.5 opacity-40 select-none">
              <button
                type="button"
                disabled
                className="py-1.5 px-1 rounded-xl clay-rating-rose text-center flex flex-col items-center justify-center cursor-not-allowed"
                title={language === 'en' ? 'Already reviewed / Not due today' : 'Selesai dievaluasi / Belum jatuh tempo'}
              >
                <Lock className="w-3 h-3 text-rose-500 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
              </button>
              <button
                type="button"
                disabled
                className="py-1.5 px-1 rounded-xl clay-rating-gold text-center flex flex-col items-center justify-center cursor-not-allowed"
                title={language === 'en' ? 'Already reviewed / Not due today' : 'Selesai dievaluasi / Belum jatuh tempo'}
              >
                <Lock className="w-3 h-3 text-amber-500 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
              </button>
              <button
                type="button"
                disabled
                className="py-1.5 px-1 rounded-xl clay-rating-emerald text-center flex flex-col items-center justify-center cursor-not-allowed"
                title={language === 'en' ? 'Already reviewed / Not due today' : 'Selesai dievaluasi / Belum jatuh tempo'}
              >
                <Lock className="w-3 h-3 text-emerald-500 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
              </button>
              <button
                type="button"
                disabled
                className="py-1.5 px-1 rounded-xl clay-rating-orange text-center flex flex-col items-center justify-center cursor-not-allowed"
                title={language === 'en' ? 'Already reviewed / Not due today' : 'Selesai dievaluasi / Belum jatuh tempo'}
              >
                <Lock className="w-3 h-3 text-[#FF6E65] mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playRatingFeedback(1);
                  onReview?.(1);
                }}
                className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-rose text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                title={language === 'en' ? 'Review again' : 'Lupa total / Ulang lagi'}
              >
                <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
                <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.again}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playRatingFeedback(2);
                  onReview?.(2);
                }}
                className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-gold text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                title={language === 'en' ? 'Hard to recall' : 'Ingat dengan susah payah'}
              >
                <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
                <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.hard}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playRatingFeedback(3);
                  onReview?.(3);
                }}
                className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-emerald text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                title={language === 'en' ? 'Good recall' : 'Ingat dengan baik'}
              >
                <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
                <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.good}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playRatingFeedback(4);
                  onReview?.(4);
                }}
                className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-orange text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                title={language === 'en' ? 'Easy recall' : 'Sangat mudah / Refleks langsung hafal'}
              >
                <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
                <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.easy}</span>
              </button>
            </div>
          )}
        </div>
      )}



      {/* Pop-up Modal for Material Explanation / Notes */}
      {showExplanationModal && item.explanation && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowExplanationModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl clay-icon-pod-pacific flex items-center justify-center text-white shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {language === 'en' ? 'Detailed Explanation & Material Notes' : 'Rincian Penjelasan & Catatan Materi'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === 'en' ? 'Additional reference for this knowledge card' : 'Materi lengkap pendukung kartu hafalan ini'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed select-text space-y-3 font-sans shadow-inner">
              <BilingualCardText 
                text={item.explanation}
                type="general"
                variant="detail-modal"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl clay-btn-primary text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {language === 'en' ? 'Close' : 'Tutup Rincian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Viewer for ItemCardRow */}
      <ImageLightboxModal 
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

export default PersonalSpace;

