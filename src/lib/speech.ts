// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Speech synthesis and recognition utilities
// Queue-based system to prevent overlapping speech

type SpeechPriority = 'low' | 'normal' | 'high' | 'critical';

interface SpeechQueueItem {
  text: string;
  priority: SpeechPriority;
  timestamp: number;
}

class SpeechManager {
  private queue: SpeechQueueItem[] = [];
  private isSpeaking = false;
  private synthesis: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onCommandCallback: ((command: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.initRecognition();
    }
  }

  private initRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        console.log('Voice command received:', command);
        if (this.onCommandCallback) {
          this.onCommandCallback(command);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignore 'aborted' and 'no-speech' as these are expected during normal operation
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted' && this.isListening) {
          // Restart recognition
          setTimeout(() => this.startListening(this.onCommandCallback!), 1000);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Auto-restart
          setTimeout(() => {
            try {
              this.recognition?.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }, 100);
        }
      };
    }
  }

  private getPriorityValue(priority: SpeechPriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  speak(text: string, priority: SpeechPriority = 'normal'): void {
    if (!this.synthesis) return;

    const item: SpeechQueueItem = {
      text,
      priority,
      timestamp: Date.now(),
    };

    // Critical priority interrupts everything
    if (priority === 'critical') {
      this.synthesis.cancel();
      this.queue = [item];
      this.isSpeaking = false;
    } else if (priority === 'high' && this.isSpeaking) {
      // High priority goes to front but doesn't interrupt critical
      const currentPriority = this.queue[0]?.priority;
      if (currentPriority !== 'critical') {
        this.synthesis.cancel();
        this.queue.unshift(item);
        this.isSpeaking = false;
      } else {
        this.queue.splice(1, 0, item);
      }
    } else {
      // Normal and low priority - add to queue sorted by priority
      this.queue.push(item);
      this.queue.sort((a, b) => 
        this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
      );
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0 || !this.synthesis) return;

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 1.1; // Slightly faster for accessibility
    utterance.pitch = 1;
    utterance.volume = 1;

    // Prefer a clear voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    this.synthesis.speak(utterance);
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.queue = [];
      this.isSpeaking = false;
    }
  }

  startListening(onCommand: (command: string) => void): void {
    this.onCommandCallback = onCommand;
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.error('Failed to stop recognition:', e);
      }
    }
  }

  get isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  get isSynthesisSupported(): boolean {
    return !!window.speechSynthesis;
  }
}

export const speechManager = new SpeechManager();

// Convenience functions
export const speak = (text: string, priority: SpeechPriority = 'normal') => 
  speechManager.speak(text, priority);

export const stopSpeech = () => speechManager.stop();

export const startVoiceCommands = (onCommand: (command: string) => void) => 
  speechManager.startListening(onCommand);

export const stopVoiceCommands = () => speechManager.stopListening();
