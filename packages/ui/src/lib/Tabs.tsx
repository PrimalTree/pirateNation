"use client";
import * as React from 'react';

export type TabItem = { id: string; label: string; content: React.ReactNode };

export function Tabs({ items, defaultTab, onChange, className = '' }: { items: TabItem[]; defaultTab?: string; onChange?: (id: string) => void; className?: string }) {
  const [active, setActive] = React.useState<string>(defaultTab ?? items[0]?.id);
  React.useEffect(() => { if (defaultTab) setActive(defaultTab); }, [defaultTab]);

  function select(id: string) {
    setActive(id);
    onChange?.(id);
  }

  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className={className}>
      <div role="tablist" aria-orientation="horizontal" className="mb-2 flex gap-2 border-b border-white/10">
        {items.map((i) => (
          <button
            key={i.id}
            role="tab"
            aria-selected={i.id === activeItem?.id}
            aria-controls={`panel-${i.id}`}
            id={`tab-${i.id}`}
            onClick={() => select(i.id)}
            className={[
              'rounded-t-md px-3 py-2 text-sm',
              i.id === activeItem?.id ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
            ].join(' ')}
          >
            {i.label}
          </button>
        ))}
      </div>
      {activeItem && (
        <div
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          className="rounded-b-md border border-white/10 p-3"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}

