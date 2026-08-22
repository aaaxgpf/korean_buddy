import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Volume2, 
  Bookmark, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  RotateCcw,
  Sliders,
  BookOpen,
  HelpCircle,
  X,
  MessageSquare,
  MoreVertical,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Companion, ChatMessage, VocabItem, CompanionSparkRecord, UserProfile } from '../types';
import { CompanionAvatar } from './CompanionAvatar';
import { speakKorean, stopSpeaking } from '../utils/audio';
import { directSendGeminiChat } from '../utils/geminiDirect';
import { getTimeAwareGreeting } from '../data/companions';

interface CompanionChatProps {
  theme?: 'default' | 'kkt' | 'wechat';
  onBack?: () => void;
  companion: Companion;
  companions: Companion[];
  onSelectCompanion: (companion: Companion) => void;
  companionMessages?: ChatMessage[];
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onClearChat?: (preservePinned?: boolean) => void;
  onOpenCompanionSelector?: () => void;
  onOpenSparksModal?: () => void;
  currentSpark?: CompanionSparkRecord;
  onIgniteSpark?: () => void;
  languageMode: 'bilingual' | 'zh' | 'en';
  onSaveVocab: (item: VocabItem) => void;
  savedVocabIds: Set<string>;
  onSaveDialogue: (msg: ChatMessage) => void;
  savedDialogueIds: Set<string>;
  onOpenProfile?: () => void;
  userProfile?: UserProfile;
}

// KakaoTalk Date Header: e.g. 2026년 8월 22일 토요일
export function formatKakaoDateHeader(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const daysKo = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayKo = daysKo[date.getDay()];
  return `${year}년 ${month}월 ${day}일 ${dayKo}`;
}

