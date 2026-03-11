import { useState, useCallback, useEffect, useRef } from 'react';

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  confidence: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onspeechend: ((ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceRecognition = (options: VoiceRecognitionOptions = {}) => {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onEnd,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    confidence: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStop = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setState(prev => ({ ...prev, isSupported: !!SpeechRecognitionAPI }));
  }, []);

  // Initialize recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        interimTranscript: ''
      }));
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          setState(prev => ({
            ...prev,
            transcript: prev.transcript + transcript,
            confidence,
            interimTranscript: ''
          }));
          onResult?.(transcript, true);
        } else {
          interimTranscript += transcript;
          setState(prev => ({ ...prev, interimTranscript }));
          onResult?.(transcript, false);
        }
      }
    };

    recognition.onerror = (event) => {
      // Stop auto-restart for terminal errors
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        isManualStop.current = true;
      }

      const errorMessage = event.error === 'no-speech'
        ? 'No speech detected. Please try again.'
        : event.error === 'audio-capture'
        ? 'No microphone found. Please check your device.'
        : event.error === 'not-allowed'
        ? 'Microphone access denied. Open site settings and allow microphone, then refresh the page.'
        : `Error: ${event.error}`;

      setState(prev => ({ ...prev, error: errorMessage, isListening: false }));
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart if not manually stopped and continuous mode
      if (!isManualStop.current && continuous) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore - recognition may have been aborted
        }
      }
      
      onEnd?.();
    };

    return recognition;
  }, [continuous, interimResults, language, onResult, onError, onEnd]);

  const startListening = useCallback(() => {
    isManualStop.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = initRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start voice recognition. Please try again.' 
        }));
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    isManualStop.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '',
      error: null 
    }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isManualStop.current = true;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

export default useVoiceRecognition;
