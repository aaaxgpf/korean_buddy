import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Check,
  Languages,
  Lightbulb,
  Undo2,
  Edit3,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Companion, ChatMessage, VocabItem, CompanionSparkRecord, UserProfile } from '../types';
import { CompanionAvatar } from './CompanionAvatar';
import { speakKorean, stopSpeaking } from '../utils/audio';
import { directSendChat } from '../utils/geminiDirect';
import { getTimeAwareGreeting } from '../data/companions';
import { notifyToast, formatApiErrorMessage } from '../utils/toast';

interface CompanionChatProps {
  theme?: 'default' | 'kkt' | 'wechat';
  onBack?: () => void;
  companion: Companion;
  companions: Companion[];
  onSelectCompanion: (companion: Companion) => void;
  companionMessages?: ChatMessage[];
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onMarkAsRead?: (companionId: string) => void;
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
  onMarkAsRead,
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
  const [regeneratingMsgId, setRegeneratingMsgId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speakingVocabKey, setSpeakingVocabKey] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Independent toggle state per message: { [msgId]: { zh: boolean, en: boolean, vocab: boolean, grammar: boolean, tip: boolean } }
  const [messageExpandedState, setMessageExpandedState] = useState<Record<string, Record<string, boolean>>>({});
  const [translatingMsgIds, setTranslatingMsgIds] = useState<Record<string, boolean>>({});

