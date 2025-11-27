import React from 'react';
import { Anecdote } from '../types';
import { ArrowRight } from 'lucide-react';

interface HistoryItemProps {
  anecdote: Anecdote;
  onClick: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ anecdote, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="text-2xl flex-shrink-0">{anecdote.emoji}</span>
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-800 truncate text-sm group-hover:text-primary-600 transition-colors">
            {anecdote.title}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {anecdote.topic}
          </p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-2" />
    </div>
  );
};