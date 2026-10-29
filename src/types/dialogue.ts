export interface DialogueTurn {
  id: number;
  stageName: string;
  stageNameKo: string;
  partnerSentence: string;
  partnerKo: string;
  studentTarget: string;
  koreanMeaning: string;
  keyWords: string[];
  chunks: [string, string];
}

export const DIALOGUE_TURNS: DialogueTurn[] = [
  {
    id: 1,
    stageName: 'Apologize',
    stageNameKo: '사과하기',
    partnerSentence: 'I was only worried about your homework. You sounded angry.',
    partnerKo: '숙제 걱정돼서 그런 거였어. 네가 화난 것처럼 들렸거든.',
    studentTarget: "I'm sorry I spoke like that.",
    koreanMeaning: '그렇게 말해서 미안해.',
    keyWords: ['sorry', 'spoke'],
    chunks: ["I'm sorry", 'I spoke like that.'],
  },
  {
    id: 2,
    stageName: 'Explain',
    stageNameKo: '상황 설명',
    partnerSentence: 'I thought you were just playing on your phone.',
    partnerKo: '그냥 핸드폰으로 놀고만 있는 줄 알았지.',
    studentTarget: 'I was just taking a short break.',
    koreanMeaning: '나는 그냥 잠깐 쉬고 있었어.',
    keyWords: ['taking', 'break'],
    chunks: ['I was just', 'taking a short break.'],
  },
  {
    id: 3,
    stageName: 'Understand',
    stageNameKo: '상대방 이해',
    partnerSentence: "I asked because you've been tired lately.",
    partnerKo: '요즘 피곤해 보여서 물어봤던 거야.',
    studentTarget: 'I know you were worried about me.',
    koreanMeaning: '엄마가 나를 걱정한 거 알아.',
    keyWords: ['know', 'worried'],
    chunks: ['I know', 'you were worried about me.'],
  },
  {
    id: 4,
    stageName: 'Express',
    stageNameKo: '감정 표현',
    partnerSentence: 'I just want you to finish your homework.',
    partnerKo: '그냥 숙제를 다 끝마쳤으면 해서 그랬어.',
    studentTarget: 'I understand, but I feel stressed when you keep asking.',
    koreanMeaning: '이해해. 하지만 계속 물어보면 스트레스를 받아.',
    keyWords: ['understand', 'stressed', 'asking'],
    chunks: ['I understand, but I feel stressed', 'when you keep asking.'],
  },
  {
    id: 5,
    stageName: 'Compromise',
    stageNameKo: '해결책 제안',
    partnerSentence: 'Okay. What would help?',
    partnerKo: '알겠어. 어떻게 하면 좋을까?',
    studentTarget: 'Can I rest for ten minutes, then do my homework?',
    koreanMeaning: '10분 쉬고 나서 숙제해도 될까?',
    keyWords: ['rest', 'ten', 'minutes', 'homework'],
    chunks: ['Can I rest for ten minutes,', 'then do my homework?'],
  },
];

export type EvaluationResult = {
  isSuccess: boolean;
  isSmallWordMissing: boolean;
  missingKeyWords: string[];
  missingSmallWords: string[];
  recognizedWords: string[];
  normalizedTranscript: string;
  feedbackEn: string;
  feedbackKo: string;
  feedbackType: 'success' | 'success_small_missing' | 'recast' | 'elicitation' | 'chunking' | 'no_speech';
};

export interface TurnProgress {
  turnId: number;
  completed: boolean;
  skipped: boolean;
  attempts: number;
  recognizedText: string;
}
