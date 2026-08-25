export interface ToastItem {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface VoiceSlotConfig {
  voice_id: string;
  speed: number;
  pitch: number;
  emotion: string;
}

export interface MiniMaxConfig {
  group_id: string;
  api_key: string;
  model: string;
  voice_slots: Record<string, VoiceSlotConfig>;
}

export interface Companion {
  id: string;
  name_ko: string;
  name_kr?: string;
  name_zh: string;
  name_en: string;
  group?: string;
  birth?: string;
  role?: string;
  personality_traits?: string[];
  tone_style?: string;
  system_prompt?: string;
  avatar: string;
  avatar_bg?: string;
  color?: string;
  badge?: string;
  mbti?: string;
  status_msg?: string;
  voice_desc?: string;
  base_idol_profile?: string;
  persona?: string;
  tone?: string;
  relationship?: string;
  userNickname?: string;
  intro_kr?: string;
  intro_zh?: string;
  intro_en?: string;
  voice_slot?: string;
  tts_pitch?: number;
  tts_rate?: number;
  remark?: string;
  customAvatarUrl?: string;
  customScenario?: string;
  customNotes?: string;
  // Reply & Proactive Behavior Settings
  reply_behavior?: 'instant' | 'random_delay' | 'read_no_reply' | 'busy_schedule'; // 自动回复行为模式
  read_delay_seconds?: number; // 几秒后显示已读(1消失)
  reply_delay_seconds?: number; // 几秒后发送回复
  no_reply_prob?: number; // 已读不回概率 (0-100%)
  allow_proactive?: boolean; // 是否允许该角色日常主动发消息
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
  korean?: string;
  translation_zh?: string;
  translation_en?: string;
  vocabulary?: VocabItem[];
  grammar_points?: GrammarPointItem[];
  learning_tip?: string;
  isBookmarked?: boolean;
  isPinned?: boolean;
  isMemory?: boolean;
  isRead?: boolean;
  [key: string]: any;
}

export interface VocabItem {
  id: string;
  word: string;
  hangul: string;
  hanja_or_root?: string;
  romanization?: string;
  type?: string;
  meaning_zh: string;
  meaning_en?: string;
  category?: string;
  level?: string;
  source?: string;
  example_kr?: string;
  example_zh?: string;
  mastery?: 'new' | 'learning' | 'mastered';
  isBookmarked?: boolean;
  savedAt?: number;
  origin?: string; // For MZ slang (유래/어원)
  full_form?: string; // For MZ slang (원래 표현)
  social_nuance?: string; // For MZ slang (使用语境/避坑指南)
  [key: string]: any;
}

export interface GrammarPointItem {
  pattern?: string;
  title_zh?: string;
  title_en?: string;
  explanation_zh?: string;
  explanation_en?: string;
  example_ko?: string;
  example_zh?: string;
  [key: string]: any;
}

export interface GrammarAnalysisResult {
  breakdown: string;
  explanation: string;
  points?: string[];
  suggestions?: string;
  [key: string]: any;
}

export interface SpeakingEvaluation {
  score: number;
  accuracy: number;
  fluency: number;
  feedback: string;
  pronunciation_tips?: string[];
  [key: string]: any;
}

export interface GrammarCard {
  id: string;
  pattern?: string;
  title?: string;
  title_zh?: string;
  title_en?: string;
  level?: string;
  category?: string;
  description?: string;
  explanation_zh?: string;
  explanation_en?: string;
  formation?: string;
  formula?: string;
  examples?: { ko: string; zh?: string; en?: string }[];
  common_mistakes?: string;
  isBookmarked?: boolean;
  [key: string]: any;
}

export interface DictationItem {
  id: string;
  korean: string;
  translation_zh: string;
  translation_en?: string;
  audioUrl?: string;
  grammar_focus?: string;
  difficulty?: string;
  [key: string]: any;
}

export interface SpeakingTask {
  id: string;
  title?: string;
  title_en?: string;
  scenario?: string;
  scenario_zh?: string;
  scenario_en?: string;
  target_phrase?: string;
  target_korean?: string;
  romanization?: string;
  translation_zh: string;
  translation_en?: string;
  key_grammar?: string;
  cultural_note?: string;
  difficulty?: string;
  category?: string;
  [key: string]: any;
}

export interface CompanionSparkRecord {
  companionId: string;
  sparkCount?: number;
  sparkLevel?: 'spark' | 'flame' | 'super_flame' | 'legendary' | string;
  lastIgnited?: number;
  streakDays: number;
  lastInteractionDate: string;
  isIgnitedToday: boolean;
  totalInteractions: number;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
}

export interface AppSettings {
  theme: 'default' | 'kkt' | 'wechat';
  dailyVocabGoal: number;
  languageMode: 'bilingual' | 'zh' | 'en';
  proactiveMessagesEnabled?: boolean;
  api_config?: LLMConfig;
  minimax_config?: MiniMaxConfig;
}

export interface UserProfile {
  name: string;
  status: string;
  avatar: string;
  avatarUrl?: string;
  userName?: string;
  userCallSign?: string;
}

export interface StudyPlanDay {
  day: number;
  theme: string;
  goal: string;
  vocab_count: number;
  grammar_count: number;
  stage1_warmup: Array<{
    question: string;
    answer: string;
    hint: string;
  }>;
  stage2_vocab: VocabItem[];
  stage3_active_recall: Array<{
    prompt_zh: string;
    target_kr: string;
    hint: string;
  }>;
}

export interface StudyPlan {
  id: string;
  title: string;
  targetLevel: string;
  totalDays: number;
  currentDay: number;
  createdAt: number;
  days: StudyPlanDay[];
}

export interface CustomLexiconBook {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: 'pdf' | 'json' | 'csv' | 'txt' | 'preset';
  fileSize?: number;
  totalWords: number;
  importedAt: number;
  category: string;
  words: VocabItem[];
  expandedCount?: number;
}

export interface AISeedExpansionResult {
  bookTitle: string;
  seedWords: string[];
  expandedItems: VocabItem[];
  activeRecallQuestions?: Array<{
    prompt_zh: string;
    target_kr: string;
    hint: string;
  }>;
  warmupQuestions?: Array<{
    question: string;
    answer: string;
    hint: string;
  }>;
}

