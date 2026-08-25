import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  MessageSquare, 
  Layers, 
  BookOpen, 
  Volume2, 
  Trash2, 
  Flame, 
  Sparkles, 
  Calendar,
  ExternalLink,
  Download
} from 'lucide-react';
import { ChatMessage, VocabItem, GrammarCard, Companion } from '../types';
import { speakKorean } from '../utils/audio';
import { CompanionAvatar } from './CompanionAvatar';

interface NotebookViewProps {
  savedDialogues: ChatMessage[];
  onRemoveDialogue: (id: string) => void;
  savedVocab: VocabItem[];
  onRemoveVocab: (id: string) => void;
  savedGrammar: GrammarCard[];
  onRemoveGrammar: (id: string) => void;
  companions: Companion[];
  languageMode: 'bilingual' | 'zh' | 'en';
  studyStreak: number;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  savedDialogues,
  onRemoveDialogue,
  savedVocab,
  onRemoveVocab,
  savedGrammar,
  onRemoveGrammar,
  companions,
  languageMode,
  studyStreak,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dialogues' | 'vocab' | 'grammar'>('dialogues');

  const companionMap = React.useMemo(() => {
    const map = new Map<string, Companion>();
    companions.forEach((c) => map.set(c.id, c));
    return map;
  }, [companions]);

