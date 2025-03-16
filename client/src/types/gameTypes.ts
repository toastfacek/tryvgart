export interface Answer {
  playerId: string;
  text: string;
  authorName: string;
  authorEmoji: string;
}

export interface PromptAnswers {
  promptIndex: number;
  answers: Answer[];
}

export interface GuessPhaseData {
  prompts: string[];
  answers: PromptAnswers[];
  currentPromptIndex: number;
}

export interface Score {
  player: string;
  score: number;
}

export interface RevealData {
  data?: {
    answers: Answer[];
    scores?: Score[];
    guesses?: Record<string, string>;
  };
  answers?: Answer[];
  scores?: Score[];
  guesses?: Record<string, string>;
} 