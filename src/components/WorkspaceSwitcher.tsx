import React, { useState } from 'react';
import { ChevronDown, Sun, Moon, Calendar, FileText, LayoutGrid, Database } from 'lucide-react';
import type { Client } from '../data/mockData';

interface WorkspaceSwitcherProps {
  clients: Client[];
  activeClient: Client;
  onSelectClient: (clientId: string) => void;
  currentView: 'dashboard' | 'reports' | 'management';
  onSelectView: (view: 'dashboard' | 'reports' | 'management') => void;
  onToggleTheme: () => void;
  isDark: boolean;
  onOpenCommandPalette: () => void;
  username: string;
  onLogout: () => void;
  onCreateClient: (name: string, industry: string, goal: string) => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  clients,
  activeClient,
  onSelectClient,
  currentView,
  onSelectView,
  onToggleTheme,
  isDark,
  onOpenCommandPalette,
  username,
  onLogout,
  onCreateClient,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newIndustry.trim() || !newGoal.trim()) return;
    onCreateClient(newName, newIndustry, newGoal);
    setNewName('');
    setNewIndustry('');
    setNewGoal('');
    setCreateModalOpen(false);
  };

  // Formatted date for editorial masthead
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <header className="border-b border-ink/10 dark:border-ink-dark/15 pt-8 pb-4 mb-8">
      {/* Editorial Masthead Metadata */}
      <div className="flex justify-between items-center text-[11px] font-sans tracking-widest text-ink-light/50 dark:text-ink-darkLight/50 uppercase border-b border-ink/5 dark:border-ink-dark/5 pb-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          {username && (
            <span className="hidden sm:inline text-editorial-ochre font-bold">
              | EDITOR: {username.toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <span>VOLUME VIII / NO. 12</span>
          <span>ESTABLISHED 2026</span>
          <span>CLIENT METRICS EDITORIAL REPORT</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCommandPalette}
            className="hover:text-editorial-ochre transition-colors duration-150 flex items-center gap-1 text-[11px] font-medium tracking-wider"
          >
            <span>COMMANDS:</span>
            <kbd className="border border-paper-border dark:border-paper-borderDark px-1 rounded font-mono text-[9px]">Ctrl+K</kbd>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-[11px] font-bold text-editorial-terracotta hover:underline ml-2 uppercase tracking-widest"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Main Masthead Title / Client Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-baseline gap-4 mb-4">
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <h1 className="font-serif text-3xl md:text-5xl font-black uppercase tracking-tight text-ink dark:text-ink-dark leading-none hover:text-editorial-ochre transition-colors duration-150">
              {activeClient.name}
            </h1>
            <ChevronDown className="w-6 h-6 text-ink-light/40 group-hover:text-editorial-ochre transition-colors duration-150 transform group-hover:translate-y-0.5" />
          </button>

          {/* Elegant Dropdown list */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-72 bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark shadow-xl z-20 overflow-hidden divide-y divide-paper-border dark:divide-paper-borderDark">
                <div className="px-4 py-2 bg-paper-card/50 dark:bg-paper-cardDark/50 text-[10px] uppercase font-bold tracking-widest text-ink-light/40 dark:text-ink-darkLight/40">
                  Select Workspace Client
                </div>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectClient(c.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex flex-col hover:bg-paper-card dark:hover:bg-paper-cardDark transition-colors duration-150 ${
                      c.id === activeClient.id ? 'bg-paper-card/70 dark:bg-paper-cardDark/70 border-l-3 border-editorial-ochre' : ''
                    }`}
                  >
                    <span className="font-serif text-base uppercase font-bold tracking-tight text-ink dark:text-ink-dark">
                      {c.name}
                    </span>
                    <span className="text-xs text-ink-light/50 dark:text-ink-darkLight/50 mt-0.5">
                      {c.industry}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCreateModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left font-sans text-xs uppercase tracking-wider font-bold text-editorial-ochre hover:bg-paper-card dark:hover:bg-paper-cardDark transition-colors duration-150 flex items-center gap-1 bg-paper-card/30"
                >
                  + Register New Client
                </button>
              </div>
            </>
          )}
        </div>

        {/* View Switcher and Palette Toggle */}
        <div className="flex items-center gap-4 self-end w-full lg:w-auto justify-between lg:justify-end">
          <nav className="flex border border-paper-border dark:border-paper-borderDark p-1 font-sans text-xs">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors duration-150 uppercase tracking-wider font-semibold ${
                currentView === 'dashboard'
                  ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark'
                  : 'text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Metrics Board</span>
            </button>
            <button
              onClick={() => onSelectView('reports')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors duration-150 uppercase tracking-wider font-semibold ${
                currentView === 'reports'
                  ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark'
                  : 'text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Builder</span>
            </button>
            <button
              onClick={() => onSelectView('management')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors duration-150 uppercase tracking-wider font-semibold ${
                currentView === 'management'
                  ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark'
                  : 'text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Manage Data</span>
            </button>
          </nav>

          <button
            onClick={onToggleTheme}
            className="p-2 border border-paper-border dark:border-paper-borderDark hover:bg-paper-card dark:hover:bg-paper-cardDark text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark transition-colors duration-150"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-editorial-ochre" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Client Description / Meta Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-ink/5 dark:border-ink-dark/5 text-ink-light/70 dark:text-ink-darkLight/70 font-sans text-xs">
        <div>
          <span className="block uppercase font-bold tracking-widest text-[9px] text-ink-light/40 dark:text-ink-darkLight/40 mb-1">
            Focus Sector
          </span>
          <span className="font-medium text-ink dark:text-ink-dark">{activeClient.industry}</span>
        </div>
        <div className="md:col-span-2">
          <span className="block uppercase font-bold tracking-widest text-[9px] text-ink-light/40 dark:text-ink-darkLight/40 mb-1">
            Primary Performance Objective
          </span>
          <p className="font-serif italic text-sm text-ink dark:text-ink-dark">
            "{activeClient.primaryGoal}."
          </p>
        </div>
      </div>

      {/* Modal for creating a new client workspace */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink/30 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setCreateModalOpen(false)} />
          <div className="relative w-full max-w-md bg-paper dark:bg-paper-dark border-3 border-ink dark:border-ink-dark/30 p-8 shadow-2xl animate-fadeIn">
            <div className="absolute inset-2 border border-ink/5 dark:border-ink-dark/5 pointer-events-none" />
            
            <div className="text-center mb-6">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
                Workspace Manager
              </span>
              <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-ink dark:text-ink-dark mt-1">
                Register Workspace
              </h3>
              <p className="text-xs text-ink-light/60 dark:text-ink-darkLight/60 font-sans mt-1">
                Add a new client workspace. Historical parameters will be dynamically generated.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                  Client Name / Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Organic Tea"
                  className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre text-xs"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                  Focus Sector / Industry
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Agriculture"
                  className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre text-xs"
                  value={newIndustry}
                  onChange={e => setNewIndustry(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                  Primary Performance Objective
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boost online direct-to-consumer sales"
                  className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre text-xs"
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark py-2 font-bold uppercase tracking-wider hover:bg-editorial-ochre transition-colors duration-150"
                >
                  Register Client
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="border border-paper-border dark:border-paper-borderDark text-ink-light/60 dark:text-ink-darkLight/60 py-2 px-4 font-bold uppercase tracking-wider hover:bg-paper-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
