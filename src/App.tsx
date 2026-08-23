import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomPersonaModal } from './components/CustomPersonaModal';
import { CreateCompanionModal } from './components/CreateCompanionModal';
import { CompanionProfileModal } from './components/CompanionProfileModal';
import { CompanionSparksModal } from './components/CompanionSparksModal';
import { CompanionChat } from './components/CompanionChat';
import { CompanionAvatar } from './components/CompanionAvatar';
import { UserProfileModal } from './components/UserProfileModal';
import { StudyView } from './components/StudyView';
import { SettingsView } from './components/SettingsView';
import { AppSettings, VoiceSlotConfig, MiniMaxConfig } from './types';

import { PRESET_COMPANIONS, PROACTIVE_CANDIDATES, getRandomCompanionStatus, getTimeAwareGreeting } from './data/companions';
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
import { MessageSquare, BookOpen, Layers, Headphones, Mic, Bookmark, Flame, UserPlus } from 'lucide-react';

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

  // Companions State - GUARANTEE all preset companions are merged with custom settings and avatars
  const [companions, setCompanions] = useState<Companion[]>(() => {
    try {
      // 1. Check new separate keys first
      const savedOverrides = localStorage.getItem('korean_companion_overrides');
      const savedCustom = localStorage.getItem('korean_custom_companions');
      
      let overridesMap = new Map<string, Partial<Companion>>();
      let customList: Companion[] = [];
      
      if (savedOverrides) {
        try {
          const parsedOverrides: Record<string, Partial<Companion>> = JSON.parse(savedOverrides);
          overridesMap = new Map(Object.entries(parsedOverrides));
        } catch (e) {
          console.error('Failed to parse overrides', e);
        }
      }
      
      if (savedCustom) {
        try {
          customList = JSON.parse(savedCustom);
        } catch (e) {
          console.error('Failed to parse custom companions', e);
        }
      }

      // Check legacy key for migration
      const legacySaved = localStorage.getItem('korean_companions');
      if (legacySaved && !savedOverrides && !savedCustom) {
        try {
          const parsedLegacy: Companion[] = JSON.parse(legacySaved);
          for (const c of parsedLegacy) {
            const isPreset = PRESET_COMPANIONS.some(p => p.id === c.id);
            if (isPreset) {
              const base = PRESET_COMPANIONS.find(p => p.id === c.id)!;
              const override: Partial<Companion> = {};
              if (c.customAvatarUrl && c.customAvatarUrl !== base.avatar) override.customAvatarUrl = c.customAvatarUrl;
              if (c.customNotes && c.customNotes !== base.system_prompt) override.customNotes = c.customNotes;
              if (c.persona && c.persona !== base.persona) override.persona = c.persona;
              if (c.system_prompt_appendix && c.system_prompt_appendix !== base.system_prompt_appendix) override.system_prompt_appendix = c.system_prompt_appendix;
              if (c.remark && c.remark !== base.remark) override.remark = c.remark;
              if (c.status_msg && c.status_msg !== base.status_msg) override.status_msg = c.status_msg;
              if (c.tts_pitch !== undefined && c.tts_pitch !== base.tts_pitch) override.tts_pitch = c.tts_pitch;
              if (c.tts_rate !== undefined && c.tts_rate !== base.tts_rate) override.tts_rate = c.tts_rate;
              
              if (Object.keys(override).length > 0) {
                overridesMap.set(c.id, override);
              }
            } else {
              customList.push(c);
            }
          }
          // Remove legacy key after migration to free up space instantly
          localStorage.removeItem('korean_companions');
        } catch (e) {
          console.error('Failed to migrate legacy companions', e);
        }
      }

      // Build initial merged companions list
      const merged: Companion[] = [];
      for (const preset of PRESET_COMPANIONS) {
        const override = overridesMap.get(preset.id);
        if (override) {
          merged.push({
            ...preset,
            ...override,
            avatar: override.customAvatarUrl || preset.avatar,
            customAvatarUrl: override.customAvatarUrl,
            customNotes: override.customNotes || override.persona || override.system_prompt_appendix || '',
            persona: override.persona || override.customNotes || '',
            system_prompt_appendix: override.system_prompt_appendix || override.customNotes || '',
            remark: override.remark || preset.remark || preset.name_ko,
            status_msg: override.status_msg || preset.status_msg,
            tts_pitch: override.tts_pitch !== undefined ? override.tts_pitch : preset.tts_pitch,
            tts_rate: override.tts_rate !== undefined ? override.tts_rate : preset.tts_rate,
          });
        } else {
          merged.push(preset);
        }
      }

      // Add custom companions
      merged.push(...customList);
      return merged;
    } catch (e) {
      console.error('Failed to initialize companions state', e);
      return PRESET_COMPANIONS;
    }
  });

  // Sync companions to localStorage using high-performance split keys (avoids quota error entirely)
  useEffect(() => {
    try {
      const overrides: Record<string, Partial<Companion>> = {};
      const custom: Companion[] = [];
      
      for (const c of companions) {
        const base = PRESET_COMPANIONS.find(p => p.id === c.id);
        if (base) {
          const override: Partial<Companion> = {};
          if (c.customAvatarUrl) override.customAvatarUrl = c.customAvatarUrl;
          if (c.customNotes) override.customNotes = c.customNotes;
          if (c.persona) override.persona = c.persona;
          if (c.system_prompt_appendix) override.system_prompt_appendix = c.system_prompt_appendix;
          if (c.remark && c.remark !== base.remark && c.remark !== base.name_ko) override.remark = c.remark;
          if (c.status_msg && c.status_msg !== base.status_msg) override.status_msg = c.status_msg;
          if (c.tts_pitch !== undefined && c.tts_pitch !== base.tts_pitch) override.tts_pitch = c.tts_pitch;
          if (c.tts_rate !== undefined && c.tts_rate !== base.tts_rate) override.tts_rate = c.tts_rate;
          
          if (Object.keys(override).length > 0) {
            overrides[c.id] = override;
          }
        } else {
          custom.push(c);
        }
      }
      
      localStorage.setItem('korean_companion_overrides', JSON.stringify(overrides));
      localStorage.setItem('korean_custom_companions', JSON.stringify(custom));
    } catch (e) {
      console.error('Failed to sync companions overrides to localStorage', e);
    }
  }, [companions]);

  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(() => {
    return companions[0]?.id || 'hyunjae';
  });

  // Unread badge map per companion
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('korean_unread_counts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('korean_unread_counts', JSON.stringify(unreadMap));
  }, [unreadMap]);

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
  const [isCreateCompanionModalOpen, setIsCreateCompanionModalOpen] = useState(false);

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

  // Clear Chat History for a specific companion (optionally preserves pinned core memories)
  const handleClearCompanionChat = (companionId: string, preservePinned: boolean = false) => {
    setCompanionChatMap((prev) => {
      const next = { ...prev };
      if (preservePinned) {
        const currentMsgs = prev[companionId] || [];
        const pinnedOnly = currentMsgs.filter(m => m.isPinned || m.isMemory);
        if (pinnedOnly.length > 0) {
          next[companionId] = pinnedOnly;
        } else {
          delete next[companionId];
        }
      } else {
        delete next[companionId];
      }
      return next;
    });
    // NOTE: Strictly retain character avatar, custom notes, remark, and persona settings when clearing chat history.
  };

  // Handle Proactive Messages for idle or inactive companions with realistic delays and dynamic LLM / time awareness
  useEffect(() => {
    if (settings.proactiveMessagesEnabled === false) {
      return;
    }

    let timer: NodeJS.Timeout;

    const scheduleNextProactiveCheck = () => {
      // Staggered trigger: random delay between 20 and 75 minutes (1,200,000ms - 4,500,000ms), with 2-minute test floor on fresh dev runs
      const randomDelay = Math.floor(Math.random() * (4500000 - 1200000) + 1200000);

      timer = setTimeout(async () => {
        if (settings.proactiveMessagesEnabled === false) return;

        // Pick an inactive companion who is NOT in the current active chat window
        const candidateCompanions = companions.filter(c => c.id !== selectedCompanionId || chatView !== 'chat');
        if (candidateCompanions.length === 0) {
          scheduleNextProactiveCheck();
          return;
        }

        const randomComp = candidateCompanions[Math.floor(Math.random() * candidateCompanions.length)];
        const effectiveCallSign = userProfile?.userCallSign || (userProfile?.userNickname && userProfile?.userNickname !== '더비 (THE B)' && userProfile?.userNickname !== '브리즈 (BRIIZE)' && userProfile?.userNickname !== '42 (사이)' ? userProfile?.userNickname : undefined) || randomComp.userNickname || '너';
        
        let korean = '';
        let translation_zh = '';
        let translation_en = '';

        // Dynamic LLM proactive generation based on live idol scenarios
        try {
          const now = new Date();
          const recentHistory = (companionChatMap[randomComp.id] || []).slice(-3);
          const res = await fetch('/api/chat/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character: randomComp,
              userNickname: effectiveCallSign,
              userCallSign: effectiveCallSign,
              recentMessages: recentHistory,
              clientTemporal: {
                isoString: now.toISOString(),
                hours: now.getHours(),
                minutes: now.getMinutes(),
              },
              apiConfig: settings.api_config,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.korean_text || data.korean) {
              korean = data.korean_text || data.korean;
              translation_zh = data.translation_text || data.translation_zh || '';
              translation_en = data.translation_en || '';
            }
          }
        } catch (err) {
          console.debug('Proactive LLM fetch fallback:', err);
        }

        // Dynamic time-aware greeting fallback if LLM returned empty
        if (!korean) {
          const timeGreeting = getTimeAwareGreeting(randomComp, effectiveCallSign);
          korean = timeGreeting.korean;
          translation_zh = timeGreeting.translation_zh;
          translation_en = timeGreeting.translation_en;
        }

        const proactiveMsg: ChatMessage = {
          id: `proactive_${randomComp.id}_${Date.now()}`,
          role: 'assistant',
          content: korean,
          korean: korean,
          translation_zh: translation_zh,
          translation_en: translation_en,
          vocabulary: [],
          grammar_points: [],
          learning_tip: '💡 1:1 실시간 맞춤 안부 메시지',
          timestamp: Date.now(),
          isRead: false,
          isProactive: true,
        };

        setCompanionChatMap(prev => {
          const history = prev[randomComp.id] || [];
          const last = history[history.length - 1];
          if (last && (last.korean === korean || last.content === korean)) return prev;
          return {
            ...prev,
            [randomComp.id]: [...history, proactiveMsg]
          };
        });

        // Update unread count if not actively viewing this companion's chat
        if (randomComp.id !== selectedCompanionId || chatView !== 'chat') {
          setUnreadMap(prev => ({
            ...prev,
            [randomComp.id]: (prev[randomComp.id] || 0) + 1
          }));
        }

        // Also refresh companion status randomly from their status pool
        setCompanions(prev => prev.map(c => {
          if (c.id === randomComp.id) {
            return {
              ...c,
              status_msg: getRandomCompanionStatus(c.id)
            };
          }
          return c;
        }));

        scheduleNextProactiveCheck();
      }, randomDelay);
    };

    scheduleNextProactiveCheck();

    return () => clearTimeout(timer);
  }, [companions, selectedCompanionId, chatView, userProfile, settings.proactiveMessagesEnabled, settings.api_config]);

  // Handlers for companion management
  const handleSelectCompanion = (comp: Companion) => {
    setSelectedCompanionId(comp.id);
    // Clear unread count on selection
    setUnreadMap(prev => {
      if (!prev[comp.id]) return prev;
      const next = { ...prev };
      delete next[comp.id];
      return next;
    });
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

  const handleCreateCompanion = (newComp: Companion, voiceSlot: VoiceSlotConfig) => {
    setCompanions((prev) => [...prev, newComp]);

    try {
      const savedMM = localStorage.getItem('minimax_config');
      const mm: MiniMaxConfig = savedMM 
        ? JSON.parse(savedMM) 
        : { group_id: '', api_key: '', model: 'speech-01-turbo', voice_slots: {} };
      mm.voice_slots = mm.voice_slots || {};
      mm.voice_slots[newComp.id] = voiceSlot;
      localStorage.setItem('minimax_config', JSON.stringify(mm));
    } catch (e) {
      console.warn('Failed to sync new companion voice slot', e);
    }

    setSelectedCompanionId(newComp.id);
    setChatView('chat');

    // Create initial welcoming greeting from the new companion
    const initialGreeting: ChatMessage = {
      id: `msg_init_${newComp.id}_${Date.now()}`,
      role: 'assistant',
      content: `안녕! 나 ${newComp.name_ko || newComp.name_kr}이야. 오늘 하루 어땠어? 편하게 이야기해줘.`,
      korean: `안녕! 나 ${newComp.name_ko || newComp.name_kr}이야. 오늘 하루 어땠어? 편하게 이야기해줘.`,
      translation_zh: `嗨！我是${newComp.name_ko || newComp.name_kr}。今天过得怎么样？随心跟我聊聊吧。`,
      translation_en: `Hi! I'm ${newComp.name_ko || newComp.name_kr}. How was your day? Feel free to chat with me.`,
      vocabulary: [],
      grammar_points: [],
      learning_tip: '💡 随时长按消息可设为永久核心记忆',
      timestamp: Date.now(),
      isRead: true
    };
    setCompanionChatMap(prev => ({
      ...prev,
      [newComp.id]: [initialGreeting]
    }));
  };

  const handleDeleteCompanion = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
    if (selectedCompanionId === id) {
      setSelectedCompanionId(PRESET_COMPANIONS[0].id);
    }
  };

  const handleResetAllData = () => {
    // 1. Clear overrides and custom companions from localStorage
    localStorage.removeItem('korean_companion_overrides');
    localStorage.removeItem('korean_custom_companions');
    localStorage.removeItem('korean_companions'); // clear legacy key
    
    // 2. Clear chats
    localStorage.removeItem('korean_companion_chats');
    setCompanionChatMap({});
    
    // 3. Reset companions state
    setCompanions(PRESET_COMPANIONS);
    setSelectedCompanionId(PRESET_COMPANIONS[0].id);
    
    // 4. Reset streak, vocab, grammar IDs, and saved dialogues to default
    localStorage.removeItem('korean_vocabulary');
    localStorage.removeItem('korean_saved_dialogues');
    localStorage.removeItem('korean_saved_grammar_ids');
    localStorage.removeItem('korean_study_streak');
    
    setVocabulary(INITIAL_VOCABULARY);
    setSavedDialogues([]);
    setSavedGrammarIds(new Set(['g_1', 'g_3']));
    setStudyStreak(5);
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
            <div className={`h-full shrink-0 w-full md:w-80 lg:w-96 flex-col border-r border-stone-200/60 bg-transparent overflow-y-auto pb-32 md:pb-0 ${chatView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
              <div className="px-4 py-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 font-sans">Friends</h2>
                   <button
                     type="button"
                     onClick={() => setIsCreateCompanionModalOpen(true)}
                     className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                     title="添加自定义好友"
                   >
                     <UserPlus size={13} />
                     <span>添加好友</span>
                   </button>
                 </div>
                 
                 <div className="space-y-1">
                   <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase mb-2.5 ml-2 font-sans">My Profile</div>
                   <div onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-stone-100/70 transition-colors cursor-pointer group">
                     <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-medium text-lg overflow-hidden shrink-0 border border-stone-200 shadow-2xs">
                       {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" /> : (userProfile.userName || userProfile.name || 'ME').slice(0, 2)}
                     </div>
                     <div className="flex flex-col flex-1 min-w-0">
                       <span className="font-semibold text-[15px] text-stone-900 truncate font-sans">{userProfile.name}</span>
                       <span className="text-xs text-stone-500 truncate mt-0.5 font-sans">{userProfile.status}</span>
                     </div>
                   </div>
                   
                   <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase mt-6 mb-2.5 ml-2 font-sans">Buddies</div>
                   <div className="space-y-0.5">
                     {companions.map((comp, idx) => {
                       const unreadCount = unreadMap[comp.id] || 0;
                       const isSelected = currentCompanion.id === comp.id && chatView === 'chat';
                       const isLast = idx === companions.length - 1;
                       const nextComp = companions[idx + 1];
                       const isNextSelected = nextComp && currentCompanion.id === nextComp.id && chatView === 'chat';

                       return (
                         <React.Fragment key={comp.id}>
                           <div 
                             onClick={() => {
                                handleSelectCompanion(comp);
                                setChatView('chat');
                             }}
                             className={`flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-stone-100/70 transition-colors cursor-pointer group ${isSelected ? 'bg-stone-100' : ''}`}
                           >
                             <div className="relative shrink-0">
                               <CompanionAvatar
                                 companion={comp}
                                 sizeClassName="w-11 h-11"
                                 alt={comp.name_ko || comp.name_kr}
                                 className="border border-stone-200 shadow-xs flex-shrink-0"
                               />
                               {unreadCount > 0 && (
                                 <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-700 text-white text-[10px] border-0 shadow-xs font-medium rounded-full flex items-center justify-center">
                                   {unreadCount > 99 ? '99+' : unreadCount}
                                 </span>
                               )}
                             </div>
                             <div className="flex flex-col flex-1 min-w-0 pb-0.5">
                               <div className="flex items-center justify-between gap-1.5">
                                 <span className="font-medium text-[15px] text-stone-900 shrink-0 whitespace-nowrap font-sans">{comp.name_ko || comp.name_kr || comp.remark}</span>
                               </div>
                               <span className="text-xs text-stone-500 truncate mt-0.5 leading-snug font-sans">{comp.status_msg}</span>
                             </div>
                           </div>

                           {/* iOS Inset Divider: Start after avatar at text edge, subtle 1px border */}
                           {!isLast && !isSelected && !isNextSelected && (
                             <div className="ml-[72px] border-b border-black/[0.04] dark:border-white/[0.04] my-0" />
                           )}
                         </React.Fragment>
                       );
                     })}
                   </div>
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
                 onClearChat={(preservePinned) => handleClearCompanionChat(currentCompanion.id, preservePinned)}
                 
                 onOpenSparksModal={() => setIsSparksModalOpen(true)}
                 currentSpark={sparksMap[currentCompanion.id]}
                 onIgniteSpark={() => handleIgniteSpark(currentCompanion.id)}
                 languageMode={settings.languageMode}
                 onSaveVocab={handleSaveVocab}
                 savedVocabIds={savedVocabIds}
                 onSaveDialogue={handleSaveDialogue}
                 onOpenProfile={() => setIsCompanionProfileOpen(true)}
                 savedDialogueIds={savedDialogueIds}
                 userProfile={userProfile}
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
            companions={companions}
            onResetAllData={handleResetAllData}
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

      {/* Create Custom Companion Modal */}
      <CreateCompanionModal
        isOpen={isCreateCompanionModalOpen}
        onClose={() => setIsCreateCompanionModalOpen(false)}
        onCreate={handleCreateCompanion}
        minimaxConfig={(() => {
          try {
            const saved = localStorage.getItem('minimax_config');
            return saved ? JSON.parse(saved) : undefined;
          } catch (e) {
            return undefined;
          }
        })()}
      />
    </div>
  );
}
