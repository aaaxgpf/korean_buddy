import React, { useState } from 'react';
import { 
  Layers, 
  RotateCw, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  List,
  Sparkles,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem } from '../types';
import { speakKorean } from '../utils/audio';
import { HangulHelper } from './HangulHelper';

interface FlashcardsViewProps {
  vocabulary: VocabItem[];
  onToggleBookmarkVocab: (id: string) => void;
  savedVocabIds: Set<string>;
  onUpdateMastery: (id: string, mastery: 'new' | 'learning' | 'mastered') => void;
  onAddCustomVocab: (item: VocabItem) => void;
  languageMode: 'bilingual' | 'zh' | 'en';
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  vocabulary,
  onToggleBookmarkVocab,
  savedVocabIds,
  onUpdateMastery,
  onAddCustomVocab,
  languageMode,
}) => {
  const [viewMode, setViewMode] = useState<'flashcard' | 'list' | 'quiz' | 'dictation'>('flashcard');

  const [dictationInput, setDictationInput] = useState('');
  const [isDictationChecked, setIsDictationChecked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Vocab Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWordHangul, setNewWordHangul] = useState('');
  const [newWordZh, setNewWordZh] = useState('');
  const [newWordEn, setNewWordEn] = useState('');
  const [newWordType, setNewWordType] = useState('Noun');
  const [newWordExampleKr, setNewWordExampleKr] = useState('');
  const [newWordExampleZh, setNewWordExampleZh] = useState('');

  // Quiz Mode State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Filter words
  const filteredVocab = vocabulary.filter((item) => {
    const isBookmarked = savedVocabIds.has(item.id) || savedVocabIds.has(item.word) || item.isBookmarked;
    if (onlyBookmarked && !isBookmarked) return false;
    
    // Category or Source filter
    if (selectedCategory !== 'All') {
      const matchCat = 
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase()) || 
        item.source?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        item.level?.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!matchCat) return false;
    }

    // Level filter
    if (selectedLevel !== 'All') {
      if (selectedLevel === 'TOPIK 1-2') {
        const match = item.level === 'TOPIK 1' || item.level === 'TOPIK 2' || 
          item.category?.includes('TOPIK 1-2') || item.source?.includes('TOPIK 1-2') || item.level?.includes('TOPIK 1');
        if (!match) return false;
      } else if (selectedLevel === 'TOPIK 3-4') {
        const match = item.level === 'TOPIK 3' || item.level === 'TOPIK 4' || 
          item.category?.includes('TOPIK 3-4') || item.source?.includes('TOPIK 3-4') || item.level?.includes('TOPIK 3') || item.level?.includes('TOPIK 4');
        if (!match) return false;
      } else if (selectedLevel === 'TOPIK 5-6') {
        const match = item.level === 'TOPIK 5' || item.level === 'TOPIK 6' || 
          item.category?.includes('TOPIK 5-6') || item.source?.includes('TOPIK 5-6') || item.level?.includes('TOPIK 5') || item.level?.includes('TOPIK 6');
        if (!match) return false;
      } else if (selectedLevel === 'Yonsei') {
        const match = item.level === 'Yonsei' || item.category?.includes('延世') || item.source?.includes('延世');
        if (!match) return false;
      } else if (selectedLevel === 'SNU') {
        const match = item.level === 'SNU' || item.category?.includes('首尔') || item.source?.includes('首尔');
        if (!match) return false;
      } else if (selectedLevel === 'K-pop') {
        const match = item.level === 'K-pop' || item.category?.includes('K-POP') || item.source?.includes('K-POP') || item.source?.includes('饭圈');
        if (!match) return false;
      } else if (selectedLevel === 'Daily') {
        const match = item.level === 'Daily' || item.category?.includes('日常') || item.source?.includes('日常');
        if (!match) return false;
      } else if (selectedLevel === 'Custom') {
        const match = item.level === 'Custom' || item.level === 'AI Real-time Expansion' || item.category?.includes('Lexicon') || item.category?.includes('延世') || item.source?.includes('词书');
        if (!match) return false;
      } else if (item.level !== selectedLevel && !item.category?.includes(selectedLevel)) {
        return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.hangul.toLowerCase().includes(q) ||
        item.word.toLowerCase().includes(q) ||
        item.meaning_zh.toLowerCase().includes(q) ||
        item.meaning_en.toLowerCase().includes(q) ||
        (item.hanja_or_root && item.hanja_or_root.toLowerCase().includes(q)) ||
        (item.romanization && item.romanization.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const currentCard = filteredVocab[currentIndex] || filteredVocab[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredVocab.length) % filteredVocab.length);
  };

  const handleRate = (mastery: 'new' | 'learning' | 'mastered') => {
    if (!currentCard) return;
    onUpdateMastery(currentCard.id, mastery);
    if (mastery === 'mastered') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    handleNext();
  };

  const handleSaveCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordHangul || !newWordZh) return;

    const newItem: VocabItem = {
      id: `custom_v_${Date.now()}`,
      word: newWordHangul,
      hangul: newWordHangul,
      type: newWordType,
      meaning_zh: newWordZh,
      meaning_en: newWordEn || newWordZh,
      example_kr: newWordExampleKr,
      example_zh: newWordExampleZh,
      category: 'Custom',
      level: 'Daily',
      mastery: 'learning',
      isBookmarked: true,
      savedAt: Date.now(),
    };

    onAddCustomVocab(newItem);
    setIsModalOpen(false);
    setNewWordHangul('');
    setNewWordZh('');
    setNewWordEn('');
    setNewWordExampleKr('');
    setNewWordExampleZh('');
  };

  // Generate 4 options for quiz mode
  const currentQuizItem = filteredVocab[quizIndex];
  const quizOptions = React.useMemo(() => {
    if (!currentQuizItem || filteredVocab.length < 2) return [];
    const correctMeaning = languageMode === 'en' ? currentQuizItem.meaning_en : currentQuizItem.meaning_zh;
    const wrongOptions = filteredVocab
      .filter((v) => v.id !== currentQuizItem.id)
      .map((v) => (languageMode === 'en' ? v.meaning_en : v.meaning_zh))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correctMeaning, ...wrongOptions].sort(() => Math.random() - 0.5);
  }, [quizIndex, currentQuizItem, filteredVocab, languageMode]);

  const handleAnswerQuiz = (option: string) => {
    if (isAnswerChecked || !currentQuizItem) return;
    setSelectedAnswer(option);
    setIsAnswerChecked(true);

    const correctMeaning = languageMode === 'en' ? currentQuizItem.meaning_en : currentQuizItem.meaning_zh;
    if (option === correctMeaning) {
      setQuizScore((prev) => prev + 1);
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  const handleNextQuiz = () => {
    setIsAnswerChecked(false);
    setSelectedAnswer(null);
    setQuizIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E0DED7] text-xs font-medium">
            <button
              onClick={() => setViewMode('flashcard')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all  ${
                viewMode === 'flashcard'
                  ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                  : 'text-[#71675E] hover:text-[#2D2D2D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all  ${
                viewMode === 'list'
                  ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                  : 'text-[#71675E] hover:text-[#2D2D2D]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => {
                setViewMode('quiz');
                setQuizIndex(0);
                setQuizScore(0);
                setIsAnswerChecked(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all  ${
                viewMode === 'quiz'
                  ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                  : 'text-[#71675E] hover:text-[#2D2D2D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>
            <button
              onClick={() => {
                setViewMode('dictation');
                setQuizIndex(0);
                setQuizScore(0);
                setDictationInput('');
                setIsDictationChecked(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all  ${
                viewMode === 'dictation'
                  ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
                  : 'text-[#71675E] hover:text-[#2D2D2D]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dictation</span>
            </button>
          </div>

          {/* Add custom word */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#2D2D2D] text-xs font-medium  border border-[#E0DED7] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#8B7E74]" />
            <span className="hidden sm:inline">Add Word</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E0DED7] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#B5A69A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] placeholder-[#B5A69A] text-xs focus:outline-none focus:border-[#2D2D2D] font-sans"
            />
          </div>

          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap text-xs md:w-auto w-full ${
              onlyBookmarked
                ? 'bg-[#2D2D2D] text-white shadow-sm'
                : 'bg-[#FAF9F6] text-[#71675E] hover:bg-[#F5F2ED] border border-[#E0DED7]'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Only Saved ({savedVocabIds.size})</span>
          </button>
        </div>

        {/* Dictionary / Level Filter */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'All', label: 'All Lists' },
            { id: 'TOPIK 1-2', label: 'TOPIK Beginner' },
            { id: 'TOPIK 3-4', label: 'TOPIK Intermediate' },
            { id: 'TOPIK 5-6', label: 'TOPIK Advanced' },
            { id: 'Yonsei', label: 'Yonsei Vocab' },
            { id: 'SNU', label: 'SNU Vocab' },
            { id: 'K-pop', label: 'K-POP Vocab' },
            { id: 'Daily', label: 'Daily Vocab' },
            { id: 'Custom', label: '📥 导入词书/AI衍生' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedLevel === lvl.id
                  ? 'bg-[#2D2D2D] text-white shadow-sm'
                  : 'bg-[#FAF9F6] text-[#71675E] hover:bg-[#F5F2ED] border border-[#E0DED7]'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: 3D Flip Flashcard Mode */}
      {viewMode === 'flashcard' && (
        <div className="space-y-4">
          {filteredVocab.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0DED7] text-[#71675E] space-y-3 ">
              <Layers className="w-10 h-10 mx-auto text-[#B5A69A]" />
              <p>No vocabulary matches your filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                  setOnlyBookmarked(false);
                  setSearchQuery('');
                }}
                className="text-xs text-[#2D2D2D] underline font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Card Counter & Bookmark */}
              <div className="flex items-center justify-between px-2 text-xs text-[#71675E] ">
                <span>
                  <strong className="text-[#2D2D2D]">{currentIndex + 1}</strong> / {filteredVocab.length} cards
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#8B7E74]"></span>
                    <span>{currentCard.category}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E0DED7] text-[#71675E] font-semibold">
                    {currentCard.level}
                  </span>
                </div>
              </div>

              {/* The Interactive Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`min-h-[340px] rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 border flex flex-col justify-between shadow-sm relative select-none ${
                  isFlipped
                    ? 'bg-[#FAF9F6] border-[#8B7E74]'
                    : 'bg-white border-[#E0DED7] hover:border-[#8B7E74]'
                }`}
              >
                {/* Top Pin Area */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5A69A] ">
                    {isFlipped ? 'Back: Definitions & Examples' : 'Front: Hangul & Pronunciation'}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakKorean(currentCard.hangul || currentCard.word)}
                      className="p-2.5 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#2D2D2D] border border-[#E0DED7] transition-colors"
                      title="Pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-[#8B7E74]" />
                    </button>
                    <button
                      onClick={() => onToggleBookmarkVocab(currentCard.id)}
                      className={`p-2.5 rounded-xl transition-colors border ${
                        savedVocabIds.has(currentCard.id) || currentCard.isBookmarked
                          ? 'bg-white text-[#2D2D2D] border-[#2D2D2D]'
                          : 'bg-white hover:bg-[#F5F2ED] text-[#B5A69A] hover:text-[#2D2D2D] border-[#E0DED7]'
                      }`}
                      title="Save to Notebook"
                    >
                      {savedVocabIds.has(currentCard.id) || currentCard.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-[#2D2D2D] text-[#2D2D2D]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Center Content */}
                <div className="py-8 text-center space-y-3">
                  {!isFlipped ? (
                    <>
                      <h3 className="text-4xl sm:text-5xl -kr font-bold text-[#1A1A1A] tracking-tight">
                        {currentCard.hangul || currentCard.word}
                      </h3>
                      {currentCard.hanja_or_root && (
                        <p className="text-sm text-[#8B7E74] ">
                          Origin/Hanja: {currentCard.hanja_or_root}
                        </p>
                      )}
                      <p className="text-xs text-[#B5A69A] pt-3 flex items-center justify-center gap-1.5 ">
                        <RotateCw className="w-3.5 h-3.5 animate-spin [animation-duration:8s]" />
                        <span>Click anywhere to flip the card for definitions and examples.</span>
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4 text-left max-w-lg mx-auto">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <h4 className="text-2xl -kr font-bold text-[#1A1A1A]">{currentCard.hangul}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-white border border-[#E0DED7] text-[#71675E] ">
                          {currentCard.type}
                        </span>
                        {currentCard.romanization && (
                          <span className="text-xs font-mono text-[#8B7E74]">
                            [{currentCard.romanization}]
                          </span>
                        )}
                      </div>

                      {/* Definitions */}
                      <div className="space-y-1.5 text-sm sm:text-base ">
                        {(languageMode === 'bilingual' || languageMode === 'zh') && (
                          <p className="text-[#2D2D2D] font-medium">
                            <span className="text-[#8B7E74] font-bold mr-2">Meaning:</span>
                            {currentCard.meaning_zh}
                          </p>
                        )}
                        {(languageMode === 'bilingual' || languageMode === 'en') && currentCard.meaning_en && (
                          <p className="text-[#71675E]">
                            <span className="text-[#8B7E74] font-bold mr-2">EN:</span>
                            {currentCard.meaning_en}
                          </p>
                        )}
                      </div>

                      {/* Example */}
                      {currentCard.example_kr && (
                        <div className="p-4 rounded-xl bg-white border border-[#E0DED7] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold -kr text-[#1A1A1A]">{currentCard.example_kr}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakKorean(currentCard.example_kr!);
                              }}
                              className="p-1 rounded text-[#71675E] hover:text-[#2D2D2D]"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-[#8B7E74]" />
                            </button>
                          </div>
                          {currentCard.example_zh && (
                            <p className="text-[#71675E] ">{currentCard.example_zh}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom SRS Rating Buttons (Shown on card back) */}
                <div className="pt-4 border-t border-[#E0DED7] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="p-2 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#71675E] border border-[#E0DED7] transition-colors"
                      title="Previous"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-2 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#71675E] border border-[#E0DED7] transition-colors"
                      title="Next"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {isFlipped ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRate('new')}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#71675E] border border-[#E0DED7] text-xs font-medium"
                      >
                        Forgot
                      </button>
                      <button
                        onClick={() => handleRate('learning')}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#2D2D2D] border border-[#E0DED7] text-xs font-medium"
                      >
                        Unsure
                      </button>
                      <button
                        onClick={() => handleRate('mastered')}
                        className="px-4 py-1.5 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-medium"
                      >
                        Mastered
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(true);
                        }}
                        className="px-5 py-2 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#E05252] text-sm font-medium border border-[#E0DED7]"
                      >
                        Don't know
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(true);
                        }}
                        className="px-5 py-2 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-sm font-medium"
                      >
                        Know
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* VIEW 2: List Table Mode */}
      {viewMode === 'list' && (
        <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#71675E]  uppercase tracking-wider">
              {filteredVocab.length} Vocabulary Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse ">
              <thead>
                <tr className="border-b border-[#E0DED7] text-[#71675E]">
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px]">Word (Hangul)</th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px]">Type/Category</th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px]">Meaning</th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px]">English Definition</th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px]">Mastery</th>
                  <th className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {filteredVocab.map((item) => {
                  const isSaved = savedVocabIds.has(item.id) || item.isBookmarked;
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold -kr text-base text-[#1A1A1A]">{item.hangul || item.word}</span>
                          {item.hanja_or_root && (
                            <span className="text-[10px] text-[#8B7E74]">({item.hanja_or_root})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-[#71675E]">
                        <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E0DED7] text-[#71675E] text-[10px]">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#2D2D2D] font-medium">{item.meaning_zh}</td>
                      <td className="py-3.5 px-3 text-[#71675E]">{item.meaning_en}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                            item.mastery === 'mastered'
                              ? 'bg-[#2D2D2D] text-white'
                              : item.mastery === 'learning'
                              ? 'bg-[#F5F2ED] text-[#71675E] border border-[#E0DED7]'
                              : 'bg-[#FAF9F6] text-[#B5A69A] border border-[#E0DED7]'
                          }`}
                        >
                          {item.mastery === 'mastered' ? 'Mastered' : item.mastery === 'learning' ? 'Learning' : 'New'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => speakKorean(item.hangul || item.word)}
                            className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E0DED7] text-[#71675E]"
                            title="Pronunciation"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleBookmarkVocab(item.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSaved ? 'bg-[#FAF9F6] border-[#2D2D2D] text-[#2D2D2D]' : 'bg-[#FAF9F6] border-[#E0DED7] text-[#B5A69A] hover:text-[#2D2D2D]'
                            }`}
                            title="Save"
                          >
                            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-[#2D2D2D]" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Fast Match Quiz Mode */}
      {viewMode === 'quiz' && (
        <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
          {currentQuizItem ? (
            <div className="space-y-6 text-center">
              
              {/* Header */}
              <div className="flex items-center justify-between text-xs text-[#71675E] ">
                <span className="flex items-center gap-1.5 text-[#2D2D2D] font-bold">
                  <Trophy className="w-4 h-4 text-[#8B7E74]" />
                  <span>Score: {quizScore}</span>
                </span>
                <span>
                  Progress: {quizIndex + 1} / {filteredVocab.length}
                </span>
              </div>

              {/* Question Word */}
              <div className="space-y-2 py-4">
                <span className="text-xs uppercase font-bold text-[#B5A69A] tracking-wider ">
                  Select the correct meaning
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h3 className="text-3xl sm:text-4xl -kr font-bold text-[#1A1A1A]">
                    {currentQuizItem.hangul || currentQuizItem.word}
                  </h3>
                  <button
                    onClick={() => speakKorean(currentQuizItem.hangul || currentQuizItem.word)}
                    className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E0DED7] text-[#2D2D2D]"
                  >
                    <Volume2 className="w-5 h-5 text-[#8B7E74]" />
                  </button>
                </div>
                {currentQuizItem.type && (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-[#FAF9F6] border border-[#E0DED7] text-[#71675E] ">
                    {currentQuizItem.type}
                  </span>
                )}
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm ">
                {quizOptions.map((opt, idx) => {
                  const correctMeaning =
                    languageMode === 'en' ? currentQuizItem.meaning_en : currentQuizItem.meaning_zh;
                  const isCorrect = opt === correctMeaning;
                  const isSelected = selectedAnswer === opt;

                  let btnStyle = 'bg-[#FAF9F6] hover:bg-[#F5F2ED] border-[#E0DED7] text-[#2D2D2D]';
                  if (isAnswerChecked) {
                    if (isCorrect) {
                      btnStyle = 'bg-[#2D2D2D] border-[#2D2D2D] text-white';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-red-50 border-red-300 text-red-700';
                    } else {
                      btnStyle = 'bg-[#FAF9F6]/50 opacity-40 border-[#E0DED7] text-[#B5A69A]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerChecked}
                      onClick={() => handleAnswerQuiz(opt)}
                      className={`p-4 rounded-xl border font-medium text-left transition-all ${btnStyle}`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Next Question Button */}
              {isAnswerChecked && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextQuiz}
                    className="px-8 py-3 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white  font-medium text-sm shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            <p className="text-center text-[#71675E] ">Please select a category with at least 2 words to start the quiz.</p>
          )}
        </div>
      )}

      {/* VIEW 4: Dictation Mode */}
      {viewMode === 'dictation' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {filteredVocab.length > 0 ? (
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#E0DED7] shadow-sm space-y-6">
              
              <div className="flex items-center justify-between text-xs text-[#71675E]">
                <span>Write Word {currentIndex + 1} / {filteredVocab.length}</span>
                <span className="font-bold text-[#2D2D2D]">{currentCard.category}</span>
              </div>

              <div className="text-center space-y-3 pt-2">
                <button
                  onClick={() => speakKorean(currentCard.hangul || currentCard.word, 0.95)}
                  className="p-5 rounded-2xl bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E0DED7] transition-all group mx-auto inline-flex"
                >
                  <Volume2 className="w-8 h-8 text-[#8B7E74] group-hover:scale-110 transition-transform" />
                </button>
                <p className="text-[#8B7E74] text-xs">Click to play pronunciation</p>
                <div className="text-sm text-[#2D2D2D] font-medium mt-4">
                  Hint: {currentCard.meaning_zh} {currentCard.romanization ? `[${currentCard.romanization}]` : ''}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#2D2D2D] uppercase tracking-wider text-center">
                  Type the Korean word
                </label>
                <input
                  type="text"
                  value={dictationInput}
                  onChange={(e) => setDictationInput(e.target.value)}
                  placeholder="Type here..."
                  disabled={isDictationChecked}
                  className="w-full p-4 bg-[#FAF9F6] border border-[#E0DED7] rounded-2xl text-[#1A1A1A] text-xl text-center focus:outline-none focus:border-[#2D2D2D]"
                />
                {!isDictationChecked && <HangulHelper onInsertChar={(c) => setDictationInput((prev) => prev + c)} />}
              </div>

              {isDictationChecked ? (
                <div className="space-y-4 pt-4 border-t border-[#E0DED7]">
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    dictationInput.trim() === currentCard.hangul
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {dictationInput.trim() === currentCard.hangul ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      <div>
                        <div className="font-bold text-lg">{currentCard.hangul}</div>
                        <div className="text-xs opacity-80">Correct Answer</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setIsDictationChecked(false);
                        setDictationInput('');
                        handleNext();
                      }}
                      className="px-8 py-3 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      if (!dictationInput.trim()) return;
                      setIsDictationChecked(true);
                      if (dictationInput.trim() === currentCard.hangul) {
                        confetti({ particleCount: 30, spread: 50 });
                      }
                    }}
                    disabled={!dictationInput.trim()}
                    className="w-full py-3 rounded-xl bg-[#2D2D2D] disabled:opacity-50 hover:bg-[#1A1A1A] text-white font-medium shadow-sm transition-all"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

            </div>
          ) : (
            <p className="text-center text-[#71675E]">No matching vocabulary.</p>
          )}
        </div>
      )}

      {/* Add Custom Word Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E0DED7] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-xl space-y-5 text-[#2D2D2D]">
            <h3 className=" font-bold text-xl text-[#1A1A1A] flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-[#8B7E74]" />
              <span>Add Custom Word</span>
            </h3>

            <form onSubmit={handleSaveCustomWord} className="space-y-4 text-xs ">
              <div>
                <label className="block text-[#2D2D2D] font-semibold mb-1.5">韩文Word (Hangul) *</label>
                <input
                  type="text"
                  required
                  value={newWordHangul}
                  onChange={(e) => setNewWordHangul(e.target.value)}
                  placeholder="예: 보고 싶다, 커피, 사랑해"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] -kr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D2D2D] font-semibold mb-1.5">Meaning *</label>
                  <input
                    type="text"
                    required
                    value={newWordZh}
                    onChange={(e) => setNewWordZh(e.target.value)}
                    placeholder="想念，咖啡，我爱你"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#2D2D2D] font-semibold mb-1.5">English Meaning</label>
                  <input
                    type="text"
                    value={newWordEn}
                    onChange={(e) => setNewWordEn(e.target.value)}
                    placeholder="To miss, coffee, I love you"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2D2D2D] font-semibold mb-1.5">Example Sentence</label>
                <input
                  type="text"
                  value={newWordExampleKr}
                  onChange={(e) => setNewWordExampleKr(e.target.value)}
                  placeholder="너를 매일 보고 싶어."
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] -kr"
                />
              </div>

              <div>
                <label className="block text-[#2D2D2D] font-semibold mb-1.5">Example Translation</label>
                <input
                  type="text"
                  value={newWordExampleZh}
                  onChange={(e) => setNewWordExampleZh(e.target.value)}
                  placeholder="每天都好想见你。"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E0DED7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#71675E] text-xs border border-[#E0DED7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-semibold shadow-sm"
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
