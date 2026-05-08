'use client'

import { PenLine, BookOpen, Library } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'log' | 'diary' | 'shelf'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs = [
  { id: 'log' as const, label: 'Log', icon: PenLine },
  { id: 'diary' as const, label: 'Diary', icon: BookOpen },
  { id: 'shelf' as const, label: 'Shelf', icon: Library },
]

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="max-w-[430px] mx-auto flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-3 px-6 transition-colors duration-200',
              activeTab === tab.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon
              className={cn(
                'h-6 w-6 transition-transform duration-200',
                activeTab === tab.id && 'scale-110'
              )}
            />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
