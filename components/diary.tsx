'use client'

import { useState } from 'react'
import { Book as BookIcon, ChevronDown, X } from 'lucide-react'
import { StarRating } from '@/components/star-rating'
import { ReadingSession, STATUS_LABELS, Book } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface DiaryProps {
  sessions: ReadingSession[]
}

interface BookGrouping {
  book: Book
  sessions: ReadingSession[]
  latestStatus: typeof sessions[0]['status']
  latestRating: number
}

export function Diary({ sessions }: DiaryProps) {
  const [expandedBook, setExpandedBook] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<ReadingSession | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Diary</h1>
          <p className="text-sm text-muted-foreground">Your reading journal</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <BookIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">No entries yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start by logging your first reading session
          </p>
        </div>
      </div>
    )
  }

  // Group sessions by book
  const bookMap = new Map<string, BookGrouping>()
  for (const session of sessions) {
    const key = session.book.key
    if (!bookMap.has(key)) {
      bookMap.set(key, {
        book: session.book,
        sessions: [session],
        latestStatus: session.status,
        latestRating: session.rating,
      })
    } else {
      const group = bookMap.get(key)!
      group.sessions.push(session)
      // Keep the latest (most recent) status and rating
      if (new Date(session.createdAt) > new Date(group.sessions[0].createdAt)) {
        group.latestStatus = session.status
        group.latestRating = session.rating
      }
    }
  }

  const groupedBooks = Array.from(bookMap.values())

  // Calculate % read
  const getPercentRead = (session: ReadingSession): number | null => {
    if (!session.book.totalPages || session.book.totalPages === 0) return null
    return Math.round((session.pagesRead / session.book.totalPages) * 100)
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Diary</h1>
        <p className="text-sm text-muted-foreground">Your reading journal</p>
      </div>

      <div className="space-y-3">
        {groupedBooks.map((group) => (
          <div key={group.book.key}>
            {/* Book Tile - Expandable */}
            <button
              onClick={() => setExpandedBook(expandedBook === group.book.key ? null : group.book.key)}
              className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex gap-3 items-start">
                {group.book.coverId ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${group.book.coverId}-S.jpg`}
                    alt={group.book.title}
                    className="w-12 h-18 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-18 bg-secondary rounded-lg flex items-center justify-center">
                    <BookIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight truncate">{group.book.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{group.book.author}</p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {group.latestRating > 0 && group.latestStatus === 'finished' && (
                      <StarRating rating={group.latestRating} size="sm" readonly />
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {STATUS_LABELS[group.latestStatus]}
                    </span>
                    {group.latestStatus !== 'finished' && (
                      <span className="text-xs text-muted-foreground">
                        {group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 mt-1',
                    expandedBook === group.book.key && 'rotate-180'
                  )}
                />
              </div>
            </button>

            {/* Expanded Sessions List */}
            {expandedBook === group.book.key && (
              <div className="mt-2 ml-4 border-l-2 border-border pl-4 space-y-2">
                {group.sessions.map((session) => {
                  const percentRead = getPercentRead(session)
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                        {session.rating > 0 && session.status === 'finished' && (
                          <span className="text-xs text-primary">★ {session.rating}/5</span>
                        )}
                      </div>
                      {session.note && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{session.note}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {session.pagesRead > 0 && <span>{session.pagesRead} pages</span>}
                        {percentRead !== null && session.status !== 'finished' && (
                          <>
                            {session.pagesRead > 0 && <span>·</span>}
                            <span>{percentRead}% read</span>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedSession(null)}
          />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl border border-border p-6 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex gap-4 mb-6">
              {selectedSession.book.coverId ? (
                <img
                  src={`https://covers.openlibrary.org/b/id/${selectedSession.book.coverId}-M.jpg`}
                  alt={selectedSession.book.title}
                  className="w-16 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-24 bg-secondary rounded-lg flex items-center justify-center">
                  <BookIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight">{selectedSession.book.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedSession.book.author}</p>
                {selectedSession.book.year && (
                  <p className="text-xs text-muted-foreground">{selectedSession.book.year}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Date</h4>
                <p className="text-sm">
                  {new Date(selectedSession.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Status</h4>
                <p className="text-sm">{STATUS_LABELS[selectedSession.status]}</p>
              </div>

              {selectedSession.status === 'finished' && selectedSession.rating > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Rating</h4>
                  <StarRating rating={selectedSession.rating} size="sm" readonly />
                </div>
              )}

              {selectedSession.status === 'did-not-finish' && selectedSession.dnfReason && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Why you stopped</h4>
                  <p className="text-sm capitalize">{selectedSession.dnfReason.replace('-', ' ')}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Pages Read</h4>
                <p className="text-sm">
                  {selectedSession.pagesRead}
                  {selectedSession.book.totalPages && ` / ${selectedSession.book.totalPages}`}
                  {selectedSession.book.totalPages && (
                    <span className="text-muted-foreground"> ({Math.round((selectedSession.pagesRead / selectedSession.book.totalPages) * 100)}%)</span>
                  )}
                </p>
              </div>

              {selectedSession.note && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Notes & Annotations</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedSession.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
