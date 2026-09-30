'use client'

import { useState } from 'react'

type Tab = { id: string; label: string; content: React.ReactNode }

// Product lists are rendered on the server; tabs only switch which one is visible
export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  return (
    <div>
      <div
        role="tablist"
        aria-label="Добірки"
        className="mb-10 flex flex-wrap justify-center gap-x-8 gap-y-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`border-b pb-1 text-sm transition-colors ${
              active === tab.id
                ? 'border-ink font-semibold text-ink'
                : 'border-transparent font-light text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
