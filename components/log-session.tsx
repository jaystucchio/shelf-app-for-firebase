'use client'

import { useState, useCallback, useRef } from 'react'
import { Search, Book as BookIcon, Check, X, ChevronDown, Sparkles, Loader2, Barcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/star-rating'
import { Book, ReadingStatus, STATUS_LABELS, DNF_REASONS } from '@/lib/types'
import { saveSession, generateId } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface OpenLibraryResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  number_of_pages?: number
  ratings_average?: number
  ratings_count?: number
}

interface LogSessionProps {
  onSessionSaved: () => void
}

const REFLECTION_PROMPTS = [
  { id: 'general', label: 'General thoughts', prompt: 'Share your general thoughts on this reading session.' },
  { id: 'learned', label: 'What I learned', prompt: 'What did you learn or take away from this reading?' },
  { id: 'favorite', label: 'Favorite moment', prompt: 'What was your favorite moment, scene, or passage?' },
  { id: 'character', label: 'Character thoughts', prompt: 'What do you think about the characters?' },
  { id: 'feeling', label: 'How it made me feel', prompt: 'How did this reading make you feel?' },
  { id: 'quote', label: 'Memorable quote', prompt: 'Was there a quote or line that stood out to you?' },
  { id: 'connection', label: 'Personal connection', prompt: 'Did anything connect to your own life or experiences?' },
  { id: 'question', label: 'Questions I have', prompt: 'What questions do you have after this reading?' },
]

