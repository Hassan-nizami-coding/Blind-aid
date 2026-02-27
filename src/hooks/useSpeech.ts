import { useCallback, useRef, useState } from 'react';

export function useSpeech(debounceMs = 3000) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef<Record<string, number>>({});

  const speak = useCallback((text: string, force = false) => {
    const now = Date.now();
    const lastSpoken = lastSpokenRef.current[text] || 0;

    if (!force && now - lastSpoken < debounceMs) {
      return;
    }

    lastSpokenRef.current[text] = now;

    // Clean up old entries
    Object.keys(lastSpokenRef.current).forEach(key => {
      if (now - lastSpokenRef.current[key] > debounceMs * 2) {
        delete lastSpokenRef.current[key];
      }
    });

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Slightly faster for efficiency
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, [debounceMs]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
