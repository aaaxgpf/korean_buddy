import { VocabItem } from '../types';
import { WordItem } from '../types/lexicon';
import topikBeginnerData from './lexicon/topik_beginner.json';
import topikIntermediateData from './lexicon/topik_intermediate.json';
import topikAdvancedData from './lexicon/topik_advanced.json';
import yonseiSeoulData from './lexicon/yonsei_seoul.json';
import kpopFandomData from './lexicon/kpop_fandom.json';
import mzSlangData from './lexicon/mz_slang.json';

// Helper to convert WordItem to VocabItem
export function convertWordItemToVocabItem(item: WordItem): VocabItem {
  const categoryMap: Record<string, { category: string; level: string }> = {
    TOPIK_1_2: { category: 'TOPIK 1-2 初级', level: 'TOPIK 1-2' },
    TOPIK_3_4: { category: 'TOPIK 3-4 中级', level: 'TOPIK 3-4' },
    TOPIK_5_6: { category: 'TOPIK 5-6 高级', level: 'TOPIK 5-6' },
    YONSEI_SEOUL: { category: '延世·首尔大', level: 'Yonsei/SNU' },
    KPOP_FANDOM: { category: 'K-POP & 饭圈', level: 'K-pop' },
    MZ_SLANG: { category: 'MZ 流行语', level: 'Daily' },
  };

  const meta = categoryMap[item.category] || { category: 'Core Vocab', level: 'General' };

  return {
    id: item.id,
    word: item.word,
    hangul: item.word,
    hanja_or_root: item.hanja_or_origin,
    type: item.pos,
    meaning_zh: item.definition_zh,
    meaning_en: '',
    category: meta.category,
    level: meta.level,
    source: item.category,
    origin: item.hanja_or_origin,
    full_form: item.hanja_or_origin,
    social_nuance: item.safety_level === 'CASUAL_FRIENDS' ? '仅限同辈亲友平语，对长辈/职场禁用' : '全场景通用表达',
    example_kr: item.example_kr,
    example_zh: item.example_zh,
    mastered: item.mastered ? 'mastered' : 'new',
    isBookmarked: false,
  };
}

export const ALL_LEXICON_WORDS: WordItem[] = [
  ...(kpopFandomData as WordItem[]),
  ...(mzSlangData as WordItem[]),
  ...(topikBeginnerData as WordItem[]),
  ...(topikIntermediateData as WordItem[]),
  ...(topikAdvancedData as WordItem[]),
  ...(yonseiSeoulData as WordItem[]),
];

export const INITIAL_VOCABULARY: VocabItem[] = ALL_LEXICON_WORDS.map(convertWordItemToVocabItem);

export {
  topikBeginnerData,
  topikIntermediateData,
  topikAdvancedData,
  yonseiSeoulData,
  kpopFandomData,
  mzSlangData,
};
