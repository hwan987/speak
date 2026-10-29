import React from 'react';
import { BridgeVisual } from './BridgeVisual';
import { DIALOGUE_TURNS, TurnProgress } from '../types/dialogue';
import { calculateStarRating } from '../utils/evaluation';
import { Star, RotateCcw, Home, CheckCircle2, HeartHandshake, Sparkles, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech';

interface ResultScreenProps {
  turnProgress: TurnProgress[];
  onRestart: () => void;
  onGoHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  turnProgress,
  onRestart,
  onGoHome,
}) => {
  const skippedCount = turnProgress.filter((p) => p.skipped).length;
  const starsCount = calculateStarRating(skippedCount);
  const isFullBridge = skippedCount === 0;

  const handlePlaySentence = (text: string) => {
    speakEnglish(text, 0.9);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-between min-h-[92vh] py-6 px-4 space-y-6">
      {/* Top Header */}
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Conversation Completed</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          {isFullBridge ? 'The bridge is complete! 🌉' : 'You calmly finished the conversation! 🌱'}
        </h1>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          엄마와의 갈등 상황에서 감정을 다스리고 생각을 차분하게 전달했어요.
        </p>

        {/* Star Rating Section (Reward completion, not pronunciation accuracy) */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((starIdx) => {
              const active = starIdx <= starsCount;
              return (
                <div
                  key={starIdx}
                  className={`p-2 rounded-2xl transition-all duration-500 transform ${
                    active ? 'scale-110' : 'opacity-35 scale-90'
                  }`}
                >
                  <Star
                    className={`w-9 h-9 sm:w-11 sm:h-11 ${
                      active
                        ? 'fill-amber-400 text-amber-500 drop-shadow-md'
                        : 'text-stone-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-stone-500 mt-1">
            {starsCount === 3 && '⭐ 3 Stars: 5개 대화 모두 건너뛰기 없이 완료!'}
            {starsCount === 2 && '⭐ 2 Stars: 1개 건너뛰고 대화 완료!'}
            {starsCount === 1 && '⭐ 1 Star: 끝까지 대화를 마무리했어요!'}
          </p>
        </div>
      </header>

      {/* Middle Section: Completed Visual Bridge & Dialogue Flow */}
      <main className="space-y-4">
        {/* Visual Bridge completely connected */}
        <BridgeVisual completedSegments={5} isFinalResult={true} />

        {/* 5-Stage Dialogue Steps Review */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase tracking-wide">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>5 Steps of Peaceful Communication</span>
            </div>
            <span className="text-[11px] text-stone-400">Tap 🔊 to listen again</span>
          </div>

          <div className="space-y-2.5">
            {DIALOGUE_TURNS.map((turn, idx) => {
              const progress = turnProgress.find((p) => p.turnId === turn.id);
              const wasSkipped = progress?.skipped ?? false;

              return (
                <div
                  key={turn.id}
                  className={`p-3 rounded-2xl border transition-all text-left flex items-start justify-between gap-2 ${
                    wasSkipped
                      ? 'bg-stone-50 border-stone-200 text-stone-600'
                      : 'bg-emerald-50/50 border-emerald-200/70 text-stone-900'
                  }`}
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                        Step {idx + 1}: {turn.stageName} ({turn.stageNameKo})
                      </span>
                      {wasSkipped ? (
                        <span className="text-[10px] text-stone-400 font-medium">Skipped</span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Rebuilt
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-stone-800 pt-1">
                      &ldquo;{turn.studentTarget}&rdquo;
                    </p>
                    <p className="text-xs text-stone-500">
                      {turn.koreanMeaning}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlaySentence(turn.studentTarget)}
                    title="Listen to this expression"
                    aria-label={`Listen to ${turn.studentTarget}`}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer flex-shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Section: Inspiring Quote & Actions */}
      <footer className="space-y-4 text-center">
        {/* Inspiring quote strictly specified in PRD Screen 3 */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl py-3 px-4 text-stone-700 max-w-lg mx-auto">
          <p className="text-sm font-bold text-amber-900">
            &ldquo;Understanding starts when both sides speak and listen.&rdquo;
          </p>
          <p className="text-xs text-amber-800/80 mt-0.5">
            (이해는 양쪽이 말하고 들을 때 시작됩니다.)
          </p>
        </div>

        {/* Action Buttons: [Practice Again] [Home] */}
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={onRestart}
            aria-label="Practice dialogue again"
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again (다시 연습하기)</span>
          </button>

          <button
            onClick={onGoHome}
            aria-label="Go to start screen"
            className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm border border-stone-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home (처음으로)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
