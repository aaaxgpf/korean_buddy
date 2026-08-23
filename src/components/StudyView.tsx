import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Headphones,
  ArrowLeft,
  Calendar,
  Upload,
  Bookmark,
  Play,
  ChevronRight
} from 'lucide-react';
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
  const [currentView, setCurrentView] = useState<
    'menu' | 'daily_plan' | 'lexicon_uploader' | 'flashcards' | 'grammar' | 'dictation' | 'speaking' | 'notebook'
  >('menu');
  const [activeSelectedBook, setActiveSelectedBook] = useState<CustomLexiconBook | null>(null);

  const totalVocabCount = flashcardsProps?.vocabulary?.length || 0;
  const savedWordsCount = notebookProps?.savedVocabItems?.length || flashcardsProps?.savedVocabIds?.length || 0;
  const grammarCount = grammarProps?.grammarCards?.length || 18;

  const handleSelectBookForStudy = (book: CustomLexiconBook) => {
    setActiveSelectedBook(book);
    setCurrentView('daily_plan');
  };

  const getSubViewTitle = () => {
    switch (currentView) {
      case 'daily_plan':
        return '三阶段研习计划';
      case 'lexicon_uploader':
        return '自定义词书与管理';
      case 'flashcards':
        return '核心词汇闪卡';
      case 'grammar':
        return '语法与句型精讲';
      case 'dictation':
        return '主动听写与辨音';
      case 'speaking':
        return '实战跟读与发音评测';
      case 'notebook':
        return '生词与错题本';
      default:
        return '研习中心';
    }
  };

  if (currentView !== 'menu') {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50/50 relative">
        <div className="flex items-center px-4 py-3 bg-white shrink-0 sticky top-0 z-20 border-b border-black/[0.04]">
          <button
            onClick={() => setCurrentView('menu')}
            className="mr-3 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft size={15} />
            <span>返回研习中心</span>
          </button>
          <div className="h-3.5 w-px bg-slate-200 mr-3" />
          <h2 className="font-semibold text-sm text-slate-900">{getSubViewTitle()}</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 relative p-4 md:p-6 pb-28">
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
                  newWords.forEach((w: any) => flashcardsProps.onAddCustomVocab(w));
                }
              }}
              onSelectBookForStudy={handleSelectBookForStudy}
              totalVocabCount={totalVocabCount}
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
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 p-4 md:p-8 pb-36">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/[0.04]">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              研习中心
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              词汇 · 语法 · 听写 · 错题精进
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-white rounded-lg border border-black/[0.04] shadow-sm flex items-center gap-2">
              <span className="text-xs text-slate-600">
                总词库：<span className="text-slate-900 font-semibold">{totalVocabCount}</span> 词
              </span>
            </div>
          </div>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* 1. HERO BENTO CARD: 3-Stage Study Plan (Full Width / Span 3) */}
          <div
            onClick={() => setCurrentView('daily_plan')}
            className="md:col-span-3 bg-white text-slate-900 p-6 sm:p-7 rounded-2xl shadow-sm hover:border-slate-300 transition-all cursor-pointer group relative border border-black/[0.04]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      三阶段研习计划
                    </h2>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-all shadow-sm">
                  <Play size={11} fill="currentColor" />
                  <span>开始研习</span>
                  <ChevronRight size={13} />
                </div>
              </div>

              {/* 3 Step Visual Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50/80 p-3.5 rounded-xl space-y-1 border border-black/[0.02]">
                  <div className="text-[11px] font-mono text-slate-400">STAGE 01</div>
                  <div className="text-xs font-semibold text-slate-900">语境填空</div>
                  <p className="text-[11px] text-slate-500">选择与判断填空，唤醒核心语感</p>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl space-y-1 border border-black/[0.02]">
                  <div className="text-[11px] font-mono text-slate-400">STAGE 02</div>
                  <div className="text-xs font-semibold text-slate-900">闪卡精读</div>
                  <p className="text-[11px] text-slate-500">双向翻卡、汉字词源与例句发音</p>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl space-y-1 border border-black/[0.02]">
                  <div className="text-[11px] font-mono text-slate-400">STAGE 03</div>
                  <div className="text-xs font-semibold text-slate-900">听写召回</div>
                  <p className="text-[11px] text-slate-500">键盘拼写挑战，巩固肌肉记忆</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. LEXICON UPLOADER (Span 2) */}
          <div
            onClick={() => setCurrentView('lexicon_uploader')}
            className="md:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-black/[0.04] shadow-sm hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                  <Upload size={16} />
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  PDF / JSON / CSV / TXT
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  自定义词书与管理
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  导入教材文件、管理与重命名词书，支持 AI 衍生例句与测试题。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">本地存储 · 随时管理</span>
              <span className="font-medium text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                进入词书库 <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* 3. NOTEBOOK (Span 1) */}
          <div
            onClick={() => setCurrentView('notebook')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-black/[0.04] shadow-sm hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Bookmark size={16} />
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {savedWordsCount} 词
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">生词与错题本</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  记录互动与测验中收藏的生词及错题。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">针对性巩固</span>
              <span className="font-medium text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                查看错题 <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* 4. FLASHCARDS (Span 1) */}
          <div
            onClick={() => setCurrentView('flashcards')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-black/[0.04] shadow-sm hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {totalVocabCount} 词
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">核心词汇闪卡</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  双向翻转闪卡与真人发音。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">抽认精读</span>
              <span className="font-medium text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                进入闪卡 <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* 5. GRAMMAR (Span 1) */}
          <div
            onClick={() => setCurrentView('grammar')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-black/[0.04] shadow-sm hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {grammarCount} 项
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">语法句型精讲</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  词尾活用与核心句型规则拆解。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">语法索引</span>
              <span className="font-medium text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                查看语法 <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* 6. DICTATION (Span 1) */}
          <div
            onClick={() => setCurrentView('dictation')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-black/[0.04] shadow-sm hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Headphones size={16} />
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  听音拼写
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">主动听写与辨音</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  连音辨析与精准键盘拼写。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">听力训练</span>
              <span className="font-medium text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                开始听写 <ChevronRight size={13} />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
