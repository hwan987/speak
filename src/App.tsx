/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { AuthPage } from './components/AuthPage';
import { UserMenu } from './components/UserMenu';
import { LoginModal } from './components/LoginModal';
import { DIALOGUE_TURNS, TurnProgress } from './types/dialogue';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [currentScreen, setCurrentScreen] = useState<'start' | 'practice' | 'result' | 'auth'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      return 'auth';
    }
    return 'start';
  });

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

  const handleGoHome = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      window.history.replaceState({}, '', '/');
    }
    setCurrentScreen('start');
    setCurrentTurnIndex(0);
  }, []);

  // Redirect to main page once logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentScreen === 'auth') {
      handleGoHome();
    }
  }, [authLoading, isAuthenticated, currentScreen, handleGoHome]);

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

  const completedCount = turnProgress.filter((p) => p.completed).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased selection:bg-amber-200 selection:text-amber-900 font-sans">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {currentScreen !== 'auth' && (
          <div className="pt-3 pb-1">
            <UserMenu onOpenLogin={() => setIsLoginOpen(true)} />
          </div>
        )}

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

        {currentScreen === 'auth' && (
          <AuthPage onBackHome={handleGoHome} />
        )}

        {currentScreen === 'result' && (
          <ResultScreen
            turnProgress={turnProgress}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
          />
        )}
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