  const [chatMode, setChatMode] = useState<'learning' | 'pure'>('learning');
  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
  const [activeContextMenuMsg, setActiveContextMenuMsg] = useState<ChatMessage | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unsatisfactory Response Recall Modal State
  const [unsatisfactoryModalMsg, setUnsatisfactoryModalMsg] = useState<ChatMessage | null>(null);
  const [selectedToneHint, setSelectedToneHint] = useState<string>('');
  const [customFeedbackText, setCustomFeedbackText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Mark messages as read when opening or staying in this chat conversation
  useEffect(() => {
    // 1. Trigger unreadMap clear callback
    if (onMarkAsRead) {
      onMarkAsRead(companion.id);
    }
    
    // 2. Mark any unread incoming messages in the local list as isRead: true
    if (companionMessages && companionMessages.some(m => m.isRead === false)) {
      const timer = setTimeout(() => {
        onUpdateMessages(prev => {
          if (!prev.some(m => m.isRead === false)) return prev;
          return prev.map(m => m.isRead === false ? { ...m, isRead: true } : m);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [companion.id, companionMessages?.length, onMarkAsRead]);

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

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // 切换好友或刚打开应用时，无需平滑滚动，直接瞬时定位到最新一条
  useEffect(() => {
    // 立即执行一次
    scrollToBottom('auto');
    // 50ms 与 150ms 延迟双重保险（防止图片/字体异步撑开高度后位置上浮）
    const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
    const timer2 = setTimeout(() => scrollToBottom('auto'), 150);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [companion.id]);

  // 用户发送/收到新消息时平滑触底
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Smooth scroll when loading
  useEffect(() => {
    if (isLoading) {
      scrollToBottom('smooth');
    }
  }, [isLoading]);

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

  // Auto-translate / fix message Chinese translation on-demand if it lacks Chinese characters
  const fetchMessageTranslationIfNeeded = async (msg: ChatMessage) => {
    if (msg.translation_zh && /[\u4e00-\u9fa5]/.test(msg.translation_zh)) {
      return;
    }
    const textToTranslate = msg.korean || msg.content;
    if (!textToTranslate) return;

    setTranslatingMsgIds(prev => ({ ...prev, [msg.id]: true }));
    try {
      let apiConfig = undefined;
      try {
        const savedConfig = localStorage.getItem('korean_buddy_api_config');
        if (savedConfig) apiConfig = JSON.parse(savedConfig);
      } catch (_) {}

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, targetLang: 'zh', apiConfig })
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData?.translation && /[\u4e00-\u9fa5]/.test(resData.translation)) {
          onUpdateMessages(prev => prev.map(m => m.id === msg.id ? { ...m, translation_zh: resData.translation } : m));
        }
      }
    } catch (err) {
      console.warn('On-demand translation failed', err);
    } finally {
      setTranslatingMsgIds(prev => ({ ...prev, [msg.id]: false }));
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

      // 1. Primary architecture: Secure Server-side API Proxy (/api/chat)
      // Keeps keys hidden, avoids browser CORS/header blocks, and proxies all LLM / Gemini requests
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
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

        if (res.ok) {
          data = await res.json();
        } else {
          const errData = await res.json().catch(() => ({}));
          // If server returns error, check if client has custom key to try direct
          if (apiConfig?.apiKey?.trim()) {
            data = await directSendChat({
              provider: apiConfig.provider,
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
          } else {
            throw new Error(errData.message || errData.error || `Server responded with ${res.status}`);
          }
        }
      } catch (proxyErr: any) {
        console.warn('Backend proxy chat failed or timed out, trying fallback:', proxyErr);
        if (apiConfig?.apiKey?.trim()) {
          try {
            data = await directSendChat({
              provider: apiConfig.provider,
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
          } catch (directErr) {
            console.warn('Direct send failed as well:', directErr);
          }
        }
        
        if (!data) {
          // Fallback response tailored to user query and companion character with Korean machine translation style
          const charName = companion.name_ko || companion.name_kr || '선우';
          const charId = companion.id || 'sunwoo';
          const isSick = /吐|难受|累|痛|困|病|아프|힘들|피곤/.test(userText);
          const isQuestion = /\?|？|뭐해|어디|누구|왜|干嘛|在哪|是谁|为什么/.test(userText);

          let matchedKr = '';
          let matchedZh = '';
          let matchedVocab = [
            { word: '생각하다', hangul: '생각하다', type: '동사', meaning_zh: '想，思考', meaning_en: 'to think' },
            { word: '집중하다', hangul: '집중하다', type: '동사', meaning_zh: '集中，专注', meaning_en: 'to focus' }
          ];

          if (isSick) {
            matchedKr = `어? 몸 많이 안 좋아?\n생각해보니까 요즘 무리했던 건 아닌지 걱정되네.\n무리해서 답장하지 말고 따뜻한 물 마시고 푹 쉬어.`;
            matchedZh = `哦？身体很不舒服吗？\n想到最近你是不是太勉强自己了，所以很担心呢。\n不要勉强回复我，去喝点温水好好休息吧。`;
            matchedVocab = [
              { word: '무리하다', hangul: '무리하다', type: '동사', meaning_zh: '勉强，过度', meaning_en: 'to overdo' },
              { word: '걱정되다', hangul: '걱정되다', type: '동사', meaning_zh: '担心，挂念', meaning_en: 'to be worried' }
            ];
          } else if (isQuestion) {
            if (charId === 'sunwoo') {
              matchedKr = `응? 왜 물어봐 ㅋㅋ\n나 방금 연습 끝나고 쉬는 길에 알림 떠서 확인했지.\n너는 오늘 뭐 하고 있었어?`;
              matchedZh = `嗯？为什么突然问这个 哈哈\n我刚才结束练习在休息的路上，因为弹了通知所以顺手查看了。\n你今天都在做什么呢？`;
            } else {
              matchedKr = `응? 메시지 잘 받았어!\n방금 일정 마치고 쉬는 중이었는데 네 생각나서 답장해.\n오늘 하루는 어땠어?`;
              matchedZh = `嗯？好好收到你的消息了！\n刚才结束日程正在休息中，因为想到了你所以回复了消息。\n你今天一天过得怎么样？`;
            }
          } else {
            if (charId === 'sunwoo') {
              matchedKr = `뭐래 진짜 ㅋㅋㅋ 억울하게 사람 몰아가네.\n너는 오늘 뭐 하고 있었는데?`;
              matchedZh = `说什么呢真是 哈哈 冤枉起人来一套一套的。\n你今天都在做什么呢？`;
            } else if (charId === 'younghoon') {
              matchedKr = `응? ㅋㅋㅋ 갑자기 그렇게 말하니까 귀엽네.\n오늘 하루도 고생 많았어.\n맛있는 거 챙겨 먹고 기분 좋게 하루 보내!`;
              matchedZh = `嗯？哈哈 突然这么说话真可爱呢。\n今天一天也辛苦啦。\n一定要吃点好吃的，心情愉快地度过这一天哦！`;
            } else {
              matchedKr = `메시지 잘 확인했어!\n오늘도 너무 무리하지 말고 기분 좋은 하루 보냈으면 좋겠다.\n이따 또 연락할게!`;
              matchedZh = `好好查看你的消息了！\n今天也希望不要太勉强自己，能够度过心情愉快的一天。\n等下再联系你哦！`;
            }
          }

          data = {
            korean_text: matchedKr,
            korean: matchedKr,
            translation_zh: matchedZh,
            translation_text: matchedZh,
            vocabulary: matchedVocab,
            grammar_points: [
              { pattern: '-(으)니까', title_zh: '表示原因/理由', explanation_zh: '连接词尾，表示因为前句的事实或状态，从而导致后句的结果。' }
            ],
            learning_tip: `${charName} 的专属小贴士：多用 -(으)니까 和 -아/어서 来表达生活中的因果感受，会让韩语表达更生动自然！`
          };
        }
      }

      const behavior = companion.reply_behavior || 'instant';
      
      // Check if there were already unread pending user messages in the chat history
      const hasPriorUnreadUserMsg = messages.some(m => m.role === 'user' && m.isRead === false);

      // Handle 'unread_busy' (未读未回 / 繁忙状态 - 带防长久失联保护机制)
      if (behavior === 'unread_busy') {
        const busyProb = companion.unread_busy_prob ?? 0.3;
        const isBusyRoll = Math.random() < busyProb;

        // Anti-Infinite-Busy: If already busy on prior turn, force resolution (mark all read + reply)
        if (isBusyRoll && !hasPriorUnreadUserMsg) {
          // Enter busy state: message remains UNREAD (Kakao '1' stays) and idol does not reply this instant
          setIsLoading(false);
          notifyToast({
            type: 'info',
            title: `${companion.remark || companion.name_zh || companion.name_ko} 正在繁忙排练中 ⏳`,
            message: '消息保留未读「1」。再次发送消息或稍后互动时，对方将统一已读并回复！',
            duration: 3500
          });
          return;
        }
      }

      // Step 1: Simulate "Read" status timing (1 unread badge visible with animation, then disappears when read)
      const readDelayMs = behavior === 'random_delay' 
        ? Math.min((companion.read_delay_seconds || 2) * 1000, 4000)
        : (behavior === 'read_no_reply' ? 1200 : (behavior === 'busy_schedule' ? 1800 : (behavior === 'unread_busy' ? 1400 : 1000)));

      await new Promise(r => setTimeout(r, readDelayMs));
      
      // Mark all pending user messages as read (KakaoTalk '1' disappears with smooth exit animation)
      onUpdateMessages((prev) =>
        prev.map((m) => (m.role === 'user' && !m.isRead ? { ...m, isRead: true } : m))
      );

      // Step 2: Check for "Read and No Reply" (已读不回 / 傲娇模式)
      if (behavior === 'read_no_reply') {
        const noReplyProb = companion.no_reply_prob ?? 0.3;
        const roll = Math.random();
        if (roll < noReplyProb) {
          // The companion read the message but does not reply right now (realistic busy/sulk moment)
          setIsLoading(false);
          return;
        }
      }

      // Step 3: Simulate realistic typing / response delay if configured
      if (behavior === 'random_delay') {
        const configuredDelaySec = companion.reply_delay_seconds || 3;
        // add a small jitter ±1s
        const actualDelayMs = Math.max(1000, (configuredDelaySec + (Math.random() * 2 - 1)) * 1000);
        await new Promise(r => setTimeout(r, actualDelayMs));
      } else if (behavior === 'busy_schedule' || behavior === 'unread_busy') {
        // Schedule delay / catch-up delay (around 2-3 seconds)
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
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
        prev.map((m) => (m.role === 'user' && !m.isRead ? { ...m, isRead: true } : m)).concat(assistantMessage)
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err?.message || '无法连接到大模型服务器';
      const isAuthError = errMsg.includes('鉴权') || errMsg.includes('401') || errMsg.includes('API Key') || errMsg.includes('NO_API_KEY') || errMsg.includes('OAuth 2');

      const { title, message } = formatApiErrorMessage(err, '伴学对话');
      notifyToast({
        type: isAuthError ? 'warning' : 'error',
        title,
        message,
        duration: 6000
      });

      const networkErrMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: isAuthError
          ? `⚠️ ${errMsg}`
          : `⚠️ 请求异常：${errMsg}`,
        korean: isAuthError
          ? 'API 키 확인이 필요합니다. 오른쪽 상단 [Settings]에서 키를 확인해 주세요.'
          : '일시적인 연결 오류가 발생했습니다. 다시 시도해 주세요.',
        translation_zh: isAuthError
          ? `⚠️ ${errMsg}。请点击右上角「Settings 设置」检查或更换 API Key。`
          : `⚠️ 请求异常：${errMsg}。请稍后重试或在设置中检查 API 配置。`,
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

  // Re-generate response with optional custom guidance
  const handleRegenerateMessage = async (targetMsgId?: string, customInstruction?: string) => {
    if (isLoading || messages.length === 0) return;

    // Stop audio if playing
    if (speakingMsgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    }

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

    // If custom tone or instruction is provided, incorporate it into the prompt
    let contextMessages = historyBefore.slice(-10);
    if (customInstruction?.trim() && contextMessages.length > 0) {
      const lastUserIdx = contextMessages.map(m => m.role).lastIndexOf('user');
      if (lastUserIdx !== -1) {
        contextMessages = contextMessages.map((m, idx) => 
          idx === lastUserIdx 
            ? { ...m, content: `${m.content} (【重新作答风格要求】：${customInstruction.trim()})` } 
            : m
        );
      }
    }

    setRegeneratingMsgId(messages[targetIndex]?.id || targetMsgId || null);
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

      if (apiConfig?.apiKey?.trim()) {
        try {
          data = await directSendChat({
            provider: apiConfig.provider,
            apiKey: apiConfig.apiKey,
            model: apiConfig.model,
            baseURL: apiConfig.baseURL,
            character: companion,
            messages: contextMessages,
            pinnedMemories,
            userName: effectiveUserName,
            userCallSign: effectiveCallSign,
            userNickname: companion.userNickname,
            languageMode,
            clientTemporal
          });
        } catch (directErr: any) {
          console.warn('Direct regenerate warning, trying backend endpoint as fallback:', directErr);
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character: companion,
              messages: contextMessages,
              pinnedMemories,
              userName: effectiveUserName,
              userCallSign: effectiveCallSign,
              userNickname: companion.userNickname,
              languageMode,
              clientTemporal,
              apiConfig,
            }),
          }).catch(() => null);

          if (res && res.ok) {
            data = await res.json();
          } else {
            throw directErr;
          }
        }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: companion,
            messages: contextMessages,
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
      setRegeneratingMsgId(null);
    }
  };

  const playAudio = (text: string, msgId: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }
    setSpeakingMsgId(msgId);
    setSpeakingVocabKey(null);
    speakKorean(text, {
      gender: companion.gender === 'male' ? 'male' : 'female',
      characterId: companion.id,
      rate: companion.tts_rate || 1.0,
      pitch: 1.0,
      onEnd: () => {
        setSpeakingMsgId(null);
      },
      onError: (err) => {
        console.warn('speakKorean error:', err);
        setSpeakingMsgId(null);
      }
    });
  };

  const playVocabAudio = (word: string, vocabKey: string) => {
    if (speakingVocabKey === vocabKey) {
      stopSpeaking();
      setSpeakingVocabKey(null);
      return;
    }
    setSpeakingVocabKey(vocabKey);
    setSpeakingMsgId(null);
    speakKorean(word, {
      gender: companion.gender === 'male' ? 'male' : 'female',
      characterId: companion.id,
      rate: 0.9,
      pitch: 1.0,
      onEnd: () => {
        setSpeakingVocabKey(null);
      },
      onError: (err) => {
        console.warn('speakKorean vocab error:', err);
        setSpeakingVocabKey(null);
      }
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

  // Recall user's own message (with option to return content back to input box for easy editing)
  const handleRecallUserMessage = (msgId: string, returnToInput: boolean = false) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    if (returnToInput) {
      if (targetMsg.content) {
        setInputText(targetMsg.content);
      }
      if (targetMsg.image) {
        setSelectedImage(targetMsg.image);
      }
      // Remove message from chat history
      onUpdateMessages(prev => prev.filter(m => m.id !== msgId));
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
      setToastText('已撤回消息，内容已放回输入框');
    } else {
      onUpdateMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              isRecalled: true,
              recalledAt: Date.now()
            };
          }
          return m;
        })
      );
      setToastText('已撤回一条消息');
    }
    setTimeout(() => setToastText(null), 2000);
  };

  // Retract unsatisfactory assistant response
  const handleRetractUnsatisfactoryResponse = (
    msgId: string, 
    action: 'edit_prompt' | 'regenerate' | 'delete', 
    toneHint?: string
  ) => {
    // Stop audio if speaking this message
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    }

    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    // Find the immediately preceding user message before this assistant response
    let prevUserIndex = -1;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        prevUserIndex = i;
        break;
      }
    }

