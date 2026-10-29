/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { DIALOGUE_TURNS, TurnProgress } from './types/dialogue';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'practice' | 'result'>('start');
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [turnProgress, setTurnProgress] = useState<TurnProgress[]>(() =>
    DIALOGUE_TURNS.map((t) => ({
      turnId: t.id,
      completed: false,
      skipped: false,
      attempts: 0,
      recognizedText: '',
    }))
  );

  // Check ?autostart=1 parameter for direct verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setCurrentScreen('practice');
      }
    }
  }, []);

  const handleStartPractice = () => {
    setCurrentTurnIndex(0);
    setTurnProgress(
      DIALOGUE_TURNS.map((t) => ({
        turnId: t.id,
        completed: false,
        skipped: false,
        attempts: 0,
        recognizedText: '',
      }))
    );
    setCurrentScreen('practice');
  };

  const handleCompleteTurn = (turnId: number, skipped: boolean, transcript: string) => {
    setTurnProgress((prev) =>
      prev.map((item) =>
        item.turnId === turnId
          ? {
              ...item,
              completed: !skipped,
              skipped,
              recognizedText: transcript,
            }
          : item
      )
    );

    if (currentTurnIndex + 1 < DIALOGUE_TURNS.length) {
      setCurrentTurnIndex((prev) => prev + 1);
    } else {
      setCurrentScreen('result');
    }
  };

  const handleFinishDialogue = () => {
    setCurrentScreen('result');
  };

  const handleRestart = () => {
    handleStartPractice();
  };

  const handleGoHome = () => {
    setCurrentScreen('start');
    setCurrentTurnIndex(0);
  };

  const completedCount = turnProgress.filter((p) => p.completed).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased selection:bg-amber-200 selection:text-amber-900 font-sans">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {currentScreen === 'start' && (
          <StartScreen onStart={handleStartPractice} />
        )}

        {currentScreen === 'practice' && (
          <PracticeScreen
            currentTurn={DIALOGUE_TURNS[currentTurnIndex]}
            currentTurnIndex={currentTurnIndex}
            totalTurns={DIALOGUE_TURNS.length}
            completedTurnsCount={completedCount}
            turnProgress={turnProgress}
            onCompleteTurn={handleCompleteTurn}
            onFinishDialogue={handleFinishDialogue}
          />
        )}

        {currentScreen === 'result' && (
          <ResultScreen
            turnProgress={turnProgress}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </div>
  );
}
