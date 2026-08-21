
import React, { useState } from 'react';
import { Layers, BookOpen, Headphones, Mic, ChevronRight, ArrowLeft, Calendar, Sparkles, Upload, FileSpreadsheet } from 'lucide-react';
import { FlashcardsView } from './FlashcardsView';
import { GrammarView } from './GrammarView';
import { DictationView } from './DictationView';
import { SpeakingView } from './SpeakingView';
import { NotebookView } from './NotebookView';
import { DailyStudySessionView } from './DailyStudySessionView';
import { LexiconUploadCenter } from './LexiconUploadCenter';
import { CustomLexiconBook } from '../types';

interface Props {
  flashcardsProps: any;
  grammarProps: any;
  dictationProps: any;
  speakingProps: any;
  notebookProps: any;
  onImportCustomWords?: (newWords: any[], book: CustomLexiconBook) => void;
}

export const StudyView: React.FC<Props> = ({
  flashcardsProps,
  grammarProps,
  dictationProps,
  speakingProps,
  notebookProps,
  onImportCustomWords,
}) => {
  const [currentView, setCurrentView] = useState<'menu' | 'daily_plan' | 'lexicon_uploader' | 'flashcards' | 'grammar' | 'dictation' | 'speaking' | 'notebook'>('menu');
  const [activeSelectedBook, setActiveSelectedBook] = useState<CustomLexiconBook | null>(null);

  const menus = [
    { id: 'daily_plan', label: '3-Stage Study Plan', desc: 'Warm-up, flashcards & active recall dictation', icon: Calendar, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'lexicon_uploader', label: '📥 词书上传与 AI 扩充引擎', desc: 'PDF / JSON / CSV 词书导入与实时衍生新题库', icon: Upload, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'flashcards', label: 'Flashcards', desc: 'Study vocabulary and phrases', icon: Layers, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'grammar', label: 'Grammar', desc: 'Learn sentence structures', icon: BookOpen, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'dictation', label: 'Dictation', desc: 'Listening & writing practice', icon: Headphones, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'speaking', label: 'Speaking', desc: 'Pronunciation and dialogue', icon: Mic, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
    { id: 'notebook', label: 'Notebook', desc: 'Your saved items', icon: Layers, color: 'text-stone-900', bg: 'bg-[#F4F4F6]' },
  ] as const;

  const handleSelectBookForStudy = (book: CustomLexiconBook) => {
    setActiveSelectedBook(book);
    setCurrentView('daily_plan');
  };

  if (currentView !== 'menu') {
    const activeMenu = menus.find(m => m.id === currentView);
    return (
      <div className="flex flex-col h-full w-full bg-transparent relative">
        <div className="flex items-center px-4 py-3.5 bg-white/70 backdrop-blur-md shrink-0 sticky top-0 z-20 border-b border-stone-200">
          <button onClick={() => setCurrentView('menu')} className="mr-3 p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-[6px] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-bold text-base text-stone-900">{activeMenu?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 relative p-4 md:p-6">
          {currentView === 'daily_plan' && (
            <DailyStudySessionView
              vocabulary={flashcardsProps.vocabulary}
              savedVocabIds={flashcardsProps.savedVocabIds}
              onToggleBookmarkVocab={flashcardsProps.onToggleBookmarkVocab}
              onSaveVocab={flashcardsProps.onAddCustomVocab}
              activeCustomBook={activeSelectedBook}
            />
          )}
          {currentView === 'lexicon_uploader' && (
            <LexiconUploadCenter
              onImportWords={(newWords, book) => {
                if (onImportCustomWords) {
                  onImportCustomWords(newWords, book);
                } else if (flashcardsProps.onAddCustomVocab) {
                  newWords.forEach(w => flashcardsProps.onAddCustomVocab(w));
                }
              }}
              onSelectBookForStudy={handleSelectBookForStudy}
              totalVocabCount={flashcardsProps.vocabulary.length}
            />
          )}
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
    <div className="h-full w-full overflow-y-auto bg-transparent p-4 md:p-8 pb-32">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="px-2 mt-6 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Study Modules</h1>
          <p className="text-xs text-stone-500 mt-1">系统化词汇学习、真题解析与多感官实战演练</p>
        </div>
        <div className="space-y-2.5">
          {menus.map(menu => (
            <button
              key={menu.id}
              onClick={() => setCurrentView(menu.id as any)}
              className="w-full flex items-center p-4 bg-[#F4F4F6] hover:bg-stone-200/70 border border-stone-200 rounded-[6px] transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-[6px] bg-white border border-stone-200 flex items-center justify-center shrink-0 text-stone-800 mr-3.5 shadow-2xs">
                <menu.icon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-stone-900">{menu.label}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{menu.desc}</p>
              </div>
              <div className="w-6 h-6 flex items-center justify-center transition-colors text-stone-400 group-hover:text-stone-800">
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
