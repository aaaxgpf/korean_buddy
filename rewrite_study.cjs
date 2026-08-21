const fs = require('fs');
const code = `
import React, { useState } from 'react';
import { Layers, BookOpen, Headphones, Mic, ChevronRight, ArrowLeft } from 'lucide-react';
import { FlashcardsView } from './FlashcardsView';
import { GrammarView } from './GrammarView';
import { DictationView } from './DictationView';
import { SpeakingView } from './SpeakingView';
import { NotebookView } from './NotebookView';

interface Props {
  flashcardsProps: any;
  grammarProps: any;
  dictationProps: any;
  speakingProps: any;
  notebookProps: any;
}

export const StudyView: React.FC<Props> = ({
  flashcardsProps,
  grammarProps,
  dictationProps,
  speakingProps,
  notebookProps
}) => {
  const [currentView, setCurrentView] = useState<'menu' | 'flashcards' | 'grammar' | 'dictation' | 'speaking' | 'notebook'>('menu');

  const menus = [
    { id: 'flashcards', label: 'Flashcards', desc: 'Study vocabulary and phrases', icon: Layers, color: 'text-rose-500', bg: 'bg-rose-100' },
    { id: 'grammar', label: 'Grammar', desc: 'Learn sentence structures', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'dictation', label: 'Dictation', desc: 'Listening & writing practice', icon: Headphones, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 'speaking', label: 'Speaking', desc: 'Pronunciation and dialogue', icon: Mic, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'notebook', label: 'Notebook', desc: 'Your saved items', icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  ] as const;

  if (currentView !== 'menu') {
    const activeMenu = menus.find(m => m.id === currentView);
    return (
      <div className="flex flex-col h-full w-full bg-[#FAF9F6] relative">
        <div className="flex items-center px-4 py-3 bg-white border-b border-stone-200 shrink-0 sticky top-0 z-20">
          <button onClick={() => setCurrentView('menu')} className="mr-3 p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg text-stone-800">{activeMenu?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {currentView === 'flashcards' && <FlashcardsView {...flashcardsProps} />}
          {currentView === 'grammar' && <GrammarView {...grammarProps} />}
          {currentView === 'dictation' && <DictationView {...dictationProps} />}
          {currentView === 'speaking' && <SpeakingView {...speakingProps} />}
          {currentView === 'notebook' && <NotebookView {...notebookProps} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF9F6] overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <h1 className="text-2xl font-bold text-stone-800 px-2 mt-4">Study Modules</h1>
        <div className="space-y-3">
          {menus.map(menu => (
            <button
              key={menu.id}
              onClick={() => setCurrentView(menu.id as any)}
              className="w-full flex items-center p-4 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className={\`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 \${menu.bg} \${menu.color} mr-4\`}>
                <menu.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[17px] text-stone-800">{menu.label}</h3>
                <p className="text-sm text-stone-500">{menu.desc}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-50 group-hover:bg-stone-100 transition-colors">
                <ChevronRight size={20} className="text-stone-400 group-hover:text-stone-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/StudyView.tsx', code, 'utf-8');
