import { db } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { isFirestoreQuotaExceeded, markFirestoreQuotaExceeded } from './firestore-quota';

// Debounce map to prevent spamming Firestore
const syncTimeouts: Record<string, NodeJS.Timeout> = {};

// In-memory cache of last synced data hashes to eliminate redundant writes
const lastSyncedCache: Record<string, string> = {};

let quotaExceededNotifiedAt = 0;

export const getIsFirestoreQuotaExceeded = () => isFirestoreQuotaExceeded();

export const syncToFirestore = (userId: string, key: string, data: any) => {
  if (!userId || userId === 'guest') return;
  if (isFirestoreQuotaExceeded()) return;
  
  const syncKey = `${userId}_${key}`;
  
  // Fast pre-check: serialize and compare with cache
  try {
    const serialized = JSON.stringify(data ?? null);
    if (lastSyncedCache[syncKey] === serialized) {
      // Data has not changed at all, skip write completely
      return;
    }
  } catch (e) {
    // If serialization fails, continue to normal flow
  }

  if (syncTimeouts[syncKey]) {
    clearTimeout(syncTimeouts[syncKey]);
  }

  syncTimeouts[syncKey] = setTimeout(async () => {
    // If quota is known to be exceeded, suppress writes to avoid error spam
    if (isFirestoreQuotaExceeded()) {
      const now = Date.now();
      if (now - quotaExceededNotifiedAt > 300000) { // Log at most once every 5 minutes
        console.warn('Firestore daily write quota is currently reached. Operating in offline/local-first mode.');
        quotaExceededNotifiedAt = now;
      }
      return;
    }

    try {
      const docRef = doc(db, 'user_data', userId, 'app_state', key);
      // Strip undefined values which Firestore rejects
      const sanitizedData = JSON.parse(JSON.stringify(data));
      const serialized = JSON.stringify(sanitizedData);
      
      // Double check before network write
      if (lastSyncedCache[syncKey] === serialized) {
        return;
      }

      await setDoc(docRef, { data: sanitizedData, updatedAt: new Date().toISOString() });
      lastSyncedCache[syncKey] = serialized;
      console.log(`[Firestore] Synced ${key} for user`);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota limit exceeded') || error?.code === 'resource-exhausted') {
        markFirestoreQuotaExceeded(4);
        console.warn('[Firestore] Daily write quota exceeded. App is safely storing changes locally in localStorage until quota resets.');
      } else {
        console.error(`Error syncing ${key} to Firestore:`, error);
      }
    }
  }, 400); // 400ms prompt debounce
};

export const fetchFromFirestore = async (userId: string, key: string): Promise<any | null> => {
  if (!userId || userId === 'guest') return null;
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, 'user_data', userId, 'app_state', key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data().data;
      // Populate cache so subsequent loads don't immediately re-write identical data
      const syncKey = `${userId}_${key}`;
      try {
        lastSyncedCache[syncKey] = JSON.stringify(data ?? null);
      } catch (e) { /* ignore */ }
      return data;
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn(`[Firestore] Quota exceeded when fetching ${key}. Using local data.`);
    } else {
      console.error(`Error fetching ${key} from Firestore:`, error);
    }
  }
  return null;
};

// Public Library Sync
export async function publishToPublicLibrary(userId: string, entry: any): Promise<void> {
  if (!db || isFirestoreQuotaExceeded()) return;
  try {
    const bookDoc = {
      ...entry,
      userId,
      isPublic: true,
      publishedAt: new Date().toISOString()
    };
    const docRef = doc(db, 'books', entry.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(bookDoc)));
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn('[Firestore] Quota reached during public library publish. Stored locally.');
    } else {
      console.error('Failed to publish book to public library in Firestore:', error);
    }
  }
}

export async function fetchPublicLibrary(): Promise<any[]> {
  if (!db || isFirestoreQuotaExceeded()) return [];
  try {
    const q = query(collection(db, 'books'), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);
    const library: any[] = [];
    querySnapshot.forEach((docSnap) => {
      library.push(docSnap.data());
    });
    return library;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn('[Firestore] Quota reached during fetchPublicLibrary.');
    } else {
      console.error('Failed to fetch public library from Firestore:', error);
    }
    return [];
  }
}

// Global Class Management
export async function syncClassToGlobal(classData: any): Promise<void> {
  if (!db || isFirestoreQuotaExceeded()) return;
  try {
    const docRef = doc(db, 'classes', classData.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(classData)));
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn('[Firestore] Quota reached during syncClassToGlobal.');
    } else {
      console.error('Failed to sync class to global collection:', error);
    }
  }
}

export async function findClassByCodeGlobal(code: string): Promise<any | null> {
  if (!db || isFirestoreQuotaExceeded()) return null;
  try {
    const q = query(collection(db, 'classes'), where('code', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
    } else {
      console.error('Failed to find class by code:', error);
    }
  }
  return null;
}


const enrollTimeouts: Record<string, NodeJS.Timeout> = {};
const enrollCache: Record<string, string> = {};

export async function enrollStudentInGlobalClass(classId: string, studentId: string, studentData: any, immediate = false): Promise<void> {
  if (!db || isFirestoreQuotaExceeded()) return;
  const syncKey = `${classId}_${studentId}`;
  
  // Fast pre-check
  try {
    const serialized = JSON.stringify(studentData ?? null);
    if (enrollCache[syncKey] === serialized && !immediate) {
      return;
    }
  } catch (e) { /* ignore */ }

  if (enrollTimeouts[syncKey]) {
    clearTimeout(enrollTimeouts[syncKey]);
    delete enrollTimeouts[syncKey];
  }
  
  const performWrite = async () => {
    if (isFirestoreQuotaExceeded()) return;
    try {
      const sanitizedData = JSON.parse(JSON.stringify(studentData));
      const serialized = JSON.stringify(sanitizedData);
      const docRef = doc(db, 'classes', classId, 'students', studentId);
      await setDoc(docRef, sanitizedData, { merge: true });
      enrollCache[syncKey] = serialized;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
        markFirestoreQuotaExceeded(4);
      } else {
        console.error('Failed to enroll student globally:', error);
      }
    }
  };

  if (immediate) {
    await performWrite();
  } else {
    enrollTimeouts[syncKey] = setTimeout(performWrite, 1200);
  }
}

