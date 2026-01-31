import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWakeWordOptions {
  wakeWord?: string;
  onWakeWord?: () => void;
  onCommand?: (command: string) => void;
  enabled?: boolean;
}

interface UseWakeWordReturn {
  isListening: boolean;
  isAwake: boolean;
  lastCommand: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetWake: () => void;
  isSupported: boolean;
}

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
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const {
    wakeWord = 'hey assist',
    onWakeWord,
    onCommand,
    enabled = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const awakeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.toLowerCase().trim();
    
    console.log('Wake word recognition:', transcript);

    // Check for wake word
    if (transcript.includes(wakeWord.toLowerCase())) {
      setIsAwake(true);
      setLastCommand(null);
      onWakeWord?.();

      // Clear any existing timeout
      if (awakeTimeoutRef.current) {
        clearTimeout(awakeTimeoutRef.current);
      }

      // Auto-sleep after 10 seconds of no command
      awakeTimeoutRef.current = window.setTimeout(() => {
        setIsAwake(false);
      }, 10000);

      return;
    }

    // If awake, treat as command
    if (isAwake) {
      setLastCommand(transcript);
      onCommand?.(transcript);

      // Reset awake timeout
      if (awakeTimeoutRef.current) {
        clearTimeout(awakeTimeoutRef.current);
      }
      awakeTimeoutRef.current = window.setTimeout(() => {
        setIsAwake(false);
      }, 10000);
    }
  }, [wakeWord, isAwake, onWakeWord, onCommand]);

  const startListening = useCallback(() => {
    if (!enabled) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = handleResult;

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore 'aborted' and 'no-speech' as these are expected during normal operation
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Wake word recognition error:', event.error);
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        // Restart after error
        setTimeout(() => {
          if (isListening) {
            startListening();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition');
          }
        }, 100);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [enabled, handleResult, isListening]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const resetWake = useCallback(() => {
    setIsAwake(false);
    setLastCommand(null);
    if (awakeTimeoutRef.current) {
      clearTimeout(awakeTimeoutRef.current);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      if (awakeTimeoutRef.current) {
        clearTimeout(awakeTimeoutRef.current);
      }
    };
  }, [stopListening]);

  return {
    isListening,
    isAwake,
    lastCommand,
    startListening,
    stopListening,
    resetWake,
    isSupported,
  };
}
