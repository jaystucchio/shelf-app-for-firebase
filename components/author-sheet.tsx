'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Book as BookIcon, User, Loader2 } from 'lucide-react'
import { Book } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface AuthorSheetProps {
  authorName: string
  isOpen: boolean
  onClose: () => void
}

interface OpenLibraryAuthorResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
}

export function AuthorSheet({ authorName, isOpen, onClose }: AuthorSheetProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const fetchAuthorBooks = useCallback(async () => {
    if (!authorName || authorName === 'Unknown Author') return
    
    setIsLoading(true)
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=20&sort=editions`
      )
      const data = await res.json()
      const authorBooks: Book[] = data.docs
        .filter((doc: OpenLibraryAuthorResult) => 
          doc.author_name?.some(name => 
            name.toLowerCase() === authorName.toLowerCase()
          )
        )
        .map((doc: OpenLibraryAuthorResult) => ({
          key: doc.key,
          title: doc.title,
          author: doc.author_name?.[0] || authorName,
          year: doc.first_publish_year,
          coverId: doc.cover_i,
        }))
      setBooks(authorBooks)
    } catch (error) {
      console.error('Failed to fetch author books:', error)
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }, [authorName])

  useEffect(() => {
    if (isOpen) {
      fetchAuthorBooks()
    }
  }, [isOpen, fetchAuthorBooks])

  if (!isOpen) return null

  // If a book is selected, show its details inline
  if (selectedBook) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div 
          className="absolute inset-0 bg-black/60" 
          onClick={() => setSelectedBook(null)}
        />
        <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button 
              onClick={() => setSelectedBook(null)}
              className="text-sm text-primary hover:underline"
            >
              Back to {authorName}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBook(null)
                onClose()
              }}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Book Content */}
          <div className="p-6">
            <div className="flex gap-4">
              {selectedBook.coverId ? (
                <img
                  src={`https://covers.openlibrary.org/b/id/${selectedBook.coverId}-L.jpg`}
                  alt={selectedBook.title}
                  className="w-28 h-auto rounded-lg shadow-lg shrink-0"
                />
              ) : (
                <div className="w-28 h-40 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                  <BookIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight text-balance">{selectedBook.title}</h2>
                <p className="mt-2 text-primary font-medium">{selectedBook.author}</p>
                {selectedBook.year && (
                  <p className="text-sm text-muted-foreground mt-1">
                    First published {selectedBook.year}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="h-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl border border-border overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{authorName}</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : `${books.length} books found`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Books List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No books found for this author</p>
            </div>
          ) : (
            <div className="space-y-2">
              {books.map((book) => (
                <button
                  key={book.key}
                  onClick={() => setSelectedBook(book)}
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
                    {book.year && (
                      <p className="text-sm text-muted-foreground">{book.year}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Safe area padding */}
        <div className="h-8 shrink-0" />
      </div>
    </div>
  )
}
