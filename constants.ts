import { Suggestion } from './types';

export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: 'Newton\'s Apple', category: 'Science' },
  { label: 'Pythagoras', category: 'Math' },
  { label: 'The Trojan Horse', category: 'History' },
  { label: 'Shakespeare', category: 'Literature' },
  { label: 'Discovery of Penicillin', category: 'Science' },
  { label: 'Leonardo da Vinci', category: 'Art' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  History: 'bg-amber-100 text-amber-700 border-amber-200',
  Math: 'bg-blue-100 text-blue-700 border-blue-200',
  Literature: 'bg-rose-100 text-rose-700 border-rose-200',
  Art: 'bg-purple-100 text-purple-700 border-purple-200',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Mandarin Chinese",
  "Arabic",
  "Bengali",
  "Portuguese",
  "Russian",
  "Japanese",
  "German"
];