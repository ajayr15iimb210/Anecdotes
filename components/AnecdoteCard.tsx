
import React, { useState } from 'react';
import { Anecdote } from '../types';
import { BookOpen, Lightbulb, Share2, Compass, ToggleLeft, ToggleRight, GraduationCap, Newspaper, ExternalLink } from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface AnecdoteCardProps {
  anecdote: Anecdote;
  onRelatedTopicClick: (topic: string) => void;
}

export const AnecdoteCard: React.FC<AnecdoteCardProps> = ({ anecdote, onRelatedTopicClick }) => {
  const [showMeanings, setShowMeanings] = useState(false);

  const handleShare = () => {
    trackEvent('share_story_click', { topic: anecdote.topic });

    const url = new URL(window.location.href);
    url.searchParams.set('shared_topic', anecdote.topic);
    
    const shareUrl = url.toString();

    if (navigator.share) {
      navigator.share({
        title: anecdote.title,
        text: `Check out this story about "${anecdote.title}" on Anecdote!`,
        url: shareUrl,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const renderStoryWithMeanings = () => {
    if (!showMeanings || !anecdote.toughWords || anecdote.toughWords.length === 0) {
      return anecdote.story;
    }

    // We'll replace the word with a special marker to split the string later
    // Marker format: __MARKER__|word|definition|__MARKER__
    let processedStory = anecdote.story;
    
    // Create a temporary map to hold our replacements to avoid replacing inside already replaced text
    const replacements: { start: number, end: number, word: string, definition: string }[] = [];

    anecdote.toughWords.forEach(({ word, definition }) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      const match = regex.exec(processedStory);
      if (match) {
         processedStory = processedStory.replace(regex, (m) => `@@@${m}###${definition}@@@`);
      }
    });

    // Now split by the delimiters
    const parts = processedStory.split('@@@');
    
    return parts.map((part, index) => {
      if (part.includes('###')) {
        const [word, definition] = part.split('###');
        return (
          <span key={index} className="text-amber-700 font-semibold bg-amber-50 px-1 rounded mx-0.5 border border-amber-100/50">
            {word} <span className="text-amber-600 font-normal italic">({definition})</span>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 animate-fade-in-up">
      {/* Header Section: Image or Gradient */}
      {anecdote.imageUrl ? (
        <div className="relative h-56 sm:h-64 w-full bg-slate-100">
          <img 
            src={anecdote.imageUrl} 
            alt={anecdote.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 shadow-sm">
               <span className="text-2xl">{anecdote.emoji}</span>
            </div>
            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-2 self-start">
              {anecdote.topic}
            </div>
            <h2 className="text-2xl font-bold leading-tight drop-shadow-md">{anecdote.title}</h2>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white relative">
          <div className="absolute top-4 right-4 text-4xl opacity-20 rotate-12">
            {anecdote.emoji}
          </div>
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-3">
            {anecdote.topic}
          </div>
          <h2 className="text-2xl font-bold leading-tight">{anecdote.title}</h2>
        </div>
      )}

      <div className="p-6 space-y-6">
        
        {/* Story Controls */}
        <div className="flex justify-end">
           <button 
             onClick={() => {
                const newState = !showMeanings;
                setShowMeanings(newState);
                trackEvent('toggle_meanings', { state: newState ? 'on' : 'off' });
             }}
             className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
           >
             {showMeanings ? (
               <ToggleRight className="w-6 h-6 text-primary-600" />
             ) : (
               <ToggleLeft className="w-6 h-6 text-slate-300" />
             )}
             Show Meanings
           </button>
        </div>

        {/* Main Story Text */}
        <div className="prose prose-slate leading-relaxed text-slate-600 relative">
          <p className="whitespace-pre-line text-lg">
            {renderStoryWithMeanings()}
          </p>
        </div>

        {/* Fun Fact */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Did you know?</h3>
              <p className="text-amber-900/80 text-sm">{anecdote.funFact}</p>
            </div>
          </div>
        </div>

        {/* Takeaway */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-primary-800 uppercase tracking-wide mb-1">Key Takeaway</h3>
              <p className="text-slate-600 text-sm">{anecdote.takeaway}</p>
            </div>
          </div>
        </div>

        {/* NCERT Topic */}
        {anecdote.ncertTopic && (
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <GraduationCap className="w-5 h-5 text-primary-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Syllabus:</span>
            <span className="text-sm font-medium text-slate-700">{anecdote.ncertTopic}</span>
          </div>
        )}

        {/* Related News Article */}
        {anecdote.newsArticle && (
          <div className="flex flex-col gap-2 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2 text-slate-400">
              <Newspaper className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">In the Headlines</span>
            </div>
            <a 
              href={anecdote.newsArticle.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_news_link', { url: anecdote.newsArticle?.url })}
              className="flex items-start justify-between gap-4 text-slate-700 font-medium group-hover:text-primary-700 transition-colors"
            >
              <span className="line-clamp-2">{anecdote.newsArticle.title}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0 mt-1 opacity-50 group-hover:opacity-100" />
            </a>
          </div>
        )}

        {/* Related Topics */}
        {anecdote.relatedTopics && anecdote.relatedTopics.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Curious for more?</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {anecdote.relatedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onRelatedTopicClick(topic)}
                  className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-full transition-colors border border-primary-100"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button 
            onClick={handleShare}
            className="flex items-center text-slate-400 hover:text-primary-600 text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </button>
          <span className="text-xs text-slate-300 ml-auto self-center">Generated by Anecdote</span>
        </div>
      </div>
    </div>
  );
};
