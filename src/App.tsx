import { useState, useEffect } from 'react';
import { DEFAULT_CLIENT, createNewClient } from './data/mockData';
import type { Client, Annotation, MetricData } from './data/mockData';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { KpiCard } from './components/KpiCard';
import { DrillDownView } from './components/DrillDownView';
import { ReportBuilder } from './components/ReportBuilder';
import { CommandPalette } from './components/CommandPalette';
import { DataManagement } from './components/DataManagement';
import { Login } from './components/Login';
import { Info, Eye, EyeOff } from 'lucide-react';

function App() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('sterling_is_logged_in') === 'true';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('sterling_username') || '';
  });

  // Client workspace list state (with localStorage persistence)
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('sterling_clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const initial = [DEFAULT_CLIENT];
    localStorage.setItem('sterling_clients', JSON.stringify(initial));
    return initial;
  });

  const [activeClientId, setActiveClientId] = useState(() => {
    return clients[0]?.id || 'aether';
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'management'>('dashboard');
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  
  // Settings toggles
  const [showGoalLine, setShowGoalLine] = useState(true);
  const [showForecast, setShowForecast] = useState(true);

  // Global state for annotations across clients (with localStorage persistence)
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const saved = localStorage.getItem('sterling_annotations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const initial = clients.flatMap(client => client.annotations);
    localStorage.setItem('sterling_annotations', JSON.stringify(initial));
    return initial;
  });

  // Command palette toggle state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Dark/Light Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle document level keyboard binding for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync dark theme class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync annotations to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sterling_annotations', JSON.stringify(annotations));
  }, [annotations]);

  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0] || DEFAULT_CLIENT;

  const handleLogin = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem('sterling_is_logged_in', 'true');
    localStorage.setItem('sterling_username', user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('sterling_is_logged_in');
    localStorage.removeItem('sterling_username');
  };

  // Callback to switch client
  const handleSelectClient = (clientId: string) => {
    setActiveClientId(clientId);
    // Collapse any open drill-down on switch
    setSelectedMetricId(null);
  };

  // Update client metrics in state and localStorage
  const handleUpdateClientMetrics = (clientId: string, metrics: { [key: string]: MetricData }) => {
    setClients(prev => {
      const copy = prev.map(c => {
        if (c.id === clientId) {
          return { ...c, metrics };
        }
        return c;
      });
      localStorage.setItem('sterling_clients', JSON.stringify(copy));
      return copy;
    });
  };

  // Update client metadata in state and localStorage
  const handleUpdateClientMetadata = (
    clientId: string,
    name: string,
    industry: string,
    goal: string,
    colorTag: string
  ) => {
    setClients(prev => {
      const copy = prev.map(c => {
        if (c.id === clientId) {
          return { ...c, name, industry, primaryGoal: goal, colorTag };
        }
        return c;
      });
      localStorage.setItem('sterling_clients', JSON.stringify(copy));
      return copy;
    });
  };

  // Delete client workspace
  const handleDeleteClient = (clientId: string) => {
    let nextActiveId = activeClientId;
    setClients(prev => {
      const copy = prev.filter(c => c.id !== clientId);
      localStorage.setItem('sterling_clients', JSON.stringify(copy));
      
      // Select next available client
      if (copy.length === 0) {
        const fresh = [DEFAULT_CLIENT];
        localStorage.setItem('sterling_clients', JSON.stringify(fresh));
        nextActiveId = DEFAULT_CLIENT.id;
        return fresh;
      } else {
        nextActiveId = copy[0].id;
        return copy;
      }
    });

    setTimeout(() => {
      setActiveClientId(nextActiveId);
      setSelectedMetricId(null);
    }, 50);
  };

  // Create new client workspace dynamically
  const handleCreateClient = (name: string, industry: string, goal: string) => {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const finalId = clients.some(c => c.id === newId) ? `${newId}-${Date.now()}` : newId;
    const newClient = createNewClient(finalId, name, industry, goal);
    setClients(prev => {
      const copy = [...prev, newClient];
      localStorage.setItem('sterling_clients', JSON.stringify(copy));
      return copy;
    });
    setActiveClientId(finalId);
  };

  // Callback to toggle dark/light theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Add annotation locally
  const handleAddAnnotation = (date: string, text: string) => {
    if (!selectedMetricId) return;
    const newAnn: Annotation = {
      id: `ann-${Date.now()}`,
      metricId: selectedMetricId,
      date,
      text,
      author: username || 'A. Sterling'
    };
    setAnnotations(prev => [...prev, newAnn]);
  };

  // Delete annotation locally
  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark transition-colors duration-200 selection:bg-editorial-ochre/20">
      
      {/* Root Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Switcher Masthead */}
        <WorkspaceSwitcher
          clients={clients}
          activeClient={activeClient}
          onSelectClient={handleSelectClient}
          currentView={currentView}
          onSelectView={setCurrentView}
          onToggleTheme={handleToggleTheme}
          isDark={theme === 'dark'}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          username={username}
          onLogout={handleLogout}
          onCreateClient={handleCreateClient}
        />

        {/* Command Palette Overlay */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          clients={clients}
          activeClient={activeClient}
          onSelectClient={handleSelectClient}
          onSelectMetric={(mId) => {
            setSelectedMetricId(mId);
            setCurrentView('dashboard');
          }}
          onSelectView={setCurrentView}
          onToggleTheme={handleToggleTheme}
        />

        {/* Global Controls & Legend (Dashboard View Only) */}
        {currentView === 'dashboard' && (
          <div className="flex flex-wrap justify-between items-center bg-paper-card/40 dark:bg-paper-cardDark/40 border border-paper-border dark:border-paper-borderDark p-4 mb-6 gap-4 text-xs font-sans text-ink-light/60 dark:text-ink-darkLight/60 select-none">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-editorial-ochre shrink-0" />
              <span>
                Use <kbd className="border border-paper-border dark:border-paper-borderDark px-1 py-0.5 rounded font-mono text-[10px]">Ctrl + K</kbd> to search metrics, swap client workspaces, or compile custom reports.
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowGoalLine(!showGoalLine)}
                className={`flex items-center gap-1.5 font-semibold hover:text-ink transition-colors duration-150 ${
                  showGoalLine ? 'text-editorial-ochre' : 'text-ink-light/40 dark:text-ink-darkLight/40'
                }`}
              >
                {showGoalLine ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Target Goals</span>
              </button>

              <button 
                onClick={() => setShowForecast(!showForecast)}
                className={`flex items-center gap-1.5 font-semibold hover:text-ink transition-colors duration-150 ${
                  showForecast ? 'text-editorial-ochre' : 'text-ink-light/40 dark:text-ink-darkLight/40'
                }`}
              >
                {showForecast ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Linear Projection Proj</span>
              </button>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="pb-16">
          {currentView === 'dashboard' && activeClientId === 'aether' && (
            <div className="bg-paper-card dark:bg-paper-cardDark border-l-3 border-editorial-ochre p-4 mb-6 text-xs text-ink-light/80 dark:text-ink-darkLight/85 flex items-start gap-2 font-sans select-none animate-fadeIn">
              <Info className="w-4 h-4 text-editorial-ochre shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-ink dark:text-ink-dark block">Sample Pre-loaded Workspace (Aether Cosmetics)</span>
                <p className="mt-0.5">
                  This workspace displays sample metrics to demonstrate the dashboard layout. You can correct these numbers, add custom metric tags, upload a CSV spreadsheet, or delete this client workspace entirely by visiting the <span className="font-semibold text-editorial-ochre hover:underline cursor-pointer" onClick={() => setCurrentView('management')}>Manage Data</span> panel in the header navigation.
                </p>
              </div>
            </div>
          )}

          {currentView === 'dashboard' ? (
            <div className="space-y-6">
              {/* Asymmetric Metric Grid */}
              <div className="grid grid-cols-12 gap-6">
                {Object.values(activeClient.metrics).map((metric, idx) => {
                  let gridClass = "col-span-12 md:col-span-6";
                  if (idx === 0) gridClass = "col-span-12 lg:col-span-8";
                  if (idx === 1) gridClass = "col-span-12 lg:col-span-4";
                  
                  return (
                    <KpiCard
                      key={metric.id}
                      metric={metric}
                      onClick={() => setSelectedMetricId(selectedMetricId === metric.id ? null : metric.id)}
                      isExpanded={selectedMetricId === metric.id}
                      gridClass={gridClass}
                      showGoalLine={showGoalLine}
                      showForecast={showForecast}
                    />
                  );
                })}
              </div>

              {/* In-place detailed drill-down view */}
              {selectedMetricId && activeClient.metrics[selectedMetricId] && (
                <div className="transition-all duration-300">
                  <DrillDownView
                    metric={activeClient.metrics[selectedMetricId]}
                    annotations={annotations}
                    onAddAnnotation={handleAddAnnotation}
                    onDeleteAnnotation={handleDeleteAnnotation}
                    onClose={() => setSelectedMetricId(null)}
                    showGoalLine={showGoalLine}
                  />
                </div>
              )}
            </div>
          ) : currentView === 'reports' ? (
            // Reports Builder View
            <ReportBuilder activeClient={activeClient} />
          ) : (
            // Workspace Data Management View
            <DataManagement
              activeClient={activeClient}
              onUpdateClientMetrics={handleUpdateClientMetrics}
              onUpdateClientMetadata={handleUpdateClientMetadata}
              onDeleteClient={handleDeleteClient}
            />
          )}
        </main>
        
      </div>
    </div>
  );
}

export default App;
