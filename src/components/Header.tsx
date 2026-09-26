'use client';

import React from 'react';
import { MapPin, LogIn, LogOut, User as UserIcon, Bookmark, PlusCircle } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'create' | 'list';
  setActiveTab: (tab: 'create' | 'list') => void;
  savedRoutesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  savedRoutesCount,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('create')}>
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-wide text-white">Route Saver</h1>
            <p className="text-[11px] text-slate-400">Google Maps ✕ Cloud Route Manager</p>
          </div>
        </div>

        {/* Tab Switcher (Segmented Style) */}
        <nav className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>ルート作成</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>保存済みルート</span>
            {savedRoutesCount > 0 && (
              <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-0.5">
                {savedRoutesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2.5 bg-slate-950 py-1.5 px-3 rounded-xl border border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-slate-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
              <span className="text-xs font-medium text-slate-200 hidden md:inline">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                title="ログアウト"
                className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Googleでログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
