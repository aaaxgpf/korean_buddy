import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Volume2, 
  Bookmark, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Settings,
  BellRing,
  BookOpen,
  HelpCircle,
  X,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  Zap,
  Plus,
  MessageSquare,
  Users,
  MoreVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Companion, ChatMessage, VocabItem, GrammarPointItem, CompanionSparkRecord, UserProfile } from '../types';
import { CompanionAvatar } from './CompanionAvatar';
import { speakKorean, stopSpeaking } from '../utils/audio';
import { directSendGeminiChat } from '../utils/geminiDirect';

interface CompanionChatProps {
  theme?: 'default' | 'kkt' | 'wechat';
  onBack?: () => void;
  companion: Companion;
  companions: Companion[];
  onSelectCompanion: (companion: Companion) => void;
  companionMessages?: ChatMessage[];
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onOpenCompanionSelector: () => void;
  onOpenSparksModal: () => void;
  currentSpark?: CompanionSparkRecord;
  onIgniteSpark: () => void;
  languageMode: 'bilingual' | 'zh' | 'en';
  onSaveVocab: (item: VocabItem) => void;
  savedVocabIds: Set<string>;
  onSaveDialogue: (msg: ChatMessage) => void;
  savedDialogueIds: Set<string>;
  onOpenProfile?: () => void;
  userProfile?: UserProfile;
}

// WeChat style timestamp formatter
export function formatWeChatChatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const isSameYear = date.getFullYear() === now.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '上午' : '下午';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const timeStr = `${period} ${displayHour}:${minutes}`;

  if (isToday) {
    return timeStr;
  }
  if (isYesterday) {
    return `昨天 ${timeStr}`;
  }
  if (isSameYear) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
}

