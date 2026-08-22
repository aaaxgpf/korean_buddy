import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Headphones,
  Mic,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  Upload,
  Bookmark,
  CheckCircle2,
  Play,
  Zap,
  TrendingUp,
  Award
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
        return '三阶段研习计划 (3-Stage Study Plan)';
      case 'lexicon_uploader':
        return '自定义词书导入与 AI 扩充 (Lexicon Upload)';
      case 'flashcards':
        return '核心词汇闪卡精读 (Vocabulary Flashcards)';
      case 'grammar':
        return '语法与句型精讲 (Grammar Mastery)';
      case 'dictation':
        return '主动听写与辨音实验 (Dictation Lab)';
      case 'speaking':
        return '实战跟读与发音评测 (Speaking & Pronunciation)';
      case 'notebook':
        return '生词与错题本 (Study Notebook)';
      default:
        return '研习中心 (Study Lab)';
    }
  };

  if (currentView !== 'menu') {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50/50 relative">
        <div className="flex items-center px-4 py-3 bg-white/80 backdrop-blur-md shrink-0 sticky top-0 z-20 border-b border-stone-200/60">
          <button
            onClick={() => setCurrentView('menu')}
            className="mr-3 p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft size={16} />
            <span>返回研习中心</span>
          </button>
          <div className="h-3.5 w-px bg-stone-200 mr-3" />
          <h2 className="font-semibold text-sm text-stone-900">{getSubViewTitle()}</h2>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                韩语研习室 (Study Lab)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900 text-white tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              科学三阶段精进学习法 · 词汇 · 语法 · 听写 · 口语全方位掌握
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-1.5 bg-white rounded-full border border-stone-200/80 shadow-xs flex items-center gap-2">
              <TrendingUp size={14} className="text-stone-600" />
              <span className="text-xs font-medium text-stone-600">
                词汇总库：<strong className="text-stone-900 font-semibold">{totalVocabCount}</strong> 词
              </span>
            </div>
          </div>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">

          {/* 1. HERO BENTO CARD: 3-Stage Study Plan (Full Width / Span 3) */}
          <div
            onClick={() => setCurrentView('daily_plan')}
            className="md:col-span-3 bg-white text-stone-900 p-6 sm:p-8 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden border border-stone-200/80 hover:border-stone-300"
          >
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
                    <Zap size={20} className="fill-amber-400/30" />
                  </div>
                  <div>
                    <span className="text-[11px] tracking-wider uppercase text-stone-400 font-semibold block">
                      Daily Recommendation · 今日研习推荐
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                      科学三阶段精进研习计划 (3-Stage Study Plan)
                    </h2>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                  <Calendar size={13} className="text-stone-500" />
                  <span>每日 15 分钟</span>
                </div>
              </div>

              {/* 3 Step Visual Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50/80 p-4 rounded-xl space-y-1 transition-all hover:bg-slate-100/80">
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span className="text-stone-400 text-[11px]">STAGE 01</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-semibold">
                      语感唤醒
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">Stage 01 语境填空与感知</div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">选择与判断填空，唤醒韩语核心语感</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-xl space-y-1 transition-all hover:bg-slate-100/80">
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span className="text-stone-400 text-[11px]">STAGE 02</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold">
                      深度精读
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">Stage 02 闪卡精读与例句</div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">双向翻卡、汉字词剖析与地道发音</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-xl space-y-1 transition-all hover:bg-slate-100/80">
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span className="text-stone-400 text-[11px]">STAGE 03</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100/70 text-sky-800 text-[10px] font-semibold">
                      肌肉记忆
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">Stage 03 主动召回与听写</div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">键盘拼写挑战，形成肌肉记忆</p>
                </div>
              </div>

              {/* Action trigger */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-stone-500 hidden sm:block">
                  支持延世韩国语、TOPIK 历年真题及自定义词书无缝切换
                </p>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-medium hover:bg-stone-800 transition-all shadow-xs">
                  <Play size={12} fill="currentColor" />
                  <span>开启今日研习</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. LEXICON UPLOADER (Span 2) */}
          <div
            onClick={() => setCurrentView('lexicon_uploader')}
            className="md:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-900">
                  <Upload size={18} />
                </div>
                <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                  PDF / JSON / CSV / TXT
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  自定义词书导入与 AI 扩充 (Lexicon Upload)
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  导入延世韩国语、TOPIK 官方词表或自定义教材文件，AI 智能提炼汉字词源、例句与配套练习。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-normal text-stone-500">内置延世 1~6 级及 MZ 流行语词库</span>
              <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                自定义词书导入 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 3. NOTEBOOK (Span 1) */}
          <div
            onClick={() => setCurrentView('notebook')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Bookmark size={18} />
                </div>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full">
                  {savedWordsCount} 词已收藏
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-stone-900">生词与错题本 (Notebook)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  汇聚聊天互动与测验练习中收藏的重点生词、易错句型与发音点。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">错题靶向复习</span>
              <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                生词与错题本 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 4. FLASHCARDS (Span 1) */}
          <div
            onClick={() => setCurrentView('flashcards')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <span className="text-xs font-medium text-stone-400">
                  {totalVocabCount} 张闪卡
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-stone-900">核心词汇闪卡 (Flashcards)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  包含真人原生发音、例句对照解析与汉字词词源拆解的双向翻转闪卡。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">双向抽认精读</span>
              <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                核心词汇闪卡 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 5. GRAMMAR (Span 1) */}
          <div
            onClick={() => setCurrentView('grammar')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <span className="text-xs font-medium text-stone-400">
                  {grammarCount} 项语法
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-stone-900">语法与句型精讲 (Grammar)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  从词尾活用、敬语谦语阶梯到日常对话核心句型公式深度解析。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">语法规则手册</span>
              <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                语法句型精讲 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 6. DICTATION (Span 1) */}
          <div
            onClick={() => setCurrentView('dictation')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                  主动召回
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-stone-900">主动听写与辨音 (Dictation)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  地道语速听辨、收音连音辨析与精准键盘拼写输入强化训练。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">听力肌肉记忆</span>
              <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                场景听写与辨音 <ChevronRight size={14} />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
