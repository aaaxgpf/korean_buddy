import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomPersonaModal } from './components/CustomPersonaModal';
import { CompanionProfileModal } from './components/CompanionProfileModal';
import { CompanionSparksModal } from './components/CompanionSparksModal';
import { CompanionChat } from './components/CompanionChat';
import { UserProfileModal } from './components/UserProfileModal';
import { StudyView } from './components/StudyView';
import { SettingsView } from './components/SettingsView';
import { AppSettings } from './types';

import { PRESET_COMPANIONS } from './data/companions';
import { INITIAL_VOCABULARY } from './data/vocabulary';
import { INITIAL_GRAMMAR_CARDS } from './data/grammar';
import { INITIAL_DICTATION_ITEMS } from './data/dictation';
import { INITIAL_SPEAKING_TASKS } from './data/speaking';

import { 
  Companion, 
  ChatMessage, 
  VocabItem, 
  GrammarCard, 
  DictationItem, 
  SpeakingTask, 
  CompanionSparkRecord,
  CustomLexiconBook 
} from './types';
import { loadAllSparks, recordCompanionInteraction } from './utils/sparks';
import { MessageSquare, BookOpen, Layers, Headphones, Mic, Bookmark, Flame } from 'lucide-react';

export default function App() {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'chat' | 'study' | 'settings'>('chat');

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('korean_app_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { theme: 'default', dailyVocabGoal: 20, languageMode: 'en' };
  });

  useEffect(() => {
    localStorage.setItem('korean_app_settings', JSON.stringify(settings));
  }, [settings]);


  const [chatView, setChatView] = useState<'list' | 'chat'>('list');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('korean_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: 'Student', status: 'Studying hard!', avatar: 'ME' };
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCompanionProfileOpen, setIsCompanionProfileOpen] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    localStorage.setItem('korean_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 second splash
    return () => clearTimeout(timer);
  }, []);

  // Companions State - GUARANTEE all preset companions (including Shotaro, Sungchan, Shinyu) are merged
  const [companions, setCompanions] = useState<Companion[]>(() => {
    try {
      const saved = localStorage.getItem('korean_companions');
      if (saved) {
        const parsed: Companion[] = JSON.parse(saved);
        const savedMap = new Map(parsed.map(c => [c.id, c]));
        const merged: Companion[] = [];
        
        // Add all preset companions with user-saved customized fields if any
        for (const preset of PRESET_COMPANIONS) {
          const userSaved = savedMap.get(preset.id);
          if (userSaved) {
            merged.push({ ...preset, ...userSaved });
            savedMap.delete(preset.id);
          } else {
            merged.push(preset);
          }
        }
        
        // Add custom user-created companions
        savedMap.forEach(customComp => {
          merged.push(customComp);
        });
        return merged;
      }
    } catch (e) {
      console.error('Failed to load companions from localStorage', e);
    }
    return PRESET_COMPANIONS;
  });

  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(() => {
    return companions[0]?.id || 'hyunjae';
  });

  // Sparks & Streak records per companion
  const [sparksMap, setSparksMap] = useState<Record<string, CompanionSparkRecord>>(() => {
    return loadAllSparks(companions.map(c => c.id));
  });

  // Companion Chat History Dictionary: { [characterId]: ChatMessage[] }
  const [companionChatMap, setCompanionChatMap] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('korean_companion_chats');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load companion chats', e);
    }
    return {};
  });

  const [isCustomPersonaModalOpen, setIsCustomPersonaModalOpen] = useState(false);

  const [hasSelectedInitialCompanion, setHasSelectedInitialCompanion] = useState(() => {
    return localStorage.getItem('initial_companion_selected') === 'true';
  });

  useEffect(() => {
    if (!hasSelectedInitialCompanion) {
      setIsCustomPersonaModalOpen(true);
    }
  }, [hasSelectedInitialCompanion]);

  const [isSparksModalOpen, setIsSparksModalOpen] = useState(false);

  // Language Mode: bilingual, zh, or en
  

  // Vocab State & LocalStorage
  const [vocabulary, setVocabulary] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem('korean_vocabulary');
      if (saved) {
        const parsed: VocabItem[] = JSON.parse(saved);
        const savedMap = new Map(parsed.map(item => [item.id, item]));
        const merged: VocabItem[] = [];

        for (const preset of INITIAL_VOCABULARY) {
          const userSaved = savedMap.get(preset.id);
          if (userSaved) {
            merged.push({ ...preset, ...userSaved });
            savedMap.delete(preset.id);
          } else {
            merged.push(preset);
          }
        }

        savedMap.forEach(customItem => {
          merged.push(customItem);
        });

        return merged;
      }
    } catch (e) {
      console.error('Failed to load vocab', e);
    }
    return INITIAL_VOCABULARY;
  });

  // Saved Dialogues & LocalStorage
  const [savedDialogues, setSavedDialogues] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('korean_saved_dialogues');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load dialogues', e);
    }
    return [];
  });

  // Saved Grammar Card IDs
  const [savedGrammarIds, setSavedGrammarIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('korean_saved_grammar_ids');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load grammar ids', e);
    }
    return new Set(['g_1', 'g_3']);
  });

  // Study Streak
  const [studyStreak, setStudyStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('korean_study_streak');
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  // Persist companions
  useEffect(() => {
    localStorage.setItem('korean_companions', JSON.stringify(companions));
  }, [companions]);

  // Persist sparks
  useEffect(() => {
    localStorage.setItem('korean_companion_sparks', JSON.stringify(sparksMap));
  }, [sparksMap]);

  // Persist language mode
  

  // Persist vocabulary
  useEffect(() => {
    localStorage.setItem('korean_vocabulary', JSON.stringify(vocabulary));
  }, [vocabulary]);

  // Persist dialogues
  useEffect(() => {
    localStorage.setItem('korean_saved_dialogues', JSON.stringify(savedDialogues));
  }, [savedDialogues]);

  // Persist grammar IDs
  useEffect(() => {
    localStorage.setItem('korean_saved_grammar_ids', JSON.stringify(Array.from(savedGrammarIds)));
  }, [savedGrammarIds]);

  // Persist streak
  useEffect(() => {
    localStorage.setItem('korean_study_streak', studyStreak.toString());
  }, [studyStreak]);

  // Persist companion chats
  useEffect(() => {
    localStorage.setItem('korean_companion_chats', JSON.stringify(companionChatMap));
  }, [companionChatMap]);

  // Active Companion Object
  const currentCompanion = companions.find((c) => c.id === selectedCompanionId) || companions[0] || PRESET_COMPANIONS[0];

  // Helper sets
  const savedVocabIds = React.useMemo(() => {
    return new Set(vocabulary.filter((v) => v.isBookmarked).map((v) => v.id));
  }, [vocabulary]);

  const savedDialogueIds = React.useMemo(() => {
    return new Set(savedDialogues.map((d) => d.id));
  }, [savedDialogues]);

  // Spark Igniter & Interaction handler
  const handleIgniteSpark = (companionId: string) => {
    setSparksMap((prev) => {
      const current = prev[companionId];
      const { updatedRecord, isNewStreakDay } = recordCompanionInteraction(current, companionId);
      if (isNewStreakDay) {
        setStudyStreak((s) => s + 1);
      }
      return {
        ...prev,
        [companionId]: updatedRecord,
      };
    });
  };

  // Update messages for a specific companion
  const handleUpdateCompanionMessages = (compId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setCompanionChatMap((prev) => {
      const currentList = prev[compId] || [];
      const updatedList = updater(currentList);
      return {
        ...prev,
        [compId]: updatedList,
      };
    });
    // Auto-ignite/maintain spark for this idol on message
    handleIgniteSpark(compId);
  };

  // Handle Proactive Messages
  useEffect(() => {
    const activeChat = companionChatMap[currentCompanion.id];
    if (!activeChat || activeChat.length === 0) return;
    
    const lastMsg = activeChat[activeChat.length - 1];
    if (lastMsg.role === 'assistant' && !lastMsg.id?.startsWith('proactive')) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/chat/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character: currentCompanion, userNickname: currentCompanion.userNickname })
          });
          if (res.ok) {
            const data = await res.json();
            const proactiveMsg = {
               id: `proactive_${Date.now()}`,
               role: 'assistant',
               content: data.korean || '무슨 일 있어요?',
               timestamp: Date.now(),
               korean: data.korean,
               translation_zh: data.translation_zh,
               translation_en: data.translation_en,
               vocabulary: data.vocabulary,
               grammar_points: data.grammar_points,
               learning_tip: data.learning_tip
            };
            handleUpdateCompanionMessages(currentCompanion.id, prev => [...prev, proactiveMsg as any]);
          }
        } catch (e) {
          console.error(e);
        }
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearTimeout(timer);
    }
  }, [companionChatMap, currentCompanion.id, currentCompanion]);


  // Handlers for companion management
  const handleSelectCompanion = (comp: Companion) => {
    setSelectedCompanionId(comp.id);
  };

  const handleSaveCompanion = (updatedComp: Companion) => {
    setCompanions((prev) => {
      const exists = prev.some((c) => c.id === updatedComp.id);
      if (exists) {
        return prev.map((c) => (c.id === updatedComp.id ? updatedComp : c));
      }
      return [...prev, updatedComp];
    });
    setSelectedCompanionId(updatedComp.id);
  };

  const handleDeleteCompanion = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
    if (selectedCompanionId === id) {
      setSelectedCompanionId(PRESET_COMPANIONS[0].id);
    }
  };

  // Handlers for Vocab
  const handleSaveVocab = (item: VocabItem) => {
    setVocabulary((prev) => {
      const exists = prev.find((v) => v.id === item.id || (v.hangul === item.hangul && v.meaning_zh === item.meaning_zh));
      if (exists) {
        return prev.map((v) => (v.id === exists.id ? { ...v, isBookmarked: true } : v));
      }
      return [{ ...item, isBookmarked: true, savedAt: Date.now() }, ...prev];
    });
  };

  const handleToggleBookmarkVocab = (id: string) => {
    setVocabulary((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isBookmarked: !v.isBookmarked } : v))
    );
  };

  const handleUpdateMastery = (id: string, mastery: 'new' | 'learning' | 'mastered') => {
    setVocabulary((prev) =>
      prev.map((v) => (v.id === id ? { ...v, mastery } : v))
    );
  };

  const handleAddCustomVocab = (item: VocabItem) => {
    setVocabulary((prev) => [item, ...prev]);
  };

  const handleImportCustomWords = (newWords: VocabItem[], book: CustomLexiconBook) => {
    setVocabulary((prev) => {
      const existingHangul = new Set(prev.map(v => v.hangul || v.word));
      const filteredNew = newWords.filter(w => !existingHangul.has(w.hangul || w.word));
      return [...filteredNew, ...prev];
    });
  };

  const handleRemoveVocabFromNotebook = (id: string) => {
    setVocabulary((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isBookmarked: false } : v))
    );
  };

  // Handlers for Dialogues
  const handleSaveDialogue = (msg: ChatMessage) => {
    setSavedDialogues((prev) => {
      const exists = prev.some((d) => d.id === msg.id);
      if (exists) {
        return prev.filter((d) => d.id !== msg.id);
      }
      return [{ ...msg, isBookmarked: true }, ...prev];
    });
  };

  const handleRemoveDialogue = (id: string) => {
    setSavedDialogues((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers for Grammar
  const handleToggleBookmarkGrammar = (id: string) => {
    setSavedGrammarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveGrammarFromNotebook = (id: string) => {
    setSavedGrammarIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Handlers for Streak
  const handleIncreaseStreak = () => {
    setStudyStreak((prev) => prev + 1);
    handleIgniteSpark(selectedCompanionId);
  };

  // Navigation tab items for mobile bottom bar
  const navTabs = [
    { id: 'chat', label: '伴学对话', icon: MessageSquare },
    { id: 'grammar', label: '语法解析', icon: BookOpen },
    { id: 'flashcards', label: '词汇卡片', icon: Layers },
    { id: 'dictation', label: '听写训练', icon: Headphones },
    { id: 'speaking', label: '每日口语', icon: Mic },
    { id: 'notebook', label: '我的收藏', icon: Bookmark, badge: savedVocabIds.size + savedDialogues.length },
  ];

  return (
    <div className={`h-[100dvh] overflow-hidden text-[#2D2D2D] flex flex-col font-sans selection:bg-[#8B7E74]/20 selection:text-[#1A1A1A] ${settings.theme === "kkt" ? "bg-[#b2c7d9]" : settings.theme === "wechat" ? "bg-[#EDEDED]" : "bg-[#FAF9F6]"}`}>
      
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F6] animate-fadeOut" style={{ animationDelay: '2s', animationFillMode: 'forwards' }}>
          <div className="animate-bounce">
            <h1 className="text-4xl font-sans-kr font-bold text-[#1A1A1A] tracking-widest mb-2">Korean Buddy</h1>
          </div>
          <p className="text-sm font-sans text-[#71675E] tracking-[0.2em] animate-pulse">Korean Study Companion</p>
        </div>
      )}

      {/* Global Navigation Bar */}
      
      <Navbar theme={settings.theme} hideMobileNav={activeTab === "chat" && chatView === "chat"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companions={companions}
        selectedCompanion={currentCompanion}
        onSelectCompanion={handleSelectCompanion}
        
        onOpenSparksModal={() => setIsSparksModalOpen(true)}
        currentSpark={sparksMap[currentCompanion.id]}
        languageMode={settings.languageMode}
        setLanguageMode={(mode) => setSettings(prev => ({ ...prev, languageMode: mode }))}
        studyStreak={studyStreak}
        savedVocabCount={savedVocabIds.size}
        savedDialogueCount={savedDialogues.length}
      />
      
      {/* Main Content View Switcher */}
      <main className={`flex-1 relative min-h-0 overflow-hidden flex flex-col ${activeTab === "chat" && chatView === "chat" ? "pb-0" : "pb-16"} md:pb-0`}>
        {activeTab === 'chat' && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-transparent">
            {/* Left pane: Friends list */}
            <div className={`h-full shrink-0 w-full md:w-80 lg:w-96 flex-col border-r border-stone-100/50 bg-transparent overflow-y-auto pb-32 md:pb-0 ${chatView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
              <div className="px-4 py-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-3xl font-medium tracking-tight text-stone-800">Friends</h2>
                   
                 </div>
                 
                 <div className="space-y-1">
                   <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3 ml-2">My Profile</div>
                   <div onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent group">
                     <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                       {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : userProfile.avatar}
                     </div>
                     <div className="flex flex-col flex-1 min-w-0">
                       <span className="font-bold text-[16px] text-stone-800 truncate">{userProfile.name}</span>
                       <span className="text-sm text-stone-500 truncate">{userProfile.status}</span>
                     </div>
                   </div>
                   
                   <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mt-8 mb-3 ml-2">Buddies</div>
                   {companions.map(comp => (
                     <div 
                       key={comp.id}
                       onClick={() => {
                          handleSelectCompanion(comp);
                          setChatView('chat');
                       }}
                       className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer group ${currentCompanion.id === comp.id && chatView === 'chat' ? 'bg-stone-100' : ''}`}
                     >
                       <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                         {comp.customAvatarUrl ? (
                           <img src={comp.customAvatarUrl} alt={comp.name_zh} className="w-full h-full object-cover" />
                         ) : (
                           <span>{comp.avatar}</span>
                         )}
                       </div>
                       <div className="flex flex-col flex-1 min-w-0 pb-2">
                         <span className="font-bold text-[15px] text-stone-800 truncate">{comp.remark || comp.name_ko}</span>
                         <span className="text-[13px] text-stone-500 truncate mt-0.5">{comp.status_msg}</span>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            {/* Right pane: Chat view */}
            <div className={`flex-1 flex flex-col relative min-h-0 overflow-hidden ${chatView === 'list' ? 'hidden md:flex' : 'flex'}`}>
               <CompanionChat
                 theme={settings.theme}
                 onBack={() => setChatView('list')}
                 companion={currentCompanion}
                 companions={companions}
                 onSelectCompanion={(comp) => { handleSelectCompanion(comp); setChatView('chat'); }}
                 companionMessages={companionChatMap[currentCompanion.id]}
                 onUpdateMessages={(updater) => handleUpdateCompanionMessages(currentCompanion.id, updater)}
                 
                 onOpenSparksModal={() => setIsSparksModalOpen(true)}
                 currentSpark={sparksMap[currentCompanion.id]}
                 onIgniteSpark={() => handleIgniteSpark(currentCompanion.id)}
                 languageMode={settings.languageMode}
                 onSaveVocab={handleSaveVocab}
                 savedVocabIds={savedVocabIds}
                 onSaveDialogue={handleSaveDialogue}
                 onOpenProfile={() => setIsCompanionProfileOpen(true)}
                 savedDialogueIds={savedDialogueIds}
               />
            </div>
          </div>
        )}
        
        {activeTab === 'study' && (
          <StudyView
            onImportCustomWords={handleImportCustomWords}
            flashcardsProps={{
              vocabulary,
              onToggleBookmarkVocab: handleToggleBookmarkVocab,
              savedVocabIds,
              onUpdateMastery: handleUpdateMastery,
              onAddCustomVocab: handleAddCustomVocab,
              languageMode: settings.languageMode,
              dailyGoal: settings.dailyVocabGoal
            }}
            grammarProps={{
              grammarCards: INITIAL_GRAMMAR_CARDS,
              onToggleBookmarkGrammar: handleToggleBookmarkGrammar,
              savedGrammarIds,
              languageMode: settings.languageMode
            }}
            dictationProps={{
              dictationItems: INITIAL_DICTATION_ITEMS,
              languageMode: settings.languageMode,
              onSaveToNotebook: (item: any) => handleSaveVocab({ id: `dict_${item.id}`, word: item.korean, hangul: item.korean, type: '문장 (句子)', meaning_zh: item.translation_zh, meaning_en: item.translation_en, isBookmarked: true })
            }}
            speakingProps={{
              speakingTasks: INITIAL_SPEAKING_TASKS,
              companion: currentCompanion,
              languageMode: settings.languageMode,
              onIncreaseStreak: handleIncreaseStreak,
              studyStreak
            }}
            notebookProps={{
              savedDialogues,
              onRemoveDialogue: handleRemoveDialogue,
              savedVocab: vocabulary.filter(v => v.isBookmarked || savedVocabIds.has(v.id)),
              onRemoveVocab: handleRemoveVocabFromNotebook,
              savedGrammar: INITIAL_GRAMMAR_CARDS.filter(g => savedGrammarIds.has(g.id)),
              onRemoveGrammar: handleRemoveGrammarFromNotebook,
              companions,
              languageMode: settings.languageMode,
              studyStreak
            }}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            userProfile={userProfile}
          />
        )}
      </main>
      
      {/* Companion Selector & Custom Persona Editing Modal */}
      <CustomPersonaModal
        isOpen={isCustomPersonaModalOpen}
        onClose={() => {
          setIsCustomPersonaModalOpen(false);
          if (!hasSelectedInitialCompanion) {
            localStorage.setItem('initial_companion_selected', 'true');
            setHasSelectedInitialCompanion(true);
          }
        }}
        companions={companions}
        selectedCompanion={currentCompanion}
        onSelectCompanion={handleSelectCompanion}
        onSaveCompanion={handleSaveCompanion}
        onDeleteCompanion={handleDeleteCompanion}
      />

      {/* Companion Sparks & Streaks Modal */}
      <CompanionSparksModal
        isOpen={isSparksModalOpen}
        onClose={() => setIsSparksModalOpen(false)}
        companions={companions}
        sparksMap={sparksMap}
        onIgniteSpark={handleIgniteSpark}
        onSelectCompanion={handleSelectCompanion}
      />

      <CompanionProfileModal 
        isOpen={isCompanionProfileOpen} 
        onClose={() => setIsCompanionProfileOpen(false)} 
        companion={currentCompanion} 
        onSave={(updatedComp) => {
          setCompanions(prev => prev.map(c => c.id === updatedComp.id ? updatedComp : c));
          if (currentCompanion?.id === updatedComp.id) {
            setSelectedCompanionId(updatedComp.id);
          }
        }} 
      />
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={userProfile} 
        onSave={setUserProfile} 
      />
    </div>
  );
}
