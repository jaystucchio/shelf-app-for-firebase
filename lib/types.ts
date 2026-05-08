export interface Book {
  key: string
  title: string
  author: string
  year?: number
  coverId?: number
  totalPages?: number
  ratingsAverage?: number
  ratingsCount?: number
}

export type ReadingStatus = 'reading' | 'finished' | 'want-to-read' | 'did-not-finish'
export type DNFReason = 'did-not-enjoy' | 'too-slow' | 'not-my-genre' | 'other'

export interface ReadingSession {
  id: string
  book: Book
  rating: number
  status: ReadingStatus
  pagesRead: number
  note: string
  promptLabel?: string
  dnfReason?: DNFReason
  createdAt: string
}

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  'reading': 'Currently Reading',
  'finished': 'Finished',
  'want-to-read': 'Want to read',
  'did-not-finish': 'Did not finish',
}

export const DNF_REASONS: Record<DNFReason, string> = {
  'did-not-enjoy': 'Did not enjoy',
  'too-slow': 'Too slow',
  'not-my-genre': 'Not my genre',
  'other': 'Other',
}
