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
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">Route Saver</h1>
            <p className="text-xs text-slate-400">Google Maps ✕ Cloud Route Manager</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>ルート作成</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>保存済みルート</span>
            {savedRoutesCount > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                {savedRoutesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
              <span className="text-sm font-medium text-slate-200 hidden md:inline">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                title="ログアウト"
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Googleでログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
