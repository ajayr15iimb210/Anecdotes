import React, { useState } from 'react';
import { BookOpenCheck, User, UserCircle } from 'lucide-react';
import { Button } from './Button';

interface LoginScreenProps {
  onLogin: (name: string) => void;
  onGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuest }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl shadow-slate-200/50 p-8 space-y-8 border border-slate-100 animate-fade-in-up">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-200">
            <BookOpenCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Anecdote</h1>
            <p className="text-slate-500 mt-2">Your personalized journey into the stories behind the syllabus.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700 ml-1">
              What should we call you?
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full !rounded-xl !py-3.5 !text-base"
            disabled={!name.trim()}
          >
            Start Learning
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">Or</span>
          </div>
        </div>

        <button 
          onClick={onGuest}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-colors font-medium text-sm border border-transparent hover:border-slate-100"
        >
          <UserCircle className="w-5 h-5" />
          Continue as Guest
        </button>
      </div>
    </div>
  );
};