    if (action === 'edit_prompt') {
      if (prevUserIndex !== -1) {
        const userMsg = messages[prevUserIndex];
        setInputText(userMsg.content || '');
        if (userMsg.image) {
          setSelectedImage(userMsg.image);
        }
        // Remove both the assistant message and the preceding user message so user can rephrase cleanly
        onUpdateMessages(prev => prev.filter((_, idx) => idx !== msgIndex && idx !== prevUserIndex));
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
        setToastText('已撤回不满意回答，上一条提问已填入输入框');
      } else {
        // If no preceding user message found, just remove assistant response
        onUpdateMessages(prev => prev.filter(m => m.id !== msgId));
        setToastText('已撤回该条回答');
      }
      setTimeout(() => setToastText(null), 2200);
    } else if (action === 'regenerate') {
      handleRegenerateMessage(msgId, toneHint);
      setToastText(toneHint ? `已撤回，正在按「${toneHint}」重新作答...` : '已撤回，正在重新作答...');
      setTimeout(() => setToastText(null), 2200);
    } else if (action === 'delete') {
      onUpdateMessages(prev => prev.filter(m => m.id !== msgId));
      setToastText('已撤回并删除此回答');
      setTimeout(() => setToastText(null), 2000);
    }
  };

  const handleRecallMessage = (msgId: string) => {
    handleRecallUserMessage(msgId, false);
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
    <div className={`flex flex-col h-full w-full relative overflow-hidden ${
      theme === 'kkt' 
        ? 'bg-[#b2c7d9] shadow-lg' 
        : theme === 'wechat' 
          ? 'bg-[#EDEDED]' 
          : 'bg-[#f5f5f7] border-l border-stone-200/50'
    }`}>
      
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
        className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 bg-transparent"
      >

        {messages
          .filter((msg) => {
            const hasText = (msg.content && msg.content.trim().length > 0) || (msg.korean && msg.korean.trim().length > 0);
            const hasMedia = !!msg.image || !!msg.videoLink;
            return hasText || hasMedia;
          })
          .map((msg, index) => {
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
          const showLearningUI = chatMode === 'learning';

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

              {/* Recalled Message Display */}
              {msg.isRecalled ? (
                <div className="flex justify-center my-2 select-none">
                  <span className="text-[11px] text-stone-400 bg-stone-100/90 px-3 py-1 rounded-full italic font-sans flex items-center gap-1.5 border border-stone-200/50">
                    <RotateCcw className="w-3 h-3 text-stone-400" />
                    <span>你撤回了一条消息</span>
                  </span>
                </div>
              ) : (
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
                    {/* Timestamp & Unread (1) at bottom outer left of bubble */}
                    <div className="flex flex-col items-end shrink-0 self-end pb-0.5 select-none font-sans">
                      <AnimatePresence>
                        {msg.isRead === false && (
                          <motion.span
                            key={`unread_marker_${msg.id}`}
                            initial={{ scale: 0.3, opacity: 0, y: 3 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.2, opacity: 0, y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
                            className={`text-[11px] font-black leading-none mb-0.5 select-none ${
                              theme === 'kkt'
                                ? 'text-[#F59E0B] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]'
                                : 'text-amber-500 font-bold'
                            }`}
                            title="未读 (1)"
                          >
                            1
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <span className="text-[10px] text-stone-400">
                        {formatKakaoMessageTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* USER SPEECH BUBBLE */}
                    <div
                      className={`relative px-4 py-3 transition-all ${
                        theme === 'kkt'
                          ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-xs shadow-2xs font-sans'
                          : theme === 'wechat'
                            ? 'bg-[#95EC69] text-stone-900 rounded-2xl rounded-tr-xs shadow-2xs'
                            : 'bg-stone-900 text-white rounded-2xl rounded-tr-xs shadow-2xs'
                      }`}
                    >
                      {/* Pinned Core Memory Indicator */}
                      {(msg.isPinned || msg.isMemory) && (
                        <span 
                          className="absolute top-1.5 right-1.5 flex items-center justify-center pointer-events-none" 
                          title="核心记忆 (Permanent Key Memory)"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-stone-400/80 stroke-[1.5]" />
                        </span>
                      )}
                      <div className="space-y-2">
                        {msg.image && (
                          <div className="rounded-xl overflow-hidden max-w-[220px] max-h-[220px] bg-stone-100">
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
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap font-normal">
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
                    <div className="flex items-end gap-1.5">
                      {/* IDOL SPEECH BUBBLE */}
                      <div
                        className={`relative p-3.5 sm:p-4 transition-all ${
                          theme === 'wechat'
                            ? 'bg-white text-stone-900 rounded-2xl rounded-tl-xs shadow-2xs border border-stone-200/50'
                            : 'bg-white text-stone-900 rounded-2xl rounded-tl-xs shadow-2xs border border-black/[0.04]'
                        }`}
                      >
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
                          </div>

                          {/* Discrete Toggle Chips Bar */}
                          <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                              
                              {/* Audio TTS */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanAudioText = (msg.korean || msg.content || '')
                                    .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
                                    .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
                                    .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
                                    .trim();
                                  playAudio(cleanAudioText, msg.id);
                                }}
                                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                                  speakingMsgId === msg.id 
                                    ? 'bg-stone-900 text-white shadow-xs animate-pulse' 
                                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                }`}
                                title="语音朗读 (Voice Readout)"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Retract Unsatisfactory Response Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedToneHint('');
                                  setCustomFeedbackText('');
                                  setUnsatisfactoryModalMsg(msg);
                                }}
                                className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="不满意回答撤回 (Retract & Revise)"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Regenerate Button */}
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegenerateMessage(msg.id);
                                }}
                                className={`p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all ${regeneratingMsgId === msg.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="重新生成回复 (Regenerate)"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${regeneratingMsgId === msg.id ? 'animate-spin text-stone-700' : ''}`} />
                              </button>

                              {/* Bookmark */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSaveDialogue(msg);
                                }}
                                className={`p-1.5 rounded-full transition-all ${
                                  isMsgBookmarked
                                    ? 'bg-stone-800 text-white shadow-xs'
                                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                }`}
                                title="收藏句子 (Save Sentence)"
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isMsgBookmarked ? 'fill-white text-white' : ''}`} />
                              </button>

                              {/* Core Memory Pin quick toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePinMemory(msg.id);
                                }}
                                className={`p-1.5 rounded-full transition-all ${
                                  msg.isPinned || msg.isMemory
                                    ? 'bg-stone-200 text-stone-900 font-medium'
                                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                }`}
                                title={msg.isPinned || msg.isMemory ? "取消核心记忆" : "设为核心记忆 (Set Core Memory)"}
                              >
                                <Bookmark className={`w-3.5 h-3.5 stroke-[1.5] ${msg.isPinned || msg.isMemory ? 'text-stone-800 fill-stone-800/20' : 'text-slate-400 opacity-60'}`} />
                              </button>

                              <div className="h-3 w-[1px] bg-stone-200/60 mx-1 shrink-0" />

                              {/* Translation Switch Icon Button */}
                              {(hasZh || hasEn || msg.korean || msg.content) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isEnMode = languageMode === 'en';
                                    if (isEnMode) {
                                      const isCurrentlyExpanded = isSectionVisible(msg.id, 'en');
                                      setMessageExpandedState((prev) => {
                                        const msgState = prev[msg.id] || {};
                                        return {
                                          ...prev,
                                          [msg.id]: {
                                            ...msgState,
                                            en: !isCurrentlyExpanded,
                                            zh: false,
                                            showCn: false,
                                          },
                                        };
                                      });
                                    } else {
                                      const isCurrentlyExpanded = isSectionVisible(msg.id, 'zh');
                                      if (!isCurrentlyExpanded && (!msg.translation_zh || !/[\u4e00-\u9fa5]/.test(msg.translation_zh))) {
                                        fetchMessageTranslationIfNeeded(msg);
                                      }
                                      setMessageExpandedState((prev) => {
                                        const msgState = prev[msg.id] || {};
                                        return {
                                          ...prev,
                                          [msg.id]: {
                                            ...msgState,
                                            zh: !isCurrentlyExpanded,
                                            en: false,
                                          },
                                        };
                                      });
                                    }
                                  }}
                                  className={`p-1.5 rounded-full transition-all ${
                                    (isSectionVisible(msg.id, 'zh') || isSectionVisible(msg.id, 'en'))
                                      ? 'bg-stone-800 text-white shadow-xs'
                                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                  }`}
                                  title="翻译切换 (Translate Toggle)"
                                >
                                  <Languages className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Lightbulb (Vocab/Grammar/Tip expand toggle) */}
                              {showLearningUI && (hasVocab || hasGrammar || hasTip) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isCurrentlyExpanded = isSectionVisible(msg.id, 'vocab') || isSectionVisible(msg.id, 'grammar') || isSectionVisible(msg.id, 'tip');
                                    setMessageExpandedState((prev) => {
                                      const msgState = prev[msg.id] || {};
                                      return {
                                        ...prev,
                                        [msg.id]: {
                                          ...msgState,
                                          vocab: hasVocab ? !isCurrentlyExpanded : false,
                                          grammar: hasGrammar ? !isCurrentlyExpanded : false,
                                          tip: hasTip ? !isCurrentlyExpanded : false,
                                        },
                                      };
                                    });
                                  }}
                                  className={`p-1.5 rounded-full transition-all ${
                                    (isSectionVisible(msg.id, 'vocab') || isSectionVisible(msg.id, 'grammar') || isSectionVisible(msg.id, 'tip'))
                                      ? 'bg-stone-800 text-white shadow-xs'
                                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                  }`}
                                  title="学习解析 (Learning Analysis)"
                                >
                                  <Lightbulb className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Capsule counts: Vocab */}
                              {showLearningUI && hasVocab && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageSection(msg.id, 'vocab');
                                  }}
                                  className={`p-1.5 rounded-full transition-all ${
                                    showVocab
                                      ? 'bg-stone-800 text-white shadow-xs'
                                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                  }`}
                                  title="单词解析"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Capsule counts: Grammar */}
                              {showLearningUI && hasGrammar && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageSection(msg.id, 'grammar');
                                  }}
                                  className={`p-1.5 rounded-full transition-all ${
                                    showGrammar
                                      ? 'bg-stone-800 text-white shadow-xs'
                                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                  }`}
                                  title="语法解析"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Capsule counts: Tip */}
                              {showLearningUI && hasTip && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageSection(msg.id, 'tip');
                                  }}
                                  className={`p-1.5 rounded-full transition-all ${
                                    showTip
                                      ? 'bg-stone-800 text-white shadow-xs'
                                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                  }`}
                                  title="口语提示"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                            </div>
                          </div>

                          {/* Expanded Section: Chinese Translation */}
                          {showZh && (
                            <div className="border-t border-black/[0.04] mt-2 pt-2 animate-fadeIn font-sans">
                              {translatingMsgIds[msg.id] ? (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 py-0.5">
                                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                                  <span>正在获取泡泡韩式直译...</span>
                                </div>
                              ) : msg.translation_zh && /[\u4e00-\u9fa5]/.test(msg.translation_zh) ? (
                                <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{msg.translation_zh.replace(/\n+/g, ' ').trim()}</p>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-stone-400">暂无中文翻译</p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fetchMessageTranslationIfNeeded(msg);
                                    }}
                                    className="text-xs text-stone-700 font-medium hover:underline cursor-pointer"
                                  >
                                    🔄 转换为中文直译
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expanded Section: English Translation */}
                          {showEn && msg.translation_en && (
                            <div className="border-t border-black/[0.04] mt-2 pt-2 animate-fadeIn font-sans">
                              <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{msg.translation_en}</p>
                              {msg.translation_zh && (
                                <div className="mt-1">
                                  {isSectionVisible(msg.id, 'showCn') ? (
                                    <div className="mt-1 pt-1 border-t border-dashed border-black/[0.02]">
                                      <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{msg.translation_zh.replace(/\n+/g, ' ').trim()}</p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleMessageSection(msg.id, 'showCn');
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors mt-0.5 cursor-pointer"
                                      >
                                        收起中文
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMessageSection(msg.id, 'showCn');
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors mt-0.5 cursor-pointer"
                                    >
                                      展开中文
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expanded Section: Vocabulary Cards */}
                          {showLearningUI && showVocab && msg.vocabulary && (
                            <div className="space-y-2 pt-2 border-t border-black/[0.04] animate-fadeIn font-sans">
                              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                                <span className="flex items-center gap-1.5 text-stone-700">
                                  <BookOpen className="w-3.5 h-3.5 text-stone-600 stroke-[1.5]" />
                                  <span className="font-semibold text-xs tracking-tight">Core Vocabulary</span>
                                </span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'vocab')}
                                  className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
                                >
                                  Collapse
                                </button>
                              </div>
                              <div className="flex flex-col">
                                {msg.vocabulary.map((v, i) => {
                                  const wordText = v.hangul || v.word;
                                  const isSaved = savedVocabIds.has(wordText);
                                  const vocabKey = `${msg.id}_vocab_${i}_${wordText}`;
                                  const isSpeakingThis = speakingVocabKey === vocabKey;

                                  return (
                                    <div
                                      key={i}
                                      className={`py-2.5 flex items-start justify-between gap-3 font-sans ${
                                        i < msg.vocabulary.length - 1 ? 'border-b border-black/[0.04]' : ''
                                      }`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-slate-900 font-medium text-sm">{wordText}</span>
                                          {v.type && (
                                            <span className="text-[11px] text-slate-400 font-light">
                                              · {v.type}
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              playVocabAudio(wordText, vocabKey);
                                            }}
                                            className={`p-1 rounded-full transition-all cursor-pointer inline-flex items-center justify-center ${
                                              isSpeakingThis
                                                ? 'bg-stone-900 text-white shadow-xs animate-pulse'
                                                : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                            }`}
                                            title="发音 (Pronounce)"
                                          >
                                            <Volume2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <p className="text-[13px] text-slate-600 font-normal mt-1 leading-normal">
                                          {languageMode === 'en' ? v.meaning_en : v.meaning_zh}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            playVocabAudio(wordText, vocabKey);
                                          }}
                                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                            isSpeakingThis
                                              ? 'bg-stone-900 text-white shadow-xs'
                                              : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                                          }`}
                                          title="发音 (Pronounce)"
                                        >
                                          <Volume2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onSaveVocab({
                                            id: `v_${v.hangul || v.word}_${Date.now()}`,
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
                                          className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer rounded-lg hover:bg-stone-100"
                                          title="Save to Notebook"
                                        >
                                          <Bookmark className={`w-3.5 h-3.5 transition-colors ${isSaved ? 'fill-slate-700 text-slate-700' : 'text-slate-300 hover:text-slate-600'}`} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Expanded Section: Grammar Cards */}
                          {showLearningUI && showGrammar && msg.grammar_points && (
                            <div className="space-y-2 pt-2 border-t border-black/[0.04] animate-fadeIn font-sans">
                              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pb-0.5">
                                <span className="flex items-center gap-1.5 text-stone-700">
                                  <Sliders className="w-3.5 h-3.5 text-stone-600 stroke-[1.5]" />
                                  <span className="font-semibold text-xs tracking-tight">Grammar Analysis</span>
                                </span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'grammar')}
                                  className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
                                >
                                  Collapse
                                </button>
                              </div>
                              <div className="space-y-2">
                                {msg.grammar_points.map((g, i) => (
                                  <div key={i} className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 text-xs transition-all">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="font-semibold text-stone-900 text-[13px] tracking-tight">{g.pattern}</span>
                                    </div>
                                    <p className="font-medium text-stone-700 text-xs mt-1">{languageMode === 'en' ? (g.title_en || g.title_zh) : g.title_zh}</p>
                                    <p className="text-xs text-stone-500 font-normal mt-1 leading-relaxed">{languageMode === 'en' ? (g.explanation_en || g.explanation_zh) : g.explanation_zh}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expanded Section: Learning Tip */}
                          {showLearningUI && showTip && msg.learning_tip && (
                            <div className="p-3 rounded-xl bg-stone-50/90 border border-stone-200/70 text-xs text-stone-700 animate-fadeIn font-sans mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1.5 font-semibold text-xs text-stone-800">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 stroke-[1.5]" />
                                  <span>Context & Nuance</span>
                                </span>
                                <button
                                  onClick={() => toggleMessageSection(msg.id, 'tip')}
                                  className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
                                >
                                  Collapse
                                </button>
                              </div>
                              <p className="mt-1 text-xs text-stone-600 font-normal leading-relaxed">{msg.learning_tip}</p>
                            </div>
                          )}

                        </div>

                      {/* Timestamp at bottom outer right of bubble */}
                      <span className="text-[10px] text-stone-400 font-sans select-none shrink-0 self-end pb-0.5">
                        {formatKakaoMessageTime(msg.timestamp)}
                      </span>
                    </div>

                  </div>
                )}

              </div>
              )}
            </React.Fragment>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 italic px-4 py-2 bg-white/80 backdrop-blur-xs rounded-2xl w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>답장 작성 중...</span>
          </div>
        )}

        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* CHAT INPUT BAR (Floating White Capsule on Transparent Background) */}
      <div className="bg-transparent px-3 py-2.5 sm:px-4 sm:py-3 shrink-0 border-0">
        
        {/* Selected Image Preview Thumbnail */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Selected preview" className="w-16 h-16 object-cover rounded-xl border border-stone-200 shadow-xs" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="bg-white shadow-sm rounded-2xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 border border-black/[0.04]">
          
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
            className="p-2 sm:p-2.5 rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-700 transition-colors shrink-0 cursor-pointer"
            title="Send Photo"
          >
            <ImageIcon className="w-5 h-5 text-stone-400" />
          </button>

          {/* Text Input Field - Clean capsule style */}
          <input
            ref={textInputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder=""
            className="flex-1 px-2.5 py-1.5 bg-transparent border-0 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:outline-none focus:ring-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
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
              {/* ASSISTANT MESSAGE ACTIONS */}
              {activeContextMenuMsg.role === 'assistant' && (
                <>
                  {/* Unsatisfied Recall / Re-adjust Response */}
                  <button
                    onClick={() => {
                      const target = activeContextMenuMsg;
                      setActiveContextMenuMsg(null);
                      setSelectedToneHint('');
                      setCustomFeedbackText('');
                      setUnsatisfactoryModalMsg(target);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50 rounded-xl flex items-center gap-2.5 text-xs text-rose-600 font-medium transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-rose-500 stroke-[1.5]" />
                    <span>不满意撤回 / 调整回答</span>
                  </button>

                  {/* Quick Shortcut: Recall & Re-edit Prompt */}
                  <button
                    onClick={() => {
                      handleRetractUnsatisfactoryResponse(activeContextMenuMsg.id, 'edit_prompt');
                      setActiveContextMenuMsg(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-800 font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-500 stroke-[1.5]" />
                    <span>撤回并重新编辑提问</span>
                  </button>

                  {/* Regenerate this Response */}
                  <button
                    onClick={() => {
                      handleRegenerateMessage(activeContextMenuMsg.id);
                      setActiveContextMenuMsg(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-500 stroke-[1.5]" />
                    <span>重新生成此回答</span>
                  </button>

                  {/* Bookmark Sentence */}
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
                </>
              )}

              {/* USER MESSAGE ACTIONS */}
              {activeContextMenuMsg.role === 'user' && !activeContextMenuMsg.isRecalled && (
                <>
                  {/* Recall & Return to Input Box */}
                  <button
                    onClick={() => {
                      handleRecallUserMessage(activeContextMenuMsg.id, true);
                      setActiveContextMenuMsg(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50 rounded-xl flex items-center gap-2.5 text-xs text-rose-600 font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-rose-500 stroke-[1.5]" />
                    <span>撤回并重新编辑提问</span>
                  </button>

                  {/* Recall only */}
                  <button
                    onClick={() => {
                      handleRecallUserMessage(activeContextMenuMsg.id, false);
                      setActiveContextMenuMsg(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-600 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-500 stroke-[1.5]" />
                    <span>仅撤回此条消息</span>
                  </button>
                </>
              )}

              {/* Pin to Memory Toggle */}
              <button
                onClick={() => {
                  handleTogglePinMemory(activeContextMenuMsg.id);
                  setActiveContextMenuMsg(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-stone-50 rounded-xl flex items-center gap-2.5 text-xs text-stone-800 font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400 stroke-[1.5]" />
                <span>{activeContextMenuMsg.isPinned || activeContextMenuMsg.isMemory ? '取消核心记忆' : '设为核心记忆'}</span>
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
            </div>
          </div>
        </div>
      )}

      {/* Unsatisfactory Response Recall & Revise Modal */}
      {unsatisfactoryModalMsg && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setUnsatisfactoryModalMsg(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-stone-200/90 p-4 sm:p-5 max-w-sm sm:max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">不满意此回答？撤回与调整</h3>
                  <p className="text-[11px] text-stone-500">选择您希望的处理方式</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnsatisfactoryModalMsg(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Answer Quote Preview */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">待撤回的回答</div>
              <p className="text-stone-800 line-clamp-2 font-medium">
                {(unsatisfactoryModalMsg.korean || unsatisfactoryModalMsg.content || '')
                  .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, '')
                  .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, '')
                  .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, '')
                  .trim()}
              </p>
              {unsatisfactoryModalMsg.translation_zh && (
                <p className="text-stone-500 text-[11px] line-clamp-1">
                  {unsatisfactoryModalMsg.translation_zh}
                </p>
              )}
            </div>

            {/* Quick Adjustment Tone Presets for Regeneration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  若重新作答，希望调整的风格：
                </span>
                {selectedToneHint && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedToneHint('')} 
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    清除
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '更口语自然',
                  '更温柔体贴',
                  '更简明扼要',
                  '更傲娇反差',
                  '多点生词解析',
                  '加点日常生活感'
                ].map((tone) => {
                  const isSelected = selectedToneHint === tone;
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedToneHint(isSelected ? '' : tone)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-stone-900 text-white font-medium shadow-xs' 
                          : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                      }`}
                    >
                      {tone}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Core Action Choices */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Retract and re-edit prompt in input box */}
              <button
                type="button"
                onClick={() => {
                  handleRetractUnsatisfactoryResponse(unsatisfactoryModalMsg.id, 'edit_prompt');
                  setUnsatisfactoryModalMsg(null);
                }}
                className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left flex items-start gap-2.5 transition-all group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-rose-950 flex items-center justify-between">
                    <span>撤回并重新编辑我的提问</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-200/70 text-rose-800 font-medium">推荐</span>
                  </div>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">
                    撤销此回答，并将上一句提问自动放回输入框，方便微调重发
                  </p>
                </div>
              </button>

              {/* Option 2: Retract and regenerate with tone hint */}
              <button
                type="button"
                onClick={() => {
                  handleRetractUnsatisfactoryResponse(
                    unsatisfactoryModalMsg.id, 
                    'regenerate', 
                    selectedToneHint || customFeedbackText
                  );
                  setUnsatisfactoryModalMsg(null);
                }}
                className="w-full p-2.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-left flex items-start gap-2.5 transition-all group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-900">
                    撤回并重新作答
                    {selectedToneHint && <span className="text-stone-500 font-normal ml-1">（{selectedToneHint}）</span>}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    撤销原回答，由伙伴按照指定语气偏好重新给出新回答
                  </p>
                </div>
              </button>

              {/* Option 3: Delete this assistant response completely */}
              <button
                type="button"
                onClick={() => {
                  handleRetractUnsatisfactoryResponse(unsatisfactoryModalMsg.id, 'delete');
                  setUnsatisfactoryModalMsg(null);
                }}
                className="w-full p-2.5 rounded-xl border border-stone-200/80 hover:border-stone-300 bg-white hover:bg-stone-50 text-left flex items-start gap-2.5 transition-all group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-stone-100 text-stone-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4 text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-700">仅撤回删除此条回答</div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    从当前对话历史中彻底移除该条不满意回答
                  </p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUnsatisfactoryModalMsg(null)}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium transition-colors cursor-pointer"
              >
                取消
              </button>
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
