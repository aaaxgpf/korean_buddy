import { VocabItem } from '../types';
import { WordItem } from '../types/lexicon';
import { sanitizeVocabItem } from '../utils/koreanDictionary';
import kpopFandomData from './lexicon/kpop_fandom.json';
import dailyConversationData from './lexicon/daily_conversation.json';
import mzSlangData from './lexicon/mz_slang.json';

// Helper to convert WordItem to VocabItem
export function convertWordItemToVocabItem(item: WordItem): VocabItem {
  const categoryMap: Record<string, { category: string; level: string }> = {
    KPOP_FANDOM: { category: 'K-POP 饭圈', level: 'K-pop' },
    DAILY_CONVERSATION: { category: '日常口语', level: 'Daily' },
    MZ_SLANG: { category: '实时热词', level: 'Slang' },
    TOPIK_1_2: { category: '日常口语', level: 'Daily' },
    TOPIK_3_4: { category: '中级精选', level: 'Intermediate' },
    TOPIK_5_6: { category: '高级精选', level: 'Advanced' },
    YONSEI_SEOUL: { category: '日常口语', level: 'Daily' },
  };

  const meta = categoryMap[item.category] || { category: '日常口语', level: 'Daily' };

  return sanitizeVocabItem({
    id: item.id,
    word: item.word,
    hangul: item.word,
    hanja_or_root: item.hanja_or_origin,
    type: item.pos,
    meaning_zh: item.definition_zh,
    meaning_en: '',
    category: meta.category,
    level: meta.level,
    source: meta.category,
    origin: item.hanja_or_origin,
    full_form: item.hanja_or_origin,
    social_nuance: item.safety_level === 'CASUAL_FRIENDS' ? '仅限同辈亲友平语，对长辈/职场禁用' : '全场景通用表达',
    example_kr: item.example_kr,
    example_zh: item.example_zh,
    mastered: item.mastered ? 'mastered' : 'new',
    isBookmarked: false,
  });
}

// Built-in Lexicon Words: K-Pop Fandom + Daily Conversation + MZ Trending Slang
export const ALL_LEXICON_WORDS: WordItem[] = [
  ...(kpopFandomData as WordItem[]),
  ...(dailyConversationData as WordItem[]),
  ...(mzSlangData as WordItem[]),
];

export const INITIAL_VOCABULARY: VocabItem[] = ALL_LEXICON_WORDS.map(convertWordItemToVocabItem);

export {
  kpopFandomData,
  dailyConversationData,
  mzSlangData,
};
