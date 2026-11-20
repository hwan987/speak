import React, { useState } from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenLogin: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenLogin }) => {
  const { isAuthenticated, profile, user, signOut, loading } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleLoginLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onOpenLogin();
  };

  if (loading) {
    return (
      <nav aria-label="계정 메뉴" className="w-full flex justify-end items-center h-9">
        <div className="w-14 h-7 rounded-xl bg-stone-200/60 animate-pulse" />
      </nav>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <nav aria-label="계정 메뉴" className="w-full flex justify-end items-center h-9">
        <a
          href="#login"
          onClick={handleLoginLinkClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>로그인</span>
        </a>
      </nav>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || '사용자';
  const email = profile?.email || user.email || '';
  const avatarUrl = !imgError ? profile?.avatar_url : null;

  return (
    <nav aria-label="계정 메뉴" className="w-full flex justify-end items-center h-9">
      <div
        className="relative group"
        onMouseEnter={() => setIsPopoverOpen(true)}
        onMouseLeave={() => setIsPopoverOpen(false)}
      >
        <button
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          aria-label="사용자 프로필 메뉴"
          aria-expanded={isPopoverOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 p-0.5 pr-2 rounded-full bg-white border border-stone-200 hover:border-amber-300 shadow-2xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName} 프로필 사진`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-8 h-8 rounded-full object-cover border border-amber-200"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-xs font-bold">
              {displayName ? displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </span>
          )}
          <span className="text-xs font-semibold text-stone-700 max-w-[110px] truncate hidden sm:inline">
            {displayName}
          </span>
        </button>

        {/* Hover / Focus Popover */}
        <div
          role="menu"
          className={`absolute right-0 top-full pt-2 w-56 z-40 transition-all duration-150 ${
            isPopoverOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto'
          }`}
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-3 space-y-2.5 text-left">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-stone-200 flex-shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {displayName}
                </p>
                {email && (
                  <p className="text-[11px] text-stone-500 truncate">{email}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setIsPopoverOpen(false);
                await signOut();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
