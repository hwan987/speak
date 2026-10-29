import React, { useState, useEffect, useRef } from 'react';
import {
  DialogueTurn,
  EvaluationResult,
  TurnProgress,
} from '../types/dialogue';
import { evaluateStudentSpeech } from '../utils/evaluation';
import { speakEnglish, stopSpeaking, isSpeechRecognitionSupported } from '../utils/speech';
import {
  Mic,
  Volume2,
  RotateCcw,
  ArrowRight,
  SkipForward,
  AlertCircle,
  CheckCircle2,
  Keyboard,
} from 'lucide-react';

// SpeechRecognition type declarations for browsers
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface PracticeScreenProps {
  currentTurn: DialogueTurn;
  currentTurnIndex: number;
  totalTurns: number;
  completedTurnsCount: number;
  turnProgress: TurnProgress[];
  onCompleteTurn: (turnId: number, skipped: boolean, transcript: string) => void;
  onFinishDialogue: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  currentTurn,
  currentTurnIndex,
  totalTurns,
  completedTurnsCount,
  onCompleteTurn,
  onFinishDialogue,
}) => {
  // Mic state: 'ready' | 'listening' | 'done'
  const [micState, setMicState] = useState<'ready' | 'listening' | 'done'>('ready');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [playingAudioType, setPlayingAudioType] = useState<'normal' | 'slow' | 'mom' | null>(null);

  const [recognizedTranscript, setRecognizedTranscript] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [failureCount, setFailureCount] = useState<number>(0);
  const [isSuccessForThisTurn, setIsSuccessForThisTurn] = useState<boolean>(false);

  // Permission / browser support states
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);

  // Simulated typing / fallback input drawer
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const hasSpokenMomOnceRef = useRef<number>(-1);

  // Initialize Speech Recognition check
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setRecognitionSupported(supported);
    if (!supported) {
      setGuidanceMessage('Speech recognition is best supported in Google Chrome. You can also use the practice keyboard input below.');
    }
  }, []);

  // Read aloud Mom's sentence once when turn changes
  useEffect(() => {
    // Reset state for new turn
    setMicState('ready');
    setRecognizedTranscript('');
    setEvaluation(null);
    setFailureCount(0);
    setIsSuccessForThisTurn(false);
    setManualText('');

    if (hasSpokenMomOnceRef.current !== currentTurn.id) {
      hasSpokenMomOnceRef.current = currentTurn.id;
      // Small delay before reading aloud Mom's sentence
      const timer = setTimeout(() => {
        handlePlayMomSentence();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentTurn.id]);

  // Cleanup speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Play Mom's sentence
  const handlePlayMomSentence = () => {
    stopSpeaking();
    setIsAudioPlaying(true);
    setPlayingAudioType('mom');

    speakEnglish(
      currentTurn.partnerSentence,
      0.9,
      () => {
        setIsAudioPlaying(true);
      },
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      },
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      }
    );
  };

  // Play student target sentence at normal rate 0.9
  const handlePlayNormal = () => {
    stopSpeaking();
    setIsAudioPlaying(true);
    setPlayingAudioType('normal');

    speakEnglish(
      currentTurn.studentTarget,
      0.9,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      },
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      }
    );
  };

  // Play student target sentence at slow rate 0.7
  const handlePlaySlow = () => {
    stopSpeaking();
    setIsAudioPlaying(true);
    setPlayingAudioType('slow');

    speakEnglish(
      currentTurn.studentTarget,
      0.7,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      },
      () => {
        setIsAudioPlaying(false);
        setPlayingAudioType(null);
      }
    );
  };

  // Process evaluation and request Gemini AI feedback (with instant fallback)
  const processEvaluation = async (transcript: string) => {
    const evalResult = evaluateStudentSpeech(transcript, currentTurn, failureCount);
    setEvaluation(evalResult);

    setIsSuccessForThisTurn(evalResult.isSuccess);
    if (!evalResult.isSuccess && evalResult.feedbackType !== 'no_speech') {
      setFailureCount((prev) => prev + 1);
    }

    // Try Gemini API on the server for dynamic warm Mom feedback
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageName: currentTurn.stageName,
          partnerSentence: currentTurn.partnerSentence,
          studentTarget: currentTurn.studentTarget,
          transcript,
          isSuccess: evalResult.isSuccess,
          isSmallWordMissing: evalResult.isSmallWordMissing,
          missingKeyWords: evalResult.missingKeyWords,
          missingSmallWords: evalResult.missingSmallWords,
          failureCount: failureCount,
          ruleBasedFeedbackEn: evalResult.feedbackEn,
          ruleBasedFeedbackKo: evalResult.feedbackKo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedbackEn && data.feedbackKo) {
          setEvaluation((prev) =>
            prev
              ? {
                  ...prev,
                  feedbackEn: data.feedbackEn,
                  feedbackKo: data.feedbackKo,
                }
              : prev
          );
        }
      }
    } catch (err) {
      // Gracefully silent: the rule-based feedback is already set!
      console.log('AI feedback note: Using rule-based feedback');
    }
  };

  // Start speech recognition
  const handleStartListening = () => {
    if (isAudioPlaying) return; // PRD: Disable mic button while audio is playing

    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setGuidanceMessage('Speech recognition is not available in this browser. Please open in Chrome or use the typing mode.');
      return;
    }

    try {
      // Stop any existing instance
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setMicState('listening');
      setGuidanceMessage(null);
      setMicPermissionDenied(false);

      let finalSpeech = '';

      recognition.onstart = () => {
        setMicState('listening');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalSpeech += item[0].transcript;
          } else {
            interim += item[0]?.transcript || '';
          }
        }
        const currentSpoken = finalSpeech || interim;
        setRecognizedTranscript(currentSpoken);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setGuidanceMessage('Microphone permission was denied. Please allow microphone access or use the practice keyboard below.');
        } else if (event.error === 'no-speech') {
          // Handled in onend
        }
        setMicState('done');
      };

      recognition.onend = () => {
        setMicState('done');
        const speechToEvaluate = finalSpeech.trim() || recognizedTranscript.trim();
        processEvaluation(speechToEvaluate);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setMicState('done');
      setGuidanceMessage('Could not start microphone. Please check your browser permissions.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && micState === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  // Try Again button handler (no penalty!)
  const handleTryAgain = () => {
    setMicState('ready');
    setRecognizedTranscript('');
    setEvaluation(null);
    setIsSuccessForThisTurn(false);
  };

  // Move to next turn
  const handleNextTurn = () => {
    onCompleteTurn(currentTurn.id, false, recognizedTranscript || currentTurn.studentTarget);
    if (currentTurnIndex + 1 >= totalTurns) {
      onFinishDialogue();
    }
  };

  // Skip turn handler
  const handleSkipTurn = () => {
    onCompleteTurn(currentTurn.id, true, '(Skipped)');
    if (currentTurnIndex + 1 >= totalTurns) {
      onFinishDialogue();
    }
  };

  // Simulate speaking target sentence (for quick testing or headless browser verification)
  const handleSimulateTargetSpeech = (spoken: string) => {
    setRecognizedTranscript(spoken);
    setMicState('done');
    processEvaluation(spoken);
  };

  // Check if a word is in key words
  const isKeyWord = (word: string) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    return currentTurn.keyWords.some((kw) => kw.toLowerCase() === clean);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-between min-h-[92vh] py-4 px-3 sm:px-4 space-y-4">
      {/* Top Section: Mom's sentence + Bridge Progress */}
      <header className="w-full space-y-3">
        {/* Progress & Stage Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 bg-stone-100/90 py-1.5 px-3 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Turn {currentTurnIndex + 1} of {totalTurns}</span>
            <span className="text-stone-400">•</span>
            <span className="text-amber-800 font-bold">{currentTurn.stageName} ({currentTurn.stageNameKo})</span>
          </div>
          <div className="flex items-center gap-1 text-stone-700">
            <span>Bridge {completedTurnsCount + (isSuccessForThisTurn ? 1 : 0)}/{totalTurns}</span>
          </div>
        </div>

        {/* Mom's Sentence Card */}
        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 shadow-sm relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold">
                  👩
                </span>
                <span className="text-xs font-bold text-rose-800 tracking-wide uppercase">
                  Mom (엄마)
                </span>
              </div>
              <p className="text-stone-800 text-base sm:text-lg font-semibold leading-snug">
                &ldquo;{currentTurn.partnerSentence}&rdquo;
              </p>
              <p className="text-xs text-stone-600">
                {currentTurn.partnerKo}
              </p>
            </div>

            {/* Replay Mom's audio */}
            <button
              onClick={handlePlayMomSentence}
              disabled={isAudioPlaying}
              title="Listen to Mom again"
              aria-label="Listen to Mom again"
              className={`p-2 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                playingAudioType === 'mom'
                  ? 'bg-rose-200 text-rose-900 border-rose-300 ring-2 ring-rose-400'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-100'
              } disabled:opacity-50`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Bridge Progress Bar */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600">Bridge Progress:</span>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
              {completedTurnsCount + (isSuccessForThisTurn ? 1 : 0)} / {totalTurns} Pieces Rebuilt
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-1 max-w-[180px] justify-end">
            {Array.from({ length: totalTurns }).map((_, idx) => {
              const isBuilt = idx < completedTurnsCount + (isSuccessForThisTurn ? 1 : 0);
              const isCurrent = idx === currentTurnIndex && !isBuilt;
              return (
                <div
                  key={idx}
                  className={`h-4 flex-1 rounded-md transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
                    isBuilt
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : isCurrent
                      ? 'bg-amber-200 border border-amber-400 text-amber-800 animate-pulse'
                      : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {isBuilt ? '🪵' : idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Middle Section: Student Target Sentence in LARGEST TEXT */}
      <main className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-sm space-y-5 text-center">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
            Target Sentence (내가 할 말)
          </span>

          {/* Student target sentence in LARGEST text as required */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight mt-2">
            &ldquo;{currentTurn.studentTarget}&rdquo;
          </h2>

          <p className="text-sm sm:text-base font-medium text-stone-600 mt-1">
            {currentTurn.koreanMeaning}
          </p>
        </div>

        {/* Key Words Highlight Bar */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="text-xs text-stone-400 font-medium">Key words:</span>
          {currentTurn.keyWords.map((kw, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
            >
              ★ {kw}
            </span>
          ))}
        </div>

        {/* Audio Listen & Slow buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handlePlayNormal}
            disabled={isAudioPlaying}
            aria-label="Listen at normal speed"
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition cursor-pointer shadow-sm ${
              playingAudioType === 'normal'
                ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300'
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            } disabled:opacity-50`}
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>🔊 Listen (보통 속도)</span>
          </button>

          <button
            onClick={handlePlaySlow}
            disabled={isAudioPlaying}
            aria-label="Listen at slow speed"
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition cursor-pointer shadow-sm ${
              playingAudioType === 'slow'
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            } disabled:opacity-50`}
          >
            <span>🐢 Slow (느리게 듣기)</span>
          </button>
        </div>
      </main>

      {/* Bottom Section: Microphone, Speech Result & Mom Feedback */}
      <footer className="w-full space-y-4">
        {/* Guidance message if mic denied or browser issue */}
        {guidanceMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{guidanceMessage}</span>
            </div>
          </div>
        )}

        {/* Recognized Speech Box */}
        {recognizedTranscript ? (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1.5 text-left">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>You said (내가 말한 내용):</span>
              {isSuccessForThisTurn ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Understood!
                </span>
              ) : null}
            </div>
            <div className="text-stone-800 text-base font-medium">
              {recognizedTranscript.split(' ').map((word, idx) => {
                const match = isKeyWord(word);
                return (
                  <span
                    key={idx}
                    className={`inline-block mr-1 px-1 rounded ${
                      match
                        ? 'bg-emerald-100 text-emerald-900 font-bold underline decoration-emerald-500'
                        : 'text-stone-800'
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Mom's Warm Feedback Card */}
        {evaluation && (
          <div
            className={`p-4 rounded-2xl border text-left shadow-sm transition-all duration-300 ${
              evaluation.isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl">👩</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide opacity-80">
                    {evaluation.isSuccess ? 'Mom understood! (이해 완료)' : "Mom's gentle hint (엄마의 힌트)"}
                  </span>
                  {evaluation.isSuccess && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                      +1 Bridge Piece Rebuilt! 🪵
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm leading-snug">
                  {evaluation.feedbackEn}
                </p>
                <p className="text-xs opacity-85">
                  {evaluation.feedbackKo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Big Mic Button & State Indicators */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-1">
          <div className="relative">
            {/* Audio playing disable notice */}
            {isAudioPlaying && (
              <span className="absolute -top-7 inset-x-0 text-center text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Playing audio... Mic paused
              </span>
            )}

            <button
              onClick={
                micState === 'listening' ? handleStopListening : handleStartListening
              }
              disabled={isAudioPlaying}
              aria-label={
                micState === 'listening'
                  ? 'Listening... tap to stop'
                  : 'Start speaking target sentence'
              }
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
                isAudioPlaying
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
                  : micState === 'listening'
                  ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-200 scale-105'
                  : micState === 'done'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white hover:scale-105 active:scale-95 ring-4 ring-amber-100'
              }`}
            >
              {micState === 'listening' ? (
                <>
                  <Mic className="w-8 h-8 animate-bounce" />
                  <span className="text-[10px] font-bold mt-1">Listening...</span>
                </>
              ) : micState === 'done' ? (
                <>
                  <RotateCcw className="w-7 h-7" />
                  <span className="text-[10px] font-bold mt-1">Done</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  <span className="text-[10px] font-bold mt-1">Ready</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-xs text-stone-500">
            {micState === 'listening' ? (
              <span className="text-rose-600 font-semibold">말씀하세요! 문장을 다 읽으면 자동으로 확인합니다.</span>
            ) : isSuccessForThisTurn ? (
              <span className="text-emerald-700 font-semibold">훌륭해요! 다음 대화로 넘어가 볼까요?</span>
            ) : (
              <span>마이크를 누르고 영어 문장을 소리 내어 말해보세요.</span>
            )}
          </div>
        </div>

        {/* Action Controls: [Try Again] [Next ->] [Skip] */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={handleTryAgain}
            aria-label="Try speaking again"
            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border border-stone-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (다시 시도)</span>
          </button>

          <button
            onClick={handleSkipTurn}
            aria-label="Skip to next sentence"
            className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 border border-stone-200 transition cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </button>

          <button
            onClick={handleNextTurn}
            aria-label="Go to next sentence"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
              isSuccessForThisTurn
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-stone-800 hover:bg-stone-900 text-white'
            }`}
          >
            <span>Next ({currentTurnIndex + 1 < totalTurns ? '다음' : '결과 보기'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Practice Helper Drawer (Typing / Quick Click Simulator for testing or when mic is disabled) */}
        <div className="border-t border-stone-200 pt-2 text-center">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 font-medium transition cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showManualInput ? 'Hide practice input options' : 'Practice simulator / Quick test options'}</span>
          </button>

          {showManualInput && (
            <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-left">
              <div className="text-[11px] text-stone-600 font-medium">
                Quick test buttons (마이크 대신 클릭해서 테스트 가능):
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSimulateTargetSpeech(currentTurn.studentTarget)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition cursor-pointer"
                >
                  ✓ Exact Target ({currentTurn.keyWords.join(', ')})
                </button>
                <button
                  onClick={() => handleSimulateTargetSpeech(currentTurn.keyWords.join(' '))}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition cursor-pointer"
                >
                  ⚡ Key words only (Missing small words)
                </button>
                <button
                  onClick={() => handleSimulateTargetSpeech('I am very tired right now')}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-300 transition cursor-pointer"
                >
                  ✕ Other words (Test failure recast/elicitation)
                </button>
              </div>

              {/* Text input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Or type what you said in English..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    if (manualText.trim()) {
                      handleSimulateTargetSpeech(manualText);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold hover:bg-stone-700 transition cursor-pointer"
                >
                  Check
                </button>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
