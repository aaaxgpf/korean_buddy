import React, { useState } from 'react';
import { 
  Headphones, 
  Volume2, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DictationItem } from '../types';
import { speakKorean, compareHangulStrings } from '../utils/audio';

interface DictationViewProps {
  dictationItems: DictationItem[];
  languageMode: 'bilingual' | 'zh' | 'en';
  onSaveToNotebook?: (item: DictationItem) => void;
}

export const DictationView: React.FC<DictationViewProps> = ({
  dictationItems,
  languageMode,
  onSaveToNotebook,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(0.95);
  const [streakCount, setStreakCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const filteredItems = dictationItems.filter(
    (item) => selectedLevel === 'all' || item.level === selectedLevel
  );
  
  const currentItem = filteredItems[currentIndex] || filteredItems[0];

  const handlePlayAudio = (speed = playSpeed) => {
    if (!currentItem) return;
    speakKorean(currentItem.korean, { rate: speed });
  };

  const handleCheckAnswer = () => {
    if (!userInput.trim()) return;
    setHasSubmitted(true);
    
    const result = compareHangulStrings(currentItem.korean, userInput);
    if (result.isExact || result.similarity >= 85) {
      setStreakCount((prev) => prev + 1);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } else {
      setStreakCount(0);
    }
  };

  const handleNext = () => {
    setUserInput('');
    setHasSubmitted(false);
    setShowHint(false);
    setIsSaved(false);
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const comparison = currentItem ? compareHangulStrings(currentItem.korean, userInput) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-32">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E0DED7] text-xs font-medium">
            {['all', 'beginner', 'intermediate'].map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level as any);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-lg capitalize ${
                  selectedLevel === level ? 'bg-[#2D2D2D] text-white shadow-sm' : 'text-[#71675E] hover:bg-stone-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-sans font-bold text-[#2D2D2D]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Streak: {streakCount}</span>
          </div>
          <span>{currentIndex + 1} / {filteredItems.length}</span>
        </div>
      </div>

      {currentItem && (
        <div className="space-y-6">
          <div className="p-8 bg-[#FAF9F6] rounded-2xl border border-[#E0DED7] flex flex-col items-center text-center space-y-6 font-sans shadow-sm">
            
            <button 
              onClick={() => handlePlayAudio(0.95)}
              className="w-20 h-20 bg-[#2D2D2D] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            
            <div className="flex items-center gap-2">
              <button onClick={() => handlePlayAudio(0.7)} className="px-3 py-1 text-xs border border-[#E0DED7] rounded-lg text-[#71675E] hover:bg-[#E0DED7]">0.7x (Slow)</button>
              <button onClick={() => handlePlayAudio(0.95)} className="px-3 py-1 text-xs border border-[#E0DED7] rounded-lg text-[#71675E] hover:bg-[#E0DED7]">1.0x (Normal)</button>
            </div>

            <textarea 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={hasSubmitted}
              placeholder="Listen and type in Korean..."
              className="w-full max-w-lg p-4 border border-[#E0DED7] rounded-xl font-sans-kr text-xl focus:ring-2 focus:ring-[#8B7E74] outline-none"
              rows={3}
            />

            {!hasSubmitted ? (
              <button 
                onClick={handleCheckAnswer}
                disabled={!userInput.trim()}
                className="w-full max-w-lg py-3 rounded-xl bg-[#2D2D2D] text-white font-medium hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <div className="w-full max-w-lg space-y-4">
                <div className={`p-4 rounded-xl border ${comparison?.isExact ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  <p className="font-bold text-lg mb-2">
                    {comparison?.isExact ? 'Perfect! 🎉' : 'Keep practicing! 💪'}
                  </p>
                  <p className="text-sm font-sans-kr">{currentItem.korean}</p>
                </div>
                
                <div className="text-left text-sm text-[#71675E] p-4 bg-white rounded-xl border border-[#E0DED7]">
                  <p><strong>ZH:</strong> {currentItem.translation_zh}</p>
                  {(languageMode === 'bilingual' || languageMode === 'en') && <p><strong>EN:</strong> {currentItem.translation_en}</p>}
                </div>

                <div className="flex justify-end gap-3">
                  {onSaveToNotebook && (
                    <button onClick={() => { onSaveToNotebook(currentItem); setIsSaved(true); }} className="px-4 py-2 border border-[#E0DED7] rounded-xl text-sm flex items-center gap-2 hover:bg-stone-100">
                      {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  )}
                  <button onClick={handleNext} className="px-4 py-2 bg-[#2D2D2D] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#1A1A1A]">
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
