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
        return '3-Stage Study Plan (三阶段研习计划)';
      case 'lexicon_uploader':
        return 'Lexicon Upload & AI Expansion (词书上传与扩充中心)';
      case 'flashcards':
        return 'Vocabulary Flashcards (核心词汇闪卡)';
      case 'grammar':
        return 'Grammar Mastery (语法句型精讲)';
      case 'dictation':
        return 'Dictation Lab (听写与听力辨音)';
      case 'speaking':
        return 'Speaking & Pronunciation (实战跟读评测)';
      case 'notebook':
        return 'Study Notebook (专属生词与错题本)';
      default:
        return 'Study';
    }
  };

  if (currentView !== 'menu') {
    return (
      <div className="flex flex-col h-full w-full bg-stone-50/50 relative">
        <div className="flex items-center px-4 py-3.5 bg-white/90 backdrop-blur-md shrink-0 sticky top-0 z-20 border-b border-stone-200">
          <button
            onClick={() => setCurrentView('menu')}
            className="mr-3 p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>返回学习中心</span>
          </button>
          <div className="h-4 w-px bg-stone-200 mr-3" />
          <h2 className="font-bold text-sm text-stone-900">{getSubViewTitle()}</h2>
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
    <div className="h-full w-full overflow-y-auto bg-stone-50/40 p-4 md:p-8 pb-36 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                Korean Study Lab
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-white tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              科学三阶段精进学习法 · 真题题库解析与多感官实战演练
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center gap-2">
              <TrendingUp size={14} className="text-stone-700" />
              <span className="text-xs font-semibold text-stone-700">
                词库储备: <strong className="text-stone-900">{totalVocabCount}</strong> 词
              </span>
            </div>
          </div>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">

          {/* 1. HERO BENTO CARD: 3-Stage Study Plan (Full Width / Span 3) */}
          <div
            onClick={() => setCurrentView('daily_plan')}
            className="md:col-span-3 bg-gradient-to-br from-white via-slate-50 to-amber-50/40 text-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden border border-slate-200/90 hover:border-slate-300 hover:-translate-y-0.5"
          >
            {/* Background subtle geometric glow */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-amber-200/25 via-slate-100/40 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute right-8 bottom-6 text-slate-200/50 text-8xl font-black font-mono select-none pointer-events-none">
              3-STEP
            </div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Zap size={20} className="fill-amber-400/30" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-bold block">
                      Recommended Daily Drill
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      3-Stage Study Plan · 三阶段研习法
                    </h2>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-2xs">
                  <Calendar size={13} className="text-slate-500" />
                  <span>每日沉浸式 15 分钟</span>
                </div>
              </div>

              {/* 3 Step Visual Cards (Pure White with Subtle Hover Elevation) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white border border-slate-200/90 hover:border-amber-300/80 p-4 rounded-xl space-y-1.5 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400 text-[11px]">STAGE 01</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/60">
                      热身
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">语境填空与感知</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">选择与判断填空，唤醒韩语核心语感</p>
                </div>

                <div className="bg-white border border-slate-200/90 hover:border-emerald-300/80 p-4 rounded-xl space-y-1.5 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400 text-[11px]">STAGE 02</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                      精记
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">闪卡精读与例句</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">双向翻卡、汉字词源剖析与地道原声</p>
                </div>

                <div className="bg-white border border-slate-200/90 hover:border-sky-300/80 p-4 rounded-xl space-y-1.5 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400 text-[11px]">STAGE 03</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-bold border border-sky-200/60">
                      内化
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">主动召回与听写</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">键盘拼写与听力辨音，形成肌肉记忆</p>
                </div>
              </div>

              {/* Action trigger */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-500 hidden sm:block">
                  支持切换自定义词书（如延世韩国语、TOPIK 真题词库）展开专属研习
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm group-hover:shadow group-hover:bg-slate-800">
                  <Play size={13} fill="currentColor" />
                  <span>Start Session (开启今日研习)</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. LEXICON UPLOADER & AI EXPANSION (Span 2) */}
          <div
            onClick={() => setCurrentView('lexicon_uploader')}
            className="md:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-full border border-stone-200">
                  PDF / JSON / CSV / TXT
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
                  <span>📥 自定义词书上传与 AI 扩充引擎</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  导入《延世韩国语》、《TOPIK 必备词汇》等任何讲义，纯前端智能提取韩语单词、词性、词源汉字与释义，一键衍生新题库。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">已内置延世 1~6 册与 MZ 流行俚语词库</span>
              <span className="font-bold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                打开上传中心 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 3. NOTEBOOK (Span 1) */}
          <div
            onClick={() => setCurrentView('notebook')}
            className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 group-hover:scale-105 transition-transform">
                  <Bookmark size={20} />
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                  {savedWordsCount} 收藏
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">生词与错题本</h3>
                <p className="text-xs text-stone-500 mt-1">
                  随时归档对话与练习中遇到的生词难句，支持专项强化巩固。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">Notebook View</span>
              <span className="font-bold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                查看笔记 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 4. FLASHCARDS (Span 1) */}
          <div
            onClick={() => setCurrentView('flashcards')}
            className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 group-hover:scale-105 transition-transform">
                  <Layers size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {totalVocabCount} CARDS
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">核心词汇闪卡</h3>
                <p className="text-xs text-stone-500 mt-1">
                  经典翻卡复习，包含发音示范、例句拆解与汉字词源追溯。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">Flashcards</span>
              <span className="font-bold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                开始背词 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 5. GRAMMAR (Span 1) */}
          <div
            onClick={() => setCurrentView('grammar')}
            className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {grammarCount} RULES
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">语法与句型拆解</h3>
                <p className="text-xs text-stone-500 mt-1">
                  连接词尾、尊称阶层与常见句型公式体系化解析。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">Grammar Rules</span>
              <span className="font-bold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                学习语法 <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 6. DICTATION & SPEAKING (Span 1) */}
          <div
            onClick={() => setCurrentView('dictation')}
            className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 group-hover:scale-105 transition-transform">
                  <Headphones size={20} />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                  Active Recall
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">场景听写与辨音</h3>
                <p className="text-xs text-stone-500 mt-1">
                  原生语速音频盲听、收音连音辨析与精准拼写训练。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">Dictation</span>
              <span className="font-bold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                听写训练 <ChevronRight size={14} />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
