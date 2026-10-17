/**
 * CEFR English Proficiency Service
 * Customizes NPC dialogue complexity, vocabulary, and grammar coaching for learners.
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface LevelInfo {
  code: CEFRLevel;
  name: string;
  vietnameseTitle: string;
  description: string;
  promptInstruction: string;
}

export const CEFR_LEVELS: Record<CEFRLevel, LevelInfo> = {
  A1: {
    code: 'A1',
    name: 'Beginner',
    vietnameseTitle: 'Người mới bắt đầu (A1)',
    description: 'Very simple sentences, slow clear speech, common everyday words.',
    promptInstruction: 'The player is a beginner English learner (CEFR A1). Speak in short, simple sentences (5-10 words). Use elementary vocabulary. Be patient and friendly. Avoid slang, idioms, or complex compound tenses.'
  },
  A2: {
    code: 'A2',
    name: 'Elementary',
    vietnameseTitle: 'Cơ bản (A2)',
    description: 'Simple everyday dialogues, basic past/present/future tenses.',
    promptInstruction: 'The player is an elementary English learner (CEFR A2). Use straightforward conversational sentences. Introduce basic descriptive words. Keep questions direct and easy to answer.'
  },
  B1: {
    code: 'B1',
    name: 'Intermediate',
    vietnameseTitle: 'Trung cấp (B1)',
    description: 'Natural conversations, common idioms, expressing opinions and plans.',
    promptInstruction: 'The player is an intermediate English learner (CEFR B1). Converse naturally like a typical town resident. Use common idioms, phrasal verbs, and ask follow-up questions to encourage conversational depth.'
  },
  B2: {
    code: 'B2',
    name: 'Upper-Intermediate',
    vietnameseTitle: 'Trung cao cấp (B2)',
    description: 'Rich vocabulary, nuanced discussions, natural native expressions.',
    promptInstruction: 'The player is an upper-intermediate English learner (CEFR B2). Use varied vocabulary, nuanced expressions, and natural colloquial phrases. Challenge the player with detailed responses.'
  },
  C1: {
    code: 'C1',
    name: 'Advanced',
    vietnameseTitle: 'Nâng cao (C1)',
    description: 'Fluent, idiomatic native-level discussions, humor and subtlety.',
    promptInstruction: 'The player is an advanced English speaker (CEFR C1). Speak completely naturally at full native fluency, with humor, cultural references, figurative language, and sophisticated vocabulary.'
  }
};

const STORAGE_KEY = 'lifequest_cefr_level_v2';

class CEFRService {
  private currentLevel: CEFRLevel = 'B1';
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as CEFRLevel;
        if (saved && CEFR_LEVELS[saved]) {
          this.currentLevel = saved;
        }
      } catch (e) {}
    }
  }

  public getLevel(): CEFRLevel {
    return this.currentLevel;
  }

  public getLevelInfo(): LevelInfo {
    return CEFR_LEVELS[this.currentLevel];
  }

  public setLevel(level: CEFRLevel) {
    if (CEFR_LEVELS[level]) {
      this.currentLevel = level;
      try {
        localStorage.setItem(STORAGE_KEY, level);
      } catch (e) {}
      this.listeners.forEach(l => l());
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const cefrService = new CEFRService();
