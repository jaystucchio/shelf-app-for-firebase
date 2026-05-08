'use client'

import { useState, useEffect, useCallback } from 'react'
import { Book as BookIcon, BookOpen, Library, FileText, Heart, Plus, X, Search } from 'lucide-react'
import { StarRating } from '@/components/star-rating'
import { BookDetailSheet } from '@/components/book-detail-sheet'
import { ReadingSession, Book, STATUS_LABELS } from '@/lib/types'
import { getFavorites, saveFavorites } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShelfProps {
  sessions: ReadingSession[]
}

interface BookSummary {
  book: Book
  latestStatus: typeof sessions[0]['status']
  latestRating: number
  sessionCount: number
  totalPagesRead: number
}

interface OpenLibraryResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
}

export function Shelf({ sessions }: ShelfProps) {
  const [favorites, setFavorites] = useState<Book[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  // Calculate stats - ONLY for finished books
  const finishedSessions = sessions.filter(s => s.status === 'finished')
  const totalFinishedSessions = finishedSessions.length
  const totalFinishedPages = finishedSessions.reduce((sum, s) => sum + s.pagesRead, 0)
  
  // Get unique books with their latest status/rating
  const bookMap = new Map<string, BookSummary>()
  
  for (const session of sessions) {
    const key = session.book.key
    if (!bookMap.has(key)) {
      bookMap.set(key, {
        book: session.book,
        latestStatus: session.status,
        latestRating: session.rating,
        sessionCount: 1,
        totalPagesRead: session.pagesRead,
      })
    } else {
      const existing = bookMap.get(key)!
      existing.sessionCount++
      existing.totalPagesRead += session.pagesRead
      // Update status/rating to latest (most recent session)
      const existingSessions = sessions.filter(s => s.book.key === key)
      if (existingSessions.length > 0) {
        const latest = existingSessions[0]
        existing.latestStatus = latest.status
        existing.latestRating = latest.rating
      }
    }
  }
  
  const uniqueBooks = Array.from(bookMap.values())
  
  // Separate reading and finished books for "Reading Activity"
  const currentlyReadingBooks = uniqueBooks.filter(b => b.latestStatus === 'reading').sort((a, b) => new Date(sessions.find(s => s.book.key === b.book.key)?.createdAt || '').getTime() - new Date(sessions.find(s => s.book.key === a.book.key)?.createdAt || '').getTime())
  const finishedBooks = uniqueBooks.filter(b => b.latestStatus === 'finished')
  const readingActivityBooks = [...currentlyReadingBooks, ...finishedBooks]
  
  // Books marked as "want-to-read"
  const wantToReadBooks = uniqueBooks.filter(b => b.latestStatus === 'want-to-read').sort((a, b) => {
    const aSession = sessions.find(s => s.book.key === a.book.key)
    const bSession = sessions.find(s => s.book.key === b.book.key)
    return new Date(bSession?.createdAt || '').getTime() - new Date(aSession?.createdAt || '').getTime()
  })
  
  const favoriteKeys = new Set(favorites.map(b => b.key))

  const searchBooks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`
      )
      const data = await res.json()
      const books: Book[] = data.docs.map((doc: OpenLibraryResult) => ({
        key: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || 'Unknown Author',
        year: doc.first_publish_year,
        coverId: doc.cover_i,
      }))
      // Filter out books already in favorites
      setSearchResults(books.filter(book => !favoriteKeys.has(book.key)))
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [favoriteKeys])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    const debounceTimer = setTimeout(() => searchBooks(value), 300)
    return () => clearTimeout(debounceTimer)
  }

  const handleAddFavorite = (book: Book) => {
    if (favorites.length >= 4) return
    const newFavorites = [...favorites, book]
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
    setShowPicker(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveFavorite = (bookKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFavorites = favorites.filter(b => b.key !== bookKey)
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
  }

  const handleClosePicker = () => {
    setShowPicker(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Calculate % read
  const getPercentRead = (session: ReadingSession): number | null => {
    if (!session.book.totalPages || session.book.totalPages === 0) return null
    return Math.round((session.pagesRead / session.book.totalPages) * 100)
  }

  const uniqueFinishedBooks = new Set(finishedSessions.map(s => s.book.key)).size

  const stats = [
    { label: 'Books', value: uniqueFinishedBooks, icon: Library },
    { label: 'Sessions', value: totalFinishedSessions, icon: FileText },
    { label: 'Pages', value: totalFinishedPages.toLocaleString(), icon: BookOpen },
  ]

  // Favorites Section Component
  const FavoritesSection = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium text-muted-foreground">Favorites</h2>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((index) => {
          const favorite = favorites[index]
          
          if (favorite) {
            return (
              <div key={favorite.key} className="relative group">
                <button
                  onClick={() => setSelectedBook(favorite)}
                  className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {favorite.coverId ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${favorite.coverId}-M.jpg`}
                      alt={favorite.title}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <BookIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </button>
                <button
                  onClick={(e) => handleRemoveFavorite(favorite.key, e)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${favorite.title} from favorites`}
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setSelectedBook(favorite)}
                  className="mt-1.5 text-xs font-medium truncate block w-full text-left hover:text-primary transition-colors"
                >
                  {favorite.title}
                </button>
              </div>
            )
          }
          
          return (
            <button
              key={`empty-${index}`}
              onClick={() => setShowPicker(true)}
              className="aspect-[2/3] rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center"
              aria-label="Add a favorite book"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )

  // Favorite Picker Modal
  const FavoritePickerModal = () => (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={handleClosePicker}
      />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl border border-border p-4 pb-8 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Add to Favorites</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClosePicker}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search any book..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-secondary border-border"
            autoFocus
          />
        </div>

        {isSearching && (
          <p className="text-sm text-muted-foreground animate-pulse px-1">Searching...</p>
        )}
        
        <div className="overflow-y-auto flex-1 space-y-2">
          {searchResults.length > 0 ? (
            searchResults.map((book) => (
              <button
                key={book.key}
                onClick={() => handleAddFavorite(book)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                {book.coverId ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.coverId}-S.jpg`}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                    <BookIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{book.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {book.author}
                    {book.year && ` · ${book.year}`}
                  </p>
                </div>
                <Plus className="h-5 w-5 text-primary shrink-0" />
              </button>
            ))
          ) : searchQuery.length >= 2 && !isSearching ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No books found. Try a different search.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Search for any book to add to your favorites
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Shelf</h1>
          <p className="text-sm text-muted-foreground">Your book collection</p>
        </div>
        
        {/* Stats - show zeros for finished only */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-4 rounded-xl bg-card border border-border"
            >
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Favorites Section */}
        <FavoritesSection />

        {/* Favorite Picker Modal */}
        {showPicker && <FavoritePickerModal />}

        {/* Book Detail Sheet */}
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            isOpen={!!selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Library className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">Your shelf is empty</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Books you log will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Shelf</h1>
        <p className="text-sm text-muted-foreground">Your book collection</p>
      </div>

      {/* Stats - Only for finished books */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center p-4 rounded-xl bg-card border border-border"
          >
            <stat.icon className="h-5 w-5 text-primary mb-2" />
            <span className="text-2xl font-bold">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Favorites Section */}
      <FavoritesSection />

      {/* Favorite Picker Modal */}
      {showPicker && <FavoritePickerModal />}

      {/* Reading Activity Section */}
      {readingActivityBooks.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Reading Activity</h2>
          <div className="space-y-2">
            {readingActivityBooks.map(({ book, latestStatus, latestRating, totalPagesRead }) => {
              const percentRead = getPercentRead(sessions.find(s => s.book.key === book.key && s.pagesRead > 0)!)
              return (
                <button
                  key={book.key}
                  onClick={() => setSelectedBook(book)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                >
                  {book.coverId ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.coverId}-S.jpg`}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                      <BookIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{book.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {latestRating > 0 && latestStatus === 'finished' && (
                        <StarRating rating={latestRating} size="sm" readonly />
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                        {latestStatus === 'reading' ? 'Currently Reading' : 'Finished'}
                      </span>
                      {latestStatus === 'reading' && percentRead !== null && (
                        <span className="text-xs text-muted-foreground">{percentRead}% read</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* To Be Read Section */}
      {wantToReadBooks.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">To Be Read</h2>
          <div className="space-y-2">
            {wantToReadBooks.map(({ book }) => (
              <button
                key={book.key}
                onClick={() => setSelectedBook(book)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
              >
                {book.coverId ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.coverId}-S.jpg`}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                    <BookIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{book.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Book Detail Sheet */}
      {selectedBook && (
        <BookDetailSheet
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  )
}