export function LogSession({ onSessionSaved }: LogSessionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [rating, setRating] = useState(0)
  const [status, setStatus] = useState<ReadingStatus>('reading')
  const [pagesRead, setPagesRead] = useState('')
  const [note, setNote] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dnfReason, setDnfReason] = useState<'did-not-enjoy' | 'too-slow' | 'not-my-genre' | 'other' | ''>('')
  
  // Reflection prompts state
  const [selectedPrompt, setSelectedPrompt] = useState(REFLECTION_PROMPTS[0])
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const searchBooks = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages,ratings_average,ratings_count`
      )
      const data = await res.json()
      const books: Book[] = data.docs.map((doc: OpenLibraryResult) => ({
        key: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || 'Unknown Author',
        year: doc.first_publish_year,
        coverId: doc.cover_i,
        totalPages: doc.number_of_pages,
        ratingsAverage: doc.ratings_average,
        ratingsCount: doc.ratings_count,
      }))
      // Sort by ratings count (popularity/relevance)
      books.sort((a, b) => (b.ratingsCount || 0) - (a.ratingsCount || 0))
      setResults(books)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    const debounceTimer = setTimeout(() => searchBooks(value), 300)
    return () => clearTimeout(debounceTimer)
  }

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book)
    setResults([])
    setQuery('')
  }

  const handleClearBook = () => {
    setSelectedBook(null)
    setRating(0)
    setStatus('reading')
    setPagesRead('')
    setNote('')
    setDnfReason('')
    setSelectedPrompt(REFLECTION_PROMPTS[0])
  }

  const handleSelectPrompt = (prompt: typeof REFLECTION_PROMPTS[0]) => {
    setSelectedPrompt(prompt)
    setIsPromptDropdownOpen(false)
  }

  const handleAIAssist = async () => {
    if (!selectedBook) return
    
    setIsGeneratingAI(true)
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: selectedBook.title,
          bookAuthor: selectedBook.author,
          prompt: selectedPrompt.prompt,
          userThoughts: note,
        }),
      })
      
      const data = await res.json()
      if (data.text) {
        if (note.trim()) {
          setNote(note + '\n\n' + data.text)
        } else {
          setNote(data.text)
        }
      }
    } catch (error) {
      console.error('AI assist failed:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSave = () => {
    if (!selectedBook) return
    if (status === 'did-not-finish' && !dnfReason) {
      alert('Please select why you stopped reading')
      return
    }

    setIsSaving(true)
    
    const session = {
      id: generateId(),
      book: selectedBook,
      rating: status === 'finished' ? rating : 0,
      status,
      pagesRead: parseInt(pagesRead) || 0,
      note,
      promptLabel: selectedPrompt.label,
      dnfReason: status === 'did-not-finish' ? (dnfReason as 'did-not-enjoy' | 'too-slow' | 'not-my-genre' | 'other') : undefined,
      createdAt: new Date().toISOString(),
    }

    saveSession(session)
    
    // Reset form
    setSelectedBook(null)
    setRating(0)
    setStatus('reading')
    setPagesRead('')
    setNote('')
    setDnfReason('')
    setSelectedPrompt(REFLECTION_PROMPTS[0])
    setIsSaving(false)
    
    onSessionSaved()
  }

  const handleBarcodeClick = () => {
    fileInputRef.current?.click()
  }

  const statuses: ReadingStatus[] = ['reading', 'finished', 'want-to-read', 'did-not-finish']

  const ratingLabel = status === 'finished' ? 'Your Rating' : 'Notes & Annotations'

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Log Session</h1>
        <p className="text-sm text-muted-foreground">Record your reading progress</p>
      </div>

      {/* Book Search */}
      {!selectedBook && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a book..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <button
              onClick={handleBarcodeClick}
              className="p-2.5 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              title="Scan barcode"
            >
              <Barcode className="h-5 w-5 text-muted-foreground" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                // Barcode scanner would be implemented here with a library like jsQR or react-qr-reader
                // For now, this is a placeholder
              }}
            />
          </div>

          {isSearching && (
            <p className="text-sm text-muted-foreground animate-pulse">Searching...</p>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((book) => (
                <button
                  key={book.key}
                  onClick={() => handleSelectBook(book)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
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
                    <p className="font-medium truncate">{book.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {book.author}
                      {book.year && ` · ${book.year}`}
                    </p>
                    {book.ratingsAverage && (
                      <p className="text-xs text-primary mt-1">
                        ★ {book.ratingsAverage.toFixed(1)} {book.ratingsCount ? `(${book.ratingsCount.toLocaleString()})` : ''}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Book */}
      {selectedBook && (
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
            {selectedBook.coverId ? (
              <img
                src={`https://covers.openlibrary.org/b/id/${selectedBook.coverId}-M.jpg`}
                alt={selectedBook.title}
                className="w-16 h-24 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-16 h-24 bg-secondary rounded-lg flex items-center justify-center">
                <BookIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight">{selectedBook.title}</h3>
              <p className="text-muted-foreground mt-0.5">
                {selectedBook.author}
                {selectedBook.year && ` · ${selectedBook.year}`}
              </p>
              {selectedBook.ratingsAverage && (
                <p className="text-sm text-primary mt-1.5">
                  ★ {selectedBook.ratingsAverage.toFixed(1)} ({selectedBook.ratingsCount?.toLocaleString()} ratings)
                </p>
              )}
            </div>
            <button
              onClick={handleClearBook}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Reading Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    if (s !== 'did-not-finish') setDnfReason('')
                    if (s !== 'finished') setRating(0)
                  }}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border',
                    status === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* DNF Reason - Only show when status is "did-not-finish" */}
          {status === 'did-not-finish' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Why did you stop?</label>
              <select
                value={dnfReason}
                onChange={(e) => setDnfReason(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a reason...</option>
                {Object.entries(DNF_REASONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rating - Only show when status is "finished" */}
          {status === 'finished' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Your Rating</label>
              <StarRating rating={rating} onRate={setRating} size="lg" />
            </div>
          )}

          {/* Pages Read */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Pages Read Today</label>
            <Input
              type="number"
              placeholder="0"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          {/* Reflection Prompt Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Notes & Annotations</label>
            <div className="relative">
              <button
                onClick={() => setIsPromptDropdownOpen(!isPromptDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
              >
                <span className="font-medium">{selectedPrompt.label}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isPromptDropdownOpen && "rotate-180"
                )} />
              </button>
              
              {isPromptDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 py-1 rounded-lg bg-card border border-border shadow-lg max-h-64 overflow-y-auto">
                  {REFLECTION_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left hover:bg-secondary transition-colors",
                        selectedPrompt.id === prompt.id && "bg-secondary/50"
                      )}
                    >
                      <span className="font-medium">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note with AI Assist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                {selectedPrompt.prompt}
              </label>
              <button
                onClick={handleAIAssist}
                disabled={isGeneratingAI}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  "bg-primary/10 text-primary hover:bg-primary/20",
                  isGeneratingAI && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingAI ? 'Thinking...' : 'AI Assist'}
              </button>
            </div>
            <Textarea
              placeholder={note ? "Continue your thoughts..." : "Start writing, or tap AI Assist for inspiration..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="bg-card border-border resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-6 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Save Session
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
