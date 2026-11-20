import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthLoginCard } from './AuthLoginCard';
import { useAuth } from '../contexts/AuthContext';

interface AuthPageProps {
  onBackHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBackHome }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      onBackHome();
    }
  }, [loading, isAuthenticated, onBackHome]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[92vh] py-6 px-4">
      <div className="w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-amber-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>메인으로 돌아가기</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7">
          <AuthLoginCard />
        </div>
      </div>
    </div>
  );
};
