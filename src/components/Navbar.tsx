import React from 'react';
import { MessageSquare, Compass, BookOpen, Settings } from 'lucide-react';
import { Companion } from '../types';

interface Props {
  theme?: string;
  hideMobileNav?: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, hideMobileNav }) => {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'moments', label: 'Feed', icon: Compass },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Desktop Navigation Header */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-stone-200 text-stone-900 transition-colors shadow-2xs">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group select-none shrink-0" onClick={() => setActiveTab('chat')}>
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-sans text-lg font-bold shadow-xs">
                가
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans tracking-tight text-xl font-bold text-stone-900 leading-none">
                  Korean <span className="font-medium text-stone-400">Buddy</span>
                </span>
              </div>
            </div>
            
            <nav className="flex items-center gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-stone-900 text-white shadow-xs' 
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/90'
                    }`}
                  >
                    <tab.icon size={15} className={isActive ? 'opacity-100' : 'opacity-70'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      {!hideMobileNav && (
        <nav className="md:hidden fixed bottom-0 w-full h-14 backdrop-blur-xl bg-white/95 border-t border-stone-200 px-4 py-1 pb-safe flex justify-around items-center z-40 shadow-xs text-stone-900">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive ? 'text-stone-900 font-bold scale-105' : 'text-stone-400 hover:text-stone-600 font-medium'
                }`}
              >
                <tab.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.3 : 1.8} />
                <span className="text-[10px] tracking-tight leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};