export async function fetchTeacherBookDataGlobal(teacherId: string, bookId: string): Promise<{ book?: any; chapters?: any[]; items?: any[] } | null> {
  if (!db || isFirestoreQuotaExceeded() || !teacherId) return null;
  try {
    const booksDoc = await getDoc(doc(db, 'user_data', teacherId, 'app_state', 'books'));
    if (booksDoc.exists()) {
      const teacherBooks = booksDoc.data().data || [];
      const targetBook = teacherBooks.find((b: any) => b.id === bookId);
      if (targetBook) {
        const chapDoc = await getDoc(doc(db, 'user_data', teacherId, 'app_state', 'chapters'));
        const itemDoc = await getDoc(doc(db, 'user_data', teacherId, 'app_state', 'items'));
        const teacherChapters = chapDoc.exists() ? (chapDoc.data().data || []).filter((c: any) => c.bookId === bookId) : [];
        const teacherItems = itemDoc.exists() ? (itemDoc.data().data || []).filter((i: any) => i.bookId === bookId) : [];
        return {
          book: targetBook,
          chapters: teacherChapters,
          items: teacherItems,
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch teacher book data:', e);
  }
  return null;
}

export async function fetchClassStudentsGlobal(classId: string): Promise<any[]> {
  if (!db || isFirestoreQuotaExceeded()) return [];
  try {
    const q = query(collection(db, 'classes', classId, 'students'));
    const querySnapshot = await getDocs(q);
    const students: any[] = [];
    querySnapshot.forEach((docSnap) => {
      students.push(docSnap.data());
    });
    return students;
  } catch (error) {
    console.error('Failed to fetch class students:', error);
    return [];
  }
}

export async function getTeacherTeachingClasses(teacherId: string): Promise<any[]> {
  if (!db || isFirestoreQuotaExceeded()) return [];
  try {
    const docRef = doc(db, 'user_data', teacherId, 'app_state', 'teaching_classes');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().data || [];
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
    } else {
      console.error('Failed to fetch teacher teaching classes:', error);
    }
  }
  return [];
}

export async function updateTeacherTeachingClasses(teacherId: string, classesData: any[]): Promise<void> {
  if (!db || isFirestoreQuotaExceeded()) return;
  try {
    const docRef = doc(db, 'user_data', teacherId, 'app_state', 'teaching_classes');
    const sanitizedData = JSON.parse(JSON.stringify(classesData));
    await setDoc(docRef, { data: sanitizedData, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn('[Firestore] Quota reached during updateTeacherTeachingClasses.');
    } else {
      console.error('Failed to update teacher teaching classes:', error);
    }
  }
}

export async function removeStudentFromGlobalClass(classId: string, studentId: string): Promise<void> {
  if (!db || isFirestoreQuotaExceeded()) return;
  try {
    const docRef = doc(db, 'classes', classId, 'students', studentId);
    // Delete the student doc from the class
    await deleteDoc(docRef);
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
    } else {
      console.error('Failed to remove student globally:', error);
    }
  }
}

export const listenToFirestore = (userId: string, key: string, callback: (data: any) => void): (() => void) | null => {
  if (!userId || userId === 'guest') return null;
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, 'user_data', userId, 'app_state', key);
    const unsubscribe = onSnapshot(
      docRef, 
      (snap: any) => {
        if (snap.exists()) {
          callback(snap.data().data);
        }
      },
      (error: any) => {
        const errMsg = error?.message || String(error);
        if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
          markFirestoreQuotaExceeded(4);
          console.warn(`[Firestore] Listener for ${key} suspended due to quota limit.`);
        } else {
          console.warn(`Firestore listen notice for ${key}:`, errMsg);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error(`Error listening to ${key} from Firestore:`, error);
  }
  return null;
};

export const listenToClassStudentsGlobal = (classId: string, callback: (students: any[]) => void): (() => void) | null => {
  if (!db || !classId) return null;
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const q = query(collection(db, 'classes', classId, 'students'));
    const unsubscribe = onSnapshot(
      q, 
      (snapshot: any) => {
        const students: any[] = [];
        snapshot.forEach((docSnap: any) => {
          students.push(docSnap.data());
        });
        callback(students);
      },
      (error: any) => {
        const errMsg = error?.message || String(error);
        if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
          markFirestoreQuotaExceeded(4);
          console.warn(`[Firestore] Class students listener suspended due to quota limit.`);
        } else {
          console.warn('Class students listener notice:', errMsg);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to listen to class students:', error);
    return null;
  }
};

export const listenToStudentInClassGlobal = (classId: string, studentId: string, callback: (studentData: any) => void): (() => void) | null => {
  if (!db || !classId || !studentId) return null;
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, 'classes', classId, 'students', studentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: any) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      (error: any) => {
        const errMsg = error?.message || String(error);
        if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
          markFirestoreQuotaExceeded(4);
        } else {
          console.warn('Student in class listener notice:', errMsg);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to listen to student in class:', error);
    return null;
  }
};

export async function updateStudentInClassGlobal(classId: string, studentId: string, studentData: any): Promise<void> {
  return enrollStudentInGlobalClass(classId, studentId, studentData, true);
}
