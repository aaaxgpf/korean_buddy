import React from 'react';
import { MessageSquare, BookOpen, Settings } from 'lucide-react';
import { Companion } from '../types';

interface Props {
  theme?: string;
  hideMobileNav?: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  // keep remaining props optional for compatibility right now
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, hideMobileNav, theme }) => {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      <header className={`hidden md:block sticky top-0 z-30 ${theme === 'kkt' ? 'bg-[#b2c7d9]/95 border-[#9bbbd4]' : theme === 'wechat' ? 'bg-[#EDEDED]/95 border-[#D5D5D5]' : 'bg-transparent border-transparent'} backdrop-blur-md border-b text-[#2D2D2D] transition-colors`} >
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer group select-none shrink-0" onClick={() => setActiveTab('chat')}>
              <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-sans text-xl font-bold shadow-sm">
                가
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-sans tracking-tighter text-2xl font-bold text-stone-900 leading-none">
                  Korean <span className="font-medium italic text-stone-400">Buddy</span>
                </span>
              </div>
            </div>
            
            <nav className="flex items-center gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                      isActive 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <tab.icon size={18} className={isActive ? 'opacity-100' : 'opacity-70'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {!hideMobileNav && (
        <nav className="md:hidden fixed bottom-0 w-full h-14 backdrop-blur-md bg-white/85 border-t border-slate-100 px-6 py-1 pb-safe flex justify-around items-center z-40">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600 font-medium'
                }`}
              >
                <tab.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[11px] tracking-tight leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};