// KakaoTalk Message Time (bottom outer of bubble): e.g. 오후 6:49 / 오전 9:15
export function formatKakaoMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${period} ${displayHour}:${minutes}`;
}

// Show date divider only when crossing days or top of conversation
export function shouldShowDateDivider(currentMsg: ChatMessage, prevMsg?: ChatMessage): boolean {
  if (!prevMsg) return true;
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
  onClearChat,
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
  userProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Independent toggle state per message: { [msgId]: { zh: boolean, en: boolean, vocab: boolean, grammar: boolean, tip: boolean } }
  const [messageExpandedState, setMessageExpandedState] = useState<Record<string, Record<string, boolean>>>({});

  const [chatMode, setChatMode] = useState<'learning' | 'pure'>('learning');
  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
  const [activeContextMenuMsg, setActiveContextMenuMsg] = useState<ChatMessage | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize messages with authentic time-aware welcoming greeting if empty
  useEffect(() => {
    if (!companionMessages || companionMessages.length === 0) {
      const effectiveCallSign = userProfile?.userCallSign || (userProfile?.userNickname && userProfile?.userNickname !== '더비 (THE B)' && userProfile?.userNickname !== '브리즈 (BRIIZE)' && userProfile?.userNickname !== '42 (사이)' ? userProfile?.userNickname : undefined) || companion.userNickname || '너';
      const greeting = getTimeAwareGreeting(companion, effectiveCallSign);

      const initialGreeting: ChatMessage = {
        id: `welcome_${companion.id}_${Date.now()}`,
        role: 'assistant',
        content: greeting.korean,
        korean: greeting.korean,
        translation_zh: greeting.translation_zh,
        translation_en: greeting.translation_en,
        timestamp: Date.now(),
        isRead: true,
        vocabulary: [
          {
            id: `vocab_${companion.id}_intro`,
            level: 'TOPIK 1',
            word: companion.tags?.[1]?.replace('#', '') || '한국어',
            hangul: companion.tags?.[1]?.replace('#', '') || '한국어',
            type: 'Noun',
            meaning_zh: companion.badge || 'Core Vocabulary',
            meaning_en: companion.persona_tag || 'Key word',
            example_kr: greeting.korean,
            example_zh: greeting.translation_zh,
          }
        ],
        grammar_points: [
          {
            pattern: '-(으)ㄹ까(요)?',
            title_zh: '提议句型 / 征求意见',
            title_en: 'Casual proposal / Suggestion',
            explanation_zh: '表示向对方提出建议或征求意见。',
            explanation_en: 'Used to casually suggest doing something together.',
          }
        ],
        learning_tip: `💡 ${companion.name_zh || companion.name_ko}의 실시간 맞춤 1:1 대화방입니다.`,
      };
      onUpdateMessages(() => [initialGreeting]);
    }
  }, [companion.id, userProfile]);

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
    } catch (err) {
      console.warn('Failed to parse api config from localStorage', err);
    }

    const effectiveUserName = userProfile?.userName || userProfile?.name || 'Student';
    const effectiveCallSign = userProfile?.userCallSign || companion.userNickname || '너';

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

      // Sliding window context memory: take up to recent 10 messages
      const contextMessages = messages.slice(-10);

      // Assemble permanent pinned core memories
      const pinnedMemories = [...messages, userMessage]
        .filter(m => m.isPinned || m.isMemory)
        .map(m => m.role === 'user' ? `User: ${m.content}` : `${companion.name_kr || companion.name_ko || 'Idol'}: ${m.korean || m.content}`)
        .filter(Boolean);

      if (apiConfig?.provider === 'gemini' && apiConfig?.apiKey?.trim()) {
        try {
          data = await directSendGeminiChat({
            apiKey: apiConfig.apiKey,
            model: apiConfig.model,
            baseURL: apiConfig.baseURL,
            character: companion,
            messages: [...contextMessages, userMessage],
            pinnedMemories,
            userName: effectiveUserName,
            userCallSign: effectiveCallSign,
            userNickname: companion.userNickname,
            languageMode,
            imageBase64: imagePayload || undefined,
            imageMime: undefined,
            clientTemporal
          });
        } catch (directErr: any) {
          console.warn('Direct Gemini call failed, falling back to /api/chat proxy:', directErr?.message || directErr);
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character: companion,
              messages: [...contextMessages, userMessage],
              pinnedMemories,
              userName: effectiveUserName,
              userCallSign: effectiveCallSign,
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
        }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: companion,
            messages: [...contextMessages, userMessage],
            pinnedMemories,
            userName: effectiveUserName,
            userCallSign: effectiveCallSign,
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

  // Re-generate response
  const handleRegenerateMessage = async (targetMsgId?: string) => {
    if (isLoading || messages.length === 0) return;

    // Find the message index to replace
    let targetIndex = -1;
    if (targetMsgId) {
      targetIndex = messages.findIndex(m => m.id === targetMsgId);
    } else {
      // Find the last assistant message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) return;

    // Messages history up to before this target assistant message
    const historyBefore = messages.slice(0, targetIndex);
    if (historyBefore.length === 0) return;

    setIsLoading(true);

    const clientTemporal = getClientTemporalContext();
    const effectiveUserName = userProfile?.userName || userProfile?.name || 'Student';
    const effectiveCallSign = userProfile?.userCallSign || companion.userNickname || '너';

    let apiConfig = undefined;
    try {
      const savedConfig = localStorage.getItem('korean_buddy_api_config');
      if (savedConfig) {
        apiConfig = JSON.parse(savedConfig);
      }
    } catch (err) {
      console.warn('Failed to parse api config from localStorage', err);
    }

    try {
      let data: any;

      // Assemble permanent pinned core memories
      const pinnedMemories = historyBefore
        .filter(m => m.isPinned || m.isMemory)
        .map(m => m.role === 'user' ? `User: ${m.content}` : `${companion.name_kr || companion.name_ko || 'Idol'}: ${m.korean || m.content}`)
        .filter(Boolean);

      if (apiConfig?.provider === 'gemini' && apiConfig?.apiKey?.trim()) {
        try {
          data = await directSendGeminiChat({
            apiKey: apiConfig.apiKey,
            model: apiConfig.model,
            baseURL: apiConfig.baseURL,
            character: companion,
            messages: historyBefore.slice(-10),
            pinnedMemories,
            userName: effectiveUserName,
            userCallSign: effectiveCallSign,
            userNickname: companion.userNickname,
            languageMode,
            clientTemporal
          });
        } catch (directErr: any) {
          console.warn('Direct Gemini call failed during regenerate, falling back to /api/chat:', directErr?.message || directErr);
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character: companion,
              messages: historyBefore.slice(-10),
              pinnedMemories,
              userName: effectiveUserName,
              userCallSign: effectiveCallSign,
              userNickname: companion.userNickname,
              languageMode,
              clientTemporal,
              apiConfig,
            }),
          });
          data = await res.json();
        }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: companion,
            messages: historyBefore.slice(-10),
            pinnedMemories,
            userName: effectiveUserName,
            userCallSign: effectiveCallSign,
            userNickname: companion.userNickname,
            languageMode,
            clientTemporal,
            apiConfig,
          }),
        });

        data = await res.json();
      }

      const rawKr = data.korean_text || data.korean || data.content || '';
      const pureKorean = rawKr
        .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
        .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
        .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
        .trim();

      const newAssistantMessage: ChatMessage = {
        id: `idol_${companion.id}_${Date.now()}`,
        role: 'assistant',
        content: pureKorean || '응, 다시 말해줄게~',
        korean: pureKorean || '응, 다시 말해줄게~',
        translation_zh: data.translation_text || data.translation_zh || '',
        translation_en: data.translation_en,
        vocabulary: data.vocabulary,
        grammar_points: data.grammar_points,
        learning_tip: data.learning_tip,
        timestamp: Date.now(),
        isRead: true,
      };

      onUpdateMessages((prev) => {
        const updated = [...prev];
        updated[targetIndex] = newAssistantMessage;
        return updated;
      });
    } catch (err: any) {
      console.error('Regenerate error:', err);
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
    speakKorean(text, companion.voice_slot || 'ko-KR-Standard-C', companion.tts_rate || 1.0, () => {
      setSpeakingMsgId(null);
    });
  };

  const toggleMessageSection = (msgId: string, section: string) => {
    setMessageExpandedState((prev) => {
      const msgState = prev[msgId] || {};
      return {
        ...prev,
        [msgId]: {
          ...msgState,
          [section]: !msgState[section],
        },
      };
    });
  };

  const isSectionVisible = (msgId: string, section: string) => {
    return !!messageExpandedState[msgId]?.[section];
  };

  const handleTouchStart = (msgId: string) => {
    setLongPressedMsgId(msgId);
  };

  const handleTouchEnd = () => {
    setLongPressedMsgId(null);
  };

  const handleMsgPointerDown = (msg: ChatMessage) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveContextMenuMsg(msg);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 450);
  };

  const handleMsgPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTogglePinMemory = (msgId: string) => {
    let isNowPinned = false;
    onUpdateMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          isNowPinned = !m.isPinned;
          return { ...m, isPinned: !m.isPinned, isMemory: !m.isPinned };
        }
        return m;
      })
    );
    setToastText(isNowPinned ? '已设为核心记忆' : '已取消核心记忆');
    setTimeout(() => setToastText(null), 1800);
  };

  const lastAssistantMsgId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].id;
      }
    }
    return null;
  })();

  const userAvatarSrc = userProfile?.avatarUrl || localStorage.getItem('user_profile_avatar') || '';

  return (
    <div className={`flex flex-col h-full w-full max-w-3xl mx-auto relative overflow-hidden ${theme === 'kkt' ? 'bg-[#b2c7d9] shadow-lg border-x border-[#9bbbd4]' : 'bg-transparent'}`}>
      
      {/* TOP HEADER */}
      <div className={`${theme === 'kkt' ? 'bg-[#b2c7d9]/95 border-b border-[#9bbbd4]' : 'bg-white/90 border-b border-stone-200/60'} backdrop-blur-md px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between z-10 shrink-0`}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1.5 -ml-1.5 text-stone-700 hover:bg-black/5 rounded-full transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <CompanionAvatar
            companion={companion}
            sizeClassName="w-9 h-9 sm:w-10 sm:h-10"
            alt={companion.name_ko || companion.name_kr}
            className="border border-stone-200/80 shadow-xs flex-shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="font-semibold text-stone-900 text-[15px] sm:text-[17px] leading-tight truncate">
              {companion.name_ko || companion.name_kr || companion.remark || '대화'}
            </h2>
            <span className="text-[11px] sm:text-xs text-stone-500 font-normal tracking-normal truncate mt-0.5">
              {companion.status_msg || '온라인'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 relative">
          <button
            onClick={() => setChatMode(chatMode === 'learning' ? 'pure' : 'learning')}
            className={`p-2 rounded-full transition-colors flex items-center gap-1 ${chatMode === 'learning' ? 'text-amber-700 bg-amber-50/80' : 'text-stone-400 hover:bg-stone-100'}`}
            title={chatMode === 'learning' ? "Learning Mode (Click for Pure Chat)" : "Pure Chat Mode (Click for Learning Mode)"}
          >
            {chatMode === 'learning' ? <BookOpen size={17} /> : <MessageSquare size={17} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              title="More Actions"
            >
              <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-lg border border-stone-200/80 py-1.5 z-40 text-xs text-stone-700 divide-y divide-stone-100">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 cursor-pointer"
                  >
                    <Sliders size={14} className="text-stone-400" />
                    <span>设置与角色详情</span>
                  </button>
                  {onClearChat && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowClearConfirm(true);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={14} className="text-rose-500" />
                      <span>清空聊天记录</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl border border-stone-200/80 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm mb-1">
              清空当前聊天记录？
            </h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              将清空与当前角色的聊天记录。生词本与收藏的句子将被妥善保留。
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearChat?.(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400 stroke-[1.5]" />
                <span>仅清空普通对话 (保留核心记忆)</span>
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearChat?.(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={13} className="text-rose-600" />
                <span>全部重置 (包含核心记忆)</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MESSAGES SCROLL CONTAINER */}
      <div 
        className={`flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 ${theme === 'kkt' ? 'bg-[#b2c7d9]' : theme === 'wechat' ? 'bg-[#EDEDED]' : 'rounded-2xl sm:rounded-3xl bg-slate-100/60'}`}
      >

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isMsgBookmarked = savedDialogueIds.has(msg.id) || msg.isBookmarked;

          const prevMsg = index > 0 ? messages[index - 1] : undefined;
          const showDateDivider = shouldShowDateDivider(msg, prevMsg);

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

          const isLastAssistant = msg.id === lastAssistantMsgId;

          return (
            <React.Fragment key={msg.id}>
              {/* Native KakaoTalk centered date header */}
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] text-stone-500 bg-stone-200/70 px-3.5 py-1 rounded-full select-none font-medium backdrop-blur-xs">
                    {formatKakaoDateHeader(msg.timestamp)}
                  </span>
                </div>
              )}

              <div
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-1.5 sm:gap-2 max-w-full group`}
                onPointerDown={() => { handleTouchStart(msg.id); handleMsgPointerDown(msg); }}
                onPointerUp={() => { handleTouchEnd(); handleMsgPointerUp(); }}
                onPointerLeave={() => { handleTouchEnd(); handleMsgPointerUp(); }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveContextMenuMsg(msg);
                }}
              >
                {/* COMPANION AVATAR ON LEFT */}
                {!isUser && (
                  <div className="shrink-0 self-start mt-0.5">
                    <CompanionAvatar
                      companion={companion}
                      sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
                      alt={companion.name_zh}
                      className="border border-stone-200/70 shadow-2xs"
                    />
                  </div>
                )}

                {/* USER MESSAGE WRAPPER (Timestamp on outer left) */}
                {isUser && (
                  <div className="flex items-end gap-1.5 max-w-[85%] md:max-w-[70%]">
                    {/* Timestamp at bottom outer left of bubble */}
                    <span className="text-[10px] text-stone-400 font-sans select-none shrink-0 self-end pb-0.5">
                      {formatKakaoMessageTime(msg.timestamp)}
                    </span>

                    {/* USER SPEECH BUBBLE */}
                    <div
                      className={`relative px-3.5 py-2 sm:px-3.5 sm:py-2 transition-all ${
                        theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-2xs font-sans' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-md' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-2xs'
                      }`}
                    >
                      {/* Pinned Core Memory Indicator */}
                      {(msg.isPinned || msg.isMemory) && (
                        <span 
                          className="absolute top-1.5 right-1.5 flex items-center justify-center pointer-events-none" 
                          title="核心记忆 (Permanent Key Memory)"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-slate-400 opacity-60 stroke-[1.5]" />
                        </span>
                      )}
                      <div className="space-y-2">
                        {msg.image && (
                          <div className="rounded-xl overflow-hidden max-w-[220px] max-h-[220px] bg-white">
                            <img src={msg.image} alt="Attached" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {msg.videoLink && (
                          <div className="p-2.5 rounded-xl bg-black/5 flex items-center gap-2.5 max-w-sm">
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
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPANION MESSAGE WRAPPER (Timestamp on outer right) */}
                {!isUser && (
                  <div className="flex flex-col items-start max-w-[85%] md:max-w-[70%]">
                    
                    {/* Companion Name Label (Strict Pure Korean Name) */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-xs font-medium text-stone-600 font-sans">
                      <span>{companion.name_ko || companion.name_kr || companion.remark || '친구'}</span>
                    </div>

                    <div className="flex items-end gap-1.5">
                      {/* IDOL SPEECH BUBBLE */}
                      <div
                        className={`relative p-3 sm:p-3.5 transition-all ${
                          theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-md shadow-xs' : 'bg-white text-stone-900 rounded-2xl rounded-tl-sm shadow-xs'
                        }`}
                      >
                        {/* Pinned Core Memory Indicator */}
                        {(msg.isPinned || msg.isMemory) && (
                          <span 
                            className="absolute top-1.5 right-1.5 flex items-center justify-center pointer-events-none" 
                            title="核心记忆 (Permanent Key Memory)"
                          >
                            <Bookmark className="w-3.5 h-3.5 text-slate-400 opacity-60 stroke-[1.5]" />
                          </span>
                        )}
                        <div className="space-y-2.5">
                          
                          {/* Primary Korean Dialogue */}
                          <div className="space-y-1.5">
                            <p className="text-sm sm:text-[15px] text-stone-900 leading-relaxed font-normal">
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
                                    ? 'bg-amber-100 text-amber-900 font-semibold' 
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                                }`}
                                title="Voice Readout"
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? 'animate-pulse text-amber-700' : 'text-stone-500'}`} />
                                <span>{speakingMsgId === msg.id ? 'Reading' : 'Voice'}</span>
                              </button>

                              {/* Regenerate Button */}
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleRegenerateMessage(msg.id)}
                                className={`p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all ${isLoading && isLastAssistant ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="重新生成回复 (Regenerate Reply)"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${isLoading && isLastAssistant ? 'animate-spin text-amber-600' : ''}`} />
                              </button>

                              {/* Bookmark */}
                              <button
                                type="button"
                                onClick={() => onSaveDialogue(msg)}
                                className={`p-1.5 rounded-full transition-all ${
                                  isMsgBookmarked
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                }`}
                                title="Save sentence"
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isMsgBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                              </button>

                              {/* Core Memory Pin quick toggle */}
                              <button
                                type="button"
                                onClick={() => handleTogglePinMemory(msg.id)}
                                className={`p-1.5 rounded-full transition-all ${
                                  msg.isPinned || msg.isMemory
                                    ? 'bg-amber-50 text-amber-900'
                                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                }`}
                                title={msg.isPinned || msg.isMemory ? "取消核心记忆" : "记住这条 / 设为核心记忆"}
                              >
                                <Bookmark className={`w-3.5 h-3.5 stroke-[1.5] ${msg.isPinned || msg.isMemory ? 'text-amber-700 fill-amber-500/20' : 'text-slate-400 opacity-60'}`} />
                              </button>

                              <div className="h-3 w-[1px] bg-stone-200 mx-0.5" />

                              {/* Independent Toggle: Chinese Translation */}
                              {hasZh && (
                                <button
                                  type="button"
                                  onClick={() => toggleMessageSection(msg.id, 'zh')}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all ${
                                    showZh
                                      ? 'bg-amber-100 text-amber-950 font-bold'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all ${
                                    showEn
                                      ? 'bg-sky-100 text-sky-950 font-bold'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all ${
                                    showVocab
                                      ? 'bg-amber-50 text-amber-900 font-bold'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all ${
                                    showGrammar
                                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans flex items-center gap-1 transition-all ${
                                    showTip
                                      ? 'bg-purple-50 text-purple-900 font-bold'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                            <div className="p-2.5 rounded-xl bg-amber-50/70 text-xs text-amber-950 animate-fadeIn font-sans">
                              <p className="font-normal">{msg.translation_zh}</p>
                            </div>
                          )}

                          {/* Expanded Section: English Translation */}
                          {showEn && msg.translation_en && (
                            <div className="p-2.5 rounded-xl bg-sky-50/70 text-xs text-sky-950 animate-fadeIn font-sans">
                              <p className="font-normal">{msg.translation_en}</p>
                            </div>
                          )}

                          {/* Expanded Section: Vocabulary Cards */}
                          {showLearningUI && showVocab && msg.vocabulary && (
                            <div className="space-y-2 pt-1 border-t border-stone-100 animate-fadeIn">
                              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Core Vocabulary</span>
                                </span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'vocab')}
                                  className="text-[10px] text-stone-400 hover:text-stone-800"
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
                                      className="p-2.5 rounded-xl bg-stone-50/80 flex items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-stone-900 font-medium text-xs">{v.hangul || v.word}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-600">
                                            {v.type}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-stone-600 mt-0.5">
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
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          isSaved
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-white text-stone-400 hover:text-stone-800'
                                        }`}
                                        title="Save to Notebook"
                                      >
                                        <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-600 text-amber-600' : ''}`} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Expanded Section: Grammar Cards */}
                          {showLearningUI && showGrammar && msg.grammar_points && (
                            <div className="space-y-2 pt-1 border-t border-stone-100 animate-fadeIn">
                              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                                <span className="flex items-center gap-1">
                                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Grammar Analysis</span>
                                </span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'grammar')}
                                  className="text-[10px] text-stone-400 hover:text-stone-800"
                                >
                                  Collapse
                                </button>
                              </div>
                              {msg.grammar_points.map((g, i) => (
                                <div key={i} className="p-2.5 rounded-xl bg-emerald-50/60 text-xs">
                                  <span className="text-emerald-950 font-mono font-medium">{g.pattern}</span>
                                  <p className="font-normal text-emerald-900 text-[11px] mt-0.5">{g.title_zh}</p>
                                  <p className="text-[11px] text-stone-600 mt-1">{g.explanation_zh}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Expanded Section: Learning Tip */}
                          {showLearningUI && showTip && msg.learning_tip && (
                            <div className="p-2.5 rounded-xl bg-purple-50/70 text-xs text-purple-950 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px]">💡 Context Tips</span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'tip')}
                                  className="text-[10px] text-stone-400 hover:text-stone-800"
                                >
                                  Collapse
                                </button>
                              </div>
                              <p className="mt-1 text-[11px] text-purple-900">{msg.learning_tip}</p>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Timestamp at bottom outer right of bubble */}
                      <span className="text-[10px] text-stone-400 font-sans select-none shrink-0 self-end pb-0.5">
                        {formatKakaoMessageTime(msg.timestamp)}
                      </span>
                    </div>

                  </div>
                )}

                {/* USER AVATAR ON RIGHT */}
                {isUser && (
                  <div className="shrink-0 self-start mt-0.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center font-medium text-xs shadow-2xs overflow-hidden border border-stone-200">
                      {userAvatarSrc ? (
                        <img
                          src={userAvatarSrc}
                          alt={userProfile?.userName || userProfile?.name || 'User'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span>{(userProfile?.avatar || userProfile?.userName || userProfile?.name || 'ME').slice(0, 2)}</span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </React.Fragment>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 italic px-4 py-2 bg-white/80 backdrop-blur-xs rounded-2xl w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>답장 작성 중...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CHAT INPUT BAR */}
      <div className="bg-white/95 backdrop-blur-md text-stone-800 rounded-2xl p-2 sm:p-2.5 mt-2 shadow-xs shrink-0 border-0">
        
        {/* Selected Image Preview Thumbnail */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Selected preview" className="w-16 h-16 object-cover rounded-xl border border-stone-200" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
          
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
            className="p-2 sm:p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors shrink-0"
            title="Send Photo"
          >
            <ImageIcon className="w-5 h-5 text-stone-500" />
          </button>

          {/* Text Input Field - iOS Clean Style with no placeholder and no black focus rings */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder=""
            className="flex-1 px-3.5 py-2.5 bg-slate-100/80 border-0 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-2.5 sm:px-4 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">发送</span>
          </button>

        </form>
      </div>

      {/* Long Press / Context Menu Modal */}
      {activeContextMenuMsg && (
        <div 
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveContextMenuMsg(null)}
        >
          <div 
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/80 p-2 max-w-xs w-full divide-y divide-stone-100/90 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Message Preview Header */}
            <div className="px-3 py-2 text-xs text-stone-500 line-clamp-2 italic font-sans">
              "{activeContextMenuMsg.role === 'user' ? activeContextMenuMsg.content : (activeContextMenuMsg.korean || activeContextMenuMsg.content)}"
            </div>

            <div className="pt-1.5 space-y-0.5">
              {/* Pin to Memory Toggle */}
              <button
                onClick={() => {
                  handleTogglePinMemory(activeContextMenuMsg.id);
                  setActiveContextMenuMsg(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-800 font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400 stroke-[1.5]" />
                <span>{activeContextMenuMsg.isPinned || activeContextMenuMsg.isMemory ? '取消核心记忆' : '记住这条 / 设为核心记忆'}</span>
              </button>

              {/* Copy Message Text */}
              <button
                onClick={() => {
                  const textToCopy = activeContextMenuMsg.role === 'user' 
                    ? activeContextMenuMsg.content 
                    : (activeContextMenuMsg.korean || activeContextMenuMsg.content || '');
                  navigator.clipboard?.writeText(textToCopy);
                  setToastText('已复制文本');
                  setTimeout(() => setToastText(null), 1800);
                  setActiveContextMenuMsg(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400 stroke-[1.5]" />
                <span>复制内容</span>
              </button>

              {/* Bookmark Sentence (if Assistant message) */}
              {activeContextMenuMsg.role === 'assistant' && (
                <button
                  onClick={() => {
                    onSaveDialogue(activeContextMenuMsg);
                    setActiveContextMenuMsg(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500/80 stroke-[1.5]" />
                  <span>{savedDialogueIds.has(activeContextMenuMsg.id) ? '已收藏句子' : '收藏到句库'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Micro Toast */}
      {toastText && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-none backdrop-blur-xs font-sans">
          {toastText}
        </div>
      )}
    </div>
  );
};
