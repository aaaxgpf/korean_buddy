import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCw, 
  Volume2, 
  Bookmark, 
  Play, 
  TrendingUp, 
  Award,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, StudyPlan, StudyPlanDay, CustomLexiconBook } from '../types';
import { speakKorean } from '../utils/audio';
import { HangulHelper } from './HangulHelper';

interface Props {
  vocabulary: VocabItem[];
  savedVocabIds: Set<string>;
  onToggleBookmarkVocab: (id: string) => void;
  onSaveVocab: (item: VocabItem) => void;
  activeCustomBook?: CustomLexiconBook | null;
}

export const DailyStudySessionView: React.FC<Props> = ({
  vocabulary,
  savedVocabIds,
  onToggleBookmarkVocab,
  onSaveVocab,
  activeCustomBook,
}) => {
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(() => {
    const saved = localStorage.getItem('korean_buddy_study_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(() => {
    return activeCustomBook ? activeCustomBook.title : 'TOPIK 3-4 + K-POP 专题';
  });
  const [selectedDays, setSelectedDays] = useState(30);

  // Auto initialize plan if an active custom book was passed
  useEffect(() => {
    if (activeCustomBook && activeCustomBook.words.length > 0) {
      setSelectedTarget(activeCustomBook.title);
      // Construct a dynamic 3-stage plan directly from the custom book's real words
      const bookWords = activeCustomBook.words;
      const dayVocab = bookWords.slice(0, 10);
      const warmupSample = bookWords.slice(0, 3).map((w, i) => ({
        question: `词书《${activeCustomBook.title}》中‘${w.meaning_zh}’对应的韩文是？`,
        answer: w.hangul || w.word,
        hint: `${(w.hangul || w.word)[0]}... (词性: ${w.type || '常用'})`
      }));
      const recallSample = bookWords.slice(0, 5).map(w => ({
        prompt_zh: `默写词书核心词：${w.meaning_zh}`,
        target_kr: w.hangul || w.word,
        hint: w.hanja_or_root ? `汉字词源: ${w.hanja_or_root}` : `首字母: ${(w.hangul || w.word)[0]}`
      }));

      const customPlan: StudyPlan = {
        id: `custom_plan_${Date.now()}`,
        title: `《${activeCustomBook.title}》深度实战打卡计划`,
        targetLevel: activeCustomBook.title,
        totalDays: 30,
        currentDay: 1,
        createdAt: Date.now(),
        days: [
          {
            day: 1,
            theme: `${activeCustomBook.title} · 核心重点词温习与默写`,
            goal: `掌握 ${dayVocab.length} 个核心生词，完成 3 个实战热身与默写自测`,
            vocab_count: dayVocab.length,
            grammar_count: 2,
            stage1_warmup: warmupSample,
            stage2_vocab: dayVocab,
            stage3_active_recall: recallSample
          }
        ]
      };

      setCurrentPlan(customPlan);
      setActiveStage(1);
      setWarmupIndex(0);
      setStage2Index(0);
      setRecallIndex(0);
    }
  }, [activeCustomBook]);

  // Stage 1: Warmup State
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [warmupAnswer, setWarmupAnswer] = useState('');
  const [warmupChecked, setWarmupChecked] = useState(false);
  const [warmupScore, setWarmupScore] = useState(0);

  // Stage 2: Vocab Card Index
  const [stage2Index, setStage2Index] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Stage 3: Active Recall Dictation State
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallInput, setRecallInput] = useState('');
  const [recallChecked, setRecallChecked] = useState(false);
  const [recallScore, setRecallScore] = useState(0);

  // Shortcuts Generator Modal / States
  const [shortcutData, setShortcutData] = useState<{ title: string; items: any[] } | null>(null);
  const [isFetchingShortcut, setIsFetchingShortcut] = useState(false);

  useEffect(() => {
    if (currentPlan) {
      localStorage.setItem('korean_buddy_study_plan', JSON.stringify(currentPlan));
    }
  }, [currentPlan]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/curriculum/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: selectedTarget,
          days: selectedDays
        })
      });
      const plan: StudyPlan = await res.json();
      setCurrentPlan(plan);
      setActiveStage(1);
      setWarmupIndex(0);
      setStage2Index(0);
      setRecallIndex(0);
      confetti({ particleCount: 50, spread: 70 });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFetchShortcut = async (type: 'slang' | 'fandom' | 'mistakes' | 'test') => {
    setIsFetchingShortcut(true);
    setShortcutData(null);
    try {
      if (type === 'slang') {
        const res = await fetch('/api/curriculum/slang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 5 })
        });
        const json = await res.json();
        setShortcutData({
          title: '🔥 最新网络 MZ 流行语特训',
          items: json.slangs || []
        });
      } else if (type === 'fandom') {
        const res = await fetch('/api/curriculum/fandom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 5, topic: 'concert & streaming' })
        });
        const json = await res.json();
        setShortcutData({
          title: '⭐ K-POP 饭圈生态与打榜专题',
          items: json.terms || []
        });
      } else if (type === 'mistakes') {
        // Pull bookmarked words
        const savedItems = vocabulary.filter(v => savedVocabIds.has(v.id) || v.isBookmarked);
        setShortcutData({
          title: '📝 错题与收藏重点特训',
          items: savedItems.length > 0 ? savedItems : vocabulary.slice(0, 5)
        });
      } else if (type === 'test') {
        setShortcutData({
          title: '🏆 阶段周测与综合实战评估',
          items: vocabulary.slice(0, 8)
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingShortcut(false);
    }
  };

  const currentDayData: StudyPlanDay | undefined = currentPlan?.days?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-stone-900 text-white flex items-center justify-center font-bold">
            <Calendar size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Spaced-Repetition Study Flow</h1>
            <p className="text-xs text-stone-500">艾宾浩斯三阶学习闭环 · 热身温故 ➔ 核心词卡 ➔ 默写实战</p>
          </div>
        </div>

        {/* Shortcut Quick Triggers - Minimalist Monochromatic Linear Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFetchShortcut('slang')}
            disabled={isFetchingShortcut}
            className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] text-stone-800 border border-stone-200 hover:bg-stone-200/70 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-stone-700" />
            <span>最新流行语</span>
          </button>
          <button
            onClick={() => handleFetchShortcut('fandom')}
            disabled={isFetchingShortcut}
            className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] text-stone-800 border border-stone-200 hover:bg-stone-200/70 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Award size={13} className="text-stone-700" />
            <span>K-POP 专题</span>
          </button>
          <button
            onClick={() => handleFetchShortcut('mistakes')}
            disabled={isFetchingShortcut}
            className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] text-stone-800 border border-stone-200 hover:bg-stone-200/70 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Bookmark size={13} className="text-stone-700" />
            <span>错题特训</span>
          </button>
          <button
            onClick={() => handleFetchShortcut('test')}
            disabled={isFetchingShortcut}
            className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] text-stone-800 border border-stone-200 hover:bg-stone-200/70 text-xs font-medium transition flex items-center gap-1.5"
          >
            <TrendingUp size={13} className="text-stone-700" />
            <span>阶段周测</span>
          </button>
        </div>
      </div>

      {/* Shortcut Results Drawer/Box */}
      {shortcutData && (
        <div className="p-5 bg-[#F4F4F6] rounded-[6px] border border-stone-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 text-sm">
              <BookOpen size={16} className="text-stone-700" />
              <span>{shortcutData.title}</span>
            </h3>
            <button
              onClick={() => setShortcutData(null)}
              className="text-xs text-stone-500 hover:text-stone-900 font-medium"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shortcutData.items.map((it, idx) => (
              <div key={idx} className="p-3.5 bg-white rounded-[6px] border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-stone-900">{it.hangul || it.word}</span>
                    {it.type && <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-stone-100 text-stone-600 border border-stone-200">{it.type}</span>}
                  </div>
                  <button
                    onClick={() => speakKorean(it.hangul || it.word)}
                    className="p-1.5 rounded-[6px] bg-[#F4F4F6] border border-stone-200 text-stone-600 hover:text-stone-900"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                {it.full_form && (
                  <div className="text-[11px] text-stone-500 font-mono">
                    <span className="font-medium text-stone-700">原词：</span>{it.full_form}
                  </div>
                )}
                {it.origin && (
                  <div className="text-[11px] text-stone-600">
                    <span className="font-medium text-stone-700">出处：</span>{it.origin}
                  </div>
                )}
                {it.social_nuance && (
                  <div className="text-[11px] text-stone-700 bg-[#F4F4F6] p-2 rounded-[6px] border border-stone-200">
                    <span className="font-semibold text-stone-900">语境提示：</span>{it.social_nuance}
                  </div>
                )}
                <div className="text-xs font-semibold text-stone-800">
                  {it.meaning_zh}
                </div>
                {it.example_kr && (
                  <div className="text-xs text-stone-600 bg-[#F4F4F6] p-2 rounded-[6px] border border-stone-200">
                    <p className="font-medium text-stone-900">{it.example_kr}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{it.example_zh}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Generator / Active Plan Card */}
      {!currentPlan ? (
        <div className="p-6 bg-[#F4F4F6] rounded-[6px] border border-stone-200 space-y-5 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-[6px] bg-stone-900 text-white flex items-center justify-center mx-auto text-lg font-bold">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Custom Curriculum Plan Generator</h2>
            <p className="text-xs text-stone-500 mt-1">根据你的学习目标与天数，一键生成专属艾宾浩斯复习流</p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Target Level / Curriculum Focus</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-[6px] border border-stone-200 bg-white text-stone-900 focus:outline-none"
              >
                <option value="TOPIK 1-2 初级基础速通">TOPIK 1-2 初级基础速通</option>
                <option value="TOPIK 3-4 中级核心突破 + K-POP 专题">TOPIK 3-4 中级核心突破 + K-POP 专题</option>
                <option value="TOPIK 5-6 高级学术与商务精讲">TOPIK 5-6 高级学术与商务精讲</option>
                <option value="延世韩国语 (Yonsei Books 1-6)">延世韩国语 (Yonsei Books 1-6)</option>
                <option value="首尔大韩国语 (SNU Books 1-6)">首尔大韩国语 (SNU Books 1-6)</option>
                <option value="K-POP 追星实战与打榜速成">K-POP 追星实战与打榜速成</option>
                <option value="韩国 MZ 流行语与网络冲浪">韩国 MZ 流行语与网络冲浪</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Study Duration (Days)</label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDays(d)}
                    className={`py-2 rounded-[6px] text-xs font-medium border transition ${
                      selectedDays === d
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-[6px] text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            <span>{isGenerating ? 'Generating Plan...' : 'Generate 3-Stage Daily Study Plan'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Plan Meta Banner */}
          <div className="p-4 bg-stone-900 text-white rounded-[6px] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Active Study Plan</span>
              <h2 className="text-base font-bold">{currentPlan.title}</h2>
              <p className="text-xs text-stone-400 mt-0.5">Day {currentPlan.currentDay} of {currentPlan.totalDays} · {currentDayData?.theme}</p>
            </div>
            <button
              onClick={() => setCurrentPlan(null)}
              className="text-xs text-stone-400 hover:text-white underline font-medium"
            >
              Change Plan
            </button>
          </div>

          {/* 3-Stage Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#F4F4F6] p-1 rounded-[6px] border border-stone-200">
            <button
              onClick={() => setActiveStage(1)}
              className={`py-2 rounded-[6px] text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                activeStage === 1
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>1. 热身温故 (Warm-up)</span>
            </button>
            <button
              onClick={() => setActiveStage(2)}
              className={`py-2 rounded-[6px] text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                activeStage === 2
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>2. 核心词卡 (Flashcards)</span>
            </button>
            <button
              onClick={() => setActiveStage(3)}
              className={`py-2 rounded-[6px] text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                activeStage === 3
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>3. 默写实战 (Recall Test)</span>
            </button>
          </div>

          {/* STAGE 1: WARMUP REVIEW */}
          {activeStage === 1 && (
            <div className="p-5 bg-white rounded-[6px] border border-stone-200 space-y-5">
              {currentDayData?.stage1_warmup && currentDayData.stage1_warmup.length > 0 ? (
                (() => {
                  const warmupItem = currentDayData.stage1_warmup[warmupIndex] || currentDayData.stage1_warmup[0];
                  return (
                    <div className="space-y-5 text-center max-w-lg mx-auto py-2">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Warmup Question {warmupIndex + 1} / {currentDayData.stage1_warmup.length}</span>
                        <span className="font-semibold text-stone-800">Score: {warmupScore}</span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Active Recall Warm-up</span>
                        <h3 className="text-lg font-bold text-stone-900">{warmupItem.question}</h3>
                        {warmupItem.hint && (
                          <p className="text-xs text-stone-500 font-medium">💡 提示：{warmupItem.hint}</p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={warmupAnswer}
                          onChange={(e) => setWarmupAnswer(e.target.value)}
                          placeholder="输入韩语答案..."
                          disabled={warmupChecked}
                          className="w-full text-center text-base font-medium p-2.5 bg-[#F4F4F6] border border-stone-200 rounded-[6px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                        {!warmupChecked && (
                          <HangulHelper onInsertChar={(c) => setWarmupAnswer(prev => prev + c)} />
                        )}
                      </div>

                      {warmupChecked ? (
                        <div className="space-y-3.5">
                          <div className={`p-3.5 rounded-[6px] border flex items-center justify-center gap-2.5 ${
                            warmupAnswer.trim() === warmupItem.answer
                              ? 'bg-stone-50 border-stone-300 text-stone-900'
                              : 'bg-stone-50 border-stone-300 text-stone-700'
                          }`}>
                            {warmupAnswer.trim() === warmupItem.answer ? <CheckCircle2 size={18} className="text-stone-900" /> : <XCircle size={18} className="text-stone-500" />}
                            <span className="font-semibold text-xs">正确答案：{warmupItem.answer}</span>
                          </div>

                          <div className="flex justify-center gap-2">
                            {warmupIndex + 1 < currentDayData.stage1_warmup.length ? (
                              <button
                                onClick={() => {
                                  setWarmupChecked(false);
                                  setWarmupAnswer('');
                                  setWarmupIndex(prev => prev + 1);
                                }}
                                className="px-5 py-2 bg-stone-900 text-white rounded-[6px] text-xs font-medium"
                              >
                                Next Warmup
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveStage(2)}
                                className="px-5 py-2 bg-stone-900 text-white rounded-[6px] text-xs font-medium flex items-center gap-1.5"
                              >
                                <span>Proceed to Stage 2 (Flashcards)</span>
                                <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!warmupAnswer.trim()) return;
                            setWarmupChecked(true);
                            if (warmupAnswer.trim() === warmupItem.answer) {
                              setWarmupScore(prev => prev + 1);
                              confetti({ particleCount: 30, spread: 50 });
                            }
                          }}
                          disabled={!warmupAnswer.trim()}
                          className="w-full py-2.5 bg-stone-900 text-white font-medium text-xs rounded-[6px] disabled:opacity-40"
                        >
                          Check Answer
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-center text-stone-500 py-6 text-xs">No warm-up questions today.</p>
              )}
            </div>
          )}

          {/* STAGE 2: FLASHCARDS TABLE / CARDS */}
          {activeStage === 2 && (
            <div className="space-y-3">
              {currentDayData?.stage2_vocab && currentDayData.stage2_vocab.length > 0 ? (
                <div className="bg-white rounded-[6px] border border-stone-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 uppercase">
                      Day {currentPlan.currentDay} Core Vocabulary List ({currentDayData.stage2_vocab.length} Words)
                    </span>
                    <button
                      onClick={() => setActiveStage(3)}
                      className="px-3.5 py-1.5 bg-stone-900 text-white rounded-[6px] text-xs font-medium flex items-center gap-1.5"
                    >
                      <span>Go to Stage 3 (Active Recall)</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {currentDayData.stage2_vocab.map((v, i) => (
                      <div key={i} className="p-3.5 bg-[#F4F4F6] rounded-[6px] border border-stone-200 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-stone-900">{v.hangul || v.word}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-white border border-stone-200 text-stone-700">{v.type || 'Word'}</span>
                          </div>
                          <p className="text-xs text-stone-800 font-medium">{v.meaning_zh}</p>
                          {v.example_kr && (
                            <p className="text-[11px] text-stone-500 mt-0.5">例: {v.example_kr} ({v.example_zh})</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => speakKorean(v.hangul || v.word)}
                            className="p-1.5 rounded-[6px] bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            onClick={() => onSaveVocab(v)}
                            className="p-1.5 rounded-[6px] bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                          >
                            <Bookmark size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-stone-500 py-6 text-xs">No flashcard vocabulary for today.</p>
              )}
            </div>
          )}

          {/* STAGE 3: ACTIVE RECALL DICTATION */}
          {activeStage === 3 && (
            <div className="p-5 bg-white rounded-[6px] border border-stone-200 space-y-5">
              {currentDayData?.stage3_active_recall && currentDayData.stage3_active_recall.length > 0 ? (
                (() => {
                  const recallItem = currentDayData.stage3_active_recall[recallIndex] || currentDayData.stage3_active_recall[0];
                  return (
                    <div className="space-y-5 text-center max-w-lg mx-auto py-2">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Dictation Question {recallIndex + 1} / {currentDayData.stage3_active_recall.length}</span>
                        <span className="font-semibold text-stone-800">Score: {recallScore}</span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Active Recall Test (CN ➔ KR)</span>
                        <h3 className="text-xl font-bold text-stone-900">{recallItem.prompt_zh}</h3>
                        {recallItem.hint && (
                          <p className="text-xs text-stone-500 font-medium">助记提示：{recallItem.hint}</p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={recallInput}
                          onChange={(e) => setRecallInput(e.target.value)}
                          placeholder="默写对应韩语单词..."
                          disabled={recallChecked}
                          className="w-full text-center text-lg font-medium p-2.5 bg-[#F4F4F6] border border-stone-200 rounded-[6px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                        {!recallChecked && (
                          <HangulHelper onInsertChar={(c) => setRecallInput(prev => prev + c)} />
                        )}
                      </div>

                      {recallChecked ? (
                        <div className="space-y-3.5">
                          <div className={`p-3.5 rounded-[6px] border flex items-center justify-center gap-2.5 ${
                            recallInput.trim() === recallItem.target_kr
                              ? 'bg-stone-50 border-stone-300 text-stone-900'
                              : 'bg-stone-50 border-stone-300 text-stone-700'
                          }`}>
                            {recallInput.trim() === recallItem.target_kr ? <CheckCircle2 size={18} className="text-stone-900" /> : <XCircle size={18} className="text-stone-500" />}
                            <span className="font-semibold text-xs">标准韩语：{recallItem.target_kr}</span>
                          </div>

                          <div className="flex justify-center gap-2">
                            {recallIndex + 1 < currentDayData.stage3_active_recall.length ? (
                              <button
                                onClick={() => {
                                  setRecallChecked(false);
                                  setRecallInput('');
                                  setRecallIndex(prev => prev + 1);
                                }}
                                className="px-5 py-2 bg-stone-900 text-white rounded-[6px] text-xs font-medium"
                              >
                                Next Word
                              </button>
                            ) : (
                              <div className="p-4 bg-[#F4F4F6] rounded-[6px] border border-stone-200 text-center space-y-1.5">
                                <Award className="w-6 h-6 text-stone-800 mx-auto" />
                                <h4 className="font-bold text-xs text-stone-900">今日 3 阶复习闭环全部完成！</h4>
                                <p className="text-[11px] text-stone-600">记忆曲线加固成功，明天继续保持！</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!recallInput.trim()) return;
                            setRecallChecked(true);
                            if (recallInput.trim() === recallItem.target_kr) {
                              setRecallScore(prev => prev + 1);
                              confetti({ particleCount: 30, spread: 50 });
                            }
                          }}
                          disabled={!recallInput.trim()}
                          className="w-full py-2.5 bg-stone-900 text-white font-medium text-xs rounded-[6px] disabled:opacity-40"
                        >
                          Submit Dictation
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-center text-stone-500 py-6 text-xs">No recall dictation questions today.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
