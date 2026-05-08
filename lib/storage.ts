import { ReadingSession, Book } from './types'

const STORAGE_KEY = 'folio-sessions'
const FAVORITES_KEY = 'folio-favorites'
const BOOK_COVERS_KEY = 'folio-book-covers'

export function getSessions(): ReadingSession[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveSession(session: ReadingSession): void {
  const sessions = getSessions()
  sessions.unshift(session)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function getFavorites(): Book[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(FAVORITES_KEY)
  return data ? JSON.parse(data) : []
}

export function saveFavorites(favorites: Book[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export function getBookCovers(): {[key: string]: string} {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem(BOOK_COVERS_KEY)
  return data ? JSON.parse(data) : {}
}

export function saveBookCovers(covers: {[key: string]: string}): void {
  localStorage.setItem(BOOK_COVERS_KEY, JSON.stringify(covers))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
