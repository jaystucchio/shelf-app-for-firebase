'use client'

import { useState, useEffect, useCallback } from 'react'
import { TabBar, TabId } from '@/components/tab-bar'
import { LogSession } from '@/components/log-session'
import { Diary } from '@/components/diary'
import { Shelf } from '@/components/shelf'
import { getSessions } from '@/lib/storage'
import { ReadingSession } from '@/lib/types'

export default function FolioApp() {
  const [activeTab, setActiveTab] = useState<TabId>('log')
  const [sessions, setSessions] = useState<ReadingSession[]>([])

  const refreshSessions = useCallback(() => {
    setSessions(getSessions())
  }, [])

  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[430px] mx-auto px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">Folio</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[430px] mx-auto px-5 pt-6 pb-24">
        <div
          className={activeTab === 'log' ? 'animate-in fade-in duration-300' : 'hidden'}
        >
          <LogSession onSessionSaved={refreshSessions} />
        </div>

        <div
          className={activeTab === 'diary' ? 'animate-in fade-in duration-300' : 'hidden'}
        >
          <Diary sessions={sessions} />
        </div>

        <div
          className={activeTab === 'shelf' ? 'animate-in fade-in duration-300' : 'hidden'}
        >
          <Shelf sessions={sessions} />
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
