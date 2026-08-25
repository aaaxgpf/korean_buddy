import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { GrammarCard, GrammarAnalysisResult } from '../types';
import { notifyToast, formatApiErrorMessage } from '../utils/toast';
import { speakKorean } from '../utils/audio';

interface GrammarViewProps {
  grammarCards: GrammarCard[];
  onToggleBookmarkGrammar: (id: string) => void;
  savedGrammarIds: Set<string>;
  languageMode: 'bilingual' | 'zh' | 'en';
}

export const GrammarView: React.FC<GrammarViewProps> = ({
  grammarCards,
  onToggleBookmarkGrammar,
  savedGrammarIds,
  languageMode,
}) => {
  // Tabs: Curated Library vs. AI Smart Sentence Analyzer
  const [activeSubTab, setActiveSubTab] = useState<'analyzer' | 'library'>('analyzer');
  
  // Analyzer State
  const [inputSentence, setInputSentence] = useState('오늘 저녁에 따뜻한 김치찌개 먹으러 갈래요?');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GrammarAnalysisResult | null>(null);

  // Library State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const presetSentences = [
    { title: '约饭提议', kr: '오늘 저녁에 따뜻한 김치찌개 먹으러 갈래요?' },
    { title: '追星致谢', kr: '무대 위에서 반짝이는 당신을 항상 응원하고 있어요.' },
    { title: '咖啡点单', kr: '얼어 죽어도 아이스 아메리카노 한 잔 마셔야겠어요.' },
    { title: '日常表达', kr: '한국어를 잘하고 싶어서 매일 열심히 연습하고 있어요.' },
  ];

  const handleAnalyzeSentence = async (sentenceToAnalyze?: string) => {
    const sentence = (sentenceToAnalyze || inputSentence).trim();
    if (!sentence || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/grammar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) throw new Error('Analysis request failed');
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      const { title, message } = formatApiErrorMessage(err, '语法解析');
      notifyToast({
        type: 'warning',
        title,
        message: `${message}（已为您呈现精选离线语法拆解）`,
        duration: 4500
      });
      // Fallback
      setAnalysisResult({
        original: sentence,
        translation_zh: '今天晚上要一起去吃热腾腾的泡菜汤吗？',
        translation_en: 'Shall we go eat warm Kimchi Jjigae for dinner tonight?',
        romanization: 'o-neul jeo-nyeok-e tta-tteut-han gim-chi-jji-gae meo-geu-reo gal-lae-yo?',
        morphemes: [
          { token: '오늘', type: 'Noun', role: '시간 부사어 (时间状语)', meaning_zh: '今天', meaning_en: 'today' },
          { token: '저녁에', type: '명사+조사 (名words+Particle)', role: '부사어 (状语)', meaning_zh: '在晚上', meaning_en: 'in the evening' },
          { token: '따뜻한', type: '형용사 관형사형 (形容words冠形words形)', role: '관형어 (定语)', meaning_zh: '温暖的/热腾腾的', meaning_en: 'warm' },
          { token: '김치찌개', type: 'Noun', role: '목적어 (宾语)', meaning_zh: '泡菜汤', meaning_en: 'Kimchi stew' },
          { token: '먹으러', type: '동사+연결어미 (动words+目的words尾)', role: '부사어 (目的状语)', meaning_zh: '去吃(为了吃)', meaning_en: 'in order to eat' },
          { token: '갈래요?', type: 'Verb + Ending', role: 'Predicate', meaning_zh: 'shall we go?', meaning_en: 'shall we go?' },
        ],
        grammar_breakdown: [
          {
            pattern: 'V + -(으)러 가다/오다',
            name_zh: 'Purpose Conjunctive Ending (to go do)',
            name_en: 'Purposive Ending (Go/Come to do)',
            function_zh: 'Indicates the specific purpose of going or coming to a place',
            function_en: 'Expresses the purpose of going/coming',
            formation: 'With batchim: -으러 가다; Without batchim: -러 가다',
          },
          {
            pattern: 'V + -(으)ㄹ래요?',
            name_zh: 'Propositive/Intentional Interrogative Ending',
            name_en: 'Propositive / Intention Ending (Shall we?)',
            function_zh: 'Friendly inquiry about intention or proposal in daily conversation',
            function_en: 'Politely asking for the listener’s intention or making a friendly proposal',
            formation: 'Without batchim: -ㄹ래요?; With batchim: -을래요?',
          },
        ],
        phonetics: {
          pronunciation: '[오늘 저녀게 따뜨탄 김치찌개 머그러 갈래요]',
          rules: [
            '저녁에 -> [저녀게] Liaison (연음)',
            '따뜻한 -> [따뜨탄] Aspiration (격음화)',
            '먹으러 -> [머그러] Liaison (연음)',
          ],
        },
        nuance: 'Friendly and polite spoken language (해요체).',
        natural_alternatives: [
          {
            korean: '오늘 저녁에 김치찌개 먹으러 갈래? (Casual form)',
            style_zh: '同龄朋友/亲近Casual form (반말)',
            style_en: 'Casual friendly Panmal',
            translation_zh: 'Wanna go eat kimchi stew tonight?',
          },
          {
            korean: '오늘 저녁에 김치찌개를 드시러 가시겠습니까? (Formal high honorific)',
            style_zh: 'Formal/Business honorific',
            style_en: 'Formal Business honorific',
            translation_zh: 'Would you like to go eat kimchi stew this evening?',
          },
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter Grammar Cards
  const filteredCards = grammarCards.filter((card) => {
    const matchesSearch =
      card.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.title_zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.explanation_zh.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || card.level === selectedLevel;
    const matchesCat = selectedCategory === 'All' || card.category.includes(selectedCategory);
    return matchesSearch && matchesLevel && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-32">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E0DED7] text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('analyzer')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-sans ${
              activeSubTab === 'analyzer'
                ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                : 'text-[#71675E] hover:text-[#2D2D2D]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Breakdown</span>
          </button>
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-sans ${
              activeSubTab === 'library'
                ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                : 'text-[#71675E] hover:text-[#2D2D2D]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Grammar Library</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: AI Smart Morphological Analyzer */}
      {activeSubTab === 'analyzer' && (
        <div className="space-y-6">
          
          {/* Input Box Card */}
          <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputSentence}
                onChange={(e) => setInputSentence(e.target.value)}
                placeholder="Enter Korean sentences..."
                className="flex-1 px-4 py-3 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] placeholder-[#B5A69A] focus:outline-none focus:border-[#2D2D2D] text-sm font-sans"
              />
              <button
                onClick={() => handleAnalyzeSentence()}
                disabled={!inputSentence.trim() || isAnalyzing}
                className="px-6 py-3 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] disabled:opacity-40 text-white text-sm font-sans font-medium shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Breakdown</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none">
              <span className="text-xs text-[#71675E] shrink-0 font-medium">Example:</span>
              {presetSentences.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputSentence(sample.kr);
                    handleAnalyzeSentence(sample.kr);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#2D2D2D] text-xs whitespace-nowrap border border-[#E0DED7] transition-colors font-sans"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-6">
              
              {/* Primary Card: Original + Translations + Audio + Phonetics */}
              <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-sans-kr font-bold text-[#1A1A1A] tracking-tight">
                      {analysisResult.original}
                    </h3>
                    <p className="text-xs text-[#71675E] font-mono mt-1">
                      {analysisResult.romanization}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => speakKorean(analysisResult.original)}
                    className="p-3 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#2D2D2D] border border-[#E0DED7] transition-colors"
                    title="Pronounce"
                  >
                    <Volume2 className="w-5 h-5 text-[#8B7E74]" />
                  </button>
                </div>

                {/* Translations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E0DED7] text-sm">
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#71675E] border border-[#E0DED7] mr-2">
                      Meaning
                    </span>
                    <span className="text-[#2D2D2D] font-sans">{analysisResult.translation_zh}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#71675E] border border-[#E0DED7] mr-2">
                      English
                    </span>
                    <span className="text-[#2D2D2D] font-sans">{analysisResult.translation_en}</span>
                  </div>
                </div>

                {/* Phonetics & Pronunciation Rules */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#71675E] flex items-center gap-1.5 font-sans">
                      <Volume2 className="w-3.5 h-3.5 text-[#8B7E74]" />
                      Phonological Rules
                    </span>
                    <span className="font-mono font-bold text-[#2D2D2D]">
                      {analysisResult.phonetics.pronunciation}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.phonetics.rules.map((rule, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-white text-[#2D2D2D] border border-[#E0DED7] font-sans">
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Morpheme Breakdown Table */}
              <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-sans font-semibold text-[#2D2D2D] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#8B7E74]" />
                  <span>形态素与成分逐字逐wordsBreakdown (Morphemic Analysis)</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-[#E0DED7] text-[#71675E]">
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">Token</th>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">POS</th>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">Role</th>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">Meaning</th>
                        <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px]">English Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA]">
                      {analysisResult.morphemes.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="py-3 px-3 font-bold font-sans-kr text-base text-[#1A1A1A]">{m.token}</td>
                          <td className="py-3 px-3 text-[#8B7E74] font-medium">{m.type}</td>
                          <td className="py-3 px-3 text-[#71675E]">{m.role}</td>
                          <td className="py-3 px-3 text-[#2D2D2D]">{m.meaning_zh}</td>
                          <td className="py-3 px-3 text-[#71675E]">{m.meaning_en}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grammar Formula Breakdown Cards */}
              <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-sans font-semibold text-[#2D2D2D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B7E74]" />
                  <span>Grammar Formulas</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.grammar_breakdown.map((g, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#2D2D2D] font-mono">{g.pattern}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#E0DED7] text-[#71675E] font-sans">
                          {g.name_zh}
                        </span>
                      </div>
                      <p className="text-[#71675E] leading-relaxed font-sans">
                        <strong className="text-[#2D2D2D]">Function:</strong> {g.function_zh}
                      </p>
                      <div className="p-2.5 rounded-lg bg-white border border-[#E0DED7] text-[11px] text-[#71675E] font-sans">
                        <strong className="text-[#2D2D2D]">Formation:</strong> {g.formation}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cultural & Pragmatic Nuance */}
                {analysisResult.nuance && (
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-xs text-[#71675E] flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-[#8B7E74] shrink-0 mt-0.5" />
                    <div className="font-sans leading-relaxed">
                      <strong className="text-[#2D2D2D]">Context & Honorifics: </strong>
                      {analysisResult.nuance}
                    </div>
                  </div>
                )}
              </div>

              {/* Natural Alternatives / Speech Levels */}
              {analysisResult.natural_alternatives && analysisResult.natural_alternatives.length > 0 && (
                <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-base font-sans font-semibold text-[#2D2D2D] flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#8B7E74]" />
                    <span>Natural Variations</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysisResult.natural_alternatives.map((alt, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-sans-kr text-sm text-[#1A1A1A]">{alt.korean}</span>
                          <button
                            onClick={() => speakKorean(alt.korean)}
                            className="p-1.5 rounded-lg bg-white border border-[#E0DED7] hover:bg-[#F5F2ED] text-[#71675E] transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8B7E74] font-medium font-sans">{alt.style_zh}</p>
                        <p className="text-[#2D2D2D] font-sans">{alt.translation_zh}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Subtab 2: Curated Grammar Library */}
      {activeSubTab === 'library' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white border border-[#E0DED7] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#B5A69A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grammar..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] placeholder-[#B5A69A] text-xs focus:outline-none focus:border-[#2D2D2D] font-sans"
                />
              </div>

              {/* Level Filter */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none font-sans">
                {['All', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3.5 py-2 rounded-xl font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-[#2D2D2D] text-white'
                        : 'bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#71675E] border border-[#E0DED7]'
                    }`}
                  >
                    {lvl === 'All' ? 'All Levels' : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1 scrollbar-none font-sans">
              {['All', 'Particle', 'Ending', 'Intention', 'Idiom', 'Conjunction'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#8B7E74] text-white font-medium'
                      : 'bg-[#FAF9F6] text-[#71675E] hover:text-[#2D2D2D] border border-[#E0DED7]'
                  }`}
                >
                  {cat === 'All' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grammar Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCards.map((card) => {
              const isSaved = savedGrammarIds.has(card.id) || card.isBookmarked;

              return (
                <div
                  key={card.id}
                  className="bg-white border border-[#E0DED7] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#B5A69A] transition-all"
                >
                  <div className="space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-[#2D2D2D] font-mono">
                            {card.pattern}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] text-[#71675E] font-medium border border-[#E0DED7]">
                            {card.level}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] text-[#8B7E74] border border-[#E0DED7]">
                            {card.category}
                          </span>
                        </div>
                        <h4 className="font-sans font-semibold text-[#1A1A1A] text-base mt-1.5">
                          {languageMode === 'en' ? card.title_en : card.title_zh}
                        </h4>
                      </div>

                      <button
                        onClick={() => onToggleBookmarkGrammar(card.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isSaved
                            ? 'bg-[#FAF9F6] text-[#2D2D2D] border border-[#2D2D2D]'
                            : 'bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#B5A69A] hover:text-[#2D2D2D] border border-[#E0DED7]'
                        }`}
                        title={isSaved ? 'Saved' : 'Save Grammar'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 fill-[#2D2D2D] text-[#2D2D2D]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-[#71675E] leading-relaxed font-sans">
                      {languageMode === 'en' ? card.explanation_en : card.explanation_zh}
                    </p>

                    {/* Formation rule */}
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-xs">
                      <span className="font-sans font-semibold text-[#2D2D2D] block mb-1">
                        Formation Rule:
                      </span>
                      <p className="text-[#71675E] text-[11px] leading-relaxed font-sans">
                        {card.formation}
                      </p>
                    </div>

                    {/* Example sentences */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#B5A69A] block font-sans">
                        Examples:
                      </span>
                      {card.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-sans-kr text-[#1A1A1A]">{ex.kr}</span>
                            <button
                              onClick={() => speakKorean(ex.kr)}
                              className="p-1 rounded text-[#71675E] hover:text-[#2D2D2D] hover:bg-white transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-[#71675E] font-sans">{ex.zh}</p>
                          {languageMode === 'bilingual' && (
                            <p className="text-[10px] text-[#B5A69A] font-sans">{ex.en}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {card.common_mistakes && (
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-[11px] text-[#71675E] font-sans">
                        <strong className="text-[#2D2D2D]">⚠️ Common Mistakes: </strong>
                        {card.common_mistakes}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
