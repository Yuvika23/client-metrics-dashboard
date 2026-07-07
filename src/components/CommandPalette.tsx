import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, TrendingUp, FileText, Moon, CornerDownLeft, Database } from 'lucide-react';
import { formatMetricValue } from '../data/mockData';
import type { Client } from '../data/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClient: Client;
  onSelectClient: (clientId: string) => void;
  onSelectMetric: (metricId: string) => void;
  onSelectView: (view: 'dashboard' | 'reports' | 'management') => void;
  onToggleTheme: () => void;
}

interface CommandItem {
  id: string;
  category: 'Clients' | 'Metrics' | 'Reports' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  clients,
  activeClient,
  onSelectClient,
  onSelectMetric,
  onSelectView,
  onToggleTheme,
}) => {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define commands list dynamically based on active client and static options
  const commands: CommandItem[] = [
    // Client selection
    ...clients.map((c) => ({
      id: `client-${c.id}`,
      category: 'Clients' as const,
      title: `Switch to ${c.name}`,
      subtitle: c.industry,
      icon: <Globe className="w-4 h-4" />,
      action: () => onSelectClient(c.id),
    })),
    // Metric Drill-down selection for the current client
    ...Object.values(activeClient.metrics).map((m) => {
      const data = m.data;
      const lastPoint = data[data.length - 1] || { value: 0 };
      const prevPoint = data[data.length - 2];
      const momDelta = prevPoint && prevPoint.value !== 0
        ? +(((lastPoint.value - prevPoint.value) / prevPoint.value) * 100).toFixed(1)
        : 0;
      const formattedValue = formatMetricValue(lastPoint.value, m.unit);

      return {
        id: `metric-${m.id}`,
        category: 'Metrics' as const,
        title: `Breakdown: ${m.name}`,
        subtitle: `Current: ${formattedValue} (${momDelta >= 0 ? '+' : ''}${momDelta}% MoM)`,
        icon: <TrendingUp className="w-4 h-4" />,
        action: () => onSelectMetric(m.id),
      };
    }),
    // Reports actions
    {
      id: 'view-reports',
      category: 'Reports' as const,
      title: 'Open Scheduled Report Builder',
      subtitle: 'Configure cadence, review PDF/Excel formatted output',
      icon: <FileText className="w-4 h-4" />,
      action: () => onSelectView('reports'),
    },
    {
      id: 'view-management',
      category: 'Reports' as const,
      title: 'Open Workspace Data Management Settings',
      subtitle: 'Edit monthly grids, upload metric CSV spreadsheets, or delete workspaces',
      icon: <Database className="w-4 h-4" />,
      action: () => onSelectView('management'),
    },
    {
      id: 'view-dashboard',
      category: 'Reports' as const,
      title: 'Go to Main Dashboard Overview',
      subtitle: 'Overview of all high-level metrics & asymmetric cards',
      icon: <Globe className="w-4 h-4" />,
      action: () => onSelectView('dashboard'),
    },
    // Actions
    {
      id: 'action-theme',
      category: 'Actions' as const,
      title: 'Toggle Color Palette (Light/Dark Mode)',
      subtitle: 'Switch between warm newsprint paper and ink-dark editorial design',
      icon: <Moon className="w-4 h-4" />,
      action: onToggleTheme,
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    const term = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(term) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(term)) ||
      cmd.category.toLowerCase().includes(term)
    );
  });

  // Handle open/close keyboard events
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      // Let the modal animate in a tiny bit before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation inside the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);

  // Reset index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  // Group filtered commands by category
  const categories: { [key: string]: CommandItem[] } = {};
  filteredCommands.forEach((cmd) => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  });

  // Linear index helper to map filtered list to categorized list render
  let itemCounter = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/30 dark:bg-black/60 backdrop-blur-[2px] transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark shadow-2xl flex flex-col overflow-hidden max-h-[50vh] transition-transform duration-200 transform scale-100">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-paper-border dark:border-paper-borderDark">
          <Search className="w-5 h-5 text-ink-light/50 dark:text-ink-darkLight/50 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 bg-transparent outline-none text-base text-ink dark:text-ink-dark placeholder-ink-light/40 dark:placeholder-ink-darkLight/40 font-sans"
            placeholder="Type a command or search metrics, clients, reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-paper-border dark:border-paper-borderDark bg-paper-card dark:bg-paper-cardDark px-1.5 font-mono text-[10px] font-medium text-ink-light/60 dark:text-ink-darkLight/60">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 scroll-py-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-ink-light/60 dark:text-ink-darkLight/60">
              <p className="font-serif italic text-lg mb-2">No editorial matches found.</p>
              <p className="text-xs font-sans">Try searching another client or active metric.</p>
            </div>
          ) : (
            Object.entries(categories).map(([category, items]) => (
              <div key={category} className="mb-2">
                <h3 className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/40 dark:text-ink-darkLight/40 border-b border-paper-border/30 dark:border-paper-borderDark/30 mb-1">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIndex = itemCounter++;
                    const isActive = currentIndex === activeIndex;
                    return (
                      <div
                        key={item.id}
                        data-index={currentIndex}
                        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors duration-150 ${
                          isActive
                            ? 'bg-paper-card dark:bg-paper-cardDark border-l-2 border-editorial-ochre text-ink dark:text-ink-dark'
                            : 'text-ink-light/70 dark:text-ink-darkLight/70 hover:bg-paper-card/40 dark:hover:bg-paper-cardDark/40'
                        }`}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`p-1 ${isActive ? 'text-editorial-ochre' : 'text-ink-light/40 dark:text-ink-darkLight/40'}`}>
                            {item.icon}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-sans font-medium">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-xs text-ink-light/40 dark:text-ink-darkLight/40 font-sans mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        {isActive && (
                          <span className="text-[10px] text-ink-light/40 dark:text-ink-darkLight/40 font-mono flex items-center gap-1">
                            Select <CornerDownLeft className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Help */}
        <div className="bg-paper-card/60 dark:bg-paper-cardDark/60 px-4 py-2 border-t border-paper-border dark:border-paper-borderDark flex justify-between items-center text-[10px] text-ink-light/50 dark:text-ink-darkLight/50 font-sans">
          <div className="flex gap-4">
            <span>
              <kbd className="border border-paper-border dark:border-paper-borderDark px-1 rounded bg-paper dark:bg-paper-dark">↓↑</kbd> Navigate
            </span>
            <span>
              <kbd className="border border-paper-border dark:border-paper-borderDark px-1 rounded bg-paper dark:bg-paper-dark">Enter</kbd> Select
            </span>
          </div>
          <span>Client Metrics Editorial Desk</span>
        </div>
      </div>
    </div>
  );
};
