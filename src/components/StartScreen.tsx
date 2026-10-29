import React from 'react';
import { BridgeVisual } from './BridgeVisual';
import { ShieldCheck, HeartHandshake, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const handlePlayMomPreview = () => {
    speakEnglish('I was only worried about you.', 0.9);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between min-h-[92vh] py-6 px-4">
      {/* Top Header Section: Clean & Focused */}
      <header className="w-full text-center space-y-2 pt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Talk It Out! <span className="text-amber-700 font-semibold block text-xl sm:text-2xl mt-0.5">Family Talk</span>
        </h1>
        <p className="text-[11px] text-stone-400 font-mono tracking-wider">최정환 • 2025315143</p>

        {/* Short & Gentle Situation Cue */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-2.5 max-w-md mx-auto text-center shadow-2xs mt-3">
          <p className="text-stone-800 text-sm font-medium">
            &ldquo;You came home tired and answered Mom too sharply about homework.&rdquo;
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            (피곤한 마음에 엄마의 숙제 질문에 날카롭게 대답했어요.)
          </p>
        </div>
      </header>

      {/* Middle Section: The Broken Bridge & Mom's Bubble */}
      <main className="w-full my-auto flex flex-col items-center space-y-3">
        {/* Mom's message bubble */}
        <div className="relative bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-2xl max-w-sm shadow-xs text-center">
          <div className="flex items-center justify-center gap-2 font-semibold text-sm">
            <span>&ldquo;I was only worried about you.&rdquo;</span>
            <button
              onClick={handlePlayMomPreview}
              title="Listen to Mom"
              aria-label="Listen to Mom preview"
              className="p-1 rounded-full hover:bg-rose-200/80 text-rose-700 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-rose-700/80 mt-0.5">
            (엄마는 그냥 너 걱정돼서 그랬던 거였어.)
          </p>
          {/* Bubble pointer */}
          <div className="absolute -bottom-2 right-12 w-3 h-3 bg-rose-50 border-r border-b border-rose-200 transform rotate-45"></div>
        </div>

        {/* Visual Bridge */}
        <BridgeVisual completedSegments={0} currentSegmentIndex={0} />
      </main>

      {/* Bottom Section: Primary Action & Compact Privacy Notice */}
      <footer className="w-full max-w-md space-y-3 flex flex-col items-center pb-2">
        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <HeartHandshake className="w-5 h-5" />
          <span>Start Conversation (대화 시작하기)</span>
        </button>

        {/* Concise Privacy Notice */}
        <div className="flex items-center justify-center gap-1.5 text-stone-500 text-[11px] text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Voice is processed to text only • Never recorded or saved</span>
        </div>
      </footer>
    </div>
  );
};
