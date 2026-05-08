'use client'

import { useState } from 'react'
import { X, Book as BookIcon, ExternalLink } from 'lucide-react'
import { Book } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { AuthorSheet } from '@/components/author-sheet'

interface BookDetailSheetProps {
  book: Book
  isOpen: boolean
  onClose: () => void
}

export function BookDetailSheet({ book, isOpen, onClose }: BookDetailSheetProps) {
  const [showAuthor, setShowAuthor] = useState(false)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div 
          className="absolute inset-0 bg-black/60" 
          onClick={onClose}
        />
        <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Book Details</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex gap-4">
              {/* Cover */}
              <div className="shrink-0">
                {book.coverId ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`}
                    alt={book.title}
                    className="w-28 h-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-40 bg-secondary rounded-lg flex items-center justify-center">
                    <BookIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight text-balance">{book.title}</h2>
                
                <button
                  onClick={() => setShowAuthor(true)}
                  className="mt-2 text-primary hover:underline text-left font-medium"
                >
                  {book.author}
                </button>

                {book.year && (
                  <p className="text-sm text-muted-foreground mt-1">
                    First published {book.year}
                  </p>
                )}

                <a
                  href={`https://openlibrary.org${book.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on Open Library
                </a>
              </div>
            </div>
          </div>

          {/* Safe area padding */}
          <div className="h-8" />
        </div>
      </div>

      {/* Author Sheet */}
      <AuthorSheet 
        authorName={book.author}
        isOpen={showAuthor}
        onClose={() => setShowAuthor(false)}
      />
    </>
  )
}
