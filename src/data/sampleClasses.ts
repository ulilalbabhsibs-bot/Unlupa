import { ClassGroup, QuranPageItem, BookItem } from '../types';
import { getSurahForPage, getJuzForPage } from './quranData';
import { INITIAL_ITEMS } from './sampleBooks';

export function createSampleStudentBookItems(sourceItems: BookItem[], activeCount: number, dueCount: number): BookItem[] {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000 * 2);
  const future = new Date(today.getTime() + 86400000 * 12);
  const distantFuture = new Date(today.getTime() + 86400000 * 320);

  return sourceItems.map((item, index) => {
    const isActive = index < activeCount;
    const isDue = isActive && index < dueCount;
    const isMastered = isActive && !isDue && index >= dueCount && index < dueCount + 5;

    return {
      ...item,
      isActive,
      status: isMastered ? 'mastered' : isActive ? 'active' : 'inactive',
      fsrsData: {
        stability: isMastered ? 340.0 : isDue ? 4.5 : isActive ? 18.2 : 0,
        difficulty: 5.0,
        reps: isMastered ? 12 : isDue ? 2 : isActive ? 5 : 0,
        lapses: isDue ? 1 : 0,
        lastReview: isActive ? yesterday.toISOString() : null,
        nextReview: isDue ? today.toISOString() : isMastered ? distantFuture.toISOString() : isActive ? future.toISOString() : null,
        state: isMastered ? 'mastered' : isActive ? 'review' : 'new',
      }
    };
  });
}

export function createSampleStudentQuranPages(activePageNumbers: number[], duePageNumbers: number[]): QuranPageItem[] {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const future = new Date(today.getTime() + 86400000 * 5);

  const pages: QuranPageItem[] = [];
  for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
    const surah = getSurahForPage(pageNumber);
    const juz = getJuzForPage(pageNumber);
    const isActive = activePageNumbers.includes(pageNumber);
    const isDue = duePageNumbers.includes(pageNumber);
    const isMastered = isActive && !isDue && pageNumber <= 5; // First few pages mastered

    pages.push({
      pageNumber,
      juzNumber: juz,
      surahNumber: surah.surahNumber,
      surahNameEn: surah.nameEn,
      surahNameAr: surah.nameAr,
      ayahRange: surah.ayahRange,
      isActive,
      imageUrl: `https://quran.ksu.edu.sa/png_pages/${pageNumber}.png`,
      status: isMastered ? 'mastered_for_now' : isActive ? 'active' : 'inactive',
      mapanCelebrated: isMastered,
      fsrsData: {
        stability: isMastered ? 78.0 : isDue ? 4.2 : isActive ? 18.5 : 0,
        difficulty: 10.0,
        reps: isMastered ? 8 : isDue ? 2 : isActive ? 5 : 0,
        lapses: isDue ? 1 : 0,
        lastReview: isActive ? yesterday.toISOString() : null,
        nextReview: isDue ? today.toISOString() : isActive ? future.toISOString() : null,
        state: isMastered ? 'mastered' : isActive ? 'review' : 'new',
      }
    });
  }

  return pages;
}

