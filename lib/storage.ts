
import { ReadingSession, Book } from './types';
import { db } from './firebase'; // Assuming you have initialized Firebase and exported db
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

const SESSIONS_COLLECTION = 'sessions';
const FAVORITES_COLLECTION = 'favorites';
const BOOK_COVERS_COLLECTION = 'bookCovers';

export async function getSessions(): Promise<ReadingSession[]> {
  if (!db) return [];
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    orderBy('startTime', 'desc'),
    limit(100)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as ReadingSession);
}

export async function saveSession(session: ReadingSession): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, SESSIONS_COLLECTION), session);
}

export async function getFavorites(): Promise<Book[]> {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, FAVORITES_COLLECTION));
  return querySnapshot.docs.map((doc) => doc.data() as Book);
}

export async function saveFavorites(favorites: Book[]): Promise<void> {
  if (!db) return;
  const favoritesCollection = collection(db, FAVORITES_COLLECTION);
  // This will overwrite all favorites. Be careful!
  // A better approach would be to add/remove individual favorites.
  for (const favorite of favorites) {
    await addDoc(favoritesCollection, favorite);
  }
}

export async function getBookCovers(): Promise<{[key: string]: string}> {
    if (!db) return {};
    const querySnapshot = await getDocs(collection(db, BOOK_COVERS_COLLECTION));
    const covers: {[key: string]: string} = {};
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        covers[data.bookKey] = data.coverUrl;
    });
    return covers;
}

export async function saveBookCovers(covers: {[key: string]: string}): Promise<void> {
    if (!db) return;
    const bookCoversCollection = collection(db, BOOK_COVERS_COLLECTION);
    for (const bookKey in covers) {
        await addDoc(bookCoversCollection, { bookKey, coverUrl: covers[bookKey] });
    }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