  const handleExportData = () => {
    const data = {
      savedDialogues,
      savedVocab,
      savedGrammar,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `korean_study_notebook_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
      
      

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#E0DED7] rounded-2xl p-5 text-center shadow-sm">
          <span className="text-xs text-[#71675E] block mb-1 font-sans">Saved Chat</span>
          <span className="text-2xl font-sans font-bold text-[#1A1A1A]">{savedDialogues.length} items</span>
        </div>
        <div className="bg-white border border-[#E0DED7] rounded-2xl p-5 text-center shadow-sm">
          <span className="text-xs text-[#71675E] block mb-1 font-sans">Vocab Cards</span>
          <span className="text-2xl font-sans font-bold text-[#1A1A1A]">{savedVocab.length} words</span>
        </div>
        <div className="bg-white border border-[#E0DED7] rounded-2xl p-5 text-center shadow-sm">
          <span className="text-xs text-[#71675E] block mb-1 font-sans">Grammar</span>
          <span className="text-2xl font-sans font-bold text-[#1A1A1A]">{savedGrammar.length} items</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center bg-[#FAF9F6] p-1.5 rounded-2xl border border-[#E0DED7] text-xs font-medium font-sans max-w-md mx-auto">
        <button
          onClick={() => setActiveSubTab('dialogues')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'dialogues'
              ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
              : 'text-[#71675E] hover:text-[#2D2D2D]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Saved Chat ({savedDialogues.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('vocab')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'vocab'
              ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
              : 'text-[#71675E] hover:text-[#2D2D2D]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vocab ({savedVocab.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('grammar')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'grammar'
              ? 'bg-[#2D2D2D] text-white shadow-sm font-semibold'
              : 'text-[#71675E] hover:text-[#2D2D2D]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Grammar ({savedGrammar.length})</span>
        </button>
      </div>

      {/* TAB 1: SAVED DIALOGUES */}
      {activeSubTab === 'dialogues' && (
        <div className="space-y-4">
          {savedDialogues.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0DED7] text-[#71675E] space-y-3 font-sans">
              <MessageSquare className="w-10 h-10 mx-auto text-[#B5A69A]" />
              <p>No saved chats. Click the bookmark icon in chat to save!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedDialogues.map((item) => {
                const comp = item.characterId ? companionMap.get(item.characterId) : undefined;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-sm space-y-4 font-sans"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {comp && (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-[#2D2D2D]">
                            <CompanionAvatar
                              companion={comp}
                              sizeClassName="w-5 h-5"
                              alt={comp.name_zh}
                              className="border border-slate-200"
                            />
                            <span>{comp.name_zh}'s Chat</span>
                          </span>
                        )}
                        <span className="text-[11px] text-[#B5A69A]">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakKorean(item.korean || item.content || '')}
                          className="p-2 rounded-lg bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E0DED7] text-[#71675E]"
                          title="Play audio"
                        >
                          <Volume2 className="w-4 h-4 text-[#8B7E74]" />
                        </button>
                        <button
                          onClick={() => onRemoveDialogue(item.id)}
                          className="p-2 rounded-lg bg-[#FAF9F6] hover:bg-red-50 text-[#71675E] hover:text-red-700 border border-[#E0DED7] transition-colors"
                          title="CancelSave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Korean Text */}
                    <p className="text-lg font-sans-kr font-bold text-[#1A1A1A] leading-relaxed">
                      {item.korean || item.content}
                    </p>

                    {/* Translations */}
                    <div className="space-y-1 text-xs sm:text-sm pt-3 border-t border-[#E0DED7]">
                      {item.translation_zh && (
                        <p className="text-[#2D2D2D]">
                          <strong className="text-[#8B7E74] mr-2">Meaning:</strong>
                          {item.translation_zh}
                        </p>
                      )}
                      {(languageMode === 'bilingual' || languageMode === 'en') && item.translation_en && (
                        <p className="text-[#71675E]">
                          <strong className="text-[#8B7E74] mr-2">EN:</strong>
                          {item.translation_en}
                        </p>
                      )}
                    </div>

                    {/* Vocabulary parsed */}
                    {item.vocabulary && item.vocabulary.length > 0 && (
                      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-[#B5A69A] uppercase tracking-wider block">
                          包含重点词汇:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.vocabulary.map((v, vIdx) => (
                            <span
                              key={vIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E0DED7] text-[#2D2D2D]"
                            >
                              <strong className="font-sans-kr text-[#1A1A1A]">{v.hangul || v.word}</strong>: {languageMode === 'en' ? (v.meaning_en || v.meaning_zh) : v.meaning_zh}
                              <button
                                type="button"
                                onClick={() => speakKorean(v.hangul || v.word)}
                                className="text-stone-400 hover:text-stone-800 transition-colors p-0.5 cursor-pointer rounded hover:bg-stone-100"
                                title="发音 (Pronounce)"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning tip */}
                    {item.learning_tip && (
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-xs text-[#71675E]">
                        <strong className="text-[#2D2D2D] mr-1">💡 Tip:</strong> {item.learning_tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED VOCABULARY */}
      {activeSubTab === 'vocab' && (
        <div className="space-y-4">
          {savedVocab.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0DED7] text-[#71675E] space-y-3 font-sans">
              <Layers className="w-10 h-10 mx-auto text-[#B5A69A]" />
              <p>Vocab还是Empty的。在聊天或words汇库中点击加号/书签即可保存！</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E0DED7] rounded-2xl p-6 shadow-xs flex flex-col">
              {savedVocab.map((item, i) => (
                <div
                  key={item.id}
                  className={`py-4 flex items-start justify-between gap-4 font-sans ${
                    i < savedVocab.length - 1 ? 'border-b border-black/[0.04]' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline flex-wrap gap-1.5">
                      <span className="text-slate-800 font-normal text-base">{item.hangul || item.word}</span>
                      {item.hanja_or_root && (
                        <span className="text-xs text-slate-400 font-light">({item.hanja_or_root})</span>
                      )}
                      {item.type && (
                        <span className="text-xs text-slate-400 font-light">
                          · {item.type}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 font-normal mt-1.5">{item.meaning_zh}</p>
                    {item.meaning_en && (
                      <p className="text-xs text-slate-400 font-normal mt-0.5">{item.meaning_en}</p>
                    )}

                    {item.example_kr && (
                      <div className="mt-2 text-xs text-slate-500 font-light space-y-0.5">
                        <p className="font-medium text-slate-700">例: {item.example_kr}</p>
                        {item.example_zh && (
                          <p className="text-slate-400">{item.example_zh}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pt-1">
                    <button
                      onClick={() => speakKorean(item.hangul || item.word)}
                      className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                      title="Pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveVocab(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove from Notebook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED GRAMMAR */}
      {activeSubTab === 'grammar' && (
        <div className="space-y-4">
          {savedGrammar.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0DED7] text-[#71675E] space-y-3 font-sans">
              <BookOpen className="w-10 h-10 mx-auto text-[#B5A69A]" />
              <p>暂无Save的语法。在Grammar Library中点击书签按钮即可一键Save！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedGrammar.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-[#E0DED7] rounded-2xl p-5 shadow-sm space-y-3 font-sans"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-base font-sans-kr font-bold text-[#1A1A1A]">{g.pattern}</span>
                      <h4 className="font-bold text-[#2D2D2D] text-sm mt-0.5">{g.title_zh}</h4>
                    </div>
                    <button
                      onClick={() => onRemoveGrammar(g.id)}
                      className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-red-50 border border-[#E0DED7] text-[#71675E] hover:text-red-700"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#71675E] leading-relaxed">{g.explanation_zh}</p>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] text-[11px] text-[#2D2D2D]">
                    <strong className="text-[#8B7E74]">Formation:</strong> {g.formation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