export const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'class-1',
    teacherId: 'teacher-ahmad',
    teacherName: 'Ust. Ahmad Al-Hafizh',
    name: 'Halaqah Tahfiz Al-Jazari (Juz 1-5)',
    code: 'QRN-2026',
    type: 'quran',
    description: 'Program intensif halaqah tahfidz dan murajaah terjadwal dengan pemantauan retensi adaptif.',
    coverUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80',
    requiredJuzList: [1, 2, 3, 4, 5],
    students: [
      {
        id: 'std-1',
        quranSpaceCode: 'QRN-ALI-101',
        name: 'Ali Muhammad',
        email: 'ali.m@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 20,
        dueTodayCount: 4,
        averageStability: 18.4,
        retentionRate: 96,
        lastActive: '15 menit yang lalu',
        frequentStruggles: ['Juz 2 Hal 28', 'Juz 3 Hal 45'],
        quranData: createSampleStudentQuranPages(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
          [3, 7, 14, 18]
        ),
        teacherFeedbacks: [
          {
            id: 'tf-1',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            pageNumber: 14,
            rating: 1,
            teacherName: 'Ust. Ahmad Al-Hafizh',
            note: 'Ayat 89-91 perhatikan ikhfa haqiqi kaf dan nun sukun.',
          }
        ],
      },
      {
        id: 'std-2',
        quranSpaceCode: 'QRN-MRY-102',
        name: 'Siti Maryam',
        email: 'siti.m@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 25,
        dueTodayCount: 1,
        averageStability: 24.2,
        retentionRate: 98,
        lastActive: 'Hari ini 07:30',
        frequentStruggles: ['Juz 1 Hal 14'],
        quranData: createSampleStudentQuranPages(
          Array.from({ length: 25 }, (_, i) => i + 1),
          [12]
        ),
        teacherFeedbacks: [
          {
            id: 'tf-2',
            date: new Date(Date.now() - 86400000).toISOString(),
            pageNumber: 11,
            rating: 2,
            teacherName: 'Ust. Ahmad Al-Hafizh',
            note: 'Mumtazah! Waqaf dan ibtida sangat baik.',
          }
        ],
      },
      {
        id: 'std-3',
        quranSpaceCode: 'QRN-FRH-103',
        name: 'Farhan Abdullah',
        email: 'farhan.a@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 15,
        dueTodayCount: 5,
        averageStability: 8.5,
        retentionRate: 88,
        lastActive: 'Kemarin',
        frequentStruggles: ['Juz 1 Hal 18', 'Juz 2 Hal 22'],
        quranData: createSampleStudentQuranPages(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          [2, 5, 8, 10, 15]
        ),
      },
      {
        id: 'std-4',
        quranSpaceCode: 'QRN-ZHR-104',
        name: 'Zahra Karim',
        email: 'zahra.k@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 30,
        dueTodayCount: 2,
        averageStability: 28.0,
        retentionRate: 97,
        lastActive: '2 jam yang lalu',
        frequentStruggles: [],
        quranData: createSampleStudentQuranPages(
          Array.from({ length: 30 }, (_, i) => i + 1),
          [19, 27]
        ),
      }
    ],
    createdAt: '2025-01-05T00:00:00.000Z',
  },
  {
    id: 'class-q2',
    teacherId: 'teacher-ahmad',
    teacherName: 'Ust. Ahmad Al-Hafizh',
    name: 'Halaqah Tahfidz Juz \'Amma (Juz 30)',
    code: 'JUZ30-2026',
    type: 'quran',
    description: 'Halaqah dasar tahfidz Al-Qur\'an Juz 30 (Surah An-Naba s.d. An-Nas) dengan tahsin mutqin.',
    coverUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80',
    requiredJuzList: [30],
    students: [
      {
        id: 'std-7',
        quranSpaceCode: 'QRN-RYN-107',
        name: 'Rayyan Hakim',
        email: 'rayyan@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 23,
        dueTodayCount: 3,
        averageStability: 15.0,
        retentionRate: 94,
        lastActive: 'Hari ini',
        frequentStruggles: ['Hal 582'],
        quranData: createSampleStudentQuranPages(
          Array.from({ length: 23 }, (_, i) => 582 + i),
          [584, 590, 599]
        ),
      },
      {
        id: 'std-8',
        quranSpaceCode: 'QRN-AQR-108',
        name: 'Aqila Ramadhani',
        email: 'aqila@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 23,
        dueTodayCount: 0,
        averageStability: 32.0,
        retentionRate: 99,
        lastActive: '1 jam yang lalu',
        frequentStruggles: [],
        quranData: createSampleStudentQuranPages(
          Array.from({ length: 23 }, (_, i) => 582 + i),
          []
        ),
      }
    ],
    createdAt: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'class-2',
    teacherId: 'teacher-fatimah',
    teacherName: 'Ustzh. Fatimah Az-Zahra, Lc.',
    name: 'Arabic Bayna Yadayk Level 1 Cohort',
    code: 'ARB-101',
    type: 'non-quran',
    description: 'Drill kosakata tematik dan percakapan harian dengan pengulangan terjadwal adaptif.',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    assignedBookIds: ['book-1'],
    students: [
      {
        id: 'std-5',
        name: 'Omar Said',
        email: 'omar.s@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 18,
        dueTodayCount: 2,
        averageStability: 14.2,
        retentionRate: 93,
        lastActive: 'Hari ini 10:15',
        frequentStruggles: ['Tanda Isim dan Fi\'il', 'Jamak Taksir'],
        bookItemsData: createSampleStudentBookItems(INITIAL_ITEMS.filter(i => i.bookId === 'book-1'), 18, 2),
      },
      {
        id: 'std-6',
        name: 'Amina Noor',
        email: 'amina.n@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 22,
        dueTodayCount: 0,
        averageStability: 21.0,
        retentionRate: 95,
        lastActive: 'Hari ini 06:45',
        frequentStruggles: ['Kaidah Huruf Jar'],
        bookItemsData: createSampleStudentBookItems(INITIAL_ITEMS.filter(i => i.bookId === 'book-1'), 22, 0),
      }
    ],
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'class-3',
    teacherId: 'teacher-ahmad',
    teacherName: 'Ust. Ahmad Al-Hafizh',
    name: 'Matan Al-Ajurrumiyyah (Kaidah Nahwu)',
    code: 'NJR-2026',
    type: 'non-quran',
    description: 'Hafalan dan pemahaman bait kaidah nahwu dasar dengan sistem jadwal adaptif mutqin terstruktur.',
    coverUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80',
    assignedBookIds: ['book-1'],
    students: [
      {
        id: 'std-9',
        name: 'Bilal Habasyi',
        email: 'bilal@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        activeItemsCount: 16,
        dueTodayCount: 2,
        averageStability: 16.5,
        retentionRate: 94,
        lastActive: '3 jam yang lalu',
        frequentStruggles: ['Tanda I\'rab Khafadh'],
        bookItemsData: createSampleStudentBookItems(INITIAL_ITEMS.filter(i => i.bookId === 'book-1'), 16, 2),
      }
    ],
    createdAt: '2025-02-01T00:00:00.000Z',
  }
];
