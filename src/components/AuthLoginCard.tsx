import React, { useState } from 'react';
import { HeartHandshake, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthLoginCardProps {
  onClose?: () => void;
}

export const AuthLoginCard: React.FC<AuthLoginCardProps> = () => {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleClick = async () => {
    clearAuthError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-center">
      {/* Brand Icon & Title matching Main Page Concept */}
      <div className="space-y-2.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <HeartHandshake className="w-6 h-6 text-amber-700" />
        </div>

        <div>
          <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">
            Talk It Out! — Family Talk
          </p>
          <h2
            id="login-modal-title"
            className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1"
          >
            반가워요!
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
          별도의 회원가입 절차 없이
          <br />
          Google 계정으로 간편하게 시작해 보세요.
        </p>
      </div>

      {/* Warm Divider */}
      <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl px-4 py-3 text-xs text-stone-600">
        차분한 가족 대화 연습을 안전하게 이어갈 수 있어요.
      </div>

      {/* Single Google Login Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={submitting}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-amber-50/50 text-stone-800 font-bold text-sm sm:text-base border border-stone-300 hover:border-amber-400 shadow-sm hover:shadow transition-all active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
        >
          {/* Google G Logo */}
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{submitting ? 'Google로 연결 중...' : 'Google로 계속하기'}</span>
        </button>

        {authError && (
          <p
            role="alert"
            className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2"
          >
            {authError}
          </p>
        )}
      </div>

      {/* Footer Privacy Reassurance */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        <span>Voice is processed to text only • Never recorded or saved</span>
      </div>
    </div>
  );
};