export function shouldShowTimeDivider(currentMsg: ChatMessage, prevMsg?: ChatMessage): boolean {
  if (!prevMsg) return true;
  const diffMs = currentMsg.timestamp - prevMsg.timestamp;
  if (diffMs > 5 * 60 * 1000) return true; // > 5 minutes
  const currDate = new Date(currentMsg.timestamp).toDateString();
  const prevDate = new Date(prevMsg.timestamp).toDateString();
  return currDate !== prevDate;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  onBack,
  theme = 'default',
  companion,
  companions,
  onSelectCompanion,
  companionMessages,
  onUpdateMessages,
  onOpenCompanionSelector,
  onOpenSparksModal,
  currentSpark,
  onIgniteSpark,
  languageMode,
  onSaveVocab,
  savedVocabIds,
  onSaveDialogue,
  onOpenProfile,
  savedDialogueIds,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  // Immersive vs Study Master Switch
  // In 'immersive' mode, translations and analysis are collapsed by default until user taps the specific chip
  
  // Independent toggle state per message: { [msgId]: { zh: boolean, en: boolean, vocab: boolean, grammar: boolean, tip: boolean } }
  const [messageExpandedState, setMessageExpandedState] = useState<Record<string, Record<string, boolean>>>({});

  // Voice Tuning Guide Modal
    const [chatMode, setChatMode] = useState<'learning' | 'pure'>('learning');
  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize messages with authentic welcoming greeting if empty
  useEffect(() => {
    if (!companionMessages || companionMessages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: `welcome_${companion.id}_${Date.now()}`,
        role: 'assistant',
        content: companion.intro_kr,
        korean: companion.intro_kr,
        translation_zh: companion.intro_zh,
        translation_en: companion.intro_en,
        timestamp: Date.now(),
        isRead: true,
        vocabulary: [
          {
            id: 'auto_vocab_' + Date.now(),
            category: 'Idol Vocabulary',
            level: 'TOPIK 1',
            word: companion.tags?.[1]?.replace('#', '') || '한국어',
            hangul: companion.tags?.[1]?.replace('#', '') || '한국어',
            type: 'Noun',
            meaning_zh: companion.badge || 'Core Vocabulary',
            meaning_en: companion.persona_tag || 'Key word',
            example_kr: companion.intro_kr,
            example_zh: companion.intro_zh,
          }
        ],
        grammar_points: [
          {
            pattern: '-(으)ㄹ까(요)?',
            title_zh: 'Suggestion / Proposal',
            title_en: 'Casual proposal / Suggestion',
            explanation_zh: 'Used to suggest or ask for an opinion.',
            explanation_en: 'Used to casually suggest doing something together.',
          }
        ],
        learning_tip: `💡 Buddy: ${companion.name_en || companion.name_ko} is chatting with you. Tap words for explanations!`,
      };
      onUpdateMessages(() => [initialGreeting]);
    }
  }, [companion.id]);

  const messages = companionMessages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Video Link Extraction Helper
  const extractVideoLink = (text: string) => {
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[\w\-]+(?:[^\s]*))/gi;
    const bilibiliRegex = /(https?:\/\/(?:www\.)?bilibili\.com\/video\/[a-zA-Z0-9]+(?:[^\s]*))/gi;
    const tiktokRegex = /(https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._\-]+\/video\/\d+(?:[^\s]*))/gi;
    const weverseRegex = /(https?:\/\/weverse\.io\/[a-zA-Z0-9\-_\/]+)/gi;

    let match = text.match(youtubeRegex);
    if (match) return { link: match[0], platform: 'YouTube / Shorts' };

    match = text.match(bilibiliRegex);
    if (match) return { link: match[0], platform: 'Bilibili' };

    match = text.match(tiktokRegex);
    if (match) return { link: match[0], platform: 'TikTok' };

    match = text.match(weverseRegex);
    if (match) return { link: match[0], platform: 'Weverse' };

    return null;
  };

  // Real-time temporal awareness engine client context builder
  const getClientTemporalContext = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

    let timeSlot = 'Daytime & Practice';
    let timeSlotKo = '낮 / 안무 연습 및 스케줄';
    let timeSlotZh = '白天 / 编舞练习与通告日程';
    let contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';

    if (hours >= 6 && hours < 9) {
      timeSlot = 'Early Morning';
      timeSlotKo = '이른 아침 / 기상 및 하루 준비';
      timeSlotZh = '清晨 / 起床与晨间准备';
      contextDescription = 'The idol has just woken up or started their morning routine, breakfast, getting ready.';
    } else if (hours >= 9 && hours < 18) {
      timeSlot = 'Daytime & Practice';
      timeSlotKo = '낮 / 안무 연습 및 스케줄';
      timeSlotZh = '白天 / 编舞练习与通告日程';
      contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';
    } else if (hours >= 18 && hours < 21) {
      timeSlot = 'Evening & Dinner';
      timeSlotKo = '저녁 / 식사 및 연습 마무리';
      timeSlotZh = '傍晚 / 晚饭与收工整理';
      contextDescription = 'The idol is having dinner, finishing up schedule/rehearsals, heading back to dorm/studio.';
    } else if (hours >= 21 || hours < 1) {
      timeSlot = 'Late Night & Personal Time';
      timeSlotKo = '심야 / 개인 시간 및 야식·작업';
      timeSlotZh = '深夜 / 个人时间与宵夜·写歌';
      contextDescription = 'The idol is in their room, chilling, eating late-night snacks, working on lyrics/tracks in studio, or winding down.';
    } else {
      timeSlot = 'Midnight & Dawn (Rest/Late Studio)';
      timeSlotKo = '새벽 / 숙소 휴식 또는 심야 작업';
      timeSlotZh = '凌晨 / 宿舍休息或深夜录音棚';
      contextDescription = 'It is late at night / early dawn (1:00-6:00 AM). The idol is either finishing late-night studio work or in bed winding down. They naturally acknowledge the quiet late hour and advise resting, without asking daytime plans.';
    }

    return {
      rawTime: `${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}`,
      dayOfWeek: dayName,
      timeZone,
      timeSlot,
      timeSlotKo,
      timeSlotZh,
      contextDescription,
      formattedTag: `[Current Real Time: ${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}, ${dayName}, ${timeZone}] - Slot: ${timeSlot} (${timeSlotZh})`
    };
  };

  // Handle Photo Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userText = inputText.trim();
    const videoData = extractVideoLink(userText);
    const imagePayload = selectedImage;
    const clientTemporal = getClientTemporalContext();

    // Get current stored API configuration
    let apiConfig = undefined;
    try {
      const savedConfig = localStorage.getItem('korean_buddy_api_config');
      if (savedConfig) {
        apiConfig = JSON.parse(savedConfig);
      }
    } catch (e) {
      console.warn('Failed to parse api config from localStorage', e);
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      image: imagePayload || undefined,
      videoLink: videoData?.link,
      videoInfo: videoData ? { platform: videoData.platform, url: videoData.link } : undefined,
      timestamp: Date.now(),
      isRead: false,
    };

    onUpdateMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let data: any;

      if (apiConfig?.provider === 'gemini' && apiConfig?.apiKey?.trim()) {
        data = await directSendGeminiChat({
          apiKey: apiConfig.apiKey,
          model: apiConfig.model,
          baseURL: apiConfig.baseURL,
          character: companion,
          messages: [...messages, userMessage],
          userNickname: companion.userNickname,
          languageMode,
          imageBase64: imagePayload,
          imageMime: undefined,
          clientTemporal
        });
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: companion,
            messages: [...messages, userMessage],
            userNickname: companion.userNickname,
            languageMode,
            imageBase64: imagePayload,
            videoLink: videoData?.link,
            videoInfo: videoData,
            clientTemporal,
            apiConfig,
          }),
        });

        data = await res.json();

        if (!res.ok || data.error) {
          if (data.error === 'NO_API_KEY') {
            const alertMsg: ChatMessage = {
              id: `alert_${Date.now()}`,
              role: 'assistant',
              content: '⚠️ 未配置大模型 API Key。请点击右上角「Settings 设置」页面，填入您的 API Key（支持 Gemini / Claude / OpenAI / DeepSeek 等）以开启真实多轮对话。',
              korean: 'API 키가 필요합니다. 설정(Settings)에서 API 키를 입력해 주세요.',
              translation_zh: '⚠️ 未配置大模型 API Key。请点击右上角「Settings 设置」页面填入 API Key 开启真实对话。',
              timestamp: Date.now(),
              isRead: true,
            };
            onUpdateMessages((prev) =>
              prev.map((m) => (m.id === userMessage.id ? { ...m, isRead: true } : m)).concat(alertMsg)
            );
            return;
          } else {
            const errorMsg: ChatMessage = {
              id: `err_${Date.now()}`,
              role: 'assistant',
              content: `⚠️ 请求异常：${data.message || '大模型请求失败，请检查网络或 API 设置'}`,
              korean: '오류가 발생했습니다. 다시 시도해 주세요.',
              translation_zh: `⚠️ 请求异常：${data.message || '请检查网络或 API 设置'}`,
              timestamp: Date.now(),
              isRead: true,
            };
            onUpdateMessages((prev) =>
              prev.map((m) => (m.id === userMessage.id ? { ...m, isRead: true } : m)).concat(errorMsg)
            );
            return;
          }
        }
      }

      const rawKr = data.korean_text || data.korean || data.content || '';
      const pureKorean = rawKr
        .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
        .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
        .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
        .trim();

      const assistantMessage: ChatMessage = {
        id: `idol_${companion.id}_${Date.now()}`,
        role: 'assistant',
        content: pureKorean || '응, 듣고 있어~ 편하게 이야기해!',
        korean: pureKorean || '응, 듣고 있어~ 편하게 이야기해!',
        translation_zh: data.translation_text || data.translation_zh || '',
        translation_en: data.translation_en,
        vocabulary: data.vocabulary,
        grammar_points: data.grammar_points,
        learning_tip: data.learning_tip,
        timestamp: Date.now(),
        isRead: true,
      };

      onUpdateMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, isRead: true } : m)).concat(assistantMessage)
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      const networkErrMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ 网络连接异常：${err?.message || '无法连接到服务器'}`,
        korean: '네트워크 연결 오류가 발생했습니다.',
        translation_zh: '⚠️ 网络连接异常，请检查网络后重试。',
        timestamp: Date.now(),
        isRead: true,
      };
      onUpdateMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, isRead: true } : m)).concat(networkErrMessage)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Proactive message trigger
  const triggerProactiveMessage = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const clientTemporal = getClientTemporalContext();
      let apiConfig = undefined;
      try {
        const savedConfig = localStorage.getItem('korean_buddy_api_config');
        if (savedConfig) {
          apiConfig = JSON.parse(savedConfig);
        }
      } catch (e) {
        console.warn('Failed to parse api config', e);
      }

      const res = await fetch('/api/chat/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: companion,
          userNickname: companion.userNickname,
          clientTemporal,
          apiConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        console.warn('Proactive check-in unavailable:', data.message);
        return;
      }

      const rawKr = data.korean_text || data.korean || data.content || '';
      const pureKorean = rawKr
        .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
        .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
        .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
        .trim();

      const proactiveMessage: ChatMessage = {
        id: `proactive_${companion.id}_${Date.now()}`,
        role: 'assistant',
        content: pureKorean || '안녕! 편하게 이야기하자.',
        korean: pureKorean || '안녕! 편하게 이야기하자.',
        translation_zh: data.translation_text || data.translation_zh || '',
        translation_en: data.translation_en,
        vocabulary: data.vocabulary,
        grammar_points: data.grammar_points,
        learning_tip: data.learning_tip,
        timestamp: Date.now(),
        isProactive: true,
        isRead: true,
      };

      onUpdateMessages((prev) => [...prev, proactiveMessage]);
    } catch (err) {
      console.error('Proactive message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (text: string, msgId: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msgId);
    speakKorean(text, { gender: 'male', 
      pitch: companion.tts_pitch || 1.0,
      rate: companion.tts_rate || 0.95,
      emotion: 'natural',
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
  };

  // Toggle independent section on a specific message
  let pressTimer: NodeJS.Timeout;
  const handleTouchStart = (msgId: string) => {
    pressTimer = setTimeout(() => {
      setLongPressedMsgId(prev => prev === msgId ? null : msgId);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const toggleMessageSection = (msgId: string, section: 'zh' | 'en' | 'vocab' | 'grammar' | 'tip') => {
    setMessageExpandedState((prev) => {
      const current = prev[msgId] || {};
      const currentVal = current[section] || false;
      return {
        ...prev,
        [msgId]: {
          ...current,
          [section]: !currentVal,
        },
      };
    });
  };

  const isSectionVisible = (msgId: string, section: 'zh' | 'en' | 'vocab' | 'grammar' | 'tip') => {
    const msgState = messageExpandedState[msgId];
    if (msgState && msgState[section] !== undefined) {
      return msgState[section];
    }
    // Fully immersive by default. Users must explicitly toggle sections.
    return false;
  };

  const formatKktTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? '오후' : '오전';
    const displayHour = hours % 12 || 12;
    return `${period} ${displayHour}:${minutes}`;
  };

  const handleIgniteToday = () => {
    onIgniteSpark();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#EF4444', '#EC4899'],
    });
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-2xl mx-auto relative overflow-hidden ${theme === 'kkt' ? 'bg-[#b2c7d9] shadow-lg border-x border-[#9bbbd4]' : 'bg-transparent'}`}>
      
      
      {/* KAKAO TALK TOP HEADER */}
      <div className={`${theme === 'kkt' ? 'bg-[#b2c7d9]/95 border-b border-[#9bbbd4]' : 'bg-transparent backdrop-blur-lg'} backdrop-blur-md px-4 py-3 flex flex-col gap-2 z-10 shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="md:hidden p-1 -ml-2 text-stone-800 hover:bg-black/5 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <CompanionAvatar
              companion={companion}
              sizeClassName="w-10 h-10"
              alt={companion.name_zh}
              className="border border-slate-200 shadow-sm flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800 text-base sm:text-lg leading-tight">{companion.name_ko} · {companion.name_zh}</span>
                {companion.badge && (
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md bg-stone-100/90 text-stone-600 border border-stone-200/70 uppercase">
                    {companion.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 opacity-90 mt-0.5">
                <span className="text-xs text-stone-500 font-medium tracking-normal truncate max-w-[260px] sm:max-w-[360px]">{companion.status_msg}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChatMode(chatMode === 'learning' ? 'pure' : 'learning')}
              className={`p-2 rounded-full transition-colors flex items-center gap-1 ${chatMode === 'learning' ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:bg-stone-100'}`}
              title={chatMode === 'learning' ? "Learning Mode (Click to switch to Pure Chat)" : "Pure Chat Mode (Click to switch to Learning Mode)"}
            >
              {chatMode === 'learning' ? <BookOpen size={18} /> : <MessageSquare size={18} />}
            </button>
            <button
              onClick={() => setShowHeader(!showHeader)}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              title="Switch Buddy"
            >
              <Users size={20} />
            </button>
            <button
              onClick={onOpenProfile}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              title="AI Settings"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Dropdown for Switcher */}
        {showHeader && (
          <div className="bg-white rounded-xl shadow-md p-2 mt-1 animate-in fade-in slide-in-from-top-2 flex gap-2 overflow-x-auto scrollbar-none border border-black/5">
            {companions.map((comp) => {
              const isSelected = comp.id === companion.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    onSelectCompanion(comp);
                    setShowHeader(false);
                  }}
                  className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors ${isSelected ? 'bg-amber-50' : 'hover:bg-stone-50'}`}
                >
                  <CompanionAvatar
                    companion={comp}
                    sizeClassName="w-10 h-10"
                    alt={comp.name_zh}
                    className={`rounded-xl border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200'}`}
                  />
                  <span className="text-[10px] font-medium text-stone-800 truncate w-full text-center">{comp.name_zh}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

{/* 3. CHAT MESSAGES SCROLL CONTAINER */}
      <div 
        className={`flex-1 overflow-y-auto space-y-4 p-3 sm:p-4 ${theme === 'kkt' ? 'bg-[#b2c7d9]' : theme === 'wechat' ? 'bg-[#EDEDED]' : 'rounded-2xl sm:rounded-3xl bg-[#F0EDE6] border border-[#E0DED7] shadow-inner'}`}
        style={{ backgroundImage: 'radial-gradient(#E0DED7 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        
        {/* Date Divider */}
        <div className="flex items-center justify-center my-1.5">
          <span className="text-[10px] tracking-wider px-3 py-0.5 rounded-full bg-black/10 text-[#71675E] font-medium backdrop-blur-xs">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isMsgBookmarked = savedDialogueIds.has(msg.id) || msg.isBookmarked;

          const hasZh = !!msg.translation_zh;
          const hasEn = !!msg.translation_en;
          const hasVocab = !!(msg.vocabulary && msg.vocabulary.length > 0);
          const hasGrammar = !!(msg.grammar_points && msg.grammar_points.length > 0);
          const hasTip = !!msg.learning_tip;

          const showZh = hasZh && isSectionVisible(msg.id, 'zh');
          const showEn = hasEn && isSectionVisible(msg.id, 'en');
          const showVocab = hasVocab && isSectionVisible(msg.id, 'vocab');
          const showGrammar = hasGrammar && isSectionVisible(msg.id, 'grammar');
          const showTip = hasTip && isSectionVisible(msg.id, 'tip');

          const isPureMode = chatMode === 'pure';
          const isRevealed = longPressedMsgId === msg.id;
          const showLearningUI = !isPureMode || isRevealed;

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-1.5 sm:gap-2 max-w-full group`}
              onPointerDown={() => handleTouchStart(msg.id)}
              onPointerUp={handleTouchEnd}
              onPointerLeave={handleTouchEnd}
            >
              {/* COMPANION AVATAR ON LEFT */}
              {!isUser && (
                <div className="shrink-0 self-start mt-0.5">
                  <CompanionAvatar
                    companion={companion}
                    sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
                    alt={companion.name_zh}
                    className="border border-[#D5D1C8] shadow-xs"
                  />
                </div>
              )}

              {/* USER TIMESTAMP ON LEFT SIDE */}
              {isUser && (
                <div className="flex flex-col items-end text-[10px] text-[#8B7E74] font-sans pb-1 select-none">
                  {msg.isRead === false && (
                    <span className="text-amber-600 font-bold text-[9px] mb-0.5">1</span>
                  )}
                  <span>{formatKktTime(msg.timestamp)}</span>
                </div>
              )}

              {/* MESSAGE BODY CONTAINER */}
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[82%]`}>
                
                {/* Companion Name Label */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-xs font-bold text-[#4A4540]">
                    
                    {msg.isProactive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-normal">
                        ✨ Message
                      </span>
                    )}
                  </div>
                )}

                {/* THE SPEECH BUBBLE */}
                <div
                  className={`relative p-3 sm:p-3.5 transition-all ${
  isUser
    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-sm font-sans' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-md before:absolute before:right-[-5px] before:top-[14px] before:border-t-[5px] before:border-t-transparent before:border-b-[5px] before:border-b-transparent before:border-l-[5px] before:border-l-[#95EC69]' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm')
    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-md before:absolute before:left-[-5px] before:top-[14px] before:border-t-[5px] before:border-t-transparent before:border-b-[5px] before:border-b-transparent before:border-r-[5px] before:border-r-white' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')
}`}
                >
                  
                  {/* USER CONTENT */}
                  {isUser && (
                    <div className="space-y-2">
                      {msg.image && (
                        <div className="rounded-xl overflow-hidden max-w-[220px] max-h-[220px] border border-black/10 bg-white">
                          <img src={msg.image} alt="Attached" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {msg.videoLink && (
                        <div className="p-2.5 rounded-xl bg-black/5 border border-black/10 flex items-center gap-2.5 max-w-sm">
                          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-[#191919] block truncate">
                              {msg.videoInfo?.platform || 'Video Share'}
                            </span>
                            <span className="text-[10px] text-stone-600 truncate block">
                              {msg.videoLink}
                            </span>
                          </div>
                          <a href={msg.videoLink} target="_blank" rel="noopener noreferrer" className="p-1 text-stone-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {msg.content && (
                        <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* IDOL CONTENT */}
                  {!isUser && (
                    <div className="space-y-3">
                      
                      {/* Primary Korean Dialogue */}
                      <div className="space-y-2">
                        <p className="text-base sm:text-lg text-[#1A1A1A] leading-snug">
                          {(msg.korean || msg.content || '')
                            .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
                            .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
                            .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
                            .trim()}
                        </p>

                        {/* Discrete Toggle Chips Bar */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          
                          {/* Audio TTS */}
                          <button
                            type="button"
                            onClick={() => {
                              const cleanAudioText = (msg.korean || msg.content || '')
                                .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
                                .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
                                .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
                                .trim();
                              playAudio(cleanAudioText, msg.id);
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 transition-all ${
                              speakingMsgId === msg.id 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold' 
                                : 'bg-stone-100 hover:bg-stone-200 text-[#4A4540]'
                            }`}
                            title="Read out"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? 'animate-pulse text-amber-700' : 'text-[#71675E]'}`} />
                            <span>{speakingMsgId === msg.id ? 'Reading' : 'Voice'}</span>
                          </button>

                          {/* Bookmark */}
                          <button
                            type="button"
                            onClick={() => onSaveDialogue(msg)}
                            className={`p-1.5 rounded-full transition-all ${
                              isMsgBookmarked
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'text-[#8B7E74] hover:text-[#1A1A1A] hover:bg-stone-100'
                            }`}
                            title="Save sentence"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isMsgBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                          </button>

                          <div className="h-3 w-[1px] bg-[#E0DED7] mx-0.5" />

                          {/* Independent Toggle: Chinese Translation */}
                          {hasZh && (
                            <button
                              type="button"
                              onClick={() => toggleMessageSection(msg.id, 'zh')}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all border ${
                                showZh
                                  ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                                  : 'bg-[#FAF9F6] border-[#E0DED7] text-[#71675E] hover:border-[#8B7E74]'
                              }`}
                            >
                              <span>Translation</span>
                            </button>
                          )}

                          {/* Independent Toggle: English Translation */}
                          {hasEn && languageMode !== 'zh' && (
                            <button
                              type="button"
                              onClick={() => toggleMessageSection(msg.id, 'en')}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all border ${
                                showEn
                                  ? 'bg-sky-100 border-sky-300 text-sky-950 font-bold'
                                  : 'bg-[#FAF9F6] border-[#E0DED7] text-[#71675E] hover:border-[#8B7E74]'
                              }`}
                            >
                              <span>EN</span>
                            </button>
                          )}

                          {/* Independent Toggle: Vocab */}
                          {showLearningUI && hasVocab && (
                            <button
                              type="button"
                              onClick={() => toggleMessageSection(msg.id, 'vocab')}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all border ${
                                showVocab
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                                  : 'bg-[#FAF9F6] border-[#E0DED7] text-[#71675E] hover:border-[#8B7E74]'
                              }`}
                            >
                              <BookOpen className="w-3 h-3 text-amber-700" />
                              <span>Vocab ({msg.vocabulary?.length})</span>
                            </button>
                          )}

                          {/* Independent Toggle: Grammar */}
                          {showLearningUI && hasGrammar && (
                            <button
                              type="button"
                              onClick={() => toggleMessageSection(msg.id, 'grammar')}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all border ${
                                showGrammar
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-[#FAF9F6] border-[#E0DED7] text-[#71675E] hover:border-[#8B7E74]'
                              }`}
                            >
                              <Sliders className="w-3 h-3 text-emerald-700" />
                              <span>Grammar ({msg.grammar_points?.length})</span>
                            </button>
                          )}

                          {/* Independent Toggle: Tip */}
                          {showLearningUI && hasTip && (
                            <button
                              type="button"
                              onClick={() => toggleMessageSection(msg.id, 'tip')}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all border ${
                                showTip
                                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                  : 'bg-[#FAF9F6] border-[#E0DED7] text-[#71675E] hover:border-[#8B7E74]'
                              }`}
                            >
                              <HelpCircle className="w-3 h-3 text-purple-700" />
                              <span>Tips</span>
                            </button>
                          )}

                        </div>
                      </div>

                      {/* Expanded Section: Chinese Translation */}
                      {showZh && msg.translation_zh && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 animate-fadeIn font-sans">
                          <p className="font-normal">{msg.translation_zh}</p>
                        </div>
                      )}

                      {/* Expanded Section: English Translation */}
                      {showEn && msg.translation_en && (
                        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60 text-xs text-sky-950 animate-fadeIn font-sans">
                          <p className="font-normal">{msg.translation_en}</p>
                        </div>
                      )}

                      {/* Expanded Section: Vocabulary Cards */}
                      {showLearningUI && showVocab && msg.vocabulary && (
                        <div className="space-y-2 pt-1 border-t border-[#E0DED7] animate-fadeIn">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#4A4540]">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              <span>Core Vocabulary</span>
                            </span>
                            <button
                              onClick={() => toggleMessageSection(msg.id, 'vocab')}
                              className="text-[10px] text-[#8B7E74] hover:text-[#1A1A1A]"
                            >
                              Collapse
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.vocabulary.map((v, i) => {
                              const isSaved = savedVocabIds.has(v.hangul || v.word);
                              return (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E0DED7] flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#1A1A1A] text-xs">{v.hangul || v.word}</span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-[#4A4540]">
                                        {v.type}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#4A4540] mt-0.5">
                                      {languageMode === 'en' ? v.meaning_en : v.meaning_zh}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => onSaveVocab({
                                      id: `v_${v.hangul}_${Date.now()}`,
                                      word: v.hangul || v.word,
                                      hangul: v.hangul || v.word,
                                      type: v.type,
                                      meaning_zh: v.meaning_zh,
                                      meaning_en: v.meaning_en,
                                      example_kr: v.example,
                                      category: 'Extracted from Chat',
                                      level: 'Daily',
                                      isBookmarked: true,
                                    })}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      isSaved
                                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                                        : 'bg-white border-[#E0DED7] text-[#8B7E74] hover:border-amber-400'
                                    }`}
                                    title="Save to Notebook"
                                  >
                                    <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-600' : ''}`} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Expanded Section: Grammar Cards */}
                      {showLearningUI && showGrammar && msg.grammar_points && (
                        <div className="space-y-2 pt-1 border-t border-[#E0DED7] animate-fadeIn">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#4A4540]">
                            <span className="flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Grammar Analysis</span>
                            </span>
                            <button
                              onClick={() => toggleMessageSection(msg.id, 'grammar')}
                              className="text-[10px] text-[#8B7E74] hover:text-[#1A1A1A]"
                            >
                              Collapse
                            </button>
                          </div>
                          {msg.grammar_points.map((g, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                              <span className="text-emerald-950 font-mono">{g.pattern}</span>
                              <p className="font-normal text-emerald-900 text-[11px] mt-0.5">{g.title_zh}</p>
                              <p className="text-[11px] text-stone-700 mt-1">{g.explanation_zh}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded Section: Learning Tip */}
                      {showLearningUI && showTip && msg.learning_tip && (
                        <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-950 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px]">💡 Context Tips</span>
                            <button
                              onClick={() => toggleMessageSection(msg.id, 'tip')}
                              className="text-[10px] text-[#8B7E74] hover:text-[#1A1A1A]"
                            >
                              Collapse
                            </button>
                          </div>
                          <p className="mt-1 text-[11px] text-purple-900">{msg.learning_tip}</p>
                        </div>
                      )}

                    </div>
                  )}

                </div>

                {/* ASSISTANT TIMESTAMP ON RIGHT */}
                {!isUser && (
                  <span className="text-[10px] text-[#8B7E74] font-sans mt-1 px-1 select-none">
                    {formatKktTime(msg.timestamp)}
                  </span>
                )}

              </div>

            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#8B7E74] italic px-4 py-2 bg-white/70 backdrop-blur-xs rounded-2xl w-fit border border-[#E0DED7]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. CHAT INPUT BAR */}
      <div className="bg-white text-stone-800 rounded-2xl p-2.5 sm:p-3 mt-2 shadow-xs shrink-0">
        
        {/* Selected Image Preview Thumbnail */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Selected preview" className="w-16 h-16 object-cover rounded-xl border border-[#E0DED7]" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          
          {/* Photo upload trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl hover:bg-stone-100 text-[#71675E] transition-colors shrink-0"
            title="Send Photo"
          >
            <ImageIcon className="w-5 h-5 text-[#8B7E74]" />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder=""
            className="flex-1 px-3 py-2 bg-[#FAF9F6] border border-[#E0DED7] rounded-xl text-xs sm:text-sm text-[#1A1A1A] placeholder-[#9E988F] focus:outline-none focus:border-[#2D2D2D] transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-2.5 sm:px-4 sm:py-2 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>

        </form>
      </div>
    </div>
  );
};
