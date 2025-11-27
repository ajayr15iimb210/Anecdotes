import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, History, Search, BookOpenCheck, Globe } from 'lucide-react';
import { Anecdote, GenerationState } from './types';
import { generateAnecdote } from './services/gemini';
import { SUGGESTIONS, CATEGORY_COLORS, SUPPORTED_LANGUAGES } from './constants';
import { Button } from './components/Button';
import { AnecdoteCard } from './components/AnecdoteCard';
import { HistoryItem } from './components/HistoryItem';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [currentAnecdote, setCurrentAnecdote] = useState<Anecdote | null>(null);
  const [history, setHistory] = useState<Anecdote[]>([]);
  const [status, setStatus] = useState<GenerationState>({ isLoading: false, error: null });
  const [view, setView] = useState<'home' | 'history'>('home');
  
  // Ref to scroll to result
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history from local storage on mount
    const saved = localStorage.getItem('anecdote_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (anecdote: Anecdote) => {
    const newHistory = [anecdote, ...history.filter(h => h.title !== anecdote.title)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('anecdote_history', JSON.stringify(newHistory));
  };

  const handleGenerate = async (selectedTopic: string = topic) => {
    if (!selectedTopic.trim()) return;

    setStatus({ isLoading: true, error: null });
    // Don't clear current anecdote immediately if we are generating from a related topic, 
    // it feels better to replace it when done, or we can clear it. 
    // Let's clear it to show loading state clearly.
    setCurrentAnecdote(null);
    setTopic(selectedTopic); // Update the input field to reflect the new topic
    setView('home');

    try {
      const result = await generateAnecdote(selectedTopic, language);
      setCurrentAnecdote(result);
      saveToHistory(result);
      
      // Small delay to ensure render before scroll
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      setStatus({ isLoading: false, error: err.message || "Something went wrong." });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleHistoryClick = (anecdote: Anecdote) => {
    setCurrentAnecdote(anecdote);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (label: string) => {
    setTopic(label);
    handleGenerate(label);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('home'); setCurrentAnecdote(null); setTopic(''); }}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BookOpenCheck size={18} strokeWidth={3} />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight hidden sm:block">Anecdote<span className="text-indigo-600">Academy</span></h1>
            <h1 className="font-bold text-slate-800 tracking-tight sm:hidden">AA</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-slate-100 border-none text-slate-700 text-xs sm:text-sm font-medium py-2 pl-3 pr-8 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors max-w-[120px] sm:max-w-none truncate"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button 
              onClick={() => setView(view === 'home' ? 'history' : 'home')}
              className={`p-2 rounded-full transition-colors ${view === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <History size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        
        {view === 'history' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Your Discovery Log</h2>
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
                    What will you <br/><span className="text-indigo-600">learn today?</span>
                  </h2>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Enter a topic (e.g., Gravity, French Revolution, Calculus) to find the story behind it.
                  </p>
                </div>
              )}

              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
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
                  {SUGGESTIONS.map((suggestion) => (
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
                  onRelatedTopicClick={handleGenerate} 
                />
                
                <div className="flex justify-center">
                   <Button 
                    variant="secondary" 
                    onClick={() => {
                        setCurrentAnecdote(null);
                        setTopic('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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