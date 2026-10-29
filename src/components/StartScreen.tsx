import React from 'react';
import { BridgeVisual } from './BridgeVisual';
import { ShieldCheck, MessageCircle, HeartHandshake, Sparkles, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const handlePlayMomPreview = () => {
    speakEnglish('I was only worried about you.', 0.9);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[95vh] py-4 px-4 space-y-4">
      {/* Top Header Section */}
      <header className="w-full text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-semibold tracking-wide border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Middle School English Speaking • CEFR A2</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Talk It Out! — <span className="text-amber-700">Family Talk</span>
        </h1>
        <p className="text-xs text-stone-500 font-medium">최정환 / 2025315143</p>

        {/* Situation Card */}
        <div className="mt-2 bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-stone-200 shadow-sm text-left max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            <MessageCircle className="w-4 h-4 text-amber-600" />
            <span>Situation (대화 상황)</span>
          </div>
          <p className="text-stone-800 text-sm font-medium leading-relaxed">
            &ldquo;You came home tired and were taking a short break. Mom asked about your homework again, and you answered too sharply.&rdquo;
          </p>
          <p className="text-stone-500 text-xs mt-1 border-t border-stone-100 pt-1 leading-relaxed">
            학교와 학원을 마치고 피곤한 상태로 잠깐 쉬고 있었는데, 엄마가 숙제했냐고 자꾸 물어보셔서 날카롭게 대답하고 말았어요.
          </p>
        </div>
      </header>

      {/* Middle Section: Visual Bridge & Mom's message */}
      <main className="w-full my-2 flex flex-col items-center space-y-3">
        {/* Mom's message bubble */}
        <div className="relative bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl max-w-md shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 font-semibold text-sm">
            <span>&ldquo;I was only worried about you.&rdquo;</span>
            <button
              onClick={handlePlayMomPreview}
              title="Listen to Mom"
              aria-label="Listen to Mom preview"
              className="p-1 rounded-full hover:bg-rose-200/70 text-rose-700 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-rose-700/80 mt-0.5">
            (엄마는 그냥 너 걱정돼서 그랬던 거였어.)
          </p>
          {/* Speech bubble pointer */}
          <div className="absolute -bottom-2 right-12 w-3 h-3 bg-rose-50 border-r border-b border-rose-200 transform rotate-45"></div>
        </div>

        {/* Visual Bridge with 0/5 built */}
        <BridgeVisual completedSegments={0} currentSegmentIndex={0} />

        <div className="text-center text-xs text-stone-500 max-w-md">
          차분하게 5번의 대화를 나누며 끊어진 이해의 다리를 하나씩 다시 연결해 보세요.
        </div>
      </main>

      {/* Bottom Section: Action & Required Privacy Notice */}
      <footer className="w-full max-w-lg space-y-4 flex flex-col items-center">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <HeartHandshake className="w-5 h-5" />
          <span>Start Conversation (대화 시작하기)</span>
        </button>

        {/* Required Privacy & Safety Notice */}
        <div className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-stone-100/90 rounded-xl text-stone-600 text-xs border border-stone-200 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Your voice is processed to turn it into text and is not recorded or saved.
            <br className="sm:hidden" />
            <span className="text-stone-500 ml-1">
              (음성은 텍스트 변환용으로만 사용되며 녹음·저장되지 않습니다.)
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
};
