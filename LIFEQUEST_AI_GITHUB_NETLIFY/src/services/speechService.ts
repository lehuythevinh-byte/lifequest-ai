/**
 * Speech Service: Bidirectional Speech (Speech-to-Text & Text-to-Speech)
 * Designed for English Language Learners in LifeQuest AI: English Town.
 */

export interface SpeechSettings {
  voiceEnabled: boolean;
  rate: number; // 0.7 to 1.2, default 0.9 for clear pronunciation
  pitch: number;
  preferredVoice: string | null;
  autoSpeak: boolean;
}

const STORAGE_KEY = 'lifequest_speech_settings_v2';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;

  public settings: SpeechSettings = {
    voiceEnabled: true,
    rate: 0.9,
    pitch: 1.0,
    preferredVoice: null,
    autoSpeak: true,
  };

  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSettings();
      this.initVoices();
    }
  }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load speech settings from storage', e);
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notify();
    } catch (e) {
      console.warn('Failed to save speech settings', e);
    }
  }

  private initVoices() {
    if (!this.synth) return;

    const populate = () => {
      this.voices = this.synth!.getVoices();
      this.pickBestVoice();
      this.notify();
    };

    populate();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = populate;
    }
  }

  private pickBestVoice() {
    if (!this.voices.length) return;

    if (this.settings.preferredVoice) {
      const found = this.voices.find(v => v.name === this.settings.preferredVoice);
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

    // Prioritize natural English voices (Google US English, Samantha, Daniel, Karen, etc.)
    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'));
    const preferred = englishVoices.find(v => 
      /Google|Natural|Samantha|Daniel|Victoria|Arthur|Moira/i.test(v.name)
    ) || englishVoices.find(v => v.lang === 'en-US') || englishVoices[0] || this.voices[0];

    this.selectedVoice = preferred || null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  public setPreferredVoice(voiceName: string) {
    this.settings.preferredVoice = voiceName;
    this.pickBestVoice();
    this.saveSettings();
  }

  public setVoiceEnabled(enabled: boolean) {
    this.settings.voiceEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
    this.saveSettings();
  }

  public setAutoSpeak(auto: boolean) {
    this.settings.autoSpeak = auto;
    this.saveSettings();
  }

  public setRate(rate: number) {
    this.settings.rate = Math.max(0.6, Math.min(1.4, rate));
    this.saveSettings();
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  /**
   * Speak an English sentence.
   * Strips out markdown, emoji, and formatting so the speech output sounds completely natural.
   */
  public speak(
    text: string, 
    callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void }
  ) {
    if (!this.synth || !this.settings.voiceEnabled) return;

    // Stop current speech
    this.stop();

    // Clean text for speech synthesis
    const cleanText = text
      .replace(/https?:\/\/\S+/g, '') // remove URLs
      .replace(/[*_#`~[\]]/g, '')     // remove markdown
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // remove emojis
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = this.selectedVoice?.lang || 'en-US';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;

    utterance.onstart = () => {
      this.isSpeakingState = true;
      callbacks?.onStart?.();
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      callbacks?.onEnd?.();
      this.notify();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech synthesis error:', e);
        callbacks?.onError?.(e);
      }
      this.notify();
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak utterance:', err);
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.notify();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const speechService = new SpeechService();
