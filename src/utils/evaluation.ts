import { DialogueTurn, EvaluationResult } from '../types/dialogue';

/**
 * Normalizes input text by removing punctuation, converting to lowercase,
 * and splitting into words.
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Normalize contractions and strip punctuation except apostrophe inside words
  const cleaned = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .trim();
  return cleaned.split(/\s+/).filter(Boolean);
}

/**
 * Checks if target words are contained within recognized words.
 * Handles singular/plural and common variations if needed, but primarily exact/stem match.
 */
export function findMissingWords(targets: string[], recognized: string[]): string[] {
  const recognizedSet = new Set(recognized.map((w) => w.toLowerCase()));
  return targets.filter((target) => {
    const t = target.toLowerCase();
    // Direct match
    if (recognizedSet.has(t)) return false;
    // Common contraction handling (e.g., "i'm" vs "im" or "i am")
    if (t === 'im' && (recognizedSet.has('i') || recognizedSet.has("i'm"))) return false;
    if (t === "i'm" && (recognizedSet.has('im') || recognizedSet.has('i'))) return false;
    return true;
  });
}

/**
 * Evaluates student speech against the target sentence and returns
 * structured feedback according to the PRD Section 7 rules.
 *
 * @param transcript What the student said
 * @param turn The current DialogueTurn
 * @param failureCount Previous consecutive failed attempts for this turn (0-indexed before this attempt)
 */
export function evaluateStudentSpeech(
  transcript: string,
  turn: DialogueTurn,
  failureCount: number
): EvaluationResult {
  const trimmed = transcript.trim();
  const recognizedWords = tokenizeWords(trimmed);

  if (recognizedWords.length === 0) {
    return {
      isSuccess: false,
      isSmallWordMissing: false,
      missingKeyWords: [...turn.keyWords],
      missingSmallWords: [],
      recognizedWords: [],
      normalizedTranscript: '',
      feedbackEn: "That's okay! Tap the mic and try again.",
      feedbackKo: '괜찮아요! 마이크를 누르고 다시 말해 봐요.',
      feedbackType: 'no_speech',
    };
  }

  // 1. Check Key Words
  const missingKeyWords = findMissingWords(turn.keyWords, recognizedWords);
  const isKeyWordsPassed = missingKeyWords.length === 0;

  // 2. Identify all words in target sentence to detect small words missing
  const allTargetWords = tokenizeWords(turn.studentTarget);
  const keyWordsSet = new Set(turn.keyWords.map((k) => k.toLowerCase()));
  const smallTargetWords = allTargetWords.filter((w) => !keyWordsSet.has(w));
  const missingSmallWords = findMissingWords(smallTargetWords, recognizedWords);

  if (isKeyWordsPassed) {
    const isSmallMissing = missingSmallWords.length > 0;
    if (isSmallMissing) {
      return {
        isSuccess: true,
        isSmallWordMissing: true,
        missingKeyWords: [],
        missingSmallWords,
        recognizedWords,
        normalizedTranscript: recognizedWords.join(' '),
        feedbackEn: 'Good! I understood you. Try adding the small word next time.',
        feedbackKo: '뜻은 잘 전달됐어요. 다음에는 빠진 짧은 단어도 넣어 보세요.',
        feedbackType: 'success_small_missing',
      };
    }

    return {
      isSuccess: true,
      isSmallWordMissing: false,
      missingKeyWords: [],
      missingSmallWords: [],
      recognizedWords,
      normalizedTranscript: recognizedWords.join(' '),
      feedbackEn: 'Thanks for telling me calmly. I understand.',
      feedbackKo: '차분하게 말해 줘서 고마워. 이해했어.',
      feedbackType: 'success',
    };
  }

  // Failed: not all key words recognized
  const currentFailAttempt = failureCount + 1; // 1st, 2nd, or 3rd failure

  if (currentFailAttempt === 1) {
    // 1st failure: Recast
    return {
      isSuccess: false,
      isSmallWordMissing: false,
      missingKeyWords,
      missingSmallWords,
      recognizedWords,
      normalizedTranscript: recognizedWords.join(' '),
      feedbackEn: `Nice try! You can say, "${turn.studentTarget}"`,
      feedbackKo: '좋아요! 이 문장으로 다시 말해 볼까요?',
      feedbackType: 'recast',
    };
  } else if (currentFailAttempt === 2) {
    // 2nd failure: Elicitation
    const firstMissing = missingKeyWords[0] || 'word';
    const firstLetter = firstMissing.charAt(0).toUpperCase();
    const hint = `${firstLetter}__`;
    return {
      isSuccess: false,
      isSmallWordMissing: false,
      missingKeyWords,
      missingSmallWords,
      recognizedWords,
      normalizedTranscript: recognizedWords.join(' '),
      feedbackEn: `Almost! Try the missing word: "${hint}".`,
      feedbackKo: '거의 다 왔어요! 첫 글자를 보고 다시 말해 보세요.',
      feedbackType: 'elicitation',
    };
  } else {
    // 3rd failure and above: Chunking
    return {
      isSuccess: false,
      isSmallWordMissing: false,
      missingKeyWords,
      missingSmallWords,
      recognizedWords,
      normalizedTranscript: recognizedWords.join(' '),
      feedbackEn: `Good effort! Say it in parts: "${turn.chunks[0]}" / "${turn.chunks[1]}"`,
      feedbackKo: '잘했어요! 문장을 나누어 말해 봐요.',
      feedbackType: 'chunking',
    };
  }
}

/**
 * Calculates completion star count according to PRD Section 6:
 * - 3 stars: Finished all 5 turns without [Skip]. Retrying is allowed.
 * - 2 stars: Finished with 1 skipped turn.
 * - 1 star: Finished the whole dialogue with 2 or more skipped turns.
 */
export function calculateStarRating(skippedCount: number): number {
  if (skippedCount === 0) return 3;
  if (skippedCount === 1) return 2;
  return 1;
}
