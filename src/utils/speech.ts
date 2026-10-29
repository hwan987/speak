/**
 * Speech utilities for SpeechSynthesis and SpeechRecognition
 * Complies with PRD requirements:
 * - Speech recognition: Browser built-in Web Speech API (SpeechRecognition), language en-US
 * - Read-aloud: SpeechSynthesis, language en-US, normal rate 0.9 / slow rate 0.7
 * - Disable mic button while audio is playing
 */

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speakEnglish(
  text: string,
  rate: number = 0.9,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void {
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    onEnd?.();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate; // 0.9 normal, 0.7 slow

  // Select an English voice if available
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith('en') && !v.localService) ||
                  voices.find((v) => v.lang.startsWith('en'));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onError?.();
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
