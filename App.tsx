
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, History, Search, BookOpenCheck, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { Anecdote, GenerationState, Suggestion, User } from './types';
import { generateAnecdote } from './services/gemini';
import { initGA, trackEvent, trackPageView } from './services/analytics';
import { DEFAULT_SUGGESTIONS, CATEGORY_COLORS, SUPPORTED_LANGUAGES } from './constants';
import { Button } from './components/Button';
import { AnecdoteCard } from './components/AnecdoteCard';
import { HistoryItem } from './components/HistoryItem';
import { LoginScreen } from './components/LoginScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [currentAnecdote, setCurrentAnecdote] = useState<Anecdote | null>(null);
  const [history, setHistory] = useState<Anecdote[]>([]);
  const [status, setStatus] = useState<GenerationState>({ isLoading: false, error: null });
  const [view, setView] = useState<'home' | 'history'>('home');
  const [pendingSharedTopic, setPendingSharedTopic] = useState<string | null>(null);
  
  // Ref to scroll to result
  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize Analytics
  useEffect(() => {
    initGA();
    trackPageView(window.location.pathname);
  }, []);

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('anecdote_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }

    // Check for shared link params
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('shared_topic');
    if (sharedTopic) {
      setPendingSharedTopic(sharedTopic);
      // If no user is logged in (including checking localStorage), force guest login
      if (!savedUser) {
        handleGuestLogin();
      }
    }
  }, []);

  // Helper to get storage key based on user
  const getHistoryKey = (u: User) => {
    return `anecdote_history_${u.isGuest ? 'guest' : u.name.trim().toLowerCase()}`;
  };

  // Load history when user changes
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const key = getHistoryKey(user);
    const savedHistory = localStorage.getItem(key);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    } else {
      setHistory([]);
    }
    
    // Reset view to home on login
    setView('home');
    if (!pendingSharedTopic) {
      setCurrentAnecdote(null);
      setTopic('');
    }
  }, [user]);

  // Handle pending shared topic once user is authenticated
  useEffect(() => {
    if (user && pendingSharedTopic) {
      handleGenerate(pendingSharedTopic);
      setPendingSharedTopic(null);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, pendingSharedTopic]);

  const handleLogin = (name: string) => {
    const newUser = { name, isGuest: false };
    setUser(newUser);
    localStorage.setItem('anecdote_user', JSON.stringify(newUser));
    trackEvent('login', { method: 'named_user' });
  };

  const handleGuestLogin = () => {
    const guestUser = { name: 'Guest', isGuest: true };
    setUser(guestUser);
    localStorage.setItem('anecdote_user', JSON.stringify(guestUser));
    trackEvent('login', { method: 'guest' });
  };

  const handleLogout = () => {
    trackEvent('logout');
    setUser(null);
    localStorage.removeItem('anecdote_user');
    setCurrentAnecdote(null);
    setHistory([]);
    setTopic('');
  };

  const saveToHistory = (anecdote: Anecdote) => {
    if (!user) return;

    // Update state with full object (including image for current session)
    const newHistory = [anecdote, ...history.filter(h => h.title !== anecdote.title)].slice(0, 50);
    setHistory(newHistory);
    
    // Create a copy for storage that excludes the heavy base64 image
    const historyForStorage = newHistory.map(({ imageUrl, ...rest }) => rest);
    const key = getHistoryKey(user);

    try {
      localStorage.setItem(key, JSON.stringify(historyForStorage));
    } catch (e) {
      console.warn("Storage full, attempting to trim history...", e);
      // Fallback: Try saving only the last 10 items if quota exceeded
      try {
        localStorage.setItem(key, JSON.stringify(historyForStorage.slice(0, 10)));
      } catch (retryError) {
        console.error("Failed to save history even after trimming.", retryError);
      }
    }
  };

  const handleGenerate = async (selectedTopic: string = topic) => {
    if (!selectedTopic.trim()) return;

    trackEvent('generate_story_start', { topic: selectedTopic, language });

    setStatus({ isLoading: true, error: null });
    setCurrentAnecdote(null);
    setTopic(selectedTopic); 
    setView('home');

    try {
      const result = await generateAnecdote(selectedTopic, language);
      setCurrentAnecdote(result);
      saveToHistory(result);
      trackEvent('generate_story_success', { 
        topic: selectedTopic, 
        language,
        anecdote_title: result.title 
      });
      
      // Small delay to ensure render before scroll
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      console.error(err);
      setStatus({ isLoading: false, error: err.message || "Something went wrong." });
      trackEvent('generate_story_error', { 
        topic: selectedTopic, 
        error_message: err.message 
      });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleHistoryClick = (anecdote: Anecdote) => {
    trackEvent('view_history_item', { title: anecdote.title });
    setCurrentAnecdote(anecdote);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (label: string) => {
    trackEvent('click_suggestion', { label });
    setTopic(label);
    handleGenerate(label);
  };

  // Derive suggestions from history + defaults
  const currentSuggestions: Suggestion[] = useMemo(() => {
    const historySuggestions: Suggestion[] = history
      .map(h => ({ label: h.topic, category: 'General' as const }))
      .filter((v, i, a) => a.findIndex(t => t.label === v.label) === i)
      .slice(0, 3);

    const historyLabels = new Set(historySuggestions.map(h => h.label));
    const relevantDefaults = DEFAULT_SUGGESTIONS.filter(s => !historyLabels.has(s.label));

    return [...historySuggestions, ...relevantDefaults].slice(0, 6);
  }, [history]);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onGuest={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { 
              setView('home'); 
              setCurrentAnecdote(null); 
              setTopic(''); 
              trackPageView('/home');
            }}
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-primary-200">
              <BookOpenCheck size={18} strokeWidth={3} />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight text-lg sm:text-xl hidden sm:block">Anecdote</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 max-w-[80px] sm:max-w-[120px] truncate">
                {user.isGuest ? 'Guest' : user.name}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="relative">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  trackEvent('change_language', { language: e.target.value });
                }}
                className="appearance-none bg-transparent border-none text-slate-600 text-xs sm:text-sm font-medium py-1 pl-1 pr-6 rounded-full focus:ring-0 outline-none cursor-pointer hover:text-primary-600 transition-colors max-w-[80px] sm:max-w-[100px] truncate"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button 
              onClick={() => {
                const newView = view === 'home' ? 'history' : 'home';
                setView(newView);
                trackPageView(newView === 'history' ? '/history' : '/home');
              }}
              className={`p-2 rounded-full transition-colors ${view === 'history' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="History"
            >
              <History size={20} />
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        
        {view === 'history' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              {user.isGuest ? 'Guest History' : `${user.name}'s Discovery Log`}
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No stories discovered yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {history.map((item, idx) => (
                  <HistoryItem key={idx} anecdote={item} onClick={() => handleHistoryClick(item)} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'home' && (
          <>
            {/* Input Section - Only show if no current anecdote or to search again */}
            <div className={`space-y-6 transition-all duration-500 ${currentAnecdote ? 'opacity-100' : 'translate-y-0'}`}>
              
              {!currentAnecdote && (
                <div className="text-center space-y-2 py-8">
                  <h2 className="text-3xl font-extrabold text-slate-800">
                    What will you <br/><span className="text-primary-600">learn today?</span>
                  </h2>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Enter a topic (e.g., Gravity, French Revolution, Calculus) to find the story behind it.
                  </p>
                </div>
              )}

              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="E.g. The Moon Landing..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 h-10"
                />
              </div>

              {/* Suggestions Chips - Hide if we have a result to reduce clutter */}
              {!currentAnecdote && (
                <div className="flex flex-wrap justify-center gap-2">
                  {currentSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleSuggestionClick(suggestion.label)}
                      disabled={status.isLoading}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${CATEGORY_COLORS[suggestion.category]} hover:brightness-95 disabled:opacity-50`}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}

              {!currentAnecdote && (
                <Button 
                  onClick={() => handleGenerate()} 
                  isLoading={status.isLoading} 
                  disabled={!topic.trim()}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Story in {language}
                </Button>
              )}
            </div>

            {/* Error Message */}
            {status.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
                {status.error}
              </div>
            )}

            {/* Result Area */}
            {currentAnecdote && (
              <div ref={resultRef} className="pb-8 space-y-6">
                <AnecdoteCard 
                  anecdote={currentAnecdote} 
                  onRelatedTopicClick={(related) => {
                    trackEvent('click_related_topic', { topic: related });
                    handleGenerate(related);
                  }} 
                />
                
                <div className="flex justify-center">
                   <Button 
                    variant="secondary" 
                    onClick={() => {
                        setCurrentAnecdote(null);
                        setTopic('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        trackEvent('explore_new_topic_click');
                    }}
                   >
                     Explore New Topic
                   </Button>
                </div>
              </div>
            )}

             {/* Loading State Skeleton */}
             {status.isLoading && !currentAnecdote && (
               <div className="w-full bg-white rounded-3xl shadow-sm p-6 border border-slate-100 animate-pulse space-y-4">
                 <div className="h-48 bg-slate-100 rounded-xl w-full mb-6"></div>
                 <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                 <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                 </div>
               </div>
             )}
          </>
        )}
      </main>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
