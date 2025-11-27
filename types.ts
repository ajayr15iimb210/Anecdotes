export interface ToughWord {
  word: string;
  definition: string;
}

export interface Anecdote {
  title: string;
  story: string;
  takeaway: string;
  funFact: string;
  topic: string;
  emoji: string;
  relatedTopics: string[];
  toughWords: ToughWord[];
  ncertTopic: string;
  imageUrl?: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
}

export type SubjectCategory = 'Science' | 'History' | 'Math' | 'Literature' | 'Art' | 'General';

export interface Suggestion {
  label: string;
  category: SubjectCategory;
